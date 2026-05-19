// Opcode sets, thresholds, and labels shared across all checkers.

export const HAT_OPCODES = new Set<string>([
  'event_whenflagclicked',
  'event_whenkeypressed',
  'event_whenthisspriteclicked',
  'event_whenstageclicked',
  'event_whenbackdropswitchesto',
  'event_whengreaterthan',
  'event_whenbroadcastreceived',
  'control_start_as_clone',
  'procedures_definition',
]);

export const CONTROL_OPCODES = new Set<string>([
  'control_if',
  'control_if_else',
  'control_repeat',
  'control_repeat_until',
  'control_forever',
  'control_wait',
  'control_wait_until',
  'control_for_each',
]);

export const LOOP_OPCODES = new Set<string>([
  'control_forever',
  'control_repeat',
  'control_repeat_until',
  'control_for_each',
]);

export const MOTION_OPCODES = new Set<string>([
  'motion_movesteps',
  'motion_turnright',
  'motion_turnleft',
  'motion_goto',
  'motion_gotoxy',
  'motion_glideto',
  'motion_glidesecstoxy',
  'motion_pointindirection',
  'motion_pointtowards',
  'motion_changexby',
  'motion_setx',
  'motion_changeyby',
  'motion_sety',
  'motion_ifonedgebounce',
  'motion_setrotationstyle',
]);

export const FOREVER_OPCODE = 'control_forever';
export const STOP_OPCODE = 'control_stop';
export const WAIT_OPCODE = 'control_wait';

export const VARIABLE_WRITE_OPCODES = new Set<string>([
  'data_setvariableto',
  'data_changevariableby',
]);

export const VARIABLE_READ_OPCODES = new Set<string>(['data_variable']);

export const BROADCAST_SEND_OPCODES = new Set<string>([
  'event_broadcast',
  'event_broadcastandwait',
]);

export const BROADCAST_RECEIVE_OPCODE = 'event_whenbroadcastreceived';

export const NESTING_DEPTH_WARNING = 3;
export const NESTING_DEPTH_ERROR = 5;

export const SCRIPT_LENGTH_WARNING = 20;
export const SCRIPT_LENGTH_ERROR = 40;

export const POOR_VARIABLE_NAMES = new Set<string>([
  'my variable',
  'var',
  'data',
  'thing',
  'stuff',
  'item',
  'value',
  'number',
  'text',
  'result',
  'temp',
  'tmp',
]);

// Single letters that are NOT conventional math/loop variables
export const SINGLE_LETTER_BAD_REGEX = /^[a-wA-W]$/;

export const DEFAULT_SPRITE_NAME_REGEX = /^(Sprite|Actor|Cat)\d*$/i;

export const STAGE_X_MAX = 240;
export const STAGE_Y_MAX = 180;

export const GOD_SPRITE_SCRIPT_WARNING = 15;
export const GOD_SPRITE_SCRIPT_ERROR = 25;

export const MAGIC_NUMBER_MIN_OCCURRENCES = 3;

export const MAGIC_NUMBER_EXEMPT = new Set<number>([
  0, 1, -1, 2, 3, 4, 5, 10, 20, 50, 100, 90, -90, 180, -180, 270, -270, 360, -360, 240, -240,
]);

export const OPCODE_LABELS: Record<string, string> = {
  event_whenflagclicked: 'when green flag clicked',
  event_whenkeypressed: 'when key pressed',
  event_whenthisspriteclicked: 'when this sprite clicked',
  event_whenstageclicked: 'when stage clicked',
  event_whenbackdropswitchesto: 'when backdrop switches to',
  event_whengreaterthan: 'when loudness/timer greater than',
  event_whenbroadcastreceived: 'when I receive',
  control_start_as_clone: 'when I start as a clone',
  procedures_definition: 'define (custom block)',
  control_forever: 'forever',
  control_if: 'if',
  control_if_else: 'if/else',
  control_repeat: 'repeat',
  control_repeat_until: 'repeat until',
  control_wait: 'wait',
  control_wait_until: 'wait until',
  data_setvariableto: 'set variable to',
  data_changevariableby: 'change variable by',
  control_stop: 'stop',
};

// Project block count above which LLM analysis is skipped
export const LLM_MAX_BLOCKS = 500;

// Jaccard similarity above which an LLM finding duplicates a rule-based one and is discarded
export const LLM_FINDING_SIMILARITY_THRESHOLD = 0.75;
