export function makeId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  // fallback uuid v4
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function blankState() {
  return {
    nickname: '나',
    goals: [],
    routines: [],
    completions: {},
    customTasks: [],
    weightLogs: [],
    projects: [],
    ideas: [],
    vocab: [],
    minimalMode: {},
  };
}
