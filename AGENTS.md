# Exercaise Web — Agent Instructions

## Mandatory: Run Tests

After ANY code change (new feature, refactor, bug fix, dependency update, etc.), you MUST:

1. Run `npm test` and verify all tests pass
2. If any test fails — fix the issue before proceeding
3. If you changed behavior — update or add corresponding tests

Never consider a task complete until tests are green.

## Project Overview

- React 19 + TypeScript + Vite workout player app
- State management: Zustand
- Test stack: Vitest + @testing-library/react + jsdom
- **Use Bun instead of npm** for running scripts (faster)
- Run dev server: `bun run dev`
- Run tests: `bun run test` (uses vitest via package.json script; `bun test` won't work — no jsdom)
- Run tests in watch mode: `bun run test:watch`
- Run with coverage: `bun run vitest run --coverage`

## Project Structure

```
src/
  features/workout/
    model/       — types, validation, mappers, tts, usePlayerState hook
    store/       — Zustand workout store
    components/  — WorkoutList, ExerciseList, WorkoutPlayer
  shared/
    ui/          — Button, Card, IconButton
    storage/     — localStorage wrapper
    tts/         — TTS engine abstraction (WebSpeech, espeak-ng)
    sound/       — AudioContext sound cues
  test/          — test setup (polyfills for Node 25 + jsdom)
```

## Test Conventions

- Test files live next to source: `Component.tsx` → `Component.test.tsx`
- Mock Web APIs (AudioContext, SpeechSynthesis) — jsdom doesn't provide them
- Use `vi.useFakeTimers()` for timer-based logic (usePlayerState)
- Use `localStorage.removeItem(key)` instead of `localStorage.clear()` (Node 25 compat)
