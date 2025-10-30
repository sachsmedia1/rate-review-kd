interface ReviewData {
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
}

const MONTH_NAMES_DE: Record<number, string> = {
  1: 'Januar', 2: 'Februar', 3: 'März', 4: 'April',
  5: 'Mai', 6: 'Juni', 7: 'Juli', 8: 'August',
  9: 'September', 10: 'Oktober', 11: 'November', 12: 'Dezember'
};

export function renderTemplate(template: string, data: ReviewData): string {
  const installDate = new Date(data.installation_date);
  const month = installDate.getMonth() + 1;
  const year = installDate.getFullYear();

  const replacements: Record<string, string> = {
    '{category}': data.category,
    '{city}': data.city,
    '{postal_code}': data.postal_code,
    '{region}': data.region,
    '{installation_month}': MONTH_NAMES_DE[month],
    '{installation_year}': year.toString(),
    '{customer_salutation}': data.customer.salutation,
    '{customer_lastname}': data.customer.lastname,
    '{rating}': data.rating.toString()
  };

  let rendered = template;
  Object.entries(replacements).forEach(([key, value]) => {
    rendered = rendered.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
  });

  return rendered;
}
