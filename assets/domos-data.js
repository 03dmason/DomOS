window.DOMOS_DATA = {
  plannerActivities: [
    { key: "run", label: "Run", short: "Run", nutrition: "run", detail: "Easy/moderate 5km or football fitness run" },
    { key: "gym", label: "Gym", short: "Gym", nutrition: "gym", detail: "Project Phoenix Session A/B/C" },
    { key: "abs", label: "Abs", short: "Abs", nutrition: "abs", detail: "Phoenix core / abs session" },
    { key: "football_training", label: "Football training", short: "Training", nutrition: "football", detail: "Technical football session / striker work" },
    { key: "sevens", label: "7-a-side friendly", short: "7s", nutrition: "sevens", detail: "Friendly 5/7-a-side match" },
    { key: "match11", label: "11-a-side match", short: "11s", nutrition: "football", detail: "Full football match day" }
  ],

  modules: [
    { key: "phoenix", name: "Project Phoenix", short: "Phoenix", icon: "PX", accent: "#39D5FF", status: "active", canLog: true, description: "Gym, physique, readiness and weekly adherence. Session-level only; set tracking remains external." },
    { key: "nutrition", name: "Nutrition OS", short: "Nutrition", icon: "NO", accent: "#36D399", status: "active", canLog: true, description: "Phase-based calorie, macro, fibre and hydration targets driven by the weekly plan or manual override." },
    { key: "football", name: "Football Training", short: "Football", icon: "F9", accent: "#FBBF24", status: "active", canLog: true, description: "12-week striker plan with full session details, match focus, Session B score and -1 shot tracking." },
    { key: "physio", name: "Physio / Rehab", short: "Physio", icon: "RH", accent: "#A78BFA", status: "active", canLog: true, description: "Knee/ankle rehab, pain, effort and readiness warnings for gym and football." },
    { key: "face_body", name: "Face & Body Care", short: "Face & Body", icon: "FB", accent: "#F472B6", status: "active", canLog: true, description: "Beard minoxidil, BHA, dermastamp, SPF, body wash, sweat and odour control." },
    { key: "hair_care", name: "Hair Care", short: "Hair Care", icon: "HC", accent: "#34D399", status: "active", canLog: true, description: "Scalp care, Nizoral, K18, peptide serum, repair rhythm and product stock." },
    { key: "hair_styling", name: "Hairstyling", short: "Styling", icon: "ST", accent: "#FB7185", status: "reference", canLog: false, description: "Reference guide only: diffuser and straightener methods. No styling logging." },
    { key: "products", name: "Products & Reorders", short: "Products", icon: "PR", accent: "#60A5FA", status: "active", canLog: false, description: "Central product stock, reorder dates, prices and tools across care modules." }
  ],

  phoenix: {
    defaultWeek: [
      { day: "Monday", session: "A", title: "Upper Push + Quads", minutes: 70 },
      { day: "Wednesday", session: "B", title: "Upper Pull + Arms + Hamstrings + Calves", minutes: 70 },
      { day: "Friday", session: "C", title: "Shoulders + Arms + Chest + Prevention Hamstrings + Calves", minutes: 65 },
      { day: "Flexible", session: "Abs", title: "Abs/Core 3× weekly", minutes: 15 }
    ],
    sessions: {
      A: {
        title: "Upper Push + Quads",
        duration: "~70 min",
        focus: "Upper body first, controlled quad block second. DomOS does not log sets; use this as your session reference.",
        exercises: [
          { name: "Incline DB Press", prescription: "4×6–10", hints: "Main upper chest press. Start at bottom of range with 1–2 RIR. Progress externally when all sets hit the top of the range." },
          { name: "DB Shoulder Press", prescription: "3×6–10", hints: "Controlled shoulder press. Avoid turning it into a standing body-drive movement." },
          { name: "DB Lateral Raise", prescription: "4×12–15", hints: "Lead with elbows. Keep traps quiet. Controlled tempo matters more than load." },
          { name: "Machine Chest Press", prescription: "3×8–10", hints: "Stable pressing volume after dumbbells. Keep shoulder blades set." },
          { name: "Machine Chest Fly", prescription: "3×12–15", hints: "Controlled stretch and squeeze. Avoid overstretching shoulders." },
          { name: "Tricep Rope Pushdown", prescription: "3×10–15", hints: "Elbows tucked. Full extension. Do not swing." },
          { name: "Leg Press", prescription: "3×10–12", hints: "Start light. Smooth controlled reps. No ego loading while knee history is active." },
          { name: "Goblet Squat", prescription: "3×10–12", hints: "Depth and control before load. Keep torso braced and knees tracking cleanly." },
          { name: "Leg Extension — top range only", prescription: "3×12–15", hints: "Top range only due to knee history. Stop if knee joint discomfort appears. Full range only after 4+ pain-free weeks." }
        ]
      },
      B: {
        title: "Upper Pull + Arms + Hamstrings + Calves",
        duration: "~70 min",
        focus: "Main hamstring day. Keep as far from football and hard running as possible.",
        exercises: [
          { name: "Lat Pulldown", prescription: "4×8–10", hints: "Pull elbows down. Do not turn it into a lean-back row." },
          { name: "Seated Row", prescription: "3×10–12", hints: "Chest tall. Squeeze shoulder blades without shrugging." },
          { name: "Single-Arm Cable Row", prescription: "3×10–12 each", hints: "Use it to clean up left/right control. Keep torso stable." },
          { name: "DB Bicep Curl", prescription: "3×8–12", hints: "No swinging. Full range." },
          { name: "Hammer Curl", prescription: "3×10–12", hints: "Neutral grip. Good for brachialis/forearm thickness." },
          { name: "DB Romanian Deadlift", prescription: "3×8–10", hints: "Hip hinge, not squat. Soft knees. Stop if hamstring pulling or sharp sensation." },
          { name: "Leg Curl", prescription: "3×10–12", hints: "Controlled squeeze. Avoid cramping by starting conservative." },
          { name: "Assisted Nordic Hamstring Curl", prescription: "2×4–6", hints: "Partial range and assisted. Sharp pain, pulling, or 48h soreness = regress/stop." },
          { name: "Face Pull", prescription: "3×15–20", hints: "Rear delts and shoulder health. Pull to face, elbows high but controlled." },
          { name: "Overhead Cable Tricep Extension", prescription: "3×12–15", hints: "Long-head triceps. Keep ribs down." },
          { name: "Calf Raise", prescription: "3×12–15", hints: "Full stretch, full squeeze. Controlled lowering." }
        ]
      },
      C: {
        title: "Shoulders + Arms + Chest + Prevention Hamstrings + Calves",
        duration: "~65 min",
        focus: "Safer before weekend football: hamstring work is prevention/isometric, not heavy eccentric loading.",
        exercises: [
          { name: "Incline DB Curl", prescription: "3×10–12", hints: "Long stretch bicep work. Do not swing." },
          { name: "Cable Hammer Curl", prescription: "3×12–15", hints: "Controlled neutral-grip volume." },
          { name: "Cable/Machine Chest Fly", prescription: "3×12–15", hints: "Chest volume without heavy pressing fatigue." },
          { name: "Machine Shoulder Press", prescription: "3×8–10", hints: "Stable shoulder press. Stop before form breaks." },
          { name: "Cable Lateral Raise", prescription: "4×12–15", hints: "Constant tension lateral delt work. Light and clean." },
          { name: "Reverse Fly", prescription: "3×12–15", hints: "Rear delts. Control the return." },
          { name: "Long-Lever Hamstring Bridge Hold", prescription: "2–3×20–30s", hints: "Isometric prevention only. Zero DOMS target." },
          { name: "Calf Raise", prescription: "4×12–15", hints: "Lower leg strength for running/football. Controlled reps." }
        ]
      },
      Abs: {
        title: "Abs/Core",
        duration: "15–20 min",
        focus: "2× standard core and 1× football-focused core per week.",
        exercises: [
          { name: "Standard core", prescription: "Sit-ups 3×20–25 · Leg Raises 3×15–20 · Plank 3×30–60s", hints: "Good default abs session." },
          { name: "Football-focused core", prescription: "Side Plank 3×30–45s · Hip Dips 3×20 · Bicycle Crunches 3×20 · Dead Bugs 3×10 each · Mountain Climbers 3×20", hints: "Ideally keep 24h away from match/hard run if possible." }
        ]
      }
    },
    rules: [
      "DomOS tracks session/adherence/readiness only — set logging is external.",
      "Amber hamstring: remove RDL and Nordics, light leg curls only, no full-effort sprinting.",
      "Red hamstring: no eccentric hamstring loading, no football, seek assessment if unresolved.",
      "Knee discomfort on leg extension: stop and use top range only when pain-free.",
      "Strength tracking and progression detail remain in the separate gym app."
    ]
  },

  nutrition: {
    activePhase: "cut",
    phases: {
      wedding: { name: "Wedding Prep", status: "archived", end: "2026-05-13", baseCalories: 2200, protein: 165, fat: 65, fibreBase: 25, stepsBase: 10000, stepsBoostPer1k: 25, activityFuelFactor: 0.55, waterRest: "2.5L", waterTraining: "3.0–3.5L", activities: { run: 350, gym: 250, abs: 60, football: 280, sevens: 420 } },
      cut: { name: "Deep Cut", status: "active", end: "2026-07-25", baseCalories: 2000, protein: 165, fat: 65, fibreBase: 28, stepsBase: 10000, stepsBoostPer1k: 20, activityFuelFactor: 0.55, waterRest: "2.5L", waterTraining: "3.0–3.5L", activities: { run: 300, gym: 220, abs: 55, football: 260, sevens: 380 } },
      bulk: { name: "Lean Bulk", status: "upcoming", end: "2026-10-03", baseCalories: 2500, protein: 165, fat: 65, fibreBase: 30, stepsBase: 10000, stepsBoostPer1k: 30, activityFuelFactor: 0.55, waterRest: "3.0L", waterTraining: "3.5L", activities: { run: 320, gym: 250, abs: 60, football: 280, sevens: 420 } }
    }
  },

  football: {
    startDate: "2026-05-14",
    phase2Start: "2026-06-11",
    phase3Start: "2026-07-09",
    endDate: "2026-08-05",
    sessions: {
      A: { title: "Ball mastery + wall receiving", location: "Home / garden", duration: "30 min", intensity: "moderate", focus: "Receiving and escaping with clean first touch.", blocks: [
        { name: "Warm Up", dur: "5 min", details: "Light jog, leg swings, hip circles, left ankle circles, slow squats." },
        { name: "Ball Mastery", dur: "10 min", details: "Toe taps, sole rolls, V-pulls, inside-outside. Size 4 ball, stay mostly stationary, eyes up." },
        { name: "Wall Receive & Escape", dur: "12 min", details: "Scan before each rep, call colour, pass into wall, first touch exits through matching gate, second touch passes back. Right foot, left foot, alternate feet." },
        { name: "Cool Down", dur: "3 min", details: "Hamstring, calf and hip flexor stretch." }
      ]},
      B: { title: "Rebounder first touch + main finishing", location: "Parents' garden", duration: "50 min", intensity: "high", focus: "Core striker session: first touch into finishing and reducing keeper-zone shots.", blocks: [
        { name: "Warm Up", dur: "5 min", details: "Jog, walking lunges, easy rebounder passes." },
        { name: "Rebounder First Touch", dur: "10 min", details: "Flat side weeks 1–4. 3×10 reps. Rotate touch left, right, forward, shield, turn, weak foot. Scan before every pass." },
        { name: "Target Finishing", dur: "25 min", details: "Scoring: +3 corner/target, +2 away from keeper, +1 central on target, 0 miss, -1 through middle. Blocks: close placement, rebounder set-and-finish, movement then finish, awkward ball or distance block." },
        { name: "Cool Down", dur: "5 min", details: "Walk, quad stretch, hip flexor, calf. Log score and -1 count immediately." }
      ]},
      C: { title: "Light touch + weak foot", location: "Home / garden", duration: "25 min", intensity: "low", focus: "Low-load ball familiarity and weak-foot development.", blocks: [
        { name: "Warm Up", dur: "3 min", details: "Light movement, ankle circles, hip openers." },
        { name: "Juggling", dur: "10 min", details: "Right foot target 30, left foot target 15, alternating target 50, mixed max. Soft ankle." },
        { name: "Weak Foot Wall Passes", dur: "10 min", details: "Left foot only. Scan, pass with left, receive with left, repeat. Accuracy over speed." },
        { name: "Cool Down", dur: "2 min", details: "Quick hamstrings, calves, quads." }
      ]},
      D: { title: "7-a-side match focus", location: "Pitch", duration: "match", intensity: "max", focus: "One focus per game. Play naturally, review after.", blocks: [
        { name: "Pre-match", dur: "10 min", details: "Light jog, dynamic stretch, a few passes, check weekly focus then play." },
        { name: "During game", dur: "Full match", details: "Do not count everything. Keep one focus quietly in mind. After mistakes, one positive action within 30 seconds." },
        { name: "After game", dur: "5 min", details: "Q1 focus Yes/Mostly/No. Q2 one thing that went well. Q3 one thing to do differently." }
      ]},
      E: { title: "Rebounder touch + finish + heading", location: "Parents' garden", duration: "55 min", intensity: "moderate", focus: "Controlled first touch, second-touch finish, and low-volume heading technique.", blocks: [
        { name: "Warm Up", dur: "8 min", details: "Jog, dynamic stretch, neck mobility. If sore from match, skip heading." },
        { name: "Rebounder First Touch", dur: "10 min", details: "Same touch types as Session B but controlled pace." },
        { name: "Rebounder Touch & Finish", dur: "12 min", details: "Scan, pass, first touch sets ball to side, finish on second touch. 8 right, 8 left, 6 weak foot." },
        { name: "Heading", dur: "10 min", details: "Max 10 headers/week. Forehead contact, eyes open, mouth closed, torso power, aim down. Stop for neck soreness." },
        { name: "Light Finishing", dur: "7 min", details: "8–10 easy close-range placement strikes. End sharp, not tired." },
        { name: "Cool Down", dur: "5 min", details: "Walk, stretch, gentle neck stretch." }
      ]},
      F: { title: "Video + visualisation", location: "Home", duration: "20 min", intensity: "low", focus: "Recovery touch and striker pattern recognition.", blocks: [
        { name: "Juggling", dur: "5 min", details: "No targets. Just light ball feel." },
        { name: "Video & Visualisation", dur: "15 min", details: "Watch elite striker movement/body shape/finishing decisions. Visualise correcting one chance from last match." }
      ]},
      R: { title: "Rest day", location: "Off", duration: "—", intensity: "zero", focus: "No ball. No gym. Recovery is part of adaptation.", blocks: [] }
    },
    matchFocus: [
      { week: 1, title: "Show To Feet", prompt: "Offer to feet, not just in behind." },
      { week: 2, title: "Choose Corner Before Contact", prompt: "Decide finish before the ball arrives." },
      { week: 3, title: "Blind-Side Runs", prompt: "Threaten the defender's blind side." },
      { week: 4, title: "React After Mistakes", prompt: "Positive action within 30 seconds." },
      { week: 5, title: "Simple Layoff", prompt: "When tight, one-touch layoff can be the correct option." },
      { week: 6, title: "Pressing Triggers", prompt: "Press on heavy touch, backwards-facing defender or slow square pass." },
      { week: 7, title: "Repeat Hardest Focus", prompt: "Repeat the focus that exposed you most." }
    ],
    rules: ["Session E/heading: not the day before or immediately after match if possible.", "Max 10 headers per week.", "Left knee/ankle flare = swap parents' session for home touch session.", "Rest day means no ball and no gym.", "After any mistake, positive action within 30 seconds."]
  },

  physio: {
    exercises: [
      { id: "slr", name: "Straight Leg Raise", schedule: "daily", dose: "3×10 each leg", purpose: "Strengthens quad/hip flexor chain without loading ankle.", tips: "Push knee into surface first to activate inner quad. Move slowly." },
      { id: "ankle_stretch", name: "Ankle Stretch", schedule: "twice daily", dose: "3×10×10s", purpose: "Restores ankle dorsiflexion and prevents stiffness.", tips: "Gentle stretch only. Do not force pain." },
      { id: "calf_raise", name: "Calf Raises", schedule: "alternate days", dose: "3×10", purpose: "Rebuilds calf/Achilles strength and push-off power.", tips: "Lower for 3–4 seconds. Hold wall lightly only for balance." },
      { id: "balance", name: "Wobble Board Balance", schedule: "daily", dose: "3×60s", purpose: "Retrains proprioception to prevent re-injury.", tips: "Eyes fixed ahead. Bare feet if safe." }
    ]
  },

  faceBody: {
    week: [
      { day: "Sunday", label: "BHA + Hibiscrub", type: "special", am: ["CeraVe SA + Hibiscrub", "CeraVe Foaming Cleanser", "Minoxidil foam", "SPF"], pm: ["Cleanse", "Paula's Choice BHA", "Minoxidil", "CeraVe PM", "Mitchum"] },
      { day: "Monday", label: "BHA night", type: "bha", am: ["CeraVe SA body wash", "Cleanse", "Minoxidil foam", "SPF"], pm: ["Cleanse", "BHA", "Minoxidil", "CeraVe PM", "Mitchum"] },
      { day: "Tuesday", label: "Rest night", type: "rest", am: ["CeraVe SA body wash", "Cleanse", "Minoxidil foam", "SPF"], pm: ["Cleanse", "Minoxidil", "CeraVe PM", "Mitchum"] },
      { day: "Wednesday", label: "Dermastamp night", type: "stamp", warning: "No PM minoxidil. No BHA.", am: ["CeraVe SA body wash", "Cleanse", "Minoxidil foam", "SPF"], pm: ["Cleanse", "Disinfect stamp", "0.5mm dermastamp", "CeraVe PM", "Disinfect + store", "Mitchum"] },
      { day: "Thursday", label: "BHA night", type: "bha", am: ["CeraVe SA body wash", "Cleanse", "Minoxidil foam", "SPF"], pm: ["Cleanse", "BHA", "Minoxidil", "CeraVe PM", "Mitchum"] },
      { day: "Friday", label: "Rest night", type: "rest", am: ["CeraVe SA body wash", "Cleanse", "Minoxidil foam", "SPF"], pm: ["Cleanse", "Minoxidil", "CeraVe PM", "Mitchum"] },
      { day: "Saturday", label: "Dermastamp night", type: "stamp", warning: "No PM minoxidil. No BHA.", am: ["CeraVe SA body wash", "Cleanse", "Minoxidil foam", "SPF"], pm: ["Cleanse", "Disinfect stamp", "0.5mm dermastamp", "CeraVe PM", "Disinfect + store", "Mitchum"] }
    ],
    rules: ["Never combine dermastamp + minoxidil same night.", "Never combine dermastamp + BHA same night.", "Wait 4 hours after minoxidil before showering.", "Apply Mitchum to dry skin at night.", "Wash hands after minoxidil.", "Replace dermastamp head every 3 months."],
    productNotes: ["Regaine 5% foam: half capful twice daily to beard patches.", "BHA: 2–3 drops on cotton pad, leave on.", "Hibiscrub: Sunday only on armpits/groin/feet, leave 1 min then rinse."]
  },

  hairCare: {
    week: [
      { day: "Sunday", label: "Repair", items: ["Olaplex No.4", "K18 mask", "Peptide serum", "Air-dry", "No salt spray for 24h"] },
      { day: "Monday", label: "Standard", items: ["Aveda shampoo", "Aveda conditioner", "Peptide serum"] },
      { day: "Tuesday", label: "Standard", items: ["Aveda shampoo", "Aveda conditioner", "Peptide serum"] },
      { day: "Wednesday", label: "Scalp care", items: ["Nizoral 2% AM", "Conditioner", "Dermaroller PM", "No scalp products after rolling"] },
      { day: "Thursday", label: "Standard", items: ["Aveda shampoo", "Aveda conditioner", "Peptide serum"] },
      { day: "Friday", label: "Standard", items: ["Aveda shampoo", "Aveda conditioner", "Peptide serum"] },
      { day: "Saturday", label: "Standard", items: ["Aveda shampoo", "Aveda conditioner", "Peptide serum"] }
    ],
    scenarios: {
      repair: { title: "Repair Day", meta: "Staying in · Air-dry · No styling", steps: ["Aveda shampoo — no conditioner yet", "Towel-dry to damp", "K18 1–2 pumps, wait 4 minutes", "Peptide serum to scalp", "Air-dry; optional conditioner after K18 wait if needed"], note: "No conditioner before K18 because it blocks penetration. No salt spray for 24h." },
      casual: { title: "Going Out · Casual", meta: "Texture + volume · Blow-dry · No iron", steps: ["Aveda shampoo", "Aveda conditioner", "Towel-dry to damp", "Peptide serum to scalp", "Bumble & Bumble Surf Spray 3–4 spritzes", "Blow-dry medium heat, finish cool blast"], note: "Cool blast locks the cuticle and shape." },
      full: { title: "Going Out · Styled", meta: "Full styling · Blow-dry + iron", steps: ["Aveda shampoo", "Aveda conditioner", "Towel-dry to damp", "Peptide serum", "Surf Spray", "Blow-dry", "Heat Shield on fully dry hair", "Straighten at lowest effective temp"], note: "Heat Shield only on dry hair. Never iron damp hair." },
      nizoral: { title: "Nizoral Day", meta: "Anti-DHT scalp wash · 1× weekly", steps: ["Nizoral 2% shampoo", "Leave 3–5 minutes", "Rinse thoroughly", "Always condition after", "Continue with day scenario"], note: "Once weekly is enough; more can dry scalp." },
      bond: { title: "Bond Repair", meta: "Deep recovery · 1× weekly", steps: ["Olaplex No.4", "Towel-dry to damp", "K18, wait 4 min", "Peptide serum", "Air-dry"], note: "Olaplex and K18 target different repair chemistry." },
      dermaroller: { title: "Dermaroller Night", meta: "Evening · clean dry scalp", steps: ["Wait until scalp is clean and dry", "0.5mm dermaroller in 4 directions", "Stop there", "No scalp products tonight", "Resume normal routine tomorrow"], note: "No products after rolling to avoid irritation." }
    },
    rules: ["No conditioner before K18.", "K18 waits 4 minutes.", "No salt spray for 24 hours after K18.", "Nizoral once weekly only.", "Dermaroller on clean dry scalp only.", "No scalp products after dermarolling until next morning."]
  },

  styling: {
    methods: {
      straighteners: { title: "The Wave with Irons", meta: "25–30 min · high definition · max 2–3 days/week", steps: ["Wash and towel-dry firmly: damp, not wet.", "Apply salt spray: 5–7 sprays through top/fringe, mid-lengths to tips.", "Dry crown and short sides flat first using palm and nozzle down the hair shaft.", "Dry top while pushing forward until bone dry.", "Apply heat protectant, then use irons around 170°C.", "Small 1.5–2cm sections. Bend-and-glide: rotate wrist forward/back/forward.", "Alternate starting direction on every neighbouring section, fringe included.", "Let hair cool 2–3 minutes before touching.", "Pea-sized paste only, emulsify clear, apply with direction.", "Two short bursts of hairspray from ~30cm if needed."], rules: ["Salt spray on damp hair only.", "Hair 100% bone dry before irons.", "Never paste before irons.", "Heat protectant is non-negotiable.", "Straighteners max 2–3 days/week."] },
      diffuser: { title: "The Daily Diffused", meta: "15–20 min · softer daily wave · lower damage", steps: ["Wash and towel-dry to damp, not wet.", "Salt spray 5–7 sprays through top/fringe, scrunch with fingers.", "Use regular nozzle first: dry crown and short sides flat with palm.", "Switch to diffuser: medium heat, low speed.", "Cup sections into diffuser bowl, push up, hold still 15–20 seconds.", "Move section by section; fringe dries forward/down.", "If crown lifts, press diffuser flat onto scalp instead of cupping.", "Finish with cool shot 30–60 seconds.", "Pea-sized paste, emulsify clear, apply with direction.", "Optional light hairspray only if needed."], rules: ["High speed blows the wave out.", "Stillness creates wave, movement creates frizz.", "Cool shot locks shape.", "Diffuser is the weekday method."] }
    }
  },

  products: [
    { module: "face_body", category: "Beard Growth", name: "Regaine For Men Extra Strength Foam 5%", price: null, cadence: "4–5 months", status: "active" },
    { module: "face_body", category: "Beard Growth", name: "KOI Beauty Adjustable Dermastamp", price: null, cadence: "replace head every 3 months", status: "active" },
    { module: "face_body", category: "Face Care", name: "CeraVe Foaming Facial Cleanser", price: null, cadence: "4–5 months", status: "active" },
    { module: "face_body", category: "Face Care", name: "CeraVe AM Facial Moisturising Lotion SPF 50", price: null, cadence: "2–3 months", status: "active" },
    { module: "face_body", category: "Face Care", name: "CeraVe PM Facial Moisturising Lotion", price: null, cadence: "4–5 months", status: "active" },
    { module: "face_body", category: "Face Care", name: "Paula's Choice 2% BHA Liquid Exfoliant", price: null, cadence: "2–3 months", status: "active" },
    { module: "face_body", category: "Body & Hygiene", name: "CeraVe SA Smoothing Cleanser", price: null, cadence: "4–5 months", status: "active" },
    { module: "face_body", category: "Body & Hygiene", name: "Hibiscrub", price: null, cadence: "as needed", status: "active" },
    { module: "face_body", category: "Body & Hygiene", name: "Mitchum Advanced Control 48hr Roll-On", price: null, cadence: "as needed", status: "active" },
    { module: "hair_care", category: "Wash", name: "Aveda Invati Ultra Advanced Light Shampoo", price: 26.40, cadence: "~3 months", status: "active" },
    { module: "hair_care", category: "Wash", name: "Aveda Invati Ultra Advanced Light Conditioner", price: 27.50, cadence: "~3 months", status: "active" },
    { module: "hair_care", category: "Weekly", name: "Olaplex No.4 Bond Maintenance Shampoo", price: 22.50, cadence: "~6 months", status: "active" },
    { module: "hair_care", category: "Weekly", name: "Nizoral 2% Shampoo", price: 9.74, cadence: "~6 months", status: "active" },
    { module: "hair_care", category: "Treatment", name: "K18 Leave-In Molecular Repair Mask", price: 70.00, cadence: "~8 months", status: "active" },
    { module: "hair_care", category: "Treatment", name: "The Ordinary Multi-Peptide Serum for Hair Density", price: 21.90, cadence: "~3 months", status: "active" },
    { module: "hair_care", category: "Treatment", name: "0.5mm Dermaroller", price: 8.99, cadence: "replace every 6 months", status: "active" },
    { module: "hair_styling", category: "Style", name: "Bumble & Bumble Surf Spray", price: 19.00, cadence: "~3 months", status: "active" },
    { module: "hair_styling", category: "Style", name: "Bumble & Bumble Heat Shield Thermal Mist", price: 18.00, cadence: "~6 months", status: "active" }
  ]
};
