// pages/api/generate_qr_batch.js
import QRCode from 'qrcode';
import { addSession } from '../../lib/storage.js';

function getNextSerialNumber(records, year, quantity) {
  const yearStr = String(year);
  if (!records.year_counts[yearStr]) {
    records.year_counts[yearStr] = 0;
  }
  return records.year_counts[yearStr] + 1;
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { part_name, vendor_name, year, location, quantity } = req.body;

    // Validate required fields
    if (!part_name || !vendor_name || !year || !location || !quantity) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Load current records to get the next serial number
    const { loadRecords } = await import('../../lib/storage.js');
    const records = await loadRecords();
    
    const startSerial = getNextSerialNumber(records, year, quantity);
    const qrCodes = [];

    for (let i = 0; i < quantity; i++) {
      const currentSerial = startSerial + i;
      const serialNumber = String(currentSerial).padStart(4, '0');
      
      // Create QR code text
      const qrText = `${part_name} - ${vendor_name}-${year}-${serialNumber}-${location}`;
      
      // Generate QR code
      const qrDataURL = await QRCode.toDataURL(qrText, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      qrCodes.push({
        qr_text: qrText,
        image_base64: qrDataURL.split(',')[1], // Remove data:image/png;base64, prefix
        serial_number: serialNumber,
        filename: `${part_name}_${vendor_name}_${year}_${serialNumber}_${location}.png`.replace(/ /g, '_')
      });
    }

    // Update records using persistent storage
    const serialRange = `${String(startSerial).padStart(4, '0')}-${String(startSerial + quantity - 1).padStart(4, '0')}`;
    
    const sessionInfo = {
      timestamp: new Date().toISOString(),
      part_name,
      vendor_name,
      year: String(year),
      location,
      quantity,
      serial_range: serialRange
    };

    const updatedRecords = await addSession(sessionInfo);

    return res.status(200).json({
      success: true,
      qr_codes: qrCodes,
      batch_info: {
        part_name,
        vendor_name,
        year,
        location,
        quantity,
        serial_range: serialRange,
        total_generated: updatedRecords.total_count,
        year_count: updatedRecords.year_counts[String(year)] || 0
      }
    });

  } catch (error) {
    console.error('Error generating QR codes:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}