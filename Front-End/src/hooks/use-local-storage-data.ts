import { useState, useEffect } from 'react';
import { Receipt, UserData, UserSummary, UserAnalytics } from '@/services/dataService';

// Custom hook to monitor localStorage changes and provide real-time data
export const useLocalStorageData = (userId: string) => {
  const [localData, setLocalData] = useState<{
    receipts: Receipt[];
    summary: UserSummary | null;
    analytics: UserAnalytics | null;
    lastUpdated: Date | null;
  }>({
    receipts: [],
    summary: null,
    analytics: null,
    lastUpdated: null
  });

  const extractDataFromStorage = () => {
    try {
      // Get all localStorage data for the user
      const userDataKey = `raseed_user_data_${userId}`;
      const userSummaryKey = `raseed_user_summary_${userId}`;
      const userAnalyticsKey = `raseed_user_analytics_${userId}`;

      // Extract user data (receipts)
      const userDataStr = localStorage.getItem(userDataKey);
      let receipts: Receipt[] = [];
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        console.log('Raw localStorage userData:', userData);
        
        // Check if it's a wrapped API response
        if (userData.success && userData.receipts) {
          receipts = userData.receipts;
        } else if (userData.receipts) {
          receipts = userData.receipts;
        } else if (Array.isArray(userData)) {
          receipts = userData;
        }
      }

      // Extract user summary
      const summaryStr = localStorage.getItem(userSummaryKey);
      let summary: UserSummary | null = null;
      if (summaryStr) {
        const summaryData = JSON.parse(summaryStr);
        console.log('Raw localStorage summary:', summaryData);
        
        if (summaryData.success && summaryData.summary) {
          summary = summaryData.summary;
        } else if (summaryData.total_receipts !== undefined) {
          summary = summaryData;
        }
      }

      // Extract analytics
      const analyticsStr = localStorage.getItem(userAnalyticsKey);
      let analytics: UserAnalytics | null = null;
      if (analyticsStr) {
        const analyticsData = JSON.parse(analyticsStr);
        console.log('Raw localStorage analytics:', analyticsData);
        
        if (analyticsData.success && analyticsData.analytics) {
          analytics = analyticsData.analytics;
        } else if (analyticsData.total_receipts !== undefined) {
          analytics = analyticsData;
        }
      }

      console.log('Extracted localStorage data:', {
        receiptsCount: receipts.length,
        summary,
        analytics,
        firstReceipt: receipts[0]
      });

      setLocalData({
        receipts,
        summary,
        analytics,
        lastUpdated: new Date()
      });

    } catch (error) {
      console.error('Error extracting data from localStorage:', error);
    }
  };

  // Monitor localStorage changes
  useEffect(() => {
    // Initial extraction
    extractDataFromStorage();

    // Listen for storage events (when localStorage changes in other tabs)
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key && event.key.includes('raseed_') && event.key.includes(userId)) {
        console.log('localStorage changed for user:', userId, 'key:', event.key);
        extractDataFromStorage();
      }
    };

    // Listen for custom events when localStorage is updated in the same tab
    const handleCustomStorageUpdate = () => {
      extractDataFromStorage();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('localStorageUpdated', handleCustomStorageUpdate);

    // Set up a polling mechanism to check for updates every 5 seconds
    const interval = setInterval(extractDataFromStorage, 5000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localStorageUpdated', handleCustomStorageUpdate);
      clearInterval(interval);
    };
  }, [userId]);

  return localData;
};

// Utility function to trigger custom storage events
export const notifyLocalStorageUpdate = () => {
  window.dispatchEvent(new Event('localStorageUpdated'));
};

// Debug function to log all localStorage data
export const debugLocalStorage = () => {
  console.log('=== LOCALSTORAGE DEBUG ===');
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.includes('raseed_')) {
      try {
        const value = localStorage.getItem(key);
        const parsed = JSON.parse(value || '{}');
        console.log(`${key}:`, parsed);
      } catch (error) {
        console.log(`${key}:`, localStorage.getItem(key));
      }
    }
  }
  console.log('=== END DEBUG ===');
};
