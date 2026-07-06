import express from 'express';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: true });
import { ingredientExtractAgent, ingredientAnalysisAgent } from './agent.js';
import { Runner, InMemorySessionService, isFinalResponse } from '@google/adk';
import {GoogleGenAI} from '@google/genai';
import axios from 'axios';

const app = express();
app.use(express.json());
const port = 3001;

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY!,
  apiVersion: 'v1'
});

const sessionService = new InMemorySessionService();

const runner = new Runner({
  appName: 'ingredient-scan',
  agent: ingredientExtractAgent,
  sessionService,
});

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.post('/api/analyse-ingredients', async (req, res) => {

  // Pass 1: Gemini via ADK — extract clean ingredient list.
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  try {
    const events = runner.runEphemeral({
      userId: 'system',
      newMessage: { role: 'user', parts: [{ text }] },
    });

    let reply = '';
    let eventCount = 0;
    for await (const event of events) {
      eventCount++;
      console.log(`[ADK event #${eventCount}]:`, JSON.stringify(event).substring(0, 400));
      if (isFinalResponse(event)) {
        reply = event.content?.parts?.[0]?.text ?? '';
        break;
      }
    }
    console.log(`[ADK] total events: ${eventCount}, reply: ${reply.substring(0, 1000)}`);

    if (!reply) {
      return res.status(500).json({ error: 'ADK returned no response — check model name or API key access' });
    }

    const extracted = JSON.parse(reply);
    if (!extracted.ingredients_text) {
      return res.status(400).json({ error: 'No ingredients found in text' });
    }

    const ingredients = extracted.ingredients_text.split(',').map((i: string) => i.trim());

    //Pass 2: Gemini converts ingredient into vector.
    const dbMatches: { ingredient: string; matches: object[] }[] = [];
    for (const ingredient of ingredients) {
      const embedResponse = await ai.models.embedContent({
        model: 'gemini-embedding-2', 
        contents: ingredient,
        config: {
          outputDimensionality: 768 
        }
      });

      const embedding = embedResponse.embeddings?.[0]?.values;

      if (!embedding) {
        return res.status(500).json({ error: `Failed to embed ingredient: ${ingredient}` });
      }

      //Pass 3: Search similar vector in DB.
      const searchResponse = await axios.post(
        `${process.env.BE_SERVICE_URL}/api/ingredients/search`,
        {embedding, limit:3, maxDistance:0.55},
        {headers: { 'x-api-key': process.env.INTERNAL_API_KEY }}
      )
      console.log(`[Pass 3] matches for "${ingredient}":`, searchResponse.data);
      dbMatches.push({ ingredient, matches: searchResponse.data });
    }

    //Pass 4: Ingredient analysis.
    const analysisRunner = new Runner({
      appName: 'ingredient-scan',
      agent: ingredientAnalysisAgent,
      sessionService,
    });

    const analysisEvents = analysisRunner.runEphemeral({
      userId: 'system',
      newMessage: { role: 'user', parts: [{ text: JSON.stringify({ ingredients: extracted.ingredients_text, db_matches: dbMatches }) }] },
    });

    let analysisReply = '';
    for await (const event of analysisEvents) {
      if (isFinalResponse(event)) {
        analysisReply = event.content?.parts?.[0]?.text ?? '';
        break;
      }
    }

    const finalAnalysis = JSON.parse(analysisReply);
    console.log('[Pass 4] final analysis:', finalAnalysis);

    res.json({
      ingredients: extracted.ingredients_text,
      db_matches: dbMatches,
      ...finalAnalysis,
    });
  } catch (error) {
    console.error('AI analysis failed:', error);
    res.status(500).json({ error: 'Failed to analyse ingredients' })
  }
});

app.listen(port, () => {
  console.log(`AI Service running on port ${port}`);
});
