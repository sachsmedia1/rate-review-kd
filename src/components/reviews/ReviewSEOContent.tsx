import { CategorySEOContent } from '@/types/seo-settings';
import { renderTemplate } from '@/utils/template-renderer';

interface ReviewSEOContentProps {
  seoData: CategorySEOContent;
  reviewData: {
    category: string;
    city: string;
    postal_code: string;
    region: string;
    installation_date: string;
    customer: {
      salutation: string;
      lastname: string;
    };
    rating: number;
  };
}

export function ReviewSEOContent({ seoData, reviewData }: ReviewSEOContentProps) {
  const renderedHeading = renderTemplate(seoData.heading, reviewData);
  const renderedDescription = renderTemplate(seoData.description, reviewData);

  return (
    <section className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6 md:p-8 mb-8">
      <h2 className="text-3xl font-bold text-white mb-6">
        {renderedHeading}
      </h2>

      <div 
        className="prose prose-lg dark:prose-invert max-w-none text-gray-300"
        dangerouslySetInnerHTML={{ __html: renderedDescription }}
      />
    </section>
  );
}
