// Flags multiple identical hat triggers on the same sprite.
// Field values are sorted and included in the key so "receive A" and "receive B" are treated as distinct.

import { Finding, ScratchTarget } from '@types';
import { HAT_OPCODES, OPCODE_LABELS } from '@constants';

function hatKey(block: { opcode: string; fields: Record<string, [string, string | null]> }): string {
  // Include field values for event-specific hats so "receive A" and "receive B" are distinct
  const fieldStr = Object.entries(block.fields)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, [v]]) => v)
    .join('|');
  return `${block.opcode}::${fieldStr}`;
}

export function checkDuplicateHatTriggers(target: ScratchTarget): Finding[] {
  const findings: Finding[] = [];
  const seen = new Map<string, string>(); // key → first blockId

  for (const [id, block] of Object.entries(target.blocks)) {
    if (!block.topLevel || block.shadow || !HAT_OPCODES.has(block.opcode)) continue;
    const key = hatKey(block);
    if (seen.has(key)) {
      const label = OPCODE_LABELS[block.opcode] ?? block.opcode;
      findings.push({
        dimension: 'correctness',
        severity: 'warning',
        source: 'rule-based',
        sprite: target.name,
        title: `Duplicate "${label}" Trigger`,
        description: `Multiple "${label}" scripts share this trigger. In Scratch, only one runs per event, so the others may be silently ignored.`,
        fix: `Merge them into one script or remove the duplicate.`,
        blockId: id,
      });
    } else {
      seen.set(key, id);
    }
  }
  return findings;
}
