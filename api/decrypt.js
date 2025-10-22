const crypto = require('crypto');

// Encryption configuration
const ALGORITHM = 'aes-256-cbc';
const SECRET_KEY = process.env.SECRET_KEY || crypto.randomBytes(32).toString('hex').slice(0, 32);

// Decrypt function
function decrypt(encryptedData, ivHex) {
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(SECRET_KEY, 'utf8'), iv);
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
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
    const { encrypted, iv } = req.body;
    
    if (!encrypted || !iv) {
      return res.status(400).json({ error: 'Both encrypted data and iv are required' });
    }

    const startTime = Date.now();
    const decrypted = decrypt(encrypted, iv);
    const processingTime = Date.now() - startTime;

    res.status(200).json({
      success: true,
      decrypted: decrypted,
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