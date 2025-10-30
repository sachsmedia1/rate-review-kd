import { Helmet } from 'react-helmet-async';
import { useSEOSettings } from '@/hooks/useSEOSettings';

export const RobotsMetaTag = () => {
  const { settings, loading } = useSEOSettings();

  if (loading || !settings) return null;

  const robotsContent = settings.enable_indexing 
    ? 'index, follow' 
    : 'noindex, nofollow';

  return (
    <Helmet>
      <meta name="robots" content={robotsContent} />
    </Helmet>
  );
};
