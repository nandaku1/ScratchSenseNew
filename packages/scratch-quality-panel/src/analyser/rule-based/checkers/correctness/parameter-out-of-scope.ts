/**
 * Flags custom-block argument reporters used outside of a "define" block
 * (procedures_definition) subtree. In Scratch, parameter reporters are only
 * meaningful inside the block that defines them; used elsewhere they always
 * return 0 or an empty string.
 *
 * Source: Frädrich et al. (2020) "Common Bugs in Scratch Programs" —
 *   "Parameter Out of Scope" (461 projects)
 */

import { Finding, ScratchTarget } from '@types';
import { hasAncestorWithOpcode } from '@utils/block-traversal';

const ARGUMENT_REPORTER_OPCODES = new Set([
  'argument_reporter_string_number',
  'argument_reporter_boolean',
]);

const DEFINITION_OPCODE = new Set(['procedures_definition']);

export function checkParameterOutOfScope(target: ScratchTarget): Finding[] {
  const findings: Finding[] = [];

  for (const [id, block] of Object.entries(target.blocks)) {
    if (!ARGUMENT_REPORTER_OPCODES.has(block.opcode)) continue;
    if (hasAncestorWithOpcode(id, target.blocks, DEFINITION_OPCODE)) continue;

    const paramName =
      (block.fields['VALUE'] ?? block.fields['value'])?.[0] ?? 'parameter';

    findings.push({
      dimension: 'correctness',
      severity: 'error',
      source: 'rule-based',
      sprite: target.name,
      title: 'Parameter Used Outside Block',
      description: `The "${paramName}" argument reporter is used outside a custom block definition. Custom block parameters only hold a value inside the "define" body — outside it, they return 0 or an empty string.`,
      fix: `Move this reporter inside the "define (custom block)" body, or use a variable to pass the value to code outside the custom block.`,
      blockId: id,
    });
  }

  return findings;
}
