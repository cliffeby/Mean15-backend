const http = require('http');
const ports = [3000, 8080, 5000, 5001];
(async () => {
  for (const p of ports) {
    try {
      const status = await new Promise((resolve, reject) => {
        const req = http.get({ hostname: 'localhost', port: p, path: '/api/email/status', timeout: 3000 }, (res) => {
          resolve(res.statusCode);
          res.resume();
        });
        req.on('error', (e) => reject(e));
        req.on('timeout', () => {
          req.destroy();
          reject(new Error('timeout'));
        });
      });
      console.log(`port:${p} status:${status}`);
    } catch (e) {
      const msg = (e && (e.message || e.code)) ? (e.message || e.code) : String(e);
      console.log(`port:${p} error:${msg}`);
    }
  }
})();
