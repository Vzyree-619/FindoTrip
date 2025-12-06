import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { DollarSign, TrendingUp, Globe, Info, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { useState, useEffect } from "react";

// Common currencies used in the platform
const currencies = [
  { code: "PKR", name: "Pakistani Rupee", symbol: "₨" },
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "AED", name: "UAE Dirham", symbol: "د.إ" },
  { code: "SAR", name: "Saudi Riyal", symbol: "﷼" },
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$" },
];

// Fetch exchange rates from free API (server-side)
async function fetchExchangeRates(baseCurrency: string = "USD") {
  try {
    // Using exchangerate-api.com free tier (no API key required for basic usage)
    // Updates daily and is free for non-commercial use
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
    return null;
  }
}

export async function loader({ request }: LoaderFunctionArgs) {
  // Fetch initial exchange rates (using USD as base)
  const rates = await fetchExchangeRates("USD");
  
  return json({ 
    currencies,
    initialRates: rates || {},
    lastUpdated: new Date().toISOString(),
  });
}

export default function CurrencyPage() {
  const { currencies, initialRates, lastUpdated } = useLoaderData<typeof loader>();
  const [amount, setAmount] = useState<string>("1");
  const [fromCurrency, setFromCurrency] = useState<string>("USD");
  const [toCurrency, setToCurrency] = useState<string>("PKR");
  const [convertedAmount, setConvertedAmount] = useState<string>("");
  const [rates, setRates] = useState<Record<string, number>>(initialRates || {});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [rateLastUpdated, setRateLastUpdated] = useState<string>(lastUpdated);

  // Fetch fresh rates when currency changes
  useEffect(() => {
    const fetchRates = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/currency/rates?base=${fromCurrency}`);
        if (response.ok) {
          const data = await response.json();
          setRates(data.rates || {});
          setRateLastUpdated(data.lastUpdated || new Date().toISOString());
        }
      } catch (error) {
        console.error('Error fetching rates:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRates();
  }, [fromCurrency]);

  const handleConvert = () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setConvertedAmount("0.00");
      return;
    }

    if (fromCurrency === toCurrency) {
      setConvertedAmount(numAmount.toFixed(2));
      return;
    }

    // Get exchange rate from fetched rates
    const rate = rates[toCurrency];
    if (rate) {
      const converted = numAmount * rate;
      setConvertedAmount(converted.toFixed(2));
    } else {
      setConvertedAmount("Rate not available");
    }
  };

  const handleRefreshRates = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/currency/rates?base=${fromCurrency}`);
      if (response.ok) {
        const data = await response.json();
        setRates(data.rates || {});
        setRateLastUpdated(data.lastUpdated || new Date().toISOString());
      }
    } catch (error) {
      console.error('Error refreshing rates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwap = () => {
    const temp = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(temp);
    setConvertedAmount("");
  };

  const fromSymbol = currencies.find(c => c.code === fromCurrency)?.symbol || "";
  const toSymbol = currencies.find(c => c.code === toCurrency)?.symbol || "";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <DollarSign className="w-10 h-10 text-[#01502E]" />
            <h1 className="text-4xl font-bold text-gray-900">Currency Converter</h1>
          </div>
          <p className="text-gray-600 text-lg">
            Convert between different currencies quickly and easily
          </p>
        </div>

        {/* Converter Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Exchange Rate Calculator
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* From Currency */}
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Input
                      id="amount"
                      type="number"
                      value={amount}
                      onChange={(e) => {
                        setAmount(e.target.value);
                        setConvertedAmount("");
                      }}
                      placeholder="Enter amount"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="w-48">
                    <input type="hidden" name="fromCurrency" id="fromCurrency-value" value={fromCurrency} />
                    <Select value={fromCurrency} onValueChange={(value) => {
                      setFromCurrency(value);
                      const hiddenInput = document.getElementById('fromCurrency-value') as HTMLInputElement;
                      if (hiddenInput) hiddenInput.value = value;
                      setConvertedAmount("");
                    }}>
                      <SelectTrigger id="fromCurrency" className="w-full">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map((currency) => (
                          <SelectItem key={currency.code} value={currency.code || ""}>
                            {currency.code} - {currency.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Swap Button */}
              <div className="flex justify-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSwap}
                  className="rounded-full"
                >
                  ⇅ Swap
                </Button>
              </div>

              {/* To Currency */}
              <div className="space-y-2">
                <Label htmlFor="converted">Converted Amount</Label>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Input
                      id="converted"
                      type="text"
                      value={convertedAmount ? `${toSymbol} ${convertedAmount}` : ""}
                      readOnly
                      placeholder="Converted amount will appear here"
                      className="bg-gray-50"
                    />
                  </div>
                  <div className="w-48">
                    <input type="hidden" name="toCurrency" id="toCurrency-value" value={toCurrency} />
                    <Select value={toCurrency} onValueChange={(value) => {
                      setToCurrency(value);
                      const hiddenInput = document.getElementById('toCurrency-value') as HTMLInputElement;
                      if (hiddenInput) hiddenInput.value = value;
                      setConvertedAmount("");
                    }}>
                      <SelectTrigger id="toCurrency" className="w-full">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map((currency) => (
                          <SelectItem key={currency.code} value={currency.code || ""}>
                            {currency.code} - {currency.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Convert and Refresh Buttons */}
              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={handleConvert}
                  className="flex-1 bg-[#01502E] hover:bg-[#013d23] text-white"
                  disabled={isLoading}
                >
                  Convert
                </Button>
                <Button
                  type="button"
                  onClick={handleRefreshRates}
                  variant="outline"
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh Rates
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Supported Currencies */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Supported Currencies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currencies.map((currency) => (
                <div
                  key={currency.code}
                  className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-[#01502E] transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-[#01502E] text-white flex items-center justify-center font-bold">
                    {currency.symbol}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{currency.code}</div>
                    <div className="text-sm text-gray-600">{currency.name}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Info Note */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Exchange Rate Information</p>
                <p>
                  Exchange rates are approximate and may vary. For accurate, real-time rates, 
                  please consult your bank or a financial service provider. Rates are updated 
                  periodically and are for informational purposes only.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

