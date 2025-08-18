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
    const base_mev = this.baseMEV[muscleGroup] || 8;
    const muscle_size_factor = this.muscleSizeFactor[muscleGroup] || 0.2;
    const mev = base_mev * (1 + muscle_size_factor) * Math.pow(taf, 0.3);
    const freqFactorMap = { 1: 0.8, 2: 1.0, 3: 1.2 };
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

  /**
   * Calculates the daily Recovery Score (RS) from readiness data.
   * @param {object} readinessData - Object with sleep_quality, energy_level, motivation, muscle_soreness.
   * @returns {number} The calculated Recovery Score (1-10).
   */
  calculateRecoveryScore(readinessData) {
    const { sleep_quality, energy_level, motivation, muscle_soreness } = readinessData;
    const sorenessInverse = 11 - muscle_soreness;
    return (sleep_quality + energy_level + motivation + sorenessInverse) / 4;
  }

  /**
   * Calculates the final Daily Readiness Score.
   * @param {number} recoveryScore - The calculated RS.
   * @param {number} performanceIndicator - User feedback from warm-ups (-1, 0, or 1).
   * @returns {number} The final Readiness Score.
   */
  getDailyReadiness(recoveryScore, performanceIndicator = 0) {
    // Performance indicator can be integrated later when warm-up feedback is available.
    return (recoveryScore + (performanceIndicator + 10)) / 2; // Normalize indicator to 1-10 scale
  }

  /**
   * Adjusts a planned workout based on the daily readiness score.
   * @param {object} plannedWorkout - The original workout object.
   * @param {number} readinessScore - The calculated daily readiness.
   * @returns {object} The adjusted workout object.
   */
  adjustWorkout(plannedWorkout, readinessScore) {
    const adjustedWorkout = JSON.parse(JSON.stringify(plannedWorkout)); // Deep copy
    let adjustmentNote = "Workout is as planned.";

    if (readinessScore < 6) {
      adjustmentNote = "Readiness is low. Volume reduced by 20% and intensity reduced.";
      adjustedWorkout.exercises.forEach(ex => {
        // Reduce volume by roughly 20% (e.g., remove last set if > 3 sets)
        if (ex.sets.length > 3) {
          ex.sets.pop();
        }
        // Reduce intensity by 1 RPE point (represented by lowering target reps)
        ex.targetReps = Math.max(5, ex.targetReps - 2);
      });
    } else if (readinessScore > 8) {
      adjustmentNote = "Feeling great! Increasing intensity slightly.";
      adjustedWorkout.exercises.forEach(ex => {
        // Increase intensity by 0.5 RPE (represented by adding a rep)
        ex.targetReps += 1;
      });
    }
    
    adjustedWorkout.adjustmentNote = adjustmentNote;
    return adjustedWorkout;
  }

  // --- 9. Periodization Model ---

  generateMesocycle(muscleGroups, mesocycleLength = 5) {
    const mesocycle = { weeks: [] };
    for (let week = 1; week <= mesocycleLength; week++) {
      const weeklyPlan = { week: week, muscleData: {} };
      for (const muscle of muscleGroups) {
        const landmarks = this.getVolumeLandmarks(muscle);
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
    for (const muscle of muscleGroups) {
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
}
