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
    
    this.exerciseDatabase = {
      chest: [
        { name: 'Barbell Bench Press', type: 'compound', recoveryCost: 'medium' },
        { name: 'Dumbbell Bench Press', type: 'compound', recoveryCost: 'medium' },
        { name: 'Incline Dumbbell Press', type: 'compound', recoveryCost: 'medium' },
        { name: 'Machine Chest Press', type: 'compound', recoveryCost: 'low' },
        { name: 'Cable Crossover', type: 'isolation', recoveryCost: 'low' },
        { name: 'Push-ups', type: 'compound', recoveryCost: 'low' },
        { name: 'Incline Barbell Press', type: 'compound', recoveryCost: 'medium' },
        { name: 'Decline Bench Press', type: 'compound', recoveryCost: 'medium' },
        { name: 'Chest Dip', type: 'compound', recoveryCost: 'medium' }
      ],
      back: [
        { name: 'Deadlift', type: 'compound', recoveryCost: 'high' },
        { name: 'Pull-ups', type: 'compound', recoveryCost: 'medium' },
        { name: 'Barbell Row', type: 'compound', recoveryCost: 'medium' },
        { name: 'Lat Pulldown', type: 'compound', recoveryCost: 'low' },
        { name: 'Seated Cable Row', type: 'compound', recoveryCost: 'low' },
        { name: 'Face Pulls', type: 'isolation', recoveryCost: 'low' },
        { name: 'T-Bar Row', type: 'compound', recoveryCost: 'medium' },
        { name: 'Dumbbell Row', type: 'compound', recoveryCost: 'medium' }
      ],
      biceps: [
        { name: 'Barbell Curl', type: 'isolation', recoveryCost: 'low' },
        { name: 'Dumbbell Hammer Curl', type: 'isolation', recoveryCost: 'low' },
        { name: 'Preacher Curl', type: 'isolation', recoveryCost: 'low' },
        { name: 'Incline Dumbbell Curl', type: 'isolation', recoveryCost: 'low' }
      ],
      triceps: [
        { name: 'Tricep Pushdown', type: 'isolation', recoveryCost: 'low' },
        { name: 'Skull Crushers', type: 'isolation', recoveryCost: 'low' },
        { name: 'Overhead Tricep Extension', type: 'isolation', recoveryCost: 'low' },
        { name: 'Close Grip Bench Press', type: 'compound', recoveryCost: 'medium' }
      ],
      quads: [
        { name: 'Barbell Squat', type: 'compound', recoveryCost: 'high' },
        { name: 'Leg Press', type: 'compound', recoveryCost: 'medium' },
        { name: 'Leg Extensions', type: 'isolation', recoveryCost: 'low' },
        { name: 'Hack Squat', type: 'compound', recoveryCost: 'high' }
      ],
      hamstrings: [
        { name: 'Romanian Deadlift', type: 'compound', recoveryCost: 'medium' },
        { name: 'Hamstring Curls', type: 'isolation', recoveryCost: 'low' },
        { name: 'Good Mornings', type: 'compound', recoveryCost: 'medium' }
      ],
      glutes: [
        { name: 'Hip Thrust', type: 'compound', recoveryCost: 'medium' },
        { name: 'Glute Kickback', type: 'isolation', recoveryCost: 'low' },
        { name: 'Bulgarian Split Squat', type: 'compound', recoveryCost: 'high' }
      ],
      calves: [
        { name: 'Calf Raises', type: 'isolation', recoveryCost: 'low' },
        { name: 'Seated Calf Raises', type: 'isolation', recoveryCost: 'low' }
      ],
      shoulders: [
        { name: 'Overhead Press', type: 'compound', recoveryCost: 'medium' },
        { name: 'Dumbbell Shoulder Press', type: 'compound', recoveryCost: 'medium' },
        { name: 'Lateral Raises', type: 'isolation', recoveryCost: 'low' },
        { name: 'Front Raises', type: 'isolation', recoveryCost: 'low' },
        { name: 'Face Pulls', type: 'isolation', recoveryCost: 'low' }
      ]
    };
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

    // SECTION 5.1: RIR ASSIGNMENT LOGIC
    // This loop ensures every exercise has a targetRir value before the workout starts.
    adjustedWorkout.exercises.forEach(ex => {
      if (ex.targetRir === undefined || ex.targetRir === null) {
        // Find the exercise type from our database to determine a default RIR
        const dbExercise = this.exerciseDatabase[ex.muscleGroup]?.find(dbEx => dbEx.name === ex.name);
        const exerciseType = dbExercise?.type || 'compound'; // Default to compound if not found
        
        // Assign a default RIR based on exercise type
        ex.targetRir = exerciseType === 'compound' ? 2 : 3;
      }
    });
    
    adjustedWorkout.adjustmentNote = adjustmentNote;
    return adjustedWorkout;
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
    const mesocycle = { weeks: [] };
    const workoutSplit = this.getWorkoutSplit(daysPerWeek);
    const userGender = this.userProfile.sex;

    for (let week = 1; week <= mesocycleLength; week++) {
      const weeklyPlan = { week: week, days: [] };
      
      for (let dayIndex = 0; dayIndex < daysPerWeek; dayIndex++) {
        const splitDay = workoutSplit[dayIndex % workoutSplit.length];
        const dayPlan = { 
          name: splitDay.name,
          muscleGroups: splitDay.groups, 
          exercises: [] 
        };
        
        for (const muscle of splitDay.groups) {
          const landmarks = this.getVolumeLandmarks(muscle, Math.ceil(daysPerWeek / workoutSplit.length));
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
                  sets: Array(Math.max(1, setsForThisEx)).fill({}),
                  targetReps: ex.type === 'compound' ? (userGender === 'male' ? "6-8" : "8-10") : "10-12",
                  muscleGroup: muscle,
                  category: ex.type || 'strength',
                  type: ex.type
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
    for (let dayIndex = 0; dayIndex < daysPerWeek; dayIndex++) {
      const splitDay = workoutSplit[dayIndex % workoutSplit.length];
      const deloadDayPlan = { 
        name: `${splitDay.name} (Deload)`,
        muscleGroups: splitDay.groups, 
        exercises: [] 
      };
      for (const muscle of splitDay.groups) {
          const landmarks = this.getVolumeLandmarks(muscle);
          const deloadVolume = Math.round(landmarks.mev * 0.6);
          const numExercises = deloadVolume > 8 ? 2 : 1;
          const selectedExercises = this.selectExercisesForMuscle(muscle, numExercises, { gender: userGender });
          const exercisesWithSets = selectedExercises.map(ex => ({
              name: ex.name,
              sets: Array(Math.max(1, Math.round(deloadVolume / numExercises))).fill({}),
              targetReps: ex.type === 'compound' ? "6-8" : "10-12",
              muscleGroup: muscle,
              category: ex.type || 'strength',
              type: ex.type
          }));
          deloadDayPlan.exercises.push(...exercisesWithSets);
      }
      deloadWeek.days.push(deloadDayPlan);
    }
    mesocycle.weeks.push(deloadWeek);
    
    return mesocycle;
  }

/*
===============================================
SECTION 8: PROGRAM PLAN GENERATION
===============================================
*/
  generateProgramPlan(program, duration, startWorkoutIndex) {
    const { workouts, daysPerWeek } = program;
    let totalWorkouts;

    if (duration.type === 'weeks') {
        totalWorkouts = duration.value * daysPerWeek;
    } else {
        totalWorkouts = duration.value;
    }

    const rotatedWorkouts = [...workouts.slice(startWorkoutIndex), ...workouts.slice(0, startWorkoutIndex)];
    
    const plan = {
        name: program.name,
        duration: duration,
        startDate: new Date().toISOString(),
        workouts: [],
    };

    for (let i = 0; i < totalWorkouts; i++) {
        const workoutTemplate = rotatedWorkouts[i % rotatedWorkouts.length];
        plan.workouts.push({
            day: i + 1,
            ...workoutTemplate,
            completed: false,
        });
    }
    
    return plan;
  }

/*
===============================================
SECTION 9: LONG-TERM PROGRESSION AND WORKOUT GENERATION
===============================================
*/

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

  generateDailyWorkout(muscleGroupsForDay) {
    let exercises = [];
    const userGender = this.userProfile.sex;
    const selectionContext = { weakMuscles: ['shoulders'], recentExercises: [], gender: userGender }; 
    for (const muscle of muscleGroupsForDay) {
        const landmarks = this.getVolumeLandmarks(muscle);
        const targetVolume = landmarks.mev;
        const numExercises = targetVolume > 12 ? 3 : 2;
        const selected = this.selectExercisesForMuscle(muscle, numExercises, selectionContext);
        let setsRemaining = targetVolume;
        const exercisesWithSets = selected.map((ex, index) => {
            const setsForThisEx = Math.round(setsRemaining / (selected.length - index));
            setsRemaining -= setsForThisEx;
            
            const targetReps = ex.type === 'compound' 
                ? (userGender === 'male' ? "6-8" : "8-10")
                : "10-15";
            
            return {
                ...ex,
                sets: Array(Math.max(1, setsForThisEx)).fill({}),
                targetReps: targetReps,
                muscleGroup: muscle,
                category: ex.type || 'strength',
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
