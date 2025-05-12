const allowedOrigins = [
  'https://victor-gabriel-barbosa.github.io',
  'http://127.0.0.1:5500',
  'http://localhost:5500'
];

// Função para verificar se a origem é permitida
function isOriginAllowed(origin) {
  return allowedOrigins.includes(origin);
}

// Evento para testar CORS
document.addEventListener('DOMContentLoaded', () => {
  const origin = window.location.origin;
  console.log(`Origem atual: ${origin}`);
  console.log(`Esta origem é permitida para CORS: ${isOriginAllowed(origin)}`);
});

// Função para verificar problemas de CORS com o Firebase Storage
async function testStorageConnection() {
  try {
    // Tenta listar os arquivos no Storage (operação leve)
    const listRef = storage.ref('thumbnails');
    const result = await listRef.listAll();
    console.log('Conexão com Firebase Storage OK. Items encontrados:', result.items.length);
    return true;
  } catch (error) {
    console.error('Erro ao conectar ao Firebase Storage:', error);
    if (error.code === 'storage/unauthorized' || error.message.includes('CORS')) {
      console.error('Possível problema de CORS. Verifique a configuração do Firebase Storage.');
    }
    return false;
  }
}

// Testa a conexão ao carregar a página
setTimeout(() => {
  testStorageConnection();
}, 2000);
