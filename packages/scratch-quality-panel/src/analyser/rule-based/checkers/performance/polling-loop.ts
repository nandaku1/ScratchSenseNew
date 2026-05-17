// STAGE 8 — flags repeat-until with empty body (busy-wait that burns CPU)

import { Finding, ScratchTarget } from '@types';
import { getInputBlockId } from '@utils/block-traversal';

export function checkPollingLoop(target: ScratchTarget): Finding[] {
  const findings: Finding[] = [];
  for (const [id, block] of Object.entries(target.blocks)) {
    if (block.opcode !== 'control_repeat_until') continue;
    const substackId = getInputBlockId(block, 'SUBSTACK');
    if (!substackId) {
      findings.push({
        dimension: 'performance',
        severity: 'warning',
        source: 'rule-based',
        sprite: target.name,
        title: 'Busy-Wait Loop',
        description: 'A "repeat until" loop with no blocks inside busy-waits and may cause lag.',
        fix: 'Replace it with a "wait until" block.',
        blockId: id,
      });
    }
  }
  return findings;
}
