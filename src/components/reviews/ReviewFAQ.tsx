import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { FAQItem } from '@/types/seo-settings';
import { renderTemplate } from '@/utils/template-renderer';

interface ReviewFAQProps {
  faqItems: FAQItem[];
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

export function ReviewFAQ({ faqItems, reviewData }: ReviewFAQProps) {
  if (!faqItems || faqItems.length === 0) return null;

  return (
    <section className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6 md:p-8 mb-8">
      <h2 className="text-3xl font-bold text-white mb-6">
        Häufig gestellte Fragen zu {reviewData.category}
      </h2>

      <Accordion type="single" collapsible className="w-full">
        {faqItems.map((item, index) => {
          const renderedQuestion = renderTemplate(item.question, reviewData);
          const renderedAnswer = renderTemplate(item.answer, reviewData);

          return (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left text-white hover:text-orange-500">
                {renderedQuestion}
              </AccordionTrigger>
              <AccordionContent className="text-base text-gray-300">
                {renderedAnswer}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </section>
  );
}
