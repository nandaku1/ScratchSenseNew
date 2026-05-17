/**
 * Flags equality/comparison operators (=, >, <) where both operands are
 * literal values. A literal-vs-literal comparison is always true or always
 * false, indicating a logic error (likely a missing variable reference on
 * one side).
 *
 * Source: Frädrich et al. (2020) "Common Bugs in Scratch Programs" —
 *   "Comparing Literals" (1999 projects)
 */

import { Finding, ScratchBlock, ScratchTarget } from '@types';

const COMPARISON_OPCODES = new Set(['operator_equals', 'operator_gt', 'operator_lt']);

function isLiteralInput(block: ScratchBlock, inputName: string): boolean {
  const input = block.inputs[inputName];
  if (!input) return false;
  const ref = input[1];
  return Array.isArray(ref) && ref[1] !== null;
}

export function checkComparingLiterals(target: ScratchTarget): Finding[] {
  const findings: Finding[] = [];

  for (const [id, block] of Object.entries(target.blocks)) {
    if (!COMPARISON_OPCODES.has(block.opcode)) continue;
    if (!isLiteralInput(block, 'OPERAND1')) continue;
    if (!isLiteralInput(block, 'OPERAND2')) continue;

    findings.push({
      dimension: 'correctness',
      severity: 'warning',
      source: 'rule-based',
      sprite: target.name,
      title: 'Comparing Two Literals',
      description:
        'Both sides of this comparison are fixed values, so the result is always the same (always true or always false). This is likely a mistake — one side should be a variable or reporter.',
      fix: 'Replace one of the literal values with the variable or sensor value you want to compare against.',
      blockId: id,
    });
  }

  return findings;
}
