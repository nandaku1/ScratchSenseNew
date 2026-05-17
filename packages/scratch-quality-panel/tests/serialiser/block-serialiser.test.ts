// STAGE 11 — tests for BlockSerialiser

import { BlockSerialiser } from '../../src/serialiser/index';
import { makeProject, makeTarget, makeStage, makeHatBlock, makeBlock, resetIds, freshId } from '../fixtures/builders';

beforeEach(resetIds);

const serialiser = new BlockSerialiser();

test('empty project serialises stage with no scripts', () => {
  const project = makeProject([]);
  const output = serialiser.serialise(project);
  expect(output).toContain('Stage');
  expect(output).toContain('(no scripts)');
});

test('sprite with flag hat and move block serialises correctly', () => {
  const hatId = freshId();
  const moveId = freshId();
  const sprite = makeTarget({
    name: 'Cat',
    blocks: {
      [hatId]: makeHatBlock(hatId, moveId),
      [moveId]: makeBlock({ opcode: 'motion_movesteps', next: null, inputs: { STEPS: [1, [4, '10']] } }),
    },
  });
  const project = makeProject([sprite]);
  const output = serialiser.serialise(project);
  expect(output).toContain('Sprite: Cat');
  expect(output).toContain('when green flag clicked');
  expect(output).toContain('move');
  expect(output).toContain('10');
});

test('sprite with set variable block', () => {
  const hatId = freshId();
  const setId = freshId();
  const sprite = makeTarget({
    name: 'Player',
    blocks: {
      [hatId]: makeHatBlock(hatId, setId),
      [setId]: makeBlock({
        opcode: 'data_setvariableto',
        next: null,
        fields: { VARIABLE: ['score', 'v1'] },
        inputs: { VALUE: [1, [4, '0']] },
      }),
    },
  });
  const output = serialiser.serialise(makeProject([sprite]));
  expect(output).toContain('set [score] to');
  expect(output).toContain('0');
});

test('nested forever + if renders indented', () => {
  const hatId = freshId();
  const foreverId = freshId();
  const ifId = freshId();
  const sprite = makeTarget({
    name: 'Ball',
    blocks: {
      [hatId]: makeHatBlock(hatId, foreverId),
      [foreverId]: makeBlock({
        opcode: 'control_forever',
        next: null,
        inputs: { SUBSTACK: [2, ifId] },
      }),
      [ifId]: makeBlock({
        opcode: 'control_if',
        next: null,
        inputs: { CONDITION: [2, null] },
      }),
    },
  });
  const output = serialiser.serialise(makeProject([sprite]));
  expect(output).toContain('forever');
  expect(output).toContain('if');
  // forever should appear before if
  expect(output.indexOf('forever')).toBeLessThan(output.indexOf('if'));
});

test('visited set prevents infinite loops on cyclic blocks', () => {
  const hatId = freshId();
  const blockId = freshId();
  // Manually craft a cycle: block.next points back to itself
  const sprite = makeTarget({
    name: 'Test',
    blocks: {
      [hatId]: makeHatBlock(hatId, blockId),
      [blockId]: {
        opcode: 'motion_movesteps',
        next: blockId, // cycle
        parent: hatId,
        inputs: { STEPS: [1, [4, '5']] },
        fields: {},
        shadow: false,
        topLevel: false,
      },
    },
  });
  // Should not throw / hang
  expect(() => serialiser.serialise(makeProject([sprite]))).not.toThrow();
});
