// STAGE 9 — flags custom block definitions that are never called (and calls with no definition)
//
// "Call without definition" pattern added per:
//   Frädrich et al. (2020) "Common Bugs in Scratch Programs" (164 projects)

import { Finding, ScratchTarget } from '@types';

export function checkDeadCustomBlocks(target: ScratchTarget): Finding[] {
  const findings: Finding[] = [];
  const calledProcCodes = new Set<string>();
  const definedProcCodes = new Set<string>();

  for (const block of Object.values(target.blocks)) {
    if (block.opcode === 'procedures_call' && block.mutation?.['proccode']) {
      calledProcCodes.add(block.mutation['proccode']);
    }
    if (block.opcode === 'procedures_definition' && block.mutation?.['proccode']) {
      definedProcCodes.add(block.mutation['proccode']);
    }
  }

  for (const [id, block] of Object.entries(target.blocks)) {
    if (block.opcode === 'procedures_definition' && block.mutation?.['proccode']) {
      if (!calledProcCodes.has(block.mutation['proccode'])) {
        findings.push({
          dimension: 'maintainability',
          severity: 'info',
          source: 'rule-based',
          sprite: target.name,
          title: `Unused Custom Block`,
          description: `"${block.mutation['proccode']}" is defined but never called anywhere in this sprite.`,
          fix: `Remove the custom block or add a call to it where needed.`,
          blockId: id,
        });
      }
    }
    if (block.opcode === 'procedures_call' && block.mutation?.['proccode']) {
      if (!definedProcCodes.has(block.mutation['proccode'])) {
        findings.push({
          dimension: 'correctness',
          severity: 'error',
          source: 'rule-based',
          sprite: target.name,
          title: `Missing Custom Block Definition`,
          description: `"${block.mutation['proccode']}" is called but has no "define" block in this sprite. The call will do nothing.`,
          fix: `Add a "define ${block.mutation['proccode']}" block and implement its body, or remove the call.`,
          blockId: id,
        });
      }
    }
  }
  return findings;
}
