import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { generateText, embed, type LanguageModel, type EmbeddingModel } from 'ai';

export type Provider = 'google' | 'openai' | 'anthropic';

export interface AIConfig {
  provider: Provider;
  googleApiKey?: string;
  openaiApiKey?: string;
  anthropicApiKey?: string;
  languageModel?: string;
  embeddingModel?: string;
}

const getProviderConfig = (config?: AIConfig): AIConfig => {
  if (config) {
    return {
      provider: config.provider || (process.env.AI_PROVIDER as Provider) || 'google',
      googleApiKey: config.googleApiKey || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      openaiApiKey: config.openaiApiKey || process.env.OPENAI_API_KEY,
      anthropicApiKey: config.anthropicApiKey || process.env.ANTHROPIC_API_KEY,
      languageModel: config.languageModel || (config.provider === 'openai' ? 'gpt-4o-mini' : config.provider === 'anthropic' ? 'claude-3-5-sonnet-20240620' : 'gemini-2.5-flash'),
      embeddingModel: config.embeddingModel || (config.provider === 'openai' ? 'text-embedding-3-small' : 'gemini-embedding-001'),
    };
  }

  // Fallback to purely env vars
  const provider = (process.env.AI_PROVIDER as Provider) || 'google';
  return {
    provider,
    googleApiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    openaiApiKey: process.env.OPENAI_API_KEY,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    languageModel: provider === 'openai' ? 'gpt-4o-mini' : provider === 'anthropic' ? 'claude-3-5-sonnet-20240620' : 'gemini-2.5-flash',
    embeddingModel: provider === 'openai' ? 'text-embedding-3-small' : 'gemini-embedding-001',
  };
};

const getGoogleProvider = (apiKey?: string) => {
  if (!apiKey) {
    throw new Error('GOOGLE_GENERATIVE_AI_API_KEY is not set.');
  }
  return createGoogleGenerativeAI({ apiKey });
};

const getOpenAIProvider = (apiKey?: string) => {
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set.');
  }
  return createOpenAI({ apiKey });
};

const getAnthropicProvider = (apiKey?: string) => {
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not set.');
  }
  return createAnthropic({ apiKey });
};

export const getLanguageModel = (config?: AIConfig): LanguageModel => {
  const c = getProviderConfig(config);
  if (c.provider === 'openai') {
    return getOpenAIProvider(c.openaiApiKey)(c.languageModel || 'gpt-4o-mini');
  } else if (c.provider === 'anthropic') {
    return getAnthropicProvider(c.anthropicApiKey)(c.languageModel || 'claude-3-5-sonnet-20240620');
  }
  return getGoogleProvider(c.googleApiKey)(c.languageModel || 'gemini-2.5-flash');
};

export const getEmbeddingModel = (config?: AIConfig): EmbeddingModel => {
  const c = getProviderConfig(config);
  if (c.provider === 'openai') {
    return getOpenAIProvider(c.openaiApiKey).embedding(c.embeddingModel || 'text-embedding-3-small');
  }
  return getGoogleProvider(c.googleApiKey).embedding(c.embeddingModel || 'gemini-embedding-001');
};

export async function summarizeSession(
  eventsJson: string, 
  networkJson: string, 
  consoleJson: string,
  config?: AIConfig
): Promise<{ text: string; usage: any; provider: Provider; modelUsed: string; }> {
  const model = getLanguageModel(config);
  
  const systemPrompt = `
    You are an expert user behavior analyst. Read the telemetry data for a user's web session and write a highly detailed, semantic narrative of exactly what happened.
    
    CRITICAL INSTRUCTIONS:
    - You MUST write a comprehensive paragraph of AT LEAST 4 sentences. Be highly descriptive and verbose.
    - Explicitly mention the specific pages/URLs the user navigated to.
    - Describe the user's action patterns in detail (e.g., "They clicked extensively on the dashboard", "They repeatedly typed into the search input").
    - Explicitly describe any friction, errors, or frustration signals (e.g., "They experienced a 500 network error", "They rage clicked after encountering an issue").
    - Deduce their intent based on their actions.
    - Make the narrative highly descriptive so it works perfectly in a semantic search engine.
    - Return ONLY the raw text paragraph, nothing else. Do not use markdown formatting.
  `;

  const userPrompt = `
    Session Context & Actions:
    ${eventsJson}
    
    Network Errors:
    ${networkJson}
    
    Console Warnings/Errors:
    ${consoleJson}
  `;

  const { text, usage } = await generateText({
    model,
    system: systemPrompt,
    prompt: userPrompt,
    maxOutputTokens: 800,
  });

  return { text, usage, provider: getProviderConfig(config).provider, modelUsed: getProviderConfig(config).languageModel! };
}

export async function generateSessionEmbedding(narrative: string, config?: AIConfig): Promise<{ embedding: number[]; usage: any; provider: Provider; modelUsed: string; }> {
  const model = getEmbeddingModel(config);
  const { embedding, usage } = await embed({
    model,
    value: narrative,
  });
  return { embedding, usage, provider: getProviderConfig(config).provider, modelUsed: getProviderConfig(config).embeddingModel! };
}
