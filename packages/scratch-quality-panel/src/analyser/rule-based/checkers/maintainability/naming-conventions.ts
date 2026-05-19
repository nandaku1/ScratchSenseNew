// Flags generic/single-letter variable names, default sprite names, and declared-but-unused variables.

import { Finding, ScratchTarget } from '@types';
import {
  POOR_VARIABLE_NAMES,
  SINGLE_LETTER_BAD_REGEX,
  DEFAULT_SPRITE_NAME_REGEX,
} from '@constants';

// Searches ALL targets, not just the current sprite, because global variables are accessible
// cross-sprite and may only be referenced in a different sprite's blocks.
function getAllVarIdsInBlocks(targets: ScratchTarget[]): Set<string> {
  const ids = new Set<string>();
  for (const target of targets) {
    for (const block of Object.values(target.blocks)) {
      const varField = block.fields['VARIABLE'];
      if (varField?.[1]) ids.add(varField[1]);
    }
  }
  return ids;
}

export function checkNamingConventions(
  target: ScratchTarget,
  allTargets: ScratchTarget[],
): Finding[] {
  const findings: Finding[] = [];
  const usedVarIds = getAllVarIdsInBlocks(allTargets);

  for (const [varId, [varName]] of Object.entries(target.variables)) {
    if (POOR_VARIABLE_NAMES.has(varName.toLowerCase())) {
      findings.push({
        dimension: 'maintainability',
        severity: 'warning',
        source: 'rule-based',
        sprite: target.name,
        title: `Generic Variable Name "${varName}"`,
        description: `"${varName}" is too generic to explain what it stores.`,
        fix: `Rename it to something descriptive that reflects its purpose.`,
      });
    } else if (SINGLE_LETTER_BAD_REGEX.test(varName)) {
      findings.push({
        dimension: 'maintainability',
        severity: 'info',
        source: 'rule-based',
        sprite: target.name,
        title: `Single-Letter Variable "${varName}"`,
        description: `A single-letter name doesn't explain what this value represents.`,
        fix: `Use a more descriptive name.`,
      });
    }

    if (!usedVarIds.has(varId)) {
      findings.push({
        dimension: 'maintainability',
        severity: 'info',
        source: 'rule-based',
        sprite: target.name,
        title: `Unused Variable "${varName}"`,
        description: `Defined but never used in any block.`,
        fix: `Remove it or start using it.`,
      });
    }
  }

  if (!target.isStage && DEFAULT_SPRITE_NAME_REGEX.test(target.name)) {
    findings.push({
      dimension: 'maintainability',
      severity: 'info',
      source: 'rule-based',
      sprite: target.name,
      title: `Default Sprite Name "${target.name}"`,
      description: `"${target.name}" is a default name that doesn't describe this sprite's role.`,
      fix: `Give it a descriptive name that matches what it does.`,
    });
  }

  return findings;
}
