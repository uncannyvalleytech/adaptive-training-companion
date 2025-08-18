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
      recoveryCost: 'medium', // -0
    },
    {
      id: 'ex_chest_002',
      name: 'Dumbbell Bench Press',
      type: 'compound',
      recoveryCost: 'medium', // -0
    },
    {
      id: 'ex_chest_003',
      name: 'Incline Dumbbell Press',
      type: 'compound',
      recoveryCost: 'medium', // -0
    },
    {
      id: 'ex_chest_004',
      name: 'Machine Chest Press',
      type: 'compound',
      recoveryCost: 'low', // +1
    },
    {
      id: 'ex_chest_005',
      name: 'Cable Crossover',
      type: 'isolation',
      recoveryCost: 'low', // +1
    },
    {
      id: 'ex_chest_006',
      name: 'Push-ups',
      type: 'compound',
      recoveryCost: 'low', // +1
    },
  ],
  back: [
    {
      id: 'ex_back_001',
      name: 'Deadlift',
      type: 'compound',
      recoveryCost: 'high', // -1
    },
    {
      id: 'ex_back_002',
      name: 'Pull-ups',
      type: 'compound',
      recoveryCost: 'medium', // 0
    },
    {
      id: 'ex_back_003',
      name: 'Barbell Row',
      type: 'compound',
      recoveryCost: 'medium', // 0
    },
    {
      id: 'ex_back_004',
      name: 'Lat Pulldown',
      type: 'compound',
      recoveryCost: 'low', // +1
    },
    {
      id: 'ex_back_005',
      name: 'Seated Cable Row',
      type: 'compound',
      recoveryCost: 'low', // +1
    },
    {
      id: 'ex_back_006',
      name: 'Face Pulls',
      type: 'isolation',
      recoveryCost: 'low', // +1
    },
  ],
  legs: [
    {
      id: 'ex_legs_001',
      name: 'Barbell Squat',
      type: 'compound',
      recoveryCost: 'high', // -1
    },
    {
      id: 'ex_legs_002',
      name: 'Leg Press',
      type: 'compound',
      recoveryCost: 'medium', // 0
    },
    {
      id: 'ex_legs_003',
      name: 'Romanian Deadlift',
      type: 'compound',
      recoveryCost: 'medium', // 0
    },
    {
      id: 'ex_legs_004',
      name: 'Leg Extensions',
      type: 'isolation',
      recoveryCost: 'low', // +1
    },
    {
      id: 'ex_legs_005',
      name: 'Hamstring Curls',
      type: 'isolation',
      recoveryCost: 'low', // +1
    },
    {
      id: 'ex_legs_006',
      name: 'Calf Raises',
      type: 'isolation',
      recoveryCost: 'low', // +1
    },
  ],
  shoulders: [
    {
      id: 'ex_shoulders_001',
      name: 'Overhead Press',
      type: 'compound',
      recoveryCost: 'medium', // 0
    },
    {
      id: 'ex_shoulders_002',
      name: 'Dumbbell Shoulder Press',
      type: 'compound',
      recoveryCost: 'medium', // 0
    },
    {
      id: 'ex_shoulders_003',
      name: 'Lateral Raises',
      type: 'isolation',
      recoveryCost: 'low', // +1
    },
    {
      id: 'ex_shoulders_004',
      name: 'Front Raises',
      type: 'isolation',
      recoveryCost: 'low', // +1
    },
  ],
  arms: [
    {
      id: 'ex_arms_001',
      name: 'Barbell Curl',
      type: 'isolation',
      recoveryCost: 'low', // +1
    },
    {
      id: 'ex_arms_002',
      name: 'Dumbbell Hammer Curl',
      type: 'isolation',
      recoveryCost: 'low', // +1
    },
    {
      id: 'ex_arms_003',
      name: 'Tricep Pushdown',
      type: 'isolation',
      recoveryCost: 'low', // +1
    },
    {
      id: 'ex_arms_004',
      name: 'Skull Crushers',
      type: 'isolation',
      recoveryCost: 'low', // +1
    },
  ],
};
