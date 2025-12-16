/**
 * Vercel Serverless Function for Khoros API Proxy
 * 
 * This file should be in: api/khoros/posts.js
 * Vercel will automatically create the route: /api/khoros/posts
 */

const axios = require('axios');

// Helper function to parse CSV line with quoted field support
const parseCSVLine = (line) => {
  const fields = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      fields.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current); // Add the last field
  
  return fields;
};

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { fromDate, toDate } = req.query;
  
  if (!fromDate || !toDate) {
    return res.status(400).json({ 
      error: 'Missing required parameters: fromDate and toDate (format: YYYYMMDD)' 
    });
  }

  const KHOROS_CONFIG = {
    communityId: process.env.KHOROS_COMMUNITY_ID || 'comdirectbank.prod',
    clientId: process.env.KHOROS_CLIENT_ID,
    accessToken: process.env.KHOROS_ACCESS_TOKEN,
    baseUrl: 'https://eu.api.lithium.com/lsi-data/v1/data/export/community'
  };

  if (!KHOROS_CONFIG.clientId || !KHOROS_CONFIG.accessToken) {
    return res.status(500).json({ 
      error: 'Khoros API credentials not configured. Please set KHOROS_CLIENT_ID and KHOROS_ACCESS_TOKEN environment variables.' 
    });
  }

  try {
    const url = `${KHOROS_CONFIG.baseUrl}/${KHOROS_CONFIG.communityId}?fromDate=${fromDate}&toDate=${toDate}`;
    const basicAuth = Buffer.from(`${KHOROS_CONFIG.accessToken}:`).toString('base64');

    const response = await axios({
      method: 'GET',
      url: url,
      headers: {
        'client-id': KHOROS_CONFIG.clientId,
        'Authorization': `Basic ${basicAuth}`,
        'Accept': 'text/csv',
      },
      validateStatus: function (status) {
        return true; // Don't throw on any status code
      }
    });

    if (response.status !== 200) {
      return res.status(response.status).json({
        error: `Khoros API error: ${response.status} ${response.statusText}`,
        details: response.data
      });
    }

    // Parse CSV data and convert to JSON
    const csvData = response.data;
    const lines = csvData.split('\n').filter(line => line.trim());
    const dataLines = lines.slice(1); // Skip header

    const records = dataLines.map((line) => {
      const fields = parseCSVLine(line);
      
      return {
        rawLine: line.substring(0, 200),
        timestamp: fields[4] || '',
        city: fields[5] || '',
        country: fields[7] || '',
        topicId: fields[20] || '',
        topicTitle: fields[21] || '',
        boardId: fields[22] || '',
        boardTitle: fields[23] || '',
        username: fields[26] || '',
        userId: fields[25] || '',
        eventType: fields[1] || '',
        messageId: fields[44] || '',
        messageSubject: fields[45] || '',
        messageIsTopic: fields[46] || '',
        messageType: fields[47] || '',
        allFields: fields.length
      };
    });

    return res.json({ records });
  } catch (error) {
    console.error('Proxy Server Error:', error);
    return res.status(500).json({ 
      error: 'Proxy server error', 
      message: error.message 
    });
  }
};




