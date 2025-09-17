const http = require('http');

async function createTestUser() {
  const email = `testuser_${Date.now()}@example.com`;
  const password = 'password123456';
  const postData = JSON.stringify({ email, password });

  const options = {
    hostname: 'localhost',
    port: 9999,
    path: '/signup',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
      'Content-Length': Buffer.byteLength(postData),
    },
  };

  console.log(`Tentando criar usuário com email: ${email}`);

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        if (res.statusCode >= 200 && res.statusCode < 300) {
          if (response.id) {
            console.log('Usuário criado com sucesso!');
            console.log('USER_ID:', response.id);
          } else {
            console.log('Resposta inesperada do servidor:', response);
          }
        } else {
          console.error(`Erro do servidor (código: ${res.statusCode}):`, response.msg || data);
        }
      } catch (e) {
        console.error('Falha ao parsear resposta JSON:', e);
        console.error('Resposta recebida:', data);
      }
    });
  });

  req.on('error', (e) => {
    console.error(`Problema com a requisição: ${e.message}`);
  });

  req.write(postData);
  req.end();
}

createTestUser();