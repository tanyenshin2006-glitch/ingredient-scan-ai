import express from 'express';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: true });
import axios from 'axios';
import { chat, embed } from './ollama.js';
import { EXTRACT_PROMPT, ANALYSIS_PROMPT, SEED_GENERATION_PROMPT } from './prompts.js';
import { chatGPT } from './openai.js';
import { chatClaude } from './claude.js';

const app = express();
app.use(express.json());
const port = 3001;

app.get('/', (req, res) => {
  res.send('Hello World!');
});

//Pass 1 to Pass 4
app.post('/api/analyse-ingredients', async (req, res) => {

  try{
  
      // Pass 1: Qwen — extract clean ingredient list.
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    let reply;

    try {
    reply = await chat('qwen2.5:7b', EXTRACT_PROMPT, text, 0.1)
    } catch (ollamaError) {
      console.error('[Pass 1] Ollama failed, falling back to Claude Sonnet 5:', ollamaError);
      try{
      reply = await chatClaude(EXTRACT_PROMPT, text, 'claude-sonnet-5')
      } catch (claudeError) {
        console.error('[Pass 1] Both Ollama AND Claude failed, falling back to GPT-4o:', claudeError);
        try{
          reply = await chatGPT(EXTRACT_PROMPT, text)
        } catch (gptError) {
          console.error('[Pass 1] All three providers failed:', gptError);
          throw new Error('All extraction providers unavailable');
        }
      }
    }

    console.log('[Pass 1] reply:', reply)

    const cleanedExtract = reply.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    const extracted = JSON.parse(cleanedExtract)

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

    let analysisReply;

    try{
      analysisReply = await chatClaude(ANALYSIS_PROMPT, analysisInput, 'claude-sonnet-5');
      console.log('[Pass 4] reply:', analysisReply);
    } catch (claudeError) {
      console.error('[Pass 4] Claude failed, falling back to GPT-4o:', claudeError);
      try{
        analysisReply = await chatGPT(ANALYSIS_PROMPT, analysisInput)
        console.log('[Pass 4] reply (GPT-4o fallback):', analysisReply);
      } catch (gptError) {
        console.error('[Pass 4] Both Claude AND GPT-4o failed:', gptError);
        throw new Error('All AI providers unavailable for analysis');
      }
    }

    const cleanedReply = analysisReply.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    const finalAnalysis = JSON.parse(cleanedReply)

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

//Generate ingredient data for seeding.
app.post('/api/generate-ingredient', async (req, res) =>{
  try{
    const {name} = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Ingredient name is required'});
    }

    const reply = await chatClaude(SEED_GENERATION_PROMPT, name);
    const cleaned = reply.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    const generated = JSON.parse(cleaned)

    const embedding = await embed(generated.name);
    if (!embedding) {
      return res.status(500).json({ error: 'Failed to embed generated ingredient'});
    }

    await axios.post(
      `${process.env.BE_SERVICE_URL}/api/ingredients`,
      {...generated, embedding, status: 'pending_review'},
      {headers: { 'x-api-key': process.env.INTERNAL_API_KEY } }
    );

    res.json({...generated, status: 'pending_review' });
  } catch (error) {
    console.log('Ingredient generation failed:', error)
    res.status(500).json({ error: 'Failed to generate ingredient' })
  }
});

app.listen(port, () => {
  console.log(`AI Service running on port ${port}`);
});
