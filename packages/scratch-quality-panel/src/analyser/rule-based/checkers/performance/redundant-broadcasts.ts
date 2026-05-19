// Cross-sprite: flags broadcasts sent with no matching receiver, and receivers with no matching send.

import { Finding, ScratchBlock, ScratchTarget } from '@types';
import { BROADCAST_SEND_OPCODES, BROADCAST_RECEIVE_OPCODE } from '@constants';
import { getInputBlockId } from '@utils/block-traversal';

function getBroadcastName(
  block: ScratchBlock,
  blocks: Record<string, ScratchBlock>,
): string | null {
  // Sender: BROADCAST_INPUT → child event_broadcast_menu → BROADCAST_OPTION field
  const menuId = getInputBlockId(block, 'BROADCAST_INPUT');
  if (menuId) {
    const menuBlock = blocks[menuId];
    if (menuBlock?.opcode === 'event_broadcast_menu') {
      return menuBlock.fields['BROADCAST_OPTION']?.[0] ?? null;
    }
  }
  return null;
}

export function checkRedundantBroadcasts(targets: ScratchTarget[]): Finding[] {
  const sent = new Set<string>();
  const received = new Set<string>();

  for (const target of targets) {
    for (const block of Object.values(target.blocks)) {
      if (BROADCAST_SEND_OPCODES.has(block.opcode)) {
        const name = getBroadcastName(block, target.blocks);
        if (name) sent.add(name);
      }
      if (block.opcode === BROADCAST_RECEIVE_OPCODE) {
        const name = block.fields['BROADCAST_OPTION']?.[0];
        if (name) received.add(name);
      }
    }
  }

  const findings: Finding[] = [];
  const stage = targets.find((t) => t.isStage) ?? targets[0];
  const spriteName = stage?.name ?? 'Stage';

  for (const name of sent) {
    if (!received.has(name)) {
      findings.push({
        dimension: 'performance',
        severity: 'warning',
        source: 'rule-based',
        sprite: spriteName,
        title: `Unheard Broadcast "${name}"`,
        description: `Broadcast "${name}" is never received — no sprite has a matching "when I receive" script.`,
        fix: `Add a "when I receive ${name}" script or remove the send.`,
      });
    }
  }
  for (const name of received) {
    if (!sent.has(name)) {
      findings.push({
        dimension: 'performance',
        severity: 'warning',
        source: 'rule-based',
        sprite: spriteName,
        title: `Unreceivable Broadcast "${name}"`,
        description: `This script listens for a broadcast that is never sent anywhere, so it will never run.`,
        fix: `Add a "broadcast ${name}" block or remove the receiver.`,
      });
    }
  }
  return findings;
}
