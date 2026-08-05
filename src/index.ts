import express from 'express';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: true });
import axios from 'axios';
import { chat, embed } from './ollama.js';
import { EXTRACT_PROMPT, ANALYSIS_PROMPT } from './prompts.js';
import { chatGPT } from './openai.js';

const app = express();
app.use(express.json());
const port = 3001;

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.post('/api/analyse-ingredients', async (req, res) => {

  try{
  
      // Pass 1: Gemini via ADK — extract clean ingredient list.
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const reply = await chat('qwen2.5:7b', EXTRACT_PROMPT, text, 0.1)

    console.log('[Pass 1] reply:', reply)

    const extracted = JSON.parse(reply)

    //Pass 2: BGE-m3 converts ingredient into vector.
    const ingredients = extracted.ingredients_text.split(',').map((i: string) => i.trim());
    const dbMatches: { ingredient: string; matches: object[] }[] = [];

    for (const ingredient of ingredients) {
      const embedding = await embed(ingredient)

      if (!embedding) {
        return res.status(500).json({ error: `Failed to embed ingredient: ${ingredient}` });
      }

    //Pass 3: Search similar vector in DB.
      const searchResponse = await axios.post(
        `${process.env.BE_SERVICE_URL}/api/ingredients/search`,
        {embedding, limit:3, maxDistance:0.9},
        {headers: { 'x-api-key': process.env.INTERNAL_API_KEY }}
      );
      console.log(`[Distance] ${ingredient}:`, searchResponse.data.map((m: any) => ({ name: m.name, distance: m.distance })));
      console.log(`[Pass 3] matches for "${ingredient}":`, searchResponse.data);
      dbMatches.push({ ingredient, matches: searchResponse.data });
    }

    //Pass 4: Ingredient analysis.
    const analysisInput = JSON.stringify({ ingredients: extracted.ingredients_text, db_matches: dbMatches });
    const analysisReply = await chatGPT(ANALYSIS_PROMPT, analysisInput);
    console.log('[Pass 4] reply:', analysisReply);

    const finalAnalysis = JSON.parse(analysisReply)

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
