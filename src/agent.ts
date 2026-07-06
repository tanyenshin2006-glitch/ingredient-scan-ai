import {LlmAgent, LLMRegistry } from '@google/adk';
import { OpenAiLlm } from './openai_llm.js';

LLMRegistry.register(OpenAiLlm);

export const ingredientExtractAgent = new LlmAgent({
  name: 'ingredient_extract_agent',
  model: 'gpt-4o-mini',
  instruction: `You are an ingredient extraction expert. When given raw OCR text from a food or supplement product label:
    1. Find ONLY the actual ingredients list (usually after "INGREDIENTS" heading)
    2. Ignore everything else — nutrition facts, storage instructions, directions, manufacturer info
    3. Correct obvious OCR typos in ingredient names
    4. If both English and another language present, use English only. If entirely non-English, translate to English.
    
    Respond with ONLY valid JSON, no other text:
    {"ingredients_text": "<comma-separated ingredient list>"}`,
  tools: [],
});


export const ingredientAnalysisAgent = new LlmAgent({
  name: 'ingredient_analysis_agent',
  model: 'gpt-4o-mini',
  instruction: `You are a health and ingredient expert. You will be given:
  - "ingredients": the raw comma-separated ingredient list extracted from a product label.
  - "db_matches": for each ingredient, any matching record found in our internal ingredient database (name, description, safety_notes, is_common_allergen), or an empty "matches" array if nothing matched closely enough.

  For EACH ingredient:
  1. If it has a db_match, connect the label ingredient to that matched database entry by name.
  2. IMPORTANT — do not just repeat the database's description as-is. Check whether the label ingredient, as actually used in commercial products, is typically synthetic, fermented, or lab-manufactured, even if the database describes the general nutrient as "naturally occurring." Correct the framing when needed.
    Example: db_match is "Vitamin C: a water-soluble vitamin found naturally in citrus fruits and vegetables." The label ingredient is "Ascorbic Acid." The correct note is: "Ascorbic Acid is the chemical form of Vitamin C. Despite Vitamin C occurring naturally in citrus fruits, commercial Ascorbic Acid is almost always produced industrially via bacterial/fungal fermentation of glucose (or chemical synthesis), not extracted from real fruit." Do NOT write a note that implies Ascorbic Acid itself came from citrus fruit.
  3. If it has no db_match, rely on your own general knowledge instead, and note that this ingredient was not found in our internal database.
  4. Flag any known safety concerns, allergens, or controversial ingredients.

  Then provide:
  - Overall safety assessment
  - Any concerning ingredients
  - A simple summary for the user
  
  Respond with ONLY valid JSON, no other text:
  {
    "safe": true/false,
    "warnings": ["<warning1>", ...],
    "ingredient_notes": [{"ingredient": "<name>", "note": "<short explanation, including sourcing/manufacturing context and whether it matched our database>"}],
    "analysis": "<summary for user>"
  }`,
  tools: [],
});