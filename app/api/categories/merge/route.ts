import { NextResponse } from 'next/server';
import { activeSpace } from '../../../../lib/active-space';

export async function POST(req: Request) {
  try {
    const { sb, user, spaceId } = await activeSpace();
    const { source, target } = await req.json();
    const sourceName = String(source || '').trim();
    const targetName = String(target || '').trim();

    if (!sourceName || !targetName || sourceName === targetName) {
      return NextResponse.json(
        { error: 'Categorie non valide' },
        { status: 400 }
      );
    }

    const { data: targetCategory, error: targetError } = await sb
      .from('categories')
      .select('name')
      .eq('space_id', spaceId)
      .eq('name', targetName)
      .maybeSingle();

    if (targetError) {
      return NextResponse.json(
        { error: targetError.message },
        { status: 400 }
      );
    }

    if (!targetCategory) {
      return NextResponse.json(
        { error: 'Categoria destinazione inesistente' },
        { status: 400 }
      );
    }

    const { error: transactionError } = await sb
      .from('transactions')
      .update({ category_name: targetName })
      .eq('space_id', spaceId)
      .eq('category_name', sourceName);

    if (transactionError) {
      return NextResponse.json(
        { error: transactionError.message },
        { status: 400 }
      );
    }

    const { error: recurringError } = await sb
      .from('recurring_transactions')
      .update({ category_name: targetName })
      .eq('space_id', spaceId)
      .eq('category_name', sourceName);

    if (recurringError) {
      return NextResponse.json(
        { error: recurringError.message },
        { status: 400 }
      );
    }

    await sb
      .from('classifier_feedback')
      .update({ category_name: targetName })
      .eq('user_id', user.id)
      .eq('category_name', sourceName);

    const { data: deleted, error: deleteError } = await sb
      .from('categories')
      .delete()
      .eq('space_id', spaceId)
      .eq('name', sourceName)
      .select('name');

    if (deleteError) {
      return NextResponse.json(
        { error: deleteError.message },
        { status: 400 }
      );
    }

    if (!deleted?.length) {
      return NextResponse.json(
        { error: 'Categoria origine non trovata nello spazio attivo.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true });
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
