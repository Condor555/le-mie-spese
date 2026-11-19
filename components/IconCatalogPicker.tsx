'use client';

import {
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  ICON_CATALOG,
  ICON_GROUPS,
  type IconCatalogEntry,
  getIconCatalogEntry,
  matchesIconSearch,
} from '../lib/icon-catalog';
import CategoryPhosphorIcon from './CategoryPhosphorIcon';

const FAVORITES_KEY = 'le-mie-spese.icon-favorites.v2';
const RECENTS_KEY = 'le-mie-spese.icon-recents.v2';
const PAGE_SIZE = 48;
const MAX_RECENTS = 16;

type CatalogTab = 'all' | 'recent' | 'favorites' | 'brand';

function readIds(key: string) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === 'string')
      : [];
  } catch {
    return [];
  }
}

function writeIds(key: string, ids: string[]) {
  try {
    localStorage.setItem(key, JSON.stringify(ids));
  } catch {
    // The picker remains fully usable when private browsing blocks storage.
  }
}

export default function IconCatalogPicker({
  value,
  onChange,
  label = 'Catalogo icone',
}: {
  value: string;
  onChange: (id: string, suggestedColor?: string) => void;
  label?: string;
}) {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const [tab, setTab] = useState<CatalogTab>('all');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recents, setRecents] = useState<string[]>([]);
  const [limit, setLimit] = useState(PAGE_SIZE);

  useEffect(() => {
    setFavorites(readIds(FAVORITES_KEY));
    setRecents(readIds(RECENTS_KEY));
  }, []);

  useEffect(() => {
    setLimit(PAGE_SIZE);
  }, [tab, deferredQuery]);

  const items = useMemo(() => {
    const byId = new Map(ICON_CATALOG.map((item) => [item.id, item]));
    let source: IconCatalogEntry[];

    if (tab === 'recent') {
      source = recents
        .map((id) => byId.get(id))
        .filter((item): item is IconCatalogEntry => Boolean(item));
    } else if (tab === 'favorites') {
      source = favorites
        .map((id) => byId.get(id))
        .filter((item): item is IconCatalogEntry => Boolean(item));
    } else if (tab === 'brand') {
      source = ICON_CATALOG.filter((item) => item.brand);
    } else {
      source = ICON_CATALOG;
    }

    return source.filter((item) => matchesIconSearch(item, deferredQuery));
  }, [deferredQuery, favorites, recents, tab]);

  const visibleItems = items.slice(0, limit);
  const groups = ICON_GROUPS.map((group) => ({
    group,
    items: visibleItems.filter((item) => item.group === group),
  })).filter(({ items: groupItems }) => groupItems.length > 0);

  function choose(item: IconCatalogEntry) {
    const next = [item.id, ...recents.filter((id) => id !== item.id)].slice(
      0,
      MAX_RECENTS
    );
    setRecents(next);
    writeIds(RECENTS_KEY, next);
    onChange(item.id, item.suggestedColor);
  }

  function toggleFavorite(id: string) {
    const next = favorites.includes(id)
      ? favorites.filter((favorite) => favorite !== id)
      : [id, ...favorites];
    setFavorites(next);
    writeIds(FAVORITES_KEY, next);
  }

  const selected = getIconCatalogEntry(value);

  return (
    <section className="icon-catalog" aria-label={label}>
      <div className="icon-catalog-selected">
        <span>
          <CategoryPhosphorIcon name={value} size={24} />
        </span>
        <div>
          <small>Icona selezionata</small>
          <b>{selected?.label || 'Compatibile / personalizzata'}</b>
        </div>
      </div>

      <div className="icon-catalog-search">
        <span aria-hidden="true">⌕</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Cerca: spesa, auto, Netflix..."
          aria-label="Cerca nel catalogo icone"
        />
        {query && (
          <button
            type="button"
            className="icon-search-clear"
            onClick={() => setQuery('')}
            aria-label="Cancella ricerca"
          >
            ×
          </button>
        )}
      </div>

      <div className="icon-catalog-tabs" role="tablist" aria-label="Filtra icone">
        {(
          [
            ['all', 'Tutte'],
            ['recent', 'Recenti'],
            ['favorites', 'Preferite'],
            ['brand', 'Brand'],
          ] as const
        ).map(([id, text]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className={tab === id ? 'active' : ''}
            onClick={() => setTab(id)}
          >
            {text}
          </button>
        ))}
      </div>

      {groups.length ? (
        <div className="icon-catalog-scroll">
          {groups.map(({ group, items: groupItems }) => (
            <section className="icon-catalog-group" key={group}>
              <h3>{group}</h3>
              <div className="icon-catalog-grid">
                {groupItems.map((item) => {
                  const favorite = favorites.includes(item.id);
                  return (
                    <div
                      className={`icon-catalog-item${
                        value === item.id ? ' selected' : ''
                      }`}
                      key={item.id}
                    >
                      <button
                        type="button"
                        className="icon-catalog-choose"
                        onClick={() => choose(item)}
                        title={item.label}
                        aria-label={`Scegli ${item.label}`}
                        aria-pressed={value === item.id}
                      >
                        <CategoryPhosphorIcon name={item.id} size={24} />
                        <span>{item.label}</span>
                      </button>
                      <button
                        type="button"
                        className={`icon-favorite${favorite ? ' active' : ''}`}
                        onClick={() => toggleFavorite(item.id)}
                        aria-label={`${
                          favorite ? 'Rimuovi' : 'Aggiungi'
                        } ${item.label} ${
                          favorite ? 'dalle' : 'alle'
                        } preferite`}
                        aria-pressed={favorite}
                      >
                        {favorite ? '★' : '☆'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}

          {items.length > visibleItems.length && (
            <button
              type="button"
              className="icon-catalog-more"
              onClick={() => setLimit((current) => current + PAGE_SIZE)}
            >
              Mostra altre {Math.min(PAGE_SIZE, items.length - visibleItems.length)}
            </button>
          )}
        </div>
      ) : (
        <div className="icon-catalog-empty">
          <b>Nessuna icona trovata</b>
          <small>
            {tab === 'favorites'
              ? 'Aggiungi una stella alle icone che usi più spesso.'
              : tab === 'recent'
                ? 'Le icone scelte appariranno qui.'
                : 'Prova un termine più generale.'}
          </small>
        </div>
      )}

      <p className="icon-catalog-count" aria-live="polite">
        {items.length} {items.length === 1 ? 'risultato' : 'risultati'}
        {items.length > visibleItems.length
          ? ` · ${visibleItems.length} visualizzati`
          : ''}
      </p>
    </section>
  );
}
