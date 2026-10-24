(() => {
  "use strict";

  const STORAGE_KEY = "form-workout-data-v1";
  const { completedSets, volumeOf, validData, mergeById, createBackup, isDurationExercise } = window.FormDomain;
  const groups = ["Chest", "Back", "Shoulders", "Biceps", "Triceps", "Legs", "Glutes", "Core", "Full body", "Cardio"];
  const starterExercises = [
    ["Barbell Bench Press", "Chest", "weighted"], ["Dumbbell Bench Press", "Chest", "weighted"], ["Incline Dumbbell Press", "Chest", "weighted"], ["Push-Up", "Chest", "bodyweight"], ["Cable Fly", "Chest", "weighted"], ["Dip", "Chest", "bodyweight"],
    ["Barbell Row", "Back", "weighted"], ["Lat Pulldown", "Back", "weighted"], ["Pull-Up", "Back", "bodyweight"], ["Seated Cable Row", "Back", "weighted"], ["Single-Arm Dumbbell Row", "Back", "weighted"], ["Superman", "Back", "bodyweight"],
    ["Overhead Press", "Shoulders", "weighted"], ["Dumbbell Lateral Raise", "Shoulders", "weighted"], ["Face Pull", "Shoulders", "weighted"], ["Rear Delt Fly", "Shoulders", "weighted"], ["Pike Push-Up", "Shoulders", "bodyweight"],
    ["Barbell Curl", "Biceps", "weighted"], ["Dumbbell Curl", "Biceps", "weighted"], ["Hammer Curl", "Biceps", "weighted"], ["Cable Curl", "Biceps", "weighted"], ["Chin-Up", "Biceps", "bodyweight"],
    ["Triceps Pushdown", "Triceps", "weighted"], ["Overhead Triceps Extension", "Triceps", "weighted"], ["Close-Grip Bench Press", "Triceps", "weighted"], ["Bench Dip", "Triceps", "bodyweight"], ["Skull Crusher", "Triceps", "weighted"],
    ["Barbell Back Squat", "Legs", "weighted"], ["Romanian Deadlift", "Legs", "weighted"], ["Leg Press", "Legs", "weighted"], ["Leg Extension", "Legs", "weighted"], ["Leg Curl", "Legs", "weighted"], ["Walking Lunge", "Legs", "weighted"], ["Calf Raise", "Legs", "weighted"], ["Bodyweight Squat", "Legs", "bodyweight"], ["Wall Sit", "Legs", "bodyweight"],
    ["Hip Thrust", "Glutes", "weighted"], ["Glute Bridge", "Glutes", "bodyweight"], ["Bulgarian Split Squat", "Glutes", "weighted"], ["Hip Abduction", "Glutes", "bodyweight"],
    ["Plank", "Core", "bodyweight"], ["Sit-Up", "Core", "bodyweight"], ["Hanging Knee Raise", "Core", "bodyweight"], ["Cable Crunch", "Core", "weighted"], ["Dead Bug", "Core", "bodyweight"], ["Russian Twist", "Core", "bodyweight"], ["Mountain Climber", "Core", "bodyweight"], ["Bird Dog", "Core", "bodyweight"],
    ["Burpee", "Full body", "bodyweight"], ["Jumping Jacks", "Full body", "bodyweight"], ["Kettlebell Swing", "Full body", "weighted"], ["Turkish Get-Up", "Full body", "weighted"], ["Bear Crawl", "Full body", "bodyweight"],
    ["Treadmill Run", "Cardio", "cardio"], ["Cycling", "Cardio", "cardio"], ["Rowing Machine", "Cardio", "cardio"], ["Jump Rope", "Cardio", "cardio"], ["HIIT Circuit", "Cardio", "bodyweight"]
  ];
  const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
  const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
  const nowISO = () => new Date().toISOString();
  const starterLibrary = () => starterExercises.map(([name, group, type]) => ({ id: `builtin-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`, name, group, type, builtin: true }));
  const sampleRoutines = () => [
    { id: "routine-push", name: "Push day", description: "Chest, shoulders & triceps", exercises: [["Barbell Bench Press",3,8],["Overhead Press",3,8],["Incline Dumbbell Press",3,10],["Dumbbell Lateral Raise",3,12],["Triceps Pushdown",3,12]].map(([name,sets,reps]) => ({exerciseId:`builtin-${name.toLowerCase().replace(/[^a-z0-9]+/g,"-")}`, name, sets, reps, weight:""})) },
    { id: "routine-pull", name: "Pull day", description: "Back & biceps", exercises: [["Barbell Row",3,8],["Lat Pulldown",3,10],["Seated Cable Row",3,10],["Face Pull",3,12],["Dumbbell Curl",3,12]].map(([name,sets,reps]) => ({exerciseId:`builtin-${name.toLowerCase().replace(/[^a-z0-9]+/g,"-")}`, name, sets, reps, weight:""})) },
    { id: "routine-legs", name: "Leg day", description: "Quads, glutes & hamstrings", exercises: [["Barbell Back Squat",4,8],["Romanian Deadlift",3,10],["Leg Press",3,12],["Leg Curl",3,12],["Calf Raise",3,15]].map(([name,sets,reps]) => ({exerciseId:`builtin-${name.toLowerCase().replace(/[^a-z0-9]+/g,"-")}`, name, sets, reps, weight:""})) },
    { id: "routine-full-body", name: "Full body", description: "A little bit of everything", exercises: [["Bodyweight Squat",3,12],["Push-Up",3,10],["Barbell Row",3,10],["Plank",3,45],["Sit-Up",3,15]].map(([name,sets,reps]) => ({exerciseId:`builtin-${name.toLowerCase().replace(/[^a-z0-9]+/g,"-")}`, name, sets, reps, weight:""})) }
  ];
  const defaults = () => ({ version: 1, settings: { theme:"light", unit:"kg", restSeconds:90, displayName:"Athlete" }, exercises:starterLibrary(), routines:sampleRoutines(), workouts:[] });

  function loadData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaults();
      const parsed = JSON.parse(raw);
      if (!validData(parsed)) throw new Error("Saved data has an unexpected format.");
      const base = defaults();
      return {
        ...base, ...parsed,
        settings: {
          ...base.settings, ...parsed.settings,
          theme: ["light","dark"].includes(parsed.settings.theme) ? parsed.settings.theme : base.settings.theme,
          unit: ["kg","lb"].includes(parsed.settings.unit) ? parsed.settings.unit : base.settings.unit,
          restSeconds: [30,60,90,120,180].includes(Number(parsed.settings.restSeconds)) ? Number(parsed.settings.restSeconds) : base.settings.restSeconds,
          displayName: typeof parsed.settings.displayName === "string" && parsed.settings.displayName.trim() ? parsed.settings.displayName.trim().slice(0,30) : base.settings.displayName
        },
        exercises: parsed.exercises,
        routines: parsed.routines,
        workouts: parsed.workouts.map(w => ({ ...w, exercises: w.exercises.map(e => ({ ...e, sets: Array.isArray(e.sets) ? e.sets : [] })) }))
      };
    } catch (error) {
      console.error("Unable to load Form data:", error);
      try { localStorage.setItem("form-workout-data-corrupt-backup", localStorage.getItem(STORAGE_KEY) || ""); } catch (storageError) { console.error("Could not preserve invalid local data:", storageError); }
      return defaults();
    }
  }
  let data = loadData();
  let page = "dashboard";
  let detailId = null;
  let exerciseHistoryId = null;
  let historyQuery = "";
  let historyPeriod = "all";
  let addCreatedExerciseToWorkout = false;
  let libraryQuery = "";
  let libraryGroup = "All";
  let chartInstances = [];
  let restInterval = null;
  let restUntil = null;

  function saveData() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error("Unable to save Form data:", error);
      toast("Could not save changes. Check this browser's storage space.", true);
      return false;
    }
  }
  const activeWorkout = () => data.workouts.find(w => w.status === "active") || null;
  const getExercise = id => data.exercises.find(e => e.id === id);
  const unit = () => data.settings.unit || "kg";
  const displayName = () => data.settings.displayName || "Athlete";
  const formatDate = value => value ? new Date(value).toLocaleDateString(undefined, { month:"short", day:"numeric", year:"numeric" }) : "—";
  const durationMinutes = workout => Math.max(0, Math.round(((workout.endedAt ? new Date(workout.endedAt) : Date.now()) - new Date(workout.startedAt || Date.now())) / 60000));
  const completedWorkouts = () => data.workouts.filter(w => w.status === "completed").sort((a,b) => new Date(b.endedAt || b.startedAt) - new Date(a.endedAt || a.startedAt));
  const weekStart = (date = new Date()) => { const day = (date.getDay() + 6) % 7; const start = new Date(date); start.setHours(0,0,0,0); start.setDate(start.getDate() - day); return start; };
  const thisWeekWorkouts = () => { const start = weekStart(); return completedWorkouts().filter(w => new Date(w.endedAt || w.startedAt) >= start); };
  const niceDuration = minutes => minutes < 60 ? `${minutes} min` : `${Math.floor(minutes/60)}h ${minutes%60 ? `${minutes%60}m` : ""}`.trim();

  function toast(message, error = false) {
    const node = document.createElement("div");
    node.className = `toast${error ? " error" : ""}`;
    node.textContent = message;
    document.querySelector("#toast-region").append(node);
    setTimeout(() => node.remove(), 3200);
  }
  function setTheme() {
    document.documentElement.dataset.theme = data.settings.theme === "dark" ? "dark" : "light";
    document.querySelector('meta[name="theme-color"]').content = data.settings.theme === "dark" ? "#161714" : "#f5f5f2";
  }
  function setProfile() {
    const initial = displayName().trim().charAt(0).toUpperCase() || "A";
    document.querySelector("#sidebar-name").textContent = displayName();
    document.querySelector("#avatar-initial").textContent = initial;
    document.querySelector("#today-label").textContent = new Date().toLocaleDateString(undefined, { weekday:"short", month:"short", day:"numeric" });
  }
  const pageTitles = { dashboard:"Overview", workout:"Workout", routines:"Routines", history:"History", progress:"Progress", library:"Exercises", settings:"Settings", detail:"Workout details", exerciseHistory:"Exercise history" };
  function navTo(target) {
    if (target === "workout" && activeWorkout()) { page = "workout"; }
    else if (target === "workout" && !activeWorkout()) { startWorkout(); return; }
    else page = target;
    render();
  }
  function navMarkup() {
    document.querySelectorAll("[data-nav]").forEach(button => {
      const target = button.dataset.nav;
      button.classList.toggle("active", target === page || (target === "workout" && page === "workout"));
    });
    document.querySelector("#page-label").textContent = pageTitles[page] || "Overview";
    const settingsButton = document.querySelector("#top-avatar");
    const inSettings = page === "settings";
    settingsButton.dataset.nav = inSettings ? "dashboard" : "settings";
    settingsButton.textContent = inSettings ? "×" : "⚙";
    settingsButton.title = inSettings ? "Exit settings" : "Settings";
    settingsButton.setAttribute("aria-label", settingsButton.title);
  }
  function render() {
    navMarkup(); setProfile(); setTheme();
    const content = document.querySelector("#app-content");
    chartInstances.forEach(chart => chart.destroy());
    chartInstances = [];
    const renders = { dashboard:renderDashboard, workout:renderWorkout, routines:renderRoutines, history:renderHistory, progress:renderProgress, library:renderLibrary, settings:renderSettings, detail:renderDetail, exerciseHistory:renderExerciseHistory };
    content.innerHTML = (renders[page] || renderDashboard)();
    if (page === "dashboard") drawWeeklyChart("weekly-chart", 7);
    if (page === "progress") { drawWeeklyChart("progress-chart", 12, "workouts"); drawExerciseChart(); }
  }
  function pageHeader(eyebrow, title, subtitle, action = "") {
    return `<div class="page-heading"><div><div class="eyebrow">${eyebrow}</div><h1>${title}</h1><p class="page-subtitle">${subtitle}</p></div>${action}</div>`;
  }
  function emptyState(title, description, button = "") {
    return `<div class="empty-state"><div class="empty-mark">＋</div><strong>${title}</strong><p>${description}</p>${button}</div>`;
  }
  function workoutRow(workout, actions = false) {
    const clickable = actions ? `data-action="open-detail" data-id="${escapeHTML(workout.id)}" data-card-action tabindex="0" role="group" aria-label="Open ${escapeHTML(workout.name || "workout")} details"` : "";
    return `<div class="list-row ${actions ? "clickable-row" : ""}" ${clickable}><span class="row-icon">↗</span><div class="list-row-main"><div class="list-row-title">${escapeHTML(workout.name || "Workout")}</div><div class="list-row-meta">${formatDate(workout.endedAt || workout.startedAt)} · ${(workout.exercises || []).length} exercises · ${niceDuration(durationMinutes(workout))}</div></div><div class="row-value"><strong>${completedSets(workout)} sets</strong>${actions ? "" : niceDuration(durationMinutes(workout))}</div>${actions ? `<button class="icon-action" data-action="open-detail" data-id="${escapeHTML(workout.id)}" aria-label="View workout">→</button>` : ""}</div>`;
  }
  function routineCard(routine, compact = false) {
    const exercisePreview = compact ? "" : `<ol class="routine-exercise-preview">${routine.exercises.map(exercise => `<li><span>${escapeHTML(exercise.name)}</span><small>${escapeHTML(exercise.sets || 3)} × ${escapeHTML(exercise.reps || 8)}${exercise.weight ? ` · ${escapeHTML(exercise.weight)} ${unit()}` : ""}</small></li>`).join("")}</ol>`;
    return `<article class="routine-card card clickable-card" data-action="start-routine" data-id="${escapeHTML(routine.id)}" data-card-action tabindex="0" role="group" aria-label="Start ${escapeHTML(routine.name)} routine"><div class="routine-card-top"><div><h3>${escapeHTML(routine.name)}</h3><p>${escapeHTML(routine.description || `${routine.exercises.length} exercises`)}</p></div><button class="icon-action" data-action="routine-menu" data-id="${escapeHTML(routine.id)}" aria-label="Routine actions">···</button></div>${exercisePreview}<div class="routine-card-bottom"><span class="tag">${routine.exercises.length} exercises</span><button class="btn btn-small ${compact ? "btn-primary" : ""}" data-action="start-routine" data-id="${escapeHTML(routine.id)}">Start routine <span>→</span></button></div></article>`;
  }
  function timeGreeting(hour = new Date().getHours()) {
    if (hour >= 5 && hour < 12) return "morning";
    if (hour >= 12 && hour < 17) return "afternoon";
    if (hour >= 17 && hour < 21) return "evening";
    return "night";
  }
  function renderDashboard() {
    const active = activeWorkout();
    const thisWeek = thisWeekWorkouts();
    const weekSets = thisWeek.reduce((sum,w) => sum + completedSets(w), 0);
    const weekMinutes = thisWeek.reduce((sum,w) => sum + durationMinutes(w), 0);
    const recent = completedWorkouts().slice(0,4);
    const routines = data.routines.slice(0,4);
    const records = personalRecords().slice(0,3);
    return `${pageHeader("YOUR TRAINING, IN FOCUS", `Good ${timeGreeting()}, ${escapeHTML(displayName())}.`, "A little progress, consistently made.", `<button class="btn btn-primary" data-action="${active ? "resume-workout" : "start-workout"}">${active ? "Continue workout" : "＋ Start workout"}</button>`)}
      <div class="grid stats-grid">
        <article class="card stat-card"><div class="stat-top"><span>Workouts this week</span><span class="stat-glyph">↗</span></div><div class="stat-number">${thisWeek.length}</div><div class="stat-caption">Since Monday</div></article>
        <article class="card stat-card"><div class="stat-top"><span>Sets completed</span><span class="stat-glyph">▦</span></div><div class="stat-number">${weekSets}</div><div class="stat-caption">Across ${thisWeek.length} sessions</div></article>
        <article class="card stat-card"><div class="stat-top"><span>Time training</span><span class="stat-glyph">◷</span></div><div class="stat-number">${niceDuration(weekMinutes)}</div><div class="stat-caption">This week</div></article>
        <article class="card stat-card"><div class="stat-top"><span>Training volume</span><span class="stat-glyph">⌁</span></div><div class="stat-number">${weekVolume(thisWeek)}</div><div class="stat-caption">${unit()} × reps · this week</div></article>
      </div>
      <div class="grid dashboard-grid">
        <div class="stack">
          <section class="card"><div class="card-heading"><h2>Weekly activity</h2><span class="muted">Last 7 days</span></div><div class="chart-wrap"><canvas id="weekly-chart" aria-label="Weekly completed sets chart"></canvas></div></section>
          <section class="card"><div class="card-heading"><h2>Recent workouts</h2><button class="section-link" data-nav="history">View history →</button></div><div class="list">${recent.length ? recent.map(w => workoutRow(w, true)).join("") : emptyState("Your training starts here","Finish your first workout and it will show up here.","<button class='btn btn-small btn-primary' data-action='start-workout'>Start a workout</button>")}</div></section>
          <section><div class="card-heading" style="padding:0 0 12px"><h2 class="section-title">Your routines</h2><button class="section-link" data-nav="routines">All routines →</button></div><div class="grid routine-grid">${routines.map(r => routineCard(r,true)).join("")}</div></section>
        </div>
        <div class="stack">
          <section class="action-panel"><div class="eyebrow">${active ? "SESSION IN PROGRESS" : "READY WHEN YOU ARE"}</div><h2>${active ? `Pick up ${escapeHTML(active.name)}.` : "Show up. The rest follows."}</h2><p>${active ? `${completedSets(active)} sets done · started ${niceDuration(durationMinutes(active))} ago` : "Your next session is one small decision away."}</p><button class="btn btn-accent" data-action="${active ? "resume-workout" : "start-workout"}">${active ? "Continue session →" : "Start a workout →"}</button></section>
          <section class="card"><div class="card-heading"><h2>Personal records</h2><button class="section-link" data-nav="progress">All records →</button></div><div>${records.length ? records.map(recordRow).join("") : emptyState("No records yet","Complete a set to start tracking your best load, reps, and holds.")}</div></section>
          <section class="card" style="padding:16px"><div class="eyebrow">A NOTE ON PRIVACY</div><p class="disclaimer" style="margin:8px 0 0">Your workouts live in this browser, on this device. They are not synced to an account or shared with a server. Export a backup in Settings to keep a copy.</p></section>
        </div>
      </div>`;
  }
  function weekVolume(workouts) { return Math.round(workouts.reduce((sum,w) => sum + volumeOf(w), 0)).toLocaleString(); }
  function weeklyBuckets(days, metric = "sets") {
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      if (metric === "workouts") {
        date.setHours(0,0,0,0);
        date.setDate(weekStart(date).getDate() - i * 7);
      } else {
        date.setHours(0,0,0,0);
        date.setDate(date.getDate() - i);
      }
      const next = new Date(date); next.setDate(date.getDate() + 1);
      if (metric === "workouts") next.setDate(next.getDate() + 6);
      const sessions = completedWorkouts().filter(w => { const end = new Date(w.endedAt || w.startedAt); return end >= date && end < next; });
      const value = metric === "workouts" ? sessions.length : sessions.reduce((sum,w) => sum + completedSets(w),0);
      result.push({ label:date.toLocaleDateString(undefined,metric === "workouts" ? {month:"short",day:"numeric"} : {weekday:"short"}), value, date });
    }
    return result;
  }
  function drawWeeklyChart(id, days, metric = "sets") {
    const canvas = document.getElementById(id);
    if (!canvas || !window.Chart) return;
    const buckets = weeklyBuckets(days, metric);
    const dark = data.settings.theme === "dark";
    chartInstances.push(new Chart(canvas, { type:"bar", data:{ labels:buckets.map(b => b.label), datasets:[{ data:buckets.map(b => b.value), backgroundColor:buckets.map(b => b.value ? "#bde66c" : dark ? "#393b35" : "#e9ebe4"), borderRadius:5, borderSkipped:false, maxBarThickness:28 }] }, options:{ maintainAspectRatio:false, plugins:{ legend:{display:false}, tooltip:{displayColors:false, callbacks:{label:context => metric === "workouts" ? `${context.raw} workouts` : `${context.raw} completed sets`}} }, scales:{ x:{grid:{display:false},ticks:{color:dark?"#a0a297":"#858780",font:{size:9}},border:{display:false}}, y:{beginAtZero:true,ticks:{precision:0,color:dark?"#a0a297":"#858780",font:{size:9}},grid:{color:dark?"#343630":"#eff0eb"},border:{display:false}} } } }));
  }
  function previousFor(exerciseId) {
    const entries = completedWorkouts().flatMap(w => (w.exercises || []).filter(e => e.exerciseId === exerciseId || e.name === getExercise(exerciseId)?.name).map(e => ({ workout:w, exercise:e })));
    const latest = entries[0];
    if (!latest) return "No previous performance";
    const duration = isDurationExercise(latest.exercise) && (latest.exercise.type === "bodyweight" || getExercise(exerciseId)?.type === "bodyweight");
    const best = latest.exercise.sets.filter(s => s.completed).sort((a,b) => duration ? Number(b.reps) - Number(a.reps) : Number(b.weight || 0) - Number(a.weight || 0))[0];
    return best ? `Last: ${duration ? `${best.reps} sec` : `${best.weight || "BW"} ${best.weight ? unit() : ""} × ${best.reps}` } · ${formatDate(latest.workout.endedAt)}` : `Last session · ${formatDate(latest.workout.endedAt)}`;
  }
  function renderWorkout() {
    const workout = activeWorkout();
    if (!workout) return `${pageHeader("TRAINING", "Start a workout", "Build a session one exercise at a time.", `<button class="btn btn-primary" data-action="start-workout">＋ Start workout</button>`)}${emptyState("Nothing in progress","Start a blank session or choose one of your routines.","<button class='btn btn-primary' data-action='start-workout'>Start workout</button> <button class='btn' data-nav='routines'>Browse routines</button>")}`;
    const routine = data.routines.find(item => item.id === workout.routineId);
    return `<div class="workout-head"><div><input class="workout-title-input" id="workout-title" value="${escapeHTML(workout.name)}" aria-label="Workout name">${routine ? `<div class="workout-routine-hint">Preloaded from ${escapeHTML(routine.name)} — follow the exercises below. Adding more is optional.</div>` : ""}<div class="workout-meta"><span>◷ <span id="workout-duration">${niceDuration(durationMinutes(workout))}</span></span><span>${workout.exercises.length} exercises</span><span>${completedSets(workout)} sets done</span></div></div><div class="workout-actions"><button class="btn" data-action="discard-workout">Discard</button><button class="btn btn-primary" data-action="finish-workout">Finish workout</button></div></div>
      <div id="workout-exercises">${workout.exercises.map((ex,index) => renderExerciseLog(ex,index,workout)).join("")}</div>
      <div class="workout-footer"><button class="btn" data-action="add-workout-exercise">＋ Add exercise</button><button class="btn btn-quiet" data-action="workout-note">＋ Workout note</button><span class="disclaimer">Changes save automatically</span></div>
      ${workout.notes ? `<div class="card" style="padding:15px;margin-top:10px"><label class="eyebrow" for="workout-notes">SESSION NOTES</label><textarea class="field" id="workout-notes" style="display:block;width:100%;margin-top:8px;min-height:70px" placeholder="How did it feel?">${escapeHTML(workout.notes)}</textarea></div>` : ""}`;
  }
  function renderExerciseLog(ex,index,workout) {
    const exercise = getExercise(ex.exerciseId);
    const bodyweight = exercise?.type === "bodyweight" || ex.type === "bodyweight";
    const cardio = exercise?.type === "cardio" || ex.type === "cardio";
    const duration = bodyweight && isDurationExercise(ex);
    const prev = previousFor(ex.exerciseId);
    return `<article class="card exercise-log" data-exercise-index="${index}"><div class="exercise-log-head"><div class="exercise-log-title"><span class="row-icon">${bodyweight ? "◎" : cardio ? "⌁" : "◈"}</span><div><strong>${escapeHTML(ex.name)}</strong><div class="previous-hint">${escapeHTML(prev)}</div></div></div><div class="sort-actions"><button class="icon-action" data-action="move-exercise" data-index="${index}" data-delta="-1" aria-label="Move exercise up">↑</button><button class="icon-action" data-action="move-exercise" data-index="${index}" data-delta="1" aria-label="Move exercise down">↓</button><button class="icon-action" data-action="exercise-menu" data-index="${index}" aria-label="Exercise options">···</button></div></div>
      <div class="set-table"><div class="set-header"><span>SET</span><span>${cardio ? "MIN" : duration ? "SEC" : "REPS"}</span><span>${bodyweight || cardio ? "LOAD" : `LOAD (${unit()})`}</span><span>DONE</span><span></span></div>
      ${ex.sets.map((set,setIndex) => `<div class="set-row"><span class="set-number">${String(setIndex+1).padStart(2,"0")}</span><input class="set-input" inputmode="decimal" type="number" min="0" step="any" value="${escapeHTML(set.reps)}" data-field="reps" data-ex="${index}" data-set="${setIndex}" aria-label="${cardio?"Minutes":duration?"Seconds":"Reps"}"><input class="set-input" inputmode="decimal" type="number" min="0" step="any" value="${escapeHTML(set.weight)}" data-field="weight" data-ex="${index}" data-set="${setIndex}" placeholder="${bodyweight ? "BW" : cardio ? "—" : "0"}" ${bodyweight || cardio ? "disabled" : ""} aria-label="Weight"><button class="set-check ${set.completed?"done":""}" data-action="toggle-set" data-ex="${index}" data-set="${setIndex}" aria-label="${set.completed?"Undo set completion":"Complete set"}">✓</button><button class="icon-action" data-action="remove-set" data-ex="${index}" data-set="${setIndex}" aria-label="Remove set">×</button></div>`).join("")}
      <div class="exercise-log-foot"><button class="btn btn-small" data-action="add-set" data-ex="${index}">＋ Add set</button><button class="btn btn-small btn-quiet" data-action="rest-timer">◷ Rest</button>${ex.notes ? `<input class="note-input" data-field="exercise-note" data-ex="${index}" value="${escapeHTML(ex.notes)}" placeholder="Exercise note">` : `<button class="btn btn-small btn-quiet" data-action="exercise-note" data-ex="${index}">＋ Note</button>`}</div></div></article>`;
  }
  function createSet(reps = 8, weight = "", completed = false) { return { id:uid(), reps, weight, completed }; }
  function startWorkout(routineId = null) {
    const routine = data.routines.find(r => r.id === routineId);
    if (routineId && !routine) { toast("That routine is no longer available.", true); return; }
    const currentWorkout = activeWorkout();
    if (currentWorkout && !routine) { page = "workout"; render(); return; }
    if (currentWorkout && routine) {
      if (!confirm(`Discard the unfinished "${currentWorkout.name}" workout and start "${routine.name}"?`)) return;
      data.workouts = data.workouts.filter(workout => workout.id !== currentWorkout.id);
      stopRestTimer();
    }
    const workout = { id:uid(), name:routine ? routine.name : "New workout", status:"active", startedAt:nowISO(), endedAt:null, notes:"", routineId:routine?.id || null, exercises:routine ? routine.exercises.map(item => ({ exerciseId:item.exerciseId, name:item.name, type:getExercise(item.exerciseId)?.type || "weighted", notes:"", sets:Array.from({length:Math.max(1,Math.min(20,Number(item.sets)||3))},() => createSet(item.reps || 8,item.weight || "")) })) : [] };
    data.workouts.unshift(workout); saveData(); page = "workout"; render();
  }
  function addExerciseToWorkout(exerciseId) {
    const workout = activeWorkout(), exercise = getExercise(exerciseId);
    if (!workout || !exercise) return;
    workout.exercises.push({ exerciseId:exercise.id, name:exercise.name, type:exercise.type, notes:"", sets:[createSet(exercise.type === "cardio" ? 10 : 8)] });
    saveData(); closeDialog(); render(); toast(`${exercise.name} added`);
  }
  function openExercisePicker() {
    const active = data.exercises.filter(e => !e.deleted).sort((a,b) => a.group.localeCompare(b.group) || a.name.localeCompare(b.name));
    const grouped = groups.map(group => {
      const items = active.filter(e => e.group === group);
      return items.length ? `<div class="picker-group" data-group-name="${escapeHTML(group)}">${escapeHTML(group)}</div>${items.map(e => `<div class="picker-row" data-exercise-id="${escapeHTML(e.id)}" data-exercise-name="${escapeHTML(e.name)}" data-exercise-group="${escapeHTML(e.group)}"><span class="row-icon">${e.type==="bodyweight"?"◎":e.type==="cardio"?"⌁":"◈"}</span><span class="list-row-main"><span class="list-row-title">${escapeHTML(e.name)}</span><span class="list-row-meta">${escapeHTML(e.group)}</span></span><button class="btn btn-small" data-action="pick-exercise" data-id="${escapeHTML(e.id)}">Add</button></div>`).join("")}` : "";
    }).join("");
    showDialog("Add an exercise", "Choose from your library to add it to this session.", `<div class="exercise-picker" id="picker-list">${grouped || emptyState("No exercises","Add an exercise to your library first.")}</div><div class="dialog-actions"><button class="btn" data-action="close-dialog">Done</button><button class="btn btn-primary" data-action="new-exercise" data-add-to-workout="true">＋ Create exercise</button></div>`);
  }
  function finishWorkout() {
    const workout = activeWorkout();
    if (!workout) return;
    if (!workout.exercises.length) { toast("Add at least one exercise before finishing.", true); return; }
    workout.name = document.querySelector("#workout-title")?.value.trim() || workout.name || "Workout";
    workout.status = "completed"; workout.endedAt = nowISO(); saveData(); stopRestTimer(); detailId = workout.id; page = "detail"; render(); toast("Workout complete. Nice work.");
  }

  function renderRoutines() {
    const cards = data.routines.map(r => routineCard(r)).join("");
    return `${pageHeader("MAKE IT A HABIT","Your routines","Ready-to-follow exercise plans. Start one as-is, or customize it.",`<button class="btn btn-primary" data-action="new-routine">＋ Create routine</button>`)}
      <div class="grid routine-grid">${cards || emptyState("No routines yet","Create a routine to make getting started easier.","<button class='btn btn-primary' data-action='new-routine'>Create routine</button>")}</div>
      <p class="disclaimer" style="margin-top:17px">The exercise list and suggested sets are already included. Tap Start routine to put the full plan into a new workout; adding exercises yourself is optional. You can edit these plans whenever you like.</p>`;
  }
  function routineEditor(routine = null) {
    const exercises = routine?.exercises || [];
    const options = data.exercises.filter(e => !e.deleted).map(e => `<option value="${escapeHTML(e.id)}">${escapeHTML(e.name)} · ${escapeHTML(e.group)}</option>`).join("");
    const rows = exercises.map(item => `<div class="routine-ex-row" data-routine-row><span>${escapeHTML(item.name)}</span><input class="field routine-sets" type="number" min="1" max="20" value="${escapeHTML(item.sets || 3)}" aria-label="Sets"><input class="field routine-reps" type="text" value="${escapeHTML(item.reps || 8)}" aria-label="Reps"><input class="field routine-weight" type="number" min="0" step="any" value="${escapeHTML(item.weight || "")}" placeholder="${unit()}" aria-label="Suggested weight"><input type="hidden" value="${escapeHTML(item.exerciseId)}"><button type="button" class="icon-action" data-action="remove-routine-row">×</button></div>`).join("");
    showDialog(routine ? "Edit routine" : "Create a routine", "Choose exercises and suggested starting points.", `<form id="routine-form" data-id="${escapeHTML(routine?.id || "")}"><div class="form-grid"><div class="form-field full"><label for="routine-name">Routine name</label><input class="field" id="routine-name" name="name" required maxlength="50" value="${escapeHTML(routine?.name || "")}" placeholder="e.g. Upper body A"></div><div class="form-field full"><label for="routine-description">Short description</label><input class="field" id="routine-description" name="description" maxlength="90" value="${escapeHTML(routine?.description || "")}" placeholder="What is this session focused on?"></div></div><div id="routine-rows">${rows}</div><div class="form-grid" style="grid-template-columns:1fr auto;align-items:end;margin-top:10px"><div class="form-field"><label for="routine-ex-select">Add an exercise</label><select class="select" id="routine-ex-select"><option value="">Choose exercise…</option>${options}</select></div><button type="button" class="btn" data-action="routine-add-ex">＋ Add</button></div><div class="dialog-actions"><button type="button" class="btn" data-action="close-dialog">Cancel</button><button class="btn btn-primary" type="submit">Save routine</button></div></form>`);
  }
  function addRoutineRow() {
    const select = document.querySelector("#routine-ex-select"), exercise = getExercise(select?.value);
    if (!exercise) { toast("Choose an exercise first.", true); return; }
    const rows = document.querySelector("#routine-rows");
    if ([...rows.querySelectorAll('input[type="hidden"]')].some(input => input.value === exercise.id)) { toast("That exercise is already in this routine.", true); return; }
    rows.insertAdjacentHTML("beforeend", `<div class="routine-ex-row" data-routine-row><span>${escapeHTML(exercise.name)}</span><input class="field routine-sets" type="number" min="1" max="20" value="3" aria-label="Sets"><input class="field routine-reps" type="text" value="${exercise.type==="cardio"?"10":"8"}" aria-label="Reps"><input class="field routine-weight" type="number" min="0" step="any" placeholder="${unit()}" aria-label="Suggested weight"><input type="hidden" value="${escapeHTML(exercise.id)}"><button type="button" class="icon-action" data-action="remove-routine-row">×</button></div>`);
    select.value = "";
  }
  function renderHistory() {
    const now = new Date();
    const workouts = completedWorkouts().filter(w => {
      const date = new Date(w.endedAt || w.startedAt);
      const matchesPeriod = historyPeriod === "all" || (historyPeriod === "month" && date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()) || (historyPeriod === "year" && date.getFullYear() === now.getFullYear());
      return matchesPeriod && `${w.name} ${formatDate(w.endedAt)} ${(w.exercises || []).map(e=>e.name).join(" ")}`.toLowerCase().includes(historyQuery.toLowerCase());
    });
    const rows = workouts.map(w => `<div class="table-line clickable-row" data-action="open-detail" data-id="${escapeHTML(w.id)}" data-card-action tabindex="0" role="group" aria-label="Open ${escapeHTML(w.name)} details"><div class="table-exercise"><span class="row-icon">↗</span><span><strong>${escapeHTML(w.name)}</strong><small class="list-row-meta" style="display:block">${formatDate(w.endedAt)}</small></span></div><span>${w.exercises.length} exercises</span><span>${completedSets(w)} sets</span><span>${niceDuration(durationMinutes(w))}</span><span class="table-actions"><button class="icon-action" data-action="open-detail" data-id="${escapeHTML(w.id)}" aria-label="Open workout">→</button><button class="icon-action" data-action="workout-menu" data-id="${escapeHTML(w.id)}" aria-label="Workout actions">···</button></span></div>`).join("");
    return `${pageHeader("THE WORK YOU PUT IN","Workout history","Every session is a small step forward.",`<button class="btn" data-action="export-data">↓ Export</button>`)}
      <div class="filters"><div class="search-wrap"><span class="search-icon">⌕</span><input class="search-input" id="history-search" value="${escapeHTML(historyQuery)}" placeholder="Search workouts or exercises"></div><select class="select" id="history-period" aria-label="Filter history by date"><option value="all" ${historyPeriod==="all"?"selected":""}>All time</option><option value="month" ${historyPeriod==="month"?"selected":""}>This month</option><option value="year" ${historyPeriod==="year"?"selected":""}>This year</option></select><span class="tag">${workouts.length} sessions</span></div>
      <section class="card table-card">${workouts.length ? `<div class="table-head"><span>Workout</span><span>Exercises</span><span>Sets</span><span>Duration</span><span></span></div>${rows}` : emptyState(historyQuery?"No workouts match that search":"No completed workouts yet",historyQuery?"Try another search term.":"Complete a workout and your training history will appear here.")}</section>`;
  }
  function renderDetail() {
    const w = data.workouts.find(item => item.id === detailId);
    if (!w) return `${pageHeader("HISTORY","Workout not found","This session may have been deleted.")}${emptyState("Session unavailable","Return to history to choose another workout.","<button class='btn' data-nav='history'>Back to history</button>")}`;
    const exercises = w.exercises.map(ex => {
      const bodyweight = ex.type === "bodyweight" || getExercise(ex.exerciseId)?.type === "bodyweight";
      const duration = bodyweight && isDurationExercise(ex);
      return `<section class="card" style="margin-bottom:10px"><div class="card-heading"><h2>${escapeHTML(ex.name)}</h2><button class="section-link" data-action="exercise-history" data-id="${escapeHTML(ex.exerciseId)}" data-name="${escapeHTML(ex.name)}">Exercise history →</button></div><div class="list">${ex.sets.map((s,i)=>`<div class="list-row"><span class="set-number">${String(i+1).padStart(2,"0")}</span><div class="list-row-main"><div class="list-row-title">${s.completed?"Completed":"Not completed"}</div></div><div class="row-value"><strong>${duration?`${escapeHTML(s.reps)} sec`:`${escapeHTML(s.reps)} reps${Number(s.weight)>0?` · ${escapeHTML(s.weight)} ${unit()}`:""}`}</strong></div></div>`).join("")}${ex.notes?`<div class="list-row"><div class="list-row-meta">${escapeHTML(ex.notes)}</div></div>`:""}</div></section>`;
    }).join("");
    return `${pageHeader("WORKOUT SUMMARY",escapeHTML(w.name),`${formatDate(w.endedAt || w.startedAt)} · ${niceDuration(durationMinutes(w))}`,`<div class="page-heading-actions"><button class="btn" data-nav="history">← Back to history</button><button class="btn" data-action="workout-menu" data-id="${escapeHTML(w.id)}" aria-label="Workout actions">•••</button></div>`)}
      <div class="grid detail-stats"><div class="card summary-stat"><span>Exercises</span><strong>${w.exercises.length}</strong></div><div class="card summary-stat"><span>Sets completed</span><strong>${completedSets(w)}</strong></div><div class="card summary-stat"><span>Volume</span><strong>${Math.round(volumeOf(w)).toLocaleString()} ${unit()}</strong></div></div>
      ${w.notes ? `<section class="card" style="padding:15px;margin-bottom:13px"><div class="eyebrow">WORKOUT NOTES</div><p style="font-size:11px;margin:8px 0 0">${escapeHTML(w.notes)}</p></section>` : ""}
      ${exercises || emptyState("No exercises recorded","This workout contains no exercises.")}`;
  }
  function renderExerciseHistory() {
    const name = sessionStorage.getItem("form-exercise-history-name") || "Exercise";
    const entries = completedWorkouts().flatMap(w => (w.exercises || []).filter(e => e.exerciseId === exerciseHistoryId || e.name === name).map(e => ({w,e})));
    const exercise = getExercise(exerciseHistoryId);
    const duration = isDurationExercise({name}) && (exercise?.type === "bodyweight" || entries.some(({e}) => e.type === "bodyweight"));
    const cards = entries.map(({w,e}) => `<section class="card" style="margin-bottom:10px"><div class="card-heading"><h2>${formatDate(w.endedAt)} · ${escapeHTML(w.name)}</h2><span class="muted">${niceDuration(durationMinutes(w))}</span></div><div class="list">${e.sets.map((s,i)=>`<div class="list-row"><span class="set-number">${String(i+1).padStart(2,"0")}</span><div class="list-row-main"><div class="list-row-title">${s.completed?"Completed":"Not completed"}</div></div><div class="row-value"><strong>${duration?`${escapeHTML(s.reps)} sec`:`${escapeHTML(s.weight||"BW")} ${s.weight?unit():""} × ${escapeHTML(s.reps)}`}</strong></div></div>`).join("")}</div></section>`).join("");
    const best = Math.max(0, ...entries.flatMap(({e}) => e.sets.filter(set => set.completed).map(set => duration ? Number(set.reps) || 0 : Number(set.weight) || 0)));
    const bodyweight = exercise?.type === "bodyweight" || entries.some(({e}) => e.type === "bodyweight");
    const bestLabel = duration ? `Best hold: ${best} sec` : bodyweight ? `Best set: ${best} reps` : `Best recorded load: ${best} ${unit()}`;
    return `${pageHeader("EXERCISE HISTORY",escapeHTML(name),best ? bestLabel : "Your sets for this exercise, across completed workouts.",`<button class="btn" data-nav="history">← History</button>`)}${cards || emptyState("No history yet","Completed sessions containing this exercise will appear here.")}`;
  }
  function personalRecords() {
    return window.FormDomain.personalRecords(data.workouts, data.exercises);
  }
  function recordRow(record) {
    const detail = record.metric === "weight" ? `${record.reps} reps · best load` : record.metric === "duration" ? "best hold" : "best reps";
    const value = record.metric === "weight" ? `${record.value} ${unit()}` : record.metric === "duration" ? `${record.value} sec` : `${record.value} reps`;
    return `<div class="record-row"><span class="record-medal">✦</span><span class="list-row-main"><strong>${escapeHTML(record.name)}</strong><small>${formatDate(record.date)} · ${detail}</small></span><span class="record-value">${value}<small>${record.metric === "weight" ? "best load" : record.metric === "duration" ? "best hold" : "best reps"}</small></span></div>`;
  }
  function renderProgress() {
    const records = personalRecords();
    const history = completedWorkouts();
    const totalSets = history.reduce((sum,w)=>sum+completedSets(w),0);
    const totalVolume = history.reduce((sum,w)=>sum+volumeOf(w),0);
    const exOptions = [...new Map(history.flatMap(w=>w.exercises.map(ex=>[ex.exerciseId || ex.name,{id:ex.exerciseId || ex.name,name:ex.name}]))).values()];
    const choice = exOptions.find(ex=>ex.id===exerciseHistoryId) || exOptions[0];
    if (choice) exerciseHistoryId = choice.id;
    return `${pageHeader("THE LONG VIEW","Progress","Consistency is its own kind of progress.")}
      <div class="grid stats-grid"><article class="card stat-card"><div class="stat-top"><span>Workouts</span><span class="stat-glyph">↗</span></div><div class="stat-number">${history.length}</div><div class="stat-caption">All time</div></article><article class="card stat-card"><div class="stat-top"><span>Sets completed</span><span class="stat-glyph">▦</span></div><div class="stat-number">${totalSets}</div><div class="stat-caption">All time</div></article><article class="card stat-card"><div class="stat-top"><span>Training volume</span><span class="stat-glyph">⌁</span></div><div class="stat-number">${Math.round(totalVolume).toLocaleString()}</div><div class="stat-caption">${unit()} × reps</div></article><article class="card stat-card"><div class="stat-top"><span>Personal records</span><span class="stat-glyph">✦</span></div><div class="stat-number">${records.length}</div><div class="stat-caption">Load, reps, and timed holds</div></article></div>
      <div class="grid dashboard-grid"><div class="stack"><section class="card"><div class="card-heading"><h2>Weekly training frequency</h2><span class="muted">Workouts per week · last 12 weeks</span></div><div class="week-chart"><canvas id="progress-chart" aria-label="Completed workouts per week"></canvas></div></section>
      <section class="card"><div class="card-heading"><h2>Exercise progress</h2><select class="select" id="progress-exercise" aria-label="Choose exercise">${exOptions.map(ex=>`<option value="${escapeHTML(ex.id)}" ${choice?.id===ex.id?"selected":""}>${escapeHTML(ex.name)}</option>`).join("")}</select></div><div class="week-chart"><canvas id="exercise-chart" aria-label="Exercise progress chart"></canvas></div></section></div>
      <section class="card"><div class="card-heading"><h2>Personal records</h2><span class="muted">${records.length} exercises</span></div><div>${records.length?records.map(recordRow).join(""):emptyState("No records yet","Complete sets to start tracking your best load, reps, and holds.")}</div></section></div>`;
  }
  function drawExerciseChart() {
    const canvas = document.querySelector("#exercise-chart");
    if (!canvas || !window.Chart) return;
    const selected = document.querySelector("#progress-exercise")?.value;
    const selectedExercise = data.exercises.find(exercise => exercise.id === selected);
    const exerciseEntries = completedWorkouts().slice().reverse().flatMap(workout => (workout.exercises || []).filter(exercise => (exercise.exerciseId || exercise.name) === selected).map(exercise => ({ workout, exercise })));
    const name = exerciseEntries[0]?.exercise.name;
    const bodyweight = selectedExercise?.type === "bodyweight" || exerciseEntries.some(({exercise}) => exercise.type === "bodyweight");
    const duration = bodyweight && isDurationExercise({name});
    const metric = bodyweight ? (duration ? "sec" : "reps") : unit();
    const entries = exerciseEntries.map(({workout,exercise}) => ({
      label:new Date(workout.endedAt || workout.startedAt).toLocaleDateString(undefined,{month:"short",day:"numeric"}),
      value:Math.max(0,...exercise.sets.filter(set=>set.completed).map(set=>bodyweight ? Number(set.reps)||0 : Number(set.weight)||0))
    })).filter(entry=>entry.value>0);
    const dark = data.settings.theme==="dark";
    chartInstances.push(new Chart(canvas,{type:"line",data:{labels:entries.map(entry=>entry.label),datasets:[{data:entries.map(entry=>entry.value),borderColor:"#a8d84b",backgroundColor:"rgba(168,216,75,.13)",fill:true,tension:.3,pointRadius:3,pointBackgroundColor:"#a8d84b"}]},options:{maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{displayColors:false,callbacks:{label:context=>`${context.raw} ${metric}`}}},scales:{x:{grid:{display:false},ticks:{color:dark?"#a0a297":"#858780",font:{size:9}},border:{display:false}},y:{beginAtZero:false,ticks:{color:dark?"#a0a297":"#858780",font:{size:9}},grid:{color:dark?"#343630":"#eff0eb"},border:{display:false}}}}}));
    if (name && entries.length === 0) canvas.parentElement.insertAdjacentHTML("beforeend", `<div class="disclaimer" style="text-align:center;margin-top:-12px">No completed ${bodyweight ? "bodyweight" : "weighted"} sets for ${escapeHTML(name)} yet.</div>`);
  }

  function renderLibrary() {
    const exercises = data.exercises.filter(e=>!e.deleted && (libraryGroup==="All" || e.group===libraryGroup) && `${e.name} ${e.group}`.toLowerCase().includes(libraryQuery.toLowerCase()));
    const groupsMarkup = ["All",...groups].map(group=>`<button class="btn btn-small ${libraryGroup===group?"btn-primary":""}" data-action="library-group" data-group="${escapeHTML(group)}">${escapeHTML(group)}</button>`).join("");
    return `${pageHeader("YOUR MOVEMENT MENU","Exercise library","A library that grows with your training.",`<button class="btn btn-primary" data-action="new-exercise">＋ Add exercise</button>`)}
      <div class="filters"><div class="search-wrap"><span class="search-icon">⌕</span><input class="search-input" id="library-search" value="${escapeHTML(libraryQuery)}" placeholder="Find an exercise"></div><span class="tag">${exercises.length} exercises</span></div><div class="filters">${groupsMarkup}</div>
      <div class="grid exercise-library-grid">${exercises.map(e=>`<article class="card exercise-tile clickable-card" data-action="exercise-history" data-id="${escapeHTML(e.id)}" data-name="${escapeHTML(e.name)}" data-card-action tabindex="0" role="group" aria-label="View ${escapeHTML(e.name)} history"><span><strong>${escapeHTML(e.name)}</strong><small>${escapeHTML(e.group)} · ${e.type==="bodyweight"?"Bodyweight":e.type==="cardio"?"Cardio":"Weighted"}</small></span><span class="table-actions"><button class="icon-action" data-action="exercise-history" data-id="${escapeHTML(e.id)}" data-name="${escapeHTML(e.name)}" aria-label="View exercise history">↗</button>${e.builtin ? "" : `<button class="icon-action" data-action="edit-exercise" data-id="${escapeHTML(e.id)}" aria-label="Edit exercise">✎</button><button class="icon-action" data-action="delete-exercise" data-id="${escapeHTML(e.id)}" aria-label="Delete exercise">×</button>`}</span></article>`).join("") || emptyState("No exercises found","Try a different search or muscle group.")}</div>
      <p class="disclaimer" style="margin-top:18px">Built-in exercises can’t be deleted. Removing a custom exercise hides it from the library but preserves its name and sets in workout history.</p>`;
  }
  function exerciseEditor(exercise = null) {
    showDialog(exercise?"Edit exercise":"Add a custom exercise", "Give your movement a name and muscle group.", `<form id="exercise-form" data-id="${escapeHTML(exercise?.id || "")}"><div class="form-grid"><div class="form-field full"><label for="exercise-name">Exercise name</label><input class="field" id="exercise-name" name="name" maxlength="60" required value="${escapeHTML(exercise?.name || "")}"></div><div class="form-field"><label for="exercise-group">Muscle group</label><select class="select" id="exercise-group" name="group">${groups.map(g=>`<option ${exercise?.group===g?"selected":""}>${escapeHTML(g)}</option>`).join("")}</select></div><div class="form-field"><label for="exercise-type">Tracking type</label><select class="select" id="exercise-type" name="type"><option value="weighted" ${exercise?.type==="weighted"?"selected":""}>Weighted</option><option value="bodyweight" ${exercise?.type==="bodyweight"?"selected":""}>Bodyweight</option><option value="cardio" ${exercise?.type==="cardio"?"selected":""}>Cardio</option></select></div></div><div class="dialog-actions"><button type="button" class="btn" data-action="close-dialog">Cancel</button><button class="btn btn-primary" type="submit">Save exercise</button></div></form>`);
  }

  function renderSettings() {
    const s = data.settings;
    return `${pageHeader("MAKE IT YOURS","Settings","A few small details to make Form feel like yours.")}
      <div class="grid settings-grid"><div class="stack"><section class="card settings-card"><h2>Your preferences</h2><p>These settings apply to this browser on this device.</p>
        <div class="setting-row"><span><strong>Display name</strong><small>Used to greet you on your dashboard</small></span><form id="name-form" style="display:flex;gap:6px"><input class="field" name="name" maxlength="30" value="${escapeHTML(s.displayName)}" aria-label="Display name"><button class="btn btn-small" type="submit">Save</button></form></div>
        <div class="setting-row"><span><strong>Appearance</strong><small>Choose a comfortable theme</small></span><div class="segmented"><button data-action="set-theme" data-theme="light" class="${s.theme==="light"?"selected":""}">Light</button><button data-action="set-theme" data-theme="dark" class="${s.theme==="dark"?"selected":""}">Dark</button></div></div>
        <div class="setting-row"><span><strong>Weight unit</strong><small>Used for all logged and suggested weights</small></span><div class="segmented"><button data-action="set-unit" data-unit="kg" class="${s.unit==="kg"?"selected":""}">kg</button><button data-action="set-unit" data-unit="lb" class="${s.unit==="lb"?"selected":""}">lb</button></div></div>
        <div class="setting-row"><span><strong>Default rest timer</strong><small>Quick timer duration after a set</small></span><select class="select" id="rest-duration"><option value="30" ${s.restSeconds===30?"selected":""}>30 seconds</option><option value="60" ${s.restSeconds===60?"selected":""}>1 minute</option><option value="90" ${s.restSeconds===90?"selected":""}>90 seconds</option><option value="120" ${s.restSeconds===120?"selected":""}>2 minutes</option><option value="180" ${s.restSeconds===180?"selected":""}>3 minutes</option></select></div>
      </section><section class="card settings-card"><h2>Backups & data</h2><p>Form stores your workouts locally. It does not automatically sync between devices.</p><div class="setting-actions"><button class="btn" data-action="export-data">↓ Export JSON backup</button><button class="btn" data-action="import-data">↑ Import backup</button><input type="file" id="import-file" accept="application/json,.json" hidden></div><p class="disclaimer" style="margin:12px 0 0">Importing asks whether to merge with or replace the data on this device. Export regularly if you want an extra copy.</p></section></div>
      <section class="card settings-card"><h2>Reset this device</h2><p>Remove all workouts, routines, and custom exercises stored in this browser. This cannot be undone.</p><button class="btn btn-danger" data-action="reset-data">Reset all data</button></section></div>`;
  }

  function showDialog(title, subtitle, body) {
    const dialog = document.querySelector("#app-dialog");
    document.querySelector("#dialog-content").innerHTML = `<div class="dialog-inner"><div class="dialog-head"><div><h2>${title}</h2><p>${subtitle}</p></div><button class="dialog-close" data-action="close-dialog" aria-label="Close dialog">×</button></div>${body}</div>`;
    if (!dialog.open) dialog.showModal();
  }
  function closeDialog() { const dialog=document.querySelector("#app-dialog"); addCreatedExerciseToWorkout=false; if(dialog.open) dialog.close(); }
  function routineActions(id) {
    const routine = data.routines.find(r=>r.id===id);
    if (!routine) return;
    showDialog(escapeHTML(routine.name),"What would you like to do?",`<div class="setting-actions"><button class="btn btn-primary" data-action="start-routine" data-id="${escapeHTML(id)}">Start this routine</button><button class="btn" data-action="edit-routine" data-id="${escapeHTML(id)}">Edit</button><button class="btn" data-action="duplicate-routine" data-id="${escapeHTML(id)}">Duplicate</button><button class="btn btn-danger" data-action="delete-routine" data-id="${escapeHTML(id)}">Delete</button></div>`);
  }
  function workoutActions(id) {
    const w=data.workouts.find(item=>item.id===id);
    if(!w) return;
    showDialog(escapeHTML(w.name),"Choose an action for this workout.",`<div class="setting-actions"><button class="btn btn-primary" data-action="open-detail" data-id="${escapeHTML(id)}">View details</button><button class="btn" data-action="edit-workout" data-id="${escapeHTML(id)}">Edit title & notes</button><button class="btn" data-action="repeat-workout" data-id="${escapeHTML(id)}">Repeat workout</button><button class="btn btn-danger" data-action="delete-workout" data-id="${escapeHTML(id)}">Delete workout</button></div>`);
  }
  function moveExercise(index, delta) {
    const workout=activeWorkout(), target=index+delta;
    if(!workout || target<0 || target>=workout.exercises.length) return;
    [workout.exercises[index],workout.exercises[target]]=[workout.exercises[target],workout.exercises[index]];
    closeDialog();saveData();render();
  }
  function changeUnit(nextUnit) {
    if (nextUnit === unit()) return;
    const factor = nextUnit === "lb" ? 2.2046226218 : 1 / 2.2046226218;
    for (const workout of data.workouts) for (const exercise of workout.exercises) for (const set of exercise.sets) {
      if (Number(set.weight) > 0) set.weight = String(Math.round(Number(set.weight) * factor * 10) / 10);
    }
    for (const routine of data.routines) for (const exercise of routine.exercises) {
      if (Number(exercise.weight) > 0) exercise.weight = String(Math.round(Number(exercise.weight) * factor * 10) / 10);
    }
    data.settings.unit = nextUnit;
    saveData();
    render();
  }
  function pastWorkoutEditor(workout) {
    const exercises = workout.exercises.map((exercise, exerciseIndex) => `<section class="card" style="padding:12px;margin-top:10px" data-past-exercise="${exerciseIndex}"><div class="card-heading" style="padding:0 0 8px"><h2>${escapeHTML(exercise.name)}</h2><button type="button" class="icon-action" data-action="remove-past-exercise" aria-label="Remove exercise">×</button></div>${exercise.sets.map(set => pastSetRow(set)).join("")}<button type="button" class="btn btn-small" data-action="add-past-set">＋ Add set</button></section>`).join("");
    showDialog("Edit workout", "Update the workout details and logged sets.", `<form id="past-workout-form" data-id="${escapeHTML(workout.id)}"><div class="form-field"><label>Workout name</label><input class="field" name="name" maxlength="60" required value="${escapeHTML(workout.name)}"></div><div class="form-field" style="margin-top:12px"><label>Notes</label><textarea class="field" name="notes">${escapeHTML(workout.notes||"")}</textarea></div><div id="past-exercises">${exercises}</div><div class="dialog-actions"><button type="button" class="btn" data-action="close-dialog">Cancel</button><button class="btn btn-primary">Save changes</button></div></form>`);
  }
  function pastSetRow(set) {
    return `<div class="routine-ex-row past-set-row" data-set-id="${escapeHTML(set.id)}"><input class="field past-reps" type="number" min="0" step="any" value="${escapeHTML(set.reps)}" aria-label="Reps"><input class="field past-weight" type="number" min="0" step="any" value="${escapeHTML(set.weight||"")}" placeholder="${unit()}" aria-label="Weight"><label class="tag"><input class="past-completed" type="checkbox" ${set.completed?"checked":""}> Complete</label><button type="button" class="icon-action" data-action="remove-past-set" aria-label="Remove set">×</button></div>`;
  }
  function startRestTimer() {
    stopRestTimer();
    restUntil = Date.now() + Number(data.settings.restSeconds || 90) * 1000;
    const banner = document.createElement("div"); banner.className="rest-banner"; banner.id="rest-banner"; banner.innerHTML='<span>REST TIMER</span><strong id="rest-countdown"></strong><button data-action="stop-rest">Skip</button>';
    document.body.append(banner);
    const tick=()=>{const remain=Math.max(0,Math.ceil((restUntil-Date.now())/1000));const target=document.querySelector("#rest-countdown");if(target)target.textContent=`${String(Math.floor(remain/60)).padStart(2,"0")}:${String(remain%60).padStart(2,"0")}`;if(remain<=0){stopRestTimer();toast("Rest timer complete.");}};
    tick();restInterval=setInterval(tick,250);
  }
  function stopRestTimer(){if(restInterval)clearInterval(restInterval);restInterval=null;restUntil=null;document.querySelector("#rest-banner")?.remove();}
  function exportData() {
    const blob=new Blob([JSON.stringify(createBackup(data,nowISO()),null,2)],{type:"application/json"});
    const link=document.createElement("a");link.href=URL.createObjectURL(blob);link.download=`form-backup-${new Date().toISOString().slice(0,10)}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(link.href),1000);toast("Backup exported.");
  }
  function validateImport(parsed) {
    if(!validData(parsed)) throw new Error("This file doesn’t look like a valid Form backup.");
    for(const workout of parsed.workouts) {
      if(typeof workout.name!=="string" || !["active","completed"].includes(workout.status) || !workout.exercises.every(ex=>typeof ex.name==="string" && Array.isArray(ex.sets) && ex.sets.every(set=>set && typeof set.id==="string" && Number.isFinite(Number(set.reps)) && (!set.weight || Number.isFinite(Number(set.weight)))))) throw new Error("The backup contains invalid workout or set data.");
    }
  }
  async function importFile(file) {
    try {
      if(file.size>20*1024*1024) throw new Error("Backup is larger than 20 MB.");
      const parsed=JSON.parse(await file.text());validateImport(parsed);
      showDialog("Import this backup?","Choose how it should be combined with the data already on this device.",`<form id="import-form"><label class="picker-row"><input type="radio" name="mode" value="merge" checked><span><strong>Merge</strong><small>Keep existing data and add items not already present.</small></span></label><label class="picker-row"><input type="radio" name="mode" value="replace"><span><strong>Replace</strong><small>Replace all local data with this backup.</small></span></label><p class="disclaimer">This backup contains ${parsed.workouts.length} workouts, ${parsed.routines.length} routines, and ${parsed.exercises.length} exercises.</p><div class="dialog-actions"><button type="button" class="btn" data-action="close-dialog">Cancel</button><button class="btn btn-primary">Continue</button></div></form>`);
      document.querySelector("#import-form").addEventListener("submit",event=>{event.preventDefault();const mode=new FormData(event.currentTarget).get("mode");if(mode==="replace"&&!confirm("Replace all Form data on this device? This cannot be undone."))return;
        if(mode==="merge"&&activeWorkout()&&parsed.workouts.some(workout=>workout.status==="active"&&workout.id!==activeWorkout().id)){toast("Finish or discard the current workout before merging a backup with an unfinished session.",true);return;}
        if(mode==="replace"){data={...parsed,settings:{...defaults().settings,...parsed.settings}};}
        else {data={...data,exercises:mergeById(data.exercises,parsed.exercises),routines:mergeById(data.routines,parsed.routines),workouts:mergeById(data.workouts,parsed.workouts)};}
        saveData();closeDialog();page="dashboard";render();toast(`Backup ${mode==="merge"?"merged":"restored"}.`);
      });
    } catch(error) { console.error("Backup import failed:",error);toast(error.message||"Could not read that backup file.",true); }
  }

  document.addEventListener("click", event => {
    const nav=event.target.closest("[data-nav]");
    if(nav){event.preventDefault();navTo(nav.dataset.nav);return;}
    const action=event.target.closest("[data-action]");
    if(!action)return;
    const {action:kind,id}=action.dataset;
    switch(kind){
      case "start-workout": startWorkout(); break;
      case "resume-workout": page="workout";render();break;
      case "start-routine": closeDialog();startWorkout(id);break;
      case "finish-workout": finishWorkout();break;
      case "discard-workout": if(confirm("Discard this in-progress workout? This cannot be undone.")){data.workouts=data.workouts.filter(w=>w.status!=="active");saveData();page="dashboard";render();toast("Workout discarded.");}break;
      case "add-workout-exercise": openExercisePicker();break;
      case "pick-exercise": addExerciseToWorkout(id);break;
      case "add-set": {const w=activeWorkout(),ex=w?.exercises[Number(action.dataset.ex)];if(ex){const last=ex.sets[ex.sets.length-1];ex.sets.push(createSet(last?.reps||8,last?.weight||""));saveData();render();}break;}
      case "remove-set": {const ex=activeWorkout()?.exercises[Number(action.dataset.ex)];if(ex){ex.sets.splice(Number(action.dataset.set),1);saveData();render();}break;}
      case "toggle-set": {const w=activeWorkout(),set=w?.exercises[Number(action.dataset.ex)]?.sets[Number(action.dataset.set)];if(set){set.completed=!set.completed;saveData();if(set.completed)startRestTimer();else stopRestTimer();render();}break;}
      case "move-exercise": moveExercise(Number(action.dataset.index),Number(action.dataset.delta));break;
      case "exercise-menu": {const w=activeWorkout(),ex=w?.exercises[Number(action.dataset.index)];if(ex)showDialog(escapeHTML(ex.name),"Exercise options",`<div class="setting-actions"><button class="btn" data-action="move-exercise" data-index="${action.dataset.index}" data-delta="-1">Move up</button><button class="btn" data-action="move-exercise" data-index="${action.dataset.index}" data-delta="1">Move down</button><button class="btn btn-danger" data-action="remove-exercise" data-index="${action.dataset.index}">Remove exercise</button></div>`);break;}
      case "remove-exercise": {const w=activeWorkout();if(w){w.exercises.splice(Number(action.dataset.index),1);saveData();closeDialog();render();}break;}
      case "exercise-note": {const w=activeWorkout(),ex=w?.exercises[Number(action.dataset.ex)];if(ex){const note=prompt("Add a note for this exercise:",ex.notes||"");if(note!==null){ex.notes=note;saveData();render();}}break;}
      case "workout-note": {const w=activeWorkout();if(w){const note=prompt("Add a note for this workout:",w.notes||"");if(note!==null){w.notes=note;saveData();render();}}break;}
      case "rest-timer": startRestTimer();break;
      case "stop-rest": stopRestTimer();break;
      case "new-exercise": addCreatedExerciseToWorkout=action.dataset.addToWorkout==="true";exerciseEditor();break;
      case "edit-exercise": exerciseEditor(getExercise(id));break;
      case "delete-exercise": {const ex=getExercise(id);if(ex&&confirm(`Remove "${ex.name}" from your library? Its workout history will be preserved.`)){ex.deleted=true;saveData();render();toast("Exercise removed from library.");}break;}
      case "library-group": libraryGroup=action.dataset.group;render();break;
      case "new-routine": routineEditor();break;
      case "edit-routine": {const r=data.routines.find(item=>item.id===id);if(r)routineEditor(r);break;}
      case "routine-menu": routineActions(id);break;
      case "routine-add-ex": addRoutineRow();break;
      case "remove-routine-row": action.closest("[data-routine-row]")?.remove();break;
      case "duplicate-routine": {const r=data.routines.find(item=>item.id===id);if(r){data.routines.push({...r,id:uid(),name:`${r.name} copy`,exercises:r.exercises.map(ex=>({...ex}))});saveData();closeDialog();render();toast("Routine duplicated.");}break;}
      case "delete-routine": {const r=data.routines.find(item=>item.id===id);if(r&&confirm(`Delete "${r.name}"? Existing workouts will not be affected.`)){data.routines=data.routines.filter(item=>item.id!==id);saveData();closeDialog();render();toast("Routine deleted.");}break;}
      case "open-detail": detailId=id;page="detail";closeDialog();render();break;
      case "workout-menu": workoutActions(id);break;
      case "repeat-workout": {const w=data.workouts.find(item=>item.id===id);closeDialog();if(w){if(activeWorkout()){if(!confirm("A workout is already in progress. Discard it and start this repeat?"))break;data.workouts=data.workouts.filter(item=>item.status!=="active");saveData();}const copy={...w,id:uid(),status:"active",startedAt:nowISO(),endedAt:null,notes:"",exercises:w.exercises.map(ex=>({...ex,sets:ex.sets.map(s=>createSet(s.reps,s.weight))}))};data.workouts.unshift(copy);saveData();page="workout";render();}break;}
      case "edit-workout": {const w=data.workouts.find(item=>item.id===id);if(w)pastWorkoutEditor(w);break;}
      case "add-past-set": {const exercise=action.closest("[data-past-exercise]");exercise?.querySelector("[data-action=\"add-past-set\"]")?.insertAdjacentHTML("beforebegin",pastSetRow(createSet()));break;}
      case "remove-past-set": action.closest(".past-set-row")?.remove();break;
      case "remove-past-exercise": action.closest("[data-past-exercise]")?.remove();break;
      case "delete-workout": {if(confirm("Delete this workout from your history? This cannot be undone.")){data.workouts=data.workouts.filter(w=>w.id!==id);saveData();closeDialog();page="history";render();toast("Workout deleted.");}break;}
      case "exercise-history": exerciseHistoryId=id;sessionStorage.setItem("form-exercise-history-name",action.dataset.name||getExercise(id)?.name||"Exercise");page="exerciseHistory";render();break;
      case "set-theme": data.settings.theme=action.dataset.theme;saveData();render();break;
      case "set-unit": changeUnit(action.dataset.unit);break;
      case "export-data": exportData();break;
      case "import-data": document.querySelector("#import-file")?.click();break;
      case "reset-data": if(confirm("Reset all Form data on this device? This permanently removes your workouts, routines, and custom exercises.")){data=defaults();saveData();page="dashboard";render();toast("Form data has been reset.");}break;
      case "close-dialog": closeDialog();break;
    }
  });
  document.addEventListener("keydown", event => {
    if (!["Enter", " "].includes(event.key)) return;
    const card = event.target.closest("[data-card-action]");
    if (!card || event.target !== card) return;
    event.preventDefault();
    card.click();
  });
  document.addEventListener("input", event => {
    const target=event.target;
    if(target.id==="workout-title"){const w=activeWorkout();if(w){w.name=target.value;saveData();}}
    if(target.id==="workout-notes"){const w=activeWorkout();if(w){w.notes=target.value;saveData();}}
    if(target.id==="history-search"){historyQuery=target.value;const cursor=target.selectionStart;render();const input=document.querySelector("#history-search");input?.focus();input?.setSelectionRange(cursor,cursor);}
    if(target.id==="library-search"){libraryQuery=target.value;const cursor=target.selectionStart;render();const input=document.querySelector("#library-search");input?.focus();input?.setSelectionRange(cursor,cursor);}
    if(target.dataset.field==="reps"||target.dataset.field==="weight"){const ex=activeWorkout()?.exercises[Number(target.dataset.ex)],set=ex?.sets[Number(target.dataset.set)];if(set){set[target.dataset.field]=target.value;saveData();}}
    if(target.dataset.field==="exercise-note"){const ex=activeWorkout()?.exercises[Number(target.dataset.ex)];if(ex){ex.notes=target.value;saveData();}}
  });
  document.addEventListener("change", event => {
    const target=event.target;
    if(target.id==="rest-duration"){data.settings.restSeconds=Number(target.value);saveData();toast("Rest timer preference saved.");}
    if(target.id==="import-file"&&target.files?.[0]){importFile(target.files[0]);target.value="";}
    if(target.id==="progress-exercise"){exerciseHistoryId=target.value;render();}
    if(target.id==="history-period"){historyPeriod=target.value;render();}
    if(target.dataset.field==="reps"||target.dataset.field==="weight")render();
  });
  document.addEventListener("submit", event => {
    const form=event.target;
    if(form.id==="exercise-form"){event.preventDefault();const values=new FormData(form),id=form.dataset.id;const current=id?getExercise(id):null;const item={id:id||uid(),name:String(values.get("name")).trim(),group:String(values.get("group")),type:String(values.get("type")),builtin:false,deleted:false};if(current)Object.assign(current,item);else data.exercises.push(item);const addedToWorkout=!current&&addCreatedExerciseToWorkout&&!!activeWorkout();if(addedToWorkout)activeWorkout().exercises.push({exerciseId:item.id,name:item.name,type:item.type,notes:"",sets:[createSet(item.type==="cardio"?10:8)]});addCreatedExerciseToWorkout=false;saveData();closeDialog();render();toast(current?"Exercise updated.":addedToWorkout?"Exercise added to workout.":"Exercise added.");}
    if(form.id==="routine-form"){event.preventDefault();const values=new FormData(form),rows=[...form.querySelectorAll("[data-routine-row]")];const items=rows.map(row=>{const exerciseId=row.querySelector('input[type="hidden"]').value,exercise=getExercise(exerciseId);return {exerciseId,name:exercise?.name||row.querySelector("span").textContent,sets:Math.max(1,Math.min(20,Number(row.querySelector(".routine-sets").value)||3)),reps:row.querySelector(".routine-reps").value||8,weight:row.querySelector(".routine-weight").value||""};});const id=form.dataset.id,current=id?data.routines.find(r=>r.id===id):null;const item={id:id||uid(),name:String(values.get("name")).trim(),description:String(values.get("description")).trim(),exercises:items};if(current)Object.assign(current,item);else data.routines.push(item);saveData();closeDialog();render();toast(current?"Routine updated.":"Routine created.");}
    if(form.id==="name-form"){event.preventDefault();const value=String(new FormData(form).get("name")).trim();if(value){data.settings.displayName=value;saveData();render();toast("Display name updated.");}}
    if(form.id==="past-workout-form"){event.preventDefault();const w=data.workouts.find(item=>item.id===form.dataset.id);if(w){const values=new FormData(form);w.name=String(values.get("name")).trim();w.notes=String(values.get("notes")||"");w.exercises=[...form.querySelectorAll("[data-past-exercise]")].map(section=>{const oldExercise=w.exercises[Number(section.dataset.pastExercise)];return {...oldExercise,sets:[...section.querySelectorAll(".past-set-row")].map(row=>({id:row.dataset.setId,reps:row.querySelector(".past-reps").value,weight:row.querySelector(".past-weight").value,completed:row.querySelector(".past-completed").checked}))};});saveData();closeDialog();render();toast("Workout updated.");}}
  });
  document.querySelector(".theme-toggle").addEventListener("click",()=>{data.settings.theme=data.settings.theme==="dark"?"light":"dark";saveData();render();});
  document.querySelector("#app-dialog").addEventListener("click",event=>{if(event.target===event.currentTarget)closeDialog();});
  window.addEventListener("storage",event=>{if(event.key===STORAGE_KEY){data=loadData();render();}});
  setInterval(()=>{if(page==="workout"){const duration=document.querySelector("#workout-duration");if(duration){const w=activeWorkout();duration.textContent=w?niceDuration(durationMinutes(w)):"";}}},15000);
  if("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("./service-worker.js").catch(error=>console.warn("Offline support could not be registered:",error));
  setTheme();setProfile();render();
})();
