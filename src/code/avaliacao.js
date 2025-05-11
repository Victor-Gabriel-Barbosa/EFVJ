// Funções para manipulação de avaliações no Firestore

// Categorias de avaliação disponíveis
const categorias = ['som', 'criatividade', 'jogabilidade', 'design', 'historia', 'bugs', 'interatividade'];

// Função para carregar jogos no select
async function carregarJogosSelect() {
  try {
    const gameSelect = document.getElementById('game-select');
    gameSelect.innerHTML = '<option value="">-- Escolha um jogo --</option>';

    const snapshot = await jogosCollection.get();

    if (snapshot.empty) return;

    snapshot.forEach(doc => {
      const jogo = doc.data();
      const jogoId = doc.id;

      const option = document.createElement('option');
      option.value = jogoId;
      option.textContent = jogo.titulo;
      gameSelect.appendChild(option);
    });
  } catch (error) {
    console.error("Erro ao carregar jogos:", error);
    alert("Erro ao carregar jogos. Por favor, tente novamente.");
  }
}

// Verifica se o usuário já avaliou o jogo
async function verificarAvaliacaoExistente(jogoId, userId) {
  try {
    const snapshot = await avaliacoesCollection
      .where('jogoId', '==', jogoId)
      .where('userId', '==', userId)
      .get();

    return !snapshot.empty;
  } catch (error) {
    console.error("Erro ao verificar avaliação existente:", error);
    return false;
  }
}

// Função para enviar uma avaliação
async function enviarAvaliacao(evento) {
  evento.preventDefault();

  // Verifica se o usuário está logado
  const currentUser = window.userAuth?.currentUser();
  if (!currentUser) {
    mostrarResultado("Você precisa estar logado para avaliar um jogo.", true);
    return;
  }

  const jogoId = document.getElementById('game-select').value;
  if (!jogoId) {
    mostrarResultado("Por favor, selecione um jogo para avaliar.", true);
    return;
  }

  const submitButton = document.getElementById('submit-rating');
  submitButton.disabled = true;
  submitButton.textContent = 'Enviando...';

  try {
    // Verifica se o usuário já avaliou este jogo
    const avaliacaoExistente = await verificarAvaliacaoExistente(jogoId, currentUser.uid);

    if (avaliacaoExistente) mostrarResultado("Você já avaliou este jogo! Atualizamos sua avaliação.", false);

    // Coleta avaliações por categoria
    const avaliacoes = {};
    let somaAvaliacoes = 0;
    let categoriasAvaliadas = 0;

    categorias.forEach(categoria => {
      const slider = document.getElementById(`${categoria}-range`);
      if (slider) {
        const rating = slider.value;
        avaliacoes[categoria] = parseInt(rating);
        somaAvaliacoes += parseInt(rating);
        categoriasAvaliadas++;
      }
    });

    if (categoriasAvaliadas === 0) {
      mostrarResultado("Por favor, avalie o jogo em pelo menos uma categoria.", true);
      submitButton.disabled = false;
      submitButton.textContent = 'Enviar Avaliação';
      return;
    }

    // Calcula média geral
    const mediaGeral = somaAvaliacoes / categoriasAvaliadas;

    // Obtém comentário
    const comentario = document.getElementById('comment').value;

    // Obtém referência ao jogo
    const jogoRef = jogosCollection.doc(jogoId);
    const jogoDoc = await jogoRef.get();

    if (!jogoDoc.exists) {
      mostrarResultado("Jogo não encontrado.", true);
      submitButton.disabled = false;
      submitButton.textContent = 'Enviar Avaliação';
      return;
    }

    const jogo = jogoDoc.data();

    // Cria documento de avaliação
    const avaliacaoData = {
      jogoId,
      jogoTitulo: jogo.titulo,
      userId: currentUser.uid,
      userName: currentUser.displayName || 'Usuário anônimo',
      userEmail: currentUser.email,
      avaliacoes,
      mediaGeral,
      comentario,
      dataAvaliacao: firebase.firestore.FieldValue.serverTimestamp()
    };

    // Salva ou atualiza avaliação
    if (avaliacaoExistente) {
      // Busca ID da avaliação existente
      const avaliacaoSnapshot = await avaliacoesCollection
        .where('jogoId', '==', jogoId)
        .where('userId', '==', currentUser.uid)
        .get();

      const avaliacaoId = avaliacaoSnapshot.docs[0].id;
      await avaliacoesCollection.doc(avaliacaoId).update(avaliacaoData);
    } else await avaliacoesCollection.add(avaliacaoData);

    // Atualiza a avaliação média do jogo
    await atualizarMediaJogo(jogoId);

    // Reseta formulário
    resetarFormulario();

    // Mostra resultado
    mostrarResultado("Avaliação enviada com sucesso!", false);

    // Atualiza ranking
    await carregarRanking();
  } catch (error) {
    console.error("Erro ao enviar avaliação:", error);
    mostrarResultado("Erro ao enviar avaliação. Por favor, tente novamente.", true);
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = 'Enviar Avaliação';
  }
}

// Função para atualizar a média de avaliações de um jogo
async function atualizarMediaJogo(jogoId) {
  try {
    // Obtém todas as avaliações do jogo
    const avaliacoesSnapshot = await avaliacoesCollection
      .where('jogoId', '==', jogoId)
      .get();

    if (avaliacoesSnapshot.empty) return;

    // Calcula média por categoria e média geral
    const categoriasSoma = {};
    const categoriasCount = {};
    let somaGeralTotal = 0;
    let avaliacoesCount = 0;

    // Inicializa contadores
    categorias.forEach(categoria => {
      categoriasSoma[categoria] = 0;
      categoriasCount[categoria] = 0;
    });    
    // Processa avaliações por categoria
    avaliacoesSnapshot.forEach(doc => {
      const avaliacao = doc.data();

      // Processa avaliações por categoria
      if (avaliacao.avaliacoes) {
        // Para cada categoria na avaliação
        Object.keys(avaliacao.avaliacoes).forEach(categoria => {
          // Somente processa se for uma categoria válida 
          if (categorias.includes(categoria)) {
            const valor = avaliacao.avaliacoes[categoria];
            categoriasSoma[categoria] = (categoriasSoma[categoria] || 0) + valor;
            categoriasCount[categoria] = (categoriasCount[categoria] || 0) + 1;
          }
        });
      }

      // Conta avaliações gerais
      if (avaliacao.mediaGeral) {
        somaGeralTotal += avaliacao.mediaGeral;
        avaliacoesCount++;
      }
    });

    // Calcula médias
    const mediasCategoria = {};
    categorias.forEach(categoria => {
      mediasCategoria[categoria] = categoriasCount[categoria] > 0 ?
        categoriasSoma[categoria] / categoriasCount[categoria] : 0;
    });

    const mediaGeral = avaliacoesCount > 0 ? somaGeralTotal / avaliacoesCount : 0;

    // Atualiza jogo com novas médias
    await jogosCollection.doc(jogoId).update({
      avaliacao: mediaGeral,
      avaliacoesPorCategoria: mediasCategoria,
      totalAvaliacoes: avaliacoesCount
    });
  } catch (error) {
    console.error("Erro ao atualizar média do jogo:", error);
  }
}

// Função para mostrar o resultado da avaliação
function mostrarResultado(mensagem, isError = false) {
  const resultadoDiv = document.getElementById('rating-result');
  resultadoDiv.textContent = mensagem;
  resultadoDiv.className = isError ? 'rating-result error' : 'rating-result';
  resultadoDiv.style.display = 'block';

  // Esconde o resultado depois de alguns segundos
  setTimeout(() => {
    resultadoDiv.style.display = 'none';
  }, 5000);
}

// Função para resetar o formulário
function resetarFormulario() {
  document.getElementById('game-select').value = '';
  document.getElementById('comment').value = '';

  // Reseta todos os sliders para o valor padrão 5
  categorias.forEach(categoria => {
    const slider = document.getElementById(`${categoria}-range`);
    const valorDisplay = document.getElementById(`${categoria}-value`);
    if (slider && valorDisplay) {
      slider.value = 5;
      valorDisplay.textContent = 5;
    }
  });
}

// Função para carregar o ranking dos jogos
async function carregarRanking(categoria = 'geral') {
  try {
    const rankingContent = document.getElementById('ranking-content');
    rankingContent.innerHTML = '<tr><td colspan="4" class="loading-message">Carregando ranking...</td></tr>';

    let snapshot;

    if (categoria === 'geral') {
      // Ordena por avaliação geral
      snapshot = await jogosCollection
        .where('avaliacao', '>', 0)
        .orderBy('avaliacao', 'desc')
        .limit(10)
        .get();
    } else {
      // Ordena pela categoria específica
      snapshot = await jogosCollection
        .where(`avaliacoesPorCategoria.${categoria}`, '>', 0)
        .orderBy(`avaliacoesPorCategoria.${categoria}`, 'desc')
        .limit(10)
        .get();
    }

    if (snapshot.empty) {
      rankingContent.innerHTML = '<tr><td colspan="4" class="empty-message">Nenhum jogo avaliado ainda.</td></tr>';
      return;
    }

    rankingContent.innerHTML = '';

    let posicao = 1;
    snapshot.forEach(doc => {
      const jogo = doc.data();      
      // Determina a nota baseada na categoria
      let nota;
      if (categoria === 'geral') nota = jogo.avaliacao;
      else nota = jogo.avaliacoesPorCategoria?.[categoria] || 0;

      const rankRow = document.createElement('tr');
      rankRow.className = 'ranking-row';

      const rankClass = posicao <= 3 ? `rank-${posicao}` : '';

      rankRow.innerHTML = `
        <td class="rank-column">
          <div class="rank-badge ${rankClass}">${posicao}</div>
        </td>
        <td class="game-column">${jogo.titulo}</td>
        <td class="creator-column">${jogo.autor}</td>
        <td class="rating-column">
          <div class="rating">
            <span class="rating-text">${nota.toFixed(1)}</span>
          </div>
        </td>
      `;

      rankingContent.appendChild(rankRow);
      posicao++;
    });
  } catch (error) {
    console.error("Erro ao carregar ranking:", error);
    const rankingContent = document.getElementById('ranking-content');
    rankingContent.innerHTML = '<tr><td colspan="4" class="empty-message">Erro ao carregar ranking.</td></tr>';
  }
}

// Função para atualizar o valor exibido quando o slider é movido
function atualizarValorSlider(categoria, valor) {
  const valorDisplay = document.getElementById(`${categoria}-value`);
  if (valorDisplay) valorDisplay.textContent = valor;
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  // Carrega jogos no select
  carregarJogosSelect();

  // Carrega ranking inicial
  carregarRanking();

  // Configura evento do botão de enviar avaliação
  const submitButton = document.getElementById('submit-rating');
  if (submitButton) submitButton.addEventListener('click', enviarAvaliacao);

  // Configura evento do filtro de ranking
  const rankingCategory = document.getElementById('ranking-category');
  if (rankingCategory) {
    rankingCategory.addEventListener('change', (e) => {
      carregarRanking(e.target.value);
    });
  }

  // Configura eventos para sliders de avaliação
  categorias.forEach(categoria => {
    const slider = document.getElementById(`${categoria}-range`);
    if (slider) {
      slider.addEventListener('input', () => {
        atualizarValorSlider(categoria, slider.value);
      });
    }
  });

  // Eventos de autenticação
  document.addEventListener('userAuthenticated', () => {
    // Atualiza os selects quando um usuário faz login
    carregarJogosSelect();
  });
});