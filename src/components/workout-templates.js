/*
===============================================
SECTION 1: COMPONENT AND SERVICE IMPORTS
===============================================
*/
import { LitElement, html, css } from "lit";
import { saveDataLocally, getDataLocally } from "../services/local-storage.js";

/*
===============================================
SECTION 2: WORKOUT-TEMPLATES COMPONENT DEFINITION
===============================================
*/
class WorkoutTemplates extends LitElement {
  static properties = {
    templates: { type: Array },
    isLoading: { type: Boolean },
    errorMessage: { type: String },
    editingRoutineId: { type: String },
    newTemplateName: { type: String },
    newTemplateDays: { type: Array },
    activeDayIndex: { type: Number },
    isSaving: { type: Boolean },
    currentRoutineView: { type: String },
    selectedProgram: { type: Object },
    selectedDurationType: { type: String },
    selectedDuration: { type: Number },
    selectedStartWorkout: { type: Number },
  };

  constructor() {
    super();
    this.templates = [];
    this.isLoading = true;
    this.errorMessage = "";
    this.editingRoutineId = null;
    this.newTemplateName = "";
    this.newTemplateDays = [
      { name: "Day 1", exercises: [{ muscleGroup: '', name: "", sets: 3, reps: 10, rir: 2 }] }
    ];
    this.activeDayIndex = 0;
    this.isSaving = false;
    this.currentRoutineView = "menu";
    this.selectedProgram = null;
    this.selectedDurationType = 'weeks';
    this.selectedDuration = 4;
    this.selectedStartWorkout = 0;

    this.exerciseDatabase = {
        'chest': [
            { name: 'Barbell Bench Press' },
            { name: 'Dumbbell Bench Press' },
            { name: 'Incline Dumbbell Press' },
            { name: 'Machine Chest Press' },
            { name: 'Cable Crossover' },
            { name: 'Push-ups' },
            { name: 'Incline Barbell Press' },
            { name: 'Decline Bench Press' },
            { name: 'Chest Dip' },
            { name: 'Larsen Press' },
            { name: 'Standing Dumbbell Arnold Press' },
            { name: 'Press-Around' },
            { name: 'Low Incline DB Press' },
            { name: 'Machine Shoulder Press' },
            { name: 'Cable Crossover Ladder' },
            { name: 'High-Incline Smith Machine Press' },
            { name: 'Incline Push-ups' },
            { name: 'Seated Cable Fly' },
            { name: 'Standing Cable Fly' },
            { name: 'Dumbbell Flyes' }
        ],
        'back': [
            { name: 'Barbell Deadlift' },
            { name: 'Pull-Up' },
            { name: 'Barbell Row' },
            { name: 'Lat Pulldown' },
            { name: 'Seated Cable Row' },
            { name: 'Face Pulls' },
            { name: 'T-Bar Row' },
            { name: 'Dumbbell Row' },
            { name: 'Kroc Row' },
            { name: 'Cable Shrug' },
            { name: 'Reverse Pec Deck' },
            { name: 'Neutral-Grip Lat Pulldown' },
            { name: 'Close-Grip Seated Cable Row' },
            { name: 'Machine Shrug' },
            { name: 'Pendlay Row' },
            { name: 'Machine Pulldown' },
            { name: 'Rope Facepull' },
            { name: 'Weighted Pull-Up' },
            { name: 'Bent-Over Barbell Row' },
            { name: 'Chest-Supported T-Bar Row' },
            { name: 'Cable Pullover' },
            { name: 'Weighted Chin-Up' },
            { name: 'Meadows Row' },
            { name: 'Machine Reverse Fly' }
        ],
        'shoulders': [
            { name: 'Overhead Press' },
            { name: 'Dumbbell Shoulder Press' },
            { name: 'Lateral Raises' },
            { name: 'Front Raises' },
            { name: 'Face Pulls' },
            { name: 'Egyptian Cable Lateral Raise' },
            { name: 'Lean-In Constant Tension DB Lateral Raise' },
            { name: 'Cable Lateral Raise' },
            { name: 'Seated Dumbbell Press' },
            { name: 'One-Arm Cable Lateral Raise' },
            { name: 'Barbell Front Raise' },
            { name: 'Dumbbell Shrugs' },
            { name: 'Seated Dumbbell Shoulder Press' },
            { name: 'Seated Barbell Press' },
            { name: 'Seated Arnold Press' },
            { name: 'Dumbbell Lateral Raise' },
            { name: 'Upright Row' },
            { name: 'Barbell Shrug' }
        ],
        'biceps': [
            { name: 'Barbell Curl' },
            { name: 'Dumbbell Hammer Curl' },
            { name: 'Preacher Curl' },
            { name: 'Incline Dumbbell Curl' },
            { name: 'N1-Style Cross-Body Cable Bicep Curl' },
            { name: 'Alternating DB Curl' },
            { name: '1-Arm DB Preacher Curl' },
            { name: 'Bayesian Cable Curl' },
            { name: 'Dumbbell Bicep Curls' },
            { name: 'Cable Bicep Curl' },
            { name: 'Concentration Curl' },
            { name: 'EZ Bar Preacher Curl' },
            { name: 'Hammer Curl' },
            { name: 'Incline Dumbbell Curl & Incline Skullcrusher' },
            { name: 'Cable Curl & Cable Pressdown' }
        ],
        'triceps': [
            { name: 'Tricep Pushdown' },
            { name: 'Skull Crushers' },
            { name: 'Overhead Tricep Extension' },
            { name: 'Close Grip Bench Press' },
            { name: 'Overhead Cable Triceps Extension' },
            { name: 'Cable Triceps Kickback' },
            { name: 'Triceps Rope Pushdown' },
            { name: 'Triceps Pushdown' },
            { name: 'Dumbbell Skullcrushers' },
            { name: 'EZ Bar Skullcrusher' },
            { name: 'Cable Tricep Extension' },
            { name: 'Tricep Overhead Extension' },
            { name: 'Tricep Kickback' },
            { name: 'Close-Grip Barbell Bench Press' }
        ],
        'quads': [
            { name: 'Barbell Squat' },
            { name: 'Leg Press' },
            { name: 'Leg Extensions' },
            { name: 'Hack Squat' },
            { name: 'Pause Squat (Back off)' },
            { name: 'Front Squats' },
            { name: 'Goblet Squat' },
            { name: 'Smith Machine Squat' },
            { name: 'Leg Extension' },
            { name: 'Squats' }
        ],
        'hamstrings': [
            { name: 'Romanian Deadlift' },
            { name: 'Hamstring Curls' },
            { name: 'Good Mornings' },
            { name: 'Barbell RDL' },
            { name: 'Seated Leg Curl' },
            { name: 'Lying Leg Curl' },
            { name: 'Stiff-Leg Deadlift' },
            { name: 'Leg Curl' },
            { name: 'Lying Leg Curl' },
            { name: 'Dumbbell Romanian Deadlift' }
        ],
        'glutes': [
            { name: 'Hip Thrust' },
            { name: 'Glute Kickback' },
            { name: 'Bulgarian Split Squat' },
            { name: 'Walking Lunge' },
            { name: 'Glute Medius Kickback' },
            { name: 'Cable Pull Through' },
            { name: 'Barbell Hip Thrust' },
            { name: 'Dumbbell Walking Lunge' },
            { name: 'Reverse Lunges' },
            { name: 'Glute Cable Kickback' },
            { name: 'Smith Machine Sumo Squats' },
            { name: 'Hyperextensions (Glute Focused)' },
            { name: 'Abduction Machine' },
            { name: 'Glute Bridge' }
        ],
        'calves': [
            { name: 'Calf Raises' },
            { name: 'Seated Calf Raises' },
            { name: 'Standing Calf Raise' },
            { name: 'Seated Calf Raise' }
        ],
        'arms': [
            { name: 'Barbell Curl' },
            { name: 'Tricep Pushdown' },
            { name: 'Hammer Curl' },
            { name: 'Close Grip Bench Press' },
            { name: 'Preacher Curl' },
            { name: 'Overhead Tricep Extension' },
            { name: 'Diamond Pushup' }
        ],
        'legs': [
            { name: 'Barbell Squat' },
            { name: 'Romanian Deadlift' },
            { name: 'Leg Press' },
            { name: 'Leg Extensions' },
            { name: 'Hamstring Curls' },
            { name: 'Walking Lunge' },
            { name: 'Bulgarian Split Squat' },
            { name: 'Hip Thrust' },
            { name: 'Calf Raises' },
            { name: 'Barbell Back Squat' },
            { name: 'Conventional Deadlift' }
        ],
        'upper body': [
            { name: 'Bench Press' },
            { name: 'Pull-ups' },
            { name: 'Overhead Press' },
            { name: 'Barbell Row' },
            { name: 'Lat Pulldown' },
            { name: 'Dumbbell Shoulder Press' },
            { name: 'Incline Dumbbell Press' }
        ],
        'lower body': [
            { name: 'Squat' },
            { name: 'Deadlift' },
            { name: 'Romanian Deadlift' },
            { name: 'Leg Press' },
            { name: 'Walking Lunge' },
            { name: 'Hip Thrust' },
            { name: 'Leg Extensions' },
            { name: 'Hamstring Curls' }
        ],
        'full body': [
            { name: 'Deadlift' },
            { name: 'Squat' },
            { name: 'Bench Press' },
            { name: 'Pull-ups' },
            { name: 'Overhead Press' },
            { name: 'Barbell Row' },
            { name: 'Push-ups' },
            { name: 'Burpee' }
        ],
        'push': [
            { name: 'Bench Press' },
            { name: 'Overhead Press' },
            { name: 'Incline Dumbbell Press' },
            { name: 'Lateral Raises' },
            { name: 'Tricep Pushdown' },
            { name: 'Close Grip Bench Press' },
            { name: 'Dumbbell Shoulder Press' }
        ],
        'pull': [
            { name: 'Pull-ups' },
            { name: 'Barbell Row' },
            { name: 'Lat Pulldown' },
            { name: 'Seated Cable Row' },
            { name: 'Face Pulls' },
            { name: 'Barbell Curl' },
            { name: 'Hammer Curl' }
        ],
        'neck & traps': [
            { name: '45-Degree Neck Extension' },
            { name: 'Side Neck Raise' },
            { name: 'Dumbbell Shrug' },
            { name: 'Neck Flexion (with plate)' },
            { name: 'Head Harness Neck Extension' },
            { name: 'Machine Shrug' }
        ]
    };
    
    this.premadeMesocycles = this._groupWorkouts([
    {
        name: "Beginner Full Body A/B - Workout A",
        primaryFocus: "Full Body",
        daysPerWeek: 2,
        exercises: [
            { name: "Barbell Squat", sets: [{}, {}, {}], targetReps: "8-10" },
            { name: "Barbell Bench Press", sets: [{}, {}, {}], targetReps: "8-10" },
            { name: "Bent Over Barbell Row", sets: [{}, {}, {}], targetReps: "8-10" },
            { name: "Leg Press", sets: [{}, {}], targetReps: "10-12" },
            { name: "Plank", sets: [{}, {}, {}], targetReps: "30-60s" }
        ]
    },
    {
        name: "Beginner Full Body A/B - Workout B",
        primaryFocus: "Full Body",
        daysPerWeek: 2,
        exercises: [
            { name: "Barbell Deadlift", sets: [{}, {}, {}], targetReps: "6-8" },
            { name: "Overhead Press (Barbell or Dumbbell)", sets: [{}, {}, {}], targetReps: "8-10" },
            { name: "Lat Pulldown", sets: [{}, {}, {}], targetReps: "8-10" },
            { name: "Dumbbell Lunges", sets: [{}, {}], targetReps: "10-12 per leg" },
            { name: "Lying Leg Raises", sets: [{}, {}, {}], targetReps: "12-15" }
        ]
    },
    {
        name: "Beginner Dumbbell Full Body - Workout A",
        primaryFocus: "Full Body",
        daysPerWeek: 2,
        exercises: [
            { name: "Goblet Squat", sets: [{}, {}, {}], targetReps: "10-15" },
            { name: "Push-Ups", sets: [{}, {}, {}], targetReps: "AMRAP" },
            { name: "Dumbbell Romanian Deadlift", sets: [{}, {}, {}], targetReps: "10-15" },
            { name: "Renegade Row", sets: [{}, {}, {}], targetReps: "8-10 per side" },
            { name: "Dumbbell Overhead Press", sets: [{}, {}, {}], targetReps: "10-12" },
            { name: "Dumbbell Bicep Curls", sets: [{}, {}, {}], targetReps: "12-15" }
        ]
    },
    {
        name: "Beginner Dumbbell Full Body - Workout B",
        primaryFocus: "Full Body",
        daysPerWeek: 2,
        exercises: [
            { name: "Dumbbell Reverse Lunge", sets: [{}, {}, {}], targetReps: "10-12 per leg" },
            { name: "Dumbbell Floor Press", sets: [{}, {}, {}], targetReps: "10-15" },
            { name: "Glute Bridge", sets: [{}, {}, {}], targetReps: "15-20" },
            { name: "Bent-Over Dumbbell Row", sets: [{}, {}, {}], targetReps: "10-15" },
            { name: "Dumbbell Lateral Raises", sets: [{}, {}, {}], targetReps: "15-20" },
            { name: "Bench Dips", sets: [{}, {}, {}], targetReps: "AMRAP" }
        ]
    },
    {
        name: "Intermediate Upper/Lower (2-Day) - Upper",
        primaryFocus: "Upper Body",
        daysPerWeek: 2,
        exercises: [
            { name: "Barbell Bench Press", sets: [{}, {}, {}], targetReps: "6-10" },
            { name: "Bent Over Row", sets: [{}, {}, {}], targetReps: "6-10" },
            { name: "Seated Dumbbell Shoulder Press", sets: [{}, {}, {}], targetReps: "10-12" },
            { name: "Lat Pulldown", sets: [{}, {}, {}], targetReps: "10-12" },
            { name: "Dumbbell Lateral Raise", sets: [{}, {}], targetReps: "12-15" },
            { name: "Barbell Curl", sets: [{}, {}], targetReps: "12-15" },
            { name: "Triceps Rope Pushdown", sets: [{}, {}], targetReps: "12-15" }
        ]
    },
     {
        name: "Intermediate Upper/Lower (2-Day) - Lower",
        primaryFocus: "Lower Body",
        daysPerWeek: 2,
        exercises: [
            { name: "Barbell Squat", sets: [{}, {}, {}], targetReps: "6-10" },
            { name: "Romanian Deadlift", sets: [{}, {}, {}], targetReps: "8-10" },
            { name: "Leg Press", sets: [{}, {}, {}], targetReps: "10-12" },
            { name: "Lying Leg Curl", sets: [{}, {}, {}], targetReps: "12-15" },
            { name: "Standing Calf Raise", sets: [{}, {}, {}], targetReps: "15-20" },
            { name: "Cable Crunch", sets: [{}, {}, {}], targetReps: "15-20" }
        ]
    },
    {
        name: "Classic Beginner Full Body - Workout A",
        primaryFocus: "Full Body",
        daysPerWeek: 3,
        exercises: [
            { name: "Squats", sets: [{}, {}, {}], targetReps: "8-10" },
            { name: "Bench Press", sets: [{}, {}, {}], targetReps: "8-10" },
            { name: "Barbell Rows", sets: [{}, {}, {}], targetReps: "8-10" },
            { name: "Dumbbell Shoulder Press", sets: [{}, {}], targetReps: "10-12" },
            { name: "Bicep Curls", sets: [{}, {}], targetReps: "10-15" }
        ]
    },
    {
        name: "Classic Beginner Full Body - Workout B",
        primaryFocus: "Full Body",
        daysPerWeek: 3,
        exercises: [
            { name: "Deadlifts (Conventional or Romanian)", sets: [{}, {}, {}], targetReps: "6-8" },
            { name: "Pull-Ups (or Lat Pulldowns)", sets: [{}, {}, {}], targetReps: "8-10" },
            { name: "Incline Dumbbell Press", sets: [{}, {}, {}], targetReps: "8-10" },
            { name: "Leg Curls", sets: [{}, {}], targetReps: "10-12" },
            { name: "Triceps Pushdowns", sets: [{}, {}, {}], targetReps: "10-15" }
        ]
    },
    {
        name: "Beginner Full Body (3 Unique Days) - Day 1",
        primaryFocus: "Full Body",
        daysPerWeek: 3,
        exercises: [
            { name: "Trap Bar Deadlift", sets: [{}, {}, {}], targetReps: "3-5" },
            { name: "Incline Dumbbell Bench Press", sets: [{}, {}, {}], targetReps: "8-12" },
            { name: "Dumbbell Row", sets: [{}, {}, {}], targetReps: "10-15" },
            { name: "Lateral Raise", sets: [{}, {}, {}], targetReps: "10-15" },
            { name: "Plank", sets: [{}, {}], targetReps: "Failure" }
        ]
    },
    {
        name: "Beginner Full Body (3 Unique Days) - Day 2",
        primaryFocus: "Full Body",
        daysPerWeek: 3,
        exercises: [
            { name: "Front Squats", sets: [{}, {}, {}], targetReps: "3-5" },
            { name: "Bent Over Row", sets: [{}, {}, {}], targetReps: "5-8" },
            { name: "Dumbbell Overhead Press", sets: [{}, {}, {}], targetReps: "6-10" },
            { name: "Dumbbell Bicep Curl", sets: [{}, {}], targetReps: "10-12" },
            { name: "Dead Bugs", sets: [{}, {}], targetReps: "6-12 per side" }
        ]
    },
    {
        name: "Beginner Full Body (3 Unique Days) - Day 3",
        primaryFocus: "Full Body",
        daysPerWeek: 3,
        exercises: [
            { name: "Bench Press", sets: [{}, {}, {}], targetReps: "3-5" },
            { name: "Leg Press", sets: [{}, {}, {}], targetReps: "6-10" },
            { name: "Lat Pulldown", sets: [{}, {}, {}], targetReps: "6-10" },
            { name: "Skullcrusher", sets: [{}, {}], targetReps: "10-12" },
            { name: "Pallof Press", sets: [{}, {}], targetReps: "6-12 per side" }
        ]
    },
    {
        name: "Intermediate Push/Pull/Legs (PPL) - Push",
        primaryFocus: "Push",
        daysPerWeek: 3,
        exercises: [
            { name: "Barbell Bench Press", sets: [{}, {}, {}], targetReps: "6-10" },
            { name: "Seated Dumbbell Shoulder Press", sets: [{}, {}, {}], targetReps: "8-12" },
            { name: "Incline Dumbbell Press", sets: [{}, {}, {}], targetReps: "8-12" },
            { name: "Lateral Raise", sets: [{}, {}], targetReps: "12-15" },
            { name: "Triceps Rope Pushdown", sets: [{}, {}], targetReps: "12-15" }
        ]
    },
    {
        name: "Intermediate Push/Pull/Legs (PPL) - Pull",
        primaryFocus: "Pull",
        daysPerWeek: 3,
        exercises: [
            { name: "Deadlifts", sets: [{}, {}, {}], targetReps: "5-8" },
            { name: "Pull-Ups (or Lat Pulldowns)", sets: [{}, {}, {}], targetReps: "8-10" },
            { name: "Seated Cable Row", sets: [{}, {}, {}], targetReps: "10-12" },
            { name: "Face Pulls", sets: [{}, {}], targetReps: "15-20" },
            { name: "Barbell Bicep Curls", sets: [{}, {}], targetReps: "12-15" }
        ]
    },
    {
        name: "Intermediate Push/Pull/Legs (PPL) - Legs",
        primaryFocus: "Legs",
        daysPerWeek: 3,
        exercises: [
            { name: "Barbell Squats", sets: [{}, {}, {}], targetReps: "6-10" },
            { name: "Romanian Deadlifts", sets: [{}, {}, {}], targetReps: "10-12" },
            { name: "Leg Press", sets: [{}, {}, {}], targetReps: "10-12" },
            { name: "Leg Curls", sets: [{}, {}], targetReps: "12-15" },
            { name: "Calf Raises", sets: [{}, {}, {}], targetReps: "15-20" }
        ]
    },
    {
        name: "Intermediate Upper/Lower Split (U/L/U) - Upper Body 1",
        primaryFocus: "Upper Body",
        daysPerWeek: 3,
        exercises: [
            { name: "Barbell Bench Press", sets: [{}, {}, {}], targetReps: "6-8" },
            { name: "Barbell Bent Over Row", sets: [{}, {}, {}], targetReps: "6-8" },
            { name: "Seated Dumbbell Shoulder Press", sets: [{}, {}, {}], targetReps: "8-10" },
            { name: "Lat Pulldowns", sets: [{}, {}, {}], targetReps: "10-12" },
            { name: "Dumbbell Bicep Curls", sets: [{}, {}, {}], targetReps: "12-15" }
        ]
    },
    {
        name: "Intermediate Upper/Lower Split (U/L/U) - Upper Body 2",
        primaryFocus: "Upper Body",
        daysPerWeek: 3,
        exercises: [
            { name: "Overhead Press", sets: [{}, {}, {}], targetReps: "6-8" },
            { name: "Pull-Ups (weighted if possible)", sets: [{}, {}, {}], targetReps: "AMRAP" },
            { name: "Incline Dumbbell Press", sets: [{}, {}, {}], targetReps: "8-10" },
            { name: "Single-Arm Dumbbell Rows", sets: [{}, {}, {}], targetReps: "10-12 per arm" },
            { name: "Triceps Pushdowns", sets: [{}, {}, {}], targetReps: "12-15" }
        ]
    },
    {
        name: "Intermediate Upper/Lower Split (U/L/U) - Lower Body",
        primaryFocus: "Lower Body",
        daysPerWeek: 3,
        exercises: [
            { name: "Barbell Squats", sets: [{}, {}, {}], targetReps: "6-8" },
            { name: "Romanian Deadlifts", sets: [{}, {}, {}], targetReps: "8-10" },
            { name: "Walking Lunges", sets: [{}, {}, {}], targetReps: "10-12 per leg" },
            { name: "Leg Extensions", sets: [{}, {}, {}], targetReps: "12-15" },
            { name: "Hanging Leg Raises", sets: [{}, {}, {}], targetReps: "15-20" }
        ]
    },
    {
        name: "Intermediate Upper/Lower Split (Strength Focus) - Upper Body Strength",
        primaryFocus: "Upper Body",
        daysPerWeek: 4,
        exercises: [
            { name: "Barbell Bench Press", sets: [{}, {}, {}, {}], targetReps: "4-6" },
            { name: "Weighted Pull-Ups", sets: [{}, {}, {}, {}], targetReps: "4-6" },
            { name: "Seated Barbell Overhead Press", sets: [{}, {}, {}], targetReps: "6-8" },
            { name: "Barbell Row", sets: [{}, {}, {}], targetReps: "6-8" },
            { name: "Close-Grip Bench Press", sets: [{}, {}, {}], targetReps: "6-8" }
        ]
    },
    {
        name: "Intermediate Upper/Lower Split (Strength Focus) - Lower Body Strength",
        primaryFocus: "Lower Body",
        daysPerWeek: 4,
        exercises: [
            { name: "Barbell Back Squat", sets: [{}, {}, {}, {}], targetReps: "4-6" },
            { name: "Conventional Deadlift", sets: [{}, {}, {}], targetReps: "4-6" },
            { name: "Leg Press", sets: [{}, {}, {}], targetReps: "6-8" },
            { name: "Barbell Hip Thrust", sets: [{}, {}, {}], targetReps: "6-8" },
            { name: "Weighted Crunches", sets: [{}, {}, {}], targetReps: "8-12" }
        ]
    },
    {
        name: "Intermediate Upper/Lower Split (Hypertrophy Focus) - Upper Body Hypertrophy",
        primaryFocus: "Upper Body",
        daysPerWeek: 4,
        exercises: [
            { name: "Incline Dumbbell Press", sets: [{}, {}, {}, {}], targetReps: "8-12" },
            { name: "Lat Pulldown", sets: [{}, {}, {}, {}], targetReps: "8-12" },
            { name: "Seated Dumbbell Lateral Raise", sets: [{}, {}, {}], targetReps: "10-15" },
            { name: "Seated Cable Row", sets: [{}, {}, {}], targetReps: "10-12" },
            { name: "Dumbbell Skullcrushers", sets: [{}, {}, {}], targetReps: "10-15" },
            { name: "Dumbbell Bicep Curls", sets: [{}, {}, {}], targetReps: "10-15" }
        ]
    },
    {
        name: "Intermediate Upper/Lower Split (Hypertrophy Focus) - Lower Body Hypertrophy",
        primaryFocus: "Lower Body",
        daysPerWeek: 4,
        exercises: [
            { name: "Goblet Squat", sets: [{}, {}, {}, {}], targetReps: "10-15" },
            { name: "Romanian Deadlift", sets: [{}, {}, {}, {}], targetReps: "10-12" },
            { name: "Bulgarian Split Squat", sets: [{}, {}, {}], targetReps: "10-12 per leg" },
            { name: "Leg Extension", sets: [{}, {}, {}], targetReps: "12-15" },
            { name: "Lying Leg Curl", sets: [{}, {}, {}], targetReps: "12-15" },
            { name: "Standing Calf Raise", sets: [{}, {}, {}, {}], targetReps: "15-20" }
        ]
    },
    {
        name: "Women's Focused Upper/Lower Split (Strength Focus) - Upper Body Strength",
        primaryFocus: "Upper Body",
        daysPerWeek: 4,
        exercises: [
            { name: "Flat Machine Press", sets: [{}, {}, {}, {}], targetReps: "6" },
            { name: "Dumbbell Row", sets: [{}, {}, {}, {}], targetReps: "6" },
            { name: "Shoulder Press", sets: [{}, {}, {}, {}], targetReps: "6" },
            { name: "Lat Pulldown", sets: [{}, {}, {}, {}], targetReps: "6" },
            { name: "Hyperextensions (Glute Focused)", sets: [{}, {}, {}], targetReps: "12-15" }
        ]
    },
    {
        name: "Women's Focused Upper/Lower Split (Strength Focus) - Lower Body Strength",
        primaryFocus: "Glutes",
        daysPerWeek: 4,
        exercises: [
            { name: "Smith Machine Squat", sets: [{}, {}, {}, {}], targetReps: "6" },
            { name: "Deadlift", sets: [{}, {}, {}, {}], targetReps: "6" },
            { name: "Reverse Lunges", sets: [{}, {}, {}, {}], targetReps: "6 per leg" },
            { name: "Leg Press", sets: [{}, {}, {}, {}], targetReps: "6" },
            { name: "Hip Thrust", sets: [{}, {}, {}, {}], targetReps: "6" }
        ]
    },
    {
        name: "Women's Focused Upper/Lower Split (Hypertrophy Focus) - Upper Body Hypertrophy",
        primaryFocus: "Upper Body",
        daysPerWeek: 4,
        exercises: [
            { name: "Incline Dumbbell Bench Press", sets: [{}, {}, {}], targetReps: "12" },
            { name: "Seated Cable Row", sets: [{}, {}, {}], targetReps: "12" },
            { name: "Seated Dumbbell Press", sets: [{}, {}, {}], targetReps: "12" },
            { name: "Lat Pulldown", sets: [{}, {}, {}], targetReps: "12" },
            { name: "Dumbbell Bicep Curl", sets: [{}, {}], targetReps: "12" },
            { name: "Tricep Extensions", sets: [{}, {}], targetReps: "12" }
        ]
    },
    {
        name: "Women's Focused Upper/Lower Split (Hypertrophy Focus) - Lower Body Hypertrophy",
        primaryFocus: "Glutes",
        daysPerWeek: 4,
        exercises: [
            { name: "Goblet Squat", sets: [{}, {}, {}], targetReps: "12" },
            { name: "Dumbbell Romanian Deadlift", sets: [{}, {}, {}], targetReps: "12" },
            { name: "Bulgarian Split Squat", sets: [{}, {}, {}], targetReps: "12 per side" },
            { name: "Hack Squat", sets: [{}, {}, {}], targetReps: "12" },
            { name: "Abduction Machine", sets: [{}, {}, {}], targetReps: "15-20" }
        ]
    },
    {
        name: "Intermediate Body Part Split - Chest & Triceps",
        primaryFocus: "Chest",
        daysPerWeek: 4,
        exercises: [
            { name: "Bench Press", sets: [{}, {}, {}, {}], targetReps: "6-10" },
            { name: "Incline Dumbbell Press", sets: [{}, {}, {}], targetReps: "8-12" },
            { name: "Chest Dip", sets: [{}, {}, {}], targetReps: "AMRAP" },
            { name: "Cable Crossover", sets: [{}, {}, {}], targetReps: "12-15" },
            { name: "EZ Bar Skullcrusher", sets: [{}, {}, {}], targetReps: "8-12" },
            { name: "Cable Tricep Extension", sets: [{}], targetReps: "5-minute burn" }
        ]
    },
    {
        name: "Intermediate Body Part Split - Back & Biceps",
        primaryFocus: "Back",
        daysPerWeek: 4,
        exercises: [
            { name: "Deadlift", sets: [{}, {}, {}], targetReps: "5" },
            { name: "Wide Grip Pull-Up (or Lat Pulldown)", sets: [{}, {}, {}], targetReps: "10-12" },
            { name: "Barbell Row", sets: [{}, {}, {}], targetReps: "8-12" },
            { name: "Seated Cable Row", sets: [{}], targetReps: "5-minute burn" },
            { name: "EZ Bar Preacher Curl", sets: [{}, {}, {}], targetReps: "10-12" },
            { name: "Concentration Curl", sets: [{}, {}, {}], targetReps: "10-12" }
        ]
    },
    {
        name: "Intermediate Body Part Split - Legs",
        primaryFocus: "Legs",
        daysPerWeek: 4,
        exercises: [
            { name: "Squat", sets: [{}, {}, {}, {}], targetReps: "6-10" },
            { name: "Leg Press", sets: [{}, {}, {}], targetReps: "15-20" },
            { name: "Stiff-Legged Deadlift", sets: [{}, {}, {}], targetReps: "8-12" },
            { name: "Leg Extension", sets: [{}], targetReps: "5-minute burn" },
            { name: "Leg Curl", sets: [{}], targetReps: "5-minute burn" },
            { name: "Standing Calf Raise", sets: [{}, {}, {}], targetReps: "10-15" }
        ]
    },
    {
        name: "Intermediate Body Part Split - Shoulders & Abs",
        primaryFocus: "Shoulders",
        daysPerWeek: 4,
        exercises: [
            { name: "Seated Barbell Press", sets: [{}, {}, {}, {}], targetReps: "6-10" },
            { name: "Seated Arnold Press", sets: [{}, {}, {}], targetReps: "8-12" },
            { name: "Dumbbell Lateral Raise", sets: [{}, {}, {}], targetReps: "10-15" },
            { name: "Upright Row", sets: [{}, {}, {}], targetReps: "8-12" },
            { name: "Barbell Shrug", sets: [{}], targetReps: "5-minute burn" },
            { name: "Hanging Leg Raise", sets: [{}, {}, {}], targetReps: "15-20" },
            { name: "Cable Crunch", sets: [{}, {}, {}], targetReps: "15-20" }
        ]
    },
    {
        name: "Classic 5-Day Body Part Split - Chest",
        primaryFocus: "Chest",
        daysPerWeek: 5,
        exercises: [
            { name: "Incline Barbell Bench Press", sets: [{}, {}, {}, {}], targetReps: "8-12" },
            { name: "Flat Dumbbell Bench Press", sets: [{}, {}, {}], targetReps: "8-10" },
            { name: "Chest Dip (Weighted)", sets: [{}, {}, {}], targetReps: "8-12" },
            { name: "Dumbbell Flyes", sets: [{}, {}, {}], targetReps: "10-15" },
            { name: "Incline Push-ups", sets: [{}, {}, {}], targetReps: "Failure" }
        ]
    },
    {
        name: "Classic 5-Day Body Part Split - Back",
        primaryFocus: "Back",
        daysPerWeek: 5,
        exercises: [
            { name: "Wide Grip Pull-Up (Weighted)", sets: [{}, {}, {}, {}], targetReps: "Max reps" },
            { name: "Bent-Over Barbell Row", sets: [{}, {}, {}, {}], targetReps: "8-10" },
            { name: "Seated Cable Row", sets: [{}, {}, {}], targetReps: "10-12" },
            { name: "Lat Pulldown", sets: [{}, {}, {}], targetReps: "10-12" },
            { name: "Machine Reverse Fly", sets: [{}, {}, {}], targetReps: "12-15" }
        ]
    },
    {
        name: "Classic 5-Day Body Part Split - Shoulders",
        primaryFocus: "Shoulders",
        daysPerWeek: 5,
        exercises: [
            { name: "Seated Dumbbell Press", sets: [{}, {}, {}, {}], targetReps: "8-12" },
            { name: "One-Arm Cable Lateral Raise", sets: [{}, {}, {}], targetReps: "12-15 per arm" },
            { name: "Barbell Front Raise", sets: [{}, {}, {}], targetReps: "10-12" },
            { name: "Face Pulls", sets: [{}, {}, {}, {}], targetReps: "15-20" },
            { name: "Dumbbell Shrugs", sets: [{}, {}, {}, {}], targetReps: "10-12" }
        ]
    },
    {
        name: "Classic 5-Day Body Part Split - Legs",
        primaryFocus: "Legs",
        daysPerWeek: 5,
        exercises: [
            { name: "Barbell Squat", sets: [{}, {}, {}, {}], targetReps: "8-10" },
            { name: "Leg Press", sets: [{}, {}, {}], targetReps: "12-15" },
            { name: "Romanian Deadlift", sets: [{}, {}, {}, {}], targetReps: "10-12" },
            { name: "Seated Leg Curl", sets: [{}, {}, {}], targetReps: "12-15" },
            { name: "Standing Calf Raise", sets: [{}, {}, {}, {}, {}], targetReps: "10-15" }
        ]
    },
    {
        name: "Classic 5-Day Body Part Split - Arms & Abs",
        primaryFocus: "Arms",
        daysPerWeek: 5,
        exercises: [
            { name: "Close Grip Bench Press", sets: [{}, {}, {}, {}], targetReps: "8-10" },
            { name: "Barbell Curl", sets: [{}, {}, {}, {}], targetReps: "8-10" },
            { name: "Tricep Overhead Extension", sets: [{}, {}, {}], targetReps: "10-12" },
            { name: "Incline Dumbbell Curl", sets: [{}, {}, {}], targetReps: "10-12" },
            { name: "Tricep Kickback", sets: [{}, {}, {}], targetReps: "12-15" },
            { name: "Hammer Curl", sets: [{}, {}, {}], targetReps: "12-15" },
            { name: "Hanging Leg Raise", sets: [{}, {}, {}, {}], targetReps: "Failure" }
        ]
    },
    {
        name: "The Hybrid PPL + U/L Split - Push",
        primaryFocus: "Push",
        daysPerWeek: 5,
        exercises: []
    },
    {
        name: "The Hybrid PPL + U/L Split - Pull",
        primaryFocus: "Pull",
        daysPerWeek: 5,
        exercises: []
    },
    {
        name: "The Hybrid PPL + U/L Split - Legs",
        primaryFocus: "Legs",
        daysPerWeek: 5,
        exercises: []
    },
    {
        name: "The Hybrid PPL + U/L Split - Upper Body",
        primaryFocus: "Upper Body",
        daysPerWeek: 5,
        exercises: []
    },
    {
        name: "The Hybrid PPL + U/L Split - Lower Body",
        primaryFocus: "Lower Body",
        daysPerWeek: 5,
        exercises: []
    },
    {
        name: "The Nippard Hybrid Split - Upper Body (Strength Focus)",
        primaryFocus: "Upper Body",
        daysPerWeek: 5,
        exercises: [
            { name: "Incline Bench Press", sets: [{}, {}, {}], targetReps: "6-8" },
            { name: "Weighted Pull-Up", sets: [{}, {}, {}], targetReps: "6-8" },
            { name: "Seated Dumbbell Press", sets: [{}, {}, {}], targetReps: "8-10" },
            { name: "Pendlay Row", sets: [{}, {}, {}], targetReps: "6-8" },
            { name: "Overhead Cable Tricep Extension", sets: [{}, {}], targetReps: "8-10" },
            { name: "Cable Bicep Curl", sets: [{}, {}], targetReps: "8-10" }
        ]
    },
    {
        name: "The Nippard Hybrid Split - Lower Body (Strength Focus)",
        primaryFocus: "Lower Body",
        daysPerWeek: 5,
        exercises: [
            { name: "Barbell Back Squat", sets: [{}, {}, {}, {}], targetReps: "5-7" },
            { name: "Romanian Deadlift", sets: [{}, {}, {}], targetReps: "8-10" },
            { name: "Leg Press", sets: [{}, {}, {}], targetReps: "10-12" },
            { name: "Seated Calf Raise", sets: [{}, {}, {}, {}], targetReps: "10-12" }
        ]
    },
    {
        name: "The Nippard Hybrid Split - Push (Hypertrophy Focus)",
        primaryFocus: "Push",
        daysPerWeek: 5,
        exercises: [
            { name: "Dumbbell Bench Press", sets: [{}, {}, {}, {}], targetReps: "10-12" },
            { name: "Seated Cable Fly", sets: [{}, {}, {}], targetReps: "12-15" },
            { name: "Cable Lateral Raise", sets: [{}, {}, {}, {}], targetReps: "12-15" },
            { name: "Triceps Pushdown", sets: [{}, {}, {}], targetReps: "12-15" }
        ]
    },
    {
        name: "The Nippard Hybrid Split - Pull (Hypertrophy Focus)",
        primaryFocus: "Pull",
        daysPerWeek: 5,
        exercises: [
            { name: "Lat Pulldown (Neutral Grip)", sets: [{}, {}, {}, {}], targetReps: "10-12" },
            { name: "Machine Row", sets: [{}, {}, {}], targetReps: "12-15" },
            { name: "Face Pulls", sets: [{}, {}, {}, {}], targetReps: "15-20" },
            { name: "Preacher Curls", sets: [{}, {}, {}], targetReps: "12-15" }
        ]
    },
    {
        name: "The Nippard Hybrid Split - Legs (Hypertrophy Focus)",
        primaryFocus: "Legs",
        daysPerWeek: 5,
        exercises: [
            { name: "Barbell Hip Thrust", sets: [{}, {}, {}, {}], targetReps: "10-12" },
            { name: "Bulgarian Split Squat", sets: [{}, {}, {}], targetReps: "12-15 per leg" },
            { name: "Lying Leg Curl", sets: [{}, {}, {}, {}], targetReps: "12-15" },
            { name: "Leg Extension", sets: [{}, {}, {}], targetReps: "15-20" },
            { name: "Standing Calf Raise", sets: [{}, {}, {}, {}], targetReps: "15-20" }
        ]
    },
    {
        name: "5-Day Women's Workout Program - Legs (Quad Focus)",
        primaryFocus: "Legs",
        daysPerWeek: 5,
        exercises: [
            { name: "Squat", sets: [{}, {}, {}, {}], targetReps: "6-12" },
            { name: "Leg Press", sets: [{}, {}, {}], targetReps: "12-15" },
            { name: "Dumbbell Lunge", sets: [{}, {}, {}], targetReps: "12-15 per leg" },
            { name: "Leg Extensions", sets: [{}, {}, {}], targetReps: "12-15" }
        ]
    },
    {
        name: "5-Day Women's Workout Program - Back & Biceps",
        primaryFocus: "Back",
        daysPerWeek: 5,
        exercises: [
            { name: "Pull Downs", sets: [{}, {}, {}, {}], targetReps: "6-12" },
            { name: "One Arm Dumbbell Row", sets: [{}, {}, {}], targetReps: "12-15" },
            { name: "Seated Cable Row", sets: [{}, {}, {}], targetReps: "12-15" },
            { name: "Dumbbell Curl & Tricep Overhead Extension", sets: [{}, {}, {}], targetReps: "12 each" }
        ]
    },
    {
        name: "5-Day Women's Workout Program - Glutes & Hamstrings",
        primaryFocus: "Glutes",
        daysPerWeek: 5,
        exercises: [
            { name: "Barbell Hip Thrust", sets: [{}, {}, {}, {}], targetReps: "6-12" },
            { name: "Romanian Deadlift", sets: [{}, {}, {}], targetReps: "12-15" },
            { name: "Glute Cable Kickback", sets: [{}, {}, {}], targetReps: "12-15 per leg" },
            { name: "Smith Machine Sumo Squats", sets: [{}, {}, {}], targetReps: "8-12" }
        ]
    },
    {
        name: "5-Day Women's Workout Program - Chest & Shoulders",
        primaryFocus: "Chest",
        daysPerWeek: 5,
        exercises: [
            { name: "Dumbbell Bench Press", sets: [{}, {}, {}, {}], targetReps: "6-12" },
            { name: "Incline Dumbbell Press", sets: [{}, {}, {}], targetReps: "12-15" },
            { name: "Seated Dumbbell Press", sets: [{}, {}, {}, {}], targetReps: "6-12" },
            { name: "Lateral Raise", sets: [{}, {}, {}], targetReps: "12-15" }
        ]
    },
    {
        name: "5-Day Women's Workout Program - Full Lower Body & Arms",
        primaryFocus: "Lower Body",
        daysPerWeek: 5,
        exercises: [
            { name: "Deadlifts", sets: [{}, {}, {}, {}], targetReps: "6-12" },
            { name: "Good Mornings", sets: [{}, {}, {}], targetReps: "12-15" },
            { name: "Incline Dumbbell Curl & Incline Skullcrusher", sets: [{}, {}, {}], targetReps: "12 each" },
            { name: "Cable Curl & Cable Pressdown", sets: [{}, {}, {}], targetReps: "15 each" }
        ]
    }
  ]);
  }

/*
===============================================
SECTION 3: LIFECYCLE AND DATA HANDLING
===============================================
*/

  connectedCallback() {
    super.connectedCallback();
    this._fetchTemplates();
  }

  willUpdate(changedProperties) {
    if (changedProperties.has('editingRoutineId') && this.editingRoutineId) {
      this._loadRoutineForEditing();
    }
  }

  _loadRoutineForEditing() {
    const data = getDataLocally();
    const routineToEdit = data.templates.find(t => t.id === this.editingRoutineId);
    if (routineToEdit) {
      this.currentRoutineView = 'create';
      this.newTemplateName = routineToEdit.name;
      this.newTemplateDays = routineToEdit.workouts.map((workout, index) => ({
        name: workout.name.split(' - ')[1] || `Day ${index + 1}`,
        exercises: workout.exercises.map(ex => ({
          ...ex,
          sets: ex.sets.length,
          reps: parseInt(ex.targetReps, 10),
          rir: ex.targetRir,
        })),
      }));
      this.activeDayIndex = 0;
    }
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

/*
===============================================
SECTION 4: WORKOUT GROUPING
===============================================
*/
  _groupWorkouts(workouts) {
    const grouped = workouts.reduce((acc, workout) => {
        const baseName = workout.name.split(' - ')[0];
        if (!acc[baseName]) {
            acc[baseName] = {
                ...workout,
                name: baseName,
                workouts: []
            };
        }
        acc[baseName].workouts.push(workout);
        return acc;
    }, {});
    return Object.values(grouped);
  }

/*
===============================================
SECTION 5: EVENT HANDLERS AND WORKOUT LOGIC
===============================================
*/
  _addExerciseToTemplate(dayIndex) {
    const updatedDays = [...this.newTemplateDays];
    updatedDays[dayIndex].exercises.push({ muscleGroup: '', name: "", sets: 3, reps: 10, rir: 2 });
    this.newTemplateDays = updatedDays;
  }

  _handleExerciseInput(dayIndex, exerciseIndex, field, value) {
    const updatedDays = [...this.newTemplateDays];
    updatedDays[dayIndex].exercises[exerciseIndex][field] = value;
    this.newTemplateDays = updatedDays;
  }

  _handleMuscleGroupChange(dayIndex, exerciseIndex, value) {
    const updatedDays = [...this.newTemplateDays];
    updatedDays[dayIndex].exercises[exerciseIndex].muscleGroup = value;
    updatedDays[dayIndex].exercises[exerciseIndex].name = "";
    this.newTemplateDays = updatedDays;
  }

  _removeExercise(dayIndex, exerciseIndex) {
    const updatedDays = [...this.newTemplateDays];
    updatedDays[dayIndex].exercises = updatedDays[dayIndex].exercises.filter((_, i) => i !== exerciseIndex);
    this.newTemplateDays = updatedDays;
  }

  _addDayToTemplate() {
    this.newTemplateDays = [
        ...this.newTemplateDays,
        { name: `Day ${this.newTemplateDays.length + 1}`, exercises: [{ muscleGroup: '', name: "", sets: 3, reps: 10, rir: 2 }] }
    ];
    this.activeDayIndex = this.newTemplateDays.length - 1;
  }

  _removeDay(dayIndex) {
    if (this.newTemplateDays.length <= 1) {
        this._showToast("You must have at least one day in your template.", 'error');
        return;
    }
    this.newTemplateDays = this.newTemplateDays.filter((_, i) => i !== dayIndex);
    if (this.activeDayIndex >= this.newTemplateDays.length) {
        this.activeDayIndex = this.newTemplateDays.length - 1;
    }
  }

  _handleDayNameChange(dayIndex, newName) {
    const updatedDays = [...this.newTemplateDays];
    updatedDays[dayIndex].name = newName;
    this.newTemplateDays = updatedDays;
  }

  _handleCancel() {
    if (this.editingRoutineId) {
      this.dispatchEvent(new CustomEvent('routine-saved', { bubbles: true, composed: true }));
    } else {
      this.currentRoutineView = 'menu';
    }
  }

  _showToast(message, type) {
    this.dispatchEvent(new CustomEvent('show-toast', { 
        detail: { message, type }, 
        bubbles: true, 
        composed: true 
    }));
  }

  async _saveTemplate() {
    this.isSaving = true;
    try {
        if (!this.newTemplateName.trim()) throw new Error("Please enter a routine name");

        const routineData = {
            id: this.editingRoutineId || Date.now().toString(),
            name: this.newTemplateName.trim(),
            primaryFocus: "custom",
            daysPerWeek: this.newTemplateDays.length,
            workouts: this.newTemplateDays.map(day => {
                if (!day.name.trim()) throw new Error("All days must have a name");
                const validExercises = day.exercises.filter(ex => ex.name && ex.muscleGroup);
                if (validExercises.length === 0) throw new Error(`Please add at least one exercise to ${day.name}`);
                return {
                    name: `${this.newTemplateName.trim()} - ${day.name}`,
                    exercises: validExercises.map(ex => ({
                        name: ex.name,
                        sets: Array(Number(ex.sets) || 3).fill({}),
                        targetReps: `${Number(ex.reps) || 10}`,
                        targetRir: Number(ex.rir) || 2,
                        muscleGroup: ex.muscleGroup
                    }))
                };
            })
        };
        
        const existingData = getDataLocally();
        let updatedTemplates;

        if (this.editingRoutineId) {
            updatedTemplates = existingData.templates.map(t => t.id === this.editingRoutineId ? routineData : t);
        } else {
            updatedTemplates = [...(existingData.templates || []), routineData];
        }
        
        const response = saveDataLocally({ templates: updatedTemplates });

        if (response.success) {
            this.templates = updatedTemplates;
            const message = this.editingRoutineId ? 'Routine updated!' : 'Routine saved!';
            this._showToast(message, 'success');
            
            if (this.editingRoutineId) {
                this.dispatchEvent(new CustomEvent('routine-saved', { bubbles: true, composed: true }));
            } else {
                this.currentRoutineView = "menu";
                this.newTemplateName = "";
                this.newTemplateDays = [{ name: "Day 1", exercises: [{ muscleGroup: '', name: "", sets: 3, reps: 10, rir: 2 }] }];
                this.activeDayIndex = 0;
            }
        } else {
            throw new Error(response.error || "Failed to save routine");
        }
    } catch (error) {
        this._showToast(error.message, 'error');
    } finally {
        this.isSaving = false;
    }
  }
  
  _loadTemplate(program) {
    this.selectedProgram = program;
    this.currentRoutineView = 'premade';
  }
  
  _getFilteredMesocycles() {
    const customTemplates = this.templates.filter(t => t.primaryFocus === "custom");
    return [...this.premadeMesocycles, ...customTemplates];
  }

/*
===============================================
SECTION 6: RENDERING LOGIC
===============================================
*/

  render() {
    if (this.isLoading) return html`<p>Loading...</p>`;
    if (this.errorMessage) return html`<p class="error-message">${this.errorMessage}</p>`;

    let viewContent;
    switch(this.currentRoutineView) {
        case 'menu':
            viewContent = this._renderRoutineMenu();
            break;
        case 'premade':
            viewContent = this.selectedProgram ? this._renderProgramDetailView() : this._renderMesocycleList();
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
          ${this.currentRoutineView !== 'menu' && !this.selectedProgram ? html`
              <button class="btn btn-icon" @click=${this._handleCancel}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
              </button>
          ` : ''}
          ${this.selectedProgram ? html`
              <button class="btn btn-icon" @click=${() => this.selectedProgram = null}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
              </button>
          ` : ''}
        </header>
        ${viewContent}
      </div>
    `;
  }

  _renderRoutineMenu() {
    const customTemplates = this.templates.filter(t => t.primaryFocus === "custom");
      return html`
        <nav class="home-nav-buttons">
          <button class="hub-option card-interactive" @click=${() => this.currentRoutineView = 'premade'}>
            <div class="hub-option-icon">📋</div>
            <div class="hub-option-text"><h3>Pre-Made Templates</h3><p>Choose from our library</p></div>
          </button>
          <button class="hub-option card-interactive" @click=${() => this.currentRoutineView = 'create'}>
            <div class="hub-option-icon">✍️</div>
            <div class="hub-option-text"><h3>Create Your Own</h3><p>Build a routine from scratch</p></div>
          </button>
        </nav>
        
        ${customTemplates.length > 0 ? html`
          <h2 class="section-title">Your Templates</h2>
          <div class="templates-list">
            ${customTemplates.map(template => html`
              <div class="card link-card template-card" @click=${() => this._loadTemplate(template)}>
                <div class="template-info">
                  <h3>${template.name}</h3>
                  <p>${template.workouts?.length || 0} days</p>
                </div>
                <button class="btn-icon" aria-label="Load template">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </button>
              </div>
            `)}
          </div>
        ` : ''}
      `;
  }
  
  _renderMesocycleList() {
    const filteredMesocycles = this._getFilteredMesocycles();
    return html`
        <div class="templates-list">
          ${filteredMesocycles.map(program => html`
            <div class="card link-card template-card" @click=${() => this.selectedProgram = program}>
              <div class="template-info">
                <h3>${program.name}</h3>
                <p>${program.workouts.length} workouts</p>
              </div>
              <button class="btn-icon" aria-label="View program">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </button>
            </div>
          `)}
        </div>
    `;
  }
  
  _renderProgramDetailView() {
      if (!this.selectedProgram) return html``;
      
      const durationOptions = this.selectedDurationType === 'weeks' ? [4, 5, 6, 7, 8] : [30, 60, 90];

      return html`
        <div class="program-detail-view">
          <h2>${this.selectedProgram.name}</h2>
          <p>Customize your program before starting.</p>
          <div class="card">
            <h3>Program Duration</h3>
            <div class="button-toggle-group">
                <button class="toggle-btn ${this.selectedDurationType === 'weeks' ? 'active' : ''}" @click=${() => this.selectedDurationType = 'weeks'}>Weeks</button>
                <button class="toggle-btn ${this.selectedDurationType === 'days' ? 'active' : ''}" @click=${() => this.selectedDurationType = 'days'}>Days</button>
            </div>
            <div class="input-group slider-group">
              <label for="duration">Duration: <strong>${this.selectedDuration} ${this.selectedDurationType}</strong></label>
              <input type="range" id="duration" .value=${this.selectedDuration} @input=${(e) => this.selectedDuration = Number(e.target.value)} min="${durationOptions[0]}" max="${durationOptions[durationOptions.length - 1]}" step="1"/>
            </div>
          </div>
          <div class="card">
            <h3>Starting Workout</h3>
            <div class="button-toggle-group">
              ${this.selectedProgram.workouts.map((workout, index) => html`
                <button class="toggle-btn ${this.selectedStartWorkout === index ? 'active' : ''}" @click=${() => this.selectedStartWorkout = index}>
                  ${workout.name.split(' - ')[1] || `Day ${index + 1}`}
                </button>
              `)}
            </div>
          </div>
          <button class="btn btn-primary cta-button" @click=${this._startProgram}>Start Program</button>
        </div>
      `;
  }

  _startProgram() {
      this.dispatchEvent(new CustomEvent('program-selected', {
          detail: {
              program: this.selectedProgram,
              duration: { type: this.selectedDurationType, value: this.selectedDuration },
              startWorkoutIndex: this.selectedStartWorkout,
          },
          bubbles: true, composed: true,
      }));
  }

  _getExercisesForGroup(groupName) {
    const normalizedGroup = groupName.toLowerCase();
    return this.exerciseDatabase[normalizedGroup] || [];
  }

  _renderNewTemplateForm() {
    const muscleGroups = Object.keys(this.exerciseDatabase);
    const activeDay = this.newTemplateDays[this.activeDayIndex];
    const formTitle = this.editingRoutineId ? 'Edit Routine' : 'Create New Routine';

    return html`
      <div class="new-template-form card">
        <h3>${formTitle}</h3>
        <div class="input-group">
          <label for="template-name">Routine Name:</label>
          <input id="template-name" type="text" .value=${this.newTemplateName} @input=${(e) => this.newTemplateName = e.target.value} />
        </div>
        <div class="day-tabs">
            ${this.newTemplateDays.map((day, index) => html`
                <button class="tab-btn ${this.activeDayIndex === index ? 'active' : ''}" @click=${() => this.activeDayIndex = index}>${day.name}</button>
            `)}
            <button class="btn-icon add-day-btn" @click=${this._addDayToTemplate}>+</button>
        </div>
        ${activeDay ? html`
        <div class="day-editor card">
            <div class="day-header">
                <input type="text" .value=${activeDay.name} @input=${e => this._handleDayNameChange(this.activeDayIndex, e.target.value)} class="day-name-input"/>
                <button class="btn-icon btn-danger-icon" @click=${() => this._removeDay(this.activeDayIndex)}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6M5 6l1 14a2 2 0 002 2h8a2 2 0 002-2l1-14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </button>
            </div>
            <div class="exercise-list">
            ${activeDay.exercises.map((exercise, index) => {
                const availableExercises = this._getExercisesForGroup(exercise.muscleGroup);
                return html`
                <div class="exercise-editor card">
                <div class="exercise-editor-header">
                    <div class="exercise-selectors">
                    <select class="muscle-group-select" @change=${(e) => this._handleMuscleGroupChange(this.activeDayIndex, index, e.target.value)}>
                        <option value="">Select Muscle Group</option>
                        ${muscleGroups.map(muscle => html`<option value="${muscle}" ?selected=${exercise.muscleGroup === muscle}>${muscle.charAt(0).toUpperCase() + muscle.slice(1)}</option>`)}
                    </select>
                    ${exercise.muscleGroup ? html`
                        <select class="exercise-select" .value=${exercise.name} @change=${(e) => this._handleExerciseInput(this.activeDayIndex, index, 'name', e.target.value)}>
                        <option value="">Select Exercise</option>
                        ${availableExercises.map(ex => html`<option value="${ex.name}" ?selected=${exercise.name === ex.name}>${ex.name}</option>`)}
                        </select>
                    ` : ''}
                    </div>
                    <button class="btn-icon btn-danger-icon" @click=${() => this._removeExercise(this.activeDayIndex, index)}>&#x2716;</button>
                </div>
                <div class="exercise-details">
                    <label>Sets: <input type="number" min="1" .value=${exercise.sets} @input=${(e) => this._handleExerciseInput(this.activeDayIndex, index, 'sets', e.target.value)}></label>
                    <label>Reps: <input type="number" min="1" .value=${exercise.reps} @input=${(e) => this._handleExerciseInput(this.activeDayIndex, index, 'reps', e.target.value)}></label>
                    <label>RIR: <input type="number" min="0" .value=${exercise.rir} @input=${(e) => this._handleExerciseInput(this.activeDayIndex, index, 'rir', e.target.value)}></label>
                </div>
                </div>
            `})}
            </div>
            <button class="secondary-button" @click=${() => this._addExerciseToTemplate(this.activeDayIndex)}>Add Exercise to ${activeDay.name}</button>
        </div>
        ` : ''}
        <div class="form-actions">
          <button class="secondary-button" @click=${this._handleCancel}>Cancel</button>
          <button class="cta-button" @click=${this._saveTemplate} ?disabled=${!this.newTemplateName || this.isSaving}>
            ${this.isSaving ? html`<div class="spinner"></div>` : 'Save Routine'}
          </button>
        </div>
      </div>
    `;
  }

/*
===============================================
SECTION 7: STYLES AND ELEMENT DEFINITION
===============================================
*/
  static styles = css`
    .day-tabs { display: flex; gap: var(--space-2); margin-bottom: var(--space-4); align-items: center; flex-wrap: wrap; }
    .tab-btn { background: var(--color-surface-tertiary); border: 1px solid var(--border-color); color: var(--color-text-secondary); border-radius: var(--radius-full); padding: var(--space-2) var(--space-4); cursor: pointer; transition: all 0.3s ease; }
    .tab-btn.active { background: var(--color-accent-primary); color: var(--color-surface-primary); border-color: var(--color-accent-primary); }
    .add-day-btn { border-radius: var(--radius-full); width: 36px; height: 36px; }
    .day-editor { padding: var(--space-4); background: var(--color-surface-secondary); }
    .day-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4); }
    .day-name-input { flex-grow: 1; background: var(--color-surface-tertiary); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: var(--space-2) var(--space-3); color: var(--color-text-primary); font-weight: 600; }
    #template-name { border-radius: var(--radius-md); }
    .exercise-details input { width: 70px; border-radius: var(--radius-md); }
  `;

  createRenderRoot() {
      return this;
  }
}

customElements.define("workout-templates", WorkoutTemplates);
