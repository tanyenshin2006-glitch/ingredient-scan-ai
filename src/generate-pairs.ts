//generate training pairs to training_pairs.jsonl
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { chat } from './ollama.js';

interface Ingredient {
  name: string;
  category: string;
}

interface TrainingPair {
  query: string;
  pos: string[];
  neg: string[];
}

const SYNONYM_PROMPT = (name: string) =>
  `You are a supplement and food labelling expert. Give me 5 label variations for the ingredient "${name}" that might appear on real product labels.

Include any of:
- Common or consumer names (e.g. "Vitamin B1" for Thiamine)
- E-numbers if applicable (e.g. "E101" for Riboflavin)
- Brand names if well known (e.g. "KSM-66" for Ashwagandha Extract)
- Salt or chemical forms (e.g. "Thiamine HCl" for Thiamine)
- Abbreviations (e.g. "Vit B1")
- Alternative spellings

Return ONLY valid JSON, no other text:
{"variations": ["variation1", "variation2", "variation3", "variation4", "variation5"]}`;

async function getSynonyms(name: string): Promise<string[]> {
  try {
    const response = await chat('qwen2.5:7b', '', SYNONYM_PROMPT(name));
    const match = response.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON found in response');
    const json = JSON.parse(match[0]);
    return json.variations ?? [];
  } catch {
    console.error(`Failed to get synonyms for: ${name}`);
    return [];
  }
}

async function validateSynonym(synonym: string, ingredient: string): Promise<boolean> {
  try {
    const prompt = `Is "${synonym}" a real label variation or synonym for the ingredient "${ingredient}" that might appear on a supplement or food product label? Answer YES or NO only.`;
    const response = await chat('qwen2.5:7b', '', prompt);
    return response.trim().toUpperCase().startsWith('YES');
  } catch {
    return false;
  }
}

async function generatePairs() {
  const { data: ingredients }: { data: Ingredient[] } = await axios.get(
    `${process.env.BE_SERVICE_URL}/api/ingredients`,
    { headers: { 'x-api-key': process.env.INTERNAL_API_KEY } }
  );

  console.log(`Fetched ${ingredients.length} ingredients from DB`);

  // group by category for hard negatives
  const byCategory: Record<string, string[]> = {};
  for (const ing of ingredients) {
    if (!byCategory[ing.category]) byCategory[ing.category] = [];
    byCategory[ing.category].push(ing.name);
  }

  const outPath = path.resolve('data/training_pairs.jsonl');

  // read existing pos names to skip already-processed ingredients
  const existing = new Set<string>();
  if (fs.existsSync(outPath)) {
    for (const line of fs.readFileSync(outPath, 'utf-8').split('\n').filter(Boolean)) {
      try { existing.add(JSON.parse(line).pos[0]); } catch {}
    }
  }
  console.log(`Skipping ${existing.size} already-processed ingredients`);

  let totalPairs = 0;

  for (const ing of ingredients) {
    if (existing.has(ing.name)) {
      console.log(`  skip: ${ing.name}`);
      continue;
    }
    const synonyms = await getSynonyms(ing.name);

    // pick up to 2 hard negatives from same category
    const sameCategory = (byCategory[ing.category] ?? []).filter(n => n !== ing.name);
    const negatives = sameCategory.sort(() => 0.5 - Math.random()).slice(0, 2);

    for (const synonym of synonyms) {
      const valid = synonym.toLowerCase() === ing.name.toLowerCase() || await validateSynonym(synonym, ing.name);
      if (!valid) {
        console.log(`  ✗ rejected: "${synonym}" for ${ing.name}`);
        continue;
      }
      const pair: TrainingPair = {
        query: synonym,
        pos: [ing.name],
        neg: negatives,
      };
      fs.appendFileSync(outPath, JSON.stringify(pair) + '\n');
      totalPairs++;
    }

    console.log(`[${totalPairs} pairs] ${ing.name} → ${synonyms.length} synonyms`);
  }

  console.log(`\nDone — ${totalPairs} pairs saved to data/training_pairs.jsonl`);
}

generatePairs().catch(console.error);
