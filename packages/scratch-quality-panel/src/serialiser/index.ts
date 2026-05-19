// Converts the sb3 block graph to human-readable pseudocode for LLM input.

import { ScratchProject, ScratchTarget, ScratchBlock } from '@types';

type BlockMap = Record<string, ScratchBlock>;

function getInputValue(block: ScratchBlock, inputName: string, blocks: BlockMap): string {
  const input = block.inputs[inputName];
  if (!input) return '?';
  const ref = input[1];
  if (!ref) return '?';
  if (typeof ref === 'string') {
    // ref is a block ID
    const nested = blocks[ref];
    if (!nested) return '?';
    return `(${describeBlock(nested, blocks)})`;
  }
  if (Array.isArray(ref)) {
    // [type, value] literal — types: 4=number, 5=positive-number, 6=positive-integer,
    // 7=integer, 8=angle, 9=color, 10=string, 11=broadcast, 12=variable, 13=list
    const val = ref[1];
    if (val === null || val === undefined) return '?';
    return String(val);
  }
  return '?';
}

function describeBlock(block: ScratchBlock, blocks: BlockMap): string {
  const op = block.opcode;

  // Events
  if (op === 'event_whenflagclicked') return 'when green flag clicked';
  if (op === 'event_whenkeypressed') {
    const key = block.fields['KEY_OPTION']?.[0] ?? '?';
    return `when [${key}] key pressed`;
  }
  if (op === 'event_whenthisspriteclicked') return 'when this sprite clicked';
  if (op === 'event_whenstageclicked') return 'when stage clicked';
  if (op === 'event_whenbackdropswitchesto') {
    const backdrop = block.fields['BACKDROP']?.[0] ?? '?';
    return `when backdrop switches to [${backdrop}]`;
  }
  if (op === 'event_whengreaterthan') {
    const sensor = block.fields['WHENGREATERTHANMENU']?.[0] ?? '?';
    const val = getInputValue(block, 'VALUE', blocks);
    return `when ${sensor} > (${val})`;
  }
  if (op === 'event_whenbroadcastreceived') {
    const msg = block.fields['BROADCAST_OPTION']?.[0] ?? '?';
    return `when I receive [${msg}]`;
  }
  if (op === 'event_broadcast') {
    const msg = getInputValue(block, 'BROADCAST_INPUT', blocks);
    return `broadcast [${msg}]`;
  }
  if (op === 'event_broadcastandwait') {
    const msg = getInputValue(block, 'BROADCAST_INPUT', blocks);
    return `broadcast [${msg}] and wait`;
  }

  // Control
  if (op === 'control_start_as_clone') return 'when I start as a clone';
  if (op === 'control_forever') return 'forever';
  if (op === 'control_if') {
    const cond = getInputValue(block, 'CONDITION', blocks);
    return `if (${cond})`;
  }
  if (op === 'control_if_else') {
    const cond = getInputValue(block, 'CONDITION', blocks);
    return `if (${cond}) / else`;
  }
  if (op === 'control_repeat') {
    const times = getInputValue(block, 'TIMES', blocks);
    return `repeat (${times})`;
  }
  if (op === 'control_repeat_until') {
    const cond = getInputValue(block, 'CONDITION', blocks);
    return `repeat until (${cond})`;
  }
  if (op === 'control_wait') {
    const secs = getInputValue(block, 'DURATION', blocks);
    return `wait (${secs}) seconds`;
  }
  if (op === 'control_wait_until') {
    const cond = getInputValue(block, 'CONDITION', blocks);
    return `wait until (${cond})`;
  }
  if (op === 'control_stop') {
    const opt = block.fields['STOP_OPTION']?.[0] ?? 'all';
    return `stop [${opt}]`;
  }
  if (op === 'control_create_clone_of') {
    const sprite = getInputValue(block, 'CLONE_OPTION', blocks);
    return `create clone of [${sprite}]`;
  }
  if (op === 'control_delete_this_clone') return 'delete this clone';

  // Motion
  if (op === 'motion_movesteps') {
    const steps = getInputValue(block, 'STEPS', blocks);
    return `move (${steps}) steps`;
  }
  if (op === 'motion_turnright') {
    const deg = getInputValue(block, 'DEGREES', blocks);
    return `turn right (${deg}) degrees`;
  }
  if (op === 'motion_turnleft') {
    const deg = getInputValue(block, 'DEGREES', blocks);
    return `turn left (${deg}) degrees`;
  }
  if (op === 'motion_gotoxy') {
    const x = getInputValue(block, 'X', blocks);
    const y = getInputValue(block, 'Y', blocks);
    return `go to x: (${x}) y: (${y})`;
  }
  if (op === 'motion_glideto') {
    const secs = getInputValue(block, 'SECS', blocks);
    const to = getInputValue(block, 'TO', blocks);
    return `glide (${secs}) secs to [${to}]`;
  }
  if (op === 'motion_glidesecstoxy') {
    const secs = getInputValue(block, 'SECS', blocks);
    const x = getInputValue(block, 'X', blocks);
    const y = getInputValue(block, 'Y', blocks);
    return `glide (${secs}) secs to x: (${x}) y: (${y})`;
  }
  if (op === 'motion_xposition') return '(x position)';
  if (op === 'motion_yposition') return '(y position)';
  if (op === 'motion_direction') return '(direction)';

  // Looks
  if (op === 'looks_say') {
    const msg = getInputValue(block, 'MESSAGE', blocks);
    return `say (${msg})`;
  }
  if (op === 'looks_sayforsecs') {
    const msg = getInputValue(block, 'MESSAGE', blocks);
    const secs = getInputValue(block, 'SECS', blocks);
    return `say (${msg}) for (${secs}) seconds`;
  }
  if (op === 'looks_think') {
    const msg = getInputValue(block, 'MESSAGE', blocks);
    return `think (${msg})`;
  }
  if (op === 'looks_thinkforsecs') {
    const msg = getInputValue(block, 'MESSAGE', blocks);
    const secs = getInputValue(block, 'SECS', blocks);
    return `think (${msg}) for (${secs}) seconds`;
  }
  if (op === 'looks_switchcostumeto') {
    const costume = getInputValue(block, 'COSTUME', blocks);
    return `switch costume to [${costume}]`;
  }
  if (op === 'looks_nextcostume') return 'next costume';
  if (op === 'looks_show') return 'show';
  if (op === 'looks_hide') return 'hide';

  // Sound
  if (op === 'sound_play') {
    const sound = getInputValue(block, 'SOUND_MENU', blocks);
    return `start sound [${sound}]`;
  }
  if (op === 'sound_playuntildone') {
    const sound = getInputValue(block, 'SOUND_MENU', blocks);
    return `play sound [${sound}] until done`;
  }
  if (op === 'sound_stopallsounds') return 'stop all sounds';

  // Data
  if (op === 'data_variable') {
    const name = block.fields['VARIABLE']?.[0] ?? '?';
    return `variable: ${name}`;
  }
  if (op === 'data_setvariableto') {
    const name = block.fields['VARIABLE']?.[0] ?? '?';
    const val = getInputValue(block, 'VALUE', blocks);
    return `set [${name}] to (${val})`;
  }
  if (op === 'data_changevariableby') {
    const name = block.fields['VARIABLE']?.[0] ?? '?';
    const val = getInputValue(block, 'VALUE', blocks);
    return `change [${name}] by (${val})`;
  }
  if (op === 'data_showvariable') {
    const name = block.fields['VARIABLE']?.[0] ?? '?';
    return `show variable [${name}]`;
  }
  if (op === 'data_hidevariable') {
    const name = block.fields['VARIABLE']?.[0] ?? '?';
    return `hide variable [${name}]`;
  }
  if (op === 'data_addtolist') {
    const item = getInputValue(block, 'ITEM', blocks);
    const list = block.fields['LIST']?.[0] ?? '?';
    return `add (${item}) to [${list}]`;
  }
  if (op === 'data_deleteoflist') {
    const idx = getInputValue(block, 'INDEX', blocks);
    const list = block.fields['LIST']?.[0] ?? '?';
    return `delete (${idx}) of [${list}]`;
  }
  if (op === 'data_itemoflist') {
    const idx = getInputValue(block, 'INDEX', blocks);
    const list = block.fields['LIST']?.[0] ?? '?';
    return `item (${idx}) of [${list}]`;
  }
  if (op === 'data_lengthoflist') {
    const list = block.fields['LIST']?.[0] ?? '?';
    return `length of [${list}]`;
  }

  // Operators
  if (op === 'operator_add') {
    const a = getInputValue(block, 'NUM1', blocks);
    const b = getInputValue(block, 'NUM2', blocks);
    return `(${a}) + (${b})`;
  }
  if (op === 'operator_subtract') {
    const a = getInputValue(block, 'NUM1', blocks);
    const b = getInputValue(block, 'NUM2', blocks);
    return `(${a}) - (${b})`;
  }
  if (op === 'operator_multiply') {
    const a = getInputValue(block, 'NUM1', blocks);
    const b = getInputValue(block, 'NUM2', blocks);
    return `(${a}) * (${b})`;
  }
  if (op === 'operator_divide') {
    const a = getInputValue(block, 'NUM1', blocks);
    const b = getInputValue(block, 'NUM2', blocks);
    return `(${a}) / (${b})`;
  }
  if (op === 'operator_gt') {
    const a = getInputValue(block, 'OPERAND1', blocks);
    const b = getInputValue(block, 'OPERAND2', blocks);
    return `(${a}) > (${b})`;
  }
  if (op === 'operator_lt') {
    const a = getInputValue(block, 'OPERAND1', blocks);
    const b = getInputValue(block, 'OPERAND2', blocks);
    return `(${a}) < (${b})`;
  }
  if (op === 'operator_equals') {
    const a = getInputValue(block, 'OPERAND1', blocks);
    const b = getInputValue(block, 'OPERAND2', blocks);
    return `(${a}) = (${b})`;
  }
  if (op === 'operator_and') {
    const a = getInputValue(block, 'OPERAND1', blocks);
    const b = getInputValue(block, 'OPERAND2', blocks);
    return `(${a}) and (${b})`;
  }
  if (op === 'operator_or') {
    const a = getInputValue(block, 'OPERAND1', blocks);
    const b = getInputValue(block, 'OPERAND2', blocks);
    return `(${a}) or (${b})`;
  }
  if (op === 'operator_not') {
    const a = getInputValue(block, 'OPERAND', blocks);
    return `not (${a})`;
  }
  if (op === 'operator_join') {
    const a = getInputValue(block, 'STRING1', blocks);
    const b = getInputValue(block, 'STRING2', blocks);
    return `join (${a}) (${b})`;
  }
  if (op === 'operator_random') {
    const a = getInputValue(block, 'FROM', blocks);
    const b = getInputValue(block, 'TO', blocks);
    return `pick random (${a}) to (${b})`;
  }

  // Sensing
  if (op === 'sensing_askandwait') {
    const question = getInputValue(block, 'QUESTION', blocks);
    return `ask (${question}) and wait`;
  }
  if (op === 'sensing_answer') return '(answer)';
  if (op === 'sensing_touchingobject') {
    const obj = getInputValue(block, 'TOUCHINGOBJECTMENU', blocks);
    return `touching (${obj})?`;
  }
  if (op === 'sensing_keypressed') {
    const key = getInputValue(block, 'KEY_OPTION', blocks);
    return `key (${key}) pressed?`;
  }
  if (op === 'sensing_timer') return '(timer)';
  if (op === 'sensing_resettimer') return 'reset timer';

  // Procedures
  if (op === 'procedures_definition') return 'define (custom block)';
  if (op === 'procedures_call') {
    const proccode = (block.mutation as Record<string, string>)?.['proccode'] ?? 'custom block';
    return `call [${proccode}]`;
  }

  // Menu / shadow blocks (appear as values inside inputs)
  if (op === 'event_broadcast_menu') {
    const name = block.fields['BROADCAST_OPTION']?.[0] ?? '?';
    return name;
  }

  // Fallback
  return op.replace(/_/g, ' ');
}

function serialiseBlock(blockId: string, blocks: BlockMap, indent: string, visited: Set<string>): string {
  if (visited.has(blockId)) return '';
  visited.add(blockId);

  const block = blocks[blockId];
  if (!block || block.shadow) return '';

  const lines: string[] = [];
  lines.push(`${indent}${describeBlock(block, blocks)}`);

  // Recurse into SUBSTACK (body of if/forever/repeat etc.)
  const substackId = block.inputs['SUBSTACK']?.[1];
  if (typeof substackId === 'string' && substackId && blocks[substackId]) {
    const nested = serialiseBlock(substackId, blocks, indent + '  ', visited);
    if (nested) lines.push(nested);
  }

  // Recurse into SUBSTACK2 (else branch)
  const substack2Id = block.inputs['SUBSTACK2']?.[1];
  if (typeof substack2Id === 'string' && substack2Id && blocks[substack2Id]) {
    lines.push(`${indent}else:`);
    const nested = serialiseBlock(substack2Id, blocks, indent + '  ', visited);
    if (nested) lines.push(nested);
  }

  // Follow the next chain
  if (block.next && !visited.has(block.next)) {
    const next = serialiseBlock(block.next, blocks, indent, visited);
    if (next) lines.push(next);
  }

  return lines.join('\n');
}

function serialiseTarget(target: ScratchTarget): string {
  const header = target.isStage ? 'Stage' : `Sprite: ${target.name}`;
  const { blocks } = target;

  const topLevelIds = Object.entries(blocks)
    .filter(([, b]) => b.topLevel && !b.shadow)
    .map(([id]) => id);

  if (topLevelIds.length === 0) {
    return `${header}\n  (no scripts)`;
  }

  const scripts = topLevelIds.map((id, i) => {
    const visited = new Set<string>();
    const body = serialiseBlock(id, blocks, '    ', visited);
    return `  Script ${i + 1}:\n${body}`;
  });

  return `${header}\n${scripts.join('\n\n')}`;
}

export class BlockSerialiser {
  serialise(project: ScratchProject): string {
    return project.targets.map(serialiseTarget).join('\n\n');
  }
}

export const blockSerialiser = new BlockSerialiser();
