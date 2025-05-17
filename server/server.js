import express from 'express';
import cors from 'cors';
import axios from 'axios';
import qs from 'qs';
import xml2js from 'xml2js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });


const app = express();
const PORT = 8080;

app.use(cors());
app.use(express.json());

const CLIENT_ID = process.env.EBAY_CLIENT_ID;
const CLIENT_SECRET = process.env.EBAY_CLIENT_SECRET;
const REDIRECT_URI = process.env.EBAY_REDIRECT_URI;
const scope = 'https://api.ebay.com/oauth2/api_scope';
console.log('CLIENT_ID:', CLIENT_ID);
console.log('REDIRECT_URI:', REDIRECT_URI);
console.log(`[CLIENT_ID] = [${CLIENT_ID}]`);
console.log(`[REDIRECT_URI] = [${REDIRECT_URI}]`);


const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

app.get('/auth/ebay', (req, res) => {
  const scope = 'https://api.ebay.com/oauth/api_scope';

  const RUNAME = process.env.EBAY_RUNAME;

const authUrl = `https://auth.sandbox.ebay.com/oauth2/authorize?` +
  `client_id=${CLIENT_ID}` +
  `&redirect_uri=${RUNAME}` +  // ✅ This is the fix
  `&response_type=code` +
  `&scope=${encodeURIComponent(scope)}`;


  console.log('Redirecting to:', authUrl);
  res.redirect(authUrl);
});


// Route: OAuth callback
app.get('/auth/ebay/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).json({ error: 'Missing code' });

  try {
    const tokenData = {
  grant_type: 'authorization_code',
  code,
  redirect_uri: REDIRECT_URI
};

    const response = await axios.post(
      'https://api.sandbox.ebay.com/identity/v1/oauth2/token',
      qs.stringify(tokenData),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${credentials}`,
        },
      }
    );

    const { access_token } = response.data;
    res.redirect(`http://localhost:5173/callback?access_token=${access_token}`);
  } catch (err) {
    console.error('Token exchange failed:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to exchange token' });
  }
});

// Route: Get listings (Trading API XML)
app.get('/ebay/listings', async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Missing token' });

  const xml = `<?xml version="1.0" encoding="utf-8"?>
    <GetMyeBaySellingRequest xmlns="urn:ebay:apis:eBLBaseComponents">
      <RequesterCredentials>
        <eBayAuthToken>${token}</eBayAuthToken>
      </RequesterCredentials>
      <ActiveList>
        <Include>true</Include>
        <Pagination>
          <EntriesPerPage>10</EntriesPerPage>
          <PageNumber>1</PageNumber>
        </Pagination>
      </ActiveList>
      <DetailLevel>ReturnAll</DetailLevel>
    </GetMyeBaySellingRequest>`;

  try {
    const response = await axios.post('https://api.sandbox.ebay.com/ws/api.dll', xml, {
      headers: {
        'Content-Type': 'text/xml',
        'X-EBAY-API-CALL-NAME': 'GetMyeBaySelling',
        'X-EBAY-API-SITEID': '0',
        'X-EBAY-API-COMPATIBILITY-LEVEL': '967',
        'X-EBAY-API-DEV-NAME': process.env.EBAY_DEV_ID,
        'X-EBAY-API-APP-NAME': CLIENT_ID,
        'X-EBAY-API-CERT-NAME': process.env.EBAY_CERT_ID,
      },
    });

    xml2js.parseString(response.data, { explicitArray: false }, (err, result) => {
      if (err) return res.status(500).json({ error: 'XML parsing error' });
      res.json(result.GetMyeBaySellingResponse);
    });
  } catch (err) {
    console.error('Error fetching listings:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to fetch listings' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
