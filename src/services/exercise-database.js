/**
 * @file exercise-database.js
 * This file contains the master list of all available exercises.
 * Each exercise includes metadata required for the Exercise Priority Score (EPS) algorithm.
 */

export const exerciseDatabase = {
  chest: [
    {
      id: 'ex_chest_001',
      name: 'Barbell Bench Press',
      type: 'compound',
      recoveryCost: 'medium',
    },
    {
      id: 'ex_chest_002',
      name: 'Dumbbell Bench Press',
      type: 'compound',
      recoveryCost: 'medium',
    },
    {
      id: 'ex_chest_003',
      name: 'Incline Dumbbell Press',
      type: 'compound',
      recoveryCost: 'medium',
    },
    {
      id: 'ex_chest_004',
      name: 'Machine Chest Press',
      type: 'compound',
      recoveryCost: 'low',
    },
    {
      id: 'ex_chest_005',
      name: 'Cable Crossover',
      type: 'isolation',
      recoveryCost: 'low',
    },
    {
      id: 'ex_chest_006',
      name: 'Push-ups',
      type: 'compound',
      recoveryCost: 'low',
    },
    {
      id: 'ex_chest_007',
      name: 'Incline Barbell Press',
      type: 'compound',
      recoveryCost: 'medium',
    },
    {
      id: 'ex_chest_008',
      name: 'Decline Bench Press',
      type: 'compound',
      recoveryCost: 'medium',
    },
    {
      id: 'ex_chest_009',
      name: 'Chest Dip',
      type: 'compound',
      recoveryCost: 'medium',
    }
  ],
  back: [
    {
      id: 'ex_back_001',
      name: 'Deadlift',
      type: 'compound',
      recoveryCost: 'high',
    },
    {
      id: 'ex_back_002',
      name: 'Pull-ups',
      type: 'compound',
      recoveryCost: 'medium',
    },
    {
      id: 'ex_back_003',
      name: 'Barbell Row',
      type: 'compound',
      recoveryCost: 'medium',
    },
    {
      id: 'ex_back_004',
      name: 'Lat Pulldown',
      type: 'compound',
      recoveryCost: 'low',
    },
    {
      id: 'ex_back_005',
      name: 'Seated Cable Row',
      type: 'compound',
      recoveryCost: 'low',
    },
    {
      id: 'ex_back_006',
      name: 'Face Pulls',
      type: 'isolation',
      recoveryCost: 'low',
    },
    {
      id: 'ex_back_007',
      name: 'T-Bar Row',
      type: 'compound',
      recoveryCost: 'medium',
    },
    {
      id: 'ex_back_008',
      name: 'Dumbbell Row',
      type: 'compound',
      recoveryCost: 'medium',
    }
  ],
  biceps: [
    {
      id: 'ex_biceps_001',
      name: 'Barbell Curl',
      type: 'isolation',
      recoveryCost: 'low',
    },
    {
      id: 'ex_biceps_002',
      name: 'Dumbbell Hammer Curl',
      type: 'isolation',
      recoveryCost: 'low',
    },
    {
      id: 'ex_biceps_003',
      name: 'Preacher Curl',
      type: 'isolation',
      recoveryCost: 'low',
    },
    {
      id: 'ex_biceps_004',
      name: 'Incline Dumbbell Curl',
      type: 'isolation',
      recoveryCost: 'low',
    }
  ],
  triceps: [
    {
      id: 'ex_triceps_001',
      name: 'Tricep Pushdown',
      type: 'isolation',
      recoveryCost: 'low',
    },
    {
      id: 'ex_triceps_002',
      name: 'Skull Crushers',
      type: 'isolation',
      recoveryCost: 'low',
    },
    {
      id: 'ex_triceps_003',
      name: 'Overhead Tricep Extension',
      type: 'isolation',
      recoveryCost: 'low',
    },
    {
      id: 'ex_triceps_004',
      name: 'Close Grip Bench Press',
      type: 'compound',
      recoveryCost: 'medium',
    }
  ],
  forearms: [
    {
      id: 'ex_forearms_001',
      name: 'Wrist Curls',
      type: 'isolation',
      recoveryCost: 'low',
    },
    {
      id: 'ex_forearms_002',
      name: 'Reverse Wrist Curls',
      type: 'isolation',
      recoveryCost: 'low',
    }
  ],
  quads: [
    {
      id: 'ex_quads_001',
      name: 'Barbell Squat',
      type: 'compound',
      recoveryCost: 'high',
    },
    {
      id: 'ex_quads_002',
      name: 'Leg Press',
      type: 'compound',
      recoveryCost: 'medium',
    },
    {
      id: 'ex_quads_003',
      name: 'Leg Extensions',
      type: 'isolation',
      recoveryCost: 'low',
    },
    {
      id: 'ex_quads_004',
      name: 'Hack Squat',
      type: 'compound',
      recoveryCost: 'high',
    }
  ],
  hamstrings: [
    {
      id: 'ex_hamstrings_001',
      name: 'Romanian Deadlift',
      type: 'compound',
      recoveryCost: 'medium',
    },
    {
      id: 'ex_hamstrings_002',
      name: 'Hamstring Curls',
      type: 'isolation',
      recoveryCost: 'low',
    },
    {
      id: 'ex_hamstrings_003',
      name: 'Good Mornings',
      type: 'compound',
      recoveryCost: 'medium',
    }
  ],
  glutes: [
    {
      id: 'ex_glutes_001',
      name: 'Hip Thrust',
      type: 'compound',
      recoveryCost: 'medium',
    },
    {
      id: 'ex_glutes_002',
      name: 'Glute Kickback',
      type: 'isolation',
      recoveryCost: 'low',
    },
    {
      id: 'ex_glutes_003',
      name: 'Bulgarian Split Squat',
      type: 'compound',
      recoveryCost: 'high',
    }
  ],
  calves: [
    {
      id: 'ex_calves_001',
      name: 'Calf Raises',
      type: 'isolation',
      recoveryCost: 'low',
    },
    {
      id: 'ex_calves_002',
      name: 'Seated Calf Raises',
      type: 'isolation',
      recoveryCost: 'low',
    }
  ],
  shoulders: [
    {
      id: 'ex_shoulders_001',
      name: 'Overhead Press',
      type: 'compound',
      recoveryCost: 'medium',
    },
    {
      id: 'ex_shoulders_002',
      name: 'Dumbbell Shoulder Press',
      type: 'compound',
      recoveryCost: 'medium',
    },
    {
      id: 'ex_shoulders_003',
      name: 'Lateral Raises',
      type: 'isolation',
      recoveryCost: 'low',
    },
    {
      id: 'ex_shoulders_004',
      name: 'Front Raises',
      type: 'isolation',
      recoveryCost: 'low',
    },
    {
        id: 'ex_shoulders_005',
        name: 'Face Pulls',
        type: 'isolation',
        recoveryCost: 'low',
    }
  ]
};
