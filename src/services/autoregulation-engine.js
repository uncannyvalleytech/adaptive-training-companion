// Enhanced auto-regulation system for uncannyvalleytech
export class AutoRegulationEngine {
  constructor() {
    this.fatigueMasks = {
      sleep: { weight: 0.3, threshold: 6 },
      stress: { weight: 0.25, threshold: 7 },
      soreness: { weight: 0.2, threshold: 6 },
      motivation: { weight: 0.15, threshold: 5 },
      lifestyle: { weight: 0.1, threshold: 6 }
    };
  }

  calculateRecoveryScore(checkinData) {
    let totalScore = 0;
    let weightSum = 0;

    for (const [metric, config] of Object.entries(this.fatigueMasks)) {
      if (checkinData[metric] !== undefined) {
        const normalizedScore = Math.max(0, Math.min(10, checkinData[metric]));
        totalScore += normalizedScore * config.weight;
        weightSum += config.weight;
      }
    }

    return weightSum > 0 ? totalScore / weightSum : 7; // Default to moderate recovery
  }

  adjustWorkout(workout, recoveryScore, previousPerformance) {
    const adjustmentFactor = this.getAdjustmentFactor(recoveryScore);
    
    return workout.exercises.map(exercise => ({
      ...exercise,
      targetSets: Math.max(1, Math.round(exercise.targetSets * adjustmentFactor.volume)),
      targetLoad: this.adjustLoad(exercise.targetLoad, adjustmentFactor.intensity, previousPerformance[exercise.id]),
      targetRIR: Math.max(1, exercise.targetRIR + adjustmentFactor.rirAdjustment),
      notes: this.generateAdjustmentNote(adjustmentFactor)
    }));
  }

  getAdjustmentFactor(recoveryScore) {
    if (recoveryScore >= 8) {
      return { volume: 1.1, intensity: 1.05, rirAdjustment: -1 }; // Push harder
    } else if (recoveryScore >= 6) {
      return { volume: 1.0, intensity: 1.0, rirAdjustment: 0 }; // Maintain
    } else if (recoveryScore >= 4) {
      return { volume: 0.85, intensity: 0.95, rirAdjustment: 1 }; // Light reduction
    } else {
      return { volume: 0.7, intensity: 0.9, rirAdjustment: 2 }; // Significant reduction
    }
  }

  adjustLoad(currentLoad, intensityFactor, lastPerformance) {
    if (!lastPerformance) return currentLoad;
    
    const baseAdjustment = currentLoad * intensityFactor;
    const performanceModifier = this.calculatePerformanceModifier(lastPerformance);
    
    return Math.round(baseAdjustment * performanceModifier);
  }

  calculatePerformanceModifier(lastPerformance) {
    const avgRIR = lastPerformance.sets.reduce((sum, set) => sum + set.rir, 0) / lastPerformance.sets.length;
    const targetRIR = lastPerformance.targetRIR || 3;
    
    if (avgRIR > targetRIR + 1) return 1.025; // Too easy, increase
    if (avgRIR < targetRIR - 1) return 0.975; // Too hard, decrease
    return 1.0; // Just right
  }

  generateAdjustmentNote(factor) {
    if (factor.volume > 1) return "Recovery is excellent - pushing volume and intensity!";
    if (factor.volume < 0.9) return "Recovery is low - reducing training stress for today.";
    return "Recovery is moderate - maintaining planned training.";
  }

  // RIR-based progression system
  progressExercise(exercise, completedSets) {
    const avgRIR = completedSets.reduce((sum, set) => sum + set.rir, 0) / completedSets.length;
    const targetRIR = exercise.targetRIR || 3;
    const difference = avgRIR - targetRIR;

    const progression = {
      weight: exercise.targetLoad,
      reps: exercise.targetReps,
      sets: exercise.targetSets,
      note: ""
    };

    if (difference > 1) {
      // Too easy - increase weight
      progression.weight += 5; // Could be made dynamic based on exercise type
      progression.note = "Increasing weight - last session was too easy";
    } else if (difference < -1) {
      // Too hard - maintain or reduce
      if (exercise.stallCount >= 2) {
        progression.weight -= 5;
        progression.note = "Reducing weight due to repeated struggles";
      } else {
        progression.note = "Maintaining weight - focus on form and recovery";
      }
    } else if (Math.abs(difference) <= 1) {
      // Just right - progress based on rep ranges
      if (exercise.targetReps < 10) {
        progression.reps += 1;
        progression.note = "Adding 1 rep - strength progressing well";
      } else {
        progression.weight += 2.5;
        progression.reps = Math.max(6, exercise.targetReps - 2);
        progression.note = "Increasing weight and resetting reps";
      }
    }

    return progression;
  }

  // Periodization system
  generateMesocycle(userProfile, duration = 4) {
    const landmarks = this.getVolumeLandmarks(userProfile.trainingAge);
    const split = this.generateSplit(userProfile.daysPerWeek);
    
    const mesocycle = {
      weeks: {},
      deloadWeek: duration,
      progressionModel: userProfile.progressionModel || 'double'
    };

    for (let week = 1; week <= duration; week++) {
      mesocycle.weeks[week] = this.generateWeek(split, landmarks, week, duration);
    }

    return mesocycle;
  }

  getVolumeLandmarks(trainingAge) {
    const landmarks = {
      novice: { mev: 6, mav: 10, mrv: 12 },
      beginner: { mev: 8, mav: 12, mrv: 15 },
      intermediate: { mev: 10, mav: 16, mrv: 20 },
      advanced: { mev: 12, mav: 18, mrv: 22 }
    };
    return landmarks[trainingAge] || landmarks.beginner;
  }

  generateSplit(daysPerWeek) {
    const splits = {
      3: { type: 'fullbody', days: ['Full Body A', 'Full Body B', 'Full Body C'] },
      4: { type: 'upper-lower', days: ['Upper A', 'Lower A', 'Upper B', 'Lower B'] },
      5: { type: 'ppl', days: ['Push', 'Pull', 'Legs', 'Push', 'Pull'] },
      6: { type: 'ppl', days: ['Push', 'Pull', 'Legs', 'Push', 'Pull', 'Legs'] }
    };
    return splits[daysPerWeek] || splits[4];
  }

  generateWeek(split, landmarks, weekNumber, totalWeeks) {
    const isDeload = weekNumber === totalWeeks;
    const targetRIR = this.calculateWeeklyRIR(weekNumber, totalWeeks);
    
    return split.days.map((dayName, index) => ({
      name: dayName,
      exercises: this.generateDayExercises(dayName, landmarks, isDeload, targetRIR),
      completed: false
    }));
  }

  calculateWeeklyRIR(week, totalWeeks) {
    if (week === totalWeeks) return 4; // Deload week
    const progress = (week - 1) / (totalWeeks - 1);
    return Math.max(0, 3 - Math.floor(progress * 3)); // 3 -> 2 -> 1 -> 0
  }
}
