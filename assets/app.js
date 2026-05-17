/* DomOS v1.1 — static GitHub Pages + Supabase-ready app */
const DATA = window.DOMOS_DATA;

const DomOS = {
  sb: null,
  user: null,
  mode: "local",
  entries: [],
  products: [],
  currentView: "today",
  currentModule: null,
  initDone: false
};

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const todayISO = () => new Date().toISOString().slice(0, 10);
const dateLabel = (date = new Date()) => date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const escapeHtml = (str = "") => String(str).replace(/[&<>'"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[c]));
const uid = () => crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

function getConfig() {
  const cfg = window.DOMOS_SUPABASE || {};
  const configured = cfg.url && cfg.anonKey && !cfg.url.includes("PASTE_") && !cfg.anonKey.includes("PASTE_");
  return { ...cfg, configured };
}

async function init() {
  setupNavigation();
  setupModal();
  setupActions();
  await initSupabase();
  await loadAll();
  renderAll();
  DomOS.initDone = true;
}

async function initSupabase() {
  const cfg = getConfig();
  if (!cfg.configured || !window.supabase) {
    setSyncState("local", "Local mode", "Configure Supabase in settings");
    return;
  }
  try {
    DomOS.sb = window.supabase.createClient(cfg.url, cfg.anonKey);
    const { data } = await DomOS.sb.auth.getSession();
    DomOS.user = data?.session?.user || null;
    DomOS.mode = DomOS.user ? "supabase" : "supabase_guest";
    DomOS.sb.auth.onAuthStateChange(async (_event, session) => {
      DomOS.user = session?.user || null;
      DomOS.mode = DomOS.user ? "supabase" : "supabase_guest";
      await loadAll();
      renderAll();
      updateSyncLabels();
    });
    updateSyncLabels();
  } catch (err) {
    console.error(err);
    setSyncState("error", "Supabase error", "Using local fallback");
  }
}

function updateSyncLabels() {
  if (DomOS.mode === "supabase") setSyncState("online", "Synced", DomOS.user?.email || "Supabase active");
  else if (DomOS.mode === "supabase_guest") setSyncState("local", "Supabase ready", "Sign in to sync");
  else setSyncState("local", "Local mode", "Configure Supabase");
}

function setSyncState(state, label, sub) {
  const dot = $("#syncDot");
  dot.className = "sync-dot" + (state === "online" ? " online" : state === "error" ? " error" : "");
  $("#syncLabel").textContent = label;
  $("#authLabel").textContent = sub;
}

async function loadAll() {
  if (DomOS.mode === "supabase" && DomOS.sb && DomOS.user) {
    const [entriesRes, productsRes] = await Promise.all([
      DomOS.sb.from("entries").select("*").order("entry_date", { ascending: false }).order("created_at", { ascending: false }).limit(1000),
      DomOS.sb.from("products").select("*").order("name", { ascending: true })
    ]);
    if (entriesRes.error) console.warn(entriesRes.error);
    if (productsRes.error) console.warn(productsRes.error);
    DomOS.entries = entriesRes.data || [];
    DomOS.products = productsRes.data || [];
    if (!DomOS.products.length) DomOS.products = seedProductsLocalShape();
  } else {
    DomOS.entries = JSON.parse(localStorage.getItem("domos_entries") || "[]");
    DomOS.products = JSON.parse(localStorage.getItem("domos_products") || "null") || seedProductsLocalShape();
  }
}

function seedProductsLocalShape() {
  return DATA.products.map((p, i) => ({
    id: `seed-${i}`,
    user_id: DomOS.user?.id || null,
    module_key: p.module,
    name: p.name,
    category: p.category,
    status: p.status,
    price: p.price,
    where_to_buy: "",
    estimated_duration_days: cadenceToDays(p.cadence),
    opened_date: null,
    next_reorder_date: null,
    payload: { cadence: p.cadence }
  }));
}

function cadenceToDays(cadence = "") {
  const c = cadence.toLowerCase();
  if (c.includes("8")) return 240;
  if (c.includes("6")) return 180;
  if (c.includes("4–5") || c.includes("4-5")) return 135;
  if (c.includes("3")) return 90;
  if (c.includes("2–3") || c.includes("2-3")) return 75;
  return null;
}

async function saveEntry(moduleKey, entryType, entryDate, payload) {
  const localEntry = {
    id: uid(),
    user_id: DomOS.user?.id || null,
    module_key: moduleKey,
    entry_type: entryType,
    entry_date: entryDate,
    payload,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  if (DomOS.mode === "supabase" && DomOS.sb && DomOS.user) {
    const { error } = await DomOS.sb.from("entries").insert({
      user_id: DomOS.user.id,
      module_key: moduleKey,
      entry_type: entryType,
      entry_date: entryDate,
      payload
    });
    if (error) {
      console.error(error);
      toast("Could not save to Supabase — stored locally instead.");
      DomOS.entries.unshift(localEntry);
      localStorage.setItem("domos_entries", JSON.stringify(DomOS.entries));
    }
  } else {
    DomOS.entries.unshift(localEntry);
    localStorage.setItem("domos_entries", JSON.stringify(DomOS.entries));
  }
  await loadAll();
  renderAll();
  toast("Logged in DomOS");
}

async function saveProduct(product) {
  const payload = { ...product.payload };
  if (DomOS.mode === "supabase" && DomOS.sb && DomOS.user && !String(product.id).startsWith("seed-")) {
    const { error } = await DomOS.sb.from("products").update({
      status: product.status,
      price: product.price,
      where_to_buy: product.where_to_buy,
      estimated_duration_days: product.estimated_duration_days,
      opened_date: product.opened_date,
      next_reorder_date: product.next_reorder_date,
      payload
    }).eq("id", product.id);
    if (error) console.error(error);
  } else if (DomOS.mode === "supabase" && DomOS.sb && DomOS.user && String(product.id).startsWith("seed-")) {
    const { error } = await DomOS.sb.from("products").insert({
      user_id: DomOS.user.id,
      module_key: product.module_key,
      name: product.name,
      category: product.category,
      status: product.status,
      price: product.price,
      where_to_buy: product.where_to_buy,
      estimated_duration_days: product.estimated_duration_days,
      opened_date: product.opened_date,
      next_reorder_date: product.next_reorder_date,
      payload
    });
    if (error) console.error(error);
  } else {
    const idx = DomOS.products.findIndex(p => p.id === product.id);
    if (idx >= 0) DomOS.products[idx] = product;
    localStorage.setItem("domos_products", JSON.stringify(DomOS.products));
  }
  await loadAll();
  renderAll();
  toast("Product updated");
}

function setupNavigation() {
  const navButtons = [...$$(".nav-item"), ...$$(".mobile-nav-item")];
  navButtons.forEach(btn => btn.addEventListener("click", () => navigate(btn.dataset.view)));
}

function navigate(view) {
  DomOS.currentView = view;
  $$(".view").forEach(v => v.classList.toggle("active", v.id === `view-${view}`));
  [...$$(".nav-item"), ...$$(".mobile-nav-item")].forEach(b => b.classList.toggle("active", b.dataset.view === view));
  const titles = {
    today: ["Command centre", "Today"], modules: ["System modules", "Modules"], log: ["Universal logging", "Log"], checkins: ["Weekly control", "Check-ins"], products: ["Stock & reorders", "Products"], data: ["Backup & export", "Data"], settings: ["Configuration", "Settings"]
  };
  $("#pageEyebrow").textContent = titles[view][0];
  $("#pageTitle").textContent = titles[view][1];
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function setupModal() {
  const closeBtn = $("#modalClose");
  const backdrop = $("#modalBackdrop");

  const hardClose = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    closeModal();
  };

  // iOS Safari can occasionally miss normal click events on fixed bottom sheets,
  // so bind pointer/touch/click and expose a global close fallback.
  ["click", "pointerup", "touchend"].forEach(evt => {
    closeBtn.addEventListener(evt, hardClose, { passive: false });
  });

  backdrop.addEventListener("click", e => { if (e.target === backdrop) hardClose(e); });
  backdrop.addEventListener("pointerdown", e => { if (e.target === backdrop) hardClose(e); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !backdrop.hidden) hardClose(e); });
  window.closeDomOSModal = closeModal;
}
function openModal(title, body, eyebrow = "DomOS") {
  $("#modalTitle").textContent = title;
  $("#modalEyebrow").textContent = eyebrow;
  $("#modalBody").innerHTML = body;
  $("#modalBackdrop").hidden = false;
  document.body.classList.add("modal-open");
  requestAnimationFrame(() => $("#modalClose")?.focus?.());
}
function closeModal() {
  $("#modalBackdrop").hidden = true;
  $("#modalBody").innerHTML = "";
  document.body.classList.remove("modal-open");
}
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.hidden = false;
  setTimeout(() => t.hidden = true, 2600);
}

function setupActions() {
  $("#quickLogBtn").addEventListener("click", () => showQuickLog());
  $("#refreshBtn").addEventListener("click", async () => { await loadAll(); renderAll(); toast("DomOS refreshed"); });
}

function renderAll() {
  renderToday();
  renderModules();
  renderLog();
  renderCheckins();
  renderProducts();
  renderData();
  renderSettings();
  updateSyncLabels();
}

function entriesFor(date = todayISO()) { return DomOS.entries.filter(e => e.entry_date === date); }
function latestEntry(moduleKey, entryType) { return DomOS.entries.find(e => e.module_key === moduleKey && (!entryType || e.entry_type === entryType)); }
function entriesThisWeek(moduleKey, entryType) {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  monday.setHours(0,0,0,0);
  return DomOS.entries.filter(e => new Date(`${e.entry_date}T12:00:00`) >= monday && e.module_key === moduleKey && (!entryType || e.entry_type === entryType));
}

function currentFootballStatus() {
  const start = new Date(DATA.football.startDate + "T00:00:00");
  const today = new Date(todayISO() + "T00:00:00");
  const days = Math.floor((today - start) / 86400000);
  const week = Math.max(1, Math.min(12, Math.floor(days / 7) + 1));
  let phase = "Pre-start";
  if (today >= new Date(DATA.football.phase3Start)) phase = "Phase 3";
  else if (today >= new Date(DATA.football.phase2Start)) phase = "Phase 2";
  else if (today >= start) phase = "Phase 1";
  const focus = DATA.football.matchFocus.find(f => f.week === Math.min(week, 7)) || DATA.football.matchFocus[6];
  return { phase, week, focus };
}

function calculateNutrition(phaseKey = DATA.nutrition.activePhase, opts = {}) {
  const cfg = DATA.nutrition.phases[phaseKey];
  const steps = Number(opts.steps || 10000);
  const activities = opts.activities || deriveTodayActivities();
  const activityKcal = activities.reduce((sum, a) => sum + (cfg.activities[a] || 0), 0);
  const stepsKcal = Math.round(((steps - cfg.stepsBase) / 1000) * cfg.stepsBoostPer1k);
  const calories = Math.max(1600, cfg.baseCalories + Math.round(activityKcal * cfg.activityFuelFactor) + stepsKcal);
  const protein = cfg.protein;
  const fat = cfg.fat;
  const carbKcal = Math.max(0, calories - protein * 4 - fat * 9);
  const carbs = Math.round(carbKcal / 4);
  const fibre = Math.round(cfg.fibreBase + activities.length * 1.5);
  const water = activities.length ? cfg.waterTraining : cfg.waterRest;
  return { phaseKey, phase: cfg.name, activities, steps, calories, protein, carbs, fat, fibre, water };
}

function deriveTodayActivities() {
  const todayEntries = entriesFor();
  const acts = new Set();
  todayEntries.forEach(e => {
    if (e.module_key === "phoenix" && e.entry_type === "session_log" && e.payload.completed !== "skipped") {
      if (e.payload.session === "Abs") acts.add("abs"); else acts.add("gym");
    }
    if (e.module_key === "football" && ["session_log", "match_log"].includes(e.entry_type) && e.payload.completed !== "skipped") {
      if (e.payload.session === "D" || e.entry_type === "match_log") acts.add("sevens");
      else if (["B","E"].includes(e.payload.session)) acts.add("football");
    }
  });
  return [...acts];
}

function getWarnings() {
  const warnings = [];
  const today = new Date();
  const day = today.getDay();
  const face = DATA.faceBody.week[day];
  const hair = DATA.hairCare.week[day];
  const latestPhysio = latestEntry("physio", "readiness_log");
  const latestPhoenix = latestEntry("phoenix", "session_log");
  const straightenersThisWeek = entriesThisWeek("hair_styling", "styling_log").filter(e => e.payload.method === "straighteners").length;

  if (face?.type === "stamp" && hair?.label === "Scalp care") {
    warnings.push({ level: "warning", title: "Double needling day", text: "Today has beard dermastamp and scalp dermaroller in the same evening. Monitor irritation or separate them if needed." });
  }
  if (face?.type === "stamp") warnings.push({ level: "warning", title: "Beard dermastamp tonight", text: "No PM minoxidil and no BHA. Disinfect before and after." });
  if (hair?.label === "Repair") warnings.push({ level: "info", title: "K18 repair day", text: "No salt spray for 24 hours after K18. Air-dry preferred." });
  if (hair?.label === "Scalp care") warnings.push({ level: "info", title: "Scalp care day", text: "Nizoral AM, scalp dermaroller PM, no scalp products after rolling." });
  if (latestPhysio?.payload) {
    const p = latestPhysio.payload;
    if (["moderate", "sharp"].includes(p.knee_pain) || ["moderate", "sharp"].includes(p.ankle_pain)) {
      warnings.push({ level: p.knee_pain === "sharp" || p.ankle_pain === "sharp" ? "danger" : "warning", title: "Physio readiness caution", text: p.recommendation || "Modify football and lower-body gym today." });
    }
  }
  if (latestPhoenix?.payload?.hamstring_status === "amber") warnings.push({ level: "warning", title: "Hamstring amber", text: "Remove RDL/Nordics and avoid full-effort sprinting." });
  if (latestPhoenix?.payload?.hamstring_status === "red") warnings.push({ level: "danger", title: "Hamstring red", text: "No eccentric hamstring loading and no football." });
  if (straightenersThisWeek >= 3) warnings.push({ level: "warning", title: "Straightener limit reached", text: "You have used straighteners 3+ times this week. Use diffuser or no-heat styling." });
  return warnings;
}

function renderToday() {
  const football = currentFootballStatus();
  const nutrition = calculateNutrition();
  const day = new Date().getDay();
  const face = DATA.faceBody.week[day];
  const hair = DATA.hairCare.week[day];
  const warnings = getWarnings();
  const todayEntries = entriesFor();
  const phoenixDone = todayEntries.some(e => e.module_key === "phoenix");
  const physioDone = todayEntries.filter(e => e.module_key === "physio").length;
  const careDone = todayEntries.some(e => e.module_key === "face_body");
  const hairDone = todayEntries.some(e => e.module_key === "hair_care");

  $("#view-today").innerHTML = `
    <div class="grid two">
      <div class="card hero-card">
        <div class="eyebrow">${dateLabel()}</div>
        <h2>Command centre</h2>
        <p class="card-sub">One clean view of training, nutrition, recovery and routines.</p>
        <div class="metric-row">
          <span class="chip accent">${football.phase} · Week ${football.week}</span>
          <span class="chip success">Nutrition: ${nutrition.phase}</span>
          <span class="chip ${warnings.some(w => w.level === "danger") ? "danger" : warnings.length ? "warning" : "success"}">${warnings.some(w => w.level === "danger") ? "Red" : warnings.length ? "Amber" : "Green"} readiness</span>
        </div>
      </div>
      <div class="card">
        <div class="card-head"><div><div class="card-title">Today’s activity-derived nutrition</div><div class="card-sub">Auto-detected from today’s DomOS logs. Manual override available in Nutrition.</div></div></div>
        <div class="grid four">
          <div class="metric"><div class="metric-value">${nutrition.calories}</div><div class="metric-label">kcal</div></div>
          <div class="metric"><div class="metric-value">${nutrition.protein}g</div><div class="metric-label">protein</div></div>
          <div class="metric"><div class="metric-value">${nutrition.carbs}g</div><div class="metric-label">carbs</div></div>
          <div class="metric"><div class="metric-value">${nutrition.fat}g</div><div class="metric-label">fat</div></div>
        </div>
        <div class="metric-row"><span class="chip info">Water ${nutrition.water}</span><span class="chip">Fibre ${nutrition.fibre}g+</span><span class="chip">${nutrition.activities.length ? nutrition.activities.join(", ") : "rest / no activity logged"}</span></div>
      </div>
    </div>

    <div class="warning-list">${warnings.length ? warnings.map(w => warningCard(w)).join("") : warningCard({level:"success",title:"No major conflicts",text:"Nothing currently blocks training or routines. Keep logging key sessions."})}</div>

    <div class="grid three">
      ${todayMiniCard("Project Phoenix", phoenixDone ? "Logged today" : "No session logged", "Session-level only. Sets stay in your gym app.", "phoenix")}
      ${todayMiniCard("Football", football.focus.title, football.focus.prompt, "football")}
      ${todayMiniCard("Physio", physioDone ? `${physioDone} log(s) today` : "Due today", "SLR, ankle stretch, wobble board; calf raises on alternate days.", "physio")}
      ${todayMiniCard("Face & Body", face.label, face.warning || `${face.am.length} AM steps · ${face.pm.length} PM steps`, "face_body")}
      ${todayMiniCard("Hair Care", hair.label, hair.items.join(" · "), "hair_care")}
      ${todayMiniCard("Styling", "Recommended: Diffuser", `${entriesThisWeek("hair_styling", "styling_log").filter(e => e.payload.method === "straighteners").length}/3 straightener uses this week`, "hair_styling")}
    </div>
  `;
}

function warningCard(w) {
  return `<div class="card warning-card ${w.level === "danger" ? "danger" : w.level === "success" ? "success" : ""}"><div class="card-title">${escapeHtml(w.title)}</div><div class="card-sub">${escapeHtml(w.text)}</div></div>`;
}

function todayMiniCard(title, status, sub, moduleKey) {
  return `<div class="card"><div class="card-head"><div><div class="card-title">${escapeHtml(title)}</div><div class="card-sub">${escapeHtml(status)}</div></div><span class="chip accent">${escapeHtml(DATA.modules.find(m=>m.key===moduleKey)?.short || moduleKey)}</span></div><p class="card-body">${escapeHtml(sub)}</p><div class="module-actions"><button class="btn ghost" onclick="openModule('${moduleKey}')">Open</button><button class="btn primary" onclick="showModuleLog('${moduleKey}')">Log</button></div></div>`;
}

function renderModules() {
  $("#view-modules").innerHTML = `
    <div class="module-grid">
      ${DATA.modules.map(m => `
        <div class="card module-card">
          <div class="module-icon" style="background:${m.accent}22;color:${m.accent}">${m.icon}</div>
          <div><div class="card-title">${escapeHtml(m.name)}</div><div class="card-sub">${escapeHtml(m.description)}</div></div>
          <div class="module-actions"><button class="btn ghost" onclick="openModule('${m.key}')">Open</button><button class="btn primary" onclick="showModuleLog('${m.key}')">Log</button></div>
        </div>
      `).join("")}
    </div>
    <div id="moduleDetail" class="module-page" style="margin-top:18px"></div>
  `;
  if (DomOS.currentModule) renderModuleDetail(DomOS.currentModule);
}

window.openModule = function(moduleKey) {
  DomOS.currentModule = moduleKey;
  navigate("modules");
  renderModuleDetail(moduleKey);
  setTimeout(() => $("#moduleDetail")?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
};

function renderModuleDetail(moduleKey) {
  const mod = DATA.modules.find(m => m.key === moduleKey);
  if (!mod) return;
  const target = $("#moduleDetail");
  target.innerHTML = `
    <div class="card hero-card">
      <div class="card-head">
        <div><div class="eyebrow">Module</div><h2>${escapeHtml(mod.name)}</h2><p class="card-sub">${escapeHtml(mod.description)}</p></div>
        <span class="chip success">${mod.status}</span>
      </div>
      <div class="module-actions"><button class="btn primary" onclick="showModuleLog('${moduleKey}')">Log ${escapeHtml(mod.short)}</button><button class="btn ghost" onclick="renderModuleDetail('${moduleKey}')">Refresh module</button></div>
    </div>
    ${moduleContent(moduleKey)}
  `;
}

function moduleContent(key) {
  const recent = DomOS.entries.filter(e => e.module_key === key).slice(0, 5);
  if (key === "phoenix") return phoenixContent(recent);
  if (key === "nutrition") return nutritionContent(recent);
  if (key === "football") return footballContent(recent);
  if (key === "physio") return physioContent(recent);
  if (key === "face_body") return faceBodyContent(recent);
  if (key === "hair_care") return hairCareContent(recent);
  if (key === "hair_styling") return stylingContent(recent);
  if (key === "products") return productsContentMini();
  return `<div class="card">No module content.</div>`;
}

function recentList(recent) {
  return `<div class="card"><div class="card-title">Recent logs</div><div class="list" style="margin-top:12px">${recent.length ? recent.map(e => `<div class="list-row"><div class="list-main"><div class="list-title">${escapeHtml(e.entry_type.replaceAll("_"," "))}</div><div class="list-sub">${e.entry_date} · ${escapeHtml(summaryPayload(e.payload))}</div></div></div>`).join("") : `<div class="list-row"><div class="list-sub">No logs yet.</div></div>`}</div></div>`;
}
function summaryPayload(p={}) { return Object.entries(p).slice(0,3).map(([k,v]) => `${k}: ${Array.isArray(v) ? v.join(",") : v}`).join(" · "); }

function phoenixContent(recent) {
  const p = DATA.phoenix;
  return `
    <div class="grid two">
      <div class="card"><div class="card-title">Weekly template</div><div class="list" style="margin-top:12px">${p.defaultWeek.map(s => `<div class="list-row"><div><div class="list-title">${s.day} · ${s.session}</div><div class="list-sub">${s.title} · ${s.minutes} min</div></div></div>`).join("")}</div></div>
      <div class="card"><div class="card-title">Tracking boundary</div><p class="card-sub">DomOS tracks adherence, readiness, modifications and weekly summary only. Detailed sets/reps/weights stay in your gym app.</p><div class="metric-row"><span class="chip accent">No set logging</span><span class="chip info">Session-level</span></div></div>
    </div>
    <div class="grid three">${Object.entries(p.sessions).map(([id,s]) => `<div class="card"><div class="card-title">Session ${id}</div><div class="card-sub">${s.title}</div><p class="card-body" style="margin-top:10px">${s.focus}</p><div class="metric-row"><span class="chip">${s.duration}</span></div></div>`).join("")}</div>
    <div class="card"><div class="card-title">Hamstring traffic light / rules</div><div class="list" style="margin-top:12px">${p.rules.map(r => `<div class="list-row"><div class="list-sub">${escapeHtml(r)}</div></div>`).join("")}</div></div>
    ${recentList(recent)}
  `;
}

function nutritionContent(recent) {
  const n = calculateNutrition();
  const phases = DATA.nutrition.phases;
  return `
    <div class="grid three">${Object.entries(phases).map(([key,p]) => `<div class="card"><div class="card-head"><div><div class="card-title">${p.name}</div><div class="card-sub">End: ${p.end}</div></div><span class="chip ${p.status === "active" ? "success" : p.status === "archived" ? "" : "info"}">${p.status}</span></div><div class="metric-row"><span class="chip">${p.baseCalories} kcal base</span><span class="chip">P ${p.protein}g</span><span class="chip">F ${p.fat}g</span></div></div>`).join("")}</div>
    <div class="card hero-card"><div class="card-title">Current target</div><div class="grid four" style="margin-top:14px"><div class="metric"><div class="metric-value">${n.calories}</div><div class="metric-label">kcal</div></div><div class="metric"><div class="metric-value">${n.protein}g</div><div class="metric-label">protein</div></div><div class="metric"><div class="metric-value">${n.carbs}g</div><div class="metric-label">carbs</div></div><div class="metric"><div class="metric-value">${n.fat}g</div><div class="metric-label">fat</div></div></div><div class="metric-row"><span class="chip info">${n.phase}</span><span class="chip">Water ${n.water}</span><span class="chip">Fibre ${n.fibre}g+</span></div></div>
    ${recentList(recent)}
  `;
}

function footballContent(recent) {
  const f = currentFootballStatus();
  return `
    <div class="grid two"><div class="card hero-card"><div class="card-title">Current football phase</div><div class="metric-row"><span class="chip accent">${f.phase}</span><span class="chip">Week ${f.week}</span></div><h3 style="margin-top:12px">${f.focus.title}</h3><p class="card-sub">${f.focus.prompt}</p></div><div class="card"><div class="card-title">Primary metrics</div><div class="list" style="margin-top:12px"><div class="list-row"><div class="list-title">Session B score</div><span class="chip">trend</span></div><div class="list-row"><div class="list-title">-1 keeper-zone shots</div><span class="chip warning">reduce</span></div><div class="list-row"><div class="list-title">Match focus result</div><span class="chip info">Yes/Mostly/No</span></div></div></div></div>
    <div class="grid four">${DATA.football.sessions.map(s => `<div class="card"><div class="card-title">Session ${s.id}</div><div class="card-sub">${s.title}</div><div class="metric-row"><span class="chip">${s.duration}</span><span class="chip">${s.intensity}</span></div></div>`).join("")}</div>
    <div class="card"><div class="card-title">Hard rules</div><div class="list" style="margin-top:12px">${DATA.football.rules.map(r=>`<div class="list-row"><div class="list-sub">${escapeHtml(r)}</div></div>`).join("")}</div></div>
    ${recentList(recent)}
  `;
}

function physioContent(recent) {
  return `
    <div class="grid four">${DATA.physio.exercises.map(e => `<div class="card"><div class="card-title">${e.name}</div><div class="card-sub">${e.schedule.replaceAll("_"," ")} · ${e.dose}</div><p class="card-body" style="margin-top:10px">${e.purpose}</p></div>`).join("")}</div>
    <div class="card"><div class="card-title">Readiness logic</div><div class="list" style="margin-top:12px"><div class="list-row"><div><div class="list-title">Green</div><div class="list-sub">Train normally.</div></div></div><div class="list-row"><div><div class="list-title">Amber</div><div class="list-sub">Modify lower body and football intensity.</div></div></div><div class="list-row"><div><div class="list-title">Red</div><div class="list-sub">Rehab only / avoid aggravating work.</div></div></div></div></div>
    ${recentList(recent)}
  `;
}

function faceBodyContent(recent) {
  const day = new Date().getDay(); const today = DATA.faceBody.week[day];
  return `
    <div class="card hero-card"><div class="card-title">Today’s care routine</div><h3 style="margin-top:8px">${today.label}</h3>${today.warning ? `<p class="card-sub">${today.warning}</p>` : ""}<div class="grid two" style="margin-top:14px"><div><div class="eyebrow">AM</div><div class="list">${today.am.map(x=>`<div class="list-row"><div class="list-sub">${x}</div></div>`).join("")}</div></div><div><div class="eyebrow">PM</div><div class="list">${today.pm.map(x=>`<div class="list-row"><div class="list-sub">${x}</div></div>`).join("")}</div></div></div></div>
    <div class="card"><div class="card-title">Hard rules</div><div class="list" style="margin-top:12px">${DATA.faceBody.rules.map(r=>`<div class="list-row"><div class="list-sub">${r}</div></div>`).join("")}</div></div>
    ${recentList(recent)}
  `;
}

function hairCareContent(recent) {
  const day = new Date().getDay(); const today = DATA.hairCare.week[day];
  return `
    <div class="card hero-card"><div class="card-title">Today’s hair care</div><h3 style="margin-top:8px">${today.label}</h3><div class="list" style="margin-top:14px">${today.items.map(x=>`<div class="list-row"><div class="list-sub">${x}</div></div>`).join("")}</div></div>
    <div class="grid two"><div class="card"><div class="card-title">Weekly rhythm</div><div class="list" style="margin-top:12px">${Object.entries(DATA.hairCare.week).sort((a,b)=>Number(a[0]||7)-Number(b[0]||7)).map(([d,v])=>`<div class="list-row"><div><div class="list-title">${["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][Number(d)]}</div><div class="list-sub">${v.label}</div></div></div>`).join("")}</div></div><div class="card"><div class="card-title">Hard rules</div><div class="list" style="margin-top:12px">${DATA.hairCare.rules.map(r=>`<div class="list-row"><div class="list-sub">${r}</div></div>`).join("")}</div></div></div>
    ${recentList(recent)}
  `;
}

function stylingContent(recent) {
  const count = entriesThisWeek("hair_styling", "styling_log").filter(e => e.payload.method === "straighteners").length;
  return `
    <div class="grid two">${Object.entries(DATA.styling.methods).map(([key,m])=>`<div class="card"><div class="card-head"><div><div class="card-title">${m.name}</div><div class="card-sub">${m.time} · ${m.damage} damage · ${m.use}</div></div><span class="chip ${key==='straighteners' && count >= 3 ? 'warning' : 'accent'}">${key==='straighteners' ? `${count}/3 this week` : 'default'}</span></div><div class="list" style="margin-top:12px">${m.rules.map(r=>`<div class="list-row"><div class="list-sub">${r}</div></div>`).join("")}</div></div>`).join("")}</div>
    ${recentList(recent)}
  `;
}

function productsContentMini() { return `<div class="card"><div class="card-title">Product stock</div><p class="card-sub">Open the Products page for reorder tracking and updates.</p><button class="btn primary" onclick="navigate('products')">Open Products</button></div>`; }

function renderLog() {
  $("#view-log").innerHTML = `
    <div class="card hero-card"><div class="card-head"><div><div class="eyebrow">Universal log</div><h2>Recent entries</h2><p class="card-sub">All module logs in one place.</p></div><button class="btn primary" onclick="showQuickLog()">Add log</button></div></div>
    <div class="table-wrap" style="margin-top:16px"><table><thead><tr><th>Date</th><th>Module</th><th>Type</th><th>Summary</th></tr></thead><tbody>${DomOS.entries.length ? DomOS.entries.slice(0,80).map(e => `<tr><td>${e.entry_date}</td><td>${moduleName(e.module_key)}</td><td>${e.entry_type.replaceAll("_"," ")}</td><td>${escapeHtml(summaryPayload(e.payload))}</td></tr>`).join("") : `<tr><td colspan="4">No logs yet. Use Quick log to start.</td></tr>`}</tbody></table></div>
  `;
}
function moduleName(key) { return DATA.modules.find(m=>m.key===key)?.short || key; }

function renderCheckins() {
  const weekEntries = DomOS.entries.filter(e => entriesThisWeek(e.module_key).includes(e));
  const counts = DATA.modules.map(m => ({ m, count: entriesThisWeek(m.key).length }));
  $("#view-checkins").innerHTML = `
    <div class="card hero-card"><div class="card-head"><div><div class="eyebrow">Weekly review</div><h2>This week</h2><p class="card-sub">A compact weekly control panel. Create a review entry at the end of the week.</p></div><button class="btn primary" onclick="showWeeklyReview()">Create review</button></div></div>
    <div class="grid four" style="margin-top:16px">${counts.slice(0,8).map(({m,count})=>`<div class="card"><div class="metric"><div class="metric-value">${count}</div><div class="metric-label">${m.short} logs</div></div></div>`).join("")}</div>
    ${recentList(DomOS.entries.filter(e=>e.entry_type==='weekly_review').slice(0,5))}
  `;
}

function renderProducts() {
  const rows = DomOS.products.map(p => {
    const due = p.next_reorder_date ? daysUntil(p.next_reorder_date) : null;
    const dueChip = due === null ? `<span class="chip">not set</span>` : due < 0 ? `<span class="chip danger">overdue</span>` : due <= 21 ? `<span class="chip warning">${due}d</span>` : `<span class="chip success">${due}d</span>`;
    return `<tr><td>${escapeHtml(p.name)}</td><td>${moduleName(p.module_key)}</td><td>${escapeHtml(p.category || "")}</td><td>${p.price ? `£${Number(p.price).toFixed(2)}` : "—"}</td><td>${escapeHtml(p.payload?.cadence || "")}</td><td>${p.opened_date || "—"}</td><td>${p.next_reorder_date || "—"} ${dueChip}</td><td><button class="btn ghost" onclick="showProductUpdate('${p.id}')">Update</button></td></tr>`;
  }).join("");
  $("#view-products").innerHTML = `
    <div class="card hero-card"><div class="card-head"><div><div class="eyebrow">Products</div><h2>Stock & reorders</h2><p class="card-sub">Central product inventory across face/body, hair care and styling.</p></div></div></div>
    <div class="table-wrap" style="margin-top:16px"><table><thead><tr><th>Product</th><th>Module</th><th>Category</th><th>Price</th><th>Cadence</th><th>Opened</th><th>Reorder</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>
  `;
}
function daysUntil(dateStr) { const d = new Date(dateStr + "T00:00:00"); const now = new Date(todayISO() + "T00:00:00"); return Math.ceil((d-now)/86400000); }

function renderData() {
  const backup = { exported_at: new Date().toISOString(), entries: DomOS.entries, products: DomOS.products };
  $("#view-data").innerHTML = `
    <div class="grid two"><div class="card hero-card"><div class="eyebrow">Backup</div><h2>Export DomOS</h2><p class="card-sub">Download your entries and product data as JSON or CSV.</p><div class="module-actions" style="margin-top:16px"><button class="btn primary" onclick="downloadBackup()">Download JSON</button><button class="btn ghost" onclick="downloadEntriesCsv()">Entries CSV</button></div></div><div class="card"><div class="card-title">Current data</div><div class="grid two" style="margin-top:12px"><div class="metric"><div class="metric-value">${DomOS.entries.length}</div><div class="metric-label">entries</div></div><div class="metric"><div class="metric-value">${DomOS.products.length}</div><div class="metric-label">products</div></div></div></div></div>
    <div class="card" style="margin-top:16px"><div class="card-title">Backup preview</div><pre class="code-box">${escapeHtml(JSON.stringify(backup, null, 2).slice(0, 2500))}${JSON.stringify(backup).length > 2500 ? "\n..." : ""}</pre></div>
  `;
}

function renderSettings() {
  const cfg = getConfig();
  $("#view-settings").innerHTML = `
    <div class="grid two">
      <div class="card hero-card"><div class="eyebrow">Supabase</div><h2>${cfg.configured ? "Configured" : "Not configured"}</h2><p class="card-sub">Edit assets/supabase-config.js, then run sql/schema.sql in Supabase.</p><div class="metric-row"><span class="chip ${cfg.configured ? "success" : "warning"}">${cfg.configured ? "Supabase ready" : "Local fallback"}</span><span class="chip">${DomOS.user?.email || "not signed in"}</span></div></div>
      <div class="card"><div class="card-title">Account</div><div id="authBox" style="margin-top:12px">${authBoxHtml()}</div></div>
    </div>
    <div class="card" style="margin-top:16px"><div class="card-title">Local controls</div><p class="card-sub">Use carefully. This only clears local fallback data, not Supabase data.</p><button class="btn danger" style="margin-top:12px" onclick="clearLocalData()">Clear local data</button></div>
  `;
  bindAuthForms();
}

function authBoxHtml() {
  if (DomOS.user) return `<p class="card-sub">Signed in as ${escapeHtml(DomOS.user.email)}</p><button class="btn ghost" onclick="signOut()">Sign out</button>`;
  return `<div class="field"><label>Email</label><input id="authEmail" type="email" placeholder="you@example.com"></div><div class="field"><label>Password</label><input id="authPassword" type="password" placeholder="Password"></div><div class="module-actions"><button class="btn primary" id="signInBtn">Sign in</button><button class="btn ghost" id="signUpBtn">Create account</button></div>`;
}
function bindAuthForms() {
  $("#signInBtn")?.addEventListener("click", async () => authAction("signIn"));
  $("#signUpBtn")?.addEventListener("click", async () => authAction("signUp"));
}
async function authAction(type) {
  if (!DomOS.sb) return toast("Supabase is not configured yet");
  const email = $("#authEmail").value.trim();
  const password = $("#authPassword").value;
  const res = type === "signIn" ? await DomOS.sb.auth.signInWithPassword({ email, password }) : await DomOS.sb.auth.signUp({ email, password });
  if (res.error) toast(res.error.message); else toast(type === "signIn" ? "Signed in" : "Account created — check email if confirmation is enabled");
}
window.signOut = async function() { if (DomOS.sb) await DomOS.sb.auth.signOut(); toast("Signed out"); };
window.clearLocalData = function() { if (confirm("Clear local DomOS data on this device?")) { localStorage.removeItem("domos_entries"); localStorage.removeItem("domos_products"); loadAll().then(renderAll); } };

function showQuickLog() {
  openModal("Quick log", `
    <div class="module-grid">${DATA.modules.filter(m=>m.key!=="products").map(m=>`<button class="card module-card" style="text-align:left" onclick="showModuleLog('${m.key}')"><div class="module-icon" style="background:${m.accent}22;color:${m.accent}">${m.icon}</div><div><div class="card-title">${m.short}</div><div class="card-sub">${m.name}</div></div></button>`).join("")}</div>
  `, "Choose module");
}
window.showModuleLog = function(moduleKey) {
  const title = `Log ${moduleName(moduleKey)}`;
  openModal(title, logFormHtml(moduleKey), "Quick log");
  bindLogForm(moduleKey);
};

function logFormHtml(moduleKey) {
  const dateField = `<div class="field"><label>Date</label><input name="entry_date" type="date" value="${todayISO()}"></div>`;
  if (moduleKey === "phoenix") return `<form id="logForm">${dateField}<div class="form-grid"><div class="field"><label>Session</label><select name="session"><option>A</option><option>B</option><option>C</option><option>Abs</option><option>Rest</option></select></div><div class="field"><label>Status</label><select name="completed"><option value="yes">Completed</option><option value="partial">Partial</option><option value="skipped">Skipped</option></select></div><div class="field"><label>Duration minutes</label><input name="duration_minutes" type="number" min="0"></div><div class="field"><label>Energy 1-5</label><input name="energy" type="number" min="1" max="5"></div><div class="field"><label>Soreness 1-5</label><input name="soreness" type="number" min="1" max="5"></div><div class="field"><label>Hamstring status</label><select name="hamstring_status"><option>green</option><option>amber</option><option>red</option></select></div><div class="field"><label>Knee status</label><select name="knee_status"><option>none</option><option>mild</option><option>moderate</option><option>sharp</option></select></div><div class="field"><label>Ankle status</label><select name="ankle_status"><option>none</option><option>mild</option><option>moderate</option><option>sharp</option></select></div></div><div class="field"><label>Notes</label><textarea name="notes"></textarea></div><button class="btn primary full">Save Phoenix log</button></form>`;
  if (moduleKey === "football") return `<form id="logForm">${dateField}<div class="form-grid"><div class="field"><label>Entry type</label><select name="entry_subtype"><option value="session_log">Session</option><option value="match_log">Match</option></select></div><div class="field"><label>Session</label><select name="session"><option>A</option><option>B</option><option>C</option><option>D</option><option>E</option><option>F</option><option>R</option></select></div><div class="field"><label>Status</label><select name="completed"><option value="yes">Completed</option><option value="partial">Partial</option><option value="skipped">Skipped</option></select></div><div class="field"><label>Session B score</label><input name="total_score" type="number"></div><div class="field"><label>-1 shots</label><input name="minus_ones" type="number"></div><div class="field"><label>Match focus result</label><select name="focus_result"><option></option><option>yes</option><option>mostly</option><option>no</option></select></div><div class="field"><label>Goals</label><input name="goals" type="number"></div><div class="field"><label>Assists</label><input name="assists" type="number"></div></div><div class="field"><label>Notes / went well / improve</label><textarea name="notes"></textarea></div><button class="btn primary full">Save Football log</button></form>`;
  if (moduleKey === "physio") return `<form id="logForm">${dateField}<div class="form-grid"><div class="field"><label>Entry type</label><select name="entry_subtype"><option value="exercise_log">Exercise</option><option value="readiness_log">Daily readiness</option></select></div><div class="field"><label>Exercise</label><select name="exercise_id">${DATA.physio.exercises.map(e=>`<option value="${e.id}">${e.name}</option>`).join("")}</select></div><div class="field"><label>Sets completed</label><input name="sets_completed" type="number" value="3"></div><div class="field"><label>Pain</label><select name="pain"><option>none</option><option>mild</option><option>moderate</option><option>sharp</option></select></div><div class="field"><label>Effort</label><select name="effort"><option>easy</option><option>moderate</option><option>hard</option><option>max</option></select></div><div class="field"><label>Knee pain</label><select name="knee_pain"><option>none</option><option>mild</option><option>moderate</option><option>sharp</option></select></div><div class="field"><label>Ankle pain</label><select name="ankle_pain"><option>none</option><option>mild</option><option>moderate</option><option>sharp</option></select></div></div><div class="field"><label>Recommendation / notes</label><textarea name="notes"></textarea></div><button class="btn primary full">Save Physio log</button></form>`;
  if (moduleKey === "nutrition") return `<form id="logForm">${dateField}<div class="form-grid"><div class="field"><label>Entry type</label><select name="entry_subtype"><option value="daily_target">Daily target</option><option value="adherence_log">Adherence</option></select></div><div class="field"><label>Phase</label><select name="phase"><option value="cut">Deep Cut</option><option value="bulk">Lean Bulk</option><option value="wedding">Wedding Prep</option></select></div><div class="field"><label>Steps</label><input name="steps" type="number" value="10000"></div><div class="field"><label>Calories actual</label><input name="calories_actual" type="number"></div><div class="field"><label>Protein actual</label><input name="protein_actual" type="number"></div><div class="field"><label>Water litres</label><input name="water_actual_litres" type="number" step="0.1"></div></div><div class="field"><label>Activities</label><div class="checkbox-row"><input type="checkbox" name="activities" value="gym"> Gym</div><div class="checkbox-row"><input type="checkbox" name="activities" value="run"> Run</div><div class="checkbox-row"><input type="checkbox" name="activities" value="abs"> Abs</div><div class="checkbox-row"><input type="checkbox" name="activities" value="football"> Football</div><div class="checkbox-row"><input type="checkbox" name="activities" value="sevens"> 5/7-a-side</div></div><div class="field"><label>Notes</label><textarea name="notes"></textarea></div><button class="btn primary full">Save Nutrition log</button></form>`;
  if (moduleKey === "face_body") return `<form id="logForm">${dateField}<div class="form-grid"><div class="field"><label>Routine type</label><select name="routine_type"><option>bha_night</option><option>rest_night</option><option>dermastamp_night</option><option>bha_hibiscrub</option></select></div><div class="field"><label>Status</label><select name="completed"><option>complete</option><option>partial</option><option>skipped</option></select></div><div class="field"><label>Irritation</label><select name="skin_irritation"><option>none</option><option>mild</option><option>moderate</option><option>bad</option></select></div><div class="field"><label>Dryness</label><select name="dryness"><option>none</option><option>mild</option><option>moderate</option><option>bad</option></select></div></div><div class="checkbox-row"><input type="checkbox" name="minoxidil_am"> Minoxidil AM</div><div class="checkbox-row"><input type="checkbox" name="minoxidil_pm"> Minoxidil PM</div><div class="checkbox-row"><input type="checkbox" name="bha_used"> BHA used</div><div class="checkbox-row"><input type="checkbox" name="dermastamp_used"> Dermastamp used</div><div class="field"><label>Notes</label><textarea name="notes"></textarea></div><button class="btn primary full">Save care log</button></form>`;
  if (moduleKey === "hair_care") return `<form id="logForm">${dateField}<div class="form-grid"><div class="field"><label>Scenario</label><select name="scenario"><option>standard</option><option>scalp_care</option><option>repair</option><option>bond</option><option>dermaroller</option></select></div><div class="field"><label>Irritation</label><select name="irritation"><option>none</option><option>mild</option><option>moderate</option><option>bad</option></select></div></div><div class="checkbox-row"><input type="checkbox" name="wash_done"> Wash done</div><div class="checkbox-row"><input type="checkbox" name="conditioner_used"> Conditioner used</div><div class="checkbox-row"><input type="checkbox" name="peptide_serum_used"> Peptide serum used</div><div class="checkbox-row"><input type="checkbox" name="k18_used"> K18 used</div><div class="checkbox-row"><input type="checkbox" name="nizoral_used"> Nizoral used</div><div class="checkbox-row"><input type="checkbox" name="dermaroller_used"> Dermaroller used</div><div class="field"><label>Notes</label><textarea name="notes"></textarea></div><button class="btn primary full">Save hair care log</button></form>`;
  if (moduleKey === "hair_styling") return `<form id="logForm">${dateField}<div class="form-grid"><div class="field"><label>Method</label><select name="method"><option>diffuser</option><option>straighteners</option><option>none</option></select></div><div class="field"><label>Occasion</label><select name="occasion"><option>work</option><option>casual</option><option>going_out</option><option>event</option></select></div><div class="field"><label>Overall result 1-10</label><input name="overall_result" type="number" min="1" max="10"></div><div class="field"><label>Crown control 1-5</label><input name="crown_control" type="number" min="1" max="5"></div><div class="field"><label>Frizz 1-5</label><input name="frizz" type="number" min="1" max="5"></div><div class="field"><label>Clumping 1-5</label><input name="clumping" type="number" min="1" max="5"></div></div><div class="checkbox-row"><input type="checkbox" name="salt_spray_used"> Salt spray</div><div class="checkbox-row"><input type="checkbox" name="heat_protectant_used"> Heat protectant</div><div class="checkbox-row"><input type="checkbox" name="paste_used"> Paste</div><div class="checkbox-row"><input type="checkbox" name="hairspray_used"> Hairspray</div><div class="field"><label>What to change / notes</label><textarea name="notes"></textarea></div><button class="btn primary full">Save styling log</button></form>`;
  return `<p>No form available.</p>`;
}

function bindLogForm(moduleKey) {
  const form = $("#logForm");
  if (!form) return;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const entryDate = fd.get("entry_date") || todayISO();
    const payload = {};
    for (const [k,v] of fd.entries()) {
      if (["entry_date", "entry_subtype"].includes(k)) continue;
      if (k === "activities") continue;
      if (v !== "") payload[k] = coerce(v);
    }
    $$('input[type="checkbox"]', form).forEach(cb => {
      if (cb.name === "activities") return;
      payload[cb.name] = cb.checked;
    });
    const activities = $$('input[name="activities"]', form).filter(cb=>cb.checked).map(cb=>cb.value);
    if (activities.length) payload.activities = activities;
    let entryType = fd.get("entry_subtype") || defaultEntryType(moduleKey);
    if (moduleKey === "nutrition" && entryType === "daily_target") {
      const calc = calculateNutrition(payload.phase || "cut", { steps: payload.steps, activities: payload.activities || [] });
      Object.assign(payload, calc);
    }
    await saveEntry(moduleKey, entryType, entryDate, payload);
    closeModal();
  });
}
function coerce(v) { if (v === "true") return true; if (v === "false") return false; if (v !== "" && !Number.isNaN(Number(v))) return Number(v); return v; }
function defaultEntryType(moduleKey) { return ({ phoenix:"session_log", football:"session_log", physio:"exercise_log", nutrition:"daily_target", face_body:"routine_log", hair_care:"routine_log", hair_styling:"styling_log" })[moduleKey] || "log"; }

window.showWeeklyReview = function() {
  openModal("Create weekly review", `<form id="weeklyReviewForm"><div class="field"><label>Week start</label><input name="entry_date" type="date" value="${todayISO()}"></div><div class="field"><label>Overall status</label><select name="overall"><option>hold_plan</option><option>adjust_needed</option><option>deload_or_recover</option></select></div><div class="field"><label>Review notes</label><textarea name="notes" placeholder="What improved, what slipped, what needs changing?"></textarea></div><button class="btn primary full">Save weekly review</button></form>`, "Check-in");
  $("#weeklyReviewForm").addEventListener("submit", async e => { e.preventDefault(); const fd = new FormData(e.target); await saveEntry("checkins", "weekly_review", fd.get("entry_date"), { overall: fd.get("overall"), notes: fd.get("notes"), module_counts: Object.fromEntries(DATA.modules.map(m => [m.key, entriesThisWeek(m.key).length])) }); closeModal(); });
};

window.showProductUpdate = function(id) {
  const p = DomOS.products.find(x => String(x.id) === String(id));
  if (!p) return;
  const opened = p.opened_date || todayISO();
  openModal("Update product", `<form id="productForm"><div class="field"><label>Product</label><input value="${escapeHtml(p.name)}" disabled></div><div class="form-grid"><div class="field"><label>Opened date</label><input name="opened_date" type="date" value="${opened}"></div><div class="field"><label>Duration days</label><input name="estimated_duration_days" type="number" value="${p.estimated_duration_days || ""}"></div><div class="field"><label>Price</label><input name="price" type="number" step="0.01" value="${p.price || ""}"></div><div class="field"><label>Status</label><select name="status"><option ${p.status==='active'?'selected':''}>active</option><option ${p.status==='standby'?'selected':''}>standby</option><option ${p.status==='stopped'?'selected':''}>stopped</option></select></div></div><div class="field"><label>Where to buy</label><input name="where_to_buy" value="${escapeHtml(p.where_to_buy || "")}"></div><button class="btn primary full">Save product</button></form>`, "Products");
  $("#productForm").addEventListener("submit", async e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const duration = Number(fd.get("estimated_duration_days")) || null;
    const openedDate = fd.get("opened_date") || null;
    const next = openedDate && duration ? addDays(openedDate, duration) : null;
    await saveProduct({ ...p, opened_date: openedDate, estimated_duration_days: duration, next_reorder_date: next, price: fd.get("price") ? Number(fd.get("price")) : null, status: fd.get("status"), where_to_buy: fd.get("where_to_buy") });
    if (openedDate) await saveEntry("products", "product_update", todayISO(), { product_name: p.name, event: "opened_or_updated", opened_date: openedDate, next_reorder_date: next });
    closeModal();
  });
};
function addDays(dateStr, days) { const d = new Date(dateStr + "T00:00:00"); d.setDate(d.getDate()+days); return d.toISOString().slice(0,10); }

window.downloadBackup = function() {
  downloadFile(`domos-backup-${todayISO()}.json`, JSON.stringify({ exported_at: new Date().toISOString(), entries: DomOS.entries, products: DomOS.products }, null, 2), "application/json");
};
window.downloadEntriesCsv = function() {
  const rows = [["date","module","type","payload"]].concat(DomOS.entries.map(e => [e.entry_date, e.module_key, e.entry_type, JSON.stringify(e.payload).replaceAll('"','""')]));
  downloadFile(`domos-entries-${todayISO()}.csv`, rows.map(r=>r.map(c=>`"${String(c).replaceAll('"','""')}"`).join(",")).join("\n"), "text/csv");
};
function downloadFile(name, content, type) { const blob = new Blob([content], { type }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url); }

window.navigate = navigate;
window.showQuickLog = showQuickLog;

init().catch(err => { console.error(err); toast("DomOS failed to initialise — check console"); });
