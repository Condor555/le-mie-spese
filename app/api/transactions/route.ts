import { NextResponse } from 'next/server';
import { z } from 'zod';
import { activeSpace } from '../../../lib/active-space';

const transactionSchema = z.object({
  date: z.string(),
  category_name: z.string().min(1),
  amount: z.number(),
  currency: z.string().default('EUR'),
  note: z.string().default(''),
  account_name: z.string().default('Spese'),
  kind: z
    .enum(['expense', 'income', 'transfer'])
    .default('expense'),
});

export async function GET(req: Request) {
  try {
    const { sb, spaceId } = await activeSpace();
    const url = new URL(req.url);
    const query = url.searchParams.get('q') || '';
    const month = url.searchParams.get('month') || '';
    const author = url.searchParams.get('author') || '';
    const page = Math.max(
      1,
      Number(url.searchParams.get('page') || 1) || 1
    );
    const size = 30;

    let request = sb
      .from('transactions')
      .select('*', { count: 'exact' })
      .eq('space_id', spaceId)
      .order('date', { ascending: false })
      .range((page - 1) * size, page * size - 1);

    if (query) request = request.ilike('note', `%${query}%`);
    if (author) request = request.eq('created_by', author);

    if (/^\d{4}-\d{2}$/.test(month)) {
      const [year, monthNumber] = month.split('-').map(Number);
      const end = new Date(year, monthNumber, 1)
        .toISOString()
        .slice(0, 10);
      request = request
        .gte('date', `${month}-01`)
        .lt('date', end);
    }

    const { data, error, count } = await request;

    if (error) {
      return NextResponse.json(
        { error: error.message, data: [], count: 0, page, size },
        { status: 400 }
      );
    }

    const rows = data || [];
    const authorIds = [
      ...new Set(
        rows
          .map((transaction) => transaction.created_by)
          .filter((id): id is string => Boolean(id))
      ),
    ];
    const authorNames = new Map<string, string>();

    // Resolve profiles separately. This avoids making the whole transaction
    // query fail when PostgREST cannot infer an embedded profiles relation.
    if (authorIds.length) {
      const { data: profiles } = await sb
        .from('profiles')
        .select('user_id,display_name')
        .in('user_id', authorIds);

      for (const profile of profiles || []) {
        authorNames.set(
          profile.user_id,
          profile.display_name || 'Utente'
        );
      }
    }

    return NextResponse.json({
      data: rows.map((transaction) => ({
        ...transaction,
        author_name: transaction.created_by
          ? authorNames.get(transaction.created_by) || 'Utente'
          : 'Importato',
      })),
      count: count || 0,
      page,
      size,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Unauthorized',
      },
      { status: 401 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { sb, user, spaceId } = await activeSpace();
    const payload = transactionSchema.parse(await req.json());
    const signedAmount =
      payload.kind === 'expense'
        ? -Math.abs(payload.amount)
        : payload.kind === 'income'
          ? Math.abs(payload.amount)
          : payload.amount;

    const { data, error } = await sb
      .from('transactions')
      .insert({
        user_id: user.id,
        created_by: user.id,
        space_id: spaceId,
        source: 'manual',
        date: payload.date,
        category_name: payload.category_name,
        amount: signedAmount,
        currency: payload.currency,
        note: payload.note,
        account_name: payload.account_name,
      })
      .select()
      .single();

    return NextResponse.json(
      { data, error: error?.message },
      { status: error ? 400 : 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dati della transazione non validi.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Unauthorized',
      },
      { status: 401 }
    );
  }
}
