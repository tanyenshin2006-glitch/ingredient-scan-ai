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
  instruction: `You are a health and ingredient expert. You will be given a list of ingredients found on a product label and their database information.
  
  Analyse the ingredients and provide:
  1. Overall safety assessment
  2. Any concerning ingredients
  3. A simple summary for the user
  
  Respond with ONLY valid JSON, no other text:
  {"safe": true/false, "warnings": ["<warning1>", ...], "analysis": "<summary for user>"}`,
  tools: [],
});