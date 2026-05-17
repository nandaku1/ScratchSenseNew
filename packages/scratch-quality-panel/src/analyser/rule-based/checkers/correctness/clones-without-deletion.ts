// STAGE 6 — cross-sprite: flags targets that create clones but never delete them

import { Finding, ScratchTarget } from '@types';

export function checkClonesWithoutDeletion(targets: ScratchTarget[]): Finding[] {
  const findings: Finding[] = [];
  const projectHasDeletion = targets.some((t) =>
    Object.values(t.blocks).some((b) => b.opcode === 'control_delete_this_clone'),
  );

  for (const target of targets) {
    const createsClone = Object.values(target.blocks).some(
      (b) => b.opcode === 'control_create_clone_of',
    );
    if (createsClone && !projectHasDeletion) {
      findings.push({
        dimension: 'correctness',
        severity: 'warning',
        source: 'rule-based',
        sprite: target.name,
        title: 'Clones Never Deleted',
        description: 'Clones pile up because nothing removes them, eventually slowing down or crashing the project.',
        fix: 'Add a "delete this clone" block inside the clone\'s script.',
      });
    }
  }
  return findings;
}
