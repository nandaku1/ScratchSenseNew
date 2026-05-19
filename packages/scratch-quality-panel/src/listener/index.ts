// Wires VM events to analysis. Rule-based runs synchronously on every change (cheap, <10 ms);
// LLM runs debounced (default 2 s) because it is async and costly.

import { Finding, Suggestion, ScratchVMLike, ScratchProject, AnalysisConfig } from '@types';
import { AnalysisModule } from '../analyser/index';
import { blockSerialiser } from '../serialiser/index';

const DEFAULT_DEBOUNCE_MS = 2000;

export type FindingsUpdateCallback = (findings: Finding[], suggestions: Suggestion[], llmDone?: boolean) => void;

export class WorkspaceListener {
  private config: AnalysisConfig;
  private analyser: AnalysisModule;
  private vm: ScratchVMLike | null = null;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private callbacks: Set<FindingsUpdateCallback> = new Set();
  private lastRuleBasedFindings: Finding[] = [];
  private lastLLMFindings: Finding[] = [];
  private lastSuggestions: Suggestion[] = [];

  constructor(config: AnalysisConfig) {
    this.config = config;
    this.analyser = new AnalysisModule(config);
    this.handleProjectChanged = this.handleProjectChanged.bind(this);
  }

  attach(vm: ScratchVMLike): void {
    this.detach();
    this.vm = vm;
    vm.on('PROJECT_CHANGED', this.handleProjectChanged);
  }

  detach(): void {
    if (this.vm) {
      this.vm.removeListener('PROJECT_CHANGED', this.handleProjectChanged);
      this.vm = null;
    }
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }

  onFindingsUpdate(callback: FindingsUpdateCallback): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  async triggerAnalysis(): Promise<void> {
    if (!this.vm) return;
    await this.handleProjectChanged();
  }

  updateConfig(config: Partial<AnalysisConfig>): void {
    this.config = { ...this.config, ...config };
    this.analyser.updateConfig(config);
  }

  private async handleProjectChanged(): Promise<void> {
    if (!this.vm) return;

    let project: ScratchProject;
    try {
      project = JSON.parse(this.vm.toJSON()) as ScratchProject;
    } catch {
      return;
    }

    // Rule-based is synchronous — dispatch immediately
    this.lastRuleBasedFindings = this.analyser.runRuleBased(project);
    this.emit();

    // LLM is debounced: cancel any pending timer and start a new one
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
    }

    const debounceMs = this.config.debounceMs ?? DEFAULT_DEBOUNCE_MS;
    this.debounceTimer = setTimeout(async () => {
      this.debounceTimer = null;
      if (!this.config.anthropicApiKey) return;

      const hasAnyBlocks = project.targets.some((t) =>
        Object.values(t.blocks).some((b) => !b.shadow),
      );
      if (!hasAnyBlocks) {
        this.lastLLMFindings = [];
        this.lastSuggestions = [];
        this.emit(true);
        return;
      }

      const pseudocode = blockSerialiser.serialise(project);
      const result = await this.analyser.runLLM(pseudocode);
      this.lastLLMFindings = result.findings;
      this.lastSuggestions = result.suggestions;
      this.emit(true);
    }, debounceMs);
  }

  private emit(llmDone = false): void {
    const combined = [...this.lastRuleBasedFindings, ...this.lastLLMFindings];
    for (const cb of this.callbacks) {
      cb(combined, this.lastSuggestions, llmDone);
    }
  }
}
