import { cookies } from 'next/headers';
import { AdminDashboard } from '@/components/AdminDashboard';
import { SESSION_COOKIE, verifyAdminRequest } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const auth = await verifyAdminRequest(token);

  if (auth.status === 'ok') {
    return (
      <AdminDashboard
        mode="authorized"
        adminEmail={auth.user.email}
        adminName={auth.user.name}
      />
    );
  }

  if (auth.status === 'forbidden') {
    return (
      <AdminDashboard
        mode="forbidden"
        adminEmail=""
        currentEmail={auth.currentEmail}
      />
    );
  }

  if (auth.status === 'no_database') {
    return (
      <AdminDashboard
        mode="no_database"
        adminEmail=""
      />
    );
  }

  return (
    <AdminDashboard
      mode="unauthenticated"
      adminEmail=""
    />
  );
}
