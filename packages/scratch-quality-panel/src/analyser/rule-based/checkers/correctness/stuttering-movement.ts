/**
 * Flags when-key-pressed scripts whose body contains only motion blocks.
 * The key-press hat fires once per keydown event; without a loop the sprite
 * moves a single step and stops, producing stuttering movement.
 *
 * Does NOT fire when the body contains any non-motion block (custom block
 * call, broadcast, control structure, etc.) — those indicate the student
 * is already using a different pattern.
 *
 * Source: Frädrich et al. (2020) "Common Bugs in Scratch Programs" —
 *   "Stuttering Movement" (5541 projects, 10/10 failure rate)
 */

import { Finding, ScratchBlock, ScratchTarget } from '@types';
import { MOTION_OPCODES } from '@constants';

export function checkStutteringMovement(target: ScratchTarget): Finding[] {
  const findings: Finding[] = [];

  for (const [, block] of Object.entries(target.blocks)) {
    if (block.opcode !== 'event_whenkeypressed') continue;
    if (!block.next) continue;

    const bodyOpcodes: string[] = [];
    let currentId: string | null = block.next;
    while (currentId) {
      const b: ScratchBlock | undefined = target.blocks[currentId];
      if (!b) break;
      bodyOpcodes.push(b.opcode);
      currentId = b.next;
    }

    if (bodyOpcodes.length === 0) continue;
    if (!bodyOpcodes.every(op => MOTION_OPCODES.has(op))) continue;

    findings.push({
      dimension: 'correctness',
      severity: 'warning',
      source: 'rule-based',
      sprite: target.name,
      title: 'Stuttering Movement',
      description:
        'This "when key pressed" script contains only motion blocks. The script runs once per keypress event, moving the sprite a single step and stopping — which causes stuttering. To move smoothly while a key is held, the check must be inside a loop.',
      fix: 'Use a "when green flag clicked → forever → if <key pressed?> → move" structure instead, so movement is checked every frame.',
    });
  }

  return findings;
}
