// pages/api/get_current_count.js
import { getCurrentCount, loadRecords } from '../../lib/storage.js';

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

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const records = await loadRecords();
    
    return res.status(200).json({
      total_count: records.total_count,
      year_counts: records.year_counts,
      next_serial: records.total_count + 1
    });

  } catch (error) {
    console.error('Error getting current count:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}