import express from 'express';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: true });
import axios from 'axios';
import { chat, embed } from './ollama.js';
import { EXTRACT_PROMPT, ANALYSIS_PROMPT, SEED_GENERATION_PROMPT } from './prompts.js';
import { chatGPT } from './openai.js';
import { chatClaude } from './claude.js';
import { callWithSelfHealing } from './self-heal.js';
import { AnalysisSchema, ExtractSchema } from './schema.js';
import { verifyApiKey } from './middleware.js';

type DbMatch = { name: string; description: string; purpose: string; safety_notes: string; is_common_allergen: boolean; category: string; severity: string; bioavailability: string; bioavailability_notes: string; suggestion: string | null; distance: number };


const app = express();
app.use(express.json());
const port = 3001;

app.get('/', (req, res) => {
  res.send('Hello World!');
});

//Pass 1 to Pass 4
app.post('/api/analyse-ingredients', verifyApiKey, async (req, res) => {

  try{
  
      // Pass 1: Qwen — extract clean ingredient list.
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    if (text.length > 3000){
      return res.status(400).json({ error: 'Text exceeds maximum allowed length' })
    }

    let extracted;

    try {
      extracted = await callWithSelfHealing(
        (correctionNote) => chat('qwen2.5:7b', EXTRACT_PROMPT, correctionNote ? `${text}\n\n${correctionNote}` : text, 0.1),
        ExtractSchema
      );
      console.log('[Pass 1] Ollama succeeded');
    } catch (ollamaError) {
      console.error('[Pass 1] Ollama failed after retries, falling back to Claude Sonnet 5:', ollamaError);
      try{
        extracted = await callWithSelfHealing(
          (correctionNote) => chatClaude(EXTRACT_PROMPT, correctionNote ? `${text}\n\n${correctionNote}` : text, 'claude-sonnet-5'),
          ExtractSchema
        );
        console.log('[Pass 1] Claude fallback succeeded');
      } catch (claudeError) {
        console.error('[Pass 1] Both Ollama AND Claude failed after retries, falling back to GPT-4o:', claudeError);
        try{
          extracted = await callWithSelfHealing(
            (correctionNote) => chatGPT(EXTRACT_PROMPT, correctionNote ? `${text}\n\n${correctionNote}` : text),
            ExtractSchema
          );
          console.log('[Pass 1] GPT-4o fallback succeeded');
        } catch (gptError) {
          console.error('[Pass 1] All three providers failed after retries:', gptError);
          throw new Error('All extraction providers unavailable');
        }
      }
    }

    //Pass 2: BGE-m3 converts ingredient into vector.
    const ingredients = extracted.ingredients_text.split(',').map((i: string) => i.trim());
    const dbMatches: { ingredient: string; matches: DbMatch[] }[] = [];

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

    let finalAnalysis;

    try{
      finalAnalysis = await callWithSelfHealing(
        (correctionNote) => chatClaude(ANALYSIS_PROMPT, correctionNote ? `${analysisInput}\n\n${correctionNote}` : analysisInput, 'claude-sonnet-5'),
        AnalysisSchema
      );
      console.log('[Pass 4] Claude succeeded');
    } catch (claudeError) {
      console.error('[Pass 4] Claude failed, falling back to GPT-4o:', claudeError);
      try{
        finalAnalysis = await callWithSelfHealing(
          (correctionNote) => chatGPT(ANALYSIS_PROMPT, correctionNote ? `${analysisInput}\n\n${correctionNote}` : analysisInput),
          AnalysisSchema
        );
        console.log('[Pass 4] GPT-4o fallback succeeded');
      } catch (gptError) {
        console.error('[Pass 4] Both Claude AND GPT-4o failed after retries:', gptError);
        throw new Error('All AI providers unavailable for analysis');
      }
    }
    const matchedNotes = dbMatches
      .filter((dm) => dm.matches.length > 0 && dm.matches[0].distance < 0.15)
      .map((dm) => {
        const match = dm.matches[0];
        return {
          ingredient: dm.ingredient,
          purpose: match.purpose,
          description: match.description,
          severity: match.severity,
          is_common_allergen: match.is_common_allergen,
          category: match.category,
          bioavailability: match.bioavailability,
          bioavailability_notes: match.bioavailability_notes,
          safety_notes: match.safety_notes,
          suggestion: match.suggestion,
        };
      });

    const allIngredientNotes = [...matchedNotes, ...finalAnalysis.ingredient_notes];


    res.json({
      ingredients: extracted.ingredients_text,
      db_matches: dbMatches,
      ...finalAnalysis,
      ingredient_notes: allIngredientNotes,
    });

  } catch (error) {
    console.error('AI analysis failed:', error);
    res.status(500).json({ error: 'Failed to analyse ingredients' })
  }
});

//Generate ingredient data for seeding.
app.post('/api/generate-ingredient', verifyApiKey, async (req, res) =>{
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
