import axios from 'axios';

const OLLAMA = process.env.OLLAMA_URL ?? 'http://localhost:11434'

//Pass 1
export async function chat(model: string, system: string, user: string, temperature: number = 0): Promise<string> {
  const res = await axios.post(`${OLLAMA}/api/chat`, {
    model,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user }
    ],
    options: {
      temperature: temperature
    },
    stream: false
  });
  return res.data.message.content;
}


//Pass 4
export async function embed(text: string): Promise<number[]> {
  const res = await axios.post(`${OLLAMA}/api/embeddings`, {
    model: 'bge-m3-ingredients',
    prompt: text
  });
  return res.data.embedding;
}