// ============================================================
// Hyrox Station Data — Intermediate Athlete Focus
// ============================================================

const STATIONS = [
  {
    id: 'ski_erg',
    order: 1,
    name: 'SkiErg',
    distance: '1000m',
    icon: '🎿',
    description: 'Standing cardio pull using a ski ergometer.',
    muscles: 'Lats, triceps, core, shoulders',
    // Benchmarks in seconds — used for analysis comparison
    benchmarks: { men_open: { good: 180, average: 240, slow: 330 }, women_open: { good: 220, average: 290, slow: 390 }, doubles: { good: 160, average: 210, slow: 300 } },
    defaultTime: { men_open: 240, women_open: 290, doubles: 210 },
    tips: [
      'Hinge at hips — use your whole posterior chain, not just arms',
      'Steady 1:55-2:05/500m split is sustainable for most',
      'Long powerful strokes > fast choppy pulls',
      'Exhale forcefully on the pull-down phase'
    ],
    improvements: [
      { condition: 'slow', text: 'Your SkiErg is well above average. Add 2x/week SkiErg intervals: 8x250m with 45s rest. Focus on the hip hinge pattern.' },
      { condition: 'average', text: 'Solid SkiErg time. To shave 15-20s, practice negative splits: start at 2:05/500m, finish at 1:50/500m.' },
      { condition: 'good', text: 'Strong SkiErg. Maintain with 1x/week. Focus training time on weaker stations.' }
    ]
  },
  {
    id: 'sled_push',
    order: 2,
    name: 'Sled Push',
    distance: '50m',
    weight: 'M: 152kg / W: 102kg',
    icon: '🛷',
    description: 'Push a weighted sled across 50m of track.',
    muscles: 'Quads, glutes, calves, core',
    benchmarks: { men_open: { good: 90, average: 150, slow: 240 }, women_open: { good: 120, average: 195, slow: 300 }, doubles: { good: 75, average: 130, slow: 210 } },
    defaultTime: { men_open: 150, women_open: 195, doubles: 130 },
    tips: [
      'Stay LOW — 45-degree body angle is ideal',
      'Short choppy steps, drive through the balls of your feet',
      'Arms locked, don\'t push with upper body',
      'Never stop mid-push — slow movement beats a restart'
    ],
    improvements: [
      { condition: 'slow', text: 'Sled push is a major time leak. Focus on leg strength: 3x/week squats and leg press. Practice sled work at 70% weight for technique.' },
      { condition: 'average', text: 'Work on explosiveness: heavy sled sprints 4x25m, rest 90s. Also add hill sprints 1x/week for leg drive.' },
      { condition: 'good', text: 'Efficient sled push. Maintain with 1x/week. Energy saved here pays off on later stations.' }
    ]
  },
  {
    id: 'sled_pull',
    order: 3,
    name: 'Sled Pull',
    distance: '50m',
    weight: 'M: 103kg / W: 78kg',
    icon: '🪢',
    description: 'Pull a weighted sled towards you, hand over hand with rope.',
    muscles: 'Biceps, back, grip, core',
    benchmarks: { men_open: { good: 75, average: 120, slow: 210 }, women_open: { good: 100, average: 165, slow: 270 }, doubles: { good: 65, average: 105, slow: 180 } },
    defaultTime: { men_open: 120, women_open: 165, doubles: 105 },
    tips: [
      'Sit back and use bodyweight as counterbalance',
      'Hand-over-hand with steady rhythm — no yanking',
      'Keep rope taut between pulls — no slack',
      'Wide foot stance for stability'
    ],
    improvements: [
      { condition: 'slow', text: 'Sled pull technique matters more than strength. Practice seated rope pulls 2x/week. Focus on rhythm and keeping zero slack.' },
      { condition: 'average', text: 'Add grip endurance work: dead hangs (3x45s) and heavy farmer holds. Also practice pulling at race weight.' },
      { condition: 'good', text: 'Good pull time. Keep grip fresh by not death-gripping the SkiErg and sled push handles before this.' }
    ]
  },
  {
    id: 'burpee_broad_jump',
    order: 4,
    name: 'Burpee Broad Jump',
    distance: '80m',
    icon: '🤸',
    description: 'Burpee + forward broad jump repeated over 80 meters.',
    muscles: 'Full body — legs, chest, shoulders, core',
    benchmarks: { men_open: { good: 210, average: 300, slow: 420 }, women_open: { good: 260, average: 350, slow: 480 }, doubles: { good: 190, average: 270, slow: 380 } },
    defaultTime: { men_open: 300, women_open: 350, doubles: 270 },
    tips: [
      'Sustainable rhythm > max effort jumps',
      'Jump for consistency (1.5-1.8m), not max distance',
      'Chest to floor on the burpee — make it count',
      'Breathe on the way down, exhale on the jump'
    ],
    improvements: [
      { condition: 'slow', text: 'This is the longest station. Train 3x/week: sets of 10 burpee broad jumps with 30s rest. Build volume before speed.' },
      { condition: 'average', text: 'Improve efficiency: practice a faster floor-to-jump transition. Time yourself for 10 reps and aim to cut 2s off each set.' },
      { condition: 'good', text: 'Strong station. On race day, focus on consistent jump distance — don\'t spike effort here since rowing is next.' }
    ]
  },
  {
    id: 'rowing',
    order: 5,
    name: 'Rowing',
    distance: '1000m',
    icon: '🚣',
    description: 'Row 1000 meters on a Concept2 ergometer.',
    muscles: 'Legs, back, arms, core',
    benchmarks: { men_open: { good: 180, average: 225, slow: 300 }, women_open: { good: 220, average: 270, slow: 360 }, doubles: { good: 165, average: 205, slow: 270 } },
    defaultTime: { men_open: 225, women_open: 270, doubles: 205 },
    tips: [
      'Sequence: legs → back → arms → arms → back → legs',
      '24-28 strokes/min — powerful not fast',
      'Loose grip on recovery, fingers hooked',
      'Push hard with legs FIRST, arms finish'
    ],
    improvements: [
      { condition: 'slow', text: 'Rowing technique is your best ROI. Take one technique session to nail the drive sequence. Then: 4x500m intervals at target pace, 90s rest.' },
      { condition: 'average', text: 'Solid base. Add 1x/week: 5x500m at race pace -3s/500m. Focus on powerful leg drive at a controlled stroke rate.' },
      { condition: 'good', text: 'Row is strong. On race day, settle into pace by stroke 5 — don\'t fly-and-die on the start.' }
    ]
  },
  {
    id: 'farmers_carry',
    order: 6,
    name: 'Farmers Carry',
    distance: '200m',
    weight: 'M: 2x24kg / W: 2x16kg',
    icon: '🏋️',
    description: 'Carry two kettlebells for 200 meters.',
    muscles: 'Grip, traps, core, shoulders',
    benchmarks: { men_open: { good: 90, average: 135, slow: 210 }, women_open: { good: 120, average: 175, slow: 270 }, doubles: { good: 80, average: 120, slow: 180 } },
    defaultTime: { men_open: 135, women_open: 175, doubles: 120 },
    tips: [
      'Stand tall, squeeze shoulder blades together',
      'Quick short steps — almost a shuffle',
      'Minimize drops — each pickup costs 5-10 seconds',
      'Grip the handles hard, bells close to sides'
    ],
    improvements: [
      { condition: 'slow', text: 'Grip is likely the limiter. Add: dead hangs 3x60s, heavy KB holds 3x200m walks, and wrist curls 2x/week.' },
      { condition: 'average', text: 'Focus on zero-drop carries. Practice at race weight: 4x50m with goal of no stops. Build grip endurance.' },
      { condition: 'good', text: 'Fast carry. This is a grip-saver station if done right. Walk fast, breathe steady, save energy for lunges.' }
    ]
  },
  {
    id: 'sandbag_lunges',
    order: 7,
    name: 'Sandbag Lunges',
    distance: '100m',
    weight: 'M: 20kg / W: 10kg',
    icon: '🏃',
    description: 'Walking lunges with a sandbag over 100 meters.',
    muscles: 'Quads, glutes, hamstrings, core',
    benchmarks: { men_open: { good: 150, average: 230, slow: 360 }, women_open: { good: 195, average: 280, slow: 420 }, doubles: { good: 130, average: 200, slow: 310 } },
    defaultTime: { men_open: 230, women_open: 280, doubles: 200 },
    tips: [
      'Bag on shoulders, NOT on your neck',
      'Medium steps — too long = balance issues',
      'Torso upright, drive up through front heel',
      'Breathe in on the step, out on the drive'
    ],
    improvements: [
      { condition: 'slow', text: 'Lunges are a major time cost. Train: 3x/week weighted walking lunges, start bodyweight and progress to race weight over 4 weeks.' },
      { condition: 'average', text: 'Improve by focusing on cadence. Practice with a metronome: aim for 1 lunge per second. Add Bulgarian split squats 3x10 each leg.' },
      { condition: 'good', text: 'Efficient lunges. Keep cadence steady on race day — don\'t let fatigue slow your step rate in the last 25m.' }
    ]
  },
  {
    id: 'wall_balls',
    order: 8,
    name: 'Wall Balls',
    reps: '75 reps',
    weight: 'M: 6kg / W: 4kg',
    icon: '🎯',
    description: 'Squat and throw a medicine ball to a target, 75 times.',
    muscles: 'Quads, shoulders, glutes, core',
    benchmarks: { men_open: { good: 150, average: 230, slow: 360 }, women_open: { good: 195, average: 280, slow: 420 }, doubles: { good: 130, average: 200, slow: 310 } },
    defaultTime: { men_open: 230, women_open: 280, doubles: 200 },
    tips: [
      'Pre-plan sets: 20-20-20-15 or 15x5 with 5s rests',
      'Catch → squat as one fluid motion',
      'Hit the target line, not above — wasted height = wasted energy',
      'Breathe out on the throw'
    ],
    improvements: [
      { condition: 'slow', text: 'Wall balls are the final grind. Train: 5x20 wall balls with 15s rest, 3x/week. Also add front squats 3x10 for leg endurance.' },
      { condition: 'average', text: 'Work on unbroken sets. Start with 3x25 unbroken at training, build to 2x30+15. The fewer breaks, the faster you finish.' },
      { condition: 'good', text: 'Last station — dig in. Practice finishing sets under fatigue: do wall balls after a 1km run in training.' }
    ]
  }
];

// ============================================================
// Race Day Data
// ============================================================

const CHECKLIST_ITEMS = [
  { category: 'Essentials', items: ['Race bib & safety pins', 'Photo ID', 'Proof of registration'] },
  { category: 'Clothing', items: ['Broken-in running shoes', 'Compression shorts/leggings', 'Moisture-wicking top', 'Grip gloves (sled & carries)', 'Extra socks'] },
  { category: 'Nutrition', items: ['Water bottle', 'Energy gels (2-3)', 'Pre-race snack', 'Post-race recovery drink'] },
  { category: 'Recovery', items: ['Foam roller', 'Change of clothes', 'Towel', 'Sandals for after'] }
];

const STRATEGY_TIPS = [
  { title: 'Pace Your Runs Evenly', detail: 'Don\'t bank time on early runs. Even or slight negative splits across all 8 km. The goal is consistent effort, not fast starts.' },
  { title: 'Never Stop the Sled', detail: 'Even 0.5 km/h of movement is faster than stopping and restarting. The initial force to break static friction is massive. Keep. Moving.' },
  { title: 'Pre-Plan Wall Ball Sets', detail: 'Decide your set breakdown BEFORE you start. 20-20-20-15 with 5s rests is a solid intermediate strategy.' },
  { title: 'Walk the Roxzone', detail: 'Transitions are free recovery. Walk, breathe, sip water. Don\'t waste energy running between stations.' },
  { title: 'Conserve Grip', detail: 'Sled pull, farmers carry, and wall balls all tax grip. Use only the force you need — loose fingers on the SkiErg and rower.' },
  { title: 'Negative Split Stations', detail: 'Try to maintain or improve station times throughout the race. Fading badly on stations 6-8 is the #1 intermediate mistake.' }
];

const NUTRITION_TIMELINE = [
  { time: 'Night Before', advice: 'Carb-rich dinner: pasta, rice, potatoes. Hydrate well. Nothing new or experimental.' },
  { time: '3 Hours Before', advice: 'Light breakfast ~400 cal: oatmeal, banana, toast + peanut butter. Coffee if you\'re used to it.' },
  { time: '1 Hour Before', advice: 'Small top-up if needed: half banana or dates. Sip water, don\'t chug.' },
  { time: 'During Race', advice: 'Gel before station 4 (burpees) and before station 7 (lunges). Water at every Roxzone.' },
  { time: 'Post Race', advice: 'Protein + carbs within 30 min. Chocolate milk, shake, or a real meal. Rehydrate aggressively.' }
];
