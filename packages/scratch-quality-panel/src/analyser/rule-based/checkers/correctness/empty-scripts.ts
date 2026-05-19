// Flags hat blocks with no body (next === null) — triggers that do nothing when fired.

import { Finding, ScratchTarget } from '@types';
import { HAT_OPCODES, OPCODE_LABELS } from '@constants';

export function checkEmptyScripts(target: ScratchTarget): Finding[] {
  const findings: Finding[] = [];
  for (const [id, block] of Object.entries(target.blocks)) {
    if (block.topLevel && !block.shadow && HAT_OPCODES.has(block.opcode) && block.next === null) {
      const label = OPCODE_LABELS[block.opcode] ?? block.opcode;
      findings.push({
        dimension: 'correctness',
        severity: 'warning',
        source: 'rule-based',
        sprite: target.name,
        title: `Empty "${label}" Script`,
        description: `This "${label}" script has no blocks inside it and will do nothing.`,
        fix: `Add blocks inside it or remove the script.`,
        blockId: id,
      });
    }
  }
  return findings;
}
