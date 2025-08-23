/**
 * @file workout-templates.js
 * This component allows users to create, save, and manage workout templates.
 * It's a key part of the new workflow that enables quick workout starts.
 */

import { LitElement, html } from "lit";
import { saveDataLocally, getDataLocally } from "../services/local-storage.js";
import { exerciseDatabase } from "../services/exercise-database.js";

class WorkoutTemplates extends LitElement {
  static properties = {
    templates: { type: Array },
    isLoading: { type: Boolean },
    errorMessage: { type: String },
    showNewTemplateForm: { type: Boolean },
    newTemplateName: { type: String },
    newTemplateExercises: { type: Array },
    isSaving: { type: Boolean },
    selectedFocus: { type: String },
    selectedFrequency: { type: String },
    selectedEquipment: { type: Array },
    selectedGenderFocus: { type: String },
    currentRoutineView: { type: String }, // 'menu', 'premade', 'create'
    selectedMesocycle: { type: Object }, // The selected mesocycle to view its phases
  };

  constructor() {
    super();
    this.templates = [];
    this.isLoading = true;
    this.errorMessage = "";
    this.showNewTemplateForm = false;
    this.newTemplateName = "";
    this.newTemplateExercises = [{ muscleGroup: '', name: "", sets: 3, reps: 10, rir: 2 }];
    this.isSaving = false;
    this.selectedFocus = "all";
    this.selectedFrequency = "all";
    this.selectedEquipment = [];
    this.selectedGenderFocus = "all";
    this.currentRoutineView = "menu";
    this.selectedMesocycle = null;

    this.broadMuscleGroups = {
        'Upper Body': ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms'],
        'Lower Body': ['quads', 'hamstrings', 'glutes', 'calves'],
        'Full Body': Object.keys(exerciseDatabase)
    };
    
    this.premadeMesocycles = [
      {
        name: "Ultimate PPL 6x",
        primaryFocus: "Hypertrophy",
        daysPerWeek: 6,
        genderFocus: "male",
        equipment: ["barbell", "dumbbell", "cable", "machine", "bodyweight"],
        phases: [
          {
            name: "Phase 1 - Base Hypertrophy",
            workouts: [
              { name: "PPL 6x - Phase 1 Push", exercises: [{ name: "Bench Press", sets: [{}], targetReps: "3-5" }, { name: "Larsen Press", sets: [{}, {}], targetReps: 10 }, { name: "Standing Dumbbell Arnold Press", sets: [{}, {}, {}], targetReps: "8-10" }, { name: "Press-Around", sets: [{}, {}], targetReps: "12-15" }] },
              { name: "PPL 6x - Phase 1 Pull", exercises: [{ name: "Barbell Deadlift", sets: [{}], targetReps: 4 }, { name: "Pull-Up", sets: [{}, {}], targetReps: "8-10" }, { name: "Kroc Row", sets: [{}, {}], targetReps: "10-12" }, { name: "Cable Shrug", sets: [{}, {}], targetReps: "10-12" }, { name: "Reverse Pec Deck", sets: [{}, {}], targetReps: "10-12" }, { name: "N1-Style Cross-Body Cable Bicep Curl", sets: [{}, {}], targetReps: "10-12" }] },
              { name: "PPL 6x - Phase 1 Legs", exercises: [{ name: "Squat", sets: [{}], targetReps: "2-4" }, { name: "Pause Squat (Back off)", sets: [{}, {}], targetReps: 5 }, { name: "Barbell RDL", sets: [{}, {}, {}], targetReps: "8-10" }, { name: "Walking Lunge", sets: [{}, {}], targetReps: 10 }, { name: "Seated Leg Curl", sets: [{}, {}, {}], targetReps: "10-12" }] },
            ]
          },
          {
            name: "Phase 2 - Maximum Effort",
            workouts: [
              { name: "PPL 6x - Phase 2 Push", exercises: [{ name: "Bench Press", sets: [{}], targetReps: "3-5" }, { name: "High-Incline Smith Machine Press", sets: [{}, {}], targetReps: "4-6" }, { name: "Egyptian Cable Lateral Raise", sets: [{}, {}], targetReps: "6-8" }, { name: "Overhead Cable Triceps Extension", sets: [{}, {}], targetReps: "4-6" }, { name: "Cable Triceps Kickback", sets: [{}, {}], targetReps: "6-8" }] },
              { name: "PPL 6x - Phase 2 Pull", exercises: [{ name: "Neutral-Grip Lat Pulldown", sets: [{}], targetReps: "4-6" }, { name: "Close-Grip Seated Cable Row", sets: [{}, {}], targetReps: "4-6" }, { name: "Machine Shrug", sets: [{}, {}], targetReps: "4-6" }, { name: "Alternating DB Curl", sets: [{}, {}], targetReps: "4-6" }, { name: "1-Arm DB Preacher Curl", sets: [{}], targetReps: "6-8" }] },
              { name: "PPL 6x - Phase 2 Legs", exercises: [{ name: "Deadlift", sets: [{}], targetReps: "4-6" }, { name: "Dumbbell Walking Lunge", sets: [{}, {}], targetReps: "4-6 per leg" }, { name: "Seated Leg Curl", sets: [{}, {}], targetReps: "4-6" }, { name: "Leg Press", sets: [{}, {}, {}], targetReps: "6-8" }] },
            ]
          },
          {
            name: "Phase 3 - Supercompensation",
            workouts: [
              { name: "PPL 6x - Phase 3 Push", exercises: [{ name: "Low Incline DB Press", sets: [{}, {}, {}], targetReps: 20 }, { name: "Machine Shoulder Press", sets: [{}, {}, {}], targetReps: 15 }, { name: "Cable Crossover Ladder", sets: [{}, {}, {}], targetReps: 20 }, { name: "Lean-In Constant Tension DB Lateral Raise", sets: [{}, {}, {}], targetReps: 15 }] },
              { name: "PPL 6x - Phase 3 Pull", exercises: [{ name: "Pendlay Row", sets: [{}, {}, {}], targetReps: "8-10" }, { name: "Machine Pulldown", sets: [{}, {}, {}], targetReps: "10-12" }, { name: "T-Bar Row", sets: [{}, {}, {}], targetReps: "12-15" }, { name: "Bayesian Cable Curl", sets: [{}, {}], targetReps: 12 }, { name: "Rope Facepull", sets: [{}, {}], targetReps: 15 }] },
              { name: "PPL 6x - Phase 3 Legs", exercises: [{ name: "Deadlift", sets: [{}], targetReps: 8 }, { name: "Leg Press", sets: [{}], targetReps: 12 }, { name: "Leg Extension", sets: [{}, {}], targetReps: 15 }, { name: "Lying Leg Curl", sets: [{}, {}], targetReps: 15 }, { name: "Seated Calf Raise", sets: [{}], targetReps: 20 }] },
            ]
          }
        ]
      },
      {
        name: "Ultimate PPL 5x",
        primaryFocus: "Hypertrophy",
        daysPerWeek: 5,
        genderFocus: "male",
        equipment: ["barbell", "dumbbell", "cable", "machine", "bodyweight"],
        phases: [
          {
            name: "Phase 1 - Base Hypertrophy",
            workouts: [
              { name: "PPL 5x - Phase 1 Push", exercises: [{ name: "Bench Press", sets: [{}], targetReps: "3-5" }, { name: "Larsen Press", sets: [{}, {}], targetReps: 10 }, { name: "Standing Dumbbell Arnold Press", sets: [{}, {}, {}], targetReps: "8-10" }, { name: "Press-Around", sets: [{}, {}], targetReps: "12-15" }, { name: "Diamond Pushup", sets: [{}], targetReps: "AMRAP" }] },
              { name: "PPL 5x - Phase 1 Pull", exercises: [{ name: "Barbell Deadlift", sets: [{}], targetReps: 4 }, { name: "Pull-Up", sets: [{}, {}], targetReps: "8-10" }, { name: "Kroc Row", sets: [{}, {}], targetReps: "10-12" }, { name: "Cable Shrug", sets: [{}, {}], targetReps: "10-12" }, { name: "N1-Style Cross-Body Cable Bicep Curl", sets: [{}, {}], targetReps: "10-12" }] },
              { name: "PPL 5x - Phase 1 Legs", exercises: [{ name: "Squat", sets: [{}], targetReps: "2-4" }, { name: "Pause Squat (Back off)", sets: [{}, {}], targetReps: 5 }, { name: "Barbell RDL", sets: [{}, {}, {}], targetReps: "8-10" }, { name: "Walking Lunge", sets: [{}, {}], targetReps: 10 }, { name: "Seated Leg Curl", sets: [{}, {}, {}], targetReps: "10-12" }] },
            ]
          },
          {
            name: "Phase 2 - Maximum Effort",
            workouts: [
              { name: "PPL 5x - Phase 2 Push", exercises: [{ name: "Bench Press", sets: [{}], targetReps: "3-5" }, { name: "High-Incline Smith Machine Press", sets: [{}, {}], targetReps: "4-6" }, { name: "Egyptian Cable Lateral Raise", sets: [{}, {}], targetReps: "6-8" }, { name: "Overhead Cable Triceps Extension", sets: [{}, {}], targetReps: "4-6" }] },
              { name: "PPL 5x - Phase 2 Pull", exercises: [{ name: "Neutral-Grip Lat Pulldown", sets: [{}], targetReps: "4-6" }, { name: "Close-Grip Seated Cable Row", sets: [{}, {}], targetReps: "4-6" }, { name: "Weighted Dip", sets: [{}, {}], targetReps: "4-6" }, { name: "Alternating DB Curl", sets: [{}], targetReps: "4-6" }] },
              { name: "PPL 5x - Phase 2 Legs", exercises: [{ name: "Deadlift", sets: [{}, {}], targetReps: "4-6" }, { name: "Dumbbell Walking Lunge", sets: [{}, {}], targetReps: "4-6 per leg" }, { name: "Seated Leg Curl", sets: [{}, {}], targetReps: "4-6" }, { name: "Leg Press", sets: [{}, {}, {}], targetReps: "6-8" }] },
            ]
          },
          {
            name: "Phase 3 - Supercompensation",
            workouts: [
              { name: "PPL 5x - Phase 3 Push", exercises: [{ name: "Low Incline DB Press", sets: [{}, {}, {}], targetReps: 20 }, { name: "Machine Shoulder Press", sets: [{}, {}, {}], targetReps: 15 }, { name: "Cable Crossover Ladder", sets: [{}, {}, {}], targetReps: 20 }, { name: "Lean-In Constant Tension DB Lateral Raise", sets: [{}, {}, {}], targetReps: 15 }] },
              { name: "PPL 5x - Phase 3 Pull", exercises: [{ name: "Pendlay Row", sets: [{}, {}, {}], targetReps: "8-10" }, { name: "Machine Pulldown", sets: [{}, {}, {}], targetReps: "10-12" }, { name: "T-Bar Row", sets: [{}, {}, {}], targetReps: "12-15" }, { name: "Bayesian Cable Curl", sets: [{}, {}], targetReps: 15 }] },
              { name: "PPL 5x - Phase 3 Legs", exercises: [{ name: "Deadlift", sets: [{}], targetReps: 8 }, { name: "Leg Press", sets: [{}], targetReps: 12 }, { name: "Leg Extension", sets: [{}, {}], targetReps: 15 }, { name: "Lying Leg Curl", sets: [{}, {}], targetReps: 15 }, { name: "Seated Calf Raise", sets: [{}], targetReps: 20 }] },
            ]
          }
        ]
      },
      {
        name: "Ultimate PPL 4x",
        primaryFocus: "Full Body",
        daysPerWeek: 4,
        genderFocus: "male",
        equipment: ["barbell", "dumbbell", "machine", "bodyweight", "cable"],
        phases: [
          {
            name: "Phase 1 - Base Hypertrophy",
            workouts: [
              { name: "PPL 4x - Phase 1 Full Body", exercises: [{ name: "Deadlift", sets: [{}], targetReps: 4 }, { name: "Stiff-Leg Deadlift", sets: [{}, {}], targetReps: 8 }, { name: "Close-Grip Barbell Incline Press", sets: [{}, {}], targetReps: "8, 5" }, { name: "Chin-Up", sets: [{}, {}], targetReps: "8-10" }, { name: "Leg Press", sets: [{}, {}], targetReps: "10-12" }, { name: "Kroc Row", sets: [{}, {}], targetReps: "10-12" }] },
            ]
          },
          {
            name: "Phase 2 - Maximum Effort",
            workouts: [
              { name: "PPL 4x - Phase 2 Full Body", exercises: [{ name: "Deadlift", sets: [{}, {}], targetReps: "4-6" }, { name: "Seated DB Shoulder Press", sets: [{}, {}], targetReps: "6-8" }, { name: "Close-Grip Seated Cable Row", sets: [{}, {}], targetReps: "4-6" }, { name: "Weighted Dip", sets: [{}, {}], targetReps: "4-6" }, { name: "Alternating DB Curl", sets: [{}], targetReps: "4-6" }] },
            ]
          },
          {
            name: "Phase 3 - Supercompensation",
            workouts: [
              { name: "PPL 4x - Phase 3 Full Body", exercises: [{ name: "Deadlift", sets: [{}], targetReps: 8 }, { name: "Bench Press", sets: [{}], targetReps: "2-4" }, { name: "Pull-Up", sets: [{}, {}, {}, {}], targetReps: 3 }, { name: "Leg Press", sets: [{}], targetReps: 12 }, { name: "Seated Leg Curl", sets: [{}, {}], targetReps: 15 }] },
            ]
          }
        ]
      },
      {
        name: "Glute Hypertrophy",
        primaryFocus: "Glutes",
        daysPerWeek: 3,
        genderFocus: "female",
        equipment: ["barbell", "dumbbell", "cable", "machine"],
        phases: [
          {
            name: "Mesocycle",
            workouts: [
              { name: "Glute Hypertrophy - Workout A", exercises: [{ name: "Barbell Hip Thrust", sets: [{}, {}, {}, {}], targetReps: "6-10" }, { name: "Barbell Squat", sets: [{}, {}, {}], targetReps: "6-10" }, { name: "Lying Leg Curl", sets: [{}, {}, {}], targetReps: "10-15" }, { name: "Glute Medius Kickback", sets: [{}, {}, {}], targetReps: "15-20" }] },
              { name: "Glute Hypertrophy - Workout B", exercises: [{ name: "Romanian Deadlift", sets: [{}, {}, {}], targetReps: "8-12" }, { name: "Walking Lunge", sets: [{}, {}, {}], targetReps: "10-15 per leg" }, { name: "Leg Extension", sets: [{}, {}, {}], targetReps: "12-15" }, { name: "Cable Pull Through", sets: [{}, {}, {}], targetReps: "15-20" }] },
            ]
          }
        ]
      },
      {
        name: "Women's Foundation",
        primaryFocus: "Glutes",
        daysPerWeek: 4,
        genderFocus: "female",
        equipment: ["barbell", "dumbbell", "machine", "bodyweight"],
        phases: [
          {
            name: "Block 1",
            workouts: [
              { name: "Women's Foundation - Block 1", exercises: [{ name: "Barbell Squat", sets: [{},{},{}], targetReps: "6-8" }, { name: "Glute Ham Raise", sets: [{},{},{}], targetReps: "8-10" }, { name: "Dumbbell Bench Press", sets: [{},{},{}], targetReps: "8-10" }, { name: "Lat Pulldown", sets: [{},{},{}], targetReps: "10-12" }] },
            ]
          },
          {
            name: "Block 2",
            workouts: [
              { name: "Women's Foundation - Block 2", exercises: [{ name: "Barbell Deadlift", sets: [{},{},{}], targetReps: "4-6" }, { name: "Barbell Hip Thrust", sets: [{},{},{}], targetReps: "6-8" }, { name: "Overhead Press", sets: [{},{},{}], targetReps: "6-8" }, { name: "Bent Over Row", sets: [{},{},{}], targetReps: "8-10" }] },
            ]
          }
        ]
      },
      {
        name: "Back Hypertrophy",
        primaryFocus: "Back",
        daysPerWeek: 3,
        genderFocus: "male",
        equipment: ["barbell", "cable", "machine", "dumbbell"],
        phases: [
          {
            name: "Mesocycle",
            workouts: [
              { name: "Back Hypertrophy - Workout A", exercises: [{ name: "Weighted Pull-Up", sets: [{},{},{},{}], targetReps: "6-8" }, { name: "Pendlay Row", sets: [{},{},{},{}], targetReps: "8-10" }, { name: "Chest-Supported T-Bar Row", sets: [{},{},{},{}], targetReps: "10-12" }, { name: "Cable Pullover", sets: [{},{},{}], targetReps: "12-15" }] },
              { name: "Back Hypertrophy - Workout B", exercises: [{ name: "Weighted Chin-Up", sets: [{},{},{},{}], targetReps: "6-8" }, { name: "Meadows Row", sets: [{},{},{},{}], targetReps: "8-10 per arm" }, { name: "Seated Cable Row", sets: [{},{},{},{}], targetReps: "10-12" }, { name: "Reverse Pec Deck", sets: [{},{},{}], targetReps: "12-15" }] },
            ]
          }
        ]
      },
      {
        name: "Chest Hypertrophy",
        primaryFocus: "Chest",
        daysPerWeek: 3,
        genderFocus: "male",
        equipment: ["barbell", "dumbbell", "cable", "machine", "bodyweight"],
        phases: [
          {
            name: "Mesocycle",
            workouts: [
              { name: "Chest Hypertrophy - Workout A", exercises: [{ name: "Bench Press", sets: [{},{},{}], targetReps: "6-8" }, { name: "Incline Dumbbell Press", sets: [{},{},{},{}], targetReps: "8-10" }, { name: "Weighted Dip", sets: [{},{},{}], targetReps: "8-10" }, { name: "Cable Crossover", sets: [{},{},{},{}], targetReps: "12-15" }] },
              { name: "Chest Hypertrophy - Workout B", exercises: [{ name: "Incline Barbell Press", sets: [{},{},{}], targetReps: "6-8" }, { name: "Machine Chest Press", sets: [{},{},{},{}], targetReps: "10-12" }, { name: "Standing Cable Fly", sets: [{},{},{}], targetReps: "10-12" }, { name: "Push-ups", sets: [{},{},{},{}], targetReps: "AMRAP" }] },
            ]
          }
        ]
      },
      {
        name: "Arm Hypertrophy",
        primaryFocus: "Arms",
        daysPerWeek: 3,
        genderFocus: "male",
        equipment: ["barbell", "dumbbell", "cable"],
        phases: [
          {
            name: "Mesocycle",
            workouts: [
              { name: "Arm Hypertrophy - Workout A", exercises: [{ name: "Close-Grip Barbell Bench Press", sets: [{},{},{},{}], targetReps: "6-8" }, { name: "Barbell Curl", sets: [{},{},{},{}], targetReps: "8-10" }, { name: "Overhead Tricep Extension", sets: [{},{},{}], targetReps: "10-12" }, { name: "Incline Dumbbell Curl", sets: [{},{},{}], targetReps: "10-12" }] },
              { name: "Arm Hypertrophy - Workout B", exercises: [{ name: "EZ-Bar Skullcrusher", sets: [{},{},{},{}], targetReps: "6-8" }, { name: "Preacher Curl", sets: [{},{},{},{}], targetReps: "8-10" }, { name: "Cable Pushdown", sets: [{},{},{}], targetReps: "10-12" }, { name: "Hammer Curl", sets: [{},{},{}], targetReps: "10-12" }] },
            ]
          }
        ]
      },
      {
        name: "Neck & Trap",
        primaryFocus: "Neck & Traps",
        daysPerWeek: 2,
        genderFocus: "male",
        equipment: ["machine", "dumbbell", "bodyweight", "plate"],
        phases: [
          {
            name: "Mesocycle",
            workouts: [
              { name: "Neck & Trap - Workout A", exercises: [{ name: "45-Degree Neck Extension", sets: [{},{},{},{},{},{}], targetReps: "15-20" }, { name: "Side Neck Raise", sets: [{},{},{},{},{},{}], targetReps: "15-20 per side" }, { name: "Dumbbell Shrug", sets: [{},{},{},{},{}], targetReps: "10-15" }] },
              { name: "Neck & Trap - Workout B", exercises: [{ name: "Neck Flexion (with plate)", sets: [{},{},{},{},{},{}], targetReps: "15-20" }, { name: "Head Harness Neck Extension", sets: [{},{},{},{},{},{}], targetReps: "15-20" }, { name: "Machine Shrug", sets: [{},{},{},{},{}], targetReps: "10-15" }] },
            ]
          }
        ]
      },
      {
        name: "Powerbuilding 2.0 4x",
        primaryFocus: "Strength",
        daysPerWeek: 4,
        genderFocus: "male",
        equipment: ["barbell", "dumbbell", "cable", "machine"],
        phases: [
          {
            name: "Mesocycle",
            workouts: [
              { name: "Powerbuilding 2.0 4x - Bench", exercises: [{ name: "Bench Press", sets: [{},{},{},{}], targetReps: "4-6" }, { name: "Barbell Row", sets: [{},{},{},{}], targetReps: "6-8" }, { name: "Seated Dumbbell Shoulder Press", sets: [{},{},{}], targetReps: "8-10" }, { name: "Lat Pulldown", sets: [{},{},{}], targetReps: "8-10" }] },
              { name: "Powerbuilding 2.0 4x - Squat", exercises: [{ name: "Barbell Squat", sets: [{},{},{},{}], targetReps: "4-6" }, { name: "Deadlift", sets: [{},{},{}], targetReps: "4-6" }, { name: "Leg Press", sets: [{},{},{}], targetReps: "8-10" }, { name: "Leg Curl", sets: [{},{},{}], targetReps: "10-12" }] },
            ]
          }
        ]
      },
      {
        name: "Powerbuilding 2.0 5-6x",
        primaryFocus: "Strength & Hypertrophy",
        daysPerWeek: 5,
        genderFocus: "male",
        equipment: ["barbell", "dumbbell", "cable", "machine"],
        phases: [
          {
            name: "Power Phase",
            workouts: [
              { name: "Powerbuilding 2.0 5-6x - Upper Power", exercises: [{ name: "Bench Press", sets: [{},{},{}], targetReps: "4-6" }, { name: "Barbell Row", sets: [{},{},{}], targetReps: "6-8" }, { name: "Overhead Press", sets: [{},{},{}], targetReps: "6-8" }, { name: "Pull-Up", sets: [{},{},{}], targetReps: "8-10" }] },
              { name: "Powerbuilding 2.0 5-6x - Lower Power", exercises: [{ name: "Barbell Squat", sets: [{},{},{}], targetReps: "4-6" }, { name: "Deadlift", sets: [{},{},{}], targetReps: "4-6" }, { name: "Leg Press", sets: [{},{},{}], targetReps: "8-10" }, { name: "Leg Extension", sets: [{},{},{}], targetReps: "10-12" }] },
            ]
          },
          {
            name: "Hypertrophy Phase",
            workouts: [
              { name: "Powerbuilding 2.0 5-6x - Upper Hypertrophy", exercises: [{ name: "Incline Dumbbell Press", sets: [{},{},{},{}], targetReps: "10-12" }, { name: "Lat Pulldown", sets: [{},{},{},{}], targetReps: "10-12" }, { name: "Seated Cable Row", sets: [{},{},{}], targetReps: "12-15" }, { name: "Dumbbell Lateral Raise", sets: [{},{},{},{}], targetReps: "15-20" }] },
              { name: "Powerbuilding 2.0 5-6x - Lower Hypertrophy", exercises: [{ name: "Romanian Deadlift", sets: [{},{},{},{}], targetReps: "10-12" }, { name: "Leg Press", sets: [{},{},{},{}], targetReps: "12-15" }, { name: "Lying Leg Curl", sets: [{},{},{}], targetReps: "12-15" }, { name: "Calf Raises", sets: [{},{},{},{}], targetReps: "15-20" }] },
            ]
          }
        ]
      },
      {
        name: "Essentials 4x",
        primaryFocus: "Full Body",
        daysPerWeek: 4,
        genderFocus: "male",
        equipment: ["barbell", "dumbbell", "cable", "machine", "bodyweight"],
        phases: [
          {
            name: "Mesocycle",
            workouts: [
              { name: "Essentials 4x - Upper Body", exercises: [{ name: "Bench Press", sets: [{},{}], targetReps: "5-8" }, { name: "Barbell Row", sets: [{},{}], targetReps: "5-8" }, { name: "Seated Dumbbell Shoulder Press", sets: [{},{}], targetReps: "8-12" }, { name: "Lat Pulldown", sets: [{},{}], targetReps: "8-12" }] },
              { name: "Essentials 4x - Lower Body", exercises: [{ name: "Barbell Squat", sets: [{},{}], targetReps: "5-8" }, { name: "Romanian Deadlift", sets: [{},{}], targetReps: "8-12" }, { name: "Leg Press", sets: [{},{}], targetReps: "12-15" }, { name: "Hamstring Curls", sets: [{},{}], targetReps: "12-15" }] },
            ]
          }
        ]
      },
      {
        name: "At-Home Beginner",
        primaryFocus: "Full Body",
        daysPerWeek: 3,
        genderFocus: "female",
        equipment: ["bodyweight", "dumbbell", "band"],
        phases: [
          {
            name: "Mesocycle",
            workouts: [
              { name: "At-Home Beginner - Full Body A", exercises: [{ name: "Push-ups", sets: [{},{},{}], targetReps: "AMRAP" }, { name: "Dumbbell Row", sets: [{},{},{}], targetReps: "10-15 per side" }, { name: "Dumbbell Goblet Squat", sets: [{},{},{},{}], targetReps: "10-15" }, { name: "Dumbbell Romanian Deadlift", sets: [{},{},{}], targetReps: "10-15" }] },
              { name: "At-Home Beginner - Full Body B", exercises: [{ name: "Dumbbell Overhead Press", sets: [{},{},{}], targetReps: "10-12" }, { name: "Dumbbell Lunges", sets: [{},{},{}], targetReps: "10-12 per leg" }, { name: "Glute Bridge", sets: [{},{},{},{}], targetReps: "15-20" }, { name: "Dumbbell Floor Press", sets: [{},{},{}], targetReps: "10-15" }] },
            ]
          }
        ]
      }
    ];
  }

  connectedCallback() {
    super.connectedCallback();
    this._fetchTemplates();
  }

  async _fetchTemplates() {
    this.isLoading = true;
    try {
      const data = getDataLocally();
      this.templates = [...(data?.templates || [])];
    } catch (error) {
      this.errorMessage = "Failed to load templates.";
      console.error(error);
    } finally {
      this.isLoading = false;
    }
  }

  _addExerciseToTemplate() {
    this.newTemplateExercises = [...this.newTemplateExercises, { muscleGroup: '', name: "", sets: 3, reps: 10, rir: 2 }];
  }

  _handleExerciseInput(index, field, value) {
    const updatedExercises = [...this.newTemplateExercises];
    updatedExercises[index][field] = value;
    this.newTemplateExercises = updatedExercises;
  }
  
  _handleMuscleGroupChange(index, value) {
    const updatedExercises = [...this.newTemplateExercises];
    updatedExercises[index].muscleGroup = value;
    updatedExercises[index].name = "";
    this.newTemplateExercises = updatedExercises;
  }

  _removeExercise(index) {
    const updatedExercises = this.newTemplateExercises.filter((_, i) => i !== index);
    this.newTemplateExercises = updatedExercises;
  }
  
  async _saveTemplate() {
    this.isSaving = true;
    try {
        const newTemplate = {
            name: this.newTemplateName,
            primaryFocus: "custom",
            daysPerWeek: 0,
            genderFocus: "all",
            equipment: [],
            exercises: this.newTemplateExercises.map(ex => ({
                name: ex.name,
                sets: Array(Number(ex.sets) || 3).fill({}),
                targetReps: Number(ex.reps) || 10,
                targetRir: Number(ex.rir) || 2,
            }))
        };
        const updatedTemplates = [...this.templates.filter(t => t.primaryFocus !== "custom"), newTemplate];
        const response = saveDataLocally({ templates: updatedTemplates });

        if (response.success) {
            this.templates = updatedTemplates;
            this.currentRoutineView = "menu";
            this.newTemplateName = "";
            this.newTemplateExercises = [];
            this.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Template saved successfully!', type: 'success' }, bubbles: true, composed: true }));
        } else {
            throw new Error(response.error);
        }
    } catch (error) {
        this.dispatchEvent(new CustomEvent('show-toast', { detail: { message: `Failed to save template: ${error.message}`, type: 'error' }, bubbles: true, composed: true }));
    } finally {
        this.isSaving = false;
    }
  }
  
  _loadTemplate(template) {
    this.dispatchEvent(new CustomEvent('start-workout-with-template', { 
      detail: { template: template },
      bubbles: true, 
      composed: true 
    }));
  }

  _handleFilterChange(e) {
    const { name, value } = e.target;
    if (name === "equipment") {
      const isChecked = e.target.checked;
      if (isChecked) {
        this.selectedEquipment = [...this.selectedEquipment, value];
      } else {
        this.selectedEquipment = this.selectedEquipment.filter(item => item !== value);
      }
    } else {
      this[`selected${name.charAt(0).toUpperCase() + name.slice(1)}`] = value;
    }
    this.requestUpdate();
  }
  
  _getFilteredMesocycles() {
    return this.premadeMesocycles.filter(meso => {
      const focusMatch = this.selectedFocus === 'all' || meso.primaryFocus.includes(this.selectedFocus);
      const frequencyMatch = this.selectedFrequency === 'all' || meso.daysPerWeek == this.selectedFrequency;
      const genderMatch = this.selectedGenderFocus === 'all' || meso.genderFocus === this.selectedGenderFocus;
      const equipmentMatch = this.selectedEquipment.length === 0 || this.selectedEquipment.every(eq => meso.equipment.includes(eq));
      return focusMatch && frequencyMatch && genderMatch && equipmentMatch;
    });
  }

  render() {
    if (this.isLoading) {
      return html`<p>Loading templates...</p>`;
    }
    if (this.errorMessage) {
      return html`<p class="error-message">${this.errorMessage}</p>`;
    }

    let viewContent;
    switch(this.currentRoutineView) {
        case 'menu':
            viewContent = this._renderRoutineMenu();
            break;
        case 'premade':
            if (this.selectedMesocycle) {
                viewContent = this._renderMesocyclePhases();
            } else {
                viewContent = this._renderMesocycleList();
            }
            break;
        case 'create':
            viewContent = this._renderNewTemplateForm();
            break;
        default:
            viewContent = this._renderRoutineMenu();
    }
    
    return html`
      <div class="container">
        <header class="app-header">
          <h1>Routine</h1>
          ${this.currentRoutineView !== 'menu' && !this.selectedMesocycle ? html`
              <button class="btn btn-icon" @click=${() => this.currentRoutineView = 'menu'}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
              </button>
          ` : ''}
          ${this.selectedMesocycle ? html`
              <button class="btn btn-icon" @click=${() => this.selectedMesocycle = null}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
              </button>
          ` : ''}
        </header>
        ${viewContent}
      </div>
    `;
  }

  _renderRoutineMenu() {
      return html`
        <nav class="home-nav-buttons">
          <button class="hub-option card-interactive" @click=${() => this.currentRoutineView = 'premade'}>
            <div class="hub-option-icon">📋</div>
            <div class="hub-option-text"><h3>Pre Made Mesocycles</h3><p>Choose from our library</p></div>
          </button>
          <button class="hub-option card-interactive" @click=${() => this.currentRoutineView = 'create'}>
            <div class="hub-option-icon">✍️</div>
            <div class="hub-option-text"><h3>Create Your Own</h3><p>Build a routine from scratch</p></div>
          </button>
        </nav>
      `;
  }
  
  _renderMesocycleList() {
    const filteredMesocycles = this._getFilteredMesocycles();
    const focusOptions = [...new Set(this.premadeMesocycles.map(t => t.primaryFocus))];
    const frequencyOptions = [...new Set(this.premadeMesocycles.map(t => t.daysPerWeek))].sort((a,b) => a-b);
    const genderOptions = [...new Set(this.premadeMesocycles.flatMap(t => t.genderFocus))].filter(g => g !== 'all');
    const equipmentOptions = [...new Set(this.premadeMesocycles.flatMap(t => t.equipment))];

    return html`
      <div class="filter-controls card">
          <div class="input-group">
            <label for="focus-select">Primary Focus:</label>
            <select name="focus" id="focus-select" @change=${this._handleFilterChange}>
              <option value="all">All</option>
              ${focusOptions.map(focus => html`<option value="${focus}">${focus}</option>`)}
            </select>
          </div>
          <div class="input-group">
            <label for="frequency-select">Workout Frequency (days/week):</label>
            <select name="frequency" id="frequency-select" @change=${this._handleFilterChange}>
              <option value="all">All</option>
               ${frequencyOptions.map(days => html`<option value="${days}">${days}</option>`)}
            </select>
          </div>
          <div class="input-group">
            <label>Equipment:</label>
            <div class="checkbox-group">
              ${equipmentOptions.map(eq => html`
                <label class="checkbox-label">
                  <input type="checkbox" name="equipment" value="${eq}" @change=${this._handleFilterChange} .checked=${this.selectedEquipment.includes(eq)}>
                  ${eq.charAt(0).toUpperCase() + eq.slice(1)}
                </label>
              `)}
            </div>
          </div>
          <div class="input-group">
            <label for="gender-select">Gender Focus:</label>
            <select name="genderFocus" id="gender-select" @change=${this._handleFilterChange}>
              <option value="all">All</option>
              ${genderOptions.map(gender => html`<option value="${gender}">${gender.charAt(0).toUpperCase() + gender.slice(1)}</option>`)}
            </select>
          </div>
        </div>
      <div class="templates-list">
        ${filteredMesocycles.length === 0 ? html`<p class="no-data">No mesocycles match your criteria.</p>` : ''}
        ${filteredMesocycles.map(meso => html`
          <div class="card link-card template-card" @click=${() => this.selectedMesocycle = meso}>
            <div class="template-info">
              <h3>${meso.name}</h3>
              <p>${meso.primaryFocus} | ${meso.daysPerWeek}x/week</p>
            </div>
            <button class="btn-icon" aria-label="View mesocycle">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          </div>
        `)}
      </div>
    `;
  }
  
  _renderMesocyclePhases() {
      if (!this.selectedMesocycle) return html``;
      
      return html`
        <div class="mesocycle-phases-view">
          <h2>${this.selectedMesocycle.name}</h2>
          <p>Choose a phase and a workout to start.</p>
          
          ${this.selectedMesocycle.phases.map(phase => html`
            <div class="card" style="margin-bottom: var(--space-6);">
              <h3>${phase.name}</h3>
              <div class="templates-list" style="margin-top: var(--space-4);">
                ${phase.workouts.map(workout => html`
                  <div class="card link-card template-card">
                    <div class="template-info" @click=${() => this._loadTemplate(workout)}>
                      <h3>${workout.name}</h3>
                      <p>${workout.exercises.length} exercises</p>
                    </div>
                    <button class="btn-icon" @click=${() => this._loadTemplate(workout)} aria-label="Load workout">
                      ▶️
                    </button>
                  </div>
                `)}
              </div>
            </div>
          `)}
        </div>
      `;
  }

  _getExercisesForGroup(groupName) {
    if (this.broadMuscleGroups[groupName]) {
      // It's a broad category
      return this.broadMuscleGroups[groupName].flatMap(muscle => exerciseDatabase[muscle] || []);
    } else if (exerciseDatabase[groupName]) {
      // It's a specific muscle
      return exerciseDatabase[groupName];
    }
    return [];
  }

  _renderNewTemplateForm() {
    const muscleGroups = [
        ...Object.keys(this.broadMuscleGroups), 
        ...Object.keys(exerciseDatabase)
    ];

    return html`
      <div class="new-template-form card">
        <h3>Create New Template</h3>
        <div class="input-group">
          <label for="template-name">Template Name:</label>
          <input
            id="template-name"
            type="text"
            .value=${this.newTemplateName}
            @input=${(e) => this.newTemplateName = e.target.value}
            placeholder="e.g., Full Body A"
          />
        </div>
        
        <div class="exercise-list">
          ${this.newTemplateExercises.map((exercise, index) => {
            const availableExercises = this._getExercisesForGroup(exercise.muscleGroup);
            return html`
            <div class="exercise-editor card">
              <div class="exercise-editor-header">
                <div class="exercise-selectors">
                  <select class="muscle-group-select" @change=${(e) => this._handleMuscleGroupChange(index, e.target.value)}>
                    <option value="">Select Muscle Group</option>
                    ${muscleGroups.map(muscle => html`<option value="${muscle}">${muscle.charAt(0).toUpperCase() + muscle.slice(1)}</option>`)}
                  </select>

                  ${exercise.muscleGroup ? html`
                    <select class="exercise-select" .value=${exercise.name} @change=${(e) => this._handleExerciseInput(index, 'name', e.target.value)}>
                      <option value="">Select Exercise</option>
                      ${availableExercises.map(ex => html`<option value="${ex.name}">${ex.name}</option>`)}
                    </select>
                  ` : ''}
                </div>
                <button class="btn-icon" @click=${() => this._removeExercise(index)}>
                  ✖️
                </button>
              </div>
              <div class="exercise-details">
                <label>Sets: <input type="number" .value=${exercise.sets} @input=${(e) => this._handleExerciseInput(index, 'sets', e.target.value)}></label>
                <label>Reps: <input type="number" .value=${exercise.reps} @input=${(e) => this._handleExerciseInput(index, 'reps', e.target.value)}></label>
                <label>RIR: <input type="number" .value=${exercise.rir} @input=${(e) => this._handleExerciseInput(index, 'rir', e.target.value)}></label>
              </div>
            </div>
          `})}
        </div>
        
        <div class="form-actions">
          <button class="secondary-button" @click=${this._addExerciseToTemplate}>
            Add Exercise
          </button>
          <button class="cta-button" @click=${this._saveTemplate} ?disabled=${!this.newTemplateName || this.newTemplateExercises.length === 0 || this.isSaving}>
            ${this.isSaving ? html`<div class="spinner"></div>` : 'Save Template'}
          </button>
        </div>
      </div>
    `;
  }

  createRenderRoot() {
      return this;
  }
}

customElements.define("workout-templates", WorkoutTemplates);
