import { useState, useEffect, useCallback } from 'react';
import type {
  ArbitrageOpportunity,
  Statistics,
  FundingRate,
  OpportunityQueryParams
} from '../types';
import { apiClient } from '../api/client';

/**
 * 使用套利机会数据
 */
export function useOpportunities(autoRefresh: boolean = true, interval: number = 10000) {
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOpportunities = useCallback(async (params?: OpportunityQueryParams) => {
    try {
      setLoading(true);
      setError(null);
      const data = params 
        ? await apiClient.getOpportunities(params)
        : await apiClient.getLatestOpportunities(20);
      setOpportunities(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch opportunities');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOpportunities();

    if (autoRefresh) {
      const timer = setInterval(fetchOpportunities, interval);
      return () => clearInterval(timer);
    }
  }, [autoRefresh, interval, fetchOpportunities]);

  return {
    opportunities,
    loading,
    error,
    refetch: fetchOpportunities
  };
}

/**
 * 使用统计数据
 */
export function useStatistics(hours: number = 24, autoRefresh: boolean = true) {
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatistics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.getStatistics({ hours });
      setStatistics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch statistics');
    } finally {
      setLoading(false);
    }
  }, [hours]);

  useEffect(() => {
    fetchStatistics();

    if (autoRefresh) {
      const timer = setInterval(fetchStatistics, 30000); // 30秒刷新一次
      return () => clearInterval(timer);
    }
  }, [autoRefresh, fetchStatistics]);

  return {
    statistics,
    loading,
    error,
    refetch: fetchStatistics
  };
}

/**
 * 使用资金费率数据
 */
export function useFundingRates(limit: number = 100) {
  const [fundingRates, setFundingRates] = useState<FundingRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFundingRates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.getLatestFundingRates(limit);
      setFundingRates(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch funding rates');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchFundingRates();
  }, [fetchFundingRates]);

  return {
    fundingRates,
    loading,
    error,
    refetch: fetchFundingRates
  };
}

/**
 * 使用自动刷新
 */
export function useAutoRefresh(callback: () => void, interval: number, enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;

    const timer = setInterval(callback, interval);
    return () => clearInterval(timer);
  }, [callback, interval, enabled]);
}

/**
 * 使用本地存储
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  };

  return [storedValue, setValue] as const;
}
