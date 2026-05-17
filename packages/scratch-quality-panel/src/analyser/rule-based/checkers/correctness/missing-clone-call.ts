/**
 * Flags sprites that have a "when I start as a clone" hat block but are
 * never cloned by any "create clone of" block in the project. The handler
 * can therefore never trigger.
 *
 * Source: Frädrich et al. (2020) "Common Bugs in Scratch Programs" —
 *   "Missing Clone Call" (625 projects)
 */

import { Finding, ScratchTarget } from '@types';

function resolveCloneTarget(
  block: { inputs: Record<string, [number, string | [number, string | null] | null]> },
  blocks: ScratchTarget['blocks'],
  ownerName: string,
): string | null {
  const input = block.inputs['CLONE_OPTION'];
  if (!input) return null;
  const ref = input[1];
  if (typeof ref !== 'string') return null;
  const menuBlock = blocks[ref];
  if (!menuBlock || !menuBlock.shadow) return null;
  const field = menuBlock.fields['CLONE_OPTION'];
  if (!field || typeof field[0] !== 'string') return null;
  return field[0] === '_myself_' ? ownerName : field[0];
}

export function checkMissingCloneCall(targets: ScratchTarget[]): Finding[] {
  // Collect all sprite names that are ever the target of a create-clone call
  const clonedSprites = new Set<string>();
  for (const target of targets) {
    for (const [, block] of Object.entries(target.blocks)) {
      if (block.opcode !== 'control_create_clone_of') continue;
      const cloneTarget = resolveCloneTarget(block, target.blocks, target.name);
      if (cloneTarget) clonedSprites.add(cloneTarget);
    }
  }

  const findings: Finding[] = [];
  for (const target of targets) {
    if (target.isStage) continue;
    const hasCloneHandler = Object.values(target.blocks).some(
      b => b.opcode === 'control_start_as_clone',
    );
    if (!hasCloneHandler) continue;
    if (clonedSprites.has(target.name)) continue;

    findings.push({
      dimension: 'correctness',
      severity: 'error',
      source: 'rule-based',
      sprite: target.name,
      title: 'Clone Handler Never Triggered',
      description: `"${target.name}" has a "when I start as a clone" script, but no "create clone of ${target.name}" block exists anywhere in the project. The script will never run.`,
      fix: `Add a "create clone of ${target.name}" (or "create clone of myself" inside ${target.name}) block to the script that should spawn clones.`,
    });
  }

  return findings;
}
