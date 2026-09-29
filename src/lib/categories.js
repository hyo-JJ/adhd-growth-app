// 누구나 쓸 수 있는 생활 영역 기준 카테고리. AI 프롬프트/가져오기/화면이 모두 이 목록을 공유한다.
export const CATEGORIES = [
  { id: 'study', label: '공부·배움', hint: '시험, 자격증, 외국어, 독서, 강의', emoji: '📚', color: '#5E85C9', bg: '#E6EDFB' },
  { id: 'work', label: '일·커리어', hint: '업무, 과제, 취업 준비, 사이드 프로젝트', emoji: '💼', color: '#3FA491', bg: '#E1F5F0' },
  { id: 'health', label: '운동·건강', hint: '운동, 산책, 병원, 약 챙기기', emoji: '🏃', color: '#E27A55', bg: '#FCE8E0' },
  { id: 'routine', label: '생활리듬', hint: '수면, 기상, 식사, 씻기', emoji: '🌙', color: '#5B93C9', bg: '#E5F1FB' },
  { id: 'home', label: '집안일·정리', hint: '청소, 빨래, 정리, 장보기', emoji: '🧺', color: '#4FADC0', bg: '#E1F3F6' },
  { id: 'admin', label: '돈·서류', hint: '공과금, 가계부, 서류, 예약, 연락 회신', emoji: '🧾', color: '#C9A13B', bg: '#FBF3DD' },
  { id: 'people', label: '관계', hint: '가족, 친구, 연락, 약속', emoji: '💬', color: '#D97B96', bg: '#FBE8EE' },
  { id: 'hobby', label: '취미·창작', hint: '글쓰기, 그림, 음악, 콘텐츠, 만들기', emoji: '🎨', color: '#9B84D6', bg: '#EEE9FB' },
  { id: 'etc', label: '기타', hint: '어디에도 딱 맞지 않는 것', emoji: '✨', color: '#B09B87', bg: '#F3ECE3' },
];

export const CATEGORY_IDS = CATEGORIES.map((c) => c.id);

// 이전 버전 카테고리 → 새 카테고리 (DB 마이그레이션 전 데이터나 예전 AI 답변도 깨지지 않게)
const LEGACY = {
  japanese: 'study',
  dev: 'work',
  project: 'work',
  exercise: 'health',
  selfcare: 'routine',
  content: 'hobby',
};

export function normalizeCategory(id) {
  if (CATEGORY_IDS.includes(id)) return id;
  return LEGACY[id] || 'etc';
}

export function getCategory(id) {
  const norm = normalizeCategory(id);
  return CATEGORIES.find((c) => c.id === norm);
}
