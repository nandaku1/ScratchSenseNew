// STAGE 5 — flags topLevel non-hat, non-shadow blocks that can never run

import { Finding, ScratchTarget } from '@types';
import { HAT_OPCODES } from '@constants';

export function checkUnreachableScripts(target: ScratchTarget): Finding[] {
  const findings: Finding[] = [];
  for (const [id, block] of Object.entries(target.blocks)) {
    if (block.topLevel && !block.shadow && !HAT_OPCODES.has(block.opcode)) {
      findings.push({
        dimension: 'correctness',
        severity: 'error',
        source: 'rule-based',
        sprite: target.name,
        title: 'Script Without a Trigger',
        description: 'This script has no hat block and can never run.',
        fix: 'Attach a "when green flag clicked" or other event trigger to it.',
        blockId: id,
      });
    }
  }
  return findings;
}
