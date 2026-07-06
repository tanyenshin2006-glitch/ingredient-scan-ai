import OpenAI from 'openai';
import { BaseLlm } from '@google/adk';
import type { LlmRequest, LlmResponse, BaseLlmConnection } from '@google/adk';
import { FinishReason } from '@google/genai';
import type { Content } from '@google/genai';

function extractText(content: Content | string | undefined): string {
  if (!content) return '';
  if (typeof content === 'string') return content;
  return (content.parts ?? []).map((part) => part.text ?? '').join('\n');
}

export class OpenAiLlm extends BaseLlm {
  static readonly supportedModels = [/^gpt-.*/, /^chatgpt-.*/, /^o[0-9].*/];

  private client: OpenAI;

  constructor({ model }: { model: string }) {
    super({ model });
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable must be set.');
    }
    this.client = new OpenAI({ apiKey });
  }

  async *generateContentAsync(
    llmRequest: LlmRequest,
    stream = false,
  ): AsyncGenerator<LlmResponse, void> {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

    console.log('[OpenAiLlm] raw contents:', JSON.stringify(llmRequest.contents).substring(0, 800));

    const systemInstruction = extractText(llmRequest.config?.systemInstruction as Content | string);
    if (systemInstruction) {
      messages.push({ role: 'system', content: systemInstruction });
    }

    for (const content of llmRequest.contents) {
      const text = extractText(content);
      if (!text) continue;
      messages.push({
        role: content.role === 'model' ? 'assistant' : 'user',
        content: text,
      });
    }

    console.log('[OpenAiLlm] messages sent:', JSON.stringify(messages).substring(0, 800));

    try {
      const completion = await this.client.chat.completions.create({
        model: llmRequest.model ?? this.model,
        messages,
        temperature: 0,
        stream: false,
      });

      const text = completion.choices[0]?.message?.content ?? '';
      yield {
        content: { role: 'model', parts: [{ text }] },
        finishReason: completion.choices[0]?.finish_reason === 'stop' ? FinishReason.STOP : undefined,
      };
    } catch (error) {
      if (error instanceof OpenAI.APIError) {
        throw new Error(
          JSON.stringify({ error: { code: error.status, message: error.message } }),
        );
      }
      throw error;
    }
  }

  async connect(): Promise<BaseLlmConnection> {
    throw new Error('Live connections are not supported for OpenAI models.');
  }
}
