const crypto = require('crypto');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/encrypt', (req, res) => {
    const { data } = req.body;
    const iv = crypto.randomBytes(16);
    const key = crypto.randomBytes(32);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

    let encrypted = cipher.update(data, 'utf-8', 'hex');
    encrypted += cipher.final('hex');

    const processingTime = Date.now() - req.startTime;

    res.json({
        encrypted,
        iv: iv.toString('hex'),
        processingTime,
    });
});

module.exports = app;
