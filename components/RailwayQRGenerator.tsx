// components/RailwayQRGenerator.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Train, QrCode, Download, Printer, History, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { qrApiService } from '../services/api';
import {
  QRCodeData,
  BatchInfo,
  QRGenerationRequest,
  HistorySession,
  CountResponse
} from '../types';

// Validation schema
const qrFormSchema = z.object({
  partName: z.string().min(1, 'Part name is required'),
  vendorName: z.string().min(1, 'Vendor name is required'),
  year: z.string().length(2, 'Year must be 2 digits').regex(/^\d{2}$/, 'Year must be numeric'),
  location: z.string().min(1, 'Installation location is required'),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1').max(100, 'Maximum 100 QR codes per batch'),
});

type QRFormData = z.infer<typeof qrFormSchema>;

const RailwayQRGenerator: React.FC = () => {
  const [qrCodes, setQrCodes] = useState<QRCodeData[]>([]);
  const [batchInfo, setBatchInfo] = useState<BatchInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [history, setHistory] = useState<HistorySession[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
  } = useForm<QRFormData>({
    resolver: zodResolver(qrFormSchema),
    mode: 'onChange',
  });

  // Load initial data
  useEffect(() => {
    loadCurrentCount();
    loadHistory();
  }, []);

  const loadCurrentCount = async () => {
    try {
      const data = await qrApiService.getCurrentCount();
      setTotalCount(data.total_count);
    } catch (error) {
      console.error('Error loading count:', error);
      toast.error('Failed to load current count');
    }
  };

  const loadHistory = async () => {
    try {
      console.log('Loading history...');
      const data = await qrApiService.getHistory();
      console.log('History data received:', data);
      setHistory(data.sessions || []);
    } catch (error) {
      console.error('Error loading history:', error);
      // Set empty history on error to prevent UI issues
      setHistory([]);
    }
  };

  const onSubmit = async (data: QRFormData) => {
    setIsLoading(true);
    try {
      const response = await qrApiService.generateQRBatch(data);
      
      if (response.success) {
        setQrCodes(response.qr_codes);
        setBatchInfo(response.batch_info);
        toast.success(
          `Successfully generated ${response.qr_codes.length} QR codes for year ${response.batch_info.year}! Serial range: ${response.batch_info.serial_range}`
        );
        
        // Refresh data
        await loadCurrentCount();
        await loadHistory();
      } else {
        throw new Error(response.error || 'Unknown error occurred');
      }
    } catch (error: any) {
      console.error('Error generating QR codes:', error);
      toast.error(`Error: ${error.message || 'Failed to generate QR codes'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadQRCode = (qrCode: QRCodeData) => {
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${qrCode.image_base64}`;
    link.download = qrCode.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Downloaded ${qrCode.filename}`);
  };

  const printQRCode = (qrCode: QRCodeData, batchInfo: BatchInfo) => {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      toast.error('Unable to open print window');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Print QR Code - ${batchInfo.part_name}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 40px; 
            text-align: center;
            background: white;
          }
          .print-container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            border: 2px solid #333;
            border-radius: 10px;
          }
          .part-title { 
            font-size: 24px; 
            font-weight: bold; 
            margin-bottom: 20px; 
            color: #333;
          }
          .qr-details { 
            font-family: monospace; 
            font-size: 14px; 
            background: #f5f5f5; 
            padding: 15px; 
            border-radius: 5px; 
            margin-bottom: 20px;
            word-break: break-all;
            border: 1px solid #ddd;
          }
          .qr-image { 
            margin: 20px 0;
            border: 2px solid #333;
            border-radius: 8px;
          }
          @media print {
            body { padding: 20px; }
          }
        </style>
      </head>
      <body>
        <div class="print-container">
          <div class="part-title">${batchInfo.part_name}</div>
          <div class="qr-details">${qrCode.qr_text}</div>
          <img class="qr-image" src="data:image/png;base64,${qrCode.image_base64}" 
               alt="QR Code" width="300" height="300" />
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          };
        </script>
      </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
  };

  const downloadAllQRCodes = () => {
    if (qrCodes.length === 0) {
      toast.warning('No QR codes to download');
      return;
    }

    qrCodes.forEach((qrCode, index) => {
      setTimeout(() => {
        downloadQRCode(qrCode);
      }, index * 200);
    });
  };

  const printAllQRCodes = () => {
    if (qrCodes.length === 0) {
      toast.warning('No QR codes to print');
      return;
    }

    const printWindow = window.open('', '_blank', 'width=1000,height=800');
    if (!printWindow) {
      toast.error('Unable to open print window');
      return;
    }

    let printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Railway Parts QR Codes</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background: white;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
          }
          .print-grid { 
            display: grid; 
            grid-template-columns: repeat(2, 1fr); 
            gap: 30px; 
            margin-bottom: 20px;
          }
          .print-qr-card { 
            border: 2px solid #333; 
            border-radius: 8px; 
            padding: 20px; 
            text-align: center; 
            break-inside: avoid; 
            background: white;
          }
          .print-qr-card h3 { 
            margin: 0 0 15px 0; 
            font-size: 18px; 
            color: #333; 
            font-weight: bold;
          }
          .print-qr-details { 
            font-family: monospace; 
            font-size: 12px; 
            background: #f5f5f5; 
            padding: 10px; 
            border-radius: 4px; 
            margin-bottom: 15px; 
            word-break: break-all;
            border: 1px solid #ddd;
          }
          .print-qr-image { 
            width: 200px; 
            height: 200px; 
            border: 2px solid #333;
            border-radius: 5px;
          }
          @media print { 
            body { margin: 0; padding: 15px; } 
            .print-qr-card { margin-bottom: 25px; }
            .header { margin-bottom: 20px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Railway Parts QR Codes</h1>
          <p>Generated on ${format(new Date(), 'PPP')} at ${format(new Date(), 'pp')}</p>
        </div>
        <div class="print-grid">
    `;

    qrCodes.forEach((qrCode) => {
      printContent += `
        <div class="print-qr-card">
          <h3>${batchInfo?.part_name} - ${qrCode.serial_number}</h3>
          <div class="print-qr-details">${qrCode.qr_text}</div>
          <img class="print-qr-image" src="data:image/png;base64,${qrCode.image_base64}" alt="QR Code" />
        </div>
      `;
    });

    printContent += `
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    
    toast.success(`Print window opened for ${qrCodes.length} QR codes`);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-4">
        {/* Header */}
        <header className="bg-gradient-to-br from-primary to-primary-dark text-white p-8 mb-8 rounded-lg shadow-xl">
          <div className="flex items-center gap-6 mb-4">
            <Train className="w-12 h-12 opacity-90" />
            <div>
              <h1 className="text-4xl font-bold mb-2">Railway Parts QR Generator</h1>
              <p className="text-xl opacity-90">Professional equipment management system</p>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="space-y-8">
          {/* QR Generation Form */}
          <section className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3 mb-2">
                <QrCode className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-semibold">Generate QR Codes</h2>
              </div>
              <p className="text-gray-600">Create QR codes for railway parts with consistent formatting</p>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Part Name
                  </label>
                  <input
                    {...register('partName')}
                    type="text"
                    placeholder="e.g., Rail Pad"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                  />
                  {errors.partName && (
                    <p className="mt-1 text-sm text-red-600">{errors.partName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vendor Name
                  </label>
                  <input
                    {...register('vendorName')}
                    type="text"
                    placeholder="e.g., ADX"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                  />
                  {errors.vendorName && (
                    <p className="mt-1 text-sm text-red-600">{errors.vendorName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Year of Manufacture (2-digit)
                  </label>
                  <input
                    {...register('year')}
                    type="text"
                    placeholder="e.g., 25"
                    maxLength={2}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                  />
                  {errors.year && (
                    <p className="mt-1 text-sm text-red-600">{errors.year.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Installation Location
                  </label>
                  <input
                    {...register('location')}
                    type="text"
                    placeholder="e.g., JAL"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                  />
                  {errors.location && (
                    <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity
                  </label>
                  <input
                    {...register('quantity')}
                    type="number"
                    min="1"
                    max="100"
                    placeholder="1"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                  />
                  {errors.quantity && (
                    <p className="mt-1 text-sm text-red-600">{errors.quantity.message}</p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={!isValid || isLoading}
                className="w-full bg-primary hover:bg-primary-dark disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <QrCode className="w-5 h-5" />
                    Generate QR Codes
                  </>
                )}
              </button>
            </form>
          </section>

          {/* Results Section */}
          {qrCodes.length > 0 && (
            <section className="bg-white rounded-lg shadow-md overflow-hidden animate-slide-up">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold">Generated QR Codes</h2>
                  <div className="flex gap-3">
                    <button
                      onClick={printAllQRCodes}
                      className="bg-warning hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                      <Printer className="w-4 h-4" />
                      Print All
                    </button>
                    <button
                      onClick={downloadAllQRCodes}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Download All
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {qrCodes.map((qrCode, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 rounded-lg p-6 border border-gray-200 hover:shadow-lg transition-shadow animate-fade-in"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <h3 className="text-lg font-semibold text-center mb-3">
                        {batchInfo?.part_name} - {qrCode.serial_number}
                      </h3>
                      <div className="bg-white p-3 rounded border mb-4 font-mono text-sm text-gray-600 break-all">
                        {qrCode.qr_text}
                      </div>
                      <div className="flex justify-center mb-4">
                        <img
                          src={`data:image/png;base64,${qrCode.image_base64}`}
                          alt="QR Code"
                          className="w-48 h-48 border-2 border-gray-300 rounded"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => downloadQRCode(qrCode)}
                          className="flex-1 bg-success hover:bg-green-600 text-white py-2 px-4 rounded flex items-center justify-center gap-2 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </button>
                        <button
                          onClick={() => printQRCode(qrCode, batchInfo!)}
                          className="flex-1 bg-warning hover:bg-orange-600 text-white py-2 px-4 rounded flex items-center justify-center gap-2 transition-colors"
                        >
                          <Printer className="w-4 h-4" />
                          Print
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* History Section */}
          <section className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <History className="w-6 h-6 text-primary" />
                  <h2 className="text-2xl font-semibold">Recent Generation History</h2>
                </div>
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="text-primary hover:text-primary-dark font-medium"
                >
                  {showHistory ? 'Hide' : 'Show'} History
                </button>
              </div>
              <p className="text-gray-600">View the last 10 QR code generation sessions</p>
            </div>
            
            {showHistory && (
              <div className="p-6">
                {history.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 italic">
                    No generation history found.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {history.slice().reverse().map((session, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border-l-4 border-primary"
                      >
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">
                            {session.part_name} - {session.vendor_name}
                          </div>
                          <div className="text-sm text-gray-600">
                            Location: {session.location} | Year: {session.year} | Quantity: {session.quantity}
                          </div>
                        </div>
                        <div className="text-right text-sm text-gray-500">
                          <div className="font-semibold text-primary">
                            Serial: {session.serial_range}
                          </div>
                          <div>
                            {format(new Date(session.timestamp), 'PPp')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>
        </div>

        {/* Footer */}
        <footer className="text-center py-8 text-gray-600">
          <p>&copy; 2025 Railway Parts Management System. Professional equipment tracking solution.</p>
        </footer>
      </div>
    </div>
  );
};

export default RailwayQRGenerator;