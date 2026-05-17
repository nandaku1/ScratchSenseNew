// STAGE 6 — flags create-clone calls inside start-as-clone scripts (exponential clone creation)

import { Finding, ScratchTarget } from '@types';
import { subtreeContainsOpcode } from '@utils/block-traversal';

const START_AS_CLONE = 'control_start_as_clone';
const CREATE_CLONE = 'control_create_clone_of';

export function checkCloneBomb(target: ScratchTarget): Finding[] {
  const findings: Finding[] = [];
  for (const [id, block] of Object.entries(target.blocks)) {
    if (block.opcode !== START_AS_CLONE || !block.topLevel) continue;
    if (block.next && subtreeContainsOpcode(block.next, target.blocks, new Set([CREATE_CLONE]))) {
      findings.push({
        dimension: 'correctness',
        severity: 'error',
        source: 'rule-based',
        sprite: target.name,
        title: 'Exponential Clone Growth',
        description: 'Each new clone creates even more clones, growing exponentially until the project crashes.',
        fix: 'Remove the "create clone" block from inside clone scripts.',
        blockId: id,
      });
    }
  }
  return findings;
}
