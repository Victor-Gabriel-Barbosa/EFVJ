// auth.js - Sistema de autenticação com Firebase

// Referência ao serviço de autenticação
const auth = firebase.auth();

// Provedor de autenticação Google
const googleProvider = new firebase.auth.GoogleAuthProvider();

// Elementos da interface
const loginSection = document.getElementById('login-section');
const profileSection = document.getElementById('profile-section');
const googleLoginBtn = document.getElementById('google-login');
const logoutBtn = document.getElementById('logout-btn');
const userAvatar = document.getElementById('user-avatar');
const userName = document.getElementById('user-name');
const userEmail = document.getElementById('user-email');
const userGames = document.getElementById('user-games');
const userReviews = document.getElementById('user-reviews');

// Estado atual do usuário
let currentUser = null;

// Função para fazer login com Google
function loginWithGoogle() {
  // Configurando o Google Auth para abrir em popup
  googleProvider.setCustomParameters({
    prompt: 'select_account'
  });
  
  // Iniciando o processo de login
  auth.signInWithPopup(googleProvider)
    .then(() => {
      // Login bem-sucedido, usuário já está autenticado
      // O listener onAuthStateChanged será acionado automaticamente
    })
    .catch((error) => {
      console.error("Erro no login:", error);
      alert(`Erro ao fazer login: ${error.message}`);
    });
}

// Função para fazer logout
function logout() {
  auth.signOut()
    .then(() => {
      // Logout bem-sucedido
      // O listener onAuthStateChanged será acionado automaticamente
    })
    .catch((error) => {
      console.error("Erro no logout:", error);
      alert(`Erro ao fazer logout: ${error.message}`);
    });
}

// Função para exibir os dados do usuário logado
function displayUserProfile(user) {
  // Atualiza a interface para mostrar os dados do usuário
  if (userName) userName.textContent = user.displayName || 'Usuário';
  if (userEmail) userEmail.textContent = user.email || '';
  if (userAvatar) userAvatar.src = user.photoURL || 'https://via.placeholder.com/100?text=Avatar';
  
  // Esconde a seção de login e mostra o perfil
  if (loginSection) loginSection.classList.add('hidden');
  if (profileSection) profileSection.classList.remove('hidden');
  
  // Carrega os jogos do usuário apenas se o elemento existir
  if (userGames) loadUserGames(user.uid);
  
  // Carrega as avaliações do usuário apenas se o elemento existir
  if (userReviews) loadUserReviews(user.uid);
}

// Função para resetar a interface quando não há usuário logado
function resetUIForLoggedOut() {
  // Garante que o perfil esteja oculto e a seção de login visível
  if (profileSection) {
    profileSection.classList.add('hidden');
    profileSection.style.display = 'none'; // Garante que fique invisível
  }
  
  if (loginSection) {
    loginSection.classList.remove('hidden');
    loginSection.style.display = 'block'; // Garante que fique visível
  }
  
  // Limpa os dados do usuário anterior
  if (userName) userName.textContent = 'Nome do Usuário';
  if (userEmail) userEmail.textContent = 'email@exemplo.com';
  if (userAvatar) userAvatar.src = '';
}

// Função para carregar os jogos do usuário
function loadUserGames(userId) {
  // Se o elemento userGames não existir, não faz nada
  if (!userGames) return;
  
  // Consulta os jogos no Firestore onde o autor é o usuário atual
  jogosCollection.where('autorId', '==', userId)
    .get()
    .then((querySnapshot) => {
      // Se não encontrar jogos, mostra a mensagem padrão
      if (querySnapshot.empty) {
        userGames.innerHTML = '<p class="no-games-message">Você ainda não enviou nenhum jogo. <a href="jogos.html" class="text-link">Submeta seu primeiro jogo!</a></p>';
        return;
      }
      
      // Limpa o container de jogos
      userGames.innerHTML = '';
      
      // Adiciona cada jogo à lista
      querySnapshot.forEach((doc) => {
        const jogo = doc.data();
        const jogoElement = document.createElement('div');
        jogoElement.className = 'game-card';
        jogoElement.innerHTML = `
          <div class="game-thumbnail" style="--bg-image: url('${jogo.thumbnailUrl || 'assets/placeholder.png'}')"></div>
          <div class="game-info">
            <h3>${jogo.titulo}</h3>
            <div class="rating">
              ${generateStarRating(jogo.avaliacao)}
              <span class="rating-text">${jogo.avaliacao?.toFixed(1) || '0.0'}</span>
            </div>
            <a href="${jogo.linkJogo}" class="pixel-button play-btn" target="_blank">Jogar</a>
            <button class="pixel-button edit-btn" data-id="${doc.id}">Editar</button>
          </div>
        `;
        userGames.appendChild(jogoElement);
        
        // Adiciona evento de edição
        const editBtn = jogoElement.querySelector('.edit-btn');
        if (editBtn) {
          editBtn.addEventListener('click', () => {
            // Função para editar jogo (pode ser implementada no jogos-crud.js)
            if (typeof openGameEditModal === 'function') openGameEditModal(doc.id);
          });
        }
      });
    })
    .catch((error) => {
      console.error("Erro ao carregar jogos do usuário:", error);
      if (userGames) userGames.innerHTML = '<p class="error-message">Erro ao carregar seus jogos. Tente novamente mais tarde.</p>';
    });
}

// Função para carregar as avaliações do usuário
function loadUserReviews(userId) {
  // Se o elemento userReviews não existir, não faz nada
  if (!userReviews) return;
  
  // Implementação para carregar avaliações do Firebase
  // Esta é uma versão básica, você pode expandir conforme necessário
  const avaliacoesCollection = db.collection('avaliacoes');
  
  avaliacoesCollection.where('usuarioId', '==', userId)
    .get()
    .then((querySnapshot) => {
      // Se não encontrar avaliações, mostra a mensagem padrão
      if (querySnapshot.empty) {
        userReviews.innerHTML = '<p class="no-reviews-message">Você ainda não fez nenhuma avaliação. <a href="avaliacao.html" class="text-link">Avalie um jogo!</a></p>';
        return;
      }
      
      // Limpa o container de avaliações
      userReviews.innerHTML = '';
      
      // Adiciona cada avaliação à lista
      querySnapshot.forEach((doc) => {
        const avaliacao = doc.data();
        
        // Busca informações do jogo avaliado
        jogosCollection.doc(avaliacao.jogoId).get()
          .then((jogoDoc) => {
            const jogo = jogoDoc.exists ? jogoDoc.data() : { titulo: 'Jogo indisponível' };
            
            const avaliacaoElement = document.createElement('div');
            avaliacaoElement.className = 'review-item';
            avaliacaoElement.innerHTML = `
              <div class="review-game">
                <h4>${jogo.titulo}</h4>
                <div class="rating">
                  ${generateStarRating(avaliacao.nota)}
                  <span class="rating-text">${avaliacao.nota.toFixed(1)}</span>
                </div>
              </div>
              <div class="review-content">
                <p>${avaliacao.comentario || 'Sem comentário'}</p>
                <span class="review-date">${formatDate(avaliacao.data?.toDate())}</span>
              </div>
            `;
            userReviews.appendChild(avaliacaoElement);
          });
      });
    })
    .catch((error) => {
      console.error("Erro ao carregar avaliações do usuário:", error);
      if (userReviews) userReviews.innerHTML = '<p class="error-message">Erro ao carregar suas avaliações. Tente novamente mais tarde.</p>';
    });
}

// Função auxiliar para gerar estrelas de avaliação
function generateStarRating(rating) {
  let stars = '';
  for (let i = 1; i <= 5; i++) stars += `<span class="pixel-star ${i <= rating ? 'filled' : ''}"></span>`;
  return stars;
}

// Função auxiliar para formatar data
function formatDate(date) {
  if (!date) return 'Data desconhecida';
  
  const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
  return date.toLocaleDateString('pt-BR', options);
}

// Adiciona os event listeners
if (googleLoginBtn) googleLoginBtn.addEventListener('click', loginWithGoogle);

if (logoutBtn) logoutBtn.addEventListener('click', logout);

// Observador de mudança de estado de autenticação
auth.onAuthStateChanged((user) => {
  if (user) {
    // Usuário logado
    currentUser = user;
    console.log("Usuário logado:", user.displayName);
    
    // Atualiza a interface
    displayUserProfile(user);
    
    // Dispara evento personalizado para informar outras páginas
    const authEvent = new CustomEvent('userAuthenticated', { detail: user });
    document.dispatchEvent(authEvent);
  } else {
    // Usuário deslogado
    currentUser = null;
    console.log("Nenhum usuário logado");
    
    // Reseta a interface
    resetUIForLoggedOut();
    
    // Dispara evento personalizado
    const authEvent = new CustomEvent('userLoggedOut');
    document.dispatchEvent(authEvent);
  }
});

// Inicialização - garante o estado correto da interface quando a página carrega
document.addEventListener('DOMContentLoaded', function() {
  // Se o usuário não estiver logado, esconde a seção de perfil
  if (!auth.currentUser) resetUIForLoggedOut();
});

// Exporta funções e variáveis para uso em outros arquivos
window.userAuth = {
  currentUser: () => currentUser,
  login: loginWithGoogle,
  logout: logout,
  isLoggedIn: () => !!currentUser
};