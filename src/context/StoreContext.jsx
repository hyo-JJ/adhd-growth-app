import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { blankState, makeId } from '../lib/storage';
import { fetchAll, db } from '../lib/db';
import { today } from '../lib/date';

const StoreContext = createContext(null);

function fail(err) {
  console.error('[store]', err);
}

export function StoreProvider({ children }) {
  const { user } = useAuth();
  const [state, setState] = useState(blankState);
  const [ready, setReady] = useState(false);
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    if (!user) {
      setState(blankState());
      setReady(false);
      return;
    }
    let cancelled = false;
    setReady(false);
    fetchAll(user.id)
      .then((data) => {
        if (!cancelled) {
          setState(data);
          setReady(true);
        }
      })
      .catch((err) => {
        fail(err);
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const actions = useMemo(
    () => ({
      addGoal(goal) {
        const id = makeId();
        setState((s) => ({ ...s, goals: [...s.goals, { id, subGoals: [], ...goal }] }));
        db.insertGoal(user.id, { id, ...goal }).catch(fail);
      },
      updateGoal(id, patch) {
        setState((s) => ({ ...s, goals: s.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)) }));
        db.updateGoal(id, patch).catch(fail);
      },
      deleteGoal(id) {
        setState((s) => ({ ...s, goals: s.goals.filter((g) => g.id !== id) }));
        db.deleteGoal(id).catch(fail);
      },
      addSubGoal(goalId, subGoal) {
        const id = makeId();
        const full = { id, progress: 0, done: false, ...subGoal };
        setState((s) => ({
          ...s,
          goals: s.goals.map((g) => (g.id === goalId ? { ...g, subGoals: [...g.subGoals, full] } : g)),
        }));
        db.insertSubGoal(user.id, goalId, full).catch(fail);
      },
      updateSubGoal(goalId, subId, patch) {
        setState((s) => ({
          ...s,
          goals: s.goals.map((g) =>
            g.id === goalId ? { ...g, subGoals: g.subGoals.map((sg) => (sg.id === subId ? { ...sg, ...patch } : sg)) } : g
          ),
        }));
        db.updateSubGoal(subId, patch).catch(fail);
      },
      deleteSubGoal(goalId, subId) {
        setState((s) => ({
          ...s,
          goals: s.goals.map((g) => (g.id === goalId ? { ...g, subGoals: g.subGoals.filter((sg) => sg.id !== subId) } : g)),
        }));
        db.deleteSubGoal(subId).catch(fail);
      },

      addRoutine(routine) {
        const id = makeId();
        const full = { id, days: [0, 1, 2, 3, 4, 5, 6], ...routine };
        setState((s) => ({ ...s, routines: [...s.routines, full] }));
        db.insertRoutine(user.id, full).catch(fail);
      },
      updateRoutine(id, patch) {
        setState((s) => ({ ...s, routines: s.routines.map((r) => (r.id === id ? { ...r, ...patch } : r)) }));
        db.updateRoutine(id, patch).catch(fail);
      },
      deleteRoutine(id) {
        setState((s) => ({ ...s, routines: s.routines.filter((r) => r.id !== id) }));
        db.deleteRoutine(id).catch(fail);
      },

      setCompletion(routineId, date, amount) {
        setState((s) => ({
          ...s,
          completions: { ...s.completions, [routineId]: { ...(s.completions[routineId] || {}), [date]: amount } },
        }));
        db.setCompletion(user.id, routineId, date, amount).catch(fail);
      },
      clearCompletion(routineId, date) {
        setState((s) => {
          const forRoutine = { ...(s.completions[routineId] || {}) };
          delete forRoutine[date];
          return { ...s, completions: { ...s.completions, [routineId]: forRoutine } };
        });
        db.clearCompletion(routineId, date).catch(fail);
      },

      addCustomTask(task) {
        const id = makeId();
        const full = { id, date: today(), done: false, ...task };
        setState((s) => ({ ...s, customTasks: [...s.customTasks, full] }));
        db.insertCustomTask(user.id, full).catch(fail);
      },
      toggleCustomTask(id) {
        let nextDone = null;
        setState((s) => ({
          ...s,
          customTasks: s.customTasks.map((t) => {
            if (t.id !== id) return t;
            nextDone = !t.done;
            return { ...t, done: nextDone };
          }),
        }));
        db.updateCustomTask(id, { done: nextDone }).catch(fail);
      },
      deleteCustomTask(id) {
        setState((s) => ({ ...s, customTasks: s.customTasks.filter((t) => t.id !== id) }));
        db.deleteCustomTask(id).catch(fail);
      },
      updateCustomTask(id, patch) {
        setState((s) => ({ ...s, customTasks: s.customTasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) }));
        db.updateCustomTask(id, patch).catch(fail);
      },

      toggleMinimalMode(date = today()) {
        let next = false;
        setState((s) => {
          next = !s.minimalMode[date];
          const m = { ...s.minimalMode };
          if (next) m[date] = true;
          else delete m[date];
          return { ...s, minimalMode: m };
        });
        db.setMinimalDay(user.id, date, next).catch(fail);
      },

      addProject(project) {
        const id = makeId();
        const full = { id, stage: 'idea', ...project };
        setState((s) => ({ ...s, projects: [...s.projects, full] }));
        db.insertProject(user.id, full).catch(fail);
      },
      updateProject(id, patch) {
        setState((s) => ({ ...s, projects: s.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));
        db.updateProject(id, patch).catch(fail);
      },
      deleteProject(id) {
        setState((s) => ({ ...s, projects: s.projects.filter((p) => p.id !== id) }));
        db.deleteProject(id).catch(fail);
      },

      addIdea(idea) {
        const id = makeId();
        const full = { id, status: 'idea', ...idea };
        setState((s) => ({ ...s, ideas: [...s.ideas, full] }));
        db.insertIdea(user.id, full).catch(fail);
      },
      updateIdea(id, patch) {
        setState((s) => ({ ...s, ideas: s.ideas.map((i) => (i.id === id ? { ...i, ...patch } : i)) }));
        db.updateIdea(id, patch).catch(fail);
      },
      deleteIdea(id) {
        setState((s) => ({ ...s, ideas: s.ideas.filter((i) => i.id !== id) }));
        db.deleteIdea(id).catch(fail);
      },

      setNickname(nickname) {
        setState((s) => ({ ...s, nickname }));
        db.setNickname(user.id, nickname).catch(fail);
      },
      setDailyMaxTasks(n) {
        setState((s) => ({ ...s, dailyMaxTasks: n }));
        db.setDailyMaxTasks(user.id, n).catch(fail);
      },

      resetAllData() {
        setState(blankState());
        db.wipeAll(user.id).catch(fail);
      },

      // 같은 제목의 목표/루틴은 새로 만들지 않고 갱신한다 → 재계획해도 실행 기록이 이어진다.
      async importPlan({ goals = [], routines = [], tasks = [], settings = {} }, { removeRoutineIds = [] } = {}) {
        const current = stateRef.current;
        if (settings.dailyMaxTasks != null) {
          setState((s) => ({ ...s, dailyMaxTasks: settings.dailyMaxTasks }));
          db.setDailyMaxTasks(user.id, settings.dailyMaxTasks).catch(fail);
        }

        const goalIdByTitle = {};
        for (const g of goals) {
          const existing = current.goals.find((eg) => eg.title === g.title);
          const goalId = existing?.id || makeId();
          goalIdByTitle[g.title] = goalId;
          const knownSubs = new Set((existing?.subGoals || []).map((sg) => sg.title));
          const newSubs = (g.subGoals || [])
            .filter((sg) => !knownSubs.has(sg.title))
            .map((sg) => ({ id: makeId(), progress: sg.progress ?? 0, done: false, title: sg.title }));
          const fields = { title: g.title, category: g.category, deadline: g.deadline || '' };
          setState((s) => ({
            ...s,
            goals: existing
              ? s.goals.map((eg) => (eg.id === goalId ? { ...eg, ...fields, subGoals: [...eg.subGoals, ...newSubs] } : eg))
              : [...s.goals, { id: goalId, ...fields, subGoals: newSubs }],
          }));
          try {
            // sub_goals has a FK on goal_id, so the parent row must exist first.
            if (existing) await db.updateGoal(goalId, fields);
            else await db.insertGoal(user.id, { id: goalId, ...fields });
            for (const sg of newSubs) {
              await db.insertSubGoal(user.id, goalId, sg);
            }
          } catch (err) {
            fail(err);
          }
        }

        for (const r of routines) {
          const fields = {
            title: r.title,
            category: r.category,
            days: r.days,
            amount: r.amount,
            minAmount: r.minAmount ?? null,
            unit: r.unit,
            time: r.time || '',
            goalId: goalIdByTitle[r.goalTitle] || null,
          };
          const existing = current.routines.find((er) => er.title === r.title);
          if (existing) {
            setState((s) => ({ ...s, routines: s.routines.map((er) => (er.id === existing.id ? { ...er, ...fields } : er)) }));
            db.updateRoutine(existing.id, fields).catch(fail);
          } else {
            const full = { id: makeId(), ...fields };
            setState((s) => ({ ...s, routines: [...s.routines, full] }));
            db.insertRoutine(user.id, full).catch(fail);
          }
        }

        for (const t of tasks) {
          if (current.customTasks.some((et) => et.title === t.title && et.date === t.date)) continue;
          const full = { id: makeId(), done: false, ...t };
          setState((s) => ({ ...s, customTasks: [...s.customTasks, full] }));
          db.insertCustomTask(user.id, full).catch(fail);
        }

        for (const id of removeRoutineIds) {
          setState((s) => ({ ...s, routines: s.routines.filter((r) => r.id !== id) }));
          db.deleteRoutine(id).catch(fail);
        }
      },
    }),
    [user]
  );

  const value = useMemo(() => ({ state, ready, ...actions }), [state, ready, actions]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
