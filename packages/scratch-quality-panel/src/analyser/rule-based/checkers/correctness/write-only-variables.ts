// STAGE 6 — flags variables written but never read in the same target

import { Finding, ScratchTarget } from '@types';
import { VARIABLE_WRITE_OPCODES, VARIABLE_READ_OPCODES } from '@constants';

export function checkWriteOnlyVariables(target: ScratchTarget): Finding[] {
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
    if (writtenVarIds.has(varId) && !readVarIds.has(varId)) {
      findings.push({
        dimension: 'correctness',
        severity: 'warning',
        source: 'rule-based',
        sprite: target.name,
        title: `Write-Only Variable "${varName}"`,
        description: `This variable is written to but never read, so the stored value has no effect on the project.`,
        fix: `Read it somewhere or remove it.`,
      });
    }
  }
  return findings;
}
