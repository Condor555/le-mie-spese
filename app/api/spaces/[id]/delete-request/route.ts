import { NextResponse } from 'next/server';
import { createClient } from '../../../../../lib/supabase/server';

async function getState(sb: any, spaceId: string) {
  const [{ count }, { data: request, error }] = await Promise.all([
    sb.from('space_members').select('user_id', { count: 'exact', head: true }).eq('space_id', spaceId),
    sb.from('space_delete_requests')
      .select('id,status,requested_by,space_delete_votes(user_id,vote)')
      .eq('space_id', spaceId).eq('status', 'pending').maybeSingle(),
  ]);
  return { members: count || 0, request, error };
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const state = await getState(sb, id);
  const myVote = state.request?.space_delete_votes?.find((v: any) => v.user_id === user.id)?.vote || null;
  return NextResponse.json({ data: state.request, members: state.members, myVote });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: membership } = await sb.from('space_members').select('role').eq('space_id', id).eq('user_id', user.id).maybeSingle();
  if (!membership) return NextResponse.json({ error: 'Non fai parte dello spazio' }, { status: 403 });

  const { data: space } = await sb.from('spaces').select('type').eq('id', id).maybeSingle();
  if (!space) return NextResponse.json({ error: 'Spazio non trovato' }, { status: 404 });
  if (space.type === 'personal') return NextResponse.json({ error: 'Lo spazio personale non può essere eliminato' }, { status: 400 });

  const body = await req.json().catch(() => ({}));

  if (body.requestId && body.vote) {
    if (!['approve', 'reject'].includes(body.vote)) return NextResponse.json({ error: 'Voto non valido' }, { status: 400 });
    const state = await getState(sb, id);
    if (!state.request || state.request.id !== body.requestId) return NextResponse.json({ error: 'Richiesta non valida' }, { status: 400 });

    const { error: voteError } = await sb.from('space_delete_votes').upsert(
      { request_id: body.requestId, user_id: user.id, vote: body.vote },
      { onConflict: 'request_id,user_id' }
    );
    if (voteError) return NextResponse.json({ error: voteError.message }, { status: 400 });

    const { data: final, error: rpcError } = await sb.rpc('finalize_space_delete', { p_request_id: body.requestId });
    if (rpcError) return NextResponse.json({ error: rpcError.message }, { status: 400 });
    return NextResponse.json(final);
  }

  const existing = await getState(sb, id);
  if (existing.request) {
    const myVote = existing.request.space_delete_votes?.find((v: any) => v.user_id === user.id)?.vote || null;
    return NextResponse.json({ status: 'pending', data: existing.request, members: existing.members, myVote });
  }

  const { data: requestRow, error: createError } = await sb.from('space_delete_requests')
    .insert({ space_id: id, requested_by: user.id }).select().single();
  if (createError) return NextResponse.json({ error: createError.message }, { status: 400 });

  const { error: firstVoteError } = await sb.from('space_delete_votes')
    .insert({ request_id: requestRow.id, user_id: user.id, vote: 'approve' });
  if (firstVoteError) return NextResponse.json({ error: firstVoteError.message }, { status: 400 });

  const { data: final, error: rpcError } = await sb.rpc('finalize_space_delete', { p_request_id: requestRow.id });
  if (rpcError) return NextResponse.json({ error: rpcError.message }, { status: 400 });
  return NextResponse.json({ ...final, data: requestRow, myVote: 'approve' });
}
