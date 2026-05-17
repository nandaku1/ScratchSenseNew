// per-sprite: flags clone-running sprites that never delete themselves

import { Finding, ScratchTarget } from '@types';

const START_AS_CLONE = 'control_start_as_clone';
const DELETE_THIS_CLONE = 'control_delete_this_clone';

export function checkCloneNoSelfDeletion(target: ScratchTarget): Finding[] {
  if (target.isStage) return [];

  let hasCloneHat = false;
  let hasSelfDelete = false;

  for (const block of Object.values(target.blocks)) {
    if (block.opcode === START_AS_CLONE && block.topLevel) hasCloneHat = true;
    if (block.opcode === DELETE_THIS_CLONE) hasSelfDelete = true;
    if (hasCloneHat && hasSelfDelete) return [];
  }

  if (!hasCloneHat) return [];

  return [
    {
      dimension: 'correctness',
      severity: 'warning',
      source: 'rule-based',
      sprite: target.name,
      title: 'Clone Never Deletes Itself',
      description:
        'This sprite runs code as a clone but never deletes itself, so clones build up until the project slows to a halt.',
      fix: 'Add a "delete this clone" block when the clone has finished its work.',
    },
  ];
}
