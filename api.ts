import {
  ScanResult,
  HistoryListResponse,
  DashboardStats,
  ModelPerformance,
  ModelInfo,
} from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export const api = {
  async checkHealth(): Promise<{ status: string; model_loaded: boolean }> {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error('Backend service unreachable');
    return res.json();
  },

  async scanUrl(url: string): Promise<ScanResult> {
    const res = await fetch(`${API_BASE}/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Analysis failed' }));
      throw new Error(err.detail || 'Scan request failed');
    }
    return res.json();
  },

  async getDashboardAnalytics(): Promise<DashboardStats> {
    const res = await fetch(`${API_BASE}/analytics`);
    if (!res.ok) throw new Error('Failed to load dashboard metrics');
    return res.json();
  },

  async getHistory(params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    classification?: string;
    sortBy?: string;
    order?: string;
  }): Promise<HistoryListResponse> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.pageSize) query.set('page_size', params.pageSize.toString());
    if (params?.search) query.set('search', params.search);
    if (params?.classification) query.set('classification', params.classification);
    if (params?.sortBy) query.set('sort_by', params.sortBy);
    if (params?.order) query.set('order', params.order);

    const res = await fetch(`${API_BASE}/history?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to load scan history');
    return res.json();
  },

  async getScanDetails(id: number): Promise<ScanResult> {
    const res = await fetch(`${API_BASE}/history/${id}`);
    if (!res.ok) throw new Error(`Scan #${id} not found`);
    return res.json();
  },

  async clearHistory(): Promise<{ status: string; deleted_count: number }> {
    const res = await fetch(`${API_BASE}/history`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirm: true }),
    });
    if (!res.ok) throw new Error('Failed to clear history');
    return res.json();
  },

  async getModelPerformance(): Promise<ModelPerformance> {
    const res = await fetch(`${API_BASE}/model/performance`);
    if (!res.ok) throw new Error('Failed to load model performance');
    return res.json();
  },

  async getModelInfo(): Promise<ModelInfo> {
    const res = await fetch(`${API_BASE}/model/info`);
    if (!res.ok) throw new Error('Failed to load model details');
    return res.json();
  },
};
