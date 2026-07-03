import express from 'express';
import Anthropic from "@anthropic-ai/sdk";
import 'dotenv/config';
import { VoyageAIClient } from 'voyageai';

const app = express();
const port = 3001;
const AnthropicClient = new Anthropic();
const VoyageClient= new VoyageAIClient( {apiKey: process.env.VOYAGE_API_KEY });

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.post('/api/analyse-ingredients', async (req, res) => {

  //Extract ingredients
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  try {
    const message = await AnthropicClient.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: `Here is raw OCR text extracted from a food/supplement product label. It may contain ingredients mixed together with unrelated sections like nutrition facts, storage instructions, directions of use, and manufacturer info, and may have OCR typos.

          Raw text:
          "${text}"

          Your task:
          1. Find ONLY the actual ingredients list (usually appears after a heading like "INGREDIENTS" or similar).
          2. IGNORE everything else - nutrition facts tables, storage conditions, directions of use, manufacturer details, barcodes.
          3. Correct obvious OCR typos in ingredient names (e.g., "EnythritoL" -> "Erythritol").
          4. If the text has both English and another language, use the English version. If the text is ENTIRELY in a non-English language (no English present), translate the ingredients into English.

          Respond with ONLY valid JSON in this exact shape, no other text:
          {"ingredients_text": "<cleaned, comma-separated ingredient list only>", "allergens": ["<allergen1>", ...], "warnings": ["<any concerning additives or notes>", ...]}`
        }
      ]
    });

    const block = message.content[0];
    const reply = block?.type === 'text' ? block.text : '';
    const analysis = JSON.parse(reply);
    res.json(analysis)

    //Convert ingredients to vector
    if (!analysis.ingredient_text) {
      return res.status(400).json({ error: 'No ingredients found in text' });
    }

    const ingredients = analysis.ingredients_text.split(',').map((i: string) => i.trim());

    for (const ingredient of ingredients) {
      const response = await VoyageClient.embed({
        input:[ingredient],
        model:  'voyage-3-lite'
      });

      const embedding = response.data?.[0]?.embedding;
      if (!embedding) {
        console.error(`Failed to get embedding for ${ingredient}`);
        continue;
      }
    }

  } catch (error) {
    console.error('Claude analysis failed:', error);
    res.status(500).json({ error: 'Failed to analyse ingredients' })
  }
});

app.listen(port, () => {
  console.log(`AI Service running on port ${port}`);
});
