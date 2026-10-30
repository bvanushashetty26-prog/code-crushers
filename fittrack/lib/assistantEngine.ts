import { Workout, Goal } from './types'
import {
  getThisWeekWorkouts,
  getTotalDuration,
  getTotalCalories,
  formatDuration,
  formatDate,
  isThisMonth,
} from './utils'

// ─── Intent engine ────────────────────────────────────────────────────────────

export interface AssistantContext {
  workouts: Workout[]
  goals: Goal[]
  profileName: string
}

function pct(current: number, target: number): number {
  return target === 0 ? 0 : Math.round((current / target) * 100)
}

export function getAssistantResponse(
  message: string,
  ctx: AssistantContext
): string {
  const msg = message.toLowerCase().trim()
  const { workouts, goals, profileName } = ctx
  const firstName = profileName.split(' ')[0] || 'there'

  const weekWorkouts = getThisWeekWorkouts(workouts)
  const completedWorkouts = workouts.filter(w => w.completed)
  const activeGoals = goals.filter(g => !g.completed)
  const completedGoals = goals.filter(g => g.completed)

  // ── Weekly workout count ─────────────────────────────────────────────────
  if (/this week|week.*workout|workout.*week|how many.*workout/.test(msg)) {
    return `This week you have completed **${weekWorkouts.length} workout${weekWorkouts.length !== 1 ? 's' : ''}** 💪. ${
      weekWorkouts.length === 0
        ? "Let's get that first one in!"
        : weekWorkouts.length >= 5
        ? 'Amazing consistency — you are crushing it!'
        : `Keep it up — you are building great habits!`
    }`
  }

  // ── Calories ─────────────────────────────────────────────────────────────
  if (/calori|burn/.test(msg)) {
    const weekCals = getTotalCalories(weekWorkouts)
    const monthCals = getTotalCalories(workouts.filter(w => isThisMonth(w.date)))
    const totalCals = getTotalCalories(workouts)
    return `🔥 Here is your calorie summary:\n\n- **This week:** ${weekCals.toLocaleString()} cal\n- **This month:** ${monthCals.toLocaleString()} cal\n- **All time:** ${totalCals.toLocaleString()} cal\n\nGreat work staying active, ${firstName}!`
  }

  // ── Duration / time ──────────────────────────────────────────────────────
  if (/time|minut|hour|duration|long|spent/.test(msg)) {
    const weekDur = getTotalDuration(weekWorkouts)
    const totalDur = getTotalDuration(workouts)
    return `⏱️ Your exercise time:\n\n- **This week:** ${formatDuration(weekDur)}\n- **All time:** ${formatDuration(totalDur)}\n\nEvery minute counts — keep going!`
  }

  // ── Recent workouts ───────────────────────────────────────────────────────
  if (/recent|last|latest|show.*workout|my workout/.test(msg)) {
    const recent = [...workouts].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5)
    if (recent.length === 0) return `You haven't logged any workouts yet. Head to the Workouts page to add your first one!`
    const list = recent.map(w => `- **${w.name}** (${w.type}) — ${w.duration}m, ${w.caloriesBurned} cal — ${formatDate(w.date)} ${w.completed ? '✅' : '⏳'}`).join('\n')
    return `Here are your most recent workouts:\n\n${list}`
  }

  // ── Goal progress ─────────────────────────────────────────────────────────
  if (/goal|progress|target|aim/.test(msg)) {
    if (activeGoals.length === 0) {
      return `You have no active goals right now. Head to the Goals page to set a new target!`
    }
    const list = activeGoals.map(g => {
      const p = pct(g.currentValue, g.targetValue)
      const bar = '█'.repeat(Math.round(p / 10)) + '░'.repeat(10 - Math.round(p / 10))
      return `- **${g.title}**: ${g.currentValue}/${g.targetValue} ${g.unit} [${bar}] ${p}%`
    }).join('\n')
    return `Here is your goal progress, ${firstName}:\n\n${list}\n\n${completedGoals.length > 0 ? `You have also completed **${completedGoals.length}** goal${completedGoals.length !== 1 ? 's' : ''} — great work!` : ''}`
  }

  // ── Focus / suggestion ────────────────────────────────────────────────────
  if (/focus|today|suggest|recommend|should i|plan|what.*do/.test(msg)) {
    const todayCount = workouts.filter(w => w.date === new Date().toISOString().slice(0, 10)).length
    const weekCount = weekWorkouts.length
    const restNeeded = weekCount >= 6

    if (todayCount > 0) {
      return `You have already logged a workout today — fantastic! 🌟\n\nIf you want to do more, consider a light stretch or yoga session to aid recovery. Remember: rest is part of the training!`
    }
    if (restNeeded) {
      return `You have had a very active week with ${weekCount} workouts! Consider a rest day or a gentle yoga/stretching session today to let your muscles recover. 🧘`
    }

    const suggestions = [
      '**30-min Cardio Blast**: 5-min warm-up jog → 20-min intervals (1 min fast / 1 min easy) → 5-min cool-down',
      '**Upper Body Strength**: 3×12 push-ups → 3×10 rows → 3×10 shoulder press → 3×15 bicep curls',
      '**Core & Flexibility**: 3×20 crunches → 3×30s plank → 3×15 leg raises → 10-min stretching',
      '**Easy 5K Run**: Warm up for 5 mins, run at a comfortable pace, cool down and stretch',
      '**Full Body Circuit**: 5 exercises, 3 rounds — squats, push-ups, lunges, plank, jumping jacks',
    ]
    const pick = suggestions[Math.floor(Math.random() * suggestions.length)]
    return `Here is a workout suggestion for today, ${firstName}! 💡\n\n${pick}\n\nRemember to warm up and stay hydrated. You've got this! 🏆`
  }

  // ── Stats / summary ───────────────────────────────────────────────────────
  if (/stat|summar|overview|total|all time/.test(msg)) {
    return `📊 Your fitness summary:\n\n- **Total workouts logged:** ${workouts.length}\n- **Workouts completed:** ${completedWorkouts.length}\n- **Total time:** ${formatDuration(getTotalDuration(workouts))}\n- **Total calories burned:** ${getTotalCalories(workouts).toLocaleString()} cal\n- **Active goals:** ${activeGoals.length}\n- **Goals completed:** ${completedGoals.length}\n\nKeep up the great work, ${firstName}!`
  }

  // ── Greeting ──────────────────────────────────────────────────────────────
  if (/hello|hi |hey|good morning|good afternoon|good evening/.test(msg)) {
    return `Hey ${firstName}! 👋 I'm your FitTrack AI Assistant. I can help you with:\n\n- Workout counts and history\n- Calorie and duration stats\n- Goal progress\n- Workout suggestions\n\nWhat would you like to know?`
  }

  // ── Fallback ──────────────────────────────────────────────────────────────
  return `I can help you with questions about your fitness data, ${firstName}! Try asking:\n\n- "How many workouts did I complete this week?"\n- "How many calories did I burn?"\n- "What workouts did I do recently?"\n- "How am I progressing toward my goals?"\n- "What should I focus on today?"\n- "Show me my fitness stats"`
}
