// 하루를 아침/점심/저녁으로 나눠서 루틴을 보여준다. 시간이 없는 할 일은 '언제든'으로 모은다.
export const SLOTS = [
  { id: 'morning', label: '아침', icon: '☀️', hint: '12시 전', bg: '#FFF5DD', color: '#E2A93B' },
  { id: 'afternoon', label: '점심', icon: '🌤️', hint: '12–17시', bg: '#FFE9E1', color: '#E9876A' },
  { id: 'evening', label: '저녁', icon: '🌙', hint: '17시 이후', bg: '#EEEAFB', color: '#8F7FD6' },
  { id: 'any', label: '언제든', icon: '🍀', hint: '시간 상관없이', bg: '#E5F5EE', color: '#4FAE8C' },
];

export function slotOfTime(time) {
  if (!time) return 'any';
  const h = Number(time.slice(0, 2));
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

export function currentSlot(date = new Date()) {
  const h = date.getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

export function getSlot(id) {
  return SLOTS.find((s) => s.id === id) || SLOTS[3];
}

export function greeting(date = new Date()) {
  const slot = currentSlot(date);
  if (slot === 'morning') return '좋은 아침이에요,';
  if (slot === 'afternoon') return '좋은 오후예요,';
  return '편안한 저녁이에요,';
}
