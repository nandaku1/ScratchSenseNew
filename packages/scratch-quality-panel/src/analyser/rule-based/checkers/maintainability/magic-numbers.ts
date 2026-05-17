// STAGE 9 — flags literal numbers repeated 3+ times (should be named variables)

import { Finding, ScratchTarget } from '@types';
import { MAGIC_NUMBER_MIN_OCCURRENCES, MAGIC_NUMBER_EXEMPT } from '@constants';

export function checkMagicNumbers(target: ScratchTarget): Finding[] {
  const counts = new Map<number, number>();

  for (const block of Object.values(target.blocks)) {
    for (const input of Object.values(block.inputs)) {
      const ref = input[1];
      // Literal number token: [4, valueString]
      if (Array.isArray(ref) && ref[0] === 4 && typeof ref[1] === 'string') {
        const n = parseFloat(ref[1]);
        if (!isNaN(n)) counts.set(n, (counts.get(n) ?? 0) + 1);
      }
    }
  }

  const findings: Finding[] = [];
  for (const [num, count] of counts) {
    if (count >= MAGIC_NUMBER_MIN_OCCURRENCES && !MAGIC_NUMBER_EXEMPT.has(num)) {
      findings.push({
        dimension: 'maintainability',
        severity: 'info',
        source: 'rule-based',
        sprite: target.name,
        title: `Magic Number: ${num}`,
        description: `The number ${num} appears ${count} times as a raw value with no name to explain what it represents.`,
        fix: `Store it in a named variable so its purpose is obvious and updates stay consistent.`,
      });
    }
  }
  return findings;
}
