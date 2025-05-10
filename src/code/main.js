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

  // Adiciona listeners comuns a todas as páginas
  adicionarListenersComuns();
});

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
  } else console.error('Firebase não inicializado corretamente!');
}

// Atualiza o status do usuário na interface
function atualizarStatusUsuario(user) {
  const userStatusElement = document.getElementById('user-status');
  const loginBtn = document.getElementById('nav-login-btn');
  const logoutBtn = document.getElementById('nav-logout-btn');
  const userNavInfo = document.querySelector('.user-nav-info');
  const navUserAvatar = document.getElementById('nav-user-avatar');
  const navUserName = document.getElementById('nav-user-name');

  // Atualiza botões e informações do usuário na navbar
  if (loginBtn && logoutBtn) {
    if (user) {
      loginBtn.style.display = 'none';
      logoutBtn.style.display = 'inline-block';
      
      // Exibe e atualiza as informações do usuário na navbar
      if (userNavInfo) userNavInfo.style.display = 'flex';
      if (navUserAvatar) navUserAvatar.src = user.photoURL || 'https://via.placeholder.com/32?text=U';
      if (navUserName) navUserName.textContent = user.displayName || 'Usuário';
    } else {
      loginBtn.style.display = 'inline-block';
      logoutBtn.style.display = 'none';
      
      // Oculta as informações do usuário na navbar
      if (userNavInfo) userNavInfo.style.display = 'none';
      if (navUserAvatar) navUserAvatar.src = '';
      if (navUserName) navUserName.textContent = 'Usuário';
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
  } else userStatusElement.innerHTML = ''; // Usuário não está logado
}

// Inicializa a página de jogos
function inicializarPaginaJogos() {
  console.log('Inicializando página de jogos...');

  // Verifica se o Firebase está disponível
  if (typeof firebase !== 'undefined' && firebase.apps.length) {
    // Carrega jogos do Firestore (a função está em jogos-crud.js)
    if (typeof carregarJogos === 'function') carregarJogos();
    else console.error('Função carregarJogos não encontrada!');
  } else {
    console.error('Firebase não inicializado corretamente!');

    // Exibe mensagem de erro na interface
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

  // Configura eventos de autenticação
  document.addEventListener('userAuthenticated', (event) => {
    // Atualiza status do usuário quando o evento for disparado
    atualizarStatusUsuario(event.detail);
  });

  document.addEventListener('userLoggedOut', () => {
    // Atualiza status quando o usuário fizer logout
    atualizarStatusUsuario(null);
  });
}