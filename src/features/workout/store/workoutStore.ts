import { create } from 'zustand';
import type { Workout } from '../model/types';
import { importWorkout } from '../model/importWorkout';
import { defaultWorkouts } from '../model/defaultWorkouts';
import { loadOrSeedWorkouts, addWorkout as storageAdd, removeWorkout as storageRemove, updateWorkout as storageUpdate } from '../../../shared/storage/workoutStorage';

interface WorkoutStore {
  workouts: Workout[];
  playerExerciseIndex: number | null;
  setPlayerExerciseIndex: (index: number | null) => void;
  startFromExerciseIndex: number | null;
  setStartFromExerciseIndex: (index: number | null) => void;
  isFullscreen: boolean;
  toggleFullscreen: () => void;
  setFullscreen: (value: boolean) => void;
  exerciseDrawerOpen: boolean;
  setExerciseDrawerOpen: (open: boolean) => void;
  loadFromStorage: () => void;
  addWorkout: (workout: Workout) => void;
  importFromJson: (json: string) => Workout;
  importFromFile: (file: File) => Promise<Workout>;
  remove: (id: string) => void;
  update: (id: string, workout: Workout) => void;
}

export const useWorkoutStore = create<WorkoutStore>((set, get) => ({
  workouts: [],
  playerExerciseIndex: null,
  setPlayerExerciseIndex: (index) => set({ playerExerciseIndex: index }),
  startFromExerciseIndex: null,
  setStartFromExerciseIndex: (index) => set({ startFromExerciseIndex: index }),
  isFullscreen: false,
  toggleFullscreen: () => set((s) => ({ isFullscreen: !s.isFullscreen })),
  setFullscreen: (value) => set({ isFullscreen: value }),
  exerciseDrawerOpen: false,
  setExerciseDrawerOpen: (open) => set({ exerciseDrawerOpen: open }),

  loadFromStorage: () => {
    set({ workouts: loadOrSeedWorkouts(defaultWorkouts) });
  },

  addWorkout: (workout: Workout) => {
    const updated = storageAdd(workout, get().workouts);
    set({ workouts: updated });
  },

  importFromJson: (json: string) => {
    const workout = importWorkout(json);
    const updated = storageAdd(workout, get().workouts);
    set({ workouts: updated });
    return workout;
  },

  importFromFile: async (file: File) => {
    const text = await file.text();
    const workout = importWorkout(text);
    const updated = storageAdd(workout, get().workouts);
    set({ workouts: updated });
    return workout;
  },

  remove: (id: string) => {
    const updated = storageRemove(id, get().workouts);
    set({ workouts: updated });
  },

  update: (id: string, workout: Workout) => {
    const updated = storageUpdate(id, workout, get().workouts);
    set({ workouts: updated });
  },
}));
