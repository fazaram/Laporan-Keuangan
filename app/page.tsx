import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import LandingPage from '@/components/LandingPage';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  // We show the landing page regardless, but the landing page internal logic
  // handles the CTA based on the session (Go to Dashboard vs Register).
  return <LandingPage />;
}
