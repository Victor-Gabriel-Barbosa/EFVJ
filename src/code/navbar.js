/**
 * Sistema de componentes para carregar elementos compartilhados entre páginas
 * Autor: Victor-Gabriel-Barbosa
 */

/**
 * Cria uma navbar dinâmica e a insere no elemento alvo
 * @param {string} targetElementId - ID do elemento onde inserir a navbar
 * @param {function} callback - Função opcional para executar após a criação da navbar
 */
function createNavbar(targetElementId, callback) {
  const navbarHTML = `
    <nav class="game-nav">
      <ul>
        <li><a href="index.html" class="pixel-button" id="nav-home">Início</a></li>
        <li><a href="jogos.html" class="pixel-button" id="nav-games">Jogos</a></li>
        <li><a href="avaliacao.html" class="pixel-button" id="nav-rating">Avaliação</a></li>
        <li><a href="usuario.html" class="pixel-button" id="nav-profile">Meu Perfil</a></li>
        <li><button id="nav-login-btn" class="pixel-button login-btn">Entrar</button></li>
        <li><button id="nav-logout-btn" class="pixel-button logout-btn" style="display: none;">Sair</button></li>
      </ul>
    </nav>
  `;

  const targetElement = document.getElementById(targetElementId);
  if (targetElement) {
    targetElement.innerHTML = navbarHTML;

    // Marca o link ativo com base na URL atual
    markActiveNavLink();

    // Configura botões de autenticação
    configurarBotoesAutenticacao();

    // Executa callback se fornecido
    if (callback && typeof callback === 'function') callback();
  } else {
    console.error(`Elemento com ID "${targetElementId}" não encontrado.`);
  }
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

/**
 * Marca o link da navbar que corresponde à página atual
 */
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

  if (loginBtn) {
    loginBtn.addEventListener('click', function () {
      if (typeof firebase !== 'undefined' && firebase.auth) {
        // Verifica se temos a função de login definida em auth.js
        if (window.userAuth && typeof window.userAuth.login === 'function') window.userAuth.login();
        else {
          // Fallback para login direto com Google
          const provider = new firebase.auth.GoogleAuthProvider();
          firebase.auth().signInWithPopup(provider);
        }
      } else {
        console.error('Firebase Auth não disponível');
        alert('Serviço de autenticação não disponível no momento.');
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', function () {
      if (typeof firebase !== 'undefined' && firebase.auth) {
        // Verifica se temos a função de logout definida em auth.js
        if (window.userAuth && typeof window.userAuth.logout === 'function') window.userAuth.logout();
        else firebase.auth().signOut(); // Fallback para logout direto
      }
    });
  }
}

// Auto-inicialização quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function () {
  // Verifica se o container da navbar existe na página
  if (document.getElementById('navbar-container')) createNavbar('navbar-container');
});