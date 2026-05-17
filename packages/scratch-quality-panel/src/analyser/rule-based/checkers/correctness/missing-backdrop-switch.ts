/**
 * Flags "when backdrop switches to X" hat blocks where no script in the
 * project ever switches to backdrop X using a static backdrop selection.
 * The handler can therefore never trigger.
 *
 * Only considers static (menu-picked) backdrop arguments; dynamic reporter
 * inputs are skipped conservatively.
 *
 * Source: Frädrich et al. (2020) "Common Bugs in Scratch Programs" —
 *   "Missing Backdrop Switch" (903 projects, failure rate 7/8)
 */

import { Finding, ScratchTarget } from '@types';

const SWITCH_OPCODES = new Set(['looks_switchbackdropto', 'looks_switchbackdroptoandwait']);

function getSentBackdrops(targets: ScratchTarget[]): Set<string> {
  const sent = new Set<string>();
  for (const target of targets) {
    for (const [, block] of Object.entries(target.blocks)) {
      if (!SWITCH_OPCODES.has(block.opcode)) continue;
      // Input BACKDROP may point to a shadow menu block (looks_backdrop)
      const backdropInput = block.inputs['BACKDROP'];
      if (!backdropInput) continue;
      const ref = backdropInput[1];
      if (typeof ref !== 'string') continue;
      const shadowBlock = target.blocks[ref];
      if (!shadowBlock || !shadowBlock.shadow) continue;
      const field = shadowBlock.fields['BACKDROP'];
      if (field && typeof field[0] === 'string') {
        sent.add(field[0].toLowerCase().trim());
      }
    }
  }
  return sent;
}

export function checkMissingBackdropSwitch(targets: ScratchTarget[]): Finding[] {
  const sentBackdrops = getSentBackdrops(targets);
  const findings: Finding[] = [];

  for (const target of targets) {
    for (const [id, block] of Object.entries(target.blocks)) {
      if (block.opcode !== 'event_whenbackdropswitchesto') continue;
      const field = block.fields['BACKDROP'];
      if (!field || typeof field[0] !== 'string') continue;
      const backdropName = field[0];
      if (sentBackdrops.has(backdropName.toLowerCase().trim())) continue;
      findings.push({
        dimension: 'correctness',
        severity: 'error',
        source: 'rule-based',
        sprite: target.name,
        title: 'Backdrop Never Switched To',
        description: `This script triggers "when backdrop switches to ${backdropName}", but no script in the project ever switches to that backdrop. The handler will never run.`,
        fix: `Add a "switch backdrop to ${backdropName}" block in the appropriate script so this handler can trigger.`,
        blockId: id,
      });
    }
  }

  return findings;
}
