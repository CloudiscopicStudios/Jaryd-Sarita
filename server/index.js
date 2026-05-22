require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

const REFRESH_FILE = path.join(__dirname, 'refresh.json');

function saveRefreshToken(token) {
  try {
    fs.writeFileSync(REFRESH_FILE, JSON.stringify({ refresh_token: token }));
  } catch (e) {
    console.error('Failed to save refresh token', e);
  }
}

function getRefreshToken() {
  try {
    if (!fs.existsSync(REFRESH_FILE)) return null;
    const raw = fs.readFileSync(REFRESH_FILE, 'utf8');
    return JSON.parse(raw).refresh_token;
  } catch (e) {
    console.error('Failed to read refresh token', e);
    return null;
  }
}

function clearRefreshToken() {
  try { if (fs.existsSync(REFRESH_FILE)) fs.unlinkSync(REFRESH_FILE); } catch (e) { /* ignore */ }
}

app.post('/auth/exchange', async (req, res) => {
  const { code, redirect_uri } = req.body;
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(500).json({ error: 'Server not configured' });
  }

  try {
    const params = new URLSearchParams();
    params.append('code', code);
    params.append('client_id', process.env.GOOGLE_CLIENT_ID);
    params.append('client_secret', process.env.GOOGLE_CLIENT_SECRET);
    params.append('redirect_uri', redirect_uri || process.env.FRONTEND_ORIGIN || 'http://localhost:5173');
    params.append('grant_type', 'authorization_code');

    const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', body: params });
    const data = await r.json();
    if (!r.ok) return res.status(400).json(data);

    if (data.refresh_token) saveRefreshToken(data.refresh_token);

    res.json({ access_token: data.access_token, expires_in: data.expires_in, id_token: data.id_token });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

app.get('/auth/token', async (req, res) => {
  const refresh_token = getRefreshToken();
  if (!refresh_token) return res.status(401).json({ error: 'No refresh token stored' });

  try {
    const params = new URLSearchParams();
    params.append('refresh_token', refresh_token);
    params.append('client_id', process.env.GOOGLE_CLIENT_ID || '');
    params.append('client_secret', process.env.GOOGLE_CLIENT_SECRET || '');
    params.append('grant_type', 'refresh_token');

    const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', body: params });
    const data = await r.json();
    if (!r.ok) return res.status(400).json(data);

    res.json({ access_token: data.access_token, expires_in: data.expires_in, id_token: data.id_token });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

app.post('/auth/logout', (req, res) => {
  clearRefreshToken();
  res.json({ ok: true });
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Token server listening on ${port}`));
