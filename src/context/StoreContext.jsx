import { createContext, useContext, useEffect, useMemo, useState } from 'react';
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

      addWeightLog(kg, date = today()) {
        setState((s) => {
          const rest = s.weightLogs.filter((w) => w.date !== date);
          return { ...s, weightLogs: [...rest, { id: makeId(), date, kg }] };
        });
        db.setWeightLog(user.id, date, kg).catch(fail);
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

      addVocab(v) {
        const id = makeId();
        const full = { id, reviewCount: 0, wrong: false, ...v };
        setState((s) => ({ ...s, vocab: [...s.vocab, full] }));
        db.insertVocab(user.id, full).catch(fail);
      },
      updateVocab(id, patch) {
        setState((s) => ({ ...s, vocab: s.vocab.map((v) => (v.id === id ? { ...v, ...patch } : v)) }));
        db.updateVocab(id, patch).catch(fail);
      },
      deleteVocab(id) {
        setState((s) => ({ ...s, vocab: s.vocab.filter((v) => v.id !== id) }));
        db.deleteVocab(id).catch(fail);
      },

      setNickname(nickname) {
        setState((s) => ({ ...s, nickname }));
        db.setNickname(user.id, nickname).catch(fail);
      },

      resetAllData() {
        setState(blankState());
        db.wipeAll(user.id).catch(fail);
      },

      importPlan({ goals = [], routines = [] }) {
        for (const g of goals) {
          const goalId = makeId();
          const subGoals = (g.subGoals || []).map((sg) => ({ id: makeId(), progress: sg.progress ?? 0, done: false, title: sg.title }));
          setState((s) => ({
            ...s,
            goals: [...s.goals, { id: goalId, title: g.title, category: g.category, deadline: g.deadline || '', subGoals }],
          }));
          db.insertGoal(user.id, { id: goalId, title: g.title, category: g.category, deadline: g.deadline }).catch(fail);
          for (const sg of subGoals) {
            db.insertSubGoal(user.id, goalId, sg).catch(fail);
          }
        }
        for (const r of routines) {
          const id = makeId();
          const full = { id, title: r.title, category: r.category, days: r.days, amount: r.amount, minAmount: r.minAmount ?? null, unit: r.unit };
          setState((s) => ({ ...s, routines: [...s.routines, full] }));
          db.insertRoutine(user.id, full).catch(fail);
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
