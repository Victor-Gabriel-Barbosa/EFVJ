// Componente de barra de navegação dinâmica

/**
 * Cria uma navbar dinâmica e a insere no elemento alvo
 * @param {string} targetElementId - ID do elemento onde inserir a navbar
 * @param {function} callback - Função opcional para executar após a criação da navbar
 */
function createNavbar(targetElementId, callback) {
  const navbarHTML = `
    <nav class="game-nav">
      <!-- Botão de menu mobile -->
      <button class="mobile-menu-toggle" aria-label="Menu">
        <div class="hamburger-icon">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </button>
      
      <!-- Logo ou título do site (pode ser adicionado) -->
      <div class="nav-brand" style="z-index: 1000;">
        <a href="index.html">EFVJ</a>
      </div>
      
      <!-- Container principal - organiza menu e área do usuário -->
      <div class="nav-container">
        <!-- Links de navegação -->
        <ul class="nav-menu">
          <li><a href="index.html" class="pixel-button" id="nav-home">Início</a></li>
          <li><a href="jogos.html" class="pixel-button" id="nav-games">Jogos</a></li>
          <li><a href="avaliacao.html" class="pixel-button" id="nav-rating">Avaliação</a></li>
          <li><a href="usuario.html" class="pixel-button" id="nav-profile">Perfil</a></li>
        </ul>
        
        <!-- Área do usuário -->
        <div class="user-area">
          <!-- Informações do usuário logado -->
          <div class="user-nav-info" style="display: none;">
            <img id="nav-user-avatar" src="" alt="Avatar do usuário" class="nav-avatar">
          </div>
          
          <!-- Botões de autenticação -->
          <div class="auth-buttons">
            <a href="#" id="nav-login-btn" class="pixel-button">Entrar</a>
            <a href="#" id="nav-logout-btn" class="pixel-button" style="display: none;">Sair</a>
          </div>
        </div>
      </div>
    </nav>
  `;

  const targetElement = document.getElementById(targetElementId);
  if (targetElement) {
    targetElement.innerHTML = navbarHTML;

    // Marca o link ativo com base na URL atual
    markActiveNavLink();

    // Configura botões de autenticação
    configurarBotoesAutenticacao();
    
    // Configura o botão do menu mobile
    configurarMenuMobile();

    // Executa callback se fornecido
    if (callback && typeof callback === 'function') callback();
  } else console.error(`Elemento com ID "${targetElementId}" não encontrado.`);
}

/**
 * Função legada para compatibilidade com código antigo
 * Agora usa a função createNavbar internamente
 */
function loadComponent(componentPath, targetElementId, callback) {
  // Se for a navbar, usar o novo método
  if (componentPath.includes('navbar')) {
    createNavbar(targetElementId, callback);
    return;
  }

  // Para outros componentes, mantém o comportamento de fetch
  fetch(componentPath)
    .then(response => {
      if (!response.ok) throw new Error(`Erro ao carregar componente: ${response.status}`);
      return response.text();
    })
    .then(html => {
      const targetElement = document.getElementById(targetElementId);
      if (targetElement) {
        targetElement.innerHTML = html;

        // Se for navbar, marca link ativo
        if (componentPath.includes('navbar')) markActiveNavLink();

        // Executa callback se fornecido
        if (callback && typeof callback === 'function') callback();
      } else console.error(`Elemento com ID "${targetElementId}" não encontrado.`);
    })
    .catch(error => {
      console.error(`Falha ao carregar o componente ${componentPath}:`, error);
    });
}

// Marca o link da navbar que corresponde à página atual
function markActiveNavLink() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';

  // Remove classe 'active' de todos os links
  document.querySelectorAll('.game-nav a').forEach(link => {
    link.classList.remove('active');
  });

  // Adiciona classe 'active' ao link da página atual
  let navLinkId = '';

  if (currentPage === 'index.html' || currentPage === '') navLinkId = 'nav-home';
  else if (currentPage === 'jogos.html') navLinkId = 'nav-games';
  else if (currentPage === 'avaliacao.html') navLinkId = 'nav-rating';
  else if (currentPage === 'usuario.html') navLinkId = 'nav-profile';

  const activeLink = document.getElementById(navLinkId);
  if (activeLink) activeLink.classList.add('active');
}

// Configura os botões de login e logout na navbar
function configurarBotoesAutenticacao() {
  const loginBtn = document.getElementById('nav-login-btn');
  const logoutBtn = document.getElementById('nav-logout-btn');
  const userNavInfo = document.querySelector('.user-nav-info');
  const userAvatar = document.getElementById('nav-user-avatar');

  if (loginBtn) {
    loginBtn.addEventListener('click', function (e) {
      e.preventDefault(); // Previne o comportamento padrão do link
      if (typeof firebase !== 'undefined' && firebase.auth) {
        // Verifica se temos a função de login definida em auth.js
        if (window.userAuth && typeof window.userAuth.login === 'function') window.userAuth.login();
        else {
          // Fallback para login direto com Google
          const provider = new firebase.auth.GoogleAuthProvider();
          firebase.auth().signInWithPopup(provider).then(result => {
            const user = result.user;
            if (user) {
              userNavInfo.style.display = 'flex';
              userAvatar.src = user.photoURL || '';
              loginBtn.style.display = 'none';
              logoutBtn.style.display = 'block';
            }
          });
        }
      } else {
        console.error('Firebase Auth não disponível');
        alert('Serviço de autenticação não disponível no momento.');
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', function (e) {
      e.preventDefault(); // Previne o comportamento padrão do link
      if (typeof firebase !== 'undefined' && firebase.auth) {
        // Verifica se temos a função de logout definida em auth.js
        if (window.userAuth && typeof window.userAuth.logout === 'function') window.userAuth.logout();
        else firebase.auth().signOut().then(() => {
          userNavInfo.style.display = 'none';
          userAvatar.src = '';
          loginBtn.style.display = 'block';
          logoutBtn.style.display = 'none';
        }); // Fallback para logout direto
      }
    });
  }
}

// Configura o botão do menu mobile
function configurarMenuMobile() {
  const menuToggle = document.querySelector('.mobile-menu-toggle');
  const navMenu = document.querySelector('.nav-menu');

  if (menuToggle && navMenu) {
    menuToggle.addEventListener('click', function () {
      navMenu.classList.toggle('active');
      menuToggle.classList.toggle('active'); // Adiciona/remove classe active no botão para animar o ícone
    });
    
    // Fecha o menu quando um item é clicado
    const menuItems = navMenu.querySelectorAll('a, button');
    menuItems.forEach(item => {
      item.addEventListener('click', function() {
        navMenu.classList.remove('active');
        menuToggle.classList.remove('active');
      });
    });
    
    // Fecha o menu quando clica fora dele
    document.addEventListener('click', function(event) {
      const isClickInside = navMenu.contains(event.target) || menuToggle.contains(event.target);
      if (!isClickInside && navMenu.classList.contains('active')) {
        navMenu.classList.remove('active');
        menuToggle.classList.remove('active');
      }
    });
  }
}

// Auto-inicialização quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function () {
  // Verifica se o container da navbar existe na página
  if (document.getElementById('navbar-container')) createNavbar('navbar-container');
});