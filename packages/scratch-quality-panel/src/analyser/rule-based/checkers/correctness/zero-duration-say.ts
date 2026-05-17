// STAGE 7 — flags say-for-secs / think-for-secs with literal 0 duration (invisible to user)

import { Finding, ScratchTarget } from '@types';

const SAY_OPCODES = new Set(['looks_sayforsecs', 'looks_thinkforsecs']);

export function checkZeroDurationSay(target: ScratchTarget): Finding[] {
  const findings: Finding[] = [];
  for (const [id, block] of Object.entries(target.blocks)) {
    if (!SAY_OPCODES.has(block.opcode)) continue;
    const secsInput = block.inputs['SECS'];
    if (!secsInput) continue;
    const ref = secsInput[1];
    // Literal number [4, '0']
    if (Array.isArray(ref) && ref[0] === 4 && ref[1] === '0') {
      findings.push({
        dimension: 'correctness',
        severity: 'warning',
        source: 'rule-based',
        sprite: target.name,
        title: 'Invisible Say/Think Block',
        description: 'A say/think for 0 seconds block flashes too fast to be seen.',
        fix: 'Increase the duration or use a plain "say" block instead.',
        blockId: id,
      });
    }
  }
  return findings;
}
