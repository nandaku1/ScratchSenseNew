/**
 * Flags a "forever" block that is nested inside another loop (repeat, repeat
 * until, for each, or another forever). The outer loop can never advance
 * past the forever because the forever block never exits, making the
 * remaining iterations of the outer loop unreachable.
 *
 * Source: Frädrich et al. (2020) "Common Bugs in Scratch Programs" —
 *   "Forever Inside Loop" (2158 projects)
 */

import { Finding, ScratchTarget } from '@types';
import { LOOP_OPCODES } from '@constants';
import { hasAncestorWithOpcode } from '@utils/block-traversal';

export function checkForeverInsideLoop(target: ScratchTarget): Finding[] {
  const findings: Finding[] = [];

  for (const [id, block] of Object.entries(target.blocks)) {
    if (block.opcode !== 'control_forever') continue;
    if (!hasAncestorWithOpcode(id, target.blocks, LOOP_OPCODES)) continue;

    findings.push({
      dimension: 'correctness',
      severity: 'warning',
      source: 'rule-based',
      sprite: target.name,
      title: 'Forever Inside Loop',
      description:
        'A "forever" block is nested inside another loop. The outer loop will never advance past the forever block because forever never exits, making subsequent iterations unreachable.',
      fix: 'Remove the outer loop, or replace the "forever" with a "repeat" or "repeat until" block so the inner loop can finish.',
      blockId: id,
    });
  }

  return findings;
}
