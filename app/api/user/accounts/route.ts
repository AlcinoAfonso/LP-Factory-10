// app/api/user/accounts/route.ts
import { NextResponse } from 'next/server';
import { listUserAccounts } from '@/lib/access/adapters/accountAdapter';

// Evita cache e garante execução no servidor Node.js
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    // Lê a view via adapter (RLS aplicada ao usuário autenticado)
    const items = await listUserAccounts();

    // Resposta padronizada para o AccountSwitcher
    return NextResponse.json(
      items.map((i) => ({
        accountId: i.accountId,
        accountName: i.accountName,
        accountSubdomain: i.accountSubdomain,
        accountStatus: i.accountStatus,
        memberRole: i.memberRole,
        memberStatus: i.memberStatus,
      })),
      { status: 200 }
    );
  } catch (err: any) {
    // Log mínimo e resposta genérica
    // eslint-disable-next-line no-console
    console.error('GET /api/user/accounts failed:', err?.message ?? String(err));
    return NextResponse.json({ error: 'failed_to_list_accounts' }, { status: 500 });
  }
}
