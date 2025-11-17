/**
 * Backend Proxy Server for Khoros LSI Data Export API
 * 
 * This server acts as a proxy between your React frontend and the Khoros API
 * to bypass CORS restrictions in the browser.
 * 
 * Usage:
 *   1. Install dependencies: npm install express cors axios
 *   2. Run this server: node proxy-server.cjs
 *   3. Server runs on http://localhost:3001
 *   
 * Note: Uses axios for HTTP requests (CommonJS compatible)
 */

const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();

// Enable CORS for all origins (adjust in production)
app.use(cors());
app.use(express.json());

// Khoros API Configuration
const KHOROS_CONFIG = {
  communityId: 'comdirectbank.prod',
  clientId: '9De3u/U+HGfQlpMxqsnBxukwCvWYr+j+aHI4rSu/wEo=',
  accessToken: '6d100a667bbc8a27e9d6e8b773b9e02d2400d21e',
  baseUrl: 'https://eu.api.lithium.com/lsi-data/v1/data/export/community'
};
const LIQL_ENDPOINT = 'https://community.comdirect.de/api/2.0/search';

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Khoros API Proxy Server is running',
    timestamp: new Date().toISOString()
  });
});

// Proxy endpoint for Khoros LSI Data Export API
app.get('/api/khoros/posts', async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;
    
    if (!fromDate || !toDate) {
      return res.status(400).json({ 
        error: 'Missing required parameters: fromDate and toDate (format: YYYYMMDD)' 
      });
    }
    
    console.log(`📡 Proxying request to Khoros API: ${fromDate} to ${toDate}`);
    
    // Build Khoros API URL
    // Note: The LSI Data Export API for this account only provides activity/analytics data,
    // not message content. Requesting specific fields causes "invalid field" errors.
    const url = `${KHOROS_CONFIG.baseUrl}/${KHOROS_CONFIG.communityId}?fromDate=${fromDate}&toDate=${toDate}`;
    
    console.log(`🔗 Request URL: ${url}`);
    
    // Create Basic Auth header (token:empty)
    const basicAuth = Buffer.from(`${KHOROS_CONFIG.accessToken}:`).toString('base64');
    
    // Make request to Khoros API using axios
    // Note: The API returns CSV data, not JSON!
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
      console.error(`❌ Khoros API Error: ${response.status} ${response.statusText}`);
      console.error(`Error details:`, response.data);
      
      return res.status(response.status).json({
        error: `Khoros API error: ${response.status} ${response.statusText}`,
        details: response.data
      });
    }
    
    // Parse CSV data and convert to JSON
    const csvData = response.data;
    console.log(`✅ Successfully fetched CSV data from Khoros API`);
    console.log(`📊 CSV data length: ${csvData.length} characters`);
    
    // Parse CSV into structured records
    const lines = csvData.split('\n').filter(line => line.trim());
    console.log(`📝 Total CSV lines (including header): ${lines.length}`);
    
    // Log the CSV header for debugging
    if (lines.length > 0) {
      console.log(`📋 CSV Header:\n${lines[0].substring(0, 500)}...`);
    }
    
    // Log a sample data line
    if (lines.length > 1) {
      console.log(`📋 Sample Data Line 1:\n${lines[1].substring(0, 500)}...`);
    }
    
    // Skip the first line (CSV header row)
    const dataLines = lines.slice(1);
    console.log(`📝 Data lines (excluding header): ${dataLines.length}`);
    
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
    
    const records = dataLines.map((line, index) => {
      // Split by comma, handling quoted fields properly
      const fields = parseCSVLine(line);
      
      // Extract key fields based on actual CSV structure from user's sample:
      // Field 0: event ID
      // Field 1: event type (e.g., "rss.feed-request", "view")
      // Field 4: timestamp (epoch milliseconds)
      // Field 5: city
      // Field 7: country code
      // Field 12: latitude (not needed)
      // Field 13: longitude (not needed)
      // Field 20: topic ID
      // Field 21: topic title *** THIS IS WHAT WE NEED ***
      // Field 22: board ID
      // Field 23: board title *** THIS IS WHAT WE NEED ***
      // Field 26: username *** THIS IS WHAT WE NEED ***
      
      return {
        rawLine: line.substring(0, 200), // Truncate for logging
        timestamp: fields[4] || '',          // event.time.ms
        city: fields[5] || '',               // request.geo.city
        country: fields[7] || '',            // request.geo.country_code
        topicId: fields[20] || '',           // conversation.uid
        topicTitle: fields[21] || '',        // conversation.title
        boardId: fields[22] || '',           // board.uid
        boardTitle: fields[23] || '',        // board.title
        username: fields[26] || '',          // user.login
        userId: fields[25] || '',            // user.uid (corrected from 18)
        eventType: fields[1] || '',          // action.key
        messageId: fields[44] || '',         // message.uid
        messageSubject: fields[45] || '',    // message.subject
        messageIsTopic: fields[46] || '',    // message.is_topic
        messageType: fields[47] || '',       // message.type
        allFields: fields.length
      };
    });
    
    console.log(`✅ Parsed ${records.length} records`);
    if (records.length > 0) {
      console.log(`📋 Sample record:`, JSON.stringify(records[0], null, 2));
    }
    
    // Log event type distribution to help understand the data
    const eventTypes = {};
    records.forEach(r => {
      const type = r.eventType || 'unknown';
      eventTypes[type] = (eventTypes[type] || 0) + 1;
    });
    console.log(`📊 Event types in this response:`, eventTypes);
    
    // Return as JSON with records array
    res.json({ records });
    
  } catch (error) {
    console.error('❌ Proxy Server Error:', error);
    res.status(500).json({ 
      error: 'Proxy server error', 
      message: error.message 
    });
  }
});

const sanitizeIds = (ids = []) => {
  const unique = new Set();
  ids.forEach(id => {
    if (id === null || id === undefined) return;
    const trimmed = String(id).trim();
    if (trimmed !== '') {
      unique.add(trimmed.replace(/'/g, "\\'"));
    }
  });
  return Array.from(unique);
};

const chunkArray = (items, size) => {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
};

const fetchMessageBatchFromLiql = async (ids = []) => {
  if (ids.length === 0) return [];
  const quotedIds = ids.map(id => `'${id}'`).join(',');
  const liql = `SELECT id, subject, body, post_time, author.login, view_href FROM messages WHERE id IN (${quotedIds})`;
  const url = `${LIQL_ENDPOINT}?q=${encodeURIComponent(liql)}&restapi.format=json`;

  const response = await axios.get(url, {
    headers: {
      'Accept': 'application/json'
    },
    validateStatus: status => status >= 200 && status < 500
  });

  if (response.status !== 200) {
    throw new Error(`LiQL error: ${response.status} ${response.statusText}`);
  }

  return response.data?.data?.items || [];
};

app.post('/api/khoros/messages/details', async (req, res) => {
  try {
    const messageIds = sanitizeIds(req.body?.messageIds || []);
    
    if (messageIds.length === 0) {
      return res.status(400).json({
        error: 'Missing messageIds array'
      });
    }

    const MAX_BATCH = 20;
    const batches = chunkArray(messageIds, MAX_BATCH);
    const items = [];

    for (const batch of batches) {
      const batchItems = await fetchMessageBatchFromLiql(batch);
      items.push(...batchItems);
    }

    res.json({ items });
  } catch (error) {
    console.error('❌ Message details fetch error:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to fetch message details',
      details: error.response?.data || error.message
    });
  }
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log('');
  console.log('🚀 ============================================');
  console.log(`✅ Khoros API Proxy Server running on port ${PORT}`);
  console.log(`📡 Endpoint: http://localhost:${PORT}/api/khoros/posts`);
  console.log(`🔧 Health Check: http://localhost:${PORT}/health`);
  console.log('============================================');
  console.log('');
  console.log('📝 Example request:');
  console.log(`   http://localhost:${PORT}/api/khoros/posts?fromDate=20251101&toDate=20251113`);
  console.log('');
});

