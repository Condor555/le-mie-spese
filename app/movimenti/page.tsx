'use client';

import { useEffect, useState } from 'react';
import Icon from '../../components/Icon';
import CategoryIcon from '../../components/CategoryIcon';

type Transaction = {
  id: string;
  date: string;
  category_name: string;
  amount: number;
  currency?: string | null;
  note?: string | null;
  account_name?: string | null;
  source?: string | null;
  source_id?: string | null;
  author_name?: string | null;
};

type Category = {
  name: string;
  icon?: string | null;
  color?: string | null;
};

type Kind = 'expense' | 'income';
type ModalView = 'detail' | 'edit' | 'delete';
type ChangeScope = 'occurrence' | 'series';

const eur = (value: number) =>
  new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
  }).format(value);

const formatDate = (date: string) =>
  new Intl.DateTimeFormat('it-IT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${date}T12:00:00`));

function recurringSeriesId(transaction?: Transaction | null) {
  if (
    transaction?.source !== 'recurring' ||
    typeof transaction.source_id !== 'string'
  ) {
    return null;
  }

  const candidate = transaction.source_id.split(':', 1)[0];
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    candidate
  )
    ? candidate
    : null;
}

export default function Movimenti() {
  const [rows, setRows] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [query, setQuery] = useState('');
  const [month, setMonth] = useState('');
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');

  const [selected, setSelected] = useState<Transaction | null>(null);
  const [modalView, setModalView] = useState<ModalView>('detail');
  const [modalError, setModalError] = useState('');
  const [busy, setBusy] = useState(false);
  const [scope, setScope] = useState<ChangeScope>('occurrence');

  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState('');
  const [kind, setKind] = useState<Kind>('expense');
  const [account, setAccount] = useState('Spese');

  async function load(requestedPage = page) {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        `/api/transactions?q=${encodeURIComponent(query)}` +
          `&month=${encodeURIComponent(month)}` +
          `&page=${requestedPage}`,
        { cache: 'no-store' }
      );
      const result = await response.json();

      if (!response.ok) {
        setRows([]);
        setCount(0);
        setError(
          result.error || 'Impossibile caricare i movimenti.'
        );
        return;
      }

      setRows(Array.isArray(result.data) ? result.data : []);
      setCount(Number(result.count) || 0);
    } catch {
      setRows([]);
      setCount(0);
      setError('Errore di connessione durante il caricamento.');
    } finally {
      setLoading(false);
    }
  }

  async function loadCategories() {
    try {
      const response = await fetch('/api/categories', {
        cache: 'no-store',
      });
      const result = await response.json();

      if (response.ok && Array.isArray(result.data)) {
        setCategories(result.data);
      }
    } catch {
      // The current category remains editable even if the picker cannot refresh.
    }
  }

  useEffect(() => {
    load(1);
    loadCategories();
    // Initial load only. Filters are applied explicitly by the user.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const groups = rows.reduce<Record<string, Transaction[]>>(
    (accumulator, transaction) => {
      (accumulator[transaction.date] ||= []).push(transaction);
      return accumulator;
    },
    {}
  );

  function fillEditor(transaction: Transaction) {
    const numericAmount = Number(transaction.amount);
    setAmount(String(Math.abs(numericAmount)).replace('.', ','));
    setNote(transaction.note || '');
    setCategory(transaction.category_name);
    setDate(transaction.date);
    setKind(numericAmount >= 0 ? 'income' : 'expense');
    setAccount(transaction.account_name || 'Spese');
    setScope('occurrence');
    setModalError('');
  }

  function openTransaction(transaction: Transaction) {
    setSelected(transaction);
    fillEditor(transaction);
    setModalView('detail');
    setFeedback('');
  }

  function closeModal() {
    if (busy) return;
    setSelected(null);
    setModalView('detail');
    setModalError('');
    setScope('occurrence');
  }

  async function saveChanges() {
    if (!selected) return;

    const numericAmount = Number(amount.replace(',', '.'));
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setModalError('Inserisci un importo valido.');
      return;
    }

    if (!category) {
      setModalError('Seleziona una categoria.');
      return;
    }

    if (!date) {
      setModalError('Seleziona una data.');
      return;
    }

    setBusy(true);
    setModalError('');

    try {
      const response = await fetch(
        `/api/transactions/${encodeURIComponent(selected.id)}`,
        {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            date,
            category_name: category,
            amount: Math.abs(numericAmount),
            currency: selected.currency || 'EUR',
            note,
            account_name: account || 'Spese',
            kind,
            scope,
          }),
        }
      );
      const result = await response.json();

      if (!response.ok) {
        setModalError(
          result.error || 'Impossibile modificare il movimento.'
        );
        return;
      }

      setFeedback(
        scope === 'series'
          ? 'Movimento e prossime ricorrenze aggiornati.'
          : 'Movimento aggiornato.'
      );
      setSelected(null);
      setModalView('detail');
      await load(page);
    } catch {
      setModalError('Errore di connessione durante la modifica.');
    } finally {
      setBusy(false);
    }
  }

  async function deleteTransaction() {
    if (!selected) return;

    setBusy(true);
    setModalError('');

    try {
      const response = await fetch(
        `/api/transactions/${encodeURIComponent(selected.id)}` +
          `?scope=${scope}`,
        { method: 'DELETE' }
      );
      const result = await response.json();

      if (!response.ok) {
        setModalError(
          result.error || 'Impossibile eliminare il movimento.'
        );
        return;
      }

      const nextPage = page > 1 && rows.length === 1 ? page - 1 : page;
      setPage(nextPage);
      setFeedback(
        scope === 'series'
          ? 'Movimento eliminato e serie ricorrente interrotta.'
          : 'Movimento eliminato.'
      );
      setSelected(null);
      setModalView('detail');
      await load(nextPage);
    } catch {
      setModalError('Errore di connessione durante eliminazione.');
    } finally {
      setBusy(false);
    }
  }

  const seriesId = recurringSeriesId(selected);
  const selectedCategory = categories.find(
    (item) => item.name === category
  );

  return (
    <>
      <header className="page-head">
        <div>
          <h1>Movimenti</h1>
          <p>
            {loading
              ? 'Caricamento…'
              : `${count} transazioni`}
          </p>
        </div>
      </header>

      <div className="search-box surface">
        <Icon name="search" size={19} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              setPage(1);
              setFeedback('');
              load(1);
            }
          }}
          placeholder="Cerca una spesa..."
        />
      </div>

      <div className="filter-row">
        <input
          aria-label="Filtra per mese"
          type="month"
          value={month}
          onChange={(event) => setMonth(event.target.value)}
        />
        <button
          type="button"
          onClick={() => {
            setPage(1);
            setFeedback('');
            load(1);
          }}
        >
          Applica filtri
        </button>
      </div>

      {feedback && <div className="notice">{feedback}</div>}
      {error && <div className="notice error-notice">{error}</div>}

      {!loading && !error && count === 0 && (
        <div className="empty-state surface">
          <b>Nessun movimento trovato</b>
          <p>
            Controlla lo spazio selezionato oppure rimuovi i filtri.
          </p>
        </div>
      )}

      {Object.entries(groups).map(([groupDate, list]) => (
        <section className="day" key={groupDate}>
          <h3>
            {new Intl.DateTimeFormat('it-IT', {
              weekday: 'long',
              day: 'numeric',
              month: 'short',
            }).format(new Date(`${groupDate}T12:00:00`))}
          </h3>

          <div className="tx-card surface">
            {list.map((transaction) => (
              <button
                type="button"
                className="transaction transaction-button"
                key={transaction.id}
                onClick={() => openTransaction(transaction)}
                aria-label={`Apri ${
                  transaction.note || transaction.category_name
                }, ${eur(Number(transaction.amount))}`}
              >
                <CategoryIcon name={transaction.category_name} />
                <span className="transaction-copy">
                  <b>
                    {transaction.note || transaction.category_name}
                  </b>
                  <small>{transaction.category_name}</small>
                </span>
                <strong
                  className={
                    Number(transaction.amount) >= 0 ? 'green' : 'red'
                  }
                >
                  {Number(transaction.amount) >= 0 ? '+ ' : ''}
                  {eur(Number(transaction.amount))}
                </strong>
              </button>
            ))}
          </div>
        </section>
      ))}

      {!error && count > 0 && (
        <div className="pager">
          <button
            type="button"
            disabled={page === 1 || loading}
            onClick={() => {
              const previousPage = page - 1;
              setPage(previousPage);
              setFeedback('');
              load(previousPage);
            }}
          >
            Indietro
          </button>
          <span>{page}</span>
          <button
            type="button"
            disabled={page * 30 >= count || loading}
            onClick={() => {
              const nextPage = page + 1;
              setPage(nextPage);
              setFeedback('');
              load(nextPage);
            }}
          >
            Avanti
          </button>
        </div>
      )}

      {selected && (
        <div className="modal" role="presentation">
          <section
            className="modal-card transaction-modal surface"
            role="dialog"
            aria-modal="true"
            aria-labelledby="transaction-modal-title"
          >
            <header className="transaction-modal-head">
              <div>
                <small>
                  {modalView === 'detail'
                    ? 'Dettaglio movimento'
                    : modalView === 'edit'
                      ? 'Modifica movimento'
                      : 'Conferma eliminazione'}
                </small>
                <h2 id="transaction-modal-title">
                  {selected.note || selected.category_name}
                </h2>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={closeModal}
                disabled={busy}
                aria-label="Chiudi"
              >
                ×
              </button>
            </header>

            {modalView === 'detail' && (
              <>
                <div
                  className={`transaction-detail-amount ${
                    Number(selected.amount) >= 0 ? 'green' : 'red'
                  }`}
                >
                  {Number(selected.amount) >= 0 ? '+ ' : ''}
                  {eur(Number(selected.amount))}
                </div>

                <div className="transaction-detail-list">
                  <div>
                    <span>Categoria</span>
                    <b>{selected.category_name}</b>
                  </div>
                  <div>
                    <span>Data</span>
                    <b>{formatDate(selected.date)}</b>
                  </div>
                  <div>
                    <span>Tipo</span>
                    <b>
                      {Number(selected.amount) >= 0
                        ? 'Entrata'
                        : 'Uscita'}
                    </b>
                  </div>
                  <div>
                    <span>Conto</span>
                    <b>{selected.account_name || 'Spese'}</b>
                  </div>
                  {selected.author_name && (
                    <div>
                      <span>Inserito da</span>
                      <b>{selected.author_name}</b>
                    </div>
                  )}
                </div>

                {selected.source === 'recurring' && (
                  <div className="recurring-scope-note">
                    <b>Movimento ricorrente</b>
                    <p>
                      {seriesId
                        ? 'Puoi agire solo su questa occorrenza oppure anche sulle prossime.'
                        : 'Il collegamento alla serie non è disponibile: puoi agire solo su questo movimento.'}
                    </p>
                  </div>
                )}

                <div className="transaction-actions">
                  <button
                    type="button"
                    onClick={() => {
                      fillEditor(selected);
                      setModalView('edit');
                    }}
                  >
                    Modifica
                  </button>
                  <button
                    type="button"
                    className="delete-btn"
                    onClick={() => {
                      setScope('occurrence');
                      setModalError('');
                      setModalView('delete');
                    }}
                  >
                    Elimina
                  </button>
                </div>
              </>
            )}

            {modalView === 'edit' && (
              <div className="transaction-editor">
                <div className="segmented">
                  <button
                    type="button"
                    className={kind === 'expense' ? 'active' : ''}
                    onClick={() => setKind('expense')}
                  >
                    Uscita
                  </button>
                  <button
                    type="button"
                    className={kind === 'income' ? 'active' : ''}
                    onClick={() => setKind('income')}
                  >
                    Entrata
                  </button>
                </div>

                <input
                  className="amount-input"
                  aria-label="Importo"
                  inputMode="decimal"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="€ 0,00"
                />

                <div className="field">
                  <label htmlFor="edit-note">Descrizione</label>
                  <input
                    id="edit-note"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="Es. Spesa Conad"
                  />
                </div>

                <div className="field">
                  <label htmlFor="edit-category">Categoria</label>
                  <div className="category-picker">
                    <CategoryIcon
                      name={category || 'Categoria'}
                      icon={selectedCategory?.icon}
                      color={selectedCategory?.color}
                    />
                    <select
                      id="edit-category"
                      value={category}
                      onChange={(event) => setCategory(event.target.value)}
                    >
                      {!categories.some(
                        (item) => item.name === category
                      ) && (
                        <option value={category}>{category}</option>
                      )}
                      {categories.map((item) => (
                        <option key={item.name} value={item.name}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="two-col">
                  <div className="field">
                    <label htmlFor="edit-date">Data</label>
                    <input
                      id="edit-date"
                      type="date"
                      value={date}
                      onChange={(event) => setDate(event.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="edit-account">Conto</label>
                    <input
                      id="edit-account"
                      value={account}
                      onChange={(event) => setAccount(event.target.value)}
                    />
                  </div>
                </div>

                {seriesId && (
                  <fieldset className="scope-picker">
                    <legend>Ambito della modifica</legend>
                    <label>
                      <input
                        type="radio"
                        name="edit-scope"
                        checked={scope === 'occurrence'}
                        onChange={() => setScope('occurrence')}
                      />
                      <span>
                        <b>Solo questo movimento</b>
                        <small>La serie resta invariata</small>
                      </span>
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="edit-scope"
                        checked={scope === 'series'}
                        onChange={() => setScope('series')}
                      />
                      <span>
                        <b>Questo e le prossime ricorrenze</b>
                        <small>
                          Aggiorna importo, descrizione, categoria e conto
                        </small>
                      </span>
                    </label>
                  </fieldset>
                )}

                {seriesId && scope === 'series' && (
                  <p className="scope-help">
                    La nuova data vale solo per questo movimento. Frequenza e
                    calendario della serie non cambiano.
                  </p>
                )}

                {modalError && (
                  <div className="notice error-notice">{modalError}</div>
                )}

                <div className="transaction-actions">
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => {
                      setModalError('');
                      setScope('occurrence');
                      setModalView('detail');
                    }}
                    disabled={busy}
                  >
                    Annulla
                  </button>
                  <button
                    type="button"
                    onClick={saveChanges}
                    disabled={busy}
                  >
                    {busy ? 'Salvataggio…' : 'Salva modifiche'}
                  </button>
                </div>
              </div>
            )}

            {modalView === 'delete' && (
              <div className="delete-confirmation">
                <p>
                  <b>Eliminare questa transazione?</b>
                  <br />
                  L&apos;operazione non può essere annullata.
                </p>

                {seriesId && (
                  <fieldset className="scope-picker">
                    <legend>Cosa vuoi eliminare?</legend>
                    <label>
                      <input
                        type="radio"
                        name="delete-scope"
                        checked={scope === 'occurrence'}
                        onChange={() => setScope('occurrence')}
                      />
                      <span>
                        <b>Solo questo movimento</b>
                        <small>Le prossime ricorrenze continueranno</small>
                      </span>
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="delete-scope"
                        checked={scope === 'series'}
                        onChange={() => setScope('series')}
                      />
                      <span>
                        <b>Questo movimento e interrompi la serie</b>
                        <small>I movimenti precedenti restano invariati</small>
                      </span>
                    </label>
                  </fieldset>
                )}

                {modalError && (
                  <div className="notice error-notice">{modalError}</div>
                )}

                <div className="transaction-actions">
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => {
                      setModalError('');
                      setScope('occurrence');
                      setModalView('detail');
                    }}
                    disabled={busy}
                  >
                    Annulla
                  </button>
                  <button
                    type="button"
                    className="delete-btn"
                    onClick={deleteTransaction}
                    disabled={busy}
                  >
                    {busy
                      ? 'Eliminazione…'
                      : scope === 'series'
                        ? 'Elimina e interrompi serie'
                        : 'Elimina movimento'}
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
}
