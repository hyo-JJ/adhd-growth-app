export const CATEGORIES = [
  { id: 'japanese', label: '일본어', emoji: '🇯🇵', color: '#EF6C6C' },
  { id: 'dev', label: '개발', emoji: '💻', color: '#5B8DEF' },
  { id: 'exercise', label: '운동', emoji: '🏃', color: '#41B883' },
  { id: 'selfcare', label: '자기관리', emoji: '🧘', color: '#9B7BE0' },
  { id: 'project', label: '프로젝트', emoji: '📁', color: '#E0A23B' },
  { id: 'study', label: '학교/스터디', emoji: '🏫', color: '#3BB0C9' },
  { id: 'content', label: '콘텐츠', emoji: '🎬', color: '#E06BA8' },
  { id: 'etc', label: '기타', emoji: '✨', color: '#8A8FA3' },
];

export function getCategory(id) {
  return CATEGORIES.find((c) => c.id === id) || CATEGORIES[CATEGORIES.length - 1];
}
