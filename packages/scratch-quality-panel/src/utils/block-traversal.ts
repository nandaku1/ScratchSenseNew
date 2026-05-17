// STAGE 3 — pure block traversal helpers shared by multiple checkers

import { ScratchBlock, ScratchTarget } from '@types';
import { HAT_OPCODES } from '@constants';

export function getInputBlockId(block: ScratchBlock, inputName: string): string | null {
  const input = block.inputs[inputName];
  if (!input) return null;
  const ref = input[1];
  if (typeof ref === 'string') return ref;
  return null;
}

export function subtreeContainsOpcode(
  startBlockId: string,
  blocks: Record<string, ScratchBlock>,
  targetOpcodes: Set<string>,
): boolean {
  const visited = new Set<string>();
  const stack = [startBlockId];
  while (stack.length > 0) {
    const id = stack.pop()!;
    if (visited.has(id)) continue;
    visited.add(id);
    const block = blocks[id];
    if (!block) continue;
    if (targetOpcodes.has(block.opcode)) return true;
    if (block.next) stack.push(block.next);
    for (const inputName of Object.keys(block.inputs)) {
      const childId = getInputBlockId(block, inputName);
      if (childId) stack.push(childId);
    }
  }
  return false;
}

export function countBlocksInSubtree(
  startBlockId: string,
  blocks: Record<string, ScratchBlock>,
): number {
  const visited = new Set<string>();
  const stack = [startBlockId];
  let count = 0;
  while (stack.length > 0) {
    const id = stack.pop()!;
    if (visited.has(id)) continue;
    visited.add(id);
    const block = blocks[id];
    if (!block || block.shadow) continue;
    count++;
    if (block.next) stack.push(block.next);
    for (const inputName of Object.keys(block.inputs)) {
      const childId = getInputBlockId(block, inputName);
      if (childId) stack.push(childId);
    }
  }
  return count;
}

export function countBlocksInTarget(target: ScratchTarget): number {
  let count = 0;
  for (const block of Object.values(target.blocks)) {
    if (!block.shadow) count++;
  }
  return count;
}

export function hasAncestorWithOpcode(
  blockId: string,
  blocks: Record<string, ScratchBlock>,
  targetOpcodes: Set<string>,
): boolean {
  const block = blocks[blockId];
  if (!block) return false;
  let parentId = block.parent;
  while (parentId) {
    const parent = blocks[parentId];
    if (!parent) break;
    if (targetOpcodes.has(parent.opcode)) return true;
    parentId = parent.parent;
  }
  return false;
}

export function collectSubtreeIds(
  startId: string,
  blocks: Record<string, ScratchBlock>,
): Set<string> {
  const visited = new Set<string>();
  const stack = [startId];
  while (stack.length > 0) {
    const id = stack.pop()!;
    if (visited.has(id)) continue;
    visited.add(id);
    const block = blocks[id];
    if (!block) continue;
    if (block.next) stack.push(block.next);
    for (const inputName of Object.keys(block.inputs)) {
      const childId = getInputBlockId(block, inputName);
      if (childId) stack.push(childId);
    }
  }
  return visited;
}

export function getAllTopLevelHatIds(blocks: Record<string, ScratchBlock>): string[] {
  const ids: string[] = [];
  for (const [id, block] of Object.entries(blocks)) {
    if (block.topLevel && !block.shadow && HAT_OPCODES.has(block.opcode)) {
      ids.push(id);
    }
  }
  return ids;
}
