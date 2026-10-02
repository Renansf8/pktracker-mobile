export const convertUsdToBrl = (usdValue: number): string => {
  return usdValue.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
};

export const formatCurrency = (value: number, currency: string): string => {
  const currencyFormats: Record<string, { locale: string; currency: string }> = {
    USD: { locale: "en-US", currency: "USD" },
    EUR: { locale: "de-DE", currency: "EUR" },
    BRL: { locale: "pt-BR", currency: "BRL" },
  };
  const format = currencyFormats[currency] ?? currencyFormats["USD"]!;
  return value.toLocaleString(format.locale, {
    style: "currency",
    currency: format.currency,
  });
};

export function getEurToUsdRate(rates: Record<string, number> | undefined): number {
  if (!rates?.EUR) return 1;
  return 1 / rates.EUR;
}

export function toUsd(value: number, currency: string, eurToUsdRate: number): number {
  if (currency === "EUR") return value * eurToUsdRate;
  return value;
}
