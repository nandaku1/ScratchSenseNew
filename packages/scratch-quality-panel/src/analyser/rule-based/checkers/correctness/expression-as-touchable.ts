/**
 * Flags "touching [thing]?" blocks where a dynamic expression (variable,
 * reporter) has been dropped into the sprite-name menu. Scratch evaluates
 * the touching check against a fixed sprite name selected at edit time; a
 * dynamic value is not looked up and the block will always return false.
 *
 * Source: Frädrich et al. (2020) "Common Bugs in Scratch Programs" —
 *   "Expression As Touchable" (365 projects)
 */

import { Finding, ScratchTarget } from '@types';

export function checkExpressionAsTouchable(target: ScratchTarget): Finding[] {
  const findings: Finding[] = [];

  for (const [id, block] of Object.entries(target.blocks)) {
    if (block.opcode !== 'sensing_touchingobject') continue;
    const input = block.inputs['TOUCHINGOBJECTMENU'];
    if (!input) continue;
    const ref = input[1];
    if (typeof ref !== 'string') continue;
    const referencedBlock = target.blocks[ref];
    // If the referenced block is a shadow it is the static menu — that is fine.
    // A non-shadow block means a reporter was dropped into the slot.
    if (!referencedBlock || referencedBlock.shadow) continue;

    findings.push({
      dimension: 'correctness',
      severity: 'error',
      source: 'rule-based',
      sprite: target.name,
      title: 'Dynamic Value in Touching Check',
      description:
        'A variable or expression has been connected to the "touching [?]" sprite-name slot. Scratch requires a fixed sprite name chosen from the menu — a dynamic value is ignored and the block always returns false.',
      fix: 'Remove the reporter and select the target sprite from the menu. If you need to change which sprite is checked, use separate "touching [Sprite A]?" and "touching [Sprite B]?" blocks in an if/else.',
      blockId: id,
    });
  }

  return findings;
}
