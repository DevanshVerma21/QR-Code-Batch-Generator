// types/index.ts
export interface QRCodeData {
  qr_text: string;
  image_base64: string;
  serial_number: string;
  filename: string;
}

export interface BatchInfo {
  part_name: string;
  vendor_name: string;
  year: string;
  location: string;
  quantity: number;
  serial_range?: string;
  total_generated?: number;
  year_count?: number;
}

export interface QRGenerationRequest {
  partName: string;
  vendorName: string;
  year: string;
  location: string;
  quantity: number;
}

export interface QRGenerationResponse {
  success: boolean;
  qr_codes: QRCodeData[];
  batch_info: BatchInfo;
  error?: string;
}

export interface CountResponse {
  total_count: number;
  year_counts: Record<string, number>;
  next_serial: number;
}

export interface YearCountResponse {
  year: string;
  count: number;
  next_serial: number;
}

export interface HistorySession {
  timestamp: string;
  part_name: string;
  vendor_name: string;
  year: string;
  location: string;
  quantity: number;
  serial_range: string;
}

export interface HistoryResponse {
  total_count: number;
  sessions: HistorySession[];
}

export interface NotificationProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}