// historio-usuario.js - Funções para exibir histórico de atividades do usuário

// Elementos da interface
const activityTimeline = document.getElementById('activity-timeline');
const statsContainer = document.getElementById('user-stats');
const lastLoginTime = document.getElementById('last-login-time');
const achievementsList = document.getElementById('achievements-list');

// Função para carregar o histórico completo de atividades do usuário
function loadUserActivityHistory(userId) {
  if (!activityTimeline) return;
  
  activityTimeline.innerHTML = '<p class="loading-message">Carregando seu histórico de atividades...</p>';
  
  // Busca atividades do usuário, ordenadas por data (mais recentes primeiro)
  atividadesCollection.where('usuarioId', '==', userId)
    .orderBy('data', 'desc')
    .limit(20) // Limita a 20 atividades mais recentes para melhor performance
    .get()
    .then((querySnapshot) => {
      if (querySnapshot.empty) {
        activityTimeline.innerHTML = '<p class="no-activity-message">Você ainda não tem atividades registradas na plataforma.</p>';
        return;
      }
      
      // Limpa o container
      activityTimeline.innerHTML = '';
      
      // Cria o elemento de linha do tempo
      const timelineElement = document.createElement('div');
      timelineElement.className = 'timeline';
      
      // Adiciona cada atividade à linha do tempo
      querySnapshot.forEach((doc) => {
        const atividade = doc.data();
        
        // Determina o ícone baseado no tipo de atividade
        let icon = '';
        switch (atividade.tipo) {
          case 'login':
            icon = '<i class="fas fa-sign-in-alt"></i>';
            break;
          case 'logout':
            icon = '<i class="fas fa-sign-out-alt"></i>';
            break;
          case 'cadastro_jogo':
            icon = '<i class="fas fa-gamepad"></i>';
            break;
          case 'edicao_jogo':
            icon = '<i class="fas fa-edit"></i>';
            break;
          case 'avaliacao':
            icon = '<i class="fas fa-star"></i>';
            break;
          case 'comentario':
            icon = '<i class="fas fa-comment"></i>';
            break;
          case 'download':
            icon = '<i class="fas fa-download"></i>';
            break;
          case 'conquista':
            icon = '<i class="fas fa-trophy"></i>';
            break;
          default:
            icon = '<i class="fas fa-info-circle"></i>';
        }
        
        // Formata a data
        const dataFormatada = formatDate(atividade.data?.toDate());
        
        // Cria o item da timeline
        const timelineItem = document.createElement('div');
        timelineItem.className = 'timeline-item';
        timelineItem.innerHTML = `
          <div class="timeline-icon">${icon}</div>
          <div class="timeline-content">
            <h4>${atividade.titulo || 'Atividade'}</h4>
            <p>${atividade.descricao || 'Sem descrição'}</p>
            <span class="timeline-date">${dataFormatada}</span>
          </div>
        `;
        
        timelineElement.appendChild(timelineItem);
      });
      
      activityTimeline.appendChild(timelineElement);
    })
    .catch((error) => {
      console.error("Erro ao carregar histórico de atividades:", error);
      activityTimeline.innerHTML = '<p class="error-message">Erro ao carregar histórico de atividades. Tente novamente mais tarde.</p>';
    });
}

// Função para carregar estatísticas do usuário
function loadUserStats(userId) {
  if (!statsContainer) return;
  
  statsContainer.innerHTML = '<p class="loading-message">Carregando estatísticas...</p>';
  
  // Inicializa contadores
  let totalJogos = 0;
  let totalAvaliacoes = 0;
  let totalComentarios = 0;
  let totalVisualizacoes = 0;
  
  // Promessas para buscar os dados
  const jogosPromise = jogosCollection.where('autorId', '==', userId).get();
  const avaliacoesPromise = avaliacoesCollection.where('usuarioId', '==', userId).get();
  const comentariosPromise = comentariosCollection.where('usuarioId', '==', userId).get();
  
  // Executa todas as promessas em paralelo
  Promise.all([jogosPromise, avaliacoesPromise, comentariosPromise])
    .then(([jogosSnapshot, avaliacoesSnapshot, comentariosSnapshot]) => {
      // Conta jogos
      totalJogos = jogosSnapshot.size;
      
      // Conta avaliações
      totalAvaliacoes = avaliacoesSnapshot.size;
      
      // Conta comentários
      totalComentarios = comentariosSnapshot.size;
      
      // Calcula visualizações somando as visualizações de todos os jogos do usuário
      jogosSnapshot.forEach(doc => {
        const jogo = doc.data();
        totalVisualizacoes += jogo.visualizacoes || 0;
      });
      
      // Atualiza a interface com as estatísticas
      statsContainer.innerHTML = `
        <div class="stats-grid">
          <div class="stat-item">
            <h4>${totalJogos}</h4>
            <p>Jogos Publicados</p>
          </div>
          <div class="stat-item">
            <h4>${totalAvaliacoes}</h4>
            <p>Avaliações Feitas</p>
          </div>
          <div class="stat-item">
            <h4>${totalComentarios}</h4>
            <p>Comentários</p>
          </div>
          <div class="stat-item">
            <h4>${totalVisualizacoes}</h4>
            <p>Visualizações Recebidas</p>
          </div>
        </div>
      `;
    })
    .catch((error) => {
      console.error("Erro ao carregar estatísticas:", error);
      statsContainer.innerHTML = '<p class="error-message">Erro ao carregar estatísticas. Tente novamente mais tarde.</p>';
    });
}

// Função para exibir o último acesso do usuário
function updateLastLoginTime(userId) {
  if (!lastLoginTime) return;
  
  // Busca o documento do usuário
  usuariosCollection.doc(userId).get()
    .then((doc) => {
      if (doc.exists) {
        const userData = doc.data();
        const lastLogin = userData.ultimoAcesso?.toDate();
        
        if (lastLogin) {
          lastLoginTime.textContent = `Último acesso: ${formatDateTime(lastLogin)}`;
        } else {
          lastLoginTime.textContent = 'Primeiro acesso hoje';
        }
        
        // Atualiza o timestamp do último acesso
        usuariosCollection.doc(userId).update({
          ultimoAcesso: firebase.firestore.FieldValue.serverTimestamp()
        });
      } else {
        // Se o documento não existir, cria um novo
        usuariosCollection.doc(userId).set({
          id: userId,
          nome: auth.currentUser.displayName,
          email: auth.currentUser.email,
          fotoPerfil: auth.currentUser.photoURL,
          dataCadastro: firebase.firestore.FieldValue.serverTimestamp(),
          ultimoAcesso: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        lastLoginTime.textContent = 'Primeiro acesso';
      }
    })
    .catch((error) => {
      console.error("Erro ao atualizar último acesso:", error);
      lastLoginTime.textContent = 'Não foi possível verificar último acesso';
    });
}

// Função para carregar as conquistas do usuário
function loadUserAchievements(userId) {
  if (!achievementsList) return;
  
  achievementsList.innerHTML = '<p class="loading-message">Carregando conquistas...</p>';
  
  // Busca conquistas do usuário
  conquistasCollection.where('usuarioId', '==', userId).get()
    .then((querySnapshot) => {
      if (querySnapshot.empty) {
        checkAndAssignAchievements(userId);
        return;
      }
      
      // Limpa o container
      achievementsList.innerHTML = '';
      
      // Adiciona cada conquista à lista
      querySnapshot.forEach((doc) => {
        const conquista = doc.data();
        
        const conquistaElement = document.createElement('div');
        conquistaElement.className = 'achievement-item';
        conquistaElement.innerHTML = `
          <div class="achievement-icon ${conquista.desbloqueada ? 'unlocked' : 'locked'}">
            <i class="fas ${conquista.icone || 'fa-trophy'}"></i>
          </div>
          <div class="achievement-info">
            <h4>${conquista.titulo}</h4>
            <p>${conquista.descricao}</p>
            ${conquista.desbloqueada ? `<span class="achievement-date">Desbloqueada em ${formatDate(conquista.dataDesbloqueio?.toDate())}</span>` : ''}
          </div>
        `;
        
        achievementsList.appendChild(conquistaElement);
      });
    })
    .catch((error) => {
      console.error("Erro ao carregar conquistas:", error);
      achievementsList.innerHTML = '<p class="error-message">Erro ao carregar conquistas. Tente novamente mais tarde.</p>';
    });
}

// Função para verificar e atribuir conquistas ao usuário
function checkAndAssignAchievements(userId) {
  // Esta função verificaria condições para desbloquear conquistas
  // Para simplificar, vamos apenas criar algumas conquistas básicas para o usuário
  
  // Define as conquistas padrão (iniciais)
  const conquistasPadrao = [
    {
      titulo: 'Primeira Exploração',
      descricao: 'Explorou a plataforma pela primeira vez',
      icone: 'fa-compass',
      desbloqueada: true,
      dataDesbloqueio: firebase.firestore.FieldValue.serverTimestamp()
    },
    {
      titulo: 'Desenvolvedor Iniciante',
      descricao: 'Publique seu primeiro jogo na plataforma',
      icone: 'fa-gamepad',
      desbloqueada: false
    },
    {
      titulo: 'Crítico Amador',
      descricao: 'Faça sua primeira avaliação de um jogo',
      icone: 'fa-star',
      desbloqueada: false
    },
    {
      titulo: 'Desenvolvedor Experiente',
      descricao: 'Publique 5 jogos na plataforma',
      icone: 'fa-code',
      desbloqueada: false
    },
    {
      titulo: 'Popular',
      descricao: 'Receba 100 visualizações nos seus jogos',
      icone: 'fa-eye',
      desbloqueada: false
    }
  ];
  
  // Verifica se o usuário já tem conquistas
  const batch = db.batch();
  const conquistas = conquistasPadrao.map(conquista => {
    const docRef = conquistasCollection.doc();
    conquista.usuarioId = userId;
    conquista.id = docRef.id;
    batch.set(docRef, conquista);
    return conquista;
  });
  
  // Commit das mudanças ao Firestore
  batch.commit()
    .then(() => {
      if (achievementsList) {
        // Atualiza a interface
        achievementsList.innerHTML = '';
        conquistas.forEach(conquista => {
          const conquistaElement = document.createElement('div');
          conquistaElement.className = 'achievement-item';
          conquistaElement.innerHTML = `
            <div class="achievement-icon ${conquista.desbloqueada ? 'unlocked' : 'locked'}">
              <i class="fas ${conquista.icone || 'fa-trophy'}"></i>
            </div>
            <div class="achievement-info">
              <h4>${conquista.titulo}</h4>
              <p>${conquista.descricao}</p>
              ${conquista.desbloqueada ? `<span class="achievement-date">Desbloqueada em ${formatDate(new Date())}</span>` : ''}
            </div>
          `;
          
          achievementsList.appendChild(conquistaElement);
        });
        
        // Registra a atividade de conquista desbloqueada
        registerUserActivity(
          userId,
          'conquista',
          'Conquista desbloqueada',
          'Conquista "Primeira Exploração" desbloqueada'
        );
      }
    })
    .catch((error) => {
      console.error("Erro ao criar conquistas:", error);
      if (achievementsList) {
        achievementsList.innerHTML = '<p class="error-message">Erro ao criar conquistas. Tente novamente mais tarde.</p>';
      }
    });
}

// Registra uma nova atividade do usuário
function registerUserActivity(userId, tipo, titulo, descricao) {
  if (!userId) return Promise.reject("Usuário não identificado");
  
  const novaAtividade = {
    usuarioId: userId,
    tipo: tipo,
    titulo: titulo,
    descricao: descricao,
    data: firebase.firestore.FieldValue.serverTimestamp()
  };
  
  return atividadesCollection.add(novaAtividade)
    .then(docRef => {
      console.log(`Atividade registrada com ID: ${docRef.id}`);
      return docRef;
    })
    .catch(error => {
      console.error("Erro ao registrar atividade:", error);
      throw error;
    });
}

// Função auxiliar para formatar data e hora
function formatDateTime(date) {
  if (!date) return 'Data desconhecida';
  
  const options = { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  return date.toLocaleDateString('pt-BR', options);
}

// Função auxiliar para formatar data
function formatDate(date) {
  if (!date) return 'Data desconhecida';
  
  const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
  return date.toLocaleDateString('pt-BR', options);
}

// Inicializa o histórico quando o usuário estiver autenticado
document.addEventListener('userAuthenticated', (event) => {
  const user = event.detail;
  if (user) {
    // Carrega as informações do usuário
    loadUserActivityHistory(user.uid);
    loadUserStats(user.uid);
    updateLastLoginTime(user.uid);
    loadUserAchievements(user.uid);
  }
});

// Adiciona outros listeners para atualizar as estatísticas em tempo real
document.addEventListener('gameSubmitted', (event) => {
  const { userId, gameId, gameTitle } = event.detail;
  
  // Registra a atividade
  registerUserActivity(
    userId,
    'cadastro_jogo',
    'Novo jogo enviado',
    `Jogo "${gameTitle}" foi submetido à plataforma`
  );
  
  // Atualiza as estatísticas
  if (statsContainer && auth.currentUser && auth.currentUser.uid === userId) {
    loadUserStats(userId);
  }
  
  // Verifica conquistas
  verifyGameAchievements(userId);
});

document.addEventListener('reviewSubmitted', (event) => {
  const { userId, gameId, gameTitle, rating } = event.detail;
  
  // Registra a atividade
  registerUserActivity(
    userId,
    'avaliacao',
    'Nova avaliação',
    `Avaliou o jogo "${gameTitle}" com ${rating} estrelas`
  );
  
  // Atualiza as estatísticas
  if (statsContainer && auth.currentUser && auth.currentUser.uid === userId) {
    loadUserStats(userId);
  }
  
  // Verifica conquistas
  verifyReviewAchievements(userId);
});

// Função para verificar conquistas relacionadas a jogos
function verifyGameAchievements(userId) {
  // Busca os jogos do usuário
  jogosCollection.where('autorId', '==', userId).get()
    .then(snapshot => {
      const totalJogos = snapshot.size;
      let totalVisualizacoes = 0;
      
      snapshot.forEach(doc => {
        const jogo = doc.data();
        totalVisualizacoes += jogo.visualizacoes || 0;
      });
      
      // Verifica conquistas relacionadas a jogos
      conquistasCollection.where('usuarioId', '==', userId)
        .where('desbloqueada', '==', false)
        .get()
        .then(querySnapshot => {
          const batch = db.batch();
          let conquistasDesbloqueadas = 0;
          
          querySnapshot.forEach(doc => {
            const conquista = doc.data();
            
            // Verifica conquista de primeiro jogo
            if (conquista.titulo === 'Desenvolvedor Iniciante' && totalJogos >= 1) {
              batch.update(doc.ref, { 
                desbloqueada: true,
                dataDesbloqueio: firebase.firestore.FieldValue.serverTimestamp()
              });
              conquistasDesbloqueadas++;
              
              // Registra a atividade
              registerUserActivity(
                userId,
                'conquista',
                'Conquista desbloqueada',
                'Conquista "Desenvolvedor Iniciante" desbloqueada'
              );
            }
            
            // Verifica conquista de 5 jogos
            if (conquista.titulo === 'Desenvolvedor Experiente' && totalJogos >= 5) {
              batch.update(doc.ref, { 
                desbloqueada: true,
                dataDesbloqueio: firebase.firestore.FieldValue.serverTimestamp()
              });
              conquistasDesbloqueadas++;
              
              // Registra a atividade
              registerUserActivity(
                userId,
                'conquista',
                'Conquista desbloqueada',
                'Conquista "Desenvolvedor Experiente" desbloqueada'
              );
            }
            
            // Verifica conquista de popularidade
            if (conquista.titulo === 'Popular' && totalVisualizacoes >= 100) {
              batch.update(doc.ref, { 
                desbloqueada: true,
                dataDesbloqueio: firebase.firestore.FieldValue.serverTimestamp()
              });
              conquistasDesbloqueadas++;
              
              // Registra a atividade
              registerUserActivity(
                userId,
                'conquista',
                'Conquista desbloqueada',
                'Conquista "Popular" desbloqueada'
              );
            }
          });
          
          // Aplica as atualizações se houver conquistas desbloqueadas
          if (conquistasDesbloqueadas > 0) {
            batch.commit().then(() => {
              console.log(`${conquistasDesbloqueadas} conquistas desbloqueadas`);
              if (auth.currentUser && auth.currentUser.uid === userId) {
                loadUserAchievements(userId);
              }
            });
          }
        });
    });
}

// Função para verificar conquistas relacionadas a avaliações
function verifyReviewAchievements(userId) {
  // Busca as avaliações do usuário
  avaliacoesCollection.where('usuarioId', '==', userId).get()
    .then(snapshot => {
      const totalAvaliacoes = snapshot.size;
      
      // Verifica conquistas relacionadas a avaliações
      conquistasCollection.where('usuarioId', '==', userId)
        .where('desbloqueada', '==', false)
        .get()
        .then(querySnapshot => {
          const batch = db.batch();
          let conquistasDesbloqueadas = 0;
          
          querySnapshot.forEach(doc => {
            const conquista = doc.data();
            
            // Verifica conquista de primeira avaliação
            if (conquista.titulo === 'Crítico Amador' && totalAvaliacoes >= 1) {
              batch.update(doc.ref, { 
                desbloqueada: true,
                dataDesbloqueio: firebase.firestore.FieldValue.serverTimestamp()
              });
              conquistasDesbloqueadas++;
              
              // Registra a atividade
              registerUserActivity(
                userId,
                'conquista',
                'Conquista desbloqueada',
                'Conquista "Crítico Amador" desbloqueada'
              );
            }
          });
          
          // Aplica as atualizações se houver conquistas desbloqueadas
          if (conquistasDesbloqueadas > 0) {
            batch.commit().then(() => {
              console.log(`${conquistasDesbloqueadas} conquistas desbloqueadas`);
              if (auth.currentUser && auth.currentUser.uid === userId) {
                loadUserAchievements(userId);
              }
            });
          }
        });
    });
}

// Exporta funções para uso em outros arquivos
window.userHistory = {
  loadHistory: loadUserActivityHistory,
  loadStats: loadUserStats,
  loadAchievements: loadUserAchievements,
  registerActivity: registerUserActivity,
  verifyGameAchievements: verifyGameAchievements,
  verifyReviewAchievements: verifyReviewAchievements
};
