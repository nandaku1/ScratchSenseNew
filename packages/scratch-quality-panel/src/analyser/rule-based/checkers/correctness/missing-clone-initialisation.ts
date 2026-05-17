/**
 * Flags "create clone of" calls where the target sprite has no
 * "when I start as a clone" handler. The clone spawns but immediately does
 * nothing because there is no initialisation script.
 *
 * Source: Frädrich et al. (2020) "Common Bugs in Scratch Programs" —
 *   "Missing Clone Initialisation" (1691 projects)
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

export function checkMissingCloneInitialisation(targets: ScratchTarget[]): Finding[] {
  // Sprites that have a when-I-start-as-a-clone handler
  const spritesWithHandler = new Set(
    targets
      .filter(t => !t.isStage && Object.values(t.blocks).some(b => b.opcode === 'control_start_as_clone'))
      .map(t => t.name),
  );

  // Track which (createSite, cloneTarget) pairs we've already flagged to avoid duplicates
  const flagged = new Set<string>();
  const findings: Finding[] = [];

  for (const target of targets) {
    for (const [id, block] of Object.entries(target.blocks)) {
      if (block.opcode !== 'control_create_clone_of') continue;
      const cloneTarget = resolveCloneTarget(block, target.blocks, target.name);
      if (!cloneTarget) continue;
      if (spritesWithHandler.has(cloneTarget)) continue;
      if (flagged.has(cloneTarget)) continue;
      flagged.add(cloneTarget);

      findings.push({
        dimension: 'correctness',
        severity: 'warning',
        source: 'rule-based',
        sprite: target.name,
        title: 'Clone Has No Initialisation',
        description: `A clone of "${cloneTarget}" is created, but "${cloneTarget}" has no "when I start as a clone" script. The clone will appear but do nothing.`,
        fix: `Add a "when I start as a clone" hat block to "${cloneTarget}" and write the behaviour each clone should perform (move, look, interact, etc.).`,
        blockId: id,
      });
    }
  }

  return findings;
}
