// Funções para manipulação de avaliações no Firestore

// Referência à coleção de avaliações
const avaliacoesCollection = db.collection('avaliacoes');

// Categorias de avaliação disponíveis
const categorias = ['gameplay', 'visual', 'som', 'originalidade'];

// Função para carregar jogos no select
async function carregarJogosSelect() {
  try {
    const gameSelect = document.getElementById('game-select');
    gameSelect.innerHTML = '<option value="">-- Escolha um jogo --</option>';

    const snapshot = await jogosCollection.get();

    if (snapshot.empty) {
      return;
    }

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
    // Verificar se o usuário já avaliou este jogo
    const avaliacaoExistente = await verificarAvaliacaoExistente(jogoId, currentUser.uid);

    if (avaliacaoExistente) {
      mostrarResultado("Você já avaliou este jogo! Atualizamos sua avaliação.", false);
      // A atualização da avaliação será feita abaixo
    }

    // Coletar avaliações por categoria
    const avaliacoes = {};
    let somaAvaliacoes = 0;
    let categoriasAvaliadas = 0;

    categorias.forEach(categoria => {
      const rating = document.querySelector(`input[name="${categoria}-rating"]:checked`)?.value;
      if (rating) {
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

    // Calcular média geral
    const mediaGeral = somaAvaliacoes / categoriasAvaliadas;

    // Obter comentário
    const comentario = document.getElementById('comment').value;

    // Obter referência ao jogo
    const jogoRef = jogosCollection.doc(jogoId);
    const jogoDoc = await jogoRef.get();

    if (!jogoDoc.exists) {
      mostrarResultado("Jogo não encontrado.", true);
      submitButton.disabled = false;
      submitButton.textContent = 'Enviar Avaliação';
      return;
    }

    const jogo = jogoDoc.data();

    // Criar documento de avaliação
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

    // Salvar ou atualizar avaliação
    if (avaliacaoExistente) {
      // Buscar ID da avaliação existente
      const avaliacaoSnapshot = await avaliacoesCollection
        .where('jogoId', '==', jogoId)
        .where('userId', '==', currentUser.uid)
        .get();

      const avaliacaoId = avaliacaoSnapshot.docs[0].id;
      await avaliacoesCollection.doc(avaliacaoId).update(avaliacaoData);
    } else {
      await avaliacoesCollection.add(avaliacaoData);
    }

    // Atualizar a avaliação média do jogo
    await atualizarMediaJogo(jogoId);

    // Resetar formulário
    resetarFormulario();

    // Mostrar resultado
    mostrarResultado("Avaliação enviada com sucesso!", false);

    // Atualizar ranking
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
    // Obter todas as avaliações do jogo
    const avaliacoesSnapshot = await avaliacoesCollection
      .where('jogoId', '==', jogoId)
      .get();

    if (avaliacoesSnapshot.empty) {
      return;
    }

    // Calcular média por categoria e média geral
    const categoriasSoma = {};
    const categoriasCount = {};
    let somaGeralTotal = 0;
    let avaliacoesCount = 0;

    // Inicializar contadores
    categorias.forEach(categoria => {
      categoriasSoma[categoria] = 0;
      categoriasCount[categoria] = 0;
    });

    // Somar todas as avaliações
    avaliacoesSnapshot.forEach(doc => {
      const avaliacao = doc.data();

      // Processar avaliações por categoria
      categorias.forEach(categoria => {
        if (avaliacao.avaliacoes && avaliacao.avaliacoes[categoria]) {
          categoriasSoma[categoria] += avaliacao.avaliacoes[categoria];
          categoriasCount[categoria]++;
        }
      });

      // Contar avaliações gerais
      if (avaliacao.mediaGeral) {
        somaGeralTotal += avaliacao.mediaGeral;
        avaliacoesCount++;
      }
    });

    // Calcular médias
    const mediasCategoria = {};
    categorias.forEach(categoria => {
      mediasCategoria[categoria] = categoriasCount[categoria] > 0 ?
        categoriasSoma[categoria] / categoriasCount[categoria] : 0;
    });

    const mediaGeral = avaliacoesCount > 0 ? somaGeralTotal / avaliacoesCount : 0;

    // Atualizar jogo com novas médias
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

  // Limpar todas as seleções de estrelas
  categorias.forEach(categoria => {
    const radios = document.querySelectorAll(`input[name="${categoria}-rating"]`);
    radios.forEach(radio => radio.checked = false);
  });
}

// Função para carregar o ranking dos jogos
async function carregarRanking(categoria = 'geral') {
  try {
    const rankingContent = document.getElementById('ranking-content');
    rankingContent.innerHTML = '<div class="loading-message">Carregando ranking...</div>';

    let snapshot;

    if (categoria === 'geral') {
      // Ordenar por avaliação geral
      snapshot = await jogosCollection
        .where('avaliacao', '>', 0)
        .orderBy('avaliacao', 'desc')
        .limit(10)
        .get();
    } else {
      // Ordenar pela categoria específica
      snapshot = await jogosCollection
        .where(`avaliacoesPorCategoria.${categoria}`, '>', 0)
        .orderBy(`avaliacoesPorCategoria.${categoria}`, 'desc')
        .limit(10)
        .get();
    }

    if (snapshot.empty) {
      rankingContent.innerHTML = '<div class="empty-message">Nenhum jogo avaliado ainda.</div>';
      return;
    }

    rankingContent.innerHTML = '';

    let posicao = 1;
    snapshot.forEach(doc => {
      const jogo = doc.data();

      // Determinar a nota baseada na categoria
      let nota;
      if (categoria === 'geral') {
        nota = jogo.avaliacao;
      } else {
        nota = jogo.avaliacoesPorCategoria?.[categoria] || 0;
      }

      const rankRow = document.createElement('div');
      rankRow.className = 'ranking-row';

      const rankClass = posicao <= 3 ? `rank-${posicao}` : '';

      rankRow.innerHTML = `
                <div class="rank-column">
                    <div class="rank-badge ${rankClass}">${posicao}</div>
                </div>
                <div class="game-column">${jogo.titulo}</div>
                <div class="creator-column">${jogo.autor}</div>
                <div class="rating-column">
                    <div class="rating">
                        ${gerarEstrelas(nota)}
                        <span class="rating-text">${nota.toFixed(1)}</span>
                    </div>
                </div>
            `;

      rankingContent.appendChild(rankRow);
      posicao++;
    });

  } catch (error) {
    console.error("Erro ao carregar ranking:", error);
    const rankingContent = document.getElementById('ranking-content');
    rankingContent.innerHTML = '<div class="empty-message">Erro ao carregar ranking.</div>';
  }
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  // Carregar jogos no select
  carregarJogosSelect();

  // Carregar ranking inicial
  carregarRanking();

  // Configurar evento do botão de enviar avaliação
  const submitButton = document.getElementById('submit-rating');
  if (submitButton) {
    submitButton.addEventListener('click', enviarAvaliacao);
  }

  // Configurar evento do filtro de ranking
  const rankingCategory = document.getElementById('ranking-category');
  if (rankingCategory) {
    rankingCategory.addEventListener('change', (e) => {
      carregarRanking(e.target.value);
    });
  }

  // Configurar eventos para seleção de estrelas
  categorias.forEach(categoria => {
    const estrelas = document.querySelectorAll(`.star-rating[data-category="${categoria}"] label`);
    estrelas.forEach((estrela, index) => {
      estrela.addEventListener('mouseover', () => {
        // Destacar estrelas ao passar o mouse
        for (let i = 0; i <= index; i++) {
          estrelas[i].style.filter = 'invert(71%) sepia(77%) saturate(2059%) hue-rotate(359deg) brightness(102%) contrast(105%)';
        }
      });

      estrela.addEventListener('mouseout', () => {
        // Remover destaque ao tirar o mouse
        estrelas.forEach(e => {
          e.style.filter = '';
        });

        // Manter destaque nas estrelas selecionadas
        const radioSelecionado = document.querySelector(`input[name="${categoria}-rating"]:checked`);
        if (radioSelecionado) {
          const valor = parseInt(radioSelecionado.value);
          for (let i = 0; i < valor; i++) {
            estrelas[i].style.filter = 'invert(71%) sepia(77%) saturate(2059%) hue-rotate(359deg) brightness(102%) contrast(105%)';
          }
        }
      });
    });
  });

  // Eventos de autenticação
  document.addEventListener('userAuthenticated', () => {
    // Atualiza os selects quando um usuário faz login
    carregarJogosSelect();
  });
});