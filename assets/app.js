/* DomOS v1.2 — weekly planner + richer modules + robust saves */
const DATA = window.DOMOS_DATA;

const DomOS = {
  sb: null,
  user: null,
  mode: "local",
  entries: [],
  products: [],
  currentView: "today",
  currentModule: null,
  selectedWeekDate: new Date().toISOString().slice(0,10),
  selectedPlanDate: new Date().toISOString().slice(0,10),
  nutritionOverride: null
};

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const todayISO = () => new Date().toISOString().slice(0, 10);
const uid = () => crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const escapeHtml = (str = "") => String(str).replace(/[&<>'"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[c]));
const dateObj = (iso) => new Date(`${iso}T12:00:00`);
const niceDate = (iso) => dateObj(iso).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const shortDate = (iso) => dateObj(iso).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
const dayIndex = (iso = todayISO()) => dateObj(iso).getDay();

function getConfig() {
  const cfg = window.DOMOS_SUPABASE || {};
  const configured = !!(cfg.url && cfg.anonKey && !cfg.url.includes("PASTE_") && !cfg.anonKey.includes("PASTE_") && cfg.url.startsWith("https://"));
  return { ...cfg, configured };
}

async function init() {
  forceCloseModal();
  setupNavigation();
  setupModal();
  setupActions();
  await initSupabase();
  await loadAll();
  renderAll();
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
  if (!dot) return;
  dot.className = "sync-dot" + (state === "online" ? " online" : state === "error" ? " error" : "");
  $("#syncLabel").textContent = label;
  $("#authLabel").textContent = sub;
}

async function loadAll() {
  if (DomOS.mode === "supabase" && DomOS.sb && DomOS.user) {
    try {
      const [entriesRes, productsRes] = await Promise.all([
        DomOS.sb.from("entries").select("*").order("entry_date", { ascending: false }).order("created_at", { ascending: false }).limit(2000),
        DomOS.sb.from("products").select("*").order("name", { ascending: true })
      ]);
      if (entriesRes.error) throw entriesRes.error;
      DomOS.entries = entriesRes.data || [];
      if (productsRes.error) throw productsRes.error;
      DomOS.products = productsRes.data || [];
      if (!DomOS.products.length) DomOS.products = seedProductsLocalShape();
    } catch (err) {
      console.error(err);
      toast("Supabase load failed — showing local fallback");
      DomOS.entries = JSON.parse(localStorage.getItem("domos_entries") || "[]");
      DomOS.products = JSON.parse(localStorage.getItem("domos_products") || "null") || seedProductsLocalShape();
    }
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
  const c = String(cadence).toLowerCase();
  if (c.includes("8")) return 240;
  if (c.includes("6")) return 180;
  if (c.includes("4–5") || c.includes("4-5")) return 135;
  if (c.includes("3")) return 90;
  if (c.includes("2–3") || c.includes("2-3")) return 75;
  return null;
}

async function saveEntry(moduleKey, entryType, entryDate, payload) {
  const localEntry = {
    id: uid(), user_id: DomOS.user?.id || null, module_key: moduleKey, entry_type: entryType,
    entry_date: entryDate, payload, created_at: new Date().toISOString(), updated_at: new Date().toISOString()
  };
  try {
    if (DomOS.mode === "supabase" && DomOS.sb && DomOS.user) {
      const { error } = await DomOS.sb.from("entries").insert({
        user_id: DomOS.user.id, module_key: moduleKey, entry_type: entryType, entry_date: entryDate, payload
      });
      if (error) throw error;
    } else {
      DomOS.entries.unshift(localEntry);
      localStorage.setItem("domos_entries", JSON.stringify(DomOS.entries));
    }
    await loadAll();
    renderAll();
    toast("Saved");
    return true;
  } catch (err) {
    console.error(err);
    DomOS.entries.unshift(localEntry);
    localStorage.setItem("domos_entries", JSON.stringify(DomOS.entries));
    await loadAll();
    renderAll();
    toast("Save failed in Supabase — stored locally");
    return false;
  }
}

async function upsertPlannerDay(entryDate, payload) {
  const existing = DomOS.entries.find(e => e.module_key === "planner" && e.entry_type === "day_plan" && e.entry_date === entryDate);
  const localEntry = existing ? { ...existing, payload, updated_at: new Date().toISOString() } : {
    id: uid(), user_id: DomOS.user?.id || null, module_key: "planner", entry_type: "day_plan", entry_date: entryDate,
    payload, created_at: new Date().toISOString(), updated_at: new Date().toISOString()
  };
  try {
    if (DomOS.mode === "supabase" && DomOS.sb && DomOS.user) {
      if (existing && !String(existing.id).startsWith("local-")) {
        const { error } = await DomOS.sb.from("entries").update({ payload, updated_at: new Date().toISOString() }).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await DomOS.sb.from("entries").insert({ user_id: DomOS.user.id, module_key: "planner", entry_type: "day_plan", entry_date: entryDate, payload });
        if (error) throw error;
      }
    } else {
      const idx = DomOS.entries.findIndex(e => e.id === existing?.id);
      if (idx >= 0) DomOS.entries[idx] = localEntry; else DomOS.entries.unshift(localEntry);
      localStorage.setItem("domos_entries", JSON.stringify(DomOS.entries));
    }
    await loadAll();
    renderAll();
    toast("Day plan saved");
    return true;
  } catch (err) {
    console.error(err);
    const idx = DomOS.entries.findIndex(e => e.id === existing?.id);
    if (idx >= 0) DomOS.entries[idx] = localEntry; else DomOS.entries.unshift(localEntry);
    localStorage.setItem("domos_entries", JSON.stringify(DomOS.entries));
    await loadAll();
    renderAll();
    toast("Planner save failed in Supabase — stored locally");
    return false;
  }
}

async function saveProduct(product) {
  const payload = { ...(product.payload || {}) };
  try {
    if (DomOS.mode === "supabase" && DomOS.sb && DomOS.user && !String(product.id).startsWith("seed-")) {
      const { error } = await DomOS.sb.from("products").update({
        status: product.status, price: product.price, where_to_buy: product.where_to_buy,
        estimated_duration_days: product.estimated_duration_days, opened_date: product.opened_date,
        next_reorder_date: product.next_reorder_date, payload
      }).eq("id", product.id);
      if (error) throw error;
    } else if (DomOS.mode === "supabase" && DomOS.sb && DomOS.user && String(product.id).startsWith("seed-")) {
      const { error } = await DomOS.sb.from("products").insert({
        user_id: DomOS.user.id, module_key: product.module_key, name: product.name, category: product.category,
        status: product.status, price: product.price, where_to_buy: product.where_to_buy,
        estimated_duration_days: product.estimated_duration_days, opened_date: product.opened_date,
        next_reorder_date: product.next_reorder_date, payload
      });
      if (error) throw error;
    } else {
      const idx = DomOS.products.findIndex(p => String(p.id) === String(product.id));
      if (idx >= 0) DomOS.products[idx] = product; else DomOS.products.push(product);
      localStorage.setItem("domos_products", JSON.stringify(DomOS.products));
    }
    await loadAll();
    renderAll();
    toast("Product updated");
    return true;
  } catch (err) {
    console.error(err);
    const idx = DomOS.products.findIndex(p => String(p.id) === String(product.id));
    if (idx >= 0) DomOS.products[idx] = product; else DomOS.products.push(product);
    localStorage.setItem("domos_products", JSON.stringify(DomOS.products));
    await loadAll();
    renderAll();
    toast("Product save failed in Supabase — stored locally");
    return false;
  }
}

function setupNavigation() {
  [...$$(".nav-item"), ...$$(".mobile-nav-item")].forEach(btn => btn.addEventListener("click", () => navigate(btn.dataset.view)));
}
function navigate(view) {
  DomOS.currentView = view;
  $$(".view").forEach(v => v.classList.toggle("active", v.id === `view-${view}`));
  [...$$(".nav-item"), ...$$(".mobile-nav-item")].forEach(b => b.classList.toggle("active", b.dataset.view === view));
  const titles = {
    today: ["Command centre", "Today"], week: ["Planner", "Week"], modules: ["System modules", "Modules"],
    log: ["Universal logging", "Log"], checkins: ["Weekly control", "Check-ins"], products: ["Stock & reorders", "Products"],
    data: ["Backup & export", "Data"], settings: ["Configuration", "Settings"]
  };
  $("#pageEyebrow").textContent = titles[view]?.[0] || "DomOS";
  $("#pageTitle").textContent = titles[view]?.[1] || view;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function forceCloseModal() {
  const backdrop = $("#modalBackdrop");
  if (!backdrop) return;
  backdrop.classList.remove("is-open");
  backdrop.setAttribute("aria-hidden", "true");
  backdrop.hidden = true;
  backdrop.style.display = "none";
  const body = $("#modalBody");
  if (body) body.innerHTML = "";
  document.body.classList.remove("modal-open");
}
function setupModal() {
  const closeBtn = $("#modalClose");
  const backdrop = $("#modalBackdrop");
  forceCloseModal();
  const hardClose = (e) => { if (e) { e.preventDefault(); e.stopPropagation(); } closeModal(); };
  ["click", "pointerup", "touchend"].forEach(evt => closeBtn?.addEventListener(evt, hardClose, { passive: false }));
  backdrop?.addEventListener("click", e => { if (e.target === backdrop) hardClose(e); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !backdrop.hidden) hardClose(e); });
  document.addEventListener("click", e => {
    const submitBtn = e.target.closest?.("[data-submit-form]");
    if (submitBtn) {
      e.preventDefault();
      submitBtn.closest("form")?.requestSubmit();
    }
  });
  window.closeDomOSModal = closeModal;
}
function openModal(title, body, eyebrow = "DomOS") {
  const backdrop = $("#modalBackdrop");
  $("#modalTitle").textContent = title;
  $("#modalEyebrow").textContent = eyebrow;
  $("#modalBody").innerHTML = body;
  backdrop.hidden = false;
  backdrop.removeAttribute("aria-hidden");
  backdrop.classList.add("is-open");
  backdrop.style.display = "flex";
  document.body.classList.add("modal-open");
}
function closeModal() { forceCloseModal(); }
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.hidden = false;
  setTimeout(() => t.hidden = true, 3000);
}
function setupActions() {
  $("#quickLogBtn")?.addEventListener("click", () => showQuickLog());
  $("#refreshBtn")?.addEventListener("click", async () => { await loadAll(); renderAll(); toast("DomOS refreshed"); });
  document.addEventListener("change", e => {
    const tileInput = e.target.closest?.(".activity-tile input");
    if (tileInput) tileInput.closest(".activity-tile")?.classList.toggle("checked", tileInput.checked);
  });
}

function renderAll() {
  renderToday();
  renderWeek();
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
  const { start } = weekBounds(todayISO());
  return DomOS.entries.filter(e => e.entry_date >= start && e.module_key === moduleKey && (!entryType || e.entry_type === entryType));
}
function weekBounds(iso) {
  const d = dateObj(iso);
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { start: monday.toISOString().slice(0,10), end: sunday.toISOString().slice(0,10) };
}
function weekDays(iso) {
  const { start } = weekBounds(iso);
  const days = [];
  const d = dateObj(start);
  for (let i=0;i<7;i++) {
    const x = new Date(d);
    x.setDate(d.getDate()+i);
    days.push(x.toISOString().slice(0,10));
  }
  return days;
}
function planFor(date = todayISO()) {
  return DomOS.entries.find(e => e.module_key === "planner" && e.entry_type === "day_plan" && e.entry_date === date)?.payload || { activities: [], notes: "", phoenix_session: "", football_session: "" };
}
function currentFootballStatus() {
  const start = new Date(DATA.football.startDate + "T00:00:00");
  const t = new Date(todayISO() + "T00:00:00");
  const days = Math.floor((t - start) / 86400000);
  const week = Math.max(1, Math.min(12, Math.floor(days / 7) + 1));
  let phase = "Pre-start";
  if (t >= new Date(DATA.football.phase3Start)) phase = "Phase 3";
  else if (t >= new Date(DATA.football.phase2Start)) phase = "Phase 2";
  else if (t >= start) phase = "Phase 1";
  const focus = DATA.football.matchFocus.find(f => f.week === Math.min(week, 7)) || DATA.football.matchFocus[6];
  return { phase, week, focus };
}
function activityLabels(keys = []) { return keys.map(k => DATA.plannerActivities.find(a => a.key === k)?.label || k); }
function nutritionActivityKeys(plannerKeys = []) {
  const set = new Set();
  plannerKeys.forEach(k => { const n = DATA.plannerActivities.find(a => a.key === k)?.nutrition; if (n) set.add(n); });
  return [...set];
}
function deriveTodayActivities() {
  const planned = nutritionActivityKeys(planFor(todayISO()).activities || []);
  const acts = new Set(planned);
  entriesFor().forEach(e => {
    if (e.module_key === "phoenix" && e.entry_type === "session_log" && e.payload.completed !== "skipped") {
      if (e.payload.session === "Abs") acts.add("abs"); else acts.add("gym");
    }
    if (e.module_key === "football" && ["session_log", "match_log"].includes(e.entry_type) && e.payload.completed !== "skipped") {
      if (e.payload.session === "D" || e.entry_type === "match_log") acts.add("sevens");
      else acts.add("football");
    }
  });
  return [...acts];
}
function calculateNutrition(phaseKey = DATA.nutrition.activePhase, opts = {}) {
  const cfg = DATA.nutrition.phases[phaseKey] || DATA.nutrition.phases.cut;
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
function getWarnings() {
  const warnings = [];
  const face = DATA.faceBody.week[dayIndex()];
  const hair = DATA.hairCare.week[dayIndex()];
  const latestPhysio = latestEntry("physio", "readiness_log");
  const latestPhoenix = latestEntry("phoenix", "session_log");
  const plan = planFor(todayISO());
  if (face?.type === "stamp" && hair?.label === "Scalp care") warnings.push({ level: "warning", title: "Double needling day", text: "Today has beard dermastamp and scalp dermaroller. Separate if irritation risk is high." });
  if (face?.type === "stamp") warnings.push({ level: "warning", title: "Beard dermastamp tonight", text: "No PM minoxidil and no BHA. Disinfect before and after." });
  if (hair?.label === "Repair") warnings.push({ level: "info", title: "K18 repair day", text: "No salt spray for 24 hours after K18. Air-dry preferred." });
  if (hair?.label === "Scalp care") warnings.push({ level: "info", title: "Scalp care day", text: "Nizoral AM, scalp dermaroller PM, no scalp products after rolling." });
  if ((plan.activities || []).includes("match11") && (plan.activities || []).includes("gym")) warnings.push({ level: "warning", title: "Gym + 11-a-side same day", text: "Treat this as high load. Keep lower-body work conservative if football is priority." });
  if (latestPhysio?.payload) {
    const p = latestPhysio.payload;
    if (["moderate", "sharp"].includes(p.knee_pain) || ["moderate", "sharp"].includes(p.ankle_pain)) warnings.push({ level: (p.knee_pain === "sharp" || p.ankle_pain === "sharp") ? "danger" : "warning", title: "Physio readiness caution", text: p.recommendation || "Modify football and lower-body gym today." });
  }
  if (latestPhoenix?.payload?.hamstring_status === "amber") warnings.push({ level: "warning", title: "Hamstring amber", text: "Remove RDL/Nordics and avoid full-effort sprinting." });
  if (latestPhoenix?.payload?.hamstring_status === "red") warnings.push({ level: "danger", title: "Hamstring red", text: "No eccentric hamstring loading and no football." });
  return warnings;
}

function renderToday() {
  const date = todayISO();
  const plan = planFor(date);
  const planned = plan.activities || [];
  const nutrition = calculateNutrition(DATA.nutrition.activePhase, { activities: nutritionActivityKeys(planned) });
  const football = currentFootballStatus();
  const face = DATA.faceBody.week[dayIndex(date)];
  const hair = DATA.hairCare.week[dayIndex(date)];
  const warnings = getWarnings();
  const plannedLabels = activityLabels(planned);
  $("#view-today").innerHTML = `
    <div class="grid two">
      <div class="card hero-card">
        <div class="eyebrow">${niceDate(date)}</div>
        <h2>Today</h2>
        <p class="card-sub">Specific plan for the day. Plan the week from the Week page; today automatically follows it.</p>
        <div class="metric-row">
          ${(plannedLabels.length ? plannedLabels : ["No planned activity"]).map(x => `<span class="chip accent">${escapeHtml(x)}</span>`).join("")}
        </div>
      </div>
      <div class="card">
        <div class="card-title">Nutrition from today’s plan</div>
        <p class="card-sub">Uses the Week page activity ticks. You can also override inside Nutrition.</p>
        <div class="grid four" style="margin-top:14px">
          <div class="metric"><div class="metric-value">${nutrition.calories}</div><div class="metric-label">kcal</div></div>
          <div class="metric"><div class="metric-value">${nutrition.protein}g</div><div class="metric-label">protein</div></div>
          <div class="metric"><div class="metric-value">${nutrition.carbs}g</div><div class="metric-label">carbs</div></div>
          <div class="metric"><div class="metric-value">${nutrition.fat}g</div><div class="metric-label">fat</div></div>
        </div>
        <div class="metric-row"><span class="chip info">Water ${nutrition.water}</span><span class="chip">Fibre ${nutrition.fibre}g+</span></div>
      </div>
    </div>
    <div class="warning-list">${warnings.length ? warnings.map(w => warningCard(w)).join("") : warningCard({level:"success",title:"No major conflicts",text:"No obvious clashes from today’s plan or routines."})}</div>
    <div class="grid three">
      ${dayPlanCard("Training", plannedLabels.length ? plannedLabels.join(" · ") : "Nothing planned", plan.phoenix_session ? `Phoenix: Session ${plan.phoenix_session}` : "Set gym/run/football from Week page", "week")}
      ${dayPlanCard("Football", football.focus.title, football.focus.prompt, "football")}
      ${dayPlanCard("Physio", "Due today", "SLR, ankle stretch, wobble board; calf raises alternate days.", "physio")}
      ${dayPlanCard("Face & Body", face.label, face.warning || `${face.am.length} AM steps · ${face.pm.length} PM steps`, "face_body")}
      ${dayPlanCard("Hair Care", hair.label, hair.items.join(" · "), "hair_care")}
      ${dayPlanCard("Notes", plan.notes || "No notes for today", "Add notes from the Week planner.", "week")}
    </div>
  `;
}
function warningCard(w) { return `<div class="card warning-card ${w.level === "danger" ? "danger" : w.level === "success" ? "success" : w.level === "info" ? "info" : ""}"><div class="card-title">${escapeHtml(w.title)}</div><div class="card-sub">${escapeHtml(w.text)}</div></div>`; }
function dayPlanCard(title, status, sub, target) {
  const btn = target === "week" ? `<button class="btn ghost" onclick="navigate('week')">Open Week</button>` : `<button class="btn ghost" onclick="openModule('${target}')">Open</button>`;
  return `<div class="card"><div class="card-head"><div><div class="card-title">${escapeHtml(title)}</div><div class="card-sub">${escapeHtml(status)}</div></div></div><p class="card-body">${escapeHtml(sub)}</p><div class="module-actions">${btn}</div></div>`;
}

function renderWeek() {
  const days = weekDays(DomOS.selectedWeekDate);
  const selected = DomOS.selectedPlanDate || todayISO();
  const p = planFor(selected);
  $("#view-week").innerHTML = `
    <div class="card hero-card">
      <div class="card-head"><div><div class="eyebrow">Weekly planner</div><h2>${shortDate(days[0])} → ${shortDate(days[6])}</h2><p class="card-sub">Tick planned activities here. The selected day feeds Today and Nutrition.</p></div><button class="btn ghost" onclick="jumpToThisWeek()">This week</button></div>
      <div class="week-strip">${days.map(d => dayButton(d, d === selected)).join("")}</div>
    </div>
    <div class="grid two">
      <div class="card">
        <div class="card-title">Plan ${shortDate(selected)}</div>
        <form id="dayPlanForm" class="planner-form">
          <input type="hidden" name="entry_date" value="${selected}">
          <div class="activity-grid">
            ${DATA.plannerActivities.map(a => `<label class="activity-tile ${p.activities?.includes(a.key) ? "checked" : ""}"><input type="checkbox" name="activities" value="${a.key}" ${p.activities?.includes(a.key) ? "checked" : ""}><span>${escapeHtml(a.label)}</span><small>${escapeHtml(a.detail)}</small></label>`).join("")}
          </div>
          <div class="form-grid" style="margin-top:14px">
            <div class="field"><label>Phoenix session</label><select name="phoenix_session"><option value="">None / not decided</option>${["A","B","C","Abs"].map(x=>`<option value="${x}" ${p.phoenix_session===x?"selected":""}>${x}</option>`).join("")}</select></div>
            <div class="field"><label>Football session</label><select name="football_session"><option value="">None / not decided</option>${["A","B","C","D","E","F","R"].map(x=>`<option value="${x}" ${p.football_session===x?"selected":""}>${x}</option>`).join("")}</select></div>
          </div>
          <div class="field"><label>Notes</label><textarea name="notes" placeholder="Shift, match time, timing constraints, anything useful...">${escapeHtml(p.notes || "")}</textarea></div>
          <button type="button" data-submit-form class="btn primary full">Save day plan</button>
        </form>
      </div>
      <div class="card">
        <div class="card-title">Nutrition preview</div>
        ${nutritionPreviewHtml(calculateNutrition(DATA.nutrition.activePhase, { activities: nutritionActivityKeys(p.activities || []) }))}
        <div class="card-title" style="margin-top:18px">Day routine</div>
        <div class="list" style="margin-top:10px">
          <div class="list-row"><div><div class="list-title">Face & Body</div><div class="list-sub">${escapeHtml(DATA.faceBody.week[dayIndex(selected)].label)}</div></div></div>
          <div class="list-row"><div><div class="list-title">Hair Care</div><div class="list-sub">${escapeHtml(DATA.hairCare.week[dayIndex(selected)].label)}</div></div></div>
        </div>
      </div>
    </div>
  `;
  $("#dayPlanForm")?.addEventListener("submit", async e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const activities = $$('input[name="activities"]', e.target).filter(cb=>cb.checked).map(cb=>cb.value);
    const payload = { activities, phoenix_session: fd.get("phoenix_session"), football_session: fd.get("football_session"), notes: fd.get("notes") || "" };
    await upsertPlannerDay(fd.get("entry_date"), payload);
  });
  $$(".activity-tile input").forEach(cb => cb.addEventListener("change", () => cb.closest(".activity-tile").classList.toggle("checked", cb.checked)));
}
function dayButton(date, active) {
  const p = planFor(date);
  const count = p.activities?.length || 0;
  return `<button class="day-chip ${active ? "active" : ""}" onclick="selectPlanDay('${date}')"><strong>${dateObj(date).toLocaleDateString("en-GB", { weekday:"short" })}</strong><span>${dateObj(date).getDate()}</span><small>${count ? `${count} planned` : "—"}</small></button>`;
}
window.selectPlanDay = function(date) { DomOS.selectedPlanDate = date; DomOS.selectedWeekDate = date; renderWeek(); };
window.jumpToThisWeek = function() { DomOS.selectedWeekDate = todayISO(); DomOS.selectedPlanDate = todayISO(); renderWeek(); };
function nutritionPreviewHtml(n) {
  return `<div class="grid four" style="margin-top:14px"><div class="metric"><div class="metric-value">${n.calories}</div><div class="metric-label">kcal</div></div><div class="metric"><div class="metric-value">${n.protein}g</div><div class="metric-label">protein</div></div><div class="metric"><div class="metric-value">${n.carbs}g</div><div class="metric-label">carbs</div></div><div class="metric"><div class="metric-value">${n.fat}g</div><div class="metric-label">fat</div></div></div><div class="metric-row"><span class="chip info">${n.phase}</span><span class="chip">${n.activities.length ? n.activities.join(", ") : "rest"}</span><span class="chip">${n.water}</span></div>`;
}

function renderModules() {
  $("#view-modules").innerHTML = `<div class="module-grid">${DATA.modules.map(m => `<div class="card module-card"><div class="module-icon" style="background:${m.accent}22;color:${m.accent}">${m.icon}</div><div><div class="card-title">${escapeHtml(m.name)}</div><div class="card-sub">${escapeHtml(m.description)}</div></div><div class="module-actions"><button class="btn ghost" onclick="openModule('${m.key}')">Open</button>${m.canLog ? `<button class="btn primary" onclick="showModuleLog('${m.key}')">Log</button>` : ""}</div></div>`).join("")}</div><div id="moduleDetail" class="module-page" style="margin-top:18px"></div>`;
  if (DomOS.currentModule) renderModuleDetail(DomOS.currentModule);
}
window.openModule = function(moduleKey) { DomOS.currentModule = moduleKey; navigate("modules"); renderModuleDetail(moduleKey); setTimeout(() => $("#moduleDetail")?.scrollIntoView({ behavior:"smooth", block:"start" }), 80); };
function renderModuleDetail(moduleKey) {
  const mod = DATA.modules.find(m => m.key === moduleKey);
  if (!mod) return;
  $("#moduleDetail").innerHTML = `<div class="card hero-card"><div class="card-head"><div><div class="eyebrow">Module</div><h2>${escapeHtml(mod.name)}</h2><p class="card-sub">${escapeHtml(mod.description)}</p></div><span class="chip ${mod.status === "active" ? "success" : "info"}">${mod.status}</span></div><div class="module-actions">${mod.canLog ? `<button class="btn primary" onclick="showModuleLog('${moduleKey}')">Log ${escapeHtml(mod.short)}</button>` : ""}<button class="btn ghost" onclick="renderModuleDetail('${moduleKey}')">Refresh module</button></div></div>${moduleContent(moduleKey)}`;
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
function recentList(recent) { return `<div class="card"><div class="card-title">Recent logs</div><div class="list" style="margin-top:12px">${recent.length ? recent.map(e => `<div class="list-row"><div class="list-main"><div class="list-title">${escapeHtml(e.entry_type.replaceAll("_"," "))}</div><div class="list-sub">${e.entry_date} · ${escapeHtml(summaryPayload(e.payload))}</div></div></div>`).join("") : `<div class="list-row"><div class="list-sub">No logs yet.</div></div>`}</div></div>`; }
function summaryPayload(p={}) { return Object.entries(p).slice(0,4).map(([k,v]) => `${k}: ${Array.isArray(v) ? v.join(",") : v}`).join(" · "); }

function phoenixContent(recent) {
  const p = DATA.phoenix;
  return `<div class="grid two"><div class="card"><div class="card-title">Weekly template</div><div class="list" style="margin-top:12px">${p.defaultWeek.map(s => `<div class="list-row"><div><div class="list-title">${s.day} · ${s.session}</div><div class="list-sub">${s.title} · ${s.minutes} min</div></div></div>`).join("")}</div></div><div class="card"><div class="card-title">Tracking boundary</div><p class="card-sub">DomOS tracks adherence, readiness, modifications and weekly summary only. Detailed sets/reps/weights stay in your gym app.</p><div class="metric-row"><span class="chip accent">No set logging</span><span class="chip info">Session-level</span></div></div></div><div class="detail-section">${Object.entries(p.sessions).map(([id,s]) => sessionDetails(`Phoenix Session ${id}`, s.title, s.duration, s.focus, s.exercises)).join("")}</div><div class="card"><div class="card-title">Rules</div><div class="list" style="margin-top:12px">${p.rules.map(r=>`<div class="list-row"><div class="list-sub">${escapeHtml(r)}</div></div>`).join("")}</div></div>${recentList(recent)}`;
}
function sessionDetails(label, title, duration, focus, items=[]) {
  return `<details class="detail-card"><summary><span><strong>${escapeHtml(label)}</strong><small>${escapeHtml(title)} · ${escapeHtml(duration || "")}</small></span></summary><p class="card-sub">${escapeHtml(focus || "")}</p><div class="list detail-list">${items.map(x => `<div class="list-row"><div class="list-main"><div class="list-title">${escapeHtml(x.name)}</div><div class="list-sub">${escapeHtml(x.prescription || x.dur || "")}</div><p class="card-body">${escapeHtml(x.hints || x.details || "")}</p></div></div>`).join("")}</div></details>`;
}
function nutritionContent(recent) {
  const n = DomOS.nutritionOverride || calculateNutrition();
  const phases = DATA.nutrition.phases;
  return `<div class="grid three">${Object.entries(phases).map(([key,p]) => `<div class="card"><div class="card-head"><div><div class="card-title">${p.name}</div><div class="card-sub">End: ${p.end}</div></div><span class="chip ${p.status === "active" ? "success" : p.status === "archived" ? "" : "info"}">${p.status}</span></div><div class="metric-row"><span class="chip">${p.baseCalories} kcal base</span><span class="chip">P ${p.protein}g</span><span class="chip">F ${p.fat}g</span></div></div>`).join("")}</div><div class="card hero-card"><div class="card-head"><div><div class="card-title">Manual target calculator</div><p class="card-sub">Override activities here without logging a separate training session.</p></div><button class="btn ghost" onclick="resetNutritionOverride()">Reset</button></div><form id="nutritionOverrideForm"><div class="form-grid"><div class="field"><label>Phase</label><select name="phase">${Object.entries(phases).map(([k,p])=>`<option value="${k}" ${n.phaseKey===k?"selected":""}>${p.name}</option>`).join("")}</select></div><div class="field"><label>Steps</label><input name="steps" type="number" value="${n.steps || 10000}"></div></div><div class="activity-grid compact">${["run","gym","abs","football","sevens"].map(a=>`<label class="activity-tile ${n.activities.includes(a)?"checked":""}"><input type="checkbox" name="activities" value="${a}" ${n.activities.includes(a)?"checked":""}><span>${a}</span></label>`).join("")}</div><div class="module-actions" style="margin-top:14px"><button type="button" class="btn ghost" onclick="recalculateNutritionOverride()">Recalculate</button><button type="button" class="btn primary" onclick="saveNutritionOverrideTarget()">Save target log</button></div></form>${nutritionPreviewHtml(n)}</div>${recentList(recent)}`;
}
window.recalculateNutritionOverride = function() { const f=$("#nutritionOverrideForm"); const fd=new FormData(f); const activities=$$('input[name="activities"]', f).filter(cb=>cb.checked).map(cb=>cb.value); DomOS.nutritionOverride = calculateNutrition(fd.get("phase"), { steps:Number(fd.get("steps")||10000), activities }); renderModuleDetail("nutrition"); };
window.resetNutritionOverride = function() { DomOS.nutritionOverride = null; renderModuleDetail("nutrition"); };
window.saveNutritionOverrideTarget = async function() { if (!DomOS.nutritionOverride) recalculateNutritionOverride(); await saveEntry("nutrition", "daily_target", todayISO(), DomOS.nutritionOverride); };
function footballContent(recent) {
  const f = currentFootballStatus();
  return `<div class="grid two"><div class="card hero-card"><div class="card-title">Current football phase</div><div class="metric-row"><span class="chip accent">${f.phase}</span><span class="chip">Week ${f.week}</span></div><h3 style="margin-top:12px">${f.focus.title}</h3><p class="card-sub">${f.focus.prompt}</p></div><div class="card"><div class="card-title">Primary metrics</div><div class="list" style="margin-top:12px"><div class="list-row"><div class="list-title">Session B score</div><span class="chip">trend</span></div><div class="list-row"><div class="list-title">-1 keeper-zone shots</div><span class="chip warning">reduce</span></div><div class="list-row"><div class="list-title">Match focus result</div><span class="chip info">Yes/Mostly/No</span></div></div></div></div><div class="detail-section">${Object.entries(DATA.football.sessions).map(([id,s]) => sessionDetails(`Football Session ${id}`, s.title, s.duration, s.focus, s.blocks)).join("")}</div><div class="card"><div class="card-title">Hard rules</div><div class="list" style="margin-top:12px">${DATA.football.rules.map(r=>`<div class="list-row"><div class="list-sub">${escapeHtml(r)}</div></div>`).join("")}</div></div>${recentList(recent)}`;
}
function physioContent(recent) { return `<div class="grid four">${DATA.physio.exercises.map(e => `<div class="card"><div class="card-title">${e.name}</div><div class="card-sub">${e.schedule} · ${e.dose}</div><p class="card-body">${e.purpose}</p><div class="metric-row"><span class="chip info">${escapeHtml(e.tips)}</span></div></div>`).join("")}</div>${recentList(recent)}`; }
function faceBodyContent(recent) { return `<div class="grid two"><div class="card"><div class="card-title">Weekly routine</div><div class="list" style="margin-top:12px">${DATA.faceBody.week.map((d,i)=>`<details class="inline-details"><summary>${d.day} · ${d.label}</summary><div class="list-sub"><strong>AM:</strong> ${d.am.join(" → ")}<br><strong>PM:</strong> ${d.pm.join(" → ")}${d.warning?`<br><strong>Warning:</strong> ${d.warning}`:""}</div></details>`).join("")}</div></div><div class="card"><div class="card-title">Product notes</div><div class="list" style="margin-top:12px">${DATA.faceBody.productNotes.map(x=>`<div class="list-row"><div class="list-sub">${escapeHtml(x)}</div></div>`).join("")}</div></div></div><div class="card"><div class="card-title">Hard rules</div><div class="list" style="margin-top:12px">${DATA.faceBody.rules.map(r=>`<div class="list-row"><div class="list-sub">${escapeHtml(r)}</div></div>`).join("")}</div></div>${recentList(recent)}`; }
function hairCareContent(recent) { return `<div class="grid two"><div class="card"><div class="card-title">Weekly rhythm</div><div class="list" style="margin-top:12px">${DATA.hairCare.week.map(d=>`<div class="list-row"><div><div class="list-title">${d.day} · ${d.label}</div><div class="list-sub">${d.items.join(" → ")}</div></div></div>`).join("")}</div></div><div class="card"><div class="card-title">Scenarios</div><div class="list" style="margin-top:12px">${Object.entries(DATA.hairCare.scenarios).map(([k,s])=>`<details class="inline-details"><summary>${s.title}</summary><div class="list-sub"><em>${s.meta}</em><ol>${s.steps.map(x=>`<li>${escapeHtml(x)}</li>`).join("")}</ol><strong>${escapeHtml(s.note)}</strong></div></details>`).join("")}</div></div></div><div class="card"><div class="card-title">Hard rules</div><div class="list" style="margin-top:12px">${DATA.hairCare.rules.map(r=>`<div class="list-row"><div class="list-sub">${escapeHtml(r)}</div></div>`).join("")}</div></div>${recentList(recent)}`; }
function stylingContent(recent) { return `<div class="grid two">${Object.entries(DATA.styling.methods).map(([k,m])=>`<details class="detail-card" open><summary><span><strong>${m.title}</strong><small>${m.meta}</small></span></summary><ol class="step-list">${m.steps.map(s=>`<li>${escapeHtml(s)}</li>`).join("")}</ol><div class="metric-row">${m.rules.map(r=>`<span class="chip warning">${escapeHtml(r)}</span>`).join("")}</div></details>`).join("")}</div><div class="card"><div class="card-title">Logging disabled</div><p class="card-sub">You said you do not want to log hairstyling. This module is now reference-only.</p></div>`; }
function productsContentMini() { return `<div class="card"><div class="card-title">Product stock</div><p class="card-sub">Open the Products page for reorder tracking and updates.</p><button class="btn primary" onclick="navigate('products')">Open Products</button></div>`; }

function renderLog() {
  const rows = DomOS.entries.filter(e=>e.module_key!=="planner").slice(0,50).map(e => `<tr><td>${e.entry_date}</td><td>${moduleName(e.module_key)}</td><td>${escapeHtml(e.entry_type.replaceAll("_"," "))}</td><td>${escapeHtml(summaryPayload(e.payload))}</td></tr>`).join("");
  $("#view-log").innerHTML = `<div class="card hero-card"><div class="card-head"><div><div class="eyebrow">Universal log</div><h2>Recent entries</h2><p class="card-sub">All module logs in one place. Weekly plans are handled separately on the Week page.</p></div><button class="btn primary" onclick="showQuickLog()">Add log</button></div></div><div class="table-wrap"><table><thead><tr><th>Date</th><th>Module</th><th>Type</th><th>Summary</th></tr></thead><tbody>${rows || `<tr><td colspan="4">No logs yet.</td></tr>`}</tbody></table></div>`;
}
function renderCheckins() { $("#view-checkins").innerHTML = `<div class="card hero-card"><div class="card-head"><div><div class="eyebrow">Weekly review</div><h2>This week</h2><p class="card-sub">A compact weekly control panel. Create a review entry at the end of the week.</p></div><button class="btn primary" onclick="showWeeklyReview()">Create review</button></div></div><div class="grid three">${DATA.modules.filter(m=>m.key!=="products").map(m=>`<div class="card"><div class="card-title">${escapeHtml(m.short)}</div><div class="metric"><div class="metric-value">${entriesThisWeek(m.key).length}</div><div class="metric-label">logs this week</div></div></div>`).join("")}</div>`; }
function renderProducts() {
  const rows = DomOS.products.map(p => { const due = p.next_reorder_date && p.next_reorder_date <= addDays(todayISO(), 21); const dueChip = due ? `<span class="chip warning">due soon</span>` : ""; return `<tr><td>${escapeHtml(p.name)}</td><td>${moduleName(p.module_key)}</td><td>${escapeHtml(p.category || "")}</td><td>${p.price ? `£${Number(p.price).toFixed(2)}` : "—"}</td><td>${escapeHtml(p.payload?.cadence || "")}</td><td>${p.opened_date || "—"}</td><td>${p.next_reorder_date || "—"} ${dueChip}</td><td><button class="btn ghost" onclick="showProductUpdate('${p.id}')">Update</button></td></tr>`; }).join("");
  $("#view-products").innerHTML = `<div class="card hero-card"><div class="eyebrow">Products</div><h2>Stock & reorders</h2><p class="card-sub">Update opened dates to calculate reorder dates. If Supabase fails, DomOS stores locally and tells you.</p></div><div class="table-wrap"><table><thead><tr><th>Product</th><th>Module</th><th>Category</th><th>Price</th><th>Cadence</th><th>Opened</th><th>Next reorder</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`;
}
function renderData() { $("#view-data").innerHTML = `<div class="grid two"><div class="card hero-card"><div class="eyebrow">Backup</div><h2>Export DomOS</h2><p class="card-sub">Download your entries, weekly plans and product data.</p><div class="module-actions" style="margin-top:16px"><button class="btn primary" onclick="downloadBackup()">Download JSON</button><button class="btn ghost" onclick="downloadEntriesCsv()">Entries CSV</button></div></div><div class="card"><div class="card-title">Current data</div><div class="grid two" style="margin-top:12px"><div class="metric"><div class="metric-value">${DomOS.entries.length}</div><div class="metric-label">entries</div></div><div class="metric"><div class="metric-value">${DomOS.products.length}</div><div class="metric-label">products</div></div></div></div></div>`; }
function renderSettings() { const cfg = getConfig(); $("#view-settings").innerHTML = `<div class="grid two"><div class="card hero-card"><div class="eyebrow">Supabase</div><h2>${cfg.configured ? "Configured" : "Not configured"}</h2><p class="card-sub">${cfg.configured ? "DomOS can use Supabase. Sign in to sync." : "Edit assets/supabase-config.js, then run sql/schema.sql in Supabase."}</p><div class="metric-row"><span class="chip ${DomOS.mode === "supabase" ? "success" : "info"}">${DomOS.mode}</span></div></div><div class="card"><div class="card-title">Account</div>${authBlock()}</div></div><div class="card" style="margin-top:16px"><div class="card-title">Local controls</div><p class="card-sub">Use carefully. This only clears local fallback data, not Supabase data.</p><button class="btn danger" style="margin-top:12px" onclick="clearLocalData()">Clear local data</button></div>`; bindAuthButtons(); }
function authBlock() { if (!getConfig().configured) return `<p class="card-sub">Configure Supabase first.</p>`; if (DomOS.user) return `<p class="card-sub">Signed in as ${escapeHtml(DomOS.user.email)}</p><button class="btn ghost" onclick="signOut()">Sign out</button>`; return `<div class="field"><label>Email</label><input id="authEmail" type="email" placeholder="you@example.com"></div><div class="field"><label>Password</label><input id="authPassword" type="password" placeholder="Minimum 6 characters"></div><div class="module-actions"><button class="btn primary" id="signInBtn">Sign in</button><button class="btn ghost" id="signUpBtn">Create account</button></div>`; }
function bindAuthButtons() { $("#signInBtn")?.addEventListener("click", async () => authAction("signIn")); $("#signUpBtn")?.addEventListener("click", async () => authAction("signUp")); }
async function authAction(type) { if (!DomOS.sb) return toast("Supabase not ready"); const email=$("#authEmail")?.value; const password=$("#authPassword")?.value; if (!email || !password) return toast("Enter email and password"); const res = type === "signUp" ? await DomOS.sb.auth.signUp({ email, password }) : await DomOS.sb.auth.signInWithPassword({ email, password }); if (res.error) toast(res.error.message); else toast(type === "signUp" ? "Check email if confirmation is required" : "Signed in"); }
window.signOut = async function(){ if(DomOS.sb) await DomOS.sb.auth.signOut(); toast("Signed out"); };
window.clearLocalData = function(){ if(confirm("Clear local DomOS fallback data on this device?")){ localStorage.removeItem("domos_entries"); localStorage.removeItem("domos_products"); loadAll().then(renderAll); }};

function moduleName(key) { return DATA.modules.find(m=>m.key===key)?.short || key; }
function showQuickLog() { openModal("Quick log", `<div class="module-grid">${DATA.modules.filter(m=>m.canLog).map(m=>`<button class="card module-card" style="text-align:left" onclick="showModuleLog('${m.key}')"><div class="module-icon" style="background:${m.accent}22;color:${m.accent}">${m.icon}</div><div><div class="card-title">${m.short}</div><div class="card-sub">${m.name}</div></div></button>`).join("")}</div>`, "DomOS"); }
window.showModuleLog = function(moduleKey) { const mod = DATA.modules.find(m => m.key === moduleKey); if (!mod?.canLog) return toast("This module is reference-only"); openModal(`Log ${mod.short}`, moduleLogForm(moduleKey), mod.name); bindLogForm(moduleKey); };
function moduleLogForm(moduleKey) {
  const dateField = `<div class="field"><label>Date</label><input name="entry_date" type="date" value="${todayISO()}"></div>`;
  if (moduleKey === "phoenix") return `<form id="logForm">${dateField}<div class="form-grid"><div class="field"><label>Session</label><select name="session"><option>A</option><option>B</option><option>C</option><option>Abs</option></select></div><div class="field"><label>Completed</label><select name="completed"><option>yes</option><option>partial</option><option>skipped</option></select></div><div class="field"><label>Duration minutes</label><input name="duration_minutes" type="number"></div><div class="field"><label>Energy 1-5</label><input name="energy" type="number" min="1" max="5"></div><div class="field"><label>Soreness 1-5</label><input name="soreness" type="number" min="1" max="5"></div><div class="field"><label>Hamstring status</label><select name="hamstring_status"><option>green</option><option>amber</option><option>red</option></select></div><div class="field"><label>Knee status</label><select name="knee_status"><option>none</option><option>mild</option><option>moderate</option><option>sharp</option></select></div><div class="field"><label>Ankle status</label><select name="ankle_status"><option>none</option><option>mild</option><option>moderate</option><option>sharp</option></select></div></div><div class="field"><label>Modification / notes</label><textarea name="notes"></textarea></div><button type="button" data-submit-form class="btn primary full">Save Phoenix log</button></form>`;
  if (moduleKey === "football") return `<form id="logForm">${dateField}<div class="form-grid"><div class="field"><label>Type</label><select name="entry_subtype"><option value="session_log">Session</option><option value="match_log">Match</option></select></div><div class="field"><label>Session</label><select name="session"><option>A</option><option>B</option><option>C</option><option>D</option><option>E</option><option>F</option><option>R</option></select></div><div class="field"><label>Completed</label><select name="completed"><option>yes</option><option>partial</option><option>skipped</option></select></div><div class="field"><label>Session B score</label><input name="total_score" type="number"></div><div class="field"><label>-1 shots</label><input name="minus_ones" type="number"></div><div class="field"><label>Focus result</label><select name="focus_result"><option></option><option>yes</option><option>mostly</option><option>no</option></select></div></div><div class="field"><label>Notes</label><textarea name="notes"></textarea></div><button type="button" data-submit-form class="btn primary full">Save Football log</button></form>`;
  if (moduleKey === "physio") return `<form id="logForm">${dateField}<div class="form-grid"><div class="field"><label>Exercise</label><select name="exercise_id">${DATA.physio.exercises.map(e=>`<option value="${e.id}">${e.name}</option>`).join("")}</select></div><div class="field"><label>Sets completed</label><input name="sets_completed" type="number" value="3"></div><div class="field"><label>Pain</label><select name="pain"><option>none</option><option>mild</option><option>moderate</option><option>sharp</option></select></div><div class="field"><label>Effort</label><select name="effort"><option>easy</option><option>moderate</option><option>hard</option><option>max</option></select></div></div><div class="field"><label>Notes</label><textarea name="notes"></textarea></div><button type="button" data-submit-form class="btn primary full">Save Physio log</button></form>`;
  if (moduleKey === "nutrition") return `<form id="logForm">${dateField}<input type="hidden" name="entry_subtype" value="daily_target"><div class="form-grid"><div class="field"><label>Phase</label><select name="phase"><option value="cut">Deep Cut</option><option value="bulk">Lean Bulk</option><option value="wedding">Wedding Prep</option></select></div><div class="field"><label>Steps</label><input name="steps" type="number" value="10000"></div></div><div class="activity-grid compact">${["run","gym","abs","football","sevens"].map(a=>`<label class="activity-tile"><input type="checkbox" name="activities" value="${a}"><span>${a}</span></label>`).join("")}</div><div class="field"><label>Notes</label><textarea name="notes"></textarea></div><button type="button" data-submit-form class="btn primary full">Save Nutrition target</button></form>`;
  if (moduleKey === "face_body") return `<form id="logForm">${dateField}<div class="form-grid"><div class="field"><label>Routine type</label><select name="routine_type"><option>bha_night</option><option>rest_night</option><option>dermastamp_night</option><option>bha_hibiscrub</option></select></div><div class="field"><label>Status</label><select name="completed"><option>complete</option><option>partial</option><option>skipped</option></select></div><div class="field"><label>Irritation</label><select name="skin_irritation"><option>none</option><option>mild</option><option>moderate</option><option>bad</option></select></div><div class="field"><label>Dryness</label><select name="dryness"><option>none</option><option>mild</option><option>moderate</option><option>bad</option></select></div></div><div class="checkbox-row"><input type="checkbox" name="minoxidil_am"> Minoxidil AM</div><div class="checkbox-row"><input type="checkbox" name="minoxidil_pm"> Minoxidil PM</div><div class="checkbox-row"><input type="checkbox" name="bha_used"> BHA used</div><div class="checkbox-row"><input type="checkbox" name="dermastamp_used"> Dermastamp used</div><div class="field"><label>Notes</label><textarea name="notes"></textarea></div><button type="button" data-submit-form class="btn primary full">Save care log</button></form>`;
  if (moduleKey === "hair_care") return `<form id="logForm">${dateField}<div class="form-grid"><div class="field"><label>Scenario</label><select name="scenario"><option>standard</option><option>scalp_care</option><option>repair</option><option>bond</option><option>dermaroller</option></select></div><div class="field"><label>Irritation</label><select name="irritation"><option>none</option><option>mild</option><option>moderate</option><option>bad</option></select></div></div><div class="checkbox-row"><input type="checkbox" name="wash_done"> Wash done</div><div class="checkbox-row"><input type="checkbox" name="conditioner_used"> Conditioner used</div><div class="checkbox-row"><input type="checkbox" name="peptide_serum_used"> Peptide serum used</div><div class="checkbox-row"><input type="checkbox" name="k18_used"> K18 used</div><div class="checkbox-row"><input type="checkbox" name="nizoral_used"> Nizoral used</div><div class="checkbox-row"><input type="checkbox" name="dermaroller_used"> Dermaroller used</div><div class="field"><label>Notes</label><textarea name="notes"></textarea></div><button type="button" data-submit-form class="btn primary full">Save hair care log</button></form>`;
  return `<p>No form available.</p>`;
}
function bindLogForm(moduleKey) {
  const form = $("#logForm");
  if (!form) return;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = e.submitter || $("[data-submit-form]", form);
    const oldText = btn?.textContent;
    if (btn) { btn.disabled = true; btn.textContent = "Saving..."; }
    const fd = new FormData(form);
    const entryDate = fd.get("entry_date") || todayISO();
    const payload = {};
    for (const [k,v] of fd.entries()) {
      if (["entry_date", "entry_subtype", "activities"].includes(k)) continue;
      if (v !== "") payload[k] = coerce(v);
    }
    $$('input[type="checkbox"]', form).forEach(cb => { if (cb.name !== "activities") payload[cb.name] = cb.checked; });
    const activities = $$('input[name="activities"]', form).filter(cb=>cb.checked).map(cb=>cb.value);
    if (activities.length) payload.activities = activities;
    let entryType = fd.get("entry_subtype") || defaultEntryType(moduleKey);
    if (moduleKey === "nutrition" && entryType === "daily_target") Object.assign(payload, calculateNutrition(payload.phase || "cut", { steps: payload.steps, activities: payload.activities || [] }));
    await saveEntry(moduleKey, entryType, entryDate, payload);
    closeModal();
    if (btn) { btn.disabled = false; btn.textContent = oldText; }
  });
}
function coerce(v) { if (v === "true") return true; if (v === "false") return false; if (v !== "" && !Number.isNaN(Number(v))) return Number(v); return v; }
function defaultEntryType(moduleKey) { return ({ phoenix:"session_log", football:"session_log", physio:"exercise_log", nutrition:"daily_target", face_body:"routine_log", hair_care:"routine_log" })[moduleKey] || "log"; }

window.showWeeklyReview = function() { openModal("Create weekly review", `<form id="weeklyReviewForm"><div class="field"><label>Week start</label><input name="entry_date" type="date" value="${weekBounds(todayISO()).start}"></div><div class="field"><label>Overall status</label><select name="overall"><option>hold_plan</option><option>adjust_needed</option><option>deload_or_recover</option></select></div><div class="field"><label>Review notes</label><textarea name="notes" placeholder="What improved, what slipped, what needs changing?"></textarea></div><button type="button" data-submit-form class="btn primary full">Save weekly review</button></form>`, "Check-in"); $("#weeklyReviewForm").addEventListener("submit", async e => { e.preventDefault(); const fd = new FormData(e.target); await saveEntry("checkins", "weekly_review", fd.get("entry_date"), { overall: fd.get("overall"), notes: fd.get("notes"), module_counts: Object.fromEntries(DATA.modules.map(m => [m.key, entriesThisWeek(m.key).length])) }); closeModal(); }); };
window.showProductUpdate = function(id) {
  const p = DomOS.products.find(x => String(x.id) === String(id));
  if (!p) return toast("Product not found");
  const opened = p.opened_date || todayISO();
  openModal("Update product", `<form id="productForm"><div class="field"><label>Product</label><input value="${escapeHtml(p.name)}" disabled></div><div class="form-grid"><div class="field"><label>Opened date</label><input name="opened_date" type="date" value="${opened}"></div><div class="field"><label>Duration days</label><input name="estimated_duration_days" type="number" value="${p.estimated_duration_days || ""}"></div><div class="field"><label>Price</label><input name="price" type="number" step="0.01" value="${p.price || ""}"></div><div class="field"><label>Status</label><select name="status"><option ${p.status==='active'?'selected':''}>active</option><option ${p.status==='standby'?'selected':''}>standby</option><option ${p.status==='stopped'?'selected':''}>stopped</option></select></div></div><div class="field"><label>Where to buy</label><input name="where_to_buy" value="${escapeHtml(p.where_to_buy || "")}"></div><button type="button" data-submit-form class="btn primary full">Save product</button></form>`, "Products");
  $("#productForm").addEventListener("submit", async e => { e.preventDefault(); const btn=e.submitter || $("[data-submit-form]", e.target); const old=btn?.textContent; if(btn){btn.disabled=true;btn.textContent="Saving...";} const fd = new FormData(e.target); const duration = Number(fd.get("estimated_duration_days")) || null; const openedDate = fd.get("opened_date") || null; const next = openedDate && duration ? addDays(openedDate, duration) : null; await saveProduct({ ...p, opened_date: openedDate, estimated_duration_days: duration, next_reorder_date: next, price: fd.get("price") ? Number(fd.get("price")) : null, status: fd.get("status"), where_to_buy: fd.get("where_to_buy") }); if (openedDate) await saveEntry("products", "product_update", todayISO(), { product_name: p.name, event: "opened_or_updated", opened_date: openedDate, next_reorder_date: next }); closeModal(); if(btn){btn.disabled=false;btn.textContent=old;} });
};
function addDays(dateStr, days) { const d = new Date(dateStr + "T00:00:00"); d.setDate(d.getDate()+Number(days)); return d.toISOString().slice(0,10); }
window.downloadBackup = function() { downloadFile(`domos-backup-${todayISO()}.json`, JSON.stringify({ exported_at: new Date().toISOString(), entries: DomOS.entries, products: DomOS.products }, null, 2), "application/json"); };
window.downloadEntriesCsv = function() { const rows = [["date","module","type","payload"]].concat(DomosCsvEntries()); downloadFile(`domos-entries-${todayISO()}.csv`, rows.map(r=>r.map(c=>`"${String(c).replaceAll('"','""')}"`).join(",")).join("\n"), "text/csv"); };
function DomosCsvEntries(){ return DomOS.entries.map(e => [e.entry_date, e.module_key, e.entry_type, JSON.stringify(e.payload)]); }
function downloadFile(name, content, type) { const blob = new Blob([content], { type }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url); }
window.navigate = navigate;
window.showQuickLog = showQuickLog;
window.forceCloseModal = forceCloseModal;
init().catch(err => { console.error(err); toast("DomOS failed to initialise — check console"); });
