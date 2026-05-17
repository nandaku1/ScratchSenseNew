// STAGE 9 — flags sprites with too many top-level scripts (god-sprite anti-pattern)

import { Finding, ScratchTarget } from '@types';
import { GOD_SPRITE_SCRIPT_WARNING, GOD_SPRITE_SCRIPT_ERROR } from '@constants';
import { getAllTopLevelHatIds } from '@utils/block-traversal';

export function checkGodSprite(target: ScratchTarget): Finding[] {
  if (target.isStage) return [];
  const count = getAllTopLevelHatIds(target.blocks).length;
  if (count < GOD_SPRITE_SCRIPT_WARNING) return [];
  return [
    {
      dimension: 'maintainability',
      severity: count >= GOD_SPRITE_SCRIPT_ERROR ? 'error' : 'warning',
      source: 'rule-based',
      sprite: target.name,
      title: `God Sprite (${count} Scripts)`,
      description: `This sprite has too many scripts and is doing too much.`,
      fix: `Split its responsibilities across multiple sprites or use custom blocks to organise the logic.`,
    },
  ];
}
