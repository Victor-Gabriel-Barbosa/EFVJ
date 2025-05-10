// Código principal da aplicação

// Inicialização ao carregar a página
document.addEventListener('DOMContentLoaded', function () {
  // Verificar em qual página estamos
  const currentPath = window.location.pathname;

  // Inicializar o Firebase se disponível
  inicializarFirebase();

  // Atualizar o status do usuário na página
  atualizarStatusUsuario();

  // Inicializar a página de jogos
  if (currentPath.includes('jogos.html')) {
    inicializarPaginaJogos();
  }

  // Adicionar listeners comuns a todas as páginas
  adicionarListenersComuns();
});

// Configura os botões de login e logout na navbar
function configurarBotoesAutenticacao() {
  // Esta função agora é gerenciada pelo components.js
  // Mantida aqui por compatibilidade com código existente
}

// Inicializa o Firebase e configurações relacionadas
function inicializarFirebase() {
  // Verificar se o Firebase está disponível
  if (typeof firebase !== 'undefined' && firebase.apps.length) {
    console.log('Firebase inicializado com sucesso!');

    // Configurar observadores de autenticação
    if (typeof firebase.auth === 'function') {
      firebase.auth().onAuthStateChanged(function (user) {
        atualizarStatusUsuario(user);
      });
    }
  } else {
    console.error('Firebase não inicializado corretamente!');
  }
}

// Atualiza o status do usuário na interface
function atualizarStatusUsuario(user) {
  const userStatusElement = document.getElementById('user-status');
  const loginBtn = document.getElementById('nav-login-btn');
  const logoutBtn = document.getElementById('nav-logout-btn');

  // Atualiza botões na navbar
  if (loginBtn && logoutBtn) {
    if (user) {
      loginBtn.style.display = 'none';
      logoutBtn.style.display = 'inline-block';
    } else {
      loginBtn.style.display = 'inline-block';
      logoutBtn.style.display = 'none';
    }
  }

  if (!userStatusElement) return;

  if (user) {
    // Usuário está logado
    userStatusElement.innerHTML = `
            <div class="user-info">
                <img src="${user.photoURL || 'https://via.placeholder.com/32?text=U'}" alt="${user.displayName}" class="user-avatar">
                <span class="user-name">${user.displayName || 'Usuário'}</span>
            </div>
        `;
  } else {
    // Usuário não está logado
    userStatusElement.innerHTML = '';
  }
}

// Inicializa a página de jogos
function inicializarPaginaJogos() {
  console.log('Inicializando página de jogos...');

  // Verifica se o Firebase está disponível
  if (typeof firebase !== 'undefined' && firebase.apps.length) {
    // Carregar jogos do Firestore (a função está em jogos-crud.js)
    if (typeof carregarJogos === 'function') {
      carregarJogos();
    } else {
      console.error('Função carregarJogos não encontrada!');
    }
  } else {
    console.error('Firebase não inicializado corretamente!');

    // Exibir mensagem de erro na interface
    const jogosGrid = document.querySelector('.games-grid');
    if (jogosGrid) {
      jogosGrid.innerHTML = '<p class="error-message">Erro ao conectar com o Firebase. Por favor, verifique sua conexão.</p>';
    }
  }
}

// Adiciona listeners comuns a todas as páginas
function adicionarListenersComuns() {
  // Exemplo: Animação ao clicar em botões
  const buttons = document.querySelectorAll('.pixel-button, .big-pixel-button');
  buttons.forEach(button => {
    button.addEventListener('click', function () {
      this.style.transform = 'translate(4px, 4px)';
      this.style.boxShadow = '0px 0px 0 rgba(0, 0, 0, 0.5)';
      setTimeout(() => {
        this.style.transform = '';
        this.style.boxShadow = '';
      }, 100);
    });
  });

  // Configurar eventos de autenticação
  document.addEventListener('userAuthenticated', (event) => {
    // Atualizar status do usuário quando o evento for disparado
    atualizarStatusUsuario(event.detail);
  });

  document.addEventListener('userLoggedOut', () => {
    // Atualizar status quando o usuário fizer logout
    atualizarStatusUsuario(null);
  });
}