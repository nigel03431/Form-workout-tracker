(() => {
  "use strict";

  const results = document.querySelector("#results");
  const cases = [];
  const assert = (condition, message) => {
    if (!condition) throw new Error(message);
  };
  const test = (name, run) => {
    try {
      run();
      cases.push({ name, passed: true });
    } catch (error) {
      cases.push({ name, passed: false, error: error.message });
    }
  };
  const completed = (id, exercises, status = "completed") => ({
    id, name: id, status, startedAt: "2026-01-01T10:00:00.000Z", endedAt: "2026-01-01T11:00:00.000Z", exercises
  });
  const set = (reps, weight = "", done = true, id = "set") => ({ id, reps, weight, completed: done });

  test("Counts only completed sets", () => {
    const workout = completed("count", [{ sets: [set(8, 10, true), set(8, 10, false), set(5, "", true)] }]);
    assert(FormDomain.completedSets(workout) === 2, "Incomplete sets must not be counted.");
  });

  test("Calculates weighted volume and excludes incomplete/bodyweight sets", () => {
    const workout = completed("volume", [{ sets: [set(8, 20), set(10, 5), set(12, "", true), set(8, 100, false)] }]);
    assert(FormDomain.volumeOf(workout) === 210, "Expected (8×20) + (10×5) = 210.");
  });

  test("Tracks weighted load personal records", () => {
    const workouts = [
      completed("older", [{ exerciseId: "bench", name: "Bench Press", type: "weighted", sets: [set(8, 40, true, "b1")] }]),
      completed("newer", [{ exerciseId: "bench", name: "Bench Press", type: "weighted", sets: [set(5, 50, true, "b2"), set(10, 60, false, "b3")] }]),
      completed("active", [{ exerciseId: "bench", name: "Bench Press", type: "weighted", sets: [set(1, 200, true, "b4")] }], "active")
    ];
    const record = FormDomain.personalRecords(workouts)[0];
    assert(record.metric === "weight" && record.value === 50, "Only the highest completed load from completed workouts is a record.");
  });

  test("Tracks bodyweight rep records and plank duration records", () => {
    const workouts = [
      completed("bw1", [
        { exerciseId: "push", name: "Push-Up", type: "bodyweight", sets: [set(12), set(15, "", true, "p2")] },
        { exerciseId: "plank", name: "Plank", type: "bodyweight", sets: [set(45), set(60, "", true, "pl2")] }
      ]),
      completed("bw2", [
        { exerciseId: "push", name: "Push-Up", type: "bodyweight", sets: [set(20, "", false)] },
        { exerciseId: "plank", name: "Plank", type: "bodyweight", sets: [set(90, "", false, "pl3")] }
      ])
    ];
    const records = FormDomain.personalRecords(workouts);
    assert(records.find(record => record.id === "push")?.value === 15, "Push-Up record should be 15 completed reps.");
    assert(records.find(record => record.id === "plank")?.metric === "duration", "Plank should be recorded as a timed hold.");
    assert(records.find(record => record.id === "plank")?.value === 60, "Plank record should be the best completed duration.");
  });

  test("Validates backup structure and rejects multiple active workouts", () => {
    const backup = { version: 1, settings: {}, exercises: [], routines: [], workouts: [completed("ok", [])] };
    assert(FormDomain.validData(backup), "A valid completed workout backup should pass.");
    backup.workouts.push(completed("active1", [], "active"), completed("active2", [], "active"));
    assert(!FormDomain.validData(backup), "A backup with multiple active workouts should fail.");
  });

  test("Merges backup items without overwriting matching IDs", () => {
    const merged = FormDomain.mergeById([{ id: "same", name: "Local" }, { id: "local" }], [{ id: "same", name: "Backup" }, { id: "incoming" }]);
    assert(merged.length === 3, "Merge should preserve existing IDs and add new IDs once.");
    assert(merged.find(item => item.id === "same").name === "Local", "Existing data should not be overwritten by a matching backup ID.");
  });

  test("Creates an export envelope without mutating local data", () => {
    const data = { version: 1, workouts: [{ id: "keep" }] };
    const backup = FormDomain.createBackup(data, "2026-01-01T00:00:00.000Z");
    assert(backup.exportedAt === "2026-01-01T00:00:00.000Z", "The backup timestamp should be included.");
    assert(data.exportedAt === undefined && backup.workouts === data.workouts, "Export should preserve the existing data object unchanged.");
  });

  const passed = cases.filter(result => result.passed).length;
  document.querySelector("#summary").textContent = `${passed}/${cases.length} checks passed`;
  for (const result of cases) {
    const item = document.createElement("li");
    item.className = result.passed ? "pass" : "fail";
    item.textContent = result.passed ? `PASS — ${result.name}` : `FAIL — ${result.name}: ${result.error}`;
    results.append(item);
  }
  document.documentElement.dataset.testStatus = passed === cases.length ? "passed" : "failed";
})();
