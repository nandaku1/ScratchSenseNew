// Flags sprite-local variables whose names suggest shared state (score, lives, etc.)
// when multiple sprites exist. Source: Digital Travellers (2020) "Tool — Scratch: Frequent Errors".

import { Finding, ScratchTarget } from '@types';

const SHARED_STATE_NAMES = ['score', 'lives', 'level', 'timer', 'points', 'health'];

function isSharedStateName(name: string): boolean {
  return SHARED_STATE_NAMES.includes(name.toLowerCase().trim());
}

export function checkLocalVariableScope(targets: ScratchTarget[]): Finding[] {
  const spriteTargets = targets.filter(t => !t.isStage);
  if (spriteTargets.length < 2) return [];

  const stageTarget = targets.find(t => t.isStage);
  const globalVarNames = new Set(
    Object.values(stageTarget?.variables ?? {}).map(([name]) => name.toLowerCase().trim()),
  );

  const findings: Finding[] = [];
  for (const target of spriteTargets) {
    for (const [, [varName]] of Object.entries(target.variables)) {
      if (!isSharedStateName(varName)) continue;
      if (globalVarNames.has(varName.toLowerCase().trim())) continue;
      findings.push({
        dimension: 'correctness',
        severity: 'info',
        source: 'rule-based',
        sprite: target.name,
        title: `Local Variable "${varName}" May Need Global Scope`,
        description: `"${varName}" is a sprite-local variable on ${target.name}, but its name suggests it should be shared across all sprites. Other sprites cannot read or change a local variable.`,
        fix: `Delete this variable and recreate it with "For all sprites" selected, so every sprite can access it.`,
      });
    }
  }
  return findings;
}
