import { getCategory } from '../lib/categories';

export default function CategoryIcon({ id, size = 38 }) {
  const cat = getCategory(id);
  return (
    <span
      className="cat-icon"
      style={{ background: cat.bg, color: cat.color, width: size, height: size, fontSize: size * 0.4 }}
    >
      {cat.emoji}
    </span>
  );
}
