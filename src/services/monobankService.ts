import axios from "axios";

const MONOBANK_API_BASE = "https://api.monobank.ua";

export interface MonobankClientInfo {
  clientId: string;
  name: string;
  webHookUrl: string;
  permissions: string;
  accounts: MonobankAccount[];
}

export interface MonobankAccount {
  id: string;
  sendId: string;
  balance: number;
  creditLimit: number;
  type: string;
  currencyCode: number;
  cashbackType: string;
  maskedPan: string[];
  iban: string;
}

export interface MonobankTransaction {
  id: string;
  time: number;
  description: string;
  mcc: number;
  originalMcc: number;
  amount: number;
  operationAmount: number;
  currencyCode: number;
  commissionRate: number;
  cashbackAmount: number;
  balance: number;
  comment: string;
  receiptId: string;
  invoiceId: string;
  counterEdrpou: string;
  counterIban: string;
  counterName: string;
}

export interface MonobankError {
  errorDescription: string;
}

export interface MonobankCurrencyRate {
  currencyCodeA: number;
  currencyCodeB: number;
  date: number;
  rateSell?: number;
  rateBuy?: number;
  rateCross?: number;
}

class MonobankService {
  private readonly baseURL = MONOBANK_API_BASE;

  /**
   * Get client information and accounts
   */
  async getClientInfo(token: string): Promise<MonobankClientInfo> {
    try {
      const response = await axios.get(`${this.baseURL}/personal/client-info`, {
        headers: {
          "X-Token": token,
        },
      });

      return response.data;
    } catch (error: any) {
      console.error(
        "Error fetching client info:",
        error.response?.data || error.message
      );

      if (error.response?.status === 429) {
        throw new Error("Too many requests. Please try again later.");
      }

      if (error.response?.status === 403) {
        throw new Error("Invalid API token or insufficient permissions.");
      }

      throw new Error(
        error.response?.data?.errorDescription || "Failed to fetch client info"
      );
    }
  }

  /**
   * Get account statement (transactions)
   * @param token API token
   * @param accountId Account ID (0 for default account)
   * @param from Unix timestamp (from date)
   * @param to Unix timestamp (to date, optional)
   */
  async getStatement(
    token: string,
    accountId: string = "0",
    from: number,
    to?: number
  ): Promise<MonobankTransaction[]> {
    try {
      let url = `${this.baseURL}/personal/statement/${accountId}/${from}`;
      if (to) {
        url += `/${to}`;
      }

      const response = await axios.get(url, {
        headers: {
          "X-Token": token,
        },
      });

      return response.data;
    } catch (error: any) {
      console.error(
        "Error fetching statement:",
        error.response?.data || error.message
      );

      if (error.response?.status === 429) {
        throw new Error("Too many requests. Please try again later.");
      }

      if (error.response?.status === 403) {
        throw new Error("Invalid API token or insufficient permissions.");
      }

      throw new Error(
        error.response?.data?.errorDescription || "Failed to fetch statement"
      );
    }
  }

  /**
   * Get Monobank currency rates (public endpoint, no token required)
   */
  async getCurrencyRates(): Promise<MonobankCurrencyRate[]> {
    try {
      const response = await axios.get(`${this.baseURL}/bank/currency`);
      return response.data;
    } catch (error: any) {
      console.error(
        "Error fetching Monobank currency rates:",
        error.response?.data || error.message
      );
      throw new Error("Failed to fetch Monobank currency rates");
    }
  }

  /**
   * Validate API token by trying to fetch client info
   */
  async validateToken(token: string): Promise<boolean> {
    try {
      await this.getClientInfo(token);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get transactions for the last N days
   */
  async getRecentTransactions(
    token: string,
    days: number = 30
  ): Promise<MonobankTransaction[]> {
    const now = Math.floor(Date.now() / 1000);
    const from = now - days * 24 * 60 * 60; // N days ago

    return this.getStatement(token, "0", from, now);
  }

  /**
   * Format currency code to currency symbol
   */
  formatCurrency(currencyCode: number): string {
    const currencies: { [key: number]: string } = {
      980: "UAH", // Ukrainian Hryvnia
      840: "USD", // US Dollar
      978: "EUR", // Euro
      985: "PLN", // Polish Zloty
    };

    return currencies[currencyCode] || `Currency ${currencyCode}`;
  }

  /**
   * Format amount from kopecks to hryvnias
   */
  formatAmount(amount: number): number {
    return amount / 100;
  }

  /**
   * Get MCC category description
   */
  getMCCCategory(mcc: number): string {
    const categories: { [key: number]: string } = {
      4121: "Taxi",
      4131: "Bus Transport",
      4411: "Cruise Lines",
      4511: "Airlines",
      4722: "Travel Agencies",
      4812: "Telecommunication",
      4814: "Telecommunication",
      4816: "Computer Network Services",
      4829: "Wire Transfer",
      4900: "Utilities",
      5172: "Petroleum Products",
      5192: "Books",
      5193: "Florists",
      5200: "Home Supply Warehouse",
      5211: "Lumber",
      5231: "Glass, Paint, Wallpaper",
      5251: "Hardware Stores",
      5261: "Nurseries, Lawn and Garden",
      5271: "Mobile Home Dealers",
      5300: "Wholesale Clubs",
      5309: "Duty Free Stores",
      5310: "Discount Stores",
      5311: "Department Stores",
      5331: "Variety Stores",
      5399: "Miscellaneous General Merchandise",
      5411: "Grocery Stores, Supermarkets",
      5422: "Freezer and Locker Meat Provisioners",
      5441: "Candy, Nut, and Confectionery Stores",
      5451: "Dairy Products Stores",
      5462: "Bakeries",
      5499: "Miscellaneous Food Stores",
      5511: "Car and Truck Dealers",
      5521: "Car and Truck Dealers",
      5531: "Auto and Home Supply Stores",
      5532: "Automotive Tire Stores",
      5533: "Automotive Parts and Accessories",
      5541: "Service Stations",
      5542: "Automated Fuel Dispensers",
      5551: "Boat Dealers",
      5561: "Recreational Vehicle Dealers",
      5571: "Motorcycle Shops and Dealers",
      5592: "Motor Homes Dealers",
      5598: "Snowmobile Dealers",
      5599: "Miscellaneous Automotive",
      5611: "Men's and Women's Clothing",
      5621: "Women's Ready-to-Wear",
      5631: "Women's Accessory Stores",
      5641: "Children's and Infants' Wear",
      5651: "Family Clothing Stores",
      5655: "Sports and Riding Apparel",
      5661: "Shoe Stores",
      5681: "Furriers and Fur Shops",
      5691: "Men's and Women's Clothing",
      5697: "Tailors, Alterations",
      5698: "Wig and Toupee Stores",
      5699: "Miscellaneous Apparel",
      5712: "Furniture, Home Furnishings",
      5713: "Floor Covering Stores",
      5714: "Drapery, Window Covering",
      5718: "Fireplaces, Fireplace Screens",
      5719: "Miscellaneous Home Furnishing",
      5722: "Household Appliance Stores",
      5732: "Electronics Stores",
      5733: "Music Stores",
      5734: "Computer Software Stores",
      5735: "Record Stores",
      5811: "Caterers",
      5812: "Eating Places, Restaurants",
      5813: "Drinking Places",
      5814: "Fast Food Restaurants",
      5912: "Drug Stores and Pharmacies",
      5921: "Package Stores-Beer, Wine",
      5931: "Used Merchandise Stores",
      5932: "Antique Shops",
      5933: "Pawn Shops",
      5935: "Wrecking and Salvage Yards",
      5937: "Antique Reproductions",
      5940: "Bicycle Shops",
      5941: "Sporting Goods Stores",
      5942: "Book Stores",
      5943: "Stationery, Office Supplies",
      5944: "Jewelry Stores, Watches",
      5945: "Hobby, Toy, and Game Shops",
      5946: "Camera and Photographic Supply",
      5947: "Gift, Card, Novelty",
      5948: "Luggage and Leather Goods",
      5949: "Sewing, Needlework, Fabric",
      5950: "Glassware, Crystal Stores",
      5960: "Direct Marketing Insurance",
      5962: "Direct Marketing Travel",
      5963: "Door-To-Door Sales",
      5964: "Direct Marketing Catalog",
      5965: "Direct Marketing Combination",
      5966: "Direct Marketing Outbound",
      5967: "Direct Marketing Inbound",
      5968: "Direct Marketing Subscription",
      5969: "Direct Marketing Other",
      5970: "Artist's Supply and Craft",
      5971: "Art Dealers and Galleries",
      5972: "Stamp and Coin Stores",
      5973: "Religious Goods Stores",
      5975: "Hearing Aids Sales",
      5976: "Orthopedic Goods",
      5977: "Cosmetic Stores",
      5978: "Typewriter Stores",
      5983: "Fuel Dealers",
      5992: "Florists",
      5993: "Cigar Stores and Stands",
      5994: "News Dealers and Newsstands",
      5995: "Pet Shops, Pet Food",
      5996: "Swimming Pools Sales",
      5997: "Electric Razor Stores",
      5998: "Tent and Awning Shops",
      5999: "Miscellaneous Specialty Retail",
      6010: "Manual Cash Disburse",
      6011: "ATM",
      6012: "Financial Institutions",
      6051: "Non-FI, Money Orders",
      6211: "Security Brokers/Dealers",
      6300: "Insurance Underwriting",
      6513: "Real Estate Agents",
      7011: "Hotels, Motels, and Resorts",
      7012: "Timeshares",
      7032: "Sporting/Recreation Camps",
      7033: "Trailer Parks, Campgrounds",
      7210: "Laundry, Cleaning Services",
      7211: "Laundries",
      7216: "Dry Cleaners",
      7217: "Carpet/Upholstery Clean",
      7221: "Photographic Studios",
      7230: "Barber and Beauty Shops",
      7251: "Shoe Repair/Hat Cleaning",
      7261: "Funeral Service, Crematories",
      7273: "Dating/Escort Services",
      7276: "Tax Preparation Services",
      7277: "Counseling Services",
      7278: "Buying/Shopping Services",
      7295: "Child Care Services",
      7296: "Clothing Rental",
      7297: "Massage Parlors",
      7298: "Health and Beauty Spas",
      7299: "Miscellaneous Personal Services",
      7311: "Advertising Services",
      7321: "Credit Reporting Agencies",
      7333: "Commercial Photography",
      7338: "Quick Copy, Repro, Blueprint",
      7339: "Stenographic Services",
      7342: "Exterminating Services",
      7349: "Cleaning and Maintenance",
      7361: "Employment/Temp Agencies",
      7372: "Computer Programming",
      7375: "Information Retrieval",
      7379: "Computer Maintenance",
      7392: "Consulting, Public Relations",
      7393: "Detective Agencies",
      7394: "Equipment Rental",
      7395: "Photofinishing",
      7399: "Miscellaneous Business Services",
      7511: "Truck Rental",
      7512: "Car Rental Agencies",
      7513: "Truck/Utility Trailer Rental",
      7519: "Recreational Vehicle Rental",
      7523: "Parking Lots, Garages",
      7531: "Auto Body Repair Shops",
      7534: "Tire Retreading",
      7535: "Auto Paint Shops",
      7538: "Auto Service Shops",
      7542: "Car Washes",
      7549: "Towing Services",
      7622: "Electronics Repair Shops",
      7623: "A/C, Refrigeration Repair",
      7629: "Small Appliance Repair",
      7631: "Watch/Jewelry Repair",
      7641: "Furniture Repair, Refinishing",
      7692: "Welding Repair",
      7699: "Miscellaneous Repair",
      7829: "Picture/Video Production",
      7832: "Motion Picture Theaters",
      7841: "Video Tape Rental Stores",
      7911: "Dance Halls, Studios",
      7922: "Theatrical Ticket Agencies",
      7929: "Bands, Orchestras",
      7932: "Billiard/Pool Establishments",
      7933: "Bowling Alleys",
      7941: "Sports Clubs/Fields",
      7991: "Tourist Attractions",
      7992: "Public Golf Courses",
      7993: "Video Amusement Game Supplies",
      7994: "Video Game Arcades",
      7995: "Betting/Casino Gambling",
      7996: "Amusement Parks/Carnivals",
      7997: "Country Clubs",
      7998: "Aquariums",
      7999: "Miscellaneous Recreation",
      8011: "Doctors",
      8021: "Dentists and Orthodontists",
      8031: "Osteopaths",
      8041: "Chiropractors",
      8042: "Optometrists, Ophthalmologist",
      8043: "Opticians, Eyeglasses",
      8049: "Podiatrists, Chiropodists",
      8050: "Nursing/Personal Care",
      8062: "Hospitals",
      8071: "Medical and Dental Labs",
      8099: "Medical Services",
      8111: "Legal Services, Attorneys",
      8211: "Elementary, Secondary Schools",
      8220: "Colleges, Universities",
      8241: "Correspondence Schools",
      8244: "Business/Secretarial Schools",
      8249: "Vocational/Trade Schools",
      8299: "Educational Services",
      8351: "Child Care Services",
      8398: "Charitable Organizations",
      8641: "Civic, Social, Fraternal Associations",
      8651: "Political Organizations",
      8661: "Religious Organizations",
      8675: "Automobile Associations",
      8699: "Membership Organizations",
      8734: "Testing Laboratories",
      8911: "Architectural/Surveying Services",
      8931: "Accounting/Bookkeeping Services",
      8999: "Professional Services",
      9211: "Court Costs",
      9222: "Fines - Government",
      9311: "Tax Payments - Government",
      9399: "Government Services",
      9402: "Postal Services",
      9405: "U.S. Federal Government Agencies",
    };

    return categories[mcc] || "Other";
  }
}

export default new MonobankService();
