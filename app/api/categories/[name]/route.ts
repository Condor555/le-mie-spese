import { NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const oldName = decodeURIComponent(name);

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

  // Se stiamo rinominando, controlla che la nuova categoria
  // non esista già.
  if (newName !== oldName) {
    const { data: existing } = await sb
      .from('categories')
      .select('name')
      .eq('user_id', user.id)
      .eq('name', newName)
      .maybeSingle();

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

  // Aggiorna la categoria
  const { error: categoryError } = await sb
    .from('categories')
    .update({
      name: newName,
      icon,
      color,
    })
    .eq('user_id', user.id)
    .eq('name', oldName);

  if (categoryError) {
    return NextResponse.json(
      { error: categoryError.message },
      { status: 400 }
    );
  }

  // Se il nome è cambiato, aggiorna tutti i riferimenti.
  if (newName !== oldName) {
    const { error: transactionError } = await sb
      .from('transactions')
      .update({
        category_name: newName,
      })
      .eq('user_id', user.id)
      .eq('category_name', oldName);

    if (transactionError) {
      return NextResponse.json(
        { error: transactionError.message },
        { status: 400 }
      );
    }

    await sb
      .from('classifier_feedback')
      .update({
        category_name: newName,
      })
      .eq('user_id', user.id)
      .eq('category_name', oldName);

    await sb
      .from('recurring_transactions')
      .update({
        category_name: newName,
      })
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
}
