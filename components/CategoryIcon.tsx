import type { CSSProperties } from 'react';
import { categoryStyle } from '../lib/category-style';
import CategoryPhosphorIcon from './CategoryPhosphorIcon';

function pastelBackground(color: string) {
  const longHex = /^#[0-9a-f]{6}$/i;
  const shortHex = /^#[0-9a-f]{3}$/i;

  if (longHex.test(color)) return `${color}24`;

  if (shortHex.test(color)) {
    const [r, g, b] = color.slice(1).split('');
    return `#${r}${r}${g}${g}${b}${b}24`;
  }

  return 'var(--surface2)';
}

export default function CategoryIcon({
  name,
  icon,
  color,
  size = 42,
}: {
  name: string;
  icon?: string | null;
  color?: string | null;
  size?: number;
}) {
  const style = categoryStyle(name, {
    icon: icon || undefined,
    color: color || undefined,
  });

  const badgeStyle: CSSProperties = {
    background: pastelBackground(style.color),
    color: style.color,
    width: size,
    height: size,
  };

  return (
    <span className="category-icon" style={badgeStyle}>
      <CategoryPhosphorIcon
        name={style.icon}
        size={Math.round(size * 0.56)}
      />
    </span>
  );
}
