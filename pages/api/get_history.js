// pages/api/get_history.js
import { promises as fs } from 'fs';
import path from 'path';

// Default records
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
    await loadRecords();
    
    // Return last 10 sessions for compatibility
    const recentSessions = records.sessions.slice(-10);
    
    return res.status(200).json({
      total_count: records.total_count,
      sessions: recentSessions
    });

  } catch (error) {
    console.error('Error getting history:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}