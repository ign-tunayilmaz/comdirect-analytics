/**
 * Health check endpoint for Vercel
 */
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json({ 
    status: 'ok', 
    message: 'Khoros API Proxy Server is running',
    timestamp: new Date().toISOString()
  });
};





