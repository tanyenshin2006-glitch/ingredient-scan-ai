import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import axios from 'axios'
import {GoogleGenAI} from '@google/genai';

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY!,
  apiVersion: 'v1'
});

const ingredients = [
  {
    name: 'Vitamin C',
    description: 'Water-soluble vitamin found naturally in citrus fruits and vegetables',
    safety_notes: 'Generally safe, antioxidant, no known risks at normal dietary doses',
    is_common_allergen: false,
  }
];

async function seed() {
  for (const ingredient of ingredients){
    const text = `${ingredient.name}: ${ingredient.description}. ${ingredient.safety_notes}`;


    const response = await ai.models.embedContent({
      model: 'gemini-embedding-2', 
      contents: text,
      config: {
        outputDimensionality: 768 
      }
    });

    const embedding = response.embeddings?.[0]?.values;
    if (!embedding) {
      console.error(`Failed to get embedding for ${ingredient.name}`);
      continue;
    }

    await axios.post(`${process.env.BE_SERVICE_URL}/api/ingredients`, {
      ...ingredient,
      embedding
     }, {
      headers: { 'x-api-key': process.env.INTERNAL_API_KEY } 
     });

     console.log(`Saved ${ingredient.name}`);
  }
  console.log('Seeding complete')
}

seed().catch(console.error);