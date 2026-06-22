/**
 * Maps each wizard answer to the groups of character-card fields it should
 * influence. Included in the wizard system prompt so the AI understands how a
 * single high-level answer expands across the full 145-field schema.
 */
export const WIZARD_TO_FIELDS_MAPPING: Record<string, string[]> = {
  w_role: ['roleInPlot', 'characterFunction', 'plotSignificance', 'firstImpression', 'whyStays'],
  w_brings: ['conflictType', 'coreContradiction', 'sceneTriggers', 'dramaPrice'],
  w_coreType: ['strength', 'weakness', 'decisionStyle', 'selfAttitude', 'defaultEmotion', 'conflictBehavior', 'optimistType'],
  w_logicEmotion: ['decisionStyle', 'argueStyle', 'beliefSystem'],
  w_painSource: ['innerPain', 'worstFear', 'breakingPoint', 'defenseReaction', 'selfDestruct', 'maskedFear'],
  w_fear: ['fearsMost', 'worstFear', 'maskedFear', 'maniacalControl'],
  w_painReaction: ['conflictBehavior', 'whenAshamed', 'handlesOffense', 'onEdge'],
  w_surfaceGoal: ['wantsMost', 'successDefinition', 'statedVsHiddenGoal'],
  w_trueMotor: ['dailyDrive', 'statedVsHiddenGoal', 'selfDenial'],
  w_readyToDo: ['howFar', 'breakPrinciples', 'crossesLine', 'romanticizedSin'],
  w_obstacle: ['obstacle', 'conflictType'],
  w_socialDefault: ['socialMask', 'firstMinuteCheck', 'entersScene'],
  w_trusts: ['trustsUnconditionally', 'valuesInPeople'],
  w_avoids: ['avoids', 'despises', 'becomesWorseWith'],
  w_intimacyPain: ['hiddenNeedFromOthers', 'afterIntimacy', 'unbearableCompanion'],
  w_environment: ['grewUp', 'familyRole', 'worldUnsafe', 'cruelestWords'],
  w_formativeEvent: ['keyEvent', 'biggestMistake', 'firstBetrayal', 'untoldPast'],
  w_pastSelf: ['childhoodDream', 'wantsToBeLike'],
  w_pastInfluence: ['innerChildRitual', 'unaskedQuestion'],
  w_vibe: ['firstImpression', 'clothingStyle', 'signatureDetail', 'movementPlastics', 'scent'],
  w_silhouette: ['build', 'posture'],
  w_lifeTraces: ['marks', 'posture', 'movementPlastics'],
  w_alwaysItem: ['alwaysWears', 'alwaysInFrame'],
  w_nervousTell: ['nervousHabit', 'onEdge', 'shameBodyReaction'],
  w_arcStartMode: ['arcStart'],
  w_arcDestination: ['arcEnd', 'arcChange', 'idealEnding'],
  w_mustUnderstand: ['arcChange', 'liberatingTruth', 'falseBelief'],
  w_redLine: ['absoluteLimit', 'notForSale', 'genreLimits'],
};
