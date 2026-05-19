// Flags broadcast blocks inside tight loops with no wait block (floods the event queue).

import { Finding, ScratchTarget } from '@types';
import { BROADCAST_SEND_OPCODES, LOOP_OPCODES, WAIT_OPCODE } from '@constants';
import { getInputBlockId, subtreeContainsOpcode } from '@utils/block-traversal';

export function checkBroadcastInLoop(target: ScratchTarget): Finding[] {
  const findings: Finding[] = [];
  for (const [id, block] of Object.entries(target.blocks)) {
    if (!LOOP_OPCODES.has(block.opcode)) continue;
    const substackId = getInputBlockId(block, 'SUBSTACK');
    if (!substackId) continue;
    const hasBroadcast = subtreeContainsOpcode(substackId, target.blocks, BROADCAST_SEND_OPCODES);
    if (!hasBroadcast) continue;
    const hasWait = subtreeContainsOpcode(substackId, target.blocks, new Set([WAIT_OPCODE]));
    if (hasWait) continue;
    findings.push({
      dimension: 'performance',
      severity: 'warning',
      source: 'rule-based',
      sprite: target.name,
      title: 'Broadcast in Tight Loop',
      description:
        'A broadcast fires inside a loop with no wait block, flooding the event queue every frame and causing lag.',
      fix: 'Add a "wait" block inside the loop, or move the broadcast outside of it.',
      blockId: id,
    });
  }
  return findings;
}
