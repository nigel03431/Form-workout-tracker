(() => {
  "use strict";

  function completedSets(workout) {
    return (workout.exercises || []).reduce((total, exercise) => total + (exercise.sets || []).filter(set => set.completed).length, 0);
  }

  function volumeOf(workout) {
    return (workout.exercises || []).reduce((total, exercise) => total + (exercise.sets || []).filter(set => set.completed && Number(set.weight) > 0)
      .reduce((sum, set) => sum + Number(set.weight) * Number(set.reps || 0), 0), 0);
  }

  function isDurationExercise(exercise) {
    return /plank|wall sit|hold/i.test(exercise.name || "");
  }

  function personalRecords(workouts, exercises = []) {
    const exerciseTypes = new Map(exercises.map(exercise => [exercise.id, exercise.type]));
    const records = new Map();
    for (const workout of workouts.filter(item => item.status === "completed")) {
      for (const exercise of workout.exercises || []) {
        const key = exercise.exerciseId || exercise.name;
        const type = exercise.type || exerciseTypes.get(exercise.exerciseId) || "weighted";
        for (const set of exercise.sets || []) {
          if (!set.completed) continue;
          const weight = Number(set.weight) || 0;
          const metric = type === "bodyweight" ? (isDurationExercise(exercise) ? "duration" : "reps") : "weight";
          const value = metric === "weight" ? weight : Number(set.reps) || 0;
          if (!(value > 0)) continue;
          const current = records.get(key);
          if (!current || value > current.value) {
            records.set(key, {
              id: key,
              name: exercise.name,
              metric,
              value,
              reps: metric === "weight" ? Number(set.reps) || 0 : undefined,
              date: workout.endedAt || workout.startedAt,
              workoutId: workout.id
            });
          }
        }
      }
    }
    return [...records.values()].sort((a, b) => a.metric.localeCompare(b.metric) || b.value - a.value);
  }

  function validData(data) {
    return data && typeof data === "object" && data.version === 1 && data.settings && Array.isArray(data.exercises) && Array.isArray(data.routines) && Array.isArray(data.workouts)
      && data.exercises.every(exercise => exercise && typeof exercise.id === "string" && typeof exercise.name === "string" && typeof exercise.group === "string")
      && data.routines.every(routine => routine && typeof routine.id === "string" && typeof routine.name === "string" && Array.isArray(routine.exercises))
      && data.workouts.filter(workout => workout?.status === "active").length <= 1
      && data.workouts.every(workout => workout && typeof workout.id === "string" && typeof workout.name === "string" && ["active", "completed"].includes(workout.status)
        && Number.isFinite(Date.parse(workout.startedAt)) && (!workout.endedAt || Number.isFinite(Date.parse(workout.endedAt)))
        && Array.isArray(workout.exercises) && workout.exercises.every(exercise => exercise && typeof exercise.name === "string" && Array.isArray(exercise.sets)
          && exercise.sets.every(set => set && typeof set.id === "string" && Number.isFinite(Number(set.reps)) && (!set.weight || Number.isFinite(Number(set.weight))))));
  }

  function mergeById(existing, incoming) {
    const items = new Map(existing.map(item => [item.id, item]));
    incoming.forEach(item => {
      if (!items.has(item.id)) items.set(item.id, item);
    });
    return [...items.values()];
  }

  function createBackup(data, exportedAt) {
    return { ...data, exportedAt };
  }

  window.FormDomain = Object.freeze({ completedSets, volumeOf, isDurationExercise, personalRecords, validData, mergeById, createBackup });
})();
