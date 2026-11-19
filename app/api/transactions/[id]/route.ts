import { NextResponse } from 'next/server';
import { z } from 'zod';
import { activeSpace } from '../../../../lib/active-space';

const idSchema = z.string().uuid();
const scopeSchema = z.enum(['occurrence', 'series']);
const transactionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  category_name: z.string().trim().min(1),
  amount: z.number().finite().positive(),
  currency: z.string().trim().min(1).default('EUR'),
  note: z.string().default(''),
  account_name: z.string().trim().min(1).default('Spese'),
  kind: z.enum(['expense', 'income']),
  scope: scopeSchema.default('occurrence'),
});

type StoredTransaction = {
  id: string;
  user_id: string;
  created_by?: string | null;
  space_id: string;
  source?: string | null;
  source_id?: string | null;
  date: string;
  category_name: string;
  amount: number;
  currency?: string | null;
  note?: string | null;
  account_name?: string | null;
};

function recurringSeriesId(transaction: StoredTransaction) {
  if (
    transaction.source !== 'recurring' ||
    typeof transaction.source_id !== 'string'
  ) {
    return null;
  }

  const candidate = transaction.source_id.split(':', 1)[0];
  const result = idSchema.safeParse(candidate);
  return result.success ? result.data : null;
}

function message(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

async function findTransaction(id: string) {
  const { sb, spaceId } = await activeSpace();
  const result = await sb
    .from('transactions')
    .select('*')
    .eq('space_id', spaceId)
    .eq('id', id)
    .maybeSingle();

  return { sb, spaceId, result };
}

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await params;
    const id = idSchema.parse(rawId);
    const { result } = await findTransaction(id);

    if (result.error) {
      return NextResponse.json(
        { error: result.error.message },
        { status: 400 }
      );
    }

    if (!result.data) {
      return NextResponse.json(
        { error: 'Movimento non trovato nello spazio attivo.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: result.data,
      recurring_series_id: recurringSeriesId(
        result.data as StoredTransaction
      ),
    });
  } catch (error) {
    const status = error instanceof z.ZodError ? 400 : 401;
    return NextResponse.json(
      { error: message(error, 'Unauthorized') },
      { status }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await params;
    const id = idSchema.parse(rawId);
    const payload = transactionSchema.parse(await req.json());
    const { sb, spaceId, result } = await findTransaction(id);

    if (result.error) {
      return NextResponse.json(
        { error: result.error.message },
        { status: 400 }
      );
    }

    if (!result.data) {
      return NextResponse.json(
        { error: 'Movimento non trovato nello spazio attivo.' },
        { status: 404 }
      );
    }

    const current = result.data as StoredTransaction;
    const seriesId = recurringSeriesId(current);

    if (payload.scope === 'series' && !seriesId) {
      return NextResponse.json(
        {
          error:
            'Questo movimento non è collegato a una serie ricorrente modificabile.',
        },
        { status: 409 }
      );
    }

    if (seriesId) {
      const series = await sb
        .from('recurring_transactions')
        .select('id')
        .eq('space_id', spaceId)
        .eq('id', seriesId)
        .maybeSingle();

      if (series.error) {
        return NextResponse.json(
          { error: series.error.message },
          { status: 400 }
        );
      }

      if (payload.scope === 'series' && !series.data) {
        return NextResponse.json(
          {
            error:
              'La serie ricorrente non esiste più. Modifica solo questa occorrenza.',
          },
          { status: 409 }
        );
      }
    }

    const signedAmount =
      payload.kind === 'expense'
        ? -Math.abs(payload.amount)
        : Math.abs(payload.amount);
    const update = {
      date: payload.date,
      category_name: payload.category_name,
      amount: signedAmount,
      currency: payload.currency,
      note: payload.note.trim(),
      account_name: payload.account_name,
    };
    const updated = await sb
      .from('transactions')
      .update(update)
      .eq('space_id', spaceId)
      .eq('id', id)
      .select()
      .single();

    if (updated.error) {
      return NextResponse.json(
        { error: updated.error.message },
        { status: 400 }
      );
    }

    if (payload.scope === 'series' && seriesId) {
      const recurringUpdate = await sb
        .from('recurring_transactions')
        .update({
          note: update.note,
          category_name: update.category_name,
          amount: update.amount,
          currency: update.currency,
          account_name: update.account_name,
        })
        .eq('space_id', spaceId)
        .eq('id', seriesId)
        .select('id')
        .maybeSingle();

      if (recurringUpdate.error || !recurringUpdate.data) {
        const rollback = await sb
          .from('transactions')
          .update({
            date: current.date,
            category_name: current.category_name,
            amount: current.amount,
            currency: current.currency || 'EUR',
            note: current.note || '',
            account_name: current.account_name || 'Spese',
          })
          .eq('space_id', spaceId)
          .eq('id', id);

        return NextResponse.json(
          {
            error: rollback.error
              ? 'Aggiornamento parziale: verifica il movimento e la serie in Ricorrenze.'
              : 'La serie non è stata aggiornata. Il movimento è stato ripristinato.',
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({
      data: updated.data,
      scope: payload.scope,
      series_updated: payload.scope === 'series',
    });
  } catch (error) {
    const status = error instanceof z.ZodError ? 400 : 401;
    return NextResponse.json(
      {
        error:
          error instanceof z.ZodError
            ? 'Dati della transazione non validi.'
            : message(error, 'Unauthorized'),
      },
      { status }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await params;
    const id = idSchema.parse(rawId);
    const url = new URL(req.url);
    const scope = scopeSchema.parse(
      url.searchParams.get('scope') || 'occurrence'
    );
    const { sb, spaceId, result } = await findTransaction(id);

    if (result.error) {
      return NextResponse.json(
        { error: result.error.message },
        { status: 400 }
      );
    }

    if (!result.data) {
      return NextResponse.json(
        { error: 'Movimento non trovato nello spazio attivo.' },
        { status: 404 }
      );
    }

    const seriesId = recurringSeriesId(result.data as StoredTransaction);

    if (scope === 'series') {
      if (!seriesId) {
        return NextResponse.json(
          {
            error:
              'Questo movimento non è collegato a una serie ricorrente eliminabile.',
          },
          { status: 409 }
        );
      }

      const existingSeries = await sb
        .from('recurring_transactions')
        .select('id')
        .eq('space_id', spaceId)
        .eq('id', seriesId)
        .maybeSingle();

      if (existingSeries.error) {
        return NextResponse.json(
          { error: existingSeries.error.message },
          { status: 400 }
        );
      }

      if (!existingSeries.data) {
        return NextResponse.json(
          {
            error:
              'La serie ricorrente non esiste più. Elimina solo questa occorrenza.',
          },
          { status: 409 }
        );
      }

      const stopped = await sb
        .from('recurring_transactions')
        .delete()
        .eq('space_id', spaceId)
        .eq('id', seriesId)
        .select('id')
        .maybeSingle();

      if (stopped.error || !stopped.data) {
        return NextResponse.json(
          {
            error:
              stopped.error?.message ||
              'Impossibile interrompere la serie ricorrente.',
          },
          { status: 400 }
        );
      }
    }

    const deleted = await sb
      .from('transactions')
      .delete()
      .eq('space_id', spaceId)
      .eq('id', id)
      .select('id')
      .maybeSingle();

    if (deleted.error || !deleted.data) {
      return NextResponse.json(
        {
          error:
            scope === 'series'
              ? 'Serie interrotta, ma il movimento non è stato eliminato. Riprova eliminando solo il movimento.'
              : deleted.error?.message || 'Movimento non eliminato.',
          series_stopped: scope === 'series',
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      scope,
      series_stopped: scope === 'series',
    });
  } catch (error) {
    const status = error instanceof z.ZodError ? 400 : 401;
    return NextResponse.json(
      { error: message(error, 'Unauthorized') },
      { status }
    );
  }
}
