/**
 * @file local-storage.js
 * Local storage service for offline-only app functionality.
 * UPDATED: Includes default workout templates on initial load.
 */

const LOCAL_STORAGE_KEY = 'userWorkoutData';

/**
 * Creates the default user data structure.
 * This now includes a pre-populated list of workout templates.
 */
function createDefaultUserData() {
  const defaultTemplates = [
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
            { name: "Triceps Pushdowns", sets: [{}, {}], targetReps: "10-15" }
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
  ];

  return {
    onboardingComplete: false,
    workouts: [],
    templates: defaultTemplates,
    currentWeek: 1,
    workoutsCompletedThisMeso: 0,
    totalXP: 0,
    level: 1,
    baseMEV: {
      chest: 8,
      back: 10,
      shoulders: 8,
      arms: 6,
      legs: 14,
    }
  };
}

export function getDataLocally() {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      // Ensure data has required structure, including the default templates if they are missing
      const defaultData = createDefaultUserData();
      const mergedTemplates = parsed.templates && parsed.templates.length > 0 ? parsed.templates : defaultData.templates;
      return { ...defaultData, ...parsed, templates: mergedTemplates };
    }
    // If no data exists, return the default data with templates
    return createDefaultUserData();
  } catch (error) {
    console.error('Error reading local data:', error);
    // Fallback to default data in case of parsing error
    return createDefaultUserData();
  }
}

export function saveDataLocally(data) {
  try {
    // Get existing data and merge
    const existing = getDataLocally() || createDefaultUserData();
    const updatedData = { ...existing, ...data };

    // Handle arrays specially
    if (data.workouts && Array.isArray(data.workouts)) {
      updatedData.workouts = [...(existing.workouts || []), ...data.workouts];
    }

    if (data.templates && Array.isArray(data.templates)) {
      updatedData.templates = data.templates;
    }

    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedData));
    return { success: true };
  } catch (error) {
    console.error('Error saving local data:', error);
    return { success: false, error: error.message };
  }
}

export function deleteDataLocally() {
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    return { success: true };
  } catch (error) {
    console.error('Error deleting local data:', error);
    return { success: false, error: error.message };
  }
}

export function getCredential() {
  return { credential: 'local-mode-user' };
}
