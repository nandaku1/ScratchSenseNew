// STAGE 5 — detects forever loops that block the sprite or yield but never end

import { Finding, ScratchTarget } from '@types';
import { FOREVER_OPCODE, STOP_OPCODE, WAIT_OPCODE } from '@constants';
import { getInputBlockId, subtreeContainsOpcode } from '@utils/block-traversal';

export function checkInfiniteLoops(target: ScratchTarget): Finding[] {
  const findings: Finding[] = [];
  for (const [id, block] of Object.entries(target.blocks)) {
    if (block.opcode !== FOREVER_OPCODE) continue;
    const substackId = getInputBlockId(block, 'SUBSTACK');
    if (!substackId) {
      findings.push({
        dimension: 'correctness',
        severity: 'error',
        source: 'rule-based',
        sprite: target.name,
        title: 'Empty Forever Loop',
        description: 'A forever loop with no blocks and no stop or wait will block the sprite entirely.',
        fix: 'Add blocks inside it or remove the loop.',
        blockId: id,
      });
      continue;
    }
    const hasStop = subtreeContainsOpcode(substackId, target.blocks, new Set([STOP_OPCODE]));
    if (hasStop) continue;
    const hasWait = subtreeContainsOpcode(substackId, target.blocks, new Set([WAIT_OPCODE]));
    if (hasWait) {
      findings.push({
        dimension: 'correctness',
        severity: 'warning',
        source: 'rule-based',
        sprite: target.name,
        title: 'Endless Forever Loop',
        description: 'This forever loop pauses with wait blocks but has no stop block, so it runs forever.',
        fix: 'Add a stop block if the loop should end.',
        blockId: id,
      });
    } else {
      findings.push({
        dimension: 'correctness',
        severity: 'error',
        source: 'rule-based',
        sprite: target.name,
        title: 'Blocking Forever Loop',
        description: 'A forever loop with no stop or wait will freeze the sprite entirely.',
        fix: 'Add a wait or stop block inside it.',
        blockId: id,
      });
    }
  }
  return findings;
}
