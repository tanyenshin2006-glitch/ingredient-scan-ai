import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import axios from 'axios'

const ingredientNames = [
  'Niacin'
];

async function seed() {
  let succeeded = 0;
  let failed = 0;

  for (const name of ingredientNames) {
    try{
      await axios.post(
        `${process.env.AI_SERVICE_URL}/api/generate-ingredient`,
        {name},
        {headers: {'x-api-key': process.env.INTERNAL_API_KEY}}
      );
      console.log(`Generated (pending review): ${name}`);
      succeeded++;
    } catch (error) {
      console.log(`Failed to generate: ${name}`, error)
      failed++;
    }
  }
  console.log(`Seeding complete — ${succeeded} succeeded, ${failed} failed. Check /api/ingredients/pending to review`);
}

seed().catch(console.error);
