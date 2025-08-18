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

  /**
   * Calculates the Training Age Factor (TAF).
   * @returns {number} The calculated TAF, capped at 3.0.
   */
  calculateTAF() {
    const { training_months } = this.userProfile;
    const taf = 1 + (training_months / 12) * 0.1;
    return Math.min(taf, 3.0);
  }

  /**
   * Calculates the Recovery Capacity Score (RCS).
   * @returns {number} The calculated RCS.
   */
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

  /**
   * Calculates all volume landmarks for a given muscle group.
   * @param {string} muscleGroup - The muscle group to calculate for.
   * @param {number} trainingFrequency - How many times per week the muscle is trained.
   * @returns {object} An object containing MEV, MRV, MAV, and MV.
   */
  getVolumeLandmarks(muscleGroup, trainingFrequency = 2) {
    const taf = this.calculateTAF();
    const rcs = this.calculateRCS();

    // Calculate MEV
    const base_mev = this.baseMEV[muscleGroup] || 8;
    const muscle_size_factor = this.muscleSizeFactor[muscleGroup] || 0.2;
    const mev = base_mev * (1 + muscle_size_factor) * Math.pow(taf, 0.3);

    // Calculate MRV
    const freqFactorMap = { 1: 0.8, 2: 1.0, 3: 1.2 };
    const trainingFrequencyFactor = freqFactorMap[trainingFrequency] || 1.3;
    const mrv = mev * (2.5 + rcs) * trainingFrequencyFactor;

    // Calculate MAV
    const mav = mev + (mrv - mev) * 0.7;

    // Calculate MV
    const mv = mev * 0.6;

    return {
      mev: Math.round(mev),
      mrv: Math.round(mrv),
      mav: Math.round(mav),
      mv: Math.round(mv),
    };
  }

  // --- 3. Weekly Volume Progression ---

  /**
   * Calculates the target volume for a specific week in a mesocycle.
   * @param {number} startingVolume - The volume to start the cycle with.
   * @param {number} weekNumber - The current week number (1-indexed).
   * @param {number} maxVolume - The maximum adaptive volume (MAV).
   * @returns {{ targetVolume: number, deloadTriggered: boolean }} The target volume and deload status.
   */
  calculateWeeklyVolume(startingVolume, weekNumber, maxVolume) {
    const taf = this.calculateTAF();
    const progressionRate = taf < 1.5 ? 0.1 : 0.05; // Beginners progress faster
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

  /**
   * Calculates the target RPE for an exercise.
   * @param {string} exerciseType - 'compound' or 'isolation'.
   * @param {number} currentVolume - The current weekly volume for the muscle.
   * @param {number} mrv - The maximum recoverable volume for the muscle.
   * @returns {number} The calculated target RPE.
   */
  calculateTargetRPE(exerciseType, currentVolume, mrv) {
    const baseRPE = exerciseType === 'compound' ? 8.0 : 8.5;
    let fatigueAdjustment = 0;
    if (currentVolume / mrv > 0.8) fatigueAdjustment = 0.5;
    if (currentVolume / mrv < 0.4) fatigueAdjustment = -0.5;
    
    // Volume adjustment can be implemented if daily volume is tracked
    const volumeAdjustment = 0; 
    
    return baseRPE + fatigueAdjustment + volumeAdjustment;
  }

  /**
   * Suggests a new load based on the last session's RPE.
   * @param {number} previousLoad - The load used in the last session.
   * @param {number} lastSessionRPE - The RPE from the last session.
   * @param {number} targetRPE - The target RPE for the session.
   * @returns {number} The suggested new load.
   */
  suggestLoadProgression(previousLoad, lastSessionRPE, targetRPE) {
    if (lastSessionRPE < targetRPE - 0.5) {
      return previousLoad * 1.025;
    }
    if (lastSessionRPE > targetRPE + 0.5) {
      return previousLoad * 0.975;
    }
    return previousLoad;
  }

  // --- 9. Periodization Model ---

  /**
   * Generates a full mesocycle plan.
   * @param {string[]} muscleGroups - Array of muscle groups to include in the plan.
   * @param {number} mesocycleLength - The length of the mesocycle in weeks.
   * @returns {object} A structured mesocycle plan.
   */
  generateMesocycle(muscleGroups, mesocycleLength = 5) {
    const mesocycle = {
        weeks: []
    };

    for (let week = 1; week <= mesocycleLength; week++) {
        const weeklyPlan = {
            week: week,
            muscleData: {}
        };
        
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
    
    // Add deload week
    const deloadWeek = {
        week: mesocycleLength + 1,
        isDeload: true,
        muscleData: {}
    };
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
