/**
 * Flags sensing conditions (touching, key pressed, etc.) used inside an
 * if-block that has no enclosing loop, meaning the check only runs once.
 *
 * Sources:
 *   - Frädrich et al. (2019) "Let's Catch Bugs Early" — missing loop sensing
 *   - Digital Travellers (2020) "Tool — Scratch: Frequent Errors":
 *     "the game will not work since the code only verifies once if a condition is true"
 */

import { Finding, ScratchTarget } from '@types';
import { LOOP_OPCODES } from '@constants';
import { getInputBlockId, subtreeContainsOpcode, hasAncestorWithOpcode } from '@utils/block-traversal';

const SENSING_OPCODES = new Set([
  'sensing_touchingobject',
  'sensing_touchingcolor',
  'sensing_coloristouchingcolor',
  'sensing_keypressed',
  'sensing_mousedown',
]);

const IF_OPCODES = new Set(['control_if', 'control_if_else']);

export function checkMissingLoopSensing(target: ScratchTarget): Finding[] {
  const findings: Finding[] = [];
  for (const [id, block] of Object.entries(target.blocks)) {
    if (!IF_OPCODES.has(block.opcode)) continue;
    const conditionId = getInputBlockId(block, 'CONDITION');
    if (!conditionId) continue;
    if (!subtreeContainsOpcode(conditionId, target.blocks, SENSING_OPCODES)) continue;
    if (hasAncestorWithOpcode(id, target.blocks, LOOP_OPCODES)) continue;
    findings.push({
      dimension: 'correctness',
      severity: 'warning',
      source: 'rule-based',
      sprite: target.name,
      title: 'Sensing Check Outside Loop',
      description:
        'This if-block uses a sensing condition (touching, key pressed, etc.) but is not inside a loop. The check runs only once, so events that happen later will be missed.',
      fix: 'Wrap the if-block in a "forever" loop so the condition is checked continuously.',
      blockId: id,
    });
  }
  return findings;
}
