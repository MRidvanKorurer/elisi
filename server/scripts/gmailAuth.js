const http = require('http');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const clientId = String(process.env.GMAIL_CLIENT_ID || '').trim();
const clientSecret = String(process.env.GMAIL_CLIENT_SECRET || '').trim();
const redirect = 'http://127.0.0.1:53682';

if (!clientId || !clientSecret) {
  console.error('server/.env içine GMAIL_CLIENT_ID ve GMAIL_CLIENT_SECRET yazın. Site girişindeki GOOGLE_CLIENT_ID kullanılmaz.');
  process.exit(1);
}

const auth = new URL('https://accounts.google.com/o/oauth2/v2/auth');
auth.searchParams.set('client_id', clientId);
auth.searchParams.set('redirect_uri', redirect);
auth.searchParams.set('response_type', 'code');
auth.searchParams.set('scope', 'https://www.googleapis.com/auth/gmail.send');
auth.searchParams.set('access_type', 'offline');
auth.searchParams.set('prompt', 'consent');
auth.searchParams.set('login_hint', 'nikbagofficial@gmail.com');

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `${redirect}/`);
  if (url.pathname !== '/' && url.pathname !== '') {
    res.writeHead(404);
    res.end();
    return;
  }
  const code = url.searchParams.get('code');
  const oauthError = url.searchParams.get('error');
  if (!code) {
    res.end(oauthError || 'Kod gelmedi');
    return;
  }
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirect,
      grant_type: 'authorization_code'
    })
  });
  const data = await tokenRes.json();
  if (!data.refresh_token) {
    res.end('refresh_token gelmedi. Google hesabında uygulamayı kaldırıp tekrar deneyin.');
    console.error(data.error_description || data.error || data);
    server.close();
    return;
  }
  console.log('\nGMAIL_REFRESH_TOKEN=' + data.refresh_token);
  console.log('Bu satırı Render Environment içine yapıştırın.\n');
  res.end('Tamam. Bu sekmeyi kapatıp terminale dönün.');
  server.close();
});

server.listen(53682, '127.0.0.1', () => {
  console.log('Tarayıcıda bu adresi nikbagofficial@gmail.com ile açın:\n');
  console.log(auth.toString());
});
