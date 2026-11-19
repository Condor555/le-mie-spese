import { NextResponse } from 'next/server';
import { activeSpace } from '../../../lib/active-space';
import { inferredCategoryStyle } from '../../../lib/category-style';

export async function GET() {
  try {
    const { sb, spaceId } = await activeSpace();

    const [categoriesResult, transactionsResult] = await Promise.all([
      sb
        .from('categories')
        .select('name,icon,color')
        .eq('space_id', spaceId)
        .order('name'),
      sb
        .from('transactions')
        .select('category_name')
        .eq('space_id', spaceId),
    ]);

    if (categoriesResult.error || transactionsResult.error) {
      return NextResponse.json(
        {
          error:
            categoriesResult.error?.message ||
            transactionsResult.error?.message,
        },
        { status: 400 }
      );
    }

    const counts = new Map<string, number>();
    for (const transaction of transactionsResult.data || []) {
      counts.set(
        transaction.category_name,
        (counts.get(transaction.category_name) || 0) + 1
      );
    }

    const categories = new Map<
      string,
      { name: string; icon?: string | null; color?: string | null }
    >();

    for (const category of categoriesResult.data || []) {
      categories.set(category.name, category);
    }

    // Keep old/imported categories visible even if they do not yet have a
    // dedicated row in categories.
    for (const transaction of transactionsResult.data || []) {
      if (!categories.has(transaction.category_name)) {
        categories.set(transaction.category_name, {
          name: transaction.category_name,
        });
      }
    }

    const data = [...categories.values()]
      .map((category) => {
        const fallback = inferredCategoryStyle(category.name);
        return {
          name: category.name,
          icon: category.icon || fallback.icon,
          color: category.color || fallback.color,
          count: counts.get(category.name) || 0,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'it'));

    return NextResponse.json({ data });
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
    const body = await req.json();
    const name = String(body.name || '').trim();

    if (name.length < 2) {
      return NextResponse.json(
        { error: 'Nome troppo corto' },
        { status: 400 }
      );
    }

    const fallback = inferredCategoryStyle(name);
    const { data, error } = await sb
      .from('categories')
      .upsert(
        {
          user_id: user.id,
          space_id: spaceId,
          name,
          icon: body.icon || fallback.icon,
          color: body.color || fallback.color,
        },
        { onConflict: 'space_id,name' }
      )
      .select()
      .single();

    return NextResponse.json(
      { data, error: error?.message },
      { status: error ? 400 : 200 }
    );
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

export async function DELETE(req: Request) {
  try {
    const { sb, spaceId } = await activeSpace();
    const name = new URL(req.url).searchParams.get('name')?.trim();

    if (!name) {
      return NextResponse.json(
        { error: 'Categoria non valida.' },
        { status: 400 }
      );
    }

    const [transactionsResult, recurringResult] = await Promise.all([
      sb
        .from('transactions')
        .select('id', { count: 'exact', head: true })
        .eq('space_id', spaceId)
        .eq('category_name', name),
      sb
        .from('recurring_transactions')
        .select('id', { count: 'exact', head: true })
        .eq('space_id', spaceId)
        .eq('category_name', name)
        .eq('active', true),
    ]);

    if (transactionsResult.error || recurringResult.error) {
      return NextResponse.json(
        {
          error:
            transactionsResult.error?.message ||
            recurringResult.error?.message,
        },
        { status: 400 }
      );
    }

    const transactionCount = transactionsResult.count || 0;
    const recurringCount = recurringResult.count || 0;

    if (transactionCount > 0 || recurringCount > 0) {
      return NextResponse.json(
        {
          error:
            'La categoria è ancora utilizzata. Migra prima i movimenti e le ricorrenze.',
          count: transactionCount,
          recurringCount,
        },
        { status: 409 }
      );
    }

    const { data, error } = await sb
      .from('categories')
      .delete()
      .eq('space_id', spaceId)
      .eq('name', name)
      .select('name');

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    if (!data?.length) {
      return NextResponse.json(
        {
          error:
            'Categoria non trovata oppure non eliminabile nello spazio attivo.',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, name });
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
