import { NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';

export async function GET() {
  const sb = await createClient();

  const {
    data: { user },
  } = await sb.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const [{ data: savedCategories, error: categoriesError }, { data: transactions, error: transactionsError }] =
    await Promise.all([
      sb
        .from('categories')
        .select('name')
        .eq('user_id', user.id)
        .order('name'),

      sb
        .from('transactions')
        .select('category_name')
        .eq('user_id', user.id),
    ]);

  if (categoriesError) {
    return NextResponse.json(
      { error: categoriesError.message },
      { status: 400 }
    );
  }

  if (transactionsError) {
    return NextResponse.json(
      { error: transactionsError.message },
      { status: 400 }
    );
  }

  const names = [
    ...(savedCategories ?? []).map((item) => item.name),
    ...(transactions ?? []).map((item) => item.category_name),
  ];

  const uniqueCategories = [...new Set(names)]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, 'it'));

  return NextResponse.json({
    data: uniqueCategories,
  });
}

export async function POST(req: Request) {
  const sb = await createClient();

  const {
    data: { user },
  } = await sb.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const { name } = await req.json();
  const cleanName = String(name ?? '').trim();

  if (cleanName.length < 2) {
    return NextResponse.json(
      { error: 'Il nome della categoria deve avere almeno 2 caratteri.' },
      { status: 400 }
    );
  }

  const { data, error }
