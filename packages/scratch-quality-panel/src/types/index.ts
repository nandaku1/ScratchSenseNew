// STAGE 1 — shared TypeScript interfaces; all downstream code imports from here

export interface Finding {
  dimension: 'correctness' | 'performance' | 'maintainability';
  severity: 'error' | 'warning' | 'info';
  source: 'rule-based' | 'llm';
  sprite: string;
  title?: string;
  description: string;
  fix: string;
  blockId?: string;
}

// sb3 wire format for block inputs: outer array [type, value], value can be a block ID string,
// a literal tuple [type, value|null], or null
export interface ScratchBlock {
  opcode: string;
  next: string | null;
  parent: string | null;
  inputs: Record<string, [number, string | [number, string | null] | null]>;
  fields: Record<string, [string, string | null]>;
  shadow: boolean;
  topLevel: boolean;
  mutation?: Record<string, string>;
  x?: number;
  y?: number;
}

// sb3 variable: [name, currentValue]
export type ScratchVariable = [string, string | number | boolean];

// sb3 list: [name, items]
export type ScratchList = [string, Array<string | number | boolean>];

export interface ScratchTarget {
  name: string;
  isStage: boolean;
  blocks: Record<string, ScratchBlock>;
  variables: Record<string, ScratchVariable>;
  lists: Record<string, ScratchList>;
  broadcasts: Record<string, string>;
  currentCostume?: number;
  layerOrder?: number;
  volume?: number;
  x?: number;
  y?: number;
}

export interface ScratchProject {
  targets: ScratchTarget[];
  meta?: Record<string, unknown>;
}

export interface Suggestion {
  title: string;
  description: string;
  source: 'llm';
}

export interface AnalysisConfig {
  // Absence silently skips LLM analysis
  anthropicApiKey?: string;
  debounceMs?: number;
  projectDescription?: string;
}

// Minimal VM duck-type — no hard dependency on scratch-vm package
export interface ScratchVMLike {
  on(event: string, listener: (...args: unknown[]) => void): void;
  removeListener(event: string, listener: (...args: unknown[]) => void): void;
  toJSON(): string;
  runtime: {
    targets: ScratchTarget[];
  };
}
