import Anthropic from '@anthropic-ai/sdk'

let client: Anthropic;

function getClient() {
    if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    return client;
}

export async function chatClaude(system: string, user: string, model='claude-opus-5') : Promise<string>{
    const response = await getClient().messages.create({
        model,
        max_tokens: 1024,
        system,
        messages: [{ role: 'user', content: user }],
    });

  const textBlock = response.content.find((block) => block.type === 'text');
  return textBlock?.type === 'text' ? textBlock.text : '';
}