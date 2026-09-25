export const CATEGORIES = [
  { id: 'japanese', label: '일본어', emoji: '日', color: '#5E85C9', bg: '#E6EDFB' },
  { id: 'dev', label: '개발', emoji: '〈〉', color: '#3FA491', bg: '#E1F5F0' },
  { id: 'exercise', label: '운동', emoji: '🏋️', color: '#E27A55', bg: '#FCE8E0' },
  { id: 'selfcare', label: '자기관리', emoji: '💧', color: '#5B93C9', bg: '#E5F1FB' },
  { id: 'project', label: '프로젝트', emoji: '📁', color: '#9B84D6', bg: '#EEE9FB' },
  { id: 'study', label: '학교/스터디', emoji: '🏫', color: '#4FADC0', bg: '#E1F3F6' },
  { id: 'content', label: '콘텐츠', emoji: '🎬', color: '#D97B96', bg: '#FBE8EE' },
  { id: 'etc', label: '기타', emoji: '✨', color: '#B09B87', bg: '#F3ECE3' },
];

export function getCategory(id) {
  return CATEGORIES.find((c) => c.id === id) || CATEGORIES[CATEGORIES.length - 1];
}
