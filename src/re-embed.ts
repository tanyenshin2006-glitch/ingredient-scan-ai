import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import axios from 'axios';
import { embed } from './ollama.js';

//To re-embed the vector in DB after fine tuned BGE-M3 model

async function reEmbed() {
    const {data} = await axios.get(
        `${process.env.BE_SERVICE_URL}/api/ingredients`,
        { headers: { 'x-api-key': process.env.INTERNAL_API_KEY } }
    );

    console.log(`Found ${data.length} ingredients to re-embed`)

    for (const ingredient of data) {
        try{
            const embedding = await embed(ingredient.name);
            await axios.patch(
                `${process.env.BE_SERVICE_URL}/api/ingredients/${encodeURIComponent(ingredient.name)}/embedding`,
                {embedding},
                { headers: { 'x-api-key': process.env.INTERNAL_API_KEY } }
            );
            console.log(`Re-embedded: ${ingredient.name}`);
        } catch (error) {
            console.error(`Failed: ${ingredient.name}`, error);
        }
    }
    console.log('Done — all vectors updated');
}

reEmbed().catch(console.error);