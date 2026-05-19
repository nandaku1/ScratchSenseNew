// LLM analysis layer: Anthropic claude-haiku-4-5 with prompt caching, abort support, and retry backoff.

import Anthropic from '@anthropic-ai/sdk';
import { Finding, Suggestion } from '@types';
import { buildSystemPrompt, buildUserPrompt } from './prompt';

export interface LLMResult {
  findings: Finding[];
  suggestions: Suggestion[];
}

type LLMRawFinding = {
  dimension: string;
  severity: string;
  sprite: string;
  title?: string;
  description: string;
  fix?: string;
};

function parseLLMFinding(raw: unknown): Finding | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const dimension = r['dimension'];
  const severity = r['severity'];
  const sprite = r['sprite'];
  const description = r['description'];
  const title = typeof r['title'] === 'string' ? r['title'] : undefined;
  const fix = typeof r['fix'] === 'string' ? r['fix'] : '';

  if (
    (dimension !== 'correctness' && dimension !== 'performance' && dimension !== 'maintainability') ||
    (severity !== 'error' && severity !== 'warning' && severity !== 'info') ||
    typeof sprite !== 'string' ||
    typeof description !== 'string' ||
    !sprite ||
    !description
  ) {
    return null;
  }

  return {
    dimension: dimension as Finding['dimension'],
    severity: severity as Finding['severity'],
    source: 'llm',
    sprite,
    ...(title && { title }),
    description,
    fix,
  };
}

function parseLLMSuggestion(raw: unknown): Suggestion | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const title = r['title'];
  const description = r['description'];
  if (typeof title !== 'string' || typeof description !== 'string' || !title || !description) {
    return null;
  }
  return { title, description, source: 'llm' };
}

async function callWithBackoff<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (err instanceof Anthropic.RateLimitError && attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
        continue;
      }
      throw err;
    }
  }
  // TypeScript requires this but the loop above always returns or throws
  throw new Error('Unreachable');
}

export async function runLLMAnalysis(
  pseudocode: string,
  apiKey: string,
  projectDescription?: string,
  signal?: AbortSignal,
): Promise<LLMResult> {
  const empty: LLMResult = { findings: [], suggestions: [] };
  // dangerouslyAllowBrowser: the SDK blocks browser use by default to deter credential exposure;
  // here the key is intentionally provided by the researcher who runs the study server.
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });

  let rawText: string;
  try {
    const message = await callWithBackoff(() =>
      client.messages.create(
        {
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1024,
          system: [
            {
              type: 'text',
              text: buildSystemPrompt(projectDescription),
              cache_control: { type: 'ephemeral' },
            },
          ],
          messages: [{ role: 'user', content: buildUserPrompt(pseudocode) }],
        },
        { signal },
      ),
    );

    const content = message.content[0];
    rawText = content.type === 'text' ? content.text : '';
  } catch (err) {
    // AbortError is expected when user types faster than debounce
    if (err instanceof Error && (err.name === 'AbortError' || err.message.includes('abort'))) {
      return empty;
    }
    console.warn('[ScratchSense] LLM analysis failed:', err);
    return empty;
  }

  // Strip markdown code fences the model sometimes wraps output in
  const cleaned = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    console.warn('[ScratchSense] LLM returned non-JSON:', cleaned.slice(0, 200));
    return empty;
  }

  // Support legacy plain-array responses (findings only, no suggestions)
  if (Array.isArray(parsed)) {
    return {
      findings: (parsed as unknown[]).map(parseLLMFinding).filter((f): f is Finding => f !== null),
      suggestions: [],
    };
  }

  if (!parsed || typeof parsed !== 'object') return empty;
  const obj = parsed as Record<string, unknown>;

  const findings = Array.isArray(obj['findings'])
    ? (obj['findings'] as unknown[]).map(parseLLMFinding).filter((f): f is Finding => f !== null)
    : [];

  const suggestions = Array.isArray(obj['suggestions'])
    ? (obj['suggestions'] as unknown[]).map(parseLLMSuggestion).filter((s): s is Suggestion => s !== null)
    : [];

  return { findings, suggestions };
}
