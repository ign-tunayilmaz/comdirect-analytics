/**
 * Vercel Serverless Function for Khoros Engagement Metrics
 * 
 * This file should be in: api/khoros/engagement.js
 * Vercel will automatically create the route: /api/khoros/engagement
 * 
 * Fetches engagement metrics (likes/kudos, replies, views) for messages
 * using the Khoros Community API (LIQL)
 */

import axios from 'axios';

const LIQL_ENDPOINT = 'https://community.comdirect.de/api/2.0/search';

// Helper to sanitize and validate message IDs
const sanitizeIds = (ids) => {
  if (!Array.isArray(ids)) return [];
  return ids
    .map(id => String(id).trim())
    .filter(id => id && id !== '' && id !== 'null' && id !== 'undefined')
    .slice(0, 100); // Limit to 100 IDs per request
};

// Helper to chunk array into smaller batches
const chunkArray = (arr, size) => {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
};

// Fetch engagement data for a batch of message IDs using LIQL
const fetchEngagementBatch = async (ids = []) => {
  if (ids.length === 0) return [];
  
  const quotedIds = ids.map(id => `'${id}'`).join(',');
  // LIQL query to get engagement metrics: kudos (likes), replies count, and view count
  const liql = `SELECT id, kudos.sum(weight) as kudos_weight, replies.count(*) as replies_count, view_count FROM messages WHERE id IN (${quotedIds})`;
  const url = `${LIQL_ENDPOINT}?q=${encodeURIComponent(liql)}&restapi.format=json`;

  try {
    const response = await axios.get(url, {
      headers: {
        'Accept': 'application/json'
      },
      validateStatus: status => status >= 200 && status < 500,
      timeout: 10000 // 10 second timeout
    });

    if (response.status !== 200) {
      console.error(`❌ LIQL API error: ${response.status} ${response.statusText}`);
      console.error('Response data:', response.data);
      throw new Error(`LIQL API error: ${response.status} ${response.statusText}`);
    }

    const items = response.data?.data?.items || [];
    console.log(`✅ Fetched engagement for ${items.length} of ${ids.length} messages`);
    
    return items;
  } catch (error) {
    console.error('❌ Error fetching engagement batch:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    // Return empty array on error - don't fail the entire request
    return [];
  }
};

export default async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      error: {
        code: '405',
        message: 'Method not allowed. Use POST.'
      }
    });
  }

  console.log('📥 Engagement request received:', {
    method: req.method,
    bodyKeys: req.body ? Object.keys(req.body) : 'no body'
  });

  try {
    const messageIds = sanitizeIds(req.body?.messageIds || []);
    
    if (messageIds.length === 0) {
      console.warn('⚠️ No valid message IDs provided');
      return res.status(400).json({
        error: {
          code: '400',
          message: 'Missing or invalid messageIds array'
        }
      });
    }

    console.log(`📊 Fetching engagement for ${messageIds.length} messages`);

    // Batch requests to avoid overwhelming the API (max 20 per batch)
    const MAX_BATCH = 20;
    const batches = chunkArray(messageIds, MAX_BATCH);
    const allItems = [];

    // Process batches sequentially to respect rate limits
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`🔄 Processing batch ${i + 1}/${batches.length} (${batch.length} messages)`);
      
      const batchItems = await fetchEngagementBatch(batch);
      allItems.push(...batchItems);
      
      // Small delay between batches to avoid rate limiting
      if (i < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Create a map of message ID to engagement data for easy lookup
    // Normalize IDs to strings for consistent matching
    const engagementMap = {};
    allItems.forEach(item => {
      if (item.id) {
        // Normalize ID to string for consistent matching
        const normalizedId = String(item.id).trim();
        engagementMap[normalizedId] = {
          likes: item.kudos_weight || 0,
          replies: item.replies_count || 0,
          views: item.view_count || 0
        };
      }
    });
    
    console.log(`📊 Engagement map created with ${Object.keys(engagementMap).length} entries`);
    console.log(`📊 Sample engagement data:`, Object.entries(engagementMap).slice(0, 3));

    console.log(`✅ Successfully fetched engagement for ${allItems.length} messages`);
    
    return res.json({
      engagement: engagementMap,
      totalFetched: allItems.length,
      totalRequested: messageIds.length
    });

  } catch (error) {
    console.error('❌ Engagement fetch error:', error);
    console.error('❌ Error name:', error.name);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error stack:', error.stack);
    
    return res.status(500).json({
      error: {
        code: '500',
        message: error.message || 'Failed to fetch engagement metrics',
        details: error.message
      }
    });
  }
};

