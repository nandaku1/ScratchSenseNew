// Flags literal coordinates outside the 480×360 stage bounds — sprite would be placed off-screen.

import { Finding, ScratchTarget } from '@types';
import { STAGE_X_MAX, STAGE_Y_MAX } from '@constants';

const COORD_OPCODES: Record<string, Array<{ input: string; max: number; axis: string }>> = {
  motion_gotoxy: [
    { input: 'X', max: STAGE_X_MAX, axis: 'X' },
    { input: 'Y', max: STAGE_Y_MAX, axis: 'Y' },
  ],
  motion_setx: [{ input: 'X', max: STAGE_X_MAX, axis: 'X' }],
  motion_sety: [{ input: 'Y', max: STAGE_Y_MAX, axis: 'Y' }],
};

function getLiteralNumber(
  block: { inputs: Record<string, [number, string | [number, string | null] | null]> },
  inputName: string,
): number | null {
  const input = block.inputs[inputName];
  if (!input) return null;
  const ref = input[1];
  // Literal number: [4, valueString]
  if (Array.isArray(ref) && ref[0] === 4 && typeof ref[1] === 'string') {
    const n = parseFloat(ref[1]);
    return isNaN(n) ? null : n;
  }
  return null;
}

export function checkCoordinateBounds(target: ScratchTarget): Finding[] {
  const findings: Finding[] = [];
  for (const [id, block] of Object.entries(target.blocks)) {
    const checks = COORD_OPCODES[block.opcode];
    if (!checks) continue;
    for (const { input, max, axis } of checks) {
      const val = getLiteralNumber(block, input);
      if (val !== null && Math.abs(val) > max) {
        findings.push({
          dimension: 'correctness',
          severity: 'warning',
          source: 'rule-based',
          sprite: target.name,
          title: `Out-of-Bounds ${axis} Coordinate`,
          description: `${axis} = ${val} is outside the stage boundary (±${max}), placing the sprite off-screen where it cannot be seen.`,
          fix: `Use a value between -${max} and ${max}.`,
          blockId: id,
        });
      }
    }
  }
  return findings;
}
