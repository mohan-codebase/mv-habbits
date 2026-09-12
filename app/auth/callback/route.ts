import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const rawNext = searchParams.get('next') ?? '/dashboard';

  // Open redirect defense: must start with single '/' and not '//' or '/\'
  const safeNext = (rawNext.startsWith('/') && !rawNext.startsWith('//') && !rawNext.startsWith('/\\'))
    ? rawNext
    : '/dashboard';
  
  // Use headers to determine the correct origin, especially on Vercel
  const host = request.headers.get('host');
  const protocol = request.headers.get('x-forwarded-proto') ?? 'http';
  const origin = `${protocol}://${host}`;

  if (code) {
    const supabase = await createServerClient();
    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && user) {
      return NextResponse.redirect(`${origin}${safeNext}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=Authentication failed. Please try again.`);
}
