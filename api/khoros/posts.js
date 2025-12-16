/**
 * Vercel Serverless Function for Khoros API Proxy
 * 
 * This file should be in: api/khoros/posts.js
 * Vercel will automatically create the route: /api/khoros/posts
 */

import axios from 'axios';

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

export default async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  console.log('📥 Request received:', {
    method: req.method,
    query: req.query,
    url: req.url
  });

  const { fromDate, toDate } = req.query;
  
  if (!fromDate || !toDate) {
    console.error('❌ Missing required parameters:', { fromDate, toDate });
    return res.status(400).json({ 
      error: {
        code: '400',
        message: 'Missing required parameters: fromDate and toDate (format: YYYYMMDD)'
      }
    });
  }

  const KHOROS_CONFIG = {
    communityId: process.env.KHOROS_COMMUNITY_ID || 'comdirectbank.prod',
    clientId: process.env.KHOROS_CLIENT_ID,
    accessToken: process.env.KHOROS_ACCESS_TOKEN,
    baseUrl: 'https://eu.api.lithium.com/lsi-data/v1/data/export/community'
  };

  console.log('🔧 Khoros Config:', {
    communityId: KHOROS_CONFIG.communityId,
    hasClientId: !!KHOROS_CONFIG.clientId,
    hasAccessToken: !!KHOROS_CONFIG.accessToken,
    clientIdLength: KHOROS_CONFIG.clientId ? KHOROS_CONFIG.clientId.length : 0,
    accessTokenLength: KHOROS_CONFIG.accessToken ? KHOROS_CONFIG.accessToken.length : 0
  });

  if (!KHOROS_CONFIG.clientId || !KHOROS_CONFIG.accessToken) {
    console.error('❌ Missing Khoros credentials:', {
      hasClientId: !!KHOROS_CONFIG.clientId,
      hasAccessToken: !!KHOROS_CONFIG.accessToken,
      communityId: KHOROS_CONFIG.communityId,
      envKeys: Object.keys(process.env).filter(k => k.includes('KHOROS'))
    });
    return res.status(500).json({ 
      error: {
        code: '500',
        message: 'Khoros API credentials not configured',
        details: 'Please set KHOROS_CLIENT_ID and KHOROS_ACCESS_TOKEN environment variables in Vercel.'
      }
    });
  }

  try {
    const url = `${KHOROS_CONFIG.baseUrl}/${KHOROS_CONFIG.communityId}?fromDate=${fromDate}&toDate=${toDate}`;
    console.log('🌐 Calling Khoros API:', url);
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
      console.error('Khoros API returned non-200 status:', {
        status: response.status,
        statusText: response.statusText,
        data: typeof response.data === 'string' ? response.data.substring(0, 500) : response.data
      });
      return res.status(500).json({
        error: {
          code: '500',
          message: `Khoros API error: ${response.status} ${response.statusText}`,
          details: typeof response.data === 'string' ? response.data.substring(0, 500) : response.data
        }
      });
    }

    // Parse CSV data and convert to JSON
    const csvData = response.data;
    
    if (!csvData || typeof csvData !== 'string') {
      console.error('Invalid CSV data received:', typeof csvData);
      return res.status(500).json({
        error: {
          code: '500',
          message: 'Invalid response from Khoros API',
          details: 'Expected CSV data but received invalid format'
        }
      });
    }
    
    const lines = csvData.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      console.warn('No data lines in CSV response');
      return res.json({ records: [] });
    }
    
    const dataLines = lines.slice(1); // Skip header

    const records = dataLines.map((line) => {
      try {
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
      } catch (parseError) {
        console.warn('Error parsing CSV line:', parseError.message, line.substring(0, 100));
        return null;
      }
    }).filter(record => record !== null);

    console.log(`Successfully parsed ${records.length} records from Khoros API`);
    return res.json({ records });
  } catch (error) {
    console.error('Proxy Server Error:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({ 
      error: {
        code: '500',
        message: 'A server error has occurred',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }
    });
  }
};




