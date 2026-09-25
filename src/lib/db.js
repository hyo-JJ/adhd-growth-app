import { supabase } from './supabaseClient';

async function check(builder) {
  // `builder` may be an already-resolved {data,error} (from Promise.all in fetchAll)
  // or a still-pending Supabase query builder (a thenable) — awaiting it covers both,
  // since without this the underlying HTTP request never actually fires.
  const res = await builder;
  if (res.error) {
    console.error('[supabase]', res.error.message);
    throw res.error;
  }
  return res.data;
}

export async function fetchAll(userId) {
  const [profile, goals, subGoals, routines, completions, customTasks, weightLogs, projects, ideas, vocab, minimalDays] =
    await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
      supabase.from('goals').select('*').eq('user_id', userId).order('created_at'),
      supabase.from('sub_goals').select('*').eq('user_id', userId).order('created_at'),
      supabase.from('routines').select('*').eq('user_id', userId).order('created_at'),
      supabase.from('completions').select('*').eq('user_id', userId),
      supabase.from('custom_tasks').select('*').eq('user_id', userId).order('created_at'),
      supabase.from('weight_logs').select('*').eq('user_id', userId),
      supabase.from('projects').select('*').eq('user_id', userId).order('created_at'),
      supabase.from('ideas').select('*').eq('user_id', userId).order('created_at'),
      supabase.from('vocab').select('*').eq('user_id', userId).order('created_at'),
      supabase.from('minimal_days').select('*').eq('user_id', userId),
    ]);

  const profileData = await check(profile);
  const goalRows = await check(goals);
  const subGoalRows = await check(subGoals);

  const nestedGoals = goalRows.map((g) => ({
    id: g.id,
    title: g.title,
    category: g.category,
    deadline: g.deadline || '',
    subGoals: subGoalRows
      .filter((sg) => sg.goal_id === g.id)
      .map((sg) => ({ id: sg.id, title: sg.title, progress: sg.progress, done: sg.done })),
  }));

  const completionRows = await check(completions);
  const completionsMap = {};
  for (const c of completionRows) {
    completionsMap[c.routine_id] = completionsMap[c.routine_id] || {};
    completionsMap[c.routine_id][c.date] = Number(c.amount);
  }

  const minimalRows = await check(minimalDays);
  const minimalMode = {};
  for (const m of minimalRows) minimalMode[m.date] = true;

  return {
    nickname: profileData?.nickname || '나',
    goals: nestedGoals,
    routines: (await check(routines)).map((r) => ({
      id: r.id,
      title: r.title,
      category: r.category,
      days: r.days,
      amount: Number(r.amount),
      minAmount: r.min_amount == null ? null : Number(r.min_amount),
      unit: r.unit,
      steps: r.steps || null,
      goalId: r.goal_id || null,
      subGoalId: r.sub_goal_id || null,
    })),
    completions: completionsMap,
    customTasks: (await check(customTasks)).map((t) => ({
      id: t.id,
      title: t.title,
      category: t.category,
      date: t.date,
      done: t.done,
      carriedFrom: t.carried_from || null,
      estMinutes: t.est_minutes == null ? null : Number(t.est_minutes),
    })),
    weightLogs: (await check(weightLogs)).map((w) => ({ id: w.id, date: w.date, kg: Number(w.kg) })),
    projects: (await check(projects)).map((p) => ({ id: p.id, name: p.name, stage: p.stage })),
    ideas: (await check(ideas)).map((i) => ({
      id: i.id,
      title: i.title,
      status: i.status,
      tag: i.tag || '',
      capturedInFocus: i.captured_in_focus,
      createdAt: i.created_at,
    })),
    vocab: (await check(vocab)).map((v) => ({
      id: v.id,
      word: v.word,
      meaning: v.meaning,
      wrong: v.wrong,
      reviewCount: v.review_count,
    })),
    minimalMode,
  };
}

export const db = {
  setNickname: (userId, nickname) =>
    check(supabase.from('profiles').upsert({ id: userId, nickname })),

  insertGoal: (userId, goal) =>
    check(
      supabase.from('goals').insert({
        id: goal.id,
        user_id: userId,
        title: goal.title,
        category: goal.category,
        deadline: goal.deadline || null,
      })
    ),
  updateGoal: (id, patch) =>
    check(
      supabase
        .from('goals')
        .update({
          ...(patch.title !== undefined && { title: patch.title }),
          ...(patch.category !== undefined && { category: patch.category }),
          ...(patch.deadline !== undefined && { deadline: patch.deadline || null }),
        })
        .eq('id', id)
    ),
  deleteGoal: (id) => check(supabase.from('goals').delete().eq('id', id)),

  insertSubGoal: (userId, goalId, subGoal) =>
    check(
      supabase.from('sub_goals').insert({
        id: subGoal.id,
        user_id: userId,
        goal_id: goalId,
        title: subGoal.title,
        progress: subGoal.progress ?? 0,
        done: subGoal.done ?? false,
      })
    ),
  updateSubGoal: (id, patch) =>
    check(
      supabase
        .from('sub_goals')
        .update({
          ...(patch.title !== undefined && { title: patch.title }),
          ...(patch.progress !== undefined && { progress: patch.progress }),
          ...(patch.done !== undefined && { done: patch.done }),
        })
        .eq('id', id)
    ),
  deleteSubGoal: (id) => check(supabase.from('sub_goals').delete().eq('id', id)),

  insertRoutine: (userId, routine) =>
    check(
      supabase.from('routines').insert({
        id: routine.id,
        user_id: userId,
        title: routine.title,
        category: routine.category,
        days: routine.days,
        amount: routine.amount,
        min_amount: routine.minAmount,
        unit: routine.unit,
        steps: routine.steps || null,
        goal_id: routine.goalId || null,
        sub_goal_id: routine.subGoalId || null,
      })
    ),
  updateRoutine: (id, patch) =>
    check(
      supabase
        .from('routines')
        .update({
          ...(patch.title !== undefined && { title: patch.title }),
          ...(patch.category !== undefined && { category: patch.category }),
          ...(patch.days !== undefined && { days: patch.days }),
          ...(patch.amount !== undefined && { amount: patch.amount }),
          ...(patch.minAmount !== undefined && { min_amount: patch.minAmount }),
          ...(patch.unit !== undefined && { unit: patch.unit }),
          ...(patch.steps !== undefined && { steps: patch.steps }),
          ...(patch.goalId !== undefined && { goal_id: patch.goalId }),
          ...(patch.subGoalId !== undefined && { sub_goal_id: patch.subGoalId }),
        })
        .eq('id', id)
    ),
  deleteRoutine: (id) => check(supabase.from('routines').delete().eq('id', id)),

  setCompletion: (userId, routineId, date, amount) =>
    check(
      supabase
        .from('completions')
        .upsert({ user_id: userId, routine_id: routineId, date, amount }, { onConflict: 'routine_id,date' })
    ),
  clearCompletion: (routineId, date) =>
    check(supabase.from('completions').delete().eq('routine_id', routineId).eq('date', date)),

  insertCustomTask: (userId, task) =>
    check(
      supabase.from('custom_tasks').insert({
        id: task.id,
        user_id: userId,
        title: task.title,
        category: task.category,
        date: task.date,
        done: task.done ?? false,
        carried_from: task.carriedFrom || null,
        est_minutes: task.estMinutes ?? null,
      })
    ),
  updateCustomTask: (id, patch) =>
    check(
      supabase
        .from('custom_tasks')
        .update({
          ...(patch.done !== undefined && { done: patch.done }),
          ...(patch.date !== undefined && { date: patch.date }),
          ...(patch.carriedFrom !== undefined && { carried_from: patch.carriedFrom }),
          ...(patch.estMinutes !== undefined && { est_minutes: patch.estMinutes }),
        })
        .eq('id', id)
    ),
  deleteCustomTask: (id) => check(supabase.from('custom_tasks').delete().eq('id', id)),

  setWeightLog: (userId, date, kg) =>
    check(supabase.from('weight_logs').upsert({ user_id: userId, date, kg }, { onConflict: 'user_id,date' })),

  insertProject: (userId, project) =>
    check(
      supabase.from('projects').insert({ id: project.id, user_id: userId, name: project.name, stage: project.stage || 'idea' })
    ),
  updateProject: (id, patch) => check(supabase.from('projects').update(patch).eq('id', id)),
  deleteProject: (id) => check(supabase.from('projects').delete().eq('id', id)),

  insertIdea: (userId, idea) =>
    check(
      supabase.from('ideas').insert({
        id: idea.id,
        user_id: userId,
        title: idea.title,
        status: idea.status || 'idea',
        tag: idea.tag || null,
        captured_in_focus: idea.capturedInFocus ?? false,
      })
    ),
  updateIdea: (id, patch) =>
    check(
      supabase
        .from('ideas')
        .update({
          ...(patch.title !== undefined && { title: patch.title }),
          ...(patch.status !== undefined && { status: patch.status }),
          ...(patch.tag !== undefined && { tag: patch.tag }),
          ...(patch.capturedInFocus !== undefined && { captured_in_focus: patch.capturedInFocus }),
        })
        .eq('id', id)
    ),
  deleteIdea: (id) => check(supabase.from('ideas').delete().eq('id', id)),

  insertVocab: (userId, v) =>
    check(
      supabase.from('vocab').insert({
        id: v.id,
        user_id: userId,
        word: v.word,
        meaning: v.meaning,
        wrong: v.wrong ?? false,
        review_count: v.reviewCount ?? 0,
      })
    ),
  updateVocab: (id, patch) =>
    check(
      supabase
        .from('vocab')
        .update({
          ...(patch.word !== undefined && { word: patch.word }),
          ...(patch.meaning !== undefined && { meaning: patch.meaning }),
          ...(patch.wrong !== undefined && { wrong: patch.wrong }),
          ...(patch.reviewCount !== undefined && { review_count: patch.reviewCount }),
        })
        .eq('id', id)
    ),
  deleteVocab: (id) => check(supabase.from('vocab').delete().eq('id', id)),

  wipeAll: (userId) =>
    Promise.all(
      ['goals', 'routines', 'custom_tasks', 'weight_logs', 'projects', 'ideas', 'vocab', 'minimal_days'].map((t) =>
        check(supabase.from(t).delete().eq('user_id', userId))
      )
    ),

  setMinimalDay: (userId, date, active) =>
    active
      ? check(supabase.from('minimal_days').upsert({ user_id: userId, date }, { onConflict: 'user_id,date' }))
      : check(supabase.from('minimal_days').delete().eq('user_id', userId).eq('date', date)),
};
