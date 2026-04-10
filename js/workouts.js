// ============================================================
// Workout Templates — Station-Specific Drills
// ============================================================

const DRILL_LIBRARY = {
  ski_erg: [
    { name: 'SkiErg Intervals', type: 'interval', rounds: 6, work: { duration: 60, label: '250m sprint' }, rest: 45, tip: 'Hinge at hips, long pulls. Target 1:55-2:05/500m.' },
    { name: 'SkiErg Pyramid', type: 'interval', rounds: 5, work: { duration: 0, label: '100-200-300-200-100m' }, rest: 60, tip: 'Build pace each step up, hold pace each step down.' },
    { name: 'SkiErg Steady State', type: 'timed', duration: 300, label: '5 min continuous', tip: 'Even pace, focus on rhythm and breathing.' },
  ],
  sled_push: [
    { name: 'Sled Push Sprints', type: 'interval', rounds: 6, work: { duration: 20, label: '25m push' }, rest: 60, tip: 'Stay low, short choppy steps. Never stop.' },
    { name: 'Heavy Squat + Push', type: 'interval', rounds: 4, work: { duration: 45, label: '8 squats → 25m push' }, rest: 90, tip: 'Pre-fatigue legs then push. Builds race endurance.' },
    { name: 'Leg Drive Builder', type: 'interval', rounds: 5, work: { duration: 30, label: 'Wall sit hold' }, rest: 30, tip: 'Builds the quad endurance you need for heavy sled.' },
  ],
  sled_pull: [
    { name: 'Rope Pull Practice', type: 'interval', rounds: 6, work: { duration: 30, label: 'Hand-over-hand pulls' }, rest: 45, tip: 'Sit back, keep rope taut, steady rhythm.' },
    { name: 'Grip Endurance', type: 'interval', rounds: 4, work: { duration: 45, label: 'Dead hang' }, rest: 30, tip: 'Build the grip that won\'t fail on race day.' },
    { name: 'Seated Row Intervals', type: 'interval', rounds: 5, work: { duration: 30, label: 'Max effort rows' }, rest: 30, tip: 'Mimic the pull pattern. Engage lats not just arms.' },
  ],
  burpee_broad_jump: [
    { name: 'BBJ Intervals', type: 'interval', rounds: 5, work: { duration: 60, label: '10 burpee broad jumps' }, rest: 45, tip: 'Consistent jump distance ~1.5m. Don\'t max out.' },
    { name: 'BBJ Endurance', type: 'timed', duration: 240, label: '4 min AMRAP burpee broad jumps', tip: 'Find your sustainable pace. This is the hardest station.' },
    { name: 'BBJ Technique', type: 'interval', rounds: 8, work: { duration: 30, label: '5 perfect BBJs' }, rest: 20, tip: 'Focus on smooth floor-to-jump transition.' },
  ],
  rowing: [
    { name: 'Row Intervals', type: 'interval', rounds: 5, work: { duration: 90, label: '500m at race pace' }, rest: 90, tip: 'Legs → back → arms. 24-28 strokes/min.' },
    { name: 'Row Negative Splits', type: 'interval', rounds: 4, work: { duration: 60, label: '250m, each faster' }, rest: 60, tip: 'Start at 2:05/500m, finish at 1:50/500m.' },
    { name: 'Row Steady State', type: 'timed', duration: 300, label: '5 min easy row', tip: 'Build aerobic base. Keep stroke rate at 22-24.' },
  ],
  farmers_carry: [
    { name: 'Carry Intervals', type: 'interval', rounds: 4, work: { duration: 60, label: '50m carry' }, rest: 45, tip: 'Stand tall, quick steps, zero drops.' },
    { name: 'Grip Builder', type: 'interval', rounds: 5, work: { duration: 40, label: 'Heavy KB hold' }, rest: 20, tip: 'Squeeze hard. This is the grip that gets you through.' },
    { name: 'Carry + Lunges Combo', type: 'interval', rounds: 3, work: { duration: 90, label: '50m carry → 20 lunges' }, rest: 60, tip: 'Mimics race order. Carry then lunges back-to-back.' },
  ],
  sandbag_lunges: [
    { name: 'Weighted Lunge Intervals', type: 'interval', rounds: 5, work: { duration: 60, label: '20 walking lunges' }, rest: 45, tip: 'Bag on shoulders, medium steps, torso upright.' },
    { name: 'Lunge Cadence Drill', type: 'interval', rounds: 4, work: { duration: 45, label: 'Lunges at 1/sec' }, rest: 30, tip: 'Use a metronome. Cadence > step length.' },
    { name: 'Bulgarian Split Squats', type: 'interval', rounds: 4, work: { duration: 40, label: '10 each leg' }, rest: 40, tip: 'Builds single-leg strength for lunge power.' },
  ],
  wall_balls: [
    { name: 'Wall Ball Sets', type: 'interval', rounds: 5, work: { duration: 50, label: '15 wall balls' }, rest: 15, tip: 'Plan your race sets: 5x15. Practice it.' },
    { name: 'Wall Ball Unbroken', type: 'interval', rounds: 3, work: { duration: 75, label: '25 unbroken wall balls' }, rest: 60, tip: 'Build capacity to do bigger sets on race day.' },
    { name: 'Thruster Builder', type: 'interval', rounds: 4, work: { duration: 45, label: '12 dumbbell thrusters' }, rest: 30, tip: 'Same movement pattern as wall balls. Builds power.' },
  ],
};

// ============================================================
// Full Simulation Template
// ============================================================
const FULL_SIM = {
  name: 'Hyrox Full Simulation',
  description: 'Practice the full race order. Scale distances/reps to 50-75% for training.',
  segments: [
    { type: 'run', label: 'Run 1', duration: 0, distance: '1 km' },
    { type: 'station', station: 'ski_erg', label: 'SkiErg', duration: 0, target: '1000m (or 500m scaled)' },
    { type: 'run', label: 'Run 2', duration: 0, distance: '1 km' },
    { type: 'station', station: 'sled_push', label: 'Sled Push', duration: 0, target: '50m (or 25m scaled)' },
    { type: 'run', label: 'Run 3', duration: 0, distance: '1 km' },
    { type: 'station', station: 'sled_pull', label: 'Sled Pull', duration: 0, target: '50m (or 25m scaled)' },
    { type: 'run', label: 'Run 4', duration: 0, distance: '1 km' },
    { type: 'station', station: 'burpee_broad_jump', label: 'Burpee Broad Jump', duration: 0, target: '80m (or 40m scaled)' },
    { type: 'run', label: 'Run 5', duration: 0, distance: '1 km' },
    { type: 'station', station: 'rowing', label: 'Rowing', duration: 0, target: '1000m (or 500m scaled)' },
    { type: 'run', label: 'Run 6', duration: 0, distance: '1 km' },
    { type: 'station', station: 'farmers_carry', label: 'Farmers Carry', duration: 0, target: '200m (or 100m scaled)' },
    { type: 'run', label: 'Run 7', duration: 0, distance: '1 km' },
    { type: 'station', station: 'sandbag_lunges', label: 'Sandbag Lunges', duration: 0, target: '100m (or 50m scaled)' },
    { type: 'run', label: 'Run 8', duration: 0, distance: '1 km' },
    { type: 'station', station: 'wall_balls', label: 'Wall Balls', duration: 0, target: '75 reps (or 40 scaled)' },
  ]
};

// ============================================================
// Weekly Plan Generator
// ============================================================
const WEEK_TEMPLATES = {
  // 4 training days per week
  days: [
    { day: 'Monday', type: 'stations', focus: 'weak', label: 'Weak Station Drills' },
    { day: 'Tuesday', type: 'run', label: 'Run Intervals' },
    { day: 'Wednesday', type: 'rest', label: 'Rest / Active Recovery' },
    { day: 'Thursday', type: 'stations', focus: 'strong', label: 'Station Maintenance' },
    { day: 'Friday', type: 'run', label: 'Easy Run + Mobility' },
    { day: 'Saturday', type: 'sim', label: 'Hyrox Simulation' },
    { day: 'Sunday', type: 'rest', label: 'Full Rest' },
  ]
};

/**
 * Generate a workout session based on type and the user's weak/strong stations.
 * @param {string} type - 'weak_stations' | 'strong_stations' | 'sim' | 'run'
 * @param {Array} weakStations - station IDs sorted weakest first
 * @returns {Object} workout session
 */
function generateWorkout(type, weakStations) {
  if (type === 'sim') {
    return {
      name: FULL_SIM.name,
      description: FULL_SIM.description,
      type: 'sim',
      segments: FULL_SIM.segments.map(s => ({...s})),
      estimatedMinutes: 60,
    };
  }

  if (type === 'run') {
    return {
      name: 'Run Training',
      description: 'Build your aerobic base and pacing for 8 x 1km.',
      type: 'interval',
      segments: [
        { type: 'warmup', label: 'Easy jog warm-up', duration: 300 },
        ...Array.from({length: 6}, (_, i) => ([
          { type: 'work', label: `1km interval ${i+1}`, duration: 0, distance: '1 km at race pace' },
          { type: 'rest', label: 'Walk recovery', duration: 90 },
        ])).flat(),
        { type: 'cooldown', label: 'Easy jog cool-down', duration: 300 },
      ],
      estimatedMinutes: 45,
    };
  }

  // Station drills
  const isWeak = type === 'weak_stations';
  const targetStations = isWeak ? weakStations.slice(0, 3) : weakStations.slice(-3);

  const exercises = [];
  targetStations.forEach(stId => {
    const drills = DRILL_LIBRARY[stId];
    if (!drills) return;
    // Pick a random drill for variety
    const drill = drills[Math.floor(Math.random() * drills.length)];
    exercises.push({ stationId: stId, ...drill });
  });

  return {
    name: isWeak ? 'Weak Station Focus' : 'Station Maintenance',
    description: isWeak
      ? 'Target your biggest time leaks with focused drills.'
      : 'Maintain your strengths with lighter practice.',
    type: 'drills',
    exercises,
    estimatedMinutes: isWeak ? 40 : 30,
  };
}
