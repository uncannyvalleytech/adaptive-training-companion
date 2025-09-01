/*
===============================================
SECTION 1: CLASS DEFINITION AND CONSTRUCTOR
===============================================
*/

/**
 * @file workout-engine.js
 * This service implements the comprehensive "Mathematical Personal Training Algorithm".
 * It's responsible for all calculations related to user profiling, volume landmarks,
 * progression, intensity, and autoregulation.
 */
import { exerciseDatabase } from "./exercise-database.js";

export class WorkoutEngine {
  constructor(userProfile) {
    this.userProfile = userProfile;
    this.baseMEV = {
      chest: 8,
      back: 10,
      shoulders: 8,
      arms: 6,
      legs: 14,
      glutes: 10,
      biceps: 6,
      triceps: 6,
      quads: 10,
      hamstrings: 8,
      calves: 6,
      "neck & traps": 6,
    };
    this.muscleSizeFactor = {
      arms: 0.0,
      calves: 0.0,
      chest: 0.2,
      shoulders: 0.2,
      back: 0.4,
      legs: 0.4,
      glutes: 0.3,
      biceps: 0.1,
      triceps: 0.1,
      quads: 0.3,
      hamstrings: 0.2,
      "neck & traps": 0.1,
    };
    
    // Use the imported exercise database
    this.exerciseDatabase = exerciseDatabase;
  }

/*
===============================================
SECTION 2: USER PROFILE CALCULATIONS
===============================================
*/

  calculateTAF() {
    const { training_months } = this.userProfile;
    const taf = 1 + (training_months / 12) * 0.1;
    return Math.min(taf, 3.0);
  }

  calculateRCS() {
    const { sex, age, sleep_hours, stress_level } = this.userProfile;
    const baseRecovery = 1.0;
    const sexModifier = sex === 'female' ? 1.15 : 1.0;
    const ageModifier = Math.max(0.7, 1.2 - (age - 18) * 0.005);
    const sleepModifier = Math.min(1.2, sleep_hours / 8);
    const stressModifier = (10 - stress_level) / 10;
    return baseRecovery * sexModifier * ageModifier * sleepModifier * stressModifier;
  }

/*
===============================================
SECTION 3: VOLUME LANDMARK CALCULATIONS
===============================================
*/

  getVolumeLandmarks(muscleGroup, trainingFrequency = 2) {
    const taf = this.calculateTAF();
    const rcs = this.calculateRCS();
    const base_mev = this.userProfile.baseMEV?.[muscleGroup] || this.baseMEV[muscleGroup] || 8;
    const muscle_size_factor = this.muscleSizeFactor[muscleGroup] || 0.2;
    const mev = base_mev * (1 + muscle_size_factor) * Math.pow(taf, 0.3);
    const freqFactorMap = { 1: 0.8, 2: 1.0, 3: 1.2, 4: 1.2, 5: 1.3, 6: 1.4 };
    const trainingFrequencyFactor = freqFactorMap[trainingFrequency] || 1.3;
    const mrv = mev * (2.5 + rcs) * trainingFrequencyFactor;
    const mav = mev + (mrv - mev) * 0.7;
    const mv = mev * 0.6;
    return {
      mev: Math.round(mev),
      mrv: Math.round(mrv),
      mav: Math.round(mav),
      mv: Math.round(mv),
    };
  }

/*
===============================================
SECTION 4: PROGRESSION AND INTENSITY
===============================================
*/

  calculateWeeklyVolume(startingVolume, weekNumber, maxVolume) {
    const taf = this.calculateTAF();
    const progressionRate = taf < 1.5 ? 0.1 : 0.05;
    let weekVolume = startingVolume * (1 + (weekNumber - 1) * progressionRate);
    if (weekVolume >= maxVolume) {
        weekVolume = maxVolume;
    }
    const deloadTriggered = weekVolume >= maxVolume * 0.95;
    return { 
        targetVolume: Math.round(weekVolume), 
        deloadVolume: Math.round(startingVolume * 0.6),
        deloadTriggered 
    };
  }
    
  calculateTargetRIR(exerciseType, currentVolume, mrv) {
    const baseRIR = exerciseType === 'compound' ? 2 : 1;
    let fatigueAdjustment = 0;
    if (currentVolume / mrv > 0.8) fatigueAdjustment = -1;
    if (currentVolume / mrv < 0.4) fatigueAdjustment = 1;
    
    return baseRIR + fatigueAdjustment;
  }

  suggestLoadProgression(previousLoad, lastSessionRIR, targetRIR) {
    if (lastSessionRIR > targetRIR + 1) return previousLoad * 1.025;
    if (lastSessionRIR < targetRIR - 1) return previousLoad * 0.975;
    return previousLoad;
  }

  calculateProgression(previousWorkoutExercise) {
    const { completedSets = [], targetRir = 2, targetReps = 10 } = previousWorkoutExercise;
    
    if (completedSets.length === 0) {
      return { 
        targetLoad: null, 
        targetReps: targetReps, 
        note: "No past data, starting fresh." 
      };
    }
    
    const totalRir = completedSets.reduce((sum, set) => sum + (set.rir || 0), 0);
    const avgRir = totalRir / completedSets.length;
    
    const lastLoad = completedSets[0].weight;
    let newTargetLoad = lastLoad;
    let newTargetReps = targetReps;
    let note = "Maintaining current plan.";
    
    const rirDifference = avgRir - targetRir;
    
    if (rirDifference > 1) {
      newTargetLoad = lastLoad + 5;
      newTargetReps = targetReps;
      note = `Excellent performance! Increasing weight to ${newTargetLoad}lbs for the next session.`;
    } else if (rirDifference < -1) {
      newTargetLoad = lastLoad;
      newTargetReps = targetReps;
      note = `Last session was challenging. Maintain ${newTargetLoad}lbs and focus on hitting your rep targets.`;
    } else {
      const lastSetReps = completedSets[completedSets.length - 1].reps;
      const targetRepsUpper = targetReps + 2;
      
      if (lastSetReps >= targetRepsUpper) {
        newTargetLoad = lastLoad + 5;
        newTargetReps = targetReps;
        note = `All sets hit the rep target. Increasing weight to ${newTargetLoad}lbs for the next session.`;
      } else {
        newTargetLoad = lastLoad;
        newTargetReps = targetReps + 1;
        note = `Solid performance! Aim for one more rep per set in your next session with the same weight.`;
      }
    }
    
    return {
      targetLoad: newTargetLoad,
      targetReps: newTargetReps,
      note: note
    };
  }

/*
===============================================
SECTION 5: AUTOREGULATION AND RECOVERY
===============================================
*/

  calculateRecoveryScore(readinessData) {
    const { sleep_quality, energy_level, motivation, muscle_soreness } = readinessData;
    const sorenessInverse = 11 - muscle_soreness;
    return (sleep_quality + energy_level + motivation + sorenessInverse) / 4;
  }

  getDailyReadiness(recoveryScore) {
    return recoveryScore;
  }

  adjustWorkout(plannedWorkout, readinessScore) {
    const adjustedWorkout = JSON.parse(JSON.stringify(plannedWorkout));
    let adjustmentNote = "Workout is as planned.";
    
    if (readinessScore < 6) {
      adjustmentNote = "Readiness is low. Volume reduced by 20% and intensity reduced.";
      adjustedWorkout.exercises.forEach(ex => {
        if (ex.sets && ex.sets.length > 3) ex.sets.pop();
        ex.targetReps = Math.max(5, (parseInt(ex.targetReps) || 10) - 2);
      });
    } else if (readinessScore > 8) {
      adjustmentNote = "Feeling great! Increasing intensity slightly.";
      adjustedWorkout.exercises.forEach(ex => {
        ex.targetReps = (parseInt(ex.targetReps) || 10) + 1;
      });
    }

    adjustedWorkout.exercises.forEach(ex => {
      if (!ex.muscleGroup) {
        ex.muscleGroup = this._getExerciseMuscleGroup(ex.name);
      }
      if (ex.targetRir === undefined || ex.targetRir === null) {
        const dbExercise = this.exerciseDatabase[ex.muscleGroup]?.find(dbEx => dbEx.name === ex.name);
        const exerciseType = dbExercise?.type || 'compound';
        ex.targetRir = exerciseType === 'compound' ? 2 : 3;
      }
    });
    
    adjustedWorkout.adjustmentNote = adjustmentNote;
    return adjustedWorkout;
  }

  _getExerciseMuscleGroup(exerciseName) {
    const name = exerciseName.toLowerCase();
    for (const group in this.exerciseDatabase) {
      if (this.exerciseDatabase[group].some(ex => ex.name.toLowerCase() === name)) {
        return group;
      }
    }
    // Fallback logic
    if (name.includes('bench') || name.includes('chest')) return 'chest';
    if (name.includes('squat') || name.includes('quad')) return 'quads';
    if (name.includes('deadlift') || name.includes('row')) return 'back';
    return 'general';
  }

/*
===============================================
SECTION 6: EXERCISE SELECTION ALGORITHM
===============================================
*/

  calculateEPS(exercise, context = {}) {
    const { weakMuscles = [], recentExercises = [], gender } = context;
    const compoundBonus = exercise.type === 'compound' ? 3 : 1;
    const isWeakMuscle = weakMuscles.includes(exercise.muscleGroup);
    const weaknessMultiplier = isWeakMuscle ? 1.5 : 1.0;
    let noveltyFactor = 0;
    const lastUsedIndex = recentExercises.findIndex(e => e.id === exercise.id);
    if (lastUsedIndex === -1) noveltyFactor = 2;
    else if (lastUsedIndex > 4) noveltyFactor = 1;
    const recoveryCostMap = { high: -1, medium: 0, low: 1 };
    const recoveryCost = recoveryCostMap[exercise.recoveryCost] || 0;
    
    let genderModifier = 1.0;
    if (gender === 'female' && (exercise.muscleGroup === 'glutes' || exercise.muscleGroup === 'hamstrings')) {
      genderModifier = 1.2;
    }

    const score = (compoundBonus + noveltyFactor + recoveryCost) * weaknessMultiplier * genderModifier;
    return score;
  }

  selectExercisesForMuscle(muscleGroup, count = 2, context = {}) {
    const availableExercises = this.exerciseDatabase[muscleGroup];
    if (!availableExercises) return [];
    const scoredExercises = availableExercises.map(ex => ({
      ...ex,
      muscleGroup: muscleGroup,
      score: this.calculateEPS(ex, context),
    }));
    scoredExercises.sort((a, b) => b.score - a.score);
    return scoredExercises.slice(0, count);
  }
  
/*
===============================================
SECTION 7: WORKOUT SPLIT AND MESOCYCLE LOGIC
===============================================
*/

  getWorkoutSplit(daysPerWeek) {
    const splits = {
      3: [
        { name: 'Full Body A', groups: ['quads', 'hamstrings', 'chest', 'back'] },
        { name: 'Full Body B', groups: ['quads', 'glutes', 'shoulders', 'biceps', 'triceps'] },
        { name: 'Full Body C', groups: ['chest', 'back', 'quads', 'hamstrings', 'calves'] }
      ],
      4: [
        { name: 'Upper A', groups: ['chest', 'back', 'shoulders'] },
        { name: 'Lower A', groups: ['quads', 'hamstrings', 'glutes'] },
        { name: 'Upper B', groups: ['chest', 'back', 'biceps', 'triceps'] },
        { name: 'Lower B', groups: ['quads', 'hamstrings', 'calves'] }
      ],
      5: [
        { name: 'Push', groups: ['chest', 'shoulders', 'triceps'] },
        { name: 'Pull', groups: ['back', 'biceps'] },
        { name: 'Legs', groups: ['quads', 'hamstrings', 'glutes'] },
        { name: 'Upper', groups: ['chest', 'back', 'shoulders'] },
        { name: 'Lower', groups: ['quads', 'hamstrings', 'calves'] }
      ],
      6: [
        { name: 'Push', groups: ['chest', 'shoulders', 'triceps'] },
        { name: 'Pull', groups: ['back', 'biceps'] },
        { name: 'Legs', groups: ['quads', 'hamstrings', 'glutes'] },
        { name: 'Push', groups: ['chest', 'shoulders', 'triceps'] },
        { name: 'Pull', groups: ['back', 'biceps'] },
        { name: 'Legs', groups: ['quads', 'hamstrings', 'calves'] }
      ]
    };
    return splits[daysPerWeek] || splits[4];
  }

  generateMesocycle(daysPerWeek, mesocycleLength = 4) {
    // ... (rest of the function remains the same)
  }

/*
===============================================
SECTION 8: PROGRAM PLAN GENERATION
===============================================
*/
  generateProgramPlan(program, duration, startWorkoutIndex) {
    // ... (rest of the function remains the same)
  }

/*
===============================================
SECTION 9: LONG-TERM PROGRESSION AND WORKOUT GENERATION
===============================================
*/

  adaptVolumeLandmarks() {
    // ... (rest of the function remains the same)
  }

  generateDailyWorkout(muscleGroupsForDay) {
    // ... (rest of the function remains the same)
  }
  
/*
===============================================
SECTION 10: EXERCISE SUBSTITUTION ENGINE
===============================================
*/
  /**
   * Finds suitable substitutions for a given exercise based on available equipment.
   * @param {object} originalExercise - The full exercise object from the database.
   * @param {string[]} availableEquipment - A list of equipment the user has.
   * @returns {object[]} A ranked list of substitution options.
   */
  getExerciseSubstitutions(originalExercise, availableEquipment) {
    const allExercises = Object.values(this.exerciseDatabase).flat();

    const potentialSubstitutions = allExercises.filter(ex => {
      // Rule 1: Don't suggest the same exercise
      if (ex.name === originalExercise.name) {
        return false;
      }

      // Rule 2: Check if user has the required equipment
      const hasEquipment = ex.equipment.every(equip => availableEquipment.includes(equip));
      return hasEquipment;
    });
    
    // Rank the filtered substitutions
    const rankedSubstitutions = potentialSubstitutions.map(sub => {
      let score = 0;
      // High score for same movement pattern
      if (sub.movementPattern === originalExercise.movementPattern) {
        score += 10;
      }
      // Medium score for same muscle group (if pattern differs)
      if (sub.muscleGroup === originalExercise.muscleGroup) {
        score += 5;
      }
      // Small score for same exercise type (compound/isolation)
      if (sub.type === originalExercise.type) {
        score += 2;
      }
      return { ...sub, score };
    });

    // Sort by score (descending) and return top 5
    return rankedSubstitutions.sort((a, b) => b.score - a.score).slice(0, 5);
  }
}

