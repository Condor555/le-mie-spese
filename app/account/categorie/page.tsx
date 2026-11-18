'use client';

import { useEffect, useState } from 'react';
import BackToAccount from '../../../components/BackToAccount';
import Icon, { type IconName } from '../../../components/Icon';
import CategoryIcon from '../../../components/CategoryIcon';
import {
  iconChoices,
  colorChoices,
  inferredCategoryStyle,
} from '../../../lib/category-style';

type Cat = {
  name: string;
  icon: string;
  color: string;
  count?: number;
};

export default function Categorie() {
  const [cats, setCats] = useState<Cat[]>([]);

  const [name, setName] = useState('');
  const [icon, setIcon] = useState<IconName>('tag');
  const [color, setColor] = useState(colorChoices[0]);

  const [editing, setEditing] = useState<Cat | null>(null);
  const [originalName, setOriginalName] = useState('');
  const [target, setTarget] = useState('');

  const [msg, setMsg] = useState('');

  function load() {
    fetch('/api/categories')
      .then((response) => response.json())
      .then((result) => setCats(result.data || []));
  }

  useEffect(() => {
    load();
  }, []);

  function changeName(value: string) {
    setName(value);

    if (value) {
      const style = inferredCategoryStyle(value);
      setIcon(style.icon);
      setColor(style.color);
    }
  }

  async function createCategory() {
    if (name.trim().length < 2) {
      setMsg('Inserisci un nome di almeno 2 caratteri.');
      return;
    }

    const response = await fetch('/api/categories', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        name,
        icon,
        color,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      setMsg(result.error || 'Errore nella creazione.');
      return;
    }

    setMsg('Categoria creata.');
    setName('');
    setIcon('tag');
    setColor(colorChoices[0]);

    load();
  }

  function openCategory(category: Cat) {
    setEditing({ ...category });
    setOriginalName(category.name);
    setTarget('');
    setMsg('');
  }

  async function saveCategory() {
    if (!editing) return;

    const newName = editing.name.trim();

    if (newName.length < 2) {
      setMsg('Il nome deve avere almeno 2 caratteri.');
      return;
    }

    const response = await fetch(
      '/api/categories/' + encodeURIComponent(originalName),
      {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          newName,
          icon: editing.icon,
          color: editing.color,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      setMsg(result.error || 'Errore nella modifica.');
      return;
    }

    setMsg('Categoria modificata.');
    setEditing(null);
    setOriginalName('');
    setTarget('');

    load();
  }

  async function removeCategory() {
    if (!editing) return;

    const response = await fetch(
      '/api/categories?name=' +
        encodeURIComponent(originalName),
      {
        method: 'DELETE',
      }
    );

    const result = await response.json();

    if (response.ok) {
      setMsg('Categoria eliminata.');
      setEditing(null);
      setOriginalName('');
      setTarget('');

      load();
      return;
    }

    if (response.status === 409) {
      setMsg(
        `La categoria contiene ${result.count} transazioni. ` +
          'Scegli una categoria di destinazione e usa "Migra ed elimina".'
      );
      return;
    }

    setMsg(result.error || 'Errore durante eliminazione.');
  }

  async function mergeCategory() {
    if (!editing || !target) return;

    const response = await fetch('/api/categories/merge', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        source: originalName,
        target,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      setMsg(result.error || 'Errore durante la migrazione.');
      return;
    }

    setMsg('Transazioni migrate e categoria eliminata.');

    setEditing(null);
    setOriginalName('');
    setTarget('');

    load();
  }

  function closeEditor() {
    setEditing(null);
    setOriginalName('');
    setTarget('');
  }

  return (
    <>
      <BackToAccount />

      <header className="page-head">
        <div>
          <h1>Categorie</h1>
          <p>{cats.length} categorie disponibili</p>
        </div>
      </header>

      <section className="settings-card surface">
        <h2>Crea categoria</h2>

        <input
          value={name}
          onChange={(e) => changeName(e.target.value)}
          placeholder="Nome categoria"
        />

        <label className="picker-label">
          Icona
        </label>

        <div className="icon-picker">
          {iconChoices.map((item) => (
            <button
              key={item}
              type="button"
              className={icon === item ? 'selected' : ''}
              onClick={() => setIcon(item)}
              aria-label={`Icona ${item}`}
            >
              <Icon name={item} />
            </button>
          ))}
        </div>

        <label className="picker-label">
          Colore
        </label>

        <div className="color-picker">
          {colorChoices.map((item) => (
            <button
              key={item}
              type="button"
              aria-label={`Colore ${item}`}
              className={color === item ? 'selected' : ''}
              style={{
                background: item,
              }}
              onClick={() => setColor(item)}
            />
          ))}
        </div>

        <button
          className="create-cat"
          onClick={createCategory}
        >
          Crea categoria
        </button>

        {msg && !editing && (
          <div className="notice">
            {msg}
          </div>
        )}
      </section>

      <section className="settings-card surface">
        <h2>Le tue categorie</h2>

        <div className="category-settings">
          {cats.map((category) => (
            <button
              type="button"
              className="category-setting"
              key={category.name}
              onClick={() => openCategory(category)}
            >
              <CategoryIcon
                name={category.name}
                icon={category.icon}
                color={category.color}
                size={36}
              />

              <span>
                <b>{category.name}</b>

                <small>
                  {category.count || 0}{' '}
                  {(category.count || 0) === 1
                    ? 'movimento'
                    : 'movimenti'}
                </small>
              </span>

              <strong>›</strong>
            </button>
          ))}
        </div>
      </section>

      {editing && (
        <div className="modal">
          <div className="modal-card surface">
            <h2>Modifica categoria</h2>

            <label className="picker-label">
              Nome
            </label>

            <input
              value={editing.name}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  name: e.target.value,
                })
              }
            />

            <label className="picker-label">
              Icona
            </label>

            <div className="icon-picker">
              {iconChoices.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={
                    editing.icon === item
                      ? 'selected'
                      : ''
                  }
                  onClick={() =>
                    setEditing({
                      ...editing,
                      icon: item,
                    })
                  }
                  aria-label={`Icona ${item}`}
                >
                  <Icon name={item} />
                </button>
              ))}
            </div>

            <label className="picker-label">
              Colore
            </label>

            <div className="color-picker">
              {colorChoices.map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-label={`Colore ${item}`}
                  className={
                    editing.color === item
                      ? 'selected'
                      : ''
                  }
                  style={{
                    background: item,
                  }}
                  onClick={() =>
                    setEditing({
                      ...editing,
                      color: item,
                    })
                  }
                />
              ))}
            </div>

            {msg && (
              <div className="notice">
                {msg}
              </div>
            )}

            <button onClick={saveCategory}>
              Salva modifiche
            </button>

            <div className="merge-box">
              <label>
                Migra transazioni in
              </label>

              <select
                value={target}
                onChange={(e) =>
                  setTarget(e.target.value)
                }
              >
                <option value="">
                  Seleziona categoria...
                </option>

                {cats
                  .filter(
                    (category) =>
                      category.name !== originalName
                  )
                  .map((category) => (
                    <option
                      key={category.name}
                      value={category.name}
                    >
                      {category.name}
                    </option>
                  ))}
              </select>

              <button
                className="merge-btn"
                disabled={!target}
                onClick={mergeCategory}
              >
                Migra ed elimina
              </button>
            </div>

            <button
              className="delete-btn"
              onClick={removeCategory}
            >
              Elimina categoria
            </button>

            <button
              className="secondary"
              onClick={closeEditor}
            >
              Annulla
            </button>
          </div>
        </div>
      )}
    </>
  );
}
