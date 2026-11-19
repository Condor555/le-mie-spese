'use client';

import { useEffect, useState } from 'react';
import Icon from '../../components/Icon';
import CategoryIcon from '../../components/CategoryIcon';

type Transaction = {
  id: string;
  date: string;
  category_name: string;
  amount: number;
  note: string;
};

const eur = (value: number) =>
  new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
  }).format(value);

export default function Movimenti() {
  const [rows, setRows] = useState<Transaction[]>([]);
  const [query, setQuery] = useState('');
  const [month, setMonth] = useState('');
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  useEffect(() => {
    load(1);
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
          onClick={() => {
            setPage(1);
            load(1);
          }}
        >
          Applica filtri
        </button>
      </div>

      {error && <div className="notice error-notice">{error}</div>}

      {!loading && !error && count === 0 && (
        <div className="empty-state surface">
          <b>Nessun movimento trovato</b>
          <p>
            Controlla lo spazio selezionato oppure rimuovi i filtri.
          </p>
        </div>
      )}

      {Object.entries(groups).map(([date, list]) => (
        <section className="day" key={date}>
          <h3>
            {new Intl.DateTimeFormat('it-IT', {
              weekday: 'long',
              day: 'numeric',
              month: 'short',
            }).format(new Date(`${date}T12:00:00`))}
          </h3>

          <div className="tx-card surface">
            {list.map((transaction) => (
              <div className="transaction" key={transaction.id}>
                <CategoryIcon name={transaction.category_name} />
                <div>
                  <b>
                    {transaction.note || transaction.category_name}
                  </b>
                  <small>{transaction.category_name}</small>
                </div>
                <strong
                  className={
                    Number(transaction.amount) >= 0 ? 'green' : 'red'
                  }
                >
                  {Number(transaction.amount) >= 0 ? '+ ' : ''}
                  {eur(Number(transaction.amount))}
                </strong>
              </div>
            ))}
          </div>
        </section>
      ))}

      {!error && count > 0 && (
        <div className="pager">
          <button
            disabled={page === 1 || loading}
            onClick={() => {
              const previousPage = page - 1;
              setPage(previousPage);
              load(previousPage);
            }}
          >
            Indietro
          </button>
          <span>{page}</span>
          <button
            disabled={page * 30 >= count || loading}
            onClick={() => {
              const nextPage = page + 1;
              setPage(nextPage);
              load(nextPage);
            }}
          >
            Avanti
          </button>
        </div>
      )}
    </>
  );
}
