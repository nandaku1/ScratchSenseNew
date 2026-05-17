// flags sprites that hide themselves but never show (permanently invisible)

import { Finding, ScratchTarget } from '@types';

export function checkAlwaysHidden(target: ScratchTarget): Finding[] {
  if (target.isStage) return [];

  let hasHide = false;
  let hasShow = false;

  for (const block of Object.values(target.blocks)) {
    if (block.opcode === 'looks_hide') hasHide = true;
    if (block.opcode === 'looks_show') hasShow = true;
    if (hasHide && hasShow) return [];
  }

  if (!hasHide) return [];

  return [
    {
      dimension: 'correctness',
      severity: 'warning',
      source: 'rule-based',
      sprite: target.name,
      title: 'Sprite May Stay Hidden',
      description:
        'This sprite hides itself but never shows again, making it permanently invisible.',
      fix: 'Add a "show" block where the sprite should become visible, or remove the "hide" block.',
    },
  ];
}
