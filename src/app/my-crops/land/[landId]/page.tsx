
import LandDetailsPageClient from './client';

type LandDetailsPageProps = {
  params: { landId: string };
};

// This is a new Server Component wrapper
export default async function LandDetailsPage({ params }: LandDetailsPageProps) {
  // The `params` promise is implicitly resolved by Next.js in Server Components
  const { landId } = params;

  return <LandDetailsPageClient landId={landId} />;
}
