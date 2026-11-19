import { categoryStyle } from '../lib/category-style';
import CategoryPhosphorIcon from './CategoryPhosphorIcon';
import type { IconName } from './Icon';

type CategoryIconProps = {
  name: string;
  icon?: string | null;
  color?: string | null;
  size?: number;
};

function pastelBackground(color: string) {
  const normalized = color.trim();
  const shortHex = /^#([0-9a-f]{3})$/i.exec(normalized);
  const longHex = /^#([0-9a-f]{6})$/i.exec(normalized);

  if (shortHex) {
    const [red, green, blue] = shortHex[1].split('');
    return `#${red}${red}${green}${green}${blue}${blue}24`;
  }

  if (longHex) {
    return `${normalized}24`;
  }

  return 'rgba(104, 115, 140, 0.14)';
}

export default function CategoryIcon({
  name,
  icon,
  color,
  size = 42,
}: CategoryIconProps) {
  const style = categoryStyle(name, {
    icon: icon as IconName,
    color: color || undefined,
  });

  return (
    <span
      aria-hidden="true"
      className="category-icon"
      style={{
        backgroundColor: pastelBackground(style.color),
        color: style.color,
        height: size,
        width: size,
      }}
    >
      <CategoryPhosphorIcon
        name={style.icon}
        size={Math.round(size * 0.56)}
      />
    </span>
  );
}
