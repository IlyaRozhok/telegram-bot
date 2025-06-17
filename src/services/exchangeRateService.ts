import axios from "axios";
import { CURRENCIES, CurrencyCode } from "../constants/currencies.js";

// Используем бесплатное API без ключа
const EXCHANGE_RATE_API_URL = "https://api.exchangerate-api.com/v4/latest";

interface ExchangeRateResponse {
  base: string;
  rates: Record<string, number>;
}

class ExchangeRateService {
  private static instance: ExchangeRateService;
  private rates: Record<string, number> = {};
  private lastUpdate: Date | null = null;
  private readonly CACHE_DURATION = 1000 * 60 * 60; // 1 hour

  private constructor() {}

  public static getInstance(): ExchangeRateService {
    if (!ExchangeRateService.instance) {
      ExchangeRateService.instance = new ExchangeRateService();
    }
    return ExchangeRateService.instance;
  }

  private async fetchRates(): Promise<void> {
    try {
      console.log("Fetching exchange rates...");
      const response = await axios.get<ExchangeRateResponse>(
        `${EXCHANGE_RATE_API_URL}/USD`
      );

      if (response.data && response.data.rates) {
        this.rates = response.data.rates;
        this.lastUpdate = new Date();
        console.log("Exchange rates updated successfully");
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Error fetching exchange rates:", error);
      // Устанавливаем фиксированные курсы как fallback
      this.rates = {
        UAH: 41.5,
        USD: 1,
        EUR: 0.92,
        PLN: 4.1,
      };
      this.lastUpdate = new Date();
      console.log("Using fallback exchange rates");
    }
  }

  private async ensureRatesAreFresh(): Promise<void> {
    const now = new Date();
    if (
      !this.lastUpdate ||
      now.getTime() - this.lastUpdate.getTime() > this.CACHE_DURATION
    ) {
      await this.fetchRates();
    }
  }

  public async convertAmount(
    amount: number,
    fromCurrency: CurrencyCode,
    toCurrency: CurrencyCode
  ): Promise<number> {
    if (fromCurrency === toCurrency) {
      return amount;
    }

    await this.ensureRatesAreFresh();

    // Конвертируем через USD как базовую валюту
    let amountInUSD = amount;

    // Сначала конвертируем в USD
    if (fromCurrency !== "USD") {
      amountInUSD = amount / this.rates[fromCurrency];
    }

    // Затем из USD в целевую валюту
    if (toCurrency === "USD") {
      return amountInUSD;
    } else {
      return amountInUSD * this.rates[toCurrency];
    }
  }

  public async formatAmount(
    amount: number,
    fromCurrency: CurrencyCode,
    toCurrency: CurrencyCode
  ): Promise<string> {
    const convertedAmount = await this.convertAmount(
      amount,
      fromCurrency,
      toCurrency
    );
    const currencyInfo = CURRENCIES[toCurrency];

    return `${currencyInfo.symbol}${convertedAmount.toFixed(2)}`;
  }

  public getAvailableCurrencies(): CurrencyCode[] {
    return Object.keys(CURRENCIES) as CurrencyCode[];
  }

  public async getCurrentRates(): Promise<Record<string, number>> {
    await this.ensureRatesAreFresh();
    return { ...this.rates };
  }
}

export default ExchangeRateService.getInstance();
