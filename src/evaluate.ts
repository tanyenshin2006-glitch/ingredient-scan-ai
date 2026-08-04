import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { embed } from './ollama.js';

interface TestCase {
  query: string;
  expected: string;
  acceptable?: string[];
}

interface SearchResult {
  name: string;
  description: string;
  safety_notes: string;
  is_common_allergen: boolean;
  distance: number;
}

interface ResultRow {
  query: string;
  expected: string;
  got: string;
  distance: number;
  pass: 'exact' | 'acceptable' | 'fail';
}

async function evaluate() {
  const testCases: TestCase[] = JSON.parse(
    fs.readFileSync(path.resolve('data/test-cases.json'), 'utf-8')
  );

  const results: ResultRow[] = [];
  let exact = 0;
  let acceptable = 0;
  let fail = 0;

  for (const tc of testCases) {
    const embedding = await embed(tc.query);

    const { data }: { data: SearchResult[] } = await axios.post(
      `${process.env.BE_SERVICE_URL}/api/ingredients/search`,
      { embedding, limit: 1 },
      { headers: { 'x-api-key': process.env.INTERNAL_API_KEY } }
    );

    const top = data[0];
    const got = top?.name ?? 'NO_RESULT';
    const distance = top?.distance ?? 1;

    let pass: ResultRow['pass'];
    if (got === tc.expected) {
      pass = 'exact';
      exact++;
    } else if (tc.acceptable?.includes(got)) {
      pass = 'acceptable';
      acceptable++;
    } else {
      pass = 'fail';
      fail++;
    }

    results.push({ query: tc.query, expected: tc.expected, got, distance, pass });
    console.log(`[${pass.toUpperCase().padEnd(10)}] "${tc.query}" → "${got}" (dist: ${distance.toFixed(4)})`);
  }

  const total = testCases.length;
  const summary = {
    date: new Date().toISOString(),
    total,
    exact,
    acceptable,
    fail,
    recall_exact: +(exact / total).toFixed(4),
    recall_acceptable: +((exact + acceptable) / total).toFixed(4),
    results,
  };

  const outDir = path.resolve('evaluation-result');
  const now = new Date();
  const ts = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}_${String(now.getHours()).padStart(2,'0')}-${String(now.getMinutes()).padStart(2,'0')}-${String(now.getSeconds()).padStart(2,'0')}`;
  const outPath = path.join(outDir, `baseline_${ts}.json`);
  fs.writeFileSync(outPath, JSON.stringify(summary, null, 2));

  console.log('\n--- SUMMARY ---');
  console.log(`Exact:      ${exact}/${total}  (${(summary.recall_exact * 100).toFixed(1)}%)`);
  console.log(`Acceptable: ${exact + acceptable}/${total}  (${(summary.recall_acceptable * 100).toFixed(1)}%)`);
  console.log(`Fail:       ${fail}/${total}`);
  console.log(`Saved → ${outPath}`);
}

evaluate().catch(console.error);
