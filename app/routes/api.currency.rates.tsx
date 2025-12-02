import { json, type LoaderFunctionArgs } from "@remix-run/node";

// Fetch exchange rates from free API
async function fetchExchangeRates(baseCurrency: string = "USD") {
  try {
    // Using exchangerate-api.com free tier (no API key required for basic usage)
    // This API updates daily and is free for non-commercial use
    // For production, consider using a paid API like fixer.io or currencyapi.com for more frequent updates
    const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${baseCurrency}`, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch exchange rates');
    }

    const data = await response.json();
    return data.rates;
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    // Fallback to approximate rates if API fails
    return getFallbackRates(baseCurrency);
  }
}

// Fallback rates if API is unavailable
function getFallbackRates(baseCurrency: string): Record<string, number> {
  const fallbackRates: Record<string, Record<string, number>> = {
    USD: { PKR: 278.5, EUR: 0.92, GBP: 0.79, AED: 3.67, SAR: 3.75, INR: 83.1, CNY: 7.24, JPY: 149.5, CAD: 1.35, AUD: 1.52 },
    PKR: { USD: 0.0036, EUR: 0.0033, GBP: 0.0028, AED: 0.013, SAR: 0.013, INR: 0.30, CNY: 0.026, JPY: 0.54, CAD: 0.0048, AUD: 0.0055 },
    EUR: { USD: 1.09, PKR: 303.0, GBP: 0.86, AED: 4.00, SAR: 4.08, INR: 90.4, CNY: 7.88, JPY: 162.8, CAD: 1.47, AUD: 1.65 },
    GBP: { USD: 1.27, PKR: 353.0, EUR: 1.16, AED: 4.66, SAR: 4.76, INR: 105.4, CNY: 9.19, JPY: 189.8, CAD: 1.71, AUD: 1.92 },
    AED: { USD: 0.27, PKR: 75.8, EUR: 0.25, GBP: 0.21, SAR: 1.02, INR: 22.6, CNY: 1.97, JPY: 40.7, CAD: 0.37, AUD: 0.41 },
    SAR: { USD: 0.27, PKR: 74.2, EUR: 0.25, GBP: 0.21, AED: 0.98, INR: 22.2, CNY: 1.93, JPY: 39.9, CAD: 0.36, AUD: 0.41 },
    INR: { USD: 0.012, PKR: 3.35, EUR: 0.011, GBP: 0.0095, AED: 0.044, SAR: 0.045, CNY: 0.087, JPY: 1.80, CAD: 0.016, AUD: 0.018 },
    CNY: { USD: 0.14, PKR: 38.5, EUR: 0.13, GBP: 0.11, AED: 0.51, SAR: 0.52, INR: 11.5, JPY: 20.7, CAD: 0.19, AUD: 0.21 },
    JPY: { USD: 0.0067, PKR: 1.86, EUR: 0.0061, GBP: 0.0053, AED: 0.025, SAR: 0.025, INR: 0.56, CNY: 0.048, CAD: 0.0090, AUD: 0.010 },
    CAD: { USD: 0.74, PKR: 206.0, EUR: 0.68, GBP: 0.59, AED: 2.72, SAR: 2.78, INR: 61.6, CNY: 5.36, JPY: 110.7, AUD: 1.13 },
    AUD: { USD: 0.66, PKR: 183.0, EUR: 0.61, GBP: 0.52, AED: 2.42, SAR: 2.47, INR: 54.7, CNY: 4.76, JPY: 98.3, CAD: 0.89 },
  };
  return fallbackRates[baseCurrency] || {};
}

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const baseCurrency = url.searchParams.get("base") || "USD";

  const rates = await fetchExchangeRates(baseCurrency);
  
  return json({
    rates,
    base: baseCurrency,
    lastUpdated: new Date().toISOString(),
  });
}

