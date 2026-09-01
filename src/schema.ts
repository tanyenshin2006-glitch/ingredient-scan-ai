import { z } from 'zod';

const SeverityEnum = z.enum(['safe', 'note', 'avoid']);
const BioavailabilityEnum = z.enum(['low', 'medium', 'high', 'na'])

export const AnalysisSchema = z.object({
    overall_severity: SeverityEnum,
    warnings: z.array(z.string()),
    ingredient_notes: z.array(z.object({
        ingredient: z.string(),
        purpose: z.string(),
        description: z.string(),
        severity: SeverityEnum,
        is_common_allergen: z.boolean(),
        category: z.string().nullable(),
        bioavailability: BioavailabilityEnum.nullable(),
        bioavailability_notes: z.string().nullable(),
        safety_notes: z.string().nullable(),
        suggestion: z.string().nullable(),
    })),
    analysis: z.string(),
});

export type Analysis = z.infer<typeof AnalysisSchema>;


export const ExtractSchema = z.object({
    ingredients_text: z.string(),
});

export type Extract = z.infer<typeof ExtractSchema>;

