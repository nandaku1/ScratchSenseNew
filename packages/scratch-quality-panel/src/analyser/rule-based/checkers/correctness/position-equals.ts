/**
 * Flags equality checks (=) against continuous motion reporters (x position,
 * y position, direction). Sprite positions are floating-point; a sprite can
 * skip over an exact value without ever equalling it, causing the condition
 * to never trigger.
 *
 * Source: Frädrich et al. (2020) "Common Bugs in Scratch Programs" —
 *   "Position Equals Check" (1472 projects)
 */

import { Finding, ScratchTarget } from '@types';
import { getInputBlockId, subtreeContainsOpcode } from '@utils/block-traversal';

const POSITION_OPCODES = new Set([
  'motion_xposition',
  'motion_yposition',
  'motion_direction',
]);

export function checkPositionEquals(target: ScratchTarget): Finding[] {
  const findings: Finding[] = [];

  for (const [id, block] of Object.entries(target.blocks)) {
    if (block.opcode !== 'operator_equals') continue;

    const op1Id = getInputBlockId(block, 'OPERAND1');
    const op2Id = getInputBlockId(block, 'OPERAND2');

    const hasPosition =
      (op1Id && subtreeContainsOpcode(op1Id, target.blocks, POSITION_OPCODES)) ||
      (op2Id && subtreeContainsOpcode(op2Id, target.blocks, POSITION_OPCODES));

    if (!hasPosition) continue;

    findings.push({
      dimension: 'correctness',
      severity: 'warning',
      source: 'rule-based',
      sprite: target.name,
      title: 'Exact Position Comparison',
      description:
        'An equality check (=) is used against a position or direction value. Sprite coordinates are floating-point and can skip over the target value, so the condition may never be true.',
      fix: 'Use a range check instead: e.g. "(x position) > (target − 2) and (x position) < (target + 2)" to detect when the sprite is near the target.',
      blockId: id,
    });
  }

  return findings;
}
