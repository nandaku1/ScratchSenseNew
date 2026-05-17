// STAGE 4 — shared fixture builders for all test suites

import { ScratchBlock, ScratchProject, ScratchTarget } from '@types';

let _idCounter = 0;

export function freshId(): string {
  return `block_${++_idCounter}`;
}

export function resetIds(): void {
  _idCounter = 0;
}

export function makeBlock(overrides: Partial<ScratchBlock> = {}): ScratchBlock {
  return {
    opcode: 'operator_add',
    next: null,
    parent: null,
    inputs: {},
    fields: {},
    shadow: false,
    topLevel: false,
    ...overrides,
  };
}

export function makeHatBlock(id: string, nextId?: string): ScratchBlock {
  return makeBlock({
    opcode: 'event_whenflagclicked',
    next: nextId ?? null,
    topLevel: true,
  });
}

export function makeFloatingBlock(id: string): ScratchBlock {
  void id;
  return makeBlock({ opcode: 'operator_add', topLevel: true });
}

export function makeForeverBlock(substackId?: string): ScratchBlock {
  return makeBlock({
    opcode: 'control_forever',
    inputs: substackId ? { SUBSTACK: [2, substackId] } : {},
  });
}

export function makeStopBlock(option: string = 'all'): ScratchBlock {
  return makeBlock({
    opcode: 'control_stop',
    fields: { STOP_OPTION: [option, null] },
  });
}

export function makeWaitBlock(): ScratchBlock {
  return makeBlock({
    opcode: 'control_wait',
    inputs: { DURATION: [1, [4, '1']] },
  });
}

export function makeIfBlock(substackId?: string): ScratchBlock {
  return makeBlock({
    opcode: 'control_if',
    inputs: substackId ? { SUBSTACK: [2, substackId] } : {},
  });
}

export function makeSetVariableBlock(varName: string, varId: string): ScratchBlock {
  return makeBlock({
    opcode: 'data_setvariableto',
    fields: { VARIABLE: [varName, varId] },
  });
}

export function makeVariableReporter(varName: string, varId: string): ScratchBlock {
  return makeBlock({
    opcode: 'data_variable',
    fields: { VARIABLE: [varName, varId] },
    shadow: false,
    topLevel: false,
  });
}

export function makeRepeatBlock(
  count: number,
  substackId?: string,
  nextId?: string,
): ScratchBlock {
  return makeBlock({
    opcode: 'control_repeat',
    next: nextId ?? null,
    inputs: {
      TIMES: [1, [4, String(count)]],
      ...(substackId ? { SUBSTACK: [2, substackId] } : {}),
    },
  });
}

export function makeBroadcastBlock(name: string, id: string, reporterBlockId: string): ScratchBlock {
  void id;
  return makeBlock({
    opcode: 'event_broadcast',
    inputs: { BROADCAST_INPUT: [1, reporterBlockId] },
    fields: { BROADCAST_OPTION: [name, id] },
  });
}

export function makeBroadcastReporter(name: string, id: string): ScratchBlock {
  return makeBlock({
    opcode: 'event_broadcast_menu',
    fields: { BROADCAST_OPTION: [name, id] },
    shadow: true,
  });
}

export function makeBroadcastReceiveHat(name: string, id: string): ScratchBlock {
  void id;
  return makeBlock({
    opcode: 'event_whenbroadcastreceived',
    fields: { BROADCAST_OPTION: [name, null] },
    topLevel: true,
  });
}

export function makeTarget(overrides: Partial<ScratchTarget> = {}): ScratchTarget {
  return {
    name: 'Sprite1',
    isStage: false,
    blocks: {},
    variables: {},
    lists: {},
    broadcasts: {},
    ...overrides,
  };
}

export function makeStage(overrides: Partial<ScratchTarget> = {}): ScratchTarget {
  return makeTarget({ name: 'Stage', isStage: true, ...overrides });
}

export function makeProject(targets: ScratchTarget[] = []): ScratchProject {
  return { targets: [makeStage(), ...targets] };
}
