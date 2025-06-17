export const CURRENCIES = {
  UAH: {
    code: "UAH",
    symbol: "₴",
    name: "Ukrainian Hryvnia",
    emoji: "🇺🇦",
  },
  USD: {
    code: "USD",
    symbol: "$",
    name: "US Dollar",
    emoji: "🇺🇸",
  },
  EUR: {
    code: "EUR",
    symbol: "€",
    name: "Euro",
    emoji: "🇪🇺",
  },
  PLN: {
    code: "PLN",
    symbol: "zł",
    name: "Polish Złoty",
    emoji: "🇵🇱",
  },
} as const;

export type CurrencyCode = keyof typeof CURRENCIES;

export const CURRENCY_BUTTONS = Object.entries(CURRENCIES).map(
  ([code, currency]) => ({
    text: `${currency.emoji} ${currency.code} (${currency.symbol})`,
    callback_data: `currency_${code}`,
  })
);
