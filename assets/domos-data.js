window.DOMOS_DATA = {
  modules: [
    { key: "phoenix", name: "Project Phoenix", short: "Phoenix", icon: "PX", accent: "#39D5FF", status: "active", description: "Gym, physique, readiness and weekly adherence. Session-level only; set tracking remains external." },
    { key: "nutrition", name: "Nutrition OS", short: "Nutrition", icon: "NO", accent: "#36D399", status: "active", description: "Phase-based calorie, macro, fibre and hydration targets driven by training load." },
    { key: "football", name: "Football Training", short: "Football", icon: "F9", accent: "#FBBF24", status: "active", description: "12-week striker plan: sessions, match focus, Session B score and -1 shot tracking." },
    { key: "physio", name: "Physio / Rehab", short: "Physio", icon: "RH", accent: "#A78BFA", status: "active", description: "Knee/ankle rehab, pain, effort and readiness warnings for gym and football." },
    { key: "face_body", name: "Face & Body Care", short: "Face & Body", icon: "FB", accent: "#F472B6", status: "active", description: "Beard minoxidil, BHA, dermastamp, SPF, body wash, sweat and odour control." },
    { key: "hair_care", name: "Hair Care", short: "Hair Care", icon: "HC", accent: "#34D399", status: "active", description: "Scalp care, Nizoral, K18, peptide serum, repair rhythm and product stock." },
    { key: "hair_styling", name: "Hairstyling", short: "Styling", icon: "ST", accent: "#FB7185", status: "active", description: "Diffuser and straightener methods, heat use limits and styling outcome tracking." },
    { key: "products", name: "Products & Reorders", short: "Products", icon: "PR", accent: "#60A5FA", status: "active", description: "Central product stock, reorder dates, prices and tools across care modules." }
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
        focus: "Upper body first, controlled quad block second.",
        blocks: ["Incline DB Press", "DB Shoulder Press", "DB Lateral Raise", "Machine Chest Press", "Machine Chest Fly", "Tricep Rope Pushdown", "Leg Press", "Goblet Squat", "Leg Extension — top range only"]
      },
      B: {
        title: "Upper Pull + Arms + Hamstrings + Calves",
        duration: "~70 min",
        focus: "Main hamstring day. Keep away from football/hard running where possible.",
        blocks: ["Lat Pulldown", "Seated Row", "Single-Arm Cable Row", "DB Curl", "Hammer Curl", "DB RDL", "Leg Curl", "Assisted Nordic", "Face Pull", "Overhead Tricep Extension", "Calf Raise"]
      },
      C: {
        title: "Shoulders + Arms + Chest + Prevention Hamstrings + Calves",
        duration: "~65 min",
        focus: "Weekend-safe prevention work: no eccentric hamstring DOMS.",
        blocks: ["Incline DB Curl", "Cable Hammer Curl", "Cable/Machine Fly", "Machine Shoulder Press", "Cable Lateral Raise", "Reverse Fly", "Long-Lever Hamstring Bridge Hold", "Calf Raise"]
      }
    },
    rules: [
      "DomOS tracks session/adherence/readiness only — set logging is external.",
      "Amber hamstring: remove RDL and Nordics, light leg curls only, no full-effort sprinting.",
      "Red hamstring: no eccentric hamstring loading, no football, seek assessment if unresolved.",
      "Knee joint discomfort on leg extension: stop and use top range only when pain-free.",
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
    sessions: [
      { id: "A", title: "Ball mastery + wall receiving", location: "Home", duration: "30 min", intensity: "moderate" },
      { id: "B", title: "Rebounder first touch + main finishing", location: "Parents' garden", duration: "50 min", intensity: "high" },
      { id: "C", title: "Light touch + weak foot", location: "Home", duration: "25 min", intensity: "low" },
      { id: "D", title: "7-a-side match focus", location: "Pitch", duration: "match", intensity: "max" },
      { id: "E", title: "Rebounder + touch/finish + heading", location: "Parents' garden", duration: "55 min", intensity: "moderate" },
      { id: "F", title: "Video + visualisation", location: "Home", duration: "20 min", intensity: "low" },
      { id: "R", title: "Rest day", location: "Off", duration: "—", intensity: "zero" }
    ],
    matchFocus: [
      { week: 1, title: "Show To Feet", prompt: "Offer to feet, not just in behind." },
      { week: 2, title: "Choose Corner Before Contact", prompt: "Decide the finish before striking." },
      { week: 3, title: "Blind-Side Runs", prompt: "Move where defender cannot see both you and ball." },
      { week: 4, title: "React After Mistakes", prompt: "Positive action within 30 seconds." },
      { week: 5, title: "Simple Layoff When Ball Arrives", prompt: "Use one-touch layoff when it is right." },
      { week: 6, title: "Pressing Triggers", prompt: "Press at the right moments, not constantly." },
      { week: 7, title: "Repeat Hardest One", prompt: "Repeat the focus that exposed you most." }
    ],
    rules: ["No Session E the day before or immediately after Session D.", "Max 10 headers per week.", "Knee/ankle flare = swap parents' session for home touch session.", "Rest day is total rest.", "Every shot: decide the corner before contact.", "After a mistake: positive action within 30 seconds."]
  },

  physio: {
    exercises: [
      { id: "slr", name: "Straight Leg Raise", schedule: "daily", dose: "3 × 10", purpose: "Quad/VMO activation without ankle load." },
      { id: "ankle_stretch", name: "Ankle Stretch", schedule: "twice_daily", dose: "3 × 10 · 10s holds", purpose: "Restore ankle dorsiflexion and prevent stiffness." },
      { id: "calf_raise", name: "Calf Raises", schedule: "alternate", dose: "3 × 10", purpose: "Calf/Achilles strength and push-off power." },
      { id: "wobble", name: "Wobble Board Balance", schedule: "daily", dose: "3 × 60s", purpose: "Proprioception and long-term ankle stability." }
    ],
    painLabels: ["none", "mild", "moderate", "sharp"],
    effortLabels: ["easy", "moderate", "hard", "max"]
  },

  faceBody: {
    week: {
      1: { label: "BHA night", type: "bha", am: ["SA body wash", "Face cleanse", "Minoxidil", "SPF"], pm: ["Cleanse", "BHA", "Minoxidil", "PM moisturiser", "Mitchum"] },
      2: { label: "Rest night", type: "rest", am: ["SA body wash", "Face cleanse", "Minoxidil", "SPF"], pm: ["Cleanse", "Minoxidil", "PM moisturiser", "Mitchum"] },
      3: { label: "Beard dermastamp", type: "stamp", am: ["SA body wash", "Face cleanse", "Minoxidil", "SPF"], pm: ["Cleanse", "Disinfect stamp", "Dermastamp", "PM moisturiser", "Disinfect/store", "Mitchum"], warning: "No minoxidil PM. No BHA." },
      4: { label: "BHA night", type: "bha", am: ["SA body wash", "Face cleanse", "Minoxidil", "SPF"], pm: ["Cleanse", "BHA", "Minoxidil", "PM moisturiser", "Mitchum"] },
      5: { label: "Rest night", type: "rest", am: ["SA body wash", "Face cleanse", "Minoxidil", "SPF"], pm: ["Cleanse", "Minoxidil", "PM moisturiser", "Mitchum"] },
      6: { label: "Beard dermastamp", type: "stamp", am: ["SA body wash", "Face cleanse", "Minoxidil", "SPF"], pm: ["Cleanse", "Disinfect stamp", "Dermastamp", "PM moisturiser", "Disinfect/store", "Mitchum"], warning: "No minoxidil PM. No BHA." },
      0: { label: "BHA + Hibiscrub", type: "special", am: ["SA body wash", "Hibiscrub armpits/groin/feet", "Face cleanse", "Minoxidil", "SPF"], pm: ["Cleanse", "BHA", "Minoxidil", "PM moisturiser", "Mitchum"] }
    },
    rules: ["Never combine beard dermastamp + minoxidil same night.", "Never combine beard dermastamp + BHA same night.", "Wait 4 hours after minoxidil before showering.", "Apply Mitchum to dry skin at night.", "Wash hands after minoxidil.", "Replace dermastamp head every 3 months."]
  },

  hairCare: {
    week: {
      1: { label: "Standard", items: ["Aveda shampoo + conditioner", "Peptide serum"] },
      2: { label: "Standard", items: ["Aveda shampoo + conditioner", "Peptide serum"] },
      3: { label: "Scalp care", items: ["Nizoral AM", "Conditioner", "Scalp dermaroller PM", "No scalp products after"] },
      4: { label: "Standard", items: ["Aveda shampoo + conditioner", "Peptide serum"] },
      5: { label: "Standard", items: ["Aveda shampoo + conditioner", "Peptide serum"] },
      6: { label: "Standard", items: ["Aveda shampoo + conditioner", "Peptide serum"] },
      0: { label: "Repair", items: ["Olaplex No.4", "K18 4-minute wait", "Peptide serum", "Air-dry", "No salt spray for 24h"] }
    },
    rules: ["No conditioner before K18.", "K18 waits 4 minutes.", "No salt spray for 24 hours after K18.", "Nizoral once weekly only.", "Scalp dermaroller on clean dry scalp only.", "No scalp products after dermarolling until next morning."]
  },

  styling: {
    methods: {
      diffuser: { name: "Diffuser", time: "15–20 min", damage: "minimal", use: "weekday/default", rules: ["Salt spray on damp hair only.", "Dry crown and short sides flat first.", "Medium heat, low speed.", "Cup, push up, hold still for 15–20s.", "Cool shot to finish."] },
      straighteners: { name: "Straighteners", time: "25–30 min", damage: "high", use: "2–3 days/week max", rules: ["Bone dry hair only.", "Heat protectant first.", "Never paste before irons.", "Alternate wave direction.", "Let cool before touching."] }
    }
  },

  products: [
    { module: "face_body", category: "Beard Growth", name: "Regaine For Men Extra Strength Foam 5%", price: null, cadence: "4–5 months", status: "active" },
    { module: "face_body", category: "Beard Growth", name: "KOI Beauty Adjustable Dermastamp", price: null, cadence: "Replace head every 3 months", status: "active" },
    { module: "face_body", category: "Face Care", name: "CeraVe Foaming Facial Cleanser", price: null, cadence: "4–5 months", status: "active" },
    { module: "face_body", category: "Face Care", name: "CeraVe AM Facial Moisturising Lotion SPF 50", price: null, cadence: "2–3 months", status: "active" },
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
