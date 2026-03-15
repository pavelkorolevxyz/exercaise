export interface ExerciseTempo {
  /** Seconds for the concentric/lowering phase */
  to: number;
  /** Seconds to hold at the bottom/mid position */
  hold: number;
  /** Seconds for the eccentric/lifting phase */
  from: number;
}

export interface Exercise {
  title: string;
  description?: string;
  repeatCount: number;
  setCount: number;
  restSeconds: number;
  tempo?: ExerciseTempo;
}

export interface Workout {
  id: string;
  title: string;
  exercises: Exercise[];
}

/** JSON DTO matching the schema from the Android app */
export interface WorkoutDto {
  title: string;
  exercises: ExerciseDtoItem[];
}

export interface ExerciseDtoItem {
  title: string;
  description?: string;
  repeat_count: number;
  set_count: number;
  rest_seconds?: number;
  tempo?: {
    to?: number;
    hold?: number;
    from?: number;
  };
}
