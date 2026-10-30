# FitTrack — Development Plan

## Overview

FitTrack is a beginner-friendly, fully client-side fitness tracking web application built with Next.js (Pages Router), TypeScript, and Tailwind CSS. All data is stored in `localStorage` using a custom hook so there is no backend to configure or database to set up. A rule-based AI Fitness Assistant pattern-matches user questions against live local state to generate helpful responses without any external API.

The plan is split into seven sequential phases, each described as an independent sub-task. Each sub-task is small enough to be reviewed before the next one begins.

---

## Objectives

- Deliver all ten core features described in the requirements brief
- Keep every file short, readable, and approachable for beginners
- Avoid over-engineering: no Redux, no ORM, no authentication
- Demonstrate Bob features (Ask, Plan, Agent modes; Skills; Hooks; Testing)

---

## Recommended Technology Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 14 (Pages Router) | Beginner-friendly file-based routing |
| Language | TypeScript | Type safety with minimal ceremony |
| Styling | Tailwind CSS | Utility-first, no separate CSS files |
| Charts | Recharts | Simple React-native chart components |
| Icons | Lucide React | Lightweight, consistent icon set |
| Storage | localStorage (custom hook) | Zero config, offline, easy to understand |
| Testing | Jest + React Testing Library | Industry standard, integrates with Next.js |
| Linting | ESLint + Prettier | Standard Next.js defaults |

---

## Application Architecture

```
fittrack/
├── pages/                  # Next.js Pages Router
│   ├── _app.tsx            # Global layout, theme provider, data context
│   ├── index.tsx           # Dashboard
│   ├── workouts/
│   │   ├── index.tsx       # Workout list + add workout
│   │   └── [id].tsx        # Edit workout
│   ├── goals.tsx           # Fitness goals
│   ├── progress.tsx        # Progress charts
│   ├── history.tsx         # Workout history with search/filter
│   └── assistant.tsx       # AI Fitness Assistant
├── components/
│   ├── layout/             # AppLayout, Sidebar, TopNav, ThemeToggle
│   ├── dashboard/          # StatsCard, TodayWorkout, WeeklyProgress, RecentWorkouts
│   ├── workouts/           # WorkoutForm, WorkoutCard, WorkoutList
│   ├── goals/              # GoalForm, GoalCard, GoalProgress
│   ├── progress/           # ProgressChart, StatsSummary
│   ├── history/            # HistoryTable, SearchBar, FilterBar
│   ├── assistant/          # ChatWindow, MessageBubble, InputBar
│   └── ui/                 # Button, Card, Badge, ProgressBar, EmptyState, LoadingSpinner, Modal
├── lib/
│   ├── types.ts            # All TypeScript interfaces
│   ├── storage.ts          # localStorage read/write helpers
│   ├── useAppData.ts       # Central data hook (workouts + goals)
│   ├── assistantEngine.ts  # Rule-based response engine
│   └── utils.ts            # Date helpers, calorie formatters, etc.
├── context/
│   └── AppContext.tsx      # React context wrapping useAppData
├── styles/
│   └── globals.css         # Tailwind base + dark mode CSS variables
└── __tests__/              # Jest + RTL test files
```

---

## Pages and Routes

| Route | Page | Description |
|---|---|---|
| `/` | Dashboard | Summary cards, today's workout, weekly progress, recent workouts |
| `/workouts` | Workout Tracker | List all workouts, add new workout |
| `/workouts/[id]` | Edit Workout | Edit or delete a single workout |
| `/goals` | Fitness Goals | Create, view, complete, and delete goals |
| `/progress` | Progress | Charts and stats over time |
| `/history` | Workout History | Searchable, filterable list of all past workouts |
| `/assistant` | AI Assistant | Chat interface for fitness questions |

---

## Data Models

### Workout

```ts
interface Workout {
  id: string;
  name: string;
  type: 'Strength' | 'Cardio' | 'Running' | 'Cycling' | 'Yoga' | 'Other';
  duration: number;          // minutes
  sets?: number;
  reps?: number;
  caloriesBurned: number;
  date: string;              // ISO date string YYYY-MM-DD
  completed: boolean;
  notes?: string;
  createdAt: string;         // ISO timestamp
}
```

### Goal

```ts
interface Goal {
  id: string;
  title: string;
  description: string;
  targetValue: number;
  currentValue: number;
  unit: string;              // 'workouts', 'km', 'minutes'
  period: 'weekly' | 'monthly' | 'total';
  completed: boolean;
  createdAt: string;
  completedAt?: string;
}
```

### AppState (localStorage schema)

```ts
interface AppState {
  workouts: Workout[];
  goals: Goal[];
}
```

### ChatMessage

```ts
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
```

---

## Feature Breakdown

### 1. Dashboard
- Display four summary stat cards: workouts completed, total duration, total calories, active goals
- Show today's workout (filter workouts by today's date)
- Show weekly progress bar per active goal
- Show last five workouts as a "Recent Workouts" list

### 2. Workout Tracker
- WorkoutForm with: name, type (select), duration, sets (optional), reps (optional), calories, date, completed toggle, notes
- Inline form validation: required fields highlighted, numeric fields reject non-numbers
- WorkoutCard displays all fields; has Edit and Delete actions
- Edit route `/workouts/[id]` pre-populates the form

### 3. Fitness Goals
- GoalForm with: title, description, target value, unit, period
- GoalCard shows progress bar = (currentValue / targetValue) × 100
- Manual "Mark as Complete" button
- Deleting a goal removes it from all views

### 4. Progress Page
- Weekly bar chart: workouts per week for last 8 weeks (Recharts BarChart)
- Line chart: calories burned per week for last 8 weeks (Recharts LineChart)
- Summary cards: this-week totals for workouts, duration, calories
- Completed goals count

### 5. Workout History
- Full table/list of all workouts sorted by date descending
- Search box filters by workout name (case-insensitive)
- Type filter dropdown
- Date range filter (from / to)
- Empty state when no results match

### 6. AI Fitness Assistant
- Chat interface with message history stored in component state (session only, not persisted)
- Rule-based engine in `assistantEngine.ts` receives user message + current AppState
- Engine matches against a set of intent patterns (regex or keyword arrays)
- Each matched intent executes a data query and returns a formatted string response
- Unrecognised questions return a helpful fallback message listing what the assistant can answer
- Suggested question chips shown on first load to guide new users

### 7. Responsive Design and Theming
- Sidebar collapses to a bottom nav on mobile (Tailwind `md:` breakpoints)
- Dark mode via Tailwind's `class` strategy — toggled by a ThemeToggle button stored in localStorage
- All layouts use CSS grid and flexbox via Tailwind utilities

---

## Component Structure

### Layout Components
- `AppLayout` — wraps every page; renders Sidebar + TopNav + `{children}`
- `Sidebar` — logo, nav links with active state, collapse button on desktop
- `TopNav` — page title, ThemeToggle, optional breadcrumb
- `ThemeToggle` — sun/moon icon button that flips dark class on `<html>`

### UI Primitives
- `Button` — variants: primary, secondary, danger, ghost
- `Card` — white/dark surface with shadow and rounded corners
- `Badge` — coloured pill for workout type labels
- `ProgressBar` — animated filled bar, accepts value 0–100
- `EmptyState` — centred icon + message + optional CTA button
- `LoadingSpinner` — used while localStorage hydration completes
- `Modal` — accessible dialog for delete confirmations

### Dashboard Components
- `StatsCard` — icon, label, value, optional trend
- `TodayWorkout` — list of today's workouts or EmptyState
- `WeeklyProgress` — one ProgressBar per active goal
- `RecentWorkouts` — last five workouts as compact rows

### Workout Components
- `WorkoutForm` — controlled form, accepts initial values for edit mode
- `WorkoutCard` — full display card with edit/delete actions
- `WorkoutList` — maps over workouts and renders WorkoutCards

### Goal Components
- `GoalForm` — controlled form for creating a goal
- `GoalCard` — progress bar, complete/delete actions
- `GoalList` — maps over goals

### Progress Components
- `WeeklyBarChart` — Recharts BarChart wrapper
- `CaloriesLineChart` — Recharts LineChart wrapper
- `StatsSummary` — row of summary cards

### History Components
- `HistoryTable` — sortable table of all workouts
- `SearchBar` — controlled text input
- `FilterBar` — type dropdown + date range pickers

### Assistant Components
- `ChatWindow` — scrollable message list
- `MessageBubble` — styled bubble for user vs assistant messages
- `InputBar` — textarea + send button
- `SuggestedQuestions` — chip buttons for common queries

---

## AI Assistant Architecture

The assistant is entirely client-side. No network requests are made.

### Intent Catalogue

| Intent | Trigger Keywords | Data Query |
|---|---|---|
| weekly_workout_count | "this week", "workouts", "how many" | Count workouts with date in current week |
| total_duration | "time", "minutes", "hours", "duration" | Sum duration of all or this-week workouts |
| calories_burned | "calories", "burn" | Sum caloriesBurned for period |
| recent_workouts | "recent", "last", "show my workouts" | Return last N workouts as formatted list |
| goal_progress | "goal", "progress", "target" | Find active goals, return progress % |
| workout_suggestion | "suggest", "recommend", "what should I do" | Return a static beginner workout template |
| completion_rate | "completion", "completed", "streak" | Count completed vs total workouts |

### Engine Flow

1. Normalise input to lowercase, strip punctuation
2. Iterate intent catalogue; first match wins
3. Execute the matched data query against current AppState
4. Format and return a human-readable string
5. If no match: return fallback listing available topics

---

## API Requirements

FitTrack has no external API. All data operations are implemented as functions in `storage.ts` and exposed through `useAppData.ts`:

| Function | Description |
|---|---|
| `getWorkouts()` | Read workouts array from localStorage |
| `saveWorkouts(workouts)` | Persist entire workouts array |
| `getGoals()` | Read goals array from localStorage |
| `saveGoals(goals)` | Persist entire goals array |
| `addWorkout(workout)` | Append and save |
| `updateWorkout(id, updates)` | Find, merge, and save |
| `deleteWorkout(id)` | Filter out and save |
| `addGoal(goal)` | Append and save |
| `updateGoal(id, updates)` | Find, merge, and save |
| `deleteGoal(id)` | Filter out and save |

---

## Skills That Could Be Created

| Skill Name | Purpose |
|---|---|
| `add-workout-form` | Instructions for Bob to generate a new validated workout form component |
| `add-chart` | Instructions for adding a new Recharts chart to the Progress page |
| `add-assistant-intent` | Step-by-step guide for adding a new AI intent to `assistantEngine.ts` |
| `add-goal-type` | Guide for extending the Goal model with a new goal period or unit |

---

## Hooks That Could Be Used

| Event | Hook Action | Example |
|---|---|---|
| Session start | POST to local log | Record when a dev session begins on FitTrack |
| After stop | Run `npm run lint` | Automatically lint changed files after every Bob response |
| After stop | Run `npm test -- --passWithNoTests` | Run test suite after every code change |
| Before prompt | Inject file context | Prepend active file content to every prompt for better suggestions |

---

## Development Phases

### Phase 1 — Project Scaffold
Set up the Next.js + TypeScript + Tailwind project with the full directory structure, global styles, dark mode, AppContext, and localStorage layer. Add seed data so every page renders meaningfully from the first run.

### Phase 2 — Layout and Navigation
Build AppLayout, Sidebar, TopNav, and ThemeToggle. Implement responsive collapse behaviour. Confirm all routes render with the shared layout before building any feature pages.

### Phase 3 — Core Data Layer
Implement all TypeScript types, `storage.ts` helpers, and `useAppData` hook. Write unit tests for the storage functions and the hook.

### Phase 4 — Workout Tracker
Build WorkoutForm, WorkoutCard, WorkoutList, and the `/workouts` and `/workouts/[id]` pages with full CRUD, form validation, and confirmation modal for delete.

### Phase 5 — Goals and Dashboard
Build GoalForm, GoalCard, and the `/goals` page. Then build all Dashboard components using real data from the data hook.

### Phase 6 — Progress, History, and Assistant
Build the Progress page (charts + summary), History page (search + filter), and the AI Assistant page (chat UI + rule engine).

### Phase 7 — Testing, Polish, and Documentation
Write all Jest + RTL tests. Fix responsiveness issues. Add empty states and loading states everywhere. Write a README. Add a sample `.bob/hooks` config demonstrating post-stop linting.

---

## Task Breakdown by Phase

### Phase 1 — Project Scaffold

- [ ] Initialise Next.js 14 project with TypeScript and Tailwind CSS
- [ ] Configure `tailwind.config.ts` for `darkMode: 'class'` and custom colour palette
- [ ] Create `styles/globals.css` with Tailwind directives and CSS variables for dark mode
- [ ] Create full directory skeleton (all folders, empty index files)
- [ ] Create `lib/types.ts` with Workout, Goal, AppState, ChatMessage interfaces
- [ ] Create `lib/storage.ts` with all read/write helpers
- [ ] Create `context/AppContext.tsx` with seed data (5 workouts, 2 goals)
- [ ] Wire AppContext into `pages/_app.tsx`
- [ ] Verify `npm run dev` starts with no TypeScript errors

### Phase 2 — Layout and Navigation

- [ ] Build `ui/Button`, `ui/Card`, `ui/Badge`, `ui/ProgressBar`, `ui/EmptyState`, `ui/LoadingSpinner`, `ui/Modal` primitives
- [ ] Build `layout/Sidebar` with nav links and active state highlight
- [ ] Build `layout/TopNav` with page title and ThemeToggle
- [ ] Build `layout/ThemeToggle` — persists preference to localStorage
- [ ] Build `layout/AppLayout` composing Sidebar + TopNav + content area
- [ ] Apply AppLayout in `pages/_app.tsx`
- [ ] Implement responsive: sidebar hidden on mobile, bottom tab bar shown
- [ ] Verify all routes render with correct nav highlight and dark mode toggle works

### Phase 3 — Core Data Layer

- [ ] Implement `useAppData` hook exposing workouts, goals, and all CRUD functions
- [ ] Implement `lib/utils.ts`: `getThisWeekWorkouts`, `getTotalDuration`, `getTotalCalories`, `formatDate`, `generateId`
- [ ] Write unit tests: `storage.ts` helpers (add, update, delete)
- [ ] Write unit tests: `utils.ts` (date helpers, aggregation functions)
- [ ] Confirm all tests pass

### Phase 4 — Workout Tracker

- [ ] Build `workouts/WorkoutForm` with all fields, controlled inputs, and validation
- [ ] Build `workouts/WorkoutCard` with completed toggle, edit button, delete button
- [ ] Build `workouts/WorkoutList` with empty state
- [ ] Build `pages/workouts/index.tsx` — list + add-new form in a modal or inline panel
- [ ] Build `pages/workouts/[id].tsx` — pre-populated edit form + delete confirmation modal
- [ ] Write RTL tests: render WorkoutForm, submit valid data, display validation errors, edit workout, delete workout

### Phase 5 — Goals and Dashboard

- [ ] Build `goals/GoalForm` with title, description, target, unit, period fields
- [ ] Build `goals/GoalCard` with ProgressBar and complete/delete actions
- [ ] Build `pages/goals.tsx`
- [ ] Build `dashboard/StatsCard`
- [ ] Build `dashboard/TodayWorkout`
- [ ] Build `dashboard/WeeklyProgress` (one ProgressBar per active goal)
- [ ] Build `dashboard/RecentWorkouts` (last five workouts)
- [ ] Build `pages/index.tsx` composing all dashboard components
- [ ] Write RTL tests: dashboard stat cards render correct values, goal completion marks goal as done

### Phase 6 — Progress, History, and Assistant

- [ ] Build `progress/WeeklyBarChart` using Recharts BarChart (workouts per week, last 8 weeks)
- [ ] Build `progress/CaloriesLineChart` using Recharts LineChart (calories per week, last 8 weeks)
- [ ] Build `progress/StatsSummary`
- [ ] Build `pages/progress.tsx`
- [ ] Build `history/SearchBar`, `history/FilterBar`, `history/HistoryTable`
- [ ] Build `pages/history.tsx` with combined search + type filter + date filter
- [ ] Build `lib/assistantEngine.ts` with full intent catalogue and fallback
- [ ] Build `assistant/ChatWindow`, `assistant/MessageBubble`, `assistant/InputBar`, `assistant/SuggestedQuestions`
- [ ] Build `pages/assistant.tsx`
- [ ] Write RTL tests: history search filters results, assistant returns correct response for each intent

### Phase 7 — Testing, Polish, and Documentation

- [ ] Audit every page for empty states — add EmptyState component where missing
- [ ] Audit every async operation for LoadingSpinner during localStorage hydration
- [ ] Confirm full responsive layout on 375 px, 768 px, and 1280 px viewports
- [ ] Run full test suite; fix any failing tests
- [ ] Write `README.md` covering setup, features, and Bob demonstration points
- [ ] Add `.bob/hooks` sample config (post-stop: run `npm run lint && npm test`)
- [ ] Final pass: consistent spacing, colour, and typography across light and dark modes

---

## Dependencies

```json
{
  "dependencies": {
    "next": "^14",
    "react": "^18",
    "react-dom": "^18",
    "recharts": "^2",
    "lucide-react": "^0.400"
  },
  "devDependencies": {
    "typescript": "^5",
    "@types/react": "^18",
    "@types/node": "^20",
    "tailwindcss": "^3",
    "postcss": "^8",
    "autoprefixer": "^10",
    "jest": "^29",
    "@testing-library/react": "^14",
    "@testing-library/jest-dom": "^6",
    "@testing-library/user-event": "^14",
    "jest-environment-jsdom": "^29",
    "eslint": "^8",
    "eslint-config-next": "^14",
    "prettier": "^3"
  }
}
```

---

## Testing Strategy

### Unit Tests (Jest)
- `storage.ts` helpers: add, read, update, delete for both Workouts and Goals
- `utils.ts`: date range calculations, aggregation functions, ID generation
- `assistantEngine.ts`: each intent returns the correct response shape given mock state

### Integration Tests (React Testing Library)
- Dashboard: renders correct stat values given mock workouts and goals in context
- WorkoutForm: submits valid data → workout appears in list; invalid data → error messages shown
- WorkoutCard: edit button navigates to edit route; delete button opens modal; modal confirm removes card
- GoalCard: complete button marks goal done and progress shows 100%
- History page: search input filters list; type dropdown filters list; date filter narrows results
- Assistant: typing a recognised question returns expected response; unrecognised question returns fallback

### Manual / Exploratory
- Verify dark mode toggle persists across page refreshes
- Verify localStorage data persists across browser sessions
- Verify responsive layout on real mobile device or DevTools mobile emulation

---

## Error Handling Strategy

### Form Validation
- All required fields validated on submit; error message shown inline below the field
- Numeric fields (duration, sets, reps, calories) reject non-positive values
- Date field defaults to today; rejects future dates for completed workouts

### localStorage Errors
- Wrap all `localStorage` calls in try/catch; fall back to in-memory state if storage is unavailable (e.g. private browsing with storage blocked)
- Show a dismissable warning banner if persistence is unavailable

### Empty States
- Every list (workouts, goals, history, today's workout, recent workouts) renders an `EmptyState` component with a helpful message and a CTA to add data

### Loading States
- `useAppData` initialises with `loading: true`; components render `LoadingSpinner` until hydration completes (prevents localStorage SSR mismatch)

### AI Assistant Fallback
- Unrecognised input returns: "I can help with questions about your workouts, goals, calories, and progress. Try asking: 'How many workouts did I complete this week?'"

### 404 / Unknown Routes
- Next.js default `404.tsx` page with a "Go to Dashboard" button

---

## Future Improvements

| Improvement | Description |
|---|---|
| Backend + Auth | Replace localStorage with a real database (e.g. Supabase) and add user accounts |
| Real AI | Replace rule-based engine with an LLM API call (e.g. OpenAI, watsonx) |
| Workout Templates | Pre-built workout plans users can clone |
| Notifications | Browser notifications for scheduled workouts |
| Export | Export workout history as CSV or PDF |
| Social | Share progress or goals with friends |
| Wearable Sync | Import data from Apple Health, Google Fit, or Fitbit |
| PWA | Make FitTrack installable as a Progressive Web App |
| Internationalisation | Support multiple languages |

---

## Implementation Roadmap

This is the step-by-step sequence for Agent Mode:

1. **Phase 1** — Scaffold the Next.js project, install all dependencies, configure Tailwind dark mode, define all TypeScript types, implement `storage.ts`, wire `AppContext` with seed data.
2. **Phase 2** — Build all UI primitive components, then Sidebar, TopNav, ThemeToggle, and AppLayout. Confirm routing and dark mode work end-to-end.
3. **Phase 3** — Implement `useAppData` hook and `utils.ts`. Write and pass unit tests for the data layer before building any feature UI.
4. **Phase 4** — Build the Workout Tracker (form, card, list, index page, edit page). Write RTL tests.
5. **Phase 5** — Build the Goals page and all Dashboard components. Wire to live data. Write RTL tests.
6. **Phase 6** — Build Progress charts, History page, and AI Assistant. Write RTL tests for each.
7. **Phase 7** — Final polish: empty states, loading states, responsive audit, full test run, README, and Bob hooks config.

Each phase maps to one Agent Mode sub-task. Complete and review each phase before starting the next.
