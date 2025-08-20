/**
 * @file workout-engine.js
 * This service implements the comprehensive "Mathematical Personal Training Algorithm".
 * It's responsible for all calculations related to user profiling, volume landmarks,
 * progression, intensity, and autoregulation.
 */
import { exerciseDatabase } from './exercise-database.js';

export class WorkoutEngine {
  constructor(userProfile) {
    this.userProfile = userProfile;
    this.baseMEV = {
      chest: 8,
      back: 10,
      shoulders: 8,
      arms: 6,
      legs: 14,
    };
    this.muscleSizeFactor = {
      arms: 0.0,
      calves: 0.0,
      chest: 0.2,
      shoulders: 0.2,
      back: 0.4,
      legs: 0.4,
    };
  }

  // --- 1. User Profile Initialization ---
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

  // --- 2. Volume Landmark Calculations ---
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

  // --- 3. Weekly Volume Progression ---
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
    
  // --- 4. Intensity Prescription ---
  calculateTargetRPE(exerciseType, currentVolume, mrv) {
    const baseRPE = exerciseType === 'compound' ? 8.0 : 8.5;
    let fatigueAdjustment = 0;
    if (currentVolume / mrv > 0.8) fatigueAdjustment = 0.5;
    if (currentVolume / mrv < 0.4) fatigueAdjustment = -0.5;
    const volumeAdjustment = 0;
    return baseRPE + fatigueAdjustment + volumeAdjustment;
  }

  suggestLoadProgression(previousLoad, lastSessionRPE, targetRPE) {
    if (lastSessionRPE < targetRPE - 0.5) return previousLoad * 1.025;
    if (lastSessionRPE > targetRPE + 0.5) return previousLoad * 0.975;
    return previousLoad;
  }

  // --- 6 & 8. Recovery Monitoring & Daily Autoregulation ---
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
        if (ex.sets.length > 3) ex.sets.pop();
        ex.targetReps = Math.max(5, ex.targetReps - 2);
      });
    } else if (readinessScore > 8) {
      adjustmentNote = "Feeling great! Increasing intensity slightly.";
      adjustedWorkout.exercises.forEach(ex => {
        ex.targetReps += 1;
      });
    }
    adjustedWorkout.adjustmentNote = adjustmentNote;
    return adjustedWorkout;
  }

  // --- 7. Exercise Selection Algorithm ---
  calculateEPS(exercise, context = {}) {
    const { weakMuscles = [], recentExercises = [] } = context;
    const compoundBonus = exercise.type === 'compound' ? 3 : 1;
    const isWeakMuscle = weakMuscles.includes(exercise.muscleGroup);
    const weaknessMultiplier = isWeakMuscle ? 1.5 : 1.0;
    let noveltyFactor = 0;
    const lastUsedIndex = recentExercises.findIndex(e => e.id === exercise.id);
    if (lastUsedIndex === -1) noveltyFactor = 2;
    else if (lastUsedIndex > 4) noveltyFactor = 1;
    const recoveryCostMap = { high: -1, medium: 0, low: 1 };
    const recoveryCost = recoveryCostMap[exercise.recoveryCost] || 0;
    const score = (compoundBonus + noveltyFactor + recoveryCost) * weaknessMultiplier;
    return score;
  }

  selectExercisesForMuscle(muscleGroup, count = 2, context = {}) {
    const availableExercises = exerciseDatabase[muscleGroup];
    if (!availableExercises) return [];
    const scoredExercises = availableExercises.map(ex => ({
      ...ex,
      score: this.calculateEPS(ex, context),
    }));
    scoredExercises.sort((a, b) => b.score - a.score);
    return scoredExercises.slice(0, count);
  }
  
  // --- Workout Split Logic ---
  getWorkoutSplit(daysPerWeek) {
    const splits = {
      3: [['chest', 'back'], ['legs', 'arms'], ['shoulders', 'chest']],
      4: [['upper', 'core'], ['lower', 'calves'], ['upper', 'core'], ['lower', 'calves']],
      5: [['push'], ['pull'], ['legs'], ['upper'], ['lower']],
      6: [['push'], ['pull'], ['legs'], ['push'], ['pull'], ['legs']],
    };
    // Correct split for 4 days is U/L, U/L, not U/L, U/L, U/L, U/L
    const simplifiedSplits = {
      3: [['chest', 'back'], ['legs', 'shoulders'], ['arms', 'chest']],
      4: [['chest', 'shoulders', 'triceps'], ['back', 'biceps'], ['legs'], ['full body']],
      5: [['chest'], ['back'], ['legs'], ['shoulders', 'arms'], ['full body']],
      6: [['chest'], ['back'], ['legs'], ['shoulders'], ['arms'], ['full body']]
    };
    const splitForDays = simplifiedSplits[daysPerWeek] || simplifiedSplits[4];
    return splitForDays.map(muscleGroups => muscleGroups.map(group => group.toLowerCase()));
  }

  // --- 9. Periodization Model ---
  generateMesocycle(daysPerWeek, mesocycleLength = 5) {
    const mesocycle = { weeks: [] };
    const workoutSplit = this.getWorkoutSplit(daysPerWeek);
    for (let week = 1; week <= mesocycleLength; week++) {
      const weeklyPlan = { week: week, muscleData: {} };
      // Map muscle groups to their correct volume landmarks and RPE targets
      const uniqueMuscles = [...new Set(workoutSplit.flat())];
      for (const muscle of uniqueMuscles) {
        const landmarks = this.getVolumeLandmarks(muscle, daysPerWeek);
        const startingVolume = landmarks.mev * 1.1;
        const { targetVolume } = this.calculateWeeklyVolume(startingVolume, week, landmarks.mav);
        weeklyPlan.muscleData[muscle] = {
          targetVolume: targetVolume,
          targetRPE_compound: this.calculateTargetRPE('compound', targetVolume, landmarks.mrv),
          targetRPE_isolation: this.calculateTargetRPE('isolation', targetVolume, landmarks.mrv),
        };
      }
      mesocycle.weeks.push(weeklyPlan);
    }
    const deloadWeek = { week: mesocycleLength + 1, isDeload: true, muscleData: {} };
    for (const muscle of [...new Set(workoutSplit.flat())]) {
      const landmarks = this.getVolumeLandmarks(muscle);
      deloadWeek.muscleData[muscle] = {
        targetVolume: Math.round(landmarks.mev * 0.6),
        targetRPE_compound: 7.0,
        targetRPE_isolation: 7.5,
      };
    }
    mesocycle.weeks.push(deloadWeek);
    return mesocycle;
  }

  // --- 10. Long-term Progression ---
  adaptVolumeLandmarks() {
    const taf = this.calculateTAF();
    let adaptationRate = 0.01; // Advanced
    if (taf < 1.5) adaptationRate = 0.05; // Beginner
    else if (taf < 2.5) adaptationRate = 0.025; // Intermediate

    const currentBaseMEV = this.userProfile.baseMEV || this.baseMEV;
    const newBaseMEV = {};

    for (const muscle in currentBaseMEV) {
      newBaseMEV[muscle] = Math.round(currentBaseMEV[muscle] * (1 + adaptationRate));
    }
    
    return newBaseMEV;
  }

  // --- Integrated Workout Generation ---
  generateDailyWorkout(muscleGroupsForDay, weeklyPlan) {
    let exercises = [];
    const selectionContext = { weakMuscles: ['shoulders'], recentExercises: [] }; 
    for (const muscle of muscleGroupsForDay) {
        const musclePlan = weeklyPlan.muscleData[muscle];
        const numExercises = musclePlan?.targetVolume ? (musclePlan.targetVolume > 12 ? 3 : 2) : 2;
        const selected = this.selectExercisesForMuscle(muscle, numExercises, selectionContext);
        let setsRemaining = musclePlan?.targetVolume ? musclePlan.targetVolume : 10;
        const exercisesWithSets = selected.map((ex, index) => {
            const setsForThisEx = Math.round(setsRemaining / (selected.length - index));
            setsRemaining -= setsForThisEx;
            return {
                ...ex,
                sets: Array(setsForThisEx).fill({}),
                targetReps: ex.type === 'compound' ? 8 : 12,
            };
        });
        exercises.push(...exercisesWithSets);
    }
    return {
        name: `Dynamic Workout - ${muscleGroupsForDay.join(', ')}`,
        exercises: exercises,
    };
  }
}
