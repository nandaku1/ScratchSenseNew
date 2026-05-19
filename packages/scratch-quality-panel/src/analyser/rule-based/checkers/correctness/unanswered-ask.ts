// Cross-sprite: warns when ask-and-wait is used but the answer reporter is never read.

import { Finding, ScratchTarget } from '@types';

export function checkUnansweredAsk(targets: ScratchTarget[]): Finding[] {
  let hasAsk = false;
  let hasAnswer = false;

  for (const target of targets) {
    for (const block of Object.values(target.blocks)) {
      if (block.opcode === 'sensing_askandwait') hasAsk = true;
      if (block.opcode === 'sensing_answer') hasAnswer = true;
    }
  }

  if (!hasAsk || hasAnswer) return [];

  const stage = targets.find((t) => t.isStage) ?? targets[0];
  return [
    {
      dimension: 'correctness',
      severity: 'warning',
      source: 'rule-based',
      sprite: stage?.name ?? 'Stage',
      title: 'Ask Answer Never Read',
      description: 'A question is asked but the answer is never read, so whatever the user types is thrown away.',
      fix: 'Use the "answer" reporter block after asking.',
    },
  ];
}
