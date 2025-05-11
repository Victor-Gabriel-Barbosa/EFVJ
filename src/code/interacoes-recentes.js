// interacoes-recentes.js - Exibe interações entre usuários e jogos na plataforma

// Elemento da interface
const interacoesContainer = document.getElementById('interacoes-recentes');

// Função para formatar data
function formatDate(date) {
  if (!date) return 'Data desconhecida';
  
  const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
  return date.toLocaleDateString('pt-BR', options);
}

// Função para carregar interações recentes entre usuários e jogos
function loadRecentInteractions() {
  if (!interacoesContainer) return;
  
  interacoesContainer.innerHTML = '<p class="loading-message">Carregando interações recentes...</p>';
    // Busca atividades recentes
  // IMPORTANTE: Esta consulta requer um índice composto no Firestore.
  // Acesse o link fornecido no erro para criar o índice necessário:
  // https://console.firebase.google.com/v1/r/project/eufacovcjoga/firestore/indexes?create_composite=Ck9wcm9qZWN0cy9ldWZhY292Y2pvZ2EvZGF0YWJhc2VzLyhkZWZhdWx0KS9jb2xsZWN0aW9uR3JvdXBzL2F0aXZpZGFkZXMvaW5kZXhlcy9fEAEaCAoEdGlwbxABGggKBGRhdGEQAhoMCghfX25hbWVfXxAC
  atividadesCollection
    .where('tipo', 'in', ['avaliacao', 'cadastro_jogo', 'comentario'])
    .orderBy('data', 'desc')
    .limit(10)
    .get()
    .then((querySnapshot) => {
      if (querySnapshot.empty) {
        interacoesContainer.innerHTML = '<p class="no-interactions-message">Nenhuma interação recente encontrada.</p>';
        return;
      }
      
      // Limpa o container
      interacoesContainer.innerHTML = '';
      
      // Adiciona cada interação à lista
      querySnapshot.forEach((doc) => {
        const interacao = doc.data();
        
        // Busca informações do usuário
        usuariosCollection.doc(interacao.usuarioId).get()
          .then((userDoc) => {
            if (!userDoc.exists) return;
            
            const usuario = userDoc.data();
            const dataFormatada = formatDate(interacao.data?.toDate());
            
            // Determina o ícone baseado no tipo de atividade
            let icon = '';
            let tipoLabel = '';
            
            switch (interacao.tipo) {
              case 'avaliacao':
                icon = '<i class="fas fa-star"></i>';
                tipoLabel = 'avaliou um jogo';
                break;
              case 'cadastro_jogo':
                icon = '<i class="fas fa-gamepad"></i>';
                tipoLabel = 'publicou um novo jogo';
                break;
              case 'comentario':
                icon = '<i class="fas fa-comment"></i>';
                tipoLabel = 'comentou em um jogo';
                break;
              default:
                icon = '<i class="fas fa-info-circle"></i>';
                tipoLabel = 'interagiu na plataforma';
            }
            
            // Cria o item de interação
            const interacaoElement = document.createElement('div');
            interacaoElement.className = 'interacao-item';
            interacaoElement.innerHTML = `
              <div class="interacao-user">
                <img src="${usuario.fotoPerfil || 'https://via.placeholder.com/32?text=U'}" alt="${usuario.nome}" class="interacao-avatar">
              </div>
              <div class="interacao-content">
                <p>
                  <span class="interacao-name">${usuario.nome}</span> 
                  <span class="interacao-type">${tipoLabel}</span>
                </p>
                <p class="interacao-desc">${interacao.descricao}</p>
                <span class="interacao-date">${dataFormatada}</span>
              </div>
              <div class="interacao-icon">${icon}</div>
            `;
            
            interacoesContainer.appendChild(interacaoElement);
          })
          .catch((error) => {
            console.error("Erro ao carregar informações do usuário:", error);
          });
      });
    })
    .catch((error) => {
      console.error("Erro ao carregar interações recentes:", error);
      interacoesContainer.innerHTML = '<p class="error-message">Erro ao carregar interações. Tente novamente mais tarde.</p>';
    });
}

// Carrega interações quando a página for carregada
document.addEventListener('DOMContentLoaded', () => {
  // Verifica se estamos na página principal ou de perfil
  if (interacoesContainer) {
    loadRecentInteractions();
  }
});

// Atualiza as interações a cada 5 minutos, se o usuário estiver na página
if (interacoesContainer) {
  setInterval(loadRecentInteractions, 5 * 60 * 1000);
}

// Exporta a função para uso em outros arquivos
window.interacoes = {
  load: loadRecentInteractions
};
