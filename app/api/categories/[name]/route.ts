import { NextResponse } from 'next/server';
import { activeSpace } from '../../../../lib/active-space';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;
    const oldName = decodeURIComponent(name);
    const { sb, user, spaceId } = await activeSpace();
    const body = await req.json();

    const newName = String(body.newName || oldName).trim();
    const icon = String(body.icon || 'tag');
    const color = String(body.color || '#68738C');

    if (newName.length < 2) {
      return NextResponse.json(
        { error: 'Il nome deve avere almeno 2 caratteri.' },
        { status: 400 }
      );
    }

    if (newName !== oldName) {
      const { data: existing, error: existingError } = await sb
        .from('categories')
        .select('name')
        .eq('space_id', spaceId)
        .eq('name', newName)
        .maybeSingle();

      if (existingError) {
        return NextResponse.json(
          { error: existingError.message },
          { status: 400 }
        );
      }

      if (existing) {
        return NextResponse.json(
          {
            error:
              'Esiste già una categoria con questo nome. Usa "Migra ed elimina" per unirle.',
          },
          { status: 409 }
        );
      }
    }

    const { data: updated, error: categoryError } = await sb
      .from('categories')
      .update({ name: newName, icon, color })
      .eq('space_id', spaceId)
      .eq('name', oldName)
      .select('name')
      .maybeSingle();

    if (categoryError) {
      return NextResponse.json(
        { error: categoryError.message },
        { status: 400 }
      );
    }

    if (!updated) {
      return NextResponse.json(
        { error: 'Categoria non trovata nello spazio attivo.' },
        { status: 404 }
      );
    }

    if (newName !== oldName) {
      const { error: transactionError } = await sb
        .from('transactions')
        .update({ category_name: newName })
        .eq('space_id', spaceId)
        .eq('category_name', oldName);

      if (transactionError) {
        return NextResponse.json(
          { error: transactionError.message },
          { status: 400 }
        );
      }

      const { error: recurringError } = await sb
        .from('recurring_transactions')
        .update({ category_name: newName })
        .eq('space_id', spaceId)
        .eq('category_name', oldName);

      if (recurringError) {
        return NextResponse.json(
          { error: recurringError.message },
          { status: 400 }
        );
      }

      // Feedback remains personal in the current schema, so only the current
      // user's matching entries are renamed.
      await sb
        .from('classifier_feedback')
        .update({ category_name: newName })
        .eq('user_id', user.id)
        .eq('category_name', oldName);
    }

    return NextResponse.json({
      ok: true,
      oldName,
      newName,
      icon,
      color,
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
