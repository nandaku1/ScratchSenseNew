// Runs all rule-based checkers and sorts findings by severity (error → warning → info).

import { Finding, ScratchProject } from '@types';

import { checkUnreachableScripts } from './checkers/correctness/unreachable-scripts';
import { checkEmptyScripts } from './checkers/correctness/empty-scripts';
import { checkInfiniteLoops } from './checkers/correctness/infinite-loops';
import { checkUninitialisedVariables } from './checkers/correctness/uninitialised-variables';
import { checkWriteOnlyVariables } from './checkers/correctness/write-only-variables';
import { checkDuplicateHatTriggers } from './checkers/correctness/duplicate-hat-triggers';
import { checkCloneBomb } from './checkers/correctness/clone-bomb';
import { checkCoordinateBounds } from './checkers/correctness/coordinate-bounds';
import { checkZeroDurationSay } from './checkers/correctness/zero-duration-say';
import { checkNestingDepth } from './checkers/performance/nesting-depth';
import { checkPollingLoop } from './checkers/performance/polling-loop';
import { checkScriptLength } from './checkers/maintainability/script-length';
import { checkNamingConventions } from './checkers/maintainability/naming-conventions';
import { checkDeadCustomBlocks } from './checkers/maintainability/dead-custom-blocks';
import { checkGodSprite } from './checkers/maintainability/god-sprite';
import { checkMagicNumbers } from './checkers/maintainability/magic-numbers';
import { checkRedundantBroadcasts } from './checkers/performance/redundant-broadcasts';
import { checkClonesWithoutDeletion } from './checkers/correctness/clones-without-deletion';
import { checkNoEntryPoint } from './checkers/correctness/no-entry-point';
import { checkUnansweredAsk } from './checkers/correctness/unanswered-ask';
import { checkAlwaysHidden } from './checkers/correctness/always-hidden';
import { checkCloneNoSelfDeletion } from './checkers/correctness/clone-no-self-deletion';
import { checkBroadcastInLoop } from './checkers/performance/broadcast-in-loop';
import { checkMissingLoopSensing } from './checkers/correctness/missing-loop-sensing';
import { checkLocalVariableScope } from './checkers/correctness/local-variable-scope';
import { checkStutteringMovement } from './checkers/correctness/stuttering-movement';
import { checkMissingBackdropSwitch } from './checkers/correctness/missing-backdrop-switch';
import { checkPositionEquals } from './checkers/correctness/position-equals';
import { checkComparingLiterals } from './checkers/correctness/comparing-literals';
import { checkForeverInsideLoop } from './checkers/correctness/forever-inside-loop';
import { checkMissingCloneCall } from './checkers/correctness/missing-clone-call';
import { checkMissingCloneInitialisation } from './checkers/correctness/missing-clone-initialisation';
import { checkParameterOutOfScope } from './checkers/correctness/parameter-out-of-scope';
import { checkExpressionAsTouchable } from './checkers/correctness/expression-as-touchable';

const SEVERITY_ORDER = { error: 0, warning: 1, info: 2 };

export function runRuleBasedAnalysis(project: ScratchProject): Finding[] {
  const findings: Finding[] = [];
  const { targets } = project;

  for (const target of targets) {
    findings.push(
      ...checkUnreachableScripts(target),
      ...checkEmptyScripts(target),
      ...checkInfiniteLoops(target),
      ...checkUninitialisedVariables(target),
      ...checkWriteOnlyVariables(target),
      ...checkDuplicateHatTriggers(target),
      ...checkCloneBomb(target),
      ...checkCoordinateBounds(target),
      ...checkZeroDurationSay(target),
      ...checkNestingDepth(target),
      ...checkPollingLoop(target),
      ...checkScriptLength(target),
      ...checkNamingConventions(target, targets),
      ...checkDeadCustomBlocks(target),
      ...checkGodSprite(target),
      ...checkMagicNumbers(target),
      ...checkAlwaysHidden(target),
      ...checkCloneNoSelfDeletion(target),
      ...checkBroadcastInLoop(target),
      ...checkMissingLoopSensing(target),
      ...checkStutteringMovement(target),
      ...checkPositionEquals(target),
      ...checkComparingLiterals(target),
      ...checkForeverInsideLoop(target),
      ...checkParameterOutOfScope(target),
      ...checkExpressionAsTouchable(target),
    );
  }

  // Cross-target checkers run after the per-target loop because they need the complete
  // targets array to reason across sprite boundaries (e.g. which broadcasts are received
  // by any sprite, or whether any sprite defines an entry point at all).
  findings.push(
    ...checkRedundantBroadcasts(targets),
    ...checkClonesWithoutDeletion(targets),
    ...checkNoEntryPoint(targets),
    ...checkUnansweredAsk(targets),
    ...checkLocalVariableScope(targets),
    ...checkMissingBackdropSwitch(targets),
    ...checkMissingCloneCall(targets),
    ...checkMissingCloneInitialisation(targets),
  );

  return findings.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
}

// Re-export all checkers for direct import in tests
export {
  checkUnreachableScripts,
  checkEmptyScripts,
  checkInfiniteLoops,
  checkUninitialisedVariables,
  checkWriteOnlyVariables,
  checkDuplicateHatTriggers,
  checkCloneBomb,
  checkCoordinateBounds,
  checkZeroDurationSay,
  checkNestingDepth,
  checkPollingLoop,
  checkRedundantBroadcasts,
  checkClonesWithoutDeletion,
  checkNoEntryPoint,
  checkUnansweredAsk,
  checkScriptLength,
  checkNamingConventions,
  checkDeadCustomBlocks,
  checkGodSprite,
  checkMagicNumbers,
  checkAlwaysHidden,
  checkCloneNoSelfDeletion,
  checkBroadcastInLoop,
  checkMissingLoopSensing,
  checkLocalVariableScope,
  checkStutteringMovement,
  checkMissingBackdropSwitch,
  checkPositionEquals,
  checkComparingLiterals,
  checkForeverInsideLoop,
  checkMissingCloneCall,
  checkMissingCloneInitialisation,
  checkParameterOutOfScope,
  checkExpressionAsTouchable,
};
