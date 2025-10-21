
import CropDetailsPageClient from './client';

type CropDetailsPageProps = {
  params: {
    landId: string;
    cropId: string;
  };
};

// This is a new Server Component wrapper
export default async function CropDetailsPage({ params }: CropDetailsPageProps) {
  // The `params` promise is implicitly resolved by Next.js in Server Components
  const { landId, cropId } = params;

  return <CropDetailsPageClient landId={landId} cropId={cropId} />;
}
