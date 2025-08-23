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
      glutes: 10, // Added for specific glute focus
      "neck & traps": 6, // Added for specific focus
    };
    this.muscleSizeFactor = {
      arms: 0.0,
      calves: 0.0,
      chest: 0.2,
      shoulders: 0.2,
      back: 0.4,
      legs: 0.4,
      glutes: 0.3,
      "neck & traps": 0.1,
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
  calculateTargetRIR(exerciseType, currentVolume, mrv) {
    const baseRIR = exerciseType === 'compound' ? 2 : 1; // Start with a base RIR of 2 for compounds, 1 for isolation
    let fatigueAdjustment = 0;
    if (currentVolume / mrv > 0.8) fatigueAdjustment = -1; // Closer to MRV, push closer to failure (lower RIR)
    if (currentVolume / mrv < 0.4) fatigueAdjustment = 1; // Far from MRV, can leave more in the tank (higher RIR)
    
    return baseRIR + fatigueAdjustment;
  }

  suggestLoadProgression(previousLoad, lastSessionRIR, targetRIR) {
    if (lastSessionRIR > targetRIR + 1) return previousLoad * 1.025; // Too easy, more reps in reserve than targeted
    if (lastSessionRIR < targetRIR -1) return previousLoad * 0.975; // Too hard, less reps in reserve
    return previousLoad;
  }

  // --- 5. Progression Algorithm based on past results ---
  calculateProgression(previousWorkoutExercise) {
    const { completedSets = [], targetRir = 2, targetReps = 10 } = previousWorkoutExercise;
    
    if (completedSets.length === 0) {
      return { 
        targetLoad: null, 
        targetReps: targetReps, 
        note: "No past data, starting fresh." 
      };
    }
    
    // Calculate average RIR from the last session
    const totalRir = completedSets.reduce((sum, set) => sum + (set.rir || 0), 0);
    const avgRir = totalRir / completedSets.length;
    
    const lastLoad = completedSets[0].weight;
    let newTargetLoad = lastLoad;
    let newTargetReps = targetReps;
    let note = "Maintaining current plan.";
    
    const rirDifference = avgRir - targetRir;
    
    if (rirDifference > 1) { // Workout was too easy
      // Progression: increase weight by a small amount (e.g., 5lbs)
      newTargetLoad = lastLoad + 5;
      newTargetReps = targetReps;
      note = `Excellent performance! Increasing weight to ${newTargetLoad}lbs for the next session.`;
    } else if (rirDifference < -1) { // Workout was too hard
      // Regress: keep the same weight, or potentially decrease it slightly.
      // We will keep the weight and suggest focusing on form and hitting rep targets.
      newTargetLoad = lastLoad;
      newTargetReps = targetReps;
      note = `Last session was challenging. Maintain ${newTargetLoad}lbs and focus on hitting your rep targets.`;
    } else { // Workout was just right, progressive overload needed
      // Check if we hit the top end of a rep range
      const lastSetReps = completedSets[completedSets.length - 1].reps;
      const targetRepsUpper = targetReps + 2; // Assuming a small rep range, e.g., 8-10.
      
      if (lastSetReps >= targetRepsUpper) {
        // Double progression: add weight and reset reps
        newTargetLoad = lastLoad + 5;
        newTargetReps = targetReps;
        note = `All sets hit the rep target. Increasing weight to ${newTargetLoad}lbs for the next session.`;
      } else {
        // Continue adding reps at the same weight
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
      genderModifier = 1.2; // Prioritize glute and hamstring exercises for females
    }

    const score = (compoundBonus + noveltyFactor + recoveryCost) * weaknessMultiplier * genderModifier;
    return score;
  }

  selectExercisesForMuscle(muscleGroup, count = 2, context = {}) {
    const availableExercises = exerciseDatabase[muscleGroup];
    if (!availableExercises) return [];
    const scoredExercises = availableExercises.map(ex => ({
      ...ex,
      muscleGroup: muscleGroup,
      score: this.calculateEPS(ex, context),
    }));
    scoredExercises.sort((a, b) => b.score - a.score);
    return scoredExercises.slice(0, count);
  }
  
  // --- Workout Split Logic ---
  getWorkoutSplit(daysPerWeek) {
    const splits = {
      3: [['chest', 'back'], ['legs', 'shoulders'], ['arms', 'chest']],
      4: [['chest', 'shoulders', 'triceps'], ['back', 'biceps'], ['legs'], ['full body']],
      5: [['chest'], ['back'], ['legs'], ['shoulders', 'arms'], ['full body']],
      6: [['chest'], ['back'], ['legs'], ['shoulders'], ['arms'], ['full body']]
    };
    const splitForDays = splits[daysPerWeek] || splits[4];
    return splitForDays.map(muscleGroups => muscleGroups.map(group => group.toLowerCase()));
  }

  // --- 9. Periodization Model ---
  generateMesocycle(daysPerWeek, mesocycleLength = 5) {
    const mesocycle = { weeks: [] };
    const workoutSplit = this.getWorkoutSplit(daysPerWeek);
    const userGender = this.userProfile.sex;

    for (let week = 1; week <= mesocycleLength; week++) {
      const weeklyPlan = { week: week, days: [] };
      
      for (const dayMuscleGroups of workoutSplit) {
        const dayPlan = { muscleGroups: dayMuscleGroups, exercises: [] };
        
        for (const muscle of dayMuscleGroups) {
          const landmarks = this.getVolumeLandmarks(muscle, daysPerWeek);
          const startingVolume = landmarks.mev * 1.1;
          const { targetVolume } = this.calculateWeeklyVolume(startingVolume, week, landmarks.mav);
          
          const numExercises = targetVolume > 12 ? 3 : 2;
          const selectedExercises = this.selectExercisesForMuscle(muscle, numExercises, { gender: userGender });

          let setsRemaining = targetVolume;
          const exercisesWithSets = selectedExercises.map((ex, index) => {
              const setsForThisEx = Math.round(setsRemaining / (selectedExercises.length - index));
              setsRemaining -= setsForThisEx;
              return {
                  name: ex.name,
                  sets: Array(setsForThisEx).fill({}),
                  targetReps: ex.type === 'compound' ? (userGender === 'male' ? 8 : 10) : 12,
                  muscleGroup: muscle,
                  category: 'strength',
              };
          });
          dayPlan.exercises.push(...exercisesWithSets);
        }
        weeklyPlan.days.push(dayPlan);
      }
      mesocycle.weeks.push(weeklyPlan);
    }
    
    // Add a deload week
    const deloadWeek = { week: mesocycleLength + 1, isDeload: true, days: [] };
    for (const dayMuscleGroups of workoutSplit) {
        const deloadDayPlan = { muscleGroups: dayMuscleGroups, exercises: [] };
        for (const muscle of dayMuscleGroups) {
            const landmarks = this.getVolumeLandmarks(muscle);
            const numExercises = Math.round((landmarks.mev * 0.6) > 12 ? 3 : 2);
            const selectedExercises = this.selectExercisesForMuscle(muscle, numExercises, { gender: userGender });
            const exercisesWithSets = selectedExercises.map(ex => ({
                name: ex.name,
                sets: Array(Math.max(1, Math.round((landmarks.mev * 0.6) / numExercises))).fill({}),
                targetReps: ex.type === 'compound' ? 8 : 12,
                muscleGroup: muscle,
                category: 'strength',
            }));
            deloadDayPlan.exercises.push(...exercisesWithSets);
        }
        deloadWeek.days.push(deloadDayPlan);
    }
    mesocycle.weeks.push(deloadWeek);
    
    return mesocycle;
  }

  // --- 10. Long-term Progression ---
  adaptVolumeLandmarks() {
    const taf = this.calculateTAF();
    let adaptationRate = 0.01; 
    if (taf < 1.5) adaptationRate = 0.05; 
    else if (taf < 2.5) adaptationRate = 0.025; 

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
    const userGender = this.userProfile.sex;
    const selectionContext = { weakMuscles: ['shoulders'], recentExercises: [], gender: userGender }; 
    for (const muscle of muscleGroupsForDay) {
        const landmarks = this.getVolumeLandmarks(muscle);
        const targetVolume = weeklyPlan.muscleData?.[muscle]?.targetVolume || landmarks.mev;
        const numExercises = targetVolume > 12 ? 3 : 2;
        const selected = this.selectExercisesForMuscle(muscle, numExercises, selectionContext);
        let setsRemaining = targetVolume;
        const exercisesWithSets = selected.map((ex, index) => {
            const setsForThisEx = Math.round(setsRemaining / (selected.length - index));
            setsRemaining -= setsForThisEx;
            
            // Adjust reps based on gender
            const targetReps = ex.type === 'compound' 
                ? (userGender === 'male' ? "6-8" : "8-10") // Men often use lower reps for strength compounds
                : "10-15";
            
            return {
                ...ex,
                sets: Array(setsForThisEx).fill({}),
                targetReps: targetReps,
                muscleGroup: muscle,
                category: 'strength',
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
