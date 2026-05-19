// Flags hat scripts whose block count exceeds the warning/error thresholds defined in constants.

import { Finding, ScratchTarget } from '@types';
import { SCRIPT_LENGTH_WARNING, SCRIPT_LENGTH_ERROR } from '@constants';
import { getAllTopLevelHatIds, countBlocksInSubtree } from '@utils/block-traversal';

export function checkScriptLength(target: ScratchTarget): Finding[] {
  const findings: Finding[] = [];
  for (const hatId of getAllTopLevelHatIds(target.blocks)) {
    const hat = target.blocks[hatId];
    if (!hat?.next) continue;
    const count = countBlocksInSubtree(hat.next, target.blocks);
    if (count < SCRIPT_LENGTH_WARNING) continue;
    findings.push({
      dimension: 'maintainability',
      severity: count >= SCRIPT_LENGTH_ERROR ? 'error' : 'warning',
      source: 'rule-based',
      sprite: target.name,
      title: `Script Too Long (${count} Blocks)`,
      description: `Scripts this long are hard to read and maintain.`,
      fix: `Break it up using custom blocks.`,
      blockId: hatId,
    });
  }
  return findings;
}
