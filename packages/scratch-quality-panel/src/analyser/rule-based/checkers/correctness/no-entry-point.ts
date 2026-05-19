// Cross-sprite: warns when no green flag hat exists anywhere in the project.

import { Finding, ScratchTarget } from '@types';

export function checkNoEntryPoint(targets: ScratchTarget[]): Finding[] {
  if (targets.length === 0) return [];

  const hasFlag = targets.some((t) =>
    Object.values(t.blocks).some(
      (b) => b.opcode === 'event_whenflagclicked' && b.topLevel && !b.shadow,
    ),
  );
  if (hasFlag) return [];
  const stage = targets.find((t) => t.isStage) ?? targets[0];
  if (!stage) return [];
  return [
    {
      dimension: 'correctness',
      severity: 'warning',
      source: 'rule-based',
      sprite: stage.name,
      title: 'No Green Flag Script',
      description:
        'No sprite has a "when green flag clicked" script, so pressing the green flag starts nothing.',
      fix: 'Add a "when green flag clicked" hat block to start your project.',
    },
  ];
}
