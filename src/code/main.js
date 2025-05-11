// Código principal da aplicação

// Inicialização ao carregar a página
document.addEventListener('DOMContentLoaded', function () {
  // Verifica em qual página estamos
  const currentPath = window.location.pathname;

  // Inicializa o Firebase se disponível
  inicializarFirebase();

  // Atualiza o status do usuário na página
  atualizarStatusUsuario();

  // Inicializa a página de jogos
  if (currentPath.includes('jogos.html')) inicializarPaginaJogos();

  // Adiciona listeners comuns a todas as páginas
  adicionarListenersComuns();
});

// Inicializa o Firebase e configurações relacionadas
function inicializarFirebase() {
  // Verifica se o Firebase está disponível
  if (typeof firebase !== 'undefined' && firebase.apps.length) {
    console.log('Firebase inicializado com sucesso!');

    // Configura observadores de autenticação
    if (typeof firebase.auth === 'function') {
      firebase.auth().onAuthStateChanged(function (user) {
        atualizarStatusUsuario(user);
      });
    }
  } else console.error('Firebase não inicializado corretamente!');
}

// Atualiza o status do usuário na interface
function atualizarStatusUsuario(user) {
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
  // Cria e configura o botão "Voltar ao topo"
  criarBotaoVoltarAoTopo();
  
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

// Cria e configura o botão "Voltar ao topo" para todas as páginas
function criarBotaoVoltarAoTopo() {
  // Verifica se o botão já existe na página
  if (!document.querySelector('.back-to-top')) {
    // Cria o elemento do botão
    const backToTopBtn = document.createElement('div');
    backToTopBtn.className = 'back-to-top';
    backToTopBtn.setAttribute('aria-label', 'Voltar ao topo da página');
    backToTopBtn.setAttribute('role', 'button');
    backToTopBtn.setAttribute('tabindex', '0');
    backToTopBtn.innerHTML = '<i class="fas fa-chevron-up"></i>';
    
    // Adiciona o botão ao final do body
    document.body.appendChild(backToTopBtn);
    
    // Adiciona o evento de click
    backToTopBtn.addEventListener('click', voltarAoTopo);
    
    // Adiciona suporte para navegação por teclado
    backToTopBtn.addEventListener('keydown', function(e) {
      // Ativa quando Enter ou Espaço são pressionados
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        voltarAoTopo();
      }
    });
    
    // Adiciona feedback visual para dispositivos de toque
    backToTopBtn.addEventListener('touchstart', function() {
      backToTopBtn.style.transform = 'scale(0.95)';
    });
    
    backToTopBtn.addEventListener('touchend', function() {
      backToTopBtn.style.transform = 'scale(1)';
    });
    
    // Configura a visibilidade do botão baseado na rolagem
    window.addEventListener('scroll', handleBackToTopVisibility);
    
    // Verifica imediatamente a visibilidade ao carregar
    handleBackToTopVisibility();
  }
}

// Função para rolar suavemente para o topo
function voltarAoTopo() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}

// Controla a visibilidade do botão "Voltar ao topo" baseado na posição de rolagem
function handleBackToTopVisibility() {
  const backToTopBtn = document.querySelector('.back-to-top');
  if (!backToTopBtn) return;
  
  const scrollPosition = window.scrollY;
  const windowHeight = window.innerHeight;
  const documentHeight = document.documentElement.scrollHeight;
  
  // Mostra o botão quando rolar mais de 300px ou 30% da altura da janela
  // (o que for menor) e esconde quando estiver próximo do topo
  const threshold = Math.min(300, windowHeight * 0.3);
  
  if (scrollPosition > threshold) {
    if (!backToTopBtn.classList.contains('visible')) {
      backToTopBtn.classList.add('visible');
    }
  } else {
    if (backToTopBtn.classList.contains('visible')) {
      backToTopBtn.classList.remove('visible');
    }
  }
  
  // Se estiver no final da página, posiciona o botão acima do rodapé
  const footer = document.querySelector('footer');
  if (footer) {
    const footerTop = footer.getBoundingClientRect().top;
    if (footerTop <= windowHeight) {
      const distanceFromFooter = windowHeight - footerTop + 10;
      backToTopBtn.style.bottom = `${distanceFromFooter}px`;
    } else {
      backToTopBtn.style.bottom = '20px';
    }
  }
}

// Otimização para limitar a frequência de verificações durante rolagem
let scrollTimeout;
window.addEventListener('scroll', function() {
  if (!scrollTimeout) {
    scrollTimeout = setTimeout(function() {
      handleBackToTopVisibility();
      scrollTimeout = null;
    }, 100);
  }
});