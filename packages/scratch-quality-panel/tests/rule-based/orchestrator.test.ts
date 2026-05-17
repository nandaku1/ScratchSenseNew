// STAGE 10 — tests for the rule-based orchestrator

import { runRuleBasedAnalysis } from '../../src/analyser/rule-based/index';
import { makeProject, makeTarget, makeHatBlock, makeFloatingBlock, makeStage, resetIds, freshId } from '../fixtures/builders';

beforeEach(resetIds);

test('returns findings sorted error → warning → info', () => {
  // floating block (error) + empty hat (warning)
  const floatId = freshId();
  const hatId = freshId();
  const sprite = makeTarget({
    name: 'Sprite1',
    variables: { v1: ['my variable', 0] }, // poor name (warning) + unused (info)
    blocks: {
      [floatId]: makeFloatingBlock(floatId),
      [hatId]: makeHatBlock(hatId), // empty → warning
    },
  });
  const project = makeProject([sprite]);
  const findings = runRuleBasedAnalysis(project);
  expect(findings.length).toBeGreaterThan(0);
  const severities = findings.map((f) => f.severity);
  const errorIdx = severities.indexOf('error');
  const warnIdx = severities.indexOf('warning');
  const infoIdx = severities.indexOf('info');
  if (errorIdx !== -1 && warnIdx !== -1) expect(errorIdx).toBeLessThan(warnIdx);
  if (warnIdx !== -1 && infoIdx !== -1) expect(warnIdx).toBeLessThan(infoIdx);
});

test('empty project with only Stage has no-entry-point warning', () => {
  const project = makeProject([]);
  const findings = runRuleBasedAnalysis(project);
  expect(findings.some((f) => f.description.includes('green flag'))).toBe(true);
});

test('project with green flag hat has no entry-point finding', () => {
  const hatId = freshId();
  const bodyId = freshId();
  const sprite = makeTarget({
    blocks: {
      [hatId]: makeHatBlock(hatId, bodyId),
      [bodyId]: { opcode: 'motion_movesteps', next: null, parent: null, inputs: {}, fields: {}, shadow: false, topLevel: false },
    },
  });
  const findings = runRuleBasedAnalysis(makeProject([sprite]));
  expect(findings.every((f) => !f.description.includes('green flag') || f.description.includes('never run'))).toBe(true);
});
