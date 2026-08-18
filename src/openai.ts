import OpenAI from 'openai';

let client: OpenAI;

function getClient() {
  if (!client) client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return client;
}

export async function chatGPT(system: string, user: string, model = 'gpt-4o'): Promise<string> {
  const response = await getClient().chat.completions.create({
    model,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user }
    ],
    temperature: 0.1
  });
  return response.choices[0].message.content ?? '';
}
