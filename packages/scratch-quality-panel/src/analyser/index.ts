// STAGE 13 — AnalysisModule: orchestrator combining rule-based and LLM analysis with deduplication

import { Finding, Suggestion, ScratchProject, AnalysisConfig } from '@types';
import { LLM_FINDING_SIMILARITY_THRESHOLD } from '@constants';
import { runRuleBasedAnalysis } from './rule-based/index';
import { runLLMAnalysis, LLMResult } from './llm/index';

function jaccardSimilarity(a: string, b: string): number {
  const tokensA = new Set(a.toLowerCase().split(/\W+/).filter(Boolean));
  const tokensB = new Set(b.toLowerCase().split(/\W+/).filter(Boolean));
  const intersection = [...tokensA].filter((t) => tokensB.has(t)).length;
  const union = new Set([...tokensA, ...tokensB]).size;
  return union === 0 ? 0 : intersection / union;
}

function deduplicateLLMFindings(llmFindings: Finding[], ruleFindings: Finding[]): Finding[] {
  return llmFindings.filter(
    (llm) =>
      !ruleFindings.some(
        (rule) =>
          rule.sprite === llm.sprite &&
          rule.dimension === llm.dimension &&
          jaccardSimilarity(rule.description, llm.description) >= LLM_FINDING_SIMILARITY_THRESHOLD,
      ),
  );
}

export class AnalysisModule {
  private config: AnalysisConfig;
  private abortController: AbortController | null = null;
  private lastRuleBasedFindings: Finding[] = [];

  constructor(config: AnalysisConfig) {
    this.config = config;
  }

  runRuleBased(project: ScratchProject): Finding[] {
    const findings = runRuleBasedAnalysis(project);
    this.lastRuleBasedFindings = findings;
    return findings;
  }

  async runLLM(pseudocode: string): Promise<LLMResult> {
    if (!this.config.anthropicApiKey) return { findings: [], suggestions: [] };

    // Abort any in-flight request to prevent stale responses landing after newer ones
    if (this.abortController) {
      this.abortController.abort();
    }
    this.abortController = new AbortController();

    const result = await runLLMAnalysis(
      pseudocode,
      this.config.anthropicApiKey,
      this.config.projectDescription,
      this.abortController.signal,
    );
    this.abortController = null;

    return {
      findings: deduplicateLLMFindings(result.findings, this.lastRuleBasedFindings),
      suggestions: result.suggestions,
    };
  }

  updateConfig(config: Partial<AnalysisConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

export type { LLMResult };
export type { Suggestion };
