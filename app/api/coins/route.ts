import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { safeErrorMessage } from '@/lib/utils/api';

function ok<T>(data: T, status = 200) {
  return NextResponse.json({ data, error: null }, { status });
}
function err(message: string, status = 400) {
  return NextResponse.json({ data: null, error: message }, { status });
}

/**
 * GET /api/coins
 * Returns { coins, transactions }
 * Query params:
 *   limit  — max transactions to return (default 20)
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return err('Unauthorized', 401);

    const sp = req.nextUrl.searchParams;
    const limit = Math.min(Number(sp.get('limit')) || 20, 100);

    const [profileRes, txnRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('coins')
        .eq('id', user.id)
        .single(),
      supabase
        .from('coin_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit),
    ]);

    if (profileRes.error) return err(safeErrorMessage(profileRes.error, 'Failed to load coins'), 500);

    return ok({
      coins: profileRes.data?.coins ?? 0,
      transactions: txnRes.data ?? [],
    });
  } catch (e) {
    return err(safeErrorMessage(e, 'Failed to load coins'), 500);
  }
}
