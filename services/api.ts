// services/api.ts
import axios from 'axios';
import {
  QRGenerationRequest,
  QRGenerationResponse,
  CountResponse,
  YearCountResponse,
  HistoryResponse
} from '../types';

// Configure base URL - adjust this based on your deployment
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 
  (typeof window !== 'undefined' ? window.location.origin + '/api' : '/api');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const qrApiService = {
  // Generate QR codes batch
  generateQRBatch: async (data: QRGenerationRequest): Promise<QRGenerationResponse> => {
    try {
      const response = await api.post<QRGenerationResponse>('/generate_qr_batch', data);
      return response.data;
    } catch (error) {
      console.error('Error generating QR batch:', error);
      throw error;
    }
  },

  // Get current count
  getCurrentCount: async (): Promise<CountResponse> => {
    try {
      const response = await api.get<CountResponse>('/get_current_count');
      return response.data;
    } catch (error) {
      console.error('Error getting current count:', error);
      throw error;
    }
  },

  // Get year-specific count
  getYearCount: async (year: string): Promise<YearCountResponse> => {
    try {
      const response = await api.get<YearCountResponse>(`/get_year_count/${year}`);
      return response.data;
    } catch (error) {
      console.error('Error getting year count:', error);
      throw error;
    }
  },

  // Get generation history
  getHistory: async (): Promise<HistoryResponse> => {
    try {
      console.log('Fetching history from:', `${API_BASE_URL}/get_history`);
      const response = await api.get<HistoryResponse>('/get_history');
      console.log('History response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error getting history:', error);
      if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
        console.error('Backend server is not running or not accessible');
        // Return empty history when backend is not available
        return {
          total_count: 0,
          sessions: []
        };
      }
      throw error;
    }
  },
};

export default qrApiService;