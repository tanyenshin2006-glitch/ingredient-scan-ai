import { z } from 'zod';

function cleanJson(reply: string) {
    return reply.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
}

export async function callWithSelfHealing<T>(
    callModel : (correctionNote?: string) => Promise<string>,
    schema: z.ZodSchema<T>,
    maxAttempts = 2
) : Promise<T> {
    let correctionNote: string | undefined;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const reply = await callModel(correctionNote);
        try {
            const cleaned = cleanJson(reply);
            const parsed = JSON.parse(cleaned);
            return schema.parse(parsed);
        } catch (error) {
            console.error(`[Self-heal] Attempt ${attempt}/${maxAttempts} failed:`, error)
            if (attempt === maxAttempts) throw error;
            correctionNote = error instanceof z.ZodError
                ?  `Your previous response was invalid: ${error.message}. Please respond again with ONLY valid JSON matching the required schema.`
                : `Your previous response was not valid JSON. Please respond again with ONLY valid JSON, no extra text.`;
        }
    }
    throw new Error('Unreachable');
}