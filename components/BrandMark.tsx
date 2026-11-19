const BRAND_GLYPHS: Record<string, string> = {
  netflix: 'N',
  apple: 'AP',
  spotify: 'SP',
  amazon: 'A',
  disneyplus: 'D+',
  youtube: 'YT',
  playstation: 'PS',
  xbox: 'XB',
  google: 'G',
  uber: 'U',
  airbnb: 'AB',
  paypal: 'PP',
};

export function isBrandIcon(name?: string | null) {
  return Boolean(name?.startsWith('brand:'));
}

/**
 * Neutral text marker for a service. These are intentionally not copied
 * trademark logo paths; the service name remains visible in the picker.
 */
export default function BrandMark({
  name,
  size = 22,
  className,
}: {
  name?: string | null;
  size?: number;
  className?: string;
}) {
  const slug = name?.replace(/^brand:/, '') || '';
  const glyph = BRAND_GLYPHS[slug] || '?';

  return (
    <span
      aria-hidden="true"
      className={`brand-mark${className ? ` ${className}` : ''}`}
      style={{
        width: size,
        height: size,
        fontSize: Math.max(8, Math.round(size * (glyph.length > 1 ? 0.38 : 0.58))),
      }}
    >
      {glyph}
    </span>
  );
}
