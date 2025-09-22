// pages/api/generate_qr_batch.js
import QRCode from 'qrcode';
import { promises as fs } from 'fs';
import path from 'path';

// In-memory storage for demo (you'd use a database in production)
let records = {
  total_count: 0,
  year_counts: {},
  sessions: []
};

// Load records from file if it exists
async function loadRecords() {
  try {
    const recordsPath = path.join(process.cwd(), 'data', 'records.json');
    const data = await fs.readFile(recordsPath, 'utf8');
    records = JSON.parse(data);
  } catch (error) {
    // File doesn't exist, use default records
  }
}

// Save records to file
async function saveRecords() {
  try {
    const dataDir = path.join(process.cwd(), 'data');
    await fs.mkdir(dataDir, { recursive: true });
    const recordsPath = path.join(dataDir, 'records.json');
    await fs.writeFile(recordsPath, JSON.stringify(records, null, 2));
  } catch (error) {
    console.error('Error saving records:', error);
  }
}

function getNextSerialNumber(year, quantity) {
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
    await loadRecords();

    const { part_name, vendor_name, year, location, quantity } = req.body;

    // Validate required fields
    if (!part_name || !vendor_name || !year || !location || !quantity) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const startSerial = getNextSerialNumber(year, quantity);
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

    // Update records
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

    records.total_count += quantity;
    const yearStr = String(year);
    if (!records.year_counts[yearStr]) {
      records.year_counts[yearStr] = 0;
    }
    records.year_counts[yearStr] += quantity;
    records.sessions.push(sessionInfo);

    await saveRecords();

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
        total_generated: records.total_count,
        year_count: records.year_counts[yearStr]
      }
    });

  } catch (error) {
    console.error('Error generating QR codes:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}