// Flags variables read but never written within the same target.
// Tracks by variable ID (field[1]), not name, so two sprites can share a name without false positives.

import { Finding, ScratchTarget } from '@types';
import { VARIABLE_WRITE_OPCODES, VARIABLE_READ_OPCODES } from '@constants';

export function checkUninitialisedVariables(target: ScratchTarget): Finding[] {
  const findings: Finding[] = [];
  const writtenVarIds = new Set<string>();
  const readVarIds = new Set<string>();

  for (const block of Object.values(target.blocks)) {
    if (VARIABLE_WRITE_OPCODES.has(block.opcode)) {
      const field = block.fields['VARIABLE'];
      if (field?.[1]) writtenVarIds.add(field[1]);
    }
    if (VARIABLE_READ_OPCODES.has(block.opcode)) {
      const field = block.fields['VARIABLE'];
      if (field?.[1]) readVarIds.add(field[1]);
    }
  }

  for (const [varId, [varName]] of Object.entries(target.variables)) {
    if (readVarIds.has(varId) && !writtenVarIds.has(varId)) {
      findings.push({
        dimension: 'correctness',
        severity: 'warning',
        source: 'rule-based',
        sprite: target.name,
        title: `Uninitialised Variable "${varName}"`,
        description: `"${varName}" is read but never given a value first, so it may always contain its default (0 or empty).`,
        fix: `Set it to an initial value before using it.`,
      });
    }
  }
  return findings;
}
