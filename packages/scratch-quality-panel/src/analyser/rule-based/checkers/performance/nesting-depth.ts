// STAGE 8 — flags deeply nested control blocks; detects nested-repeat products

import { Finding, ScratchBlock, ScratchTarget } from '@types';
import { CONTROL_OPCODES, NESTING_DEPTH_WARNING, NESTING_DEPTH_ERROR } from '@constants';
import { getInputBlockId, getAllTopLevelHatIds } from '@utils/block-traversal';

// Returns the repeat count from the TIMES input as a number, or null if not a literal
function getRepeatCount(block: ScratchBlock): number | null {
  const timesInput = block.inputs['TIMES'];
  if (!timesInput) return null;
  const ref = timesInput[1];
  if (Array.isArray(ref) && ref[0] === 4 && typeof ref[1] === 'string') {
    const n = parseInt(ref[1], 10);
    return isNaN(n) ? null : n;
  }
  return null;
}

// Returns array of repeat counts if subtree is purely nested repeats, else null
function findNestedRepeatChain(
  blockId: string,
  blocks: Record<string, ScratchBlock>,
): number[] | null {
  const block = blocks[blockId];
  if (!block || block.opcode !== 'control_repeat') return null;
  const count = getRepeatCount(block);
  if (count === null) return null;
  const substackId = getInputBlockId(block, 'SUBSTACK');
  if (!substackId) return [count];
  const inner = findNestedRepeatChain(substackId, blocks);
  if (inner === null) return null;
  return [count, ...inner];
}

function dfs(
  blockId: string,
  blocks: Record<string, ScratchBlock>,
  depth: number,
  maxDepth: { value: number },
  visited: Set<string>,
): void {
  if (visited.has(blockId)) return;
  visited.add(blockId);
  const block = blocks[blockId];
  if (!block) return;

  if (CONTROL_OPCODES.has(block.opcode)) {
    const newDepth = depth + 1;
    if (newDepth > maxDepth.value) maxDepth.value = newDepth;
    const substackId = getInputBlockId(block, 'SUBSTACK');
    if (substackId) dfs(substackId, blocks, newDepth, maxDepth, visited);
    const substack2Id = getInputBlockId(block, 'SUBSTACK2');
    if (substack2Id) dfs(substack2Id, blocks, newDepth, maxDepth, visited);
  }

  if (block.next) dfs(block.next, blocks, depth, maxDepth, visited);
}

export function checkNestingDepth(target: ScratchTarget): Finding[] {
  const findings: Finding[] = [];
  const hatIds = getAllTopLevelHatIds(target.blocks);

  for (const hatId of hatIds) {
    const hat = target.blocks[hatId];
    if (!hat?.next) continue;

    const maxDepth = { value: 0 };
    dfs(hat.next, target.blocks, 0, maxDepth, new Set());

    if (maxDepth.value < NESTING_DEPTH_WARNING) continue;

    // Check for pure nested-repeat chain for special product message
    const chain = findNestedRepeatChain(hat.next, target.blocks);
    let title: string;
    let description: string;
    let fix: string;
    if (chain && chain.length > 1) {
      const product = chain.reduce((a, b) => a * b, 1);
      title = `Deeply Nested Loops (${chain.join('×')})`;
      description = `These nested repeats execute ${product.toLocaleString()} times total and may cause lag.`;
      fix = `Reduce the iterations or refactor the logic.`;
    } else {
      title = `Deep Nesting (Depth ${maxDepth.value})`;
      description = `Deeply nested control blocks are hard to read and debug.`;
      fix = `Split the logic into custom blocks.`;
    }

    findings.push({
      dimension: 'performance',
      severity: maxDepth.value >= NESTING_DEPTH_ERROR ? 'error' : 'warning',
      source: 'rule-based',
      sprite: target.name,
      title,
      description,
      fix,
      blockId: hatId,
    });
  }
  return findings;
}
