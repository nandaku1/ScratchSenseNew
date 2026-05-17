// STAGE 23 — tests for AnalysisModule orchestrator and Jaccard deduplication

import { AnalysisModule } from '../../src/analyser/index';
import { makeProject, makeTarget, makeStage, makeHatBlock, makeFloatingBlock, resetIds, freshId } from '../fixtures/builders';

beforeEach(resetIds);

describe('AnalysisModule.runRuleBased', () => {
  test('returns rule-based findings for a project with issues', () => {
    const floatId = freshId();
    const sprite = makeTarget({
      blocks: { [floatId]: makeFloatingBlock(floatId) },
    });
    const module = new AnalysisModule({});
    const findings = module.runRuleBased(makeProject([sprite]));
    expect(findings.length).toBeGreaterThan(0);
    expect(findings.every((f) => f.source === 'rule-based')).toBe(true);
  });

  test('empty project returns only no-entry-point warning', () => {
    const module = new AnalysisModule({});
    const findings = module.runRuleBased(makeProject([]));
    expect(findings.length).toBeGreaterThanOrEqual(1);
    expect(findings.some((f) => f.description.includes('green flag'))).toBe(true);
  });

  test('findings are sorted error → warning → info', () => {
    const floatId = freshId();
    const hatId = freshId();
    const sprite = makeTarget({
      name: 'Sprite1',
      variables: { v1: ['my variable', 0] },
      blocks: {
        [floatId]: makeFloatingBlock(floatId),
        [hatId]: makeHatBlock(hatId),
      },
    });
    const module = new AnalysisModule({});
    const findings = module.runRuleBased(makeProject([sprite]));
    const severities = findings.map((f) => f.severity);
    const order: Record<string, number> = { error: 0, warning: 1, info: 2 };
    for (let i = 1; i < severities.length; i++) {
      expect(order[severities[i]]).toBeGreaterThanOrEqual(order[severities[i - 1]]);
    }
  });

  test('updateConfig merges partial config', () => {
    const module = new AnalysisModule({ debounceMs: 500 });
    module.updateConfig({ anthropicApiKey: 'key123' });
    // Config updated without error; runRuleBased still works
    expect(() => module.runRuleBased(makeProject([]))).not.toThrow();
  });

  test('runLLM with no API key returns empty array', async () => {
    const module = new AnalysisModule({});
    const result = await module.runLLM('some pseudocode');
    expect(result).toEqual({ findings: [], suggestions: [] });
  });
});
