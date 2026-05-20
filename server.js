import { createServer } from 'node:http';

const PORT = Number(process.env.PORT || 3001);

const json = (res, statusCode, payload) => {
  res.writeHead(statusCode, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json; charset=utf-8',
  });
  res.end(JSON.stringify(payload));
};

const server = createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }

  if (req.method === 'GET' && req.url === '/') {
    json(res, 200, {
      message: 'AstraCorp server online',
      auth: 'Supabase handles auth and persistence in this project.',
    });
    return;
  }

  json(res, 404, {
    error: 'Not found',
  });
});

server.listen(PORT, () => {
  console.log(`AstraCorp server listening on port ${PORT}`);
});
