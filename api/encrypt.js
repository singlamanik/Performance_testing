const crypto = require('crypto');

// Encryption configuration
const ALGORITHM = 'aes-256-cbc';
const SECRET_KEY = process.env.SECRET_KEY || crypto.randomBytes(32).toString('hex').slice(0, 32);
const IV_LENGTH = 16;

// Encrypt function
function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(SECRET_KEY, 'utf8'), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return {
    iv: iv.toString('hex'),
    encrypted: encrypted
  };
}

export default function handler(req, res) {
  // Enable CORS for performance testing tools
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { data } = req.body;
    
    if (!data) {
      return res.status(400).json({ error: 'Data field is required' });
    }

    const startTime = Date.now();
    const result = encrypt(data);
    const processingTime = Date.now() - startTime;

    res.status(200).json({
      success: true,
      encrypted: result.encrypted,
      iv: result.iv,
      processingTime: `${processingTime}ms`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}