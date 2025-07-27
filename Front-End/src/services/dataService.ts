import { useAuth } from '@/contexts/AuthContext';

// API Configuration
const API_BASE_URL = 'https://receipt-data-fetch-api-593566622908.us-central1.run.app';

// Types for API responses
export interface Receipt {
  id?: string;
  receipt_id?: string;
  vendor_name: string;
  date: string;
  timestamp?: string;
  total_amount: number;
  tax_amount?: number;
  taxes?: number;
  items: ReceiptItem[];
  bill_category?: string;
  category?: string;
  user_id: string;
  wallet_pass_url?: string;
  document_id?: string;
}

export interface ReceiptItem {
  name?: string;
  item_name?: string;
  quantity: number;
  unit_price: number;
}

export interface UserData {
  receipts: Receipt[];
  total_receipts: number;
  total_amount: number;
  categories: string[];
}

export interface UserAnalytics {
  total_receipts: number;
  total_spent: number;
  average_spending: number;
  categories_breakdown: CategoryBreakdown[];
  monthly_trends: MonthlyTrend[];
  top_vendors: VendorData[];
}

export interface CategoryBreakdown {
  category: string;
  total_amount: number;
  receipt_count: number;
  percentage: number;
}

export interface MonthlyTrend {
  month: string;
  total_amount: number;
  receipt_count: number;
}

export interface VendorData {
  vendor_name: string;
  total_amount: number;
  receipt_count: number;
}

export interface UserSummary {
  total_receipts: number;
  total_spent: number;
  categories_count: number;
  average_per_receipt: number;
  last_receipt_date: string;
}

export interface WalletPass {
  id: string;
  receipt_id: string;
  wallet_pass_url: string;
  created_at: string;
}

// Local Storage Keys
const STORAGE_KEYS = {
  USER_DATA: 'raseed_user_data',
  USER_ANALYTICS: 'raseed_user_analytics',
  USER_SUMMARY: 'raseed_user_summary',
  WALLET_PASSES: 'raseed_wallet_passes',
  CATEGORIES: 'raseed_categories',
  LAST_FETCH: 'raseed_last_fetch'
};

// Cache duration (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

class DataService {
  private async fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response;
  }

  private isDataStale(key: string): boolean {
    const lastFetch = localStorage.getItem(`${key}_timestamp`);
    if (!lastFetch) return true;
    
    const timeDiff = Date.now() - parseInt(lastFetch);
    return timeDiff > CACHE_DURATION;
  }

  private setDataWithTimestamp(key: string, data: any): void {
    localStorage.setItem(key, JSON.stringify(data));
    localStorage.setItem(`${key}_timestamp`, Date.now().toString());
    
    // Dispatch custom event to notify components of localStorage updates
    window.dispatchEvent(new Event('localStorageUpdated'));
  }

  private getDataFromStorage<T>(key: string): T | null {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Error parsing data from storage for key ${key}:`, error);
      return null;
    }
  }

  // Fetch all user receipts
  async getUserData(userId: string, forceRefresh = false): Promise<UserData> {
    const cacheKey = `${STORAGE_KEYS.USER_DATA}_${userId}`;
    
    if (!forceRefresh && !this.isDataStale(cacheKey)) {
      const cachedData = this.getDataFromStorage<UserData>(cacheKey);
      if (cachedData) {
        console.log('Returning cached user data');
        return cachedData;
      }
    }

    try {
      console.log('Fetching user data from API for user:', userId);
      const response = await this.fetchWithAuth(`/user-data/${encodeURIComponent(userId)}`);
      const data: UserData = await response.json();
      
      console.log('Raw API response:', data);
      console.log('First receipt structure:', data.receipts?.[0]);
      
      this.setDataWithTimestamp(cacheKey, data);
      console.log('User data fetched and cached:', data);
      return data;
    } catch (error) {
      console.error('Error fetching user data:', error);
      
      // Return cached data if API fails
      const cachedData = this.getDataFromStorage<UserData>(cacheKey);
      if (cachedData) {
        console.log('API failed, returning cached data');
        return cachedData;
      }
      
      // Return empty data structure if no cache
      return {
        receipts: [],
        total_receipts: 0,
        total_amount: 0,
        categories: []
      };
    }
  }

  // Fetch user analytics
  async getUserAnalytics(userId: string, forceRefresh = false): Promise<UserAnalytics> {
    const cacheKey = `${STORAGE_KEYS.USER_ANALYTICS}_${userId}`;
    
    if (!forceRefresh && !this.isDataStale(cacheKey)) {
      const cachedData = this.getDataFromStorage<UserAnalytics>(cacheKey);
      if (cachedData) {
        console.log('Returning cached analytics data');
        return cachedData;
      }
    }

    try {
      console.log('Fetching user analytics from API for user:', userId);
      const response = await this.fetchWithAuth(`/user-analytics/${encodeURIComponent(userId)}`);
      const data: UserAnalytics = await response.json();
      
      this.setDataWithTimestamp(cacheKey, data);
      console.log('User analytics fetched and cached:', data);
      return data;
    } catch (error) {
      console.error('Error fetching user analytics:', error);
      
      // Return cached data if API fails
      const cachedData = this.getDataFromStorage<UserAnalytics>(cacheKey);
      if (cachedData) {
        console.log('API failed, returning cached analytics');
        return cachedData;
      }
      
      // Return empty analytics structure if no cache
      return {
        total_receipts: 0,
        total_spent: 0,
        average_spending: 0,
        categories_breakdown: [],
        monthly_trends: [],
        top_vendors: []
      };
    }
  }

  // Fetch user summary
  async getUserSummary(userId: string, forceRefresh = false): Promise<UserSummary> {
    const cacheKey = `${STORAGE_KEYS.USER_SUMMARY}_${userId}`;
    
    if (!forceRefresh && !this.isDataStale(cacheKey)) {
      const cachedData = this.getDataFromStorage<UserSummary>(cacheKey);
      if (cachedData) {
        console.log('Returning cached summary data');
        return cachedData;
      }
    }

    try {
      console.log('Fetching user summary from API for user:', userId);
      const response = await this.fetchWithAuth(`/user-summary/${encodeURIComponent(userId)}`);
      const data: UserSummary = await response.json();
      
      this.setDataWithTimestamp(cacheKey, data);
      console.log('User summary fetched and cached:', data);
      return data;
    } catch (error) {
      console.error('Error fetching user summary:', error);
      
      // Return cached data if API fails
      const cachedData = this.getDataFromStorage<UserSummary>(cacheKey);
      if (cachedData) {
        console.log('API failed, returning cached summary');
        return cachedData;
      }
      
      // Return empty summary structure if no cache
      return {
        total_receipts: 0,
        total_spent: 0,
        categories_count: 0,
        average_per_receipt: 0,
        last_receipt_date: ''
      };
    }
  }

  // Fetch user wallet passes
  async getUserWalletPasses(userId: string, forceRefresh = false): Promise<WalletPass[]> {
    const cacheKey = `${STORAGE_KEYS.WALLET_PASSES}_${userId}`;
    
    if (!forceRefresh && !this.isDataStale(cacheKey)) {
      const cachedData = this.getDataFromStorage<WalletPass[]>(cacheKey);
      if (cachedData) {
        console.log('Returning cached wallet passes');
        return cachedData;
      }
    }

    try {
      console.log('Fetching user wallet passes from API for user:', userId);
      const response = await this.fetchWithAuth(`/user-wallet-passes/${encodeURIComponent(userId)}`);
      const data: WalletPass[] = await response.json();
      
      this.setDataWithTimestamp(cacheKey, data);
      console.log('Wallet passes fetched and cached:', data);
      return data;
    } catch (error) {
      console.error('Error fetching wallet passes:', error);
      
      // Return cached data if API fails
      const cachedData = this.getDataFromStorage<WalletPass[]>(cacheKey);
      if (cachedData) {
        console.log('API failed, returning cached wallet passes');
        return cachedData;
      }
      
      return [];
    }
  }

  // Fetch receipt details
  async getReceiptDetails(receiptId: string, userId: string): Promise<Receipt | null> {
    try {
      console.log('Fetching receipt details for:', receiptId);
      const response = await this.fetchWithAuth(`/receipt-details/${receiptId}?user_id=${encodeURIComponent(userId)}`);
      const data: Receipt = await response.json();
      
      console.log('Receipt details fetched:', data);
      return data;
    } catch (error) {
      console.error('Error fetching receipt details:', error);
      return null;
    }
  }

  // Fetch available categories
  async getCategories(forceRefresh = false): Promise<string[]> {
    const cacheKey = STORAGE_KEYS.CATEGORIES;
    
    if (!forceRefresh && !this.isDataStale(cacheKey)) {
      const cachedData = this.getDataFromStorage<string[]>(cacheKey);
      if (cachedData) {
        console.log('Returning cached categories');
        return cachedData;
      }
    }

    try {
      console.log('Fetching categories from API');
      const response = await this.fetchWithAuth('/categories');
      const data: string[] = await response.json();
      
      this.setDataWithTimestamp(cacheKey, data);
      console.log('Categories fetched and cached:', data);
      return data;
    } catch (error) {
      console.error('Error fetching categories:', error);
      
      // Return cached data if API fails
      const cachedData = this.getDataFromStorage<string[]>(cacheKey);
      if (cachedData) {
        console.log('API failed, returning cached categories');
        return cachedData;
      }
      
      // Return default categories
      return [
        'Electronics',
        'Food & Dining',
        'Transportation',
        'Shopping',
        'Entertainment',
        'Bills & Utilities',
        'Healthcare',
        'Education',
        'Travel',
        'Groceries',
        'Other'
      ];
    }
  }

  // Clear all cached data for a user
  clearUserCache(userId: string): void {
    const keys = Object.values(STORAGE_KEYS);
    keys.forEach(key => {
      const userSpecificKey = `${key}_${userId}`;
      localStorage.removeItem(userSpecificKey);
      localStorage.removeItem(`${userSpecificKey}_timestamp`);
    });
    console.log('User cache cleared for:', userId);
  }

  // Clear all app data
  clearAllCache(): void {
    const keys = Object.values(STORAGE_KEYS);
    keys.forEach(key => {
      // Remove all variations of the key
      for (let i = 0; i < localStorage.length; i++) {
        const storageKey = localStorage.key(i);
        if (storageKey && storageKey.startsWith(key)) {
          localStorage.removeItem(storageKey);
        }
      }
    });
    console.log('All cache cleared');
  }

  // Initialize user data when they log in
  async initializeUserData(userId: string): Promise<void> {
    console.log('Initializing user data for:', userId);
    try {
      // Fetch all user data in parallel
      await Promise.all([
        this.getUserData(userId, true),
        this.getUserAnalytics(userId, true),
        this.getUserSummary(userId, true),
        this.getUserWalletPasses(userId, true),
        this.getCategories(true)
      ]);
      console.log('User data initialization complete');
    } catch (error) {
      console.error('Error initializing user data:', error);
    }
  }
}

// Export singleton instance
export const dataService = new DataService();

// Export hook for easy use in components
export const useDataService = () => {
  return dataService;
};
