// Funções para manipulação de jogos no Firestore

// Função auxiliar para gerar metadados do Storage com tipo de conteúdo adequado
function criarMetadados(file) {
  // Detecta o tipo de conteúdo com base na extensão do arquivo
  let contentType = 'image/jpeg'; // padrão
  const fileName = file.name.toLowerCase();
  
  if (fileName.endsWith('.png')) contentType = 'image/png';
  else if (fileName.endsWith('.gif')) contentType = 'image/gif';
  else if (fileName.endsWith('.webp')) contentType = 'image/webp';
  else if (fileName.endsWith('.svg')) contentType = 'image/svg+xml';
  
  // Gera um token único para cada upload
  return {
    contentType: contentType,
    customMetadata: {
      'firebaseStorageDownloadTokens': Math.random().toString(36).substring(2) + Date.now().toString(36)
    }
  };
};

// Função para carregar todos os jogos
async function carregarJogos() {
  try {
    const jogosGrid = document.querySelector('.games-grid');
    // Verifica se o elemento existe antes de prosseguir
    if (!jogosGrid) {
      console.log('Elemento .games-grid não encontrado na página. Pulando carregamento de jogos.');
      return;
    }

    jogosGrid.innerHTML = '<p class="loading-text">Carregando jogos...</p>';

    const snapshot = await jogosCollection.get();

    if (snapshot.empty) {
      jogosGrid.innerHTML = '<p class="empty-message">Nenhum jogo encontrado.</p>';
      return;
    }

    jogosGrid.innerHTML = '';

    snapshot.forEach(doc => {
      const jogo = doc.data();
      const jogoId = doc.id;

      const jogoElement = criarElementoJogo(jogo, jogoId);
      jogosGrid.appendChild(jogoElement);
    });

    // Reaplica os filtros se necessário
    const filtroAtivo = document.querySelector('.filter-btn.active');
    if (filtroAtivo && filtroAtivo.dataset.filter !== 'all') filtrarJogos(filtroAtivo.dataset.filter);

    // Atualiza contadores após carregar jogos
    atualizarContadores();
  } catch (error) {
    console.error("Erro ao carregar jogos:", error);
  }
}

// Função para criar elemento de jogo na interface
function criarElementoJogo(jogo, jogoId) {
  const divJogo = document.createElement('div');
  divJogo.className = 'game-card';
  divJogo.dataset.category = jogo.categoria;
  divJogo.dataset.id = jogoId;

  const thumbnailUrl = jogo.thumbnailUrl || 'assets/default-game.png';

  // Verifica se o usuário atual é o criador do jogo
  const currentUser = window.userAuth?.currentUser();
  const isOwner = currentUser && jogo.autorId === currentUser.uid;

  // Inclui os botões de editar/excluir apenas se for o dono do jogo
  const acoesBtns = isOwner ? `
    <div class="game-actions">
      <button class="pixel-button edit-btn" onclick="abrirFormularioEdicao('${jogoId}')"><i class="fas fa-edit"></i> Editar</button>
      <button class="pixel-button delete-btn" onclick="confirmarExclusao('${jogoId}')"><i class="fas fa-trash-alt"></i> Excluir</button>
    </div>
  ` : '';

  // Exibe avaliações por categoria se disponíveis
  let avaliacoesCategorias = '';
  if (jogo.avaliacoesPorCategoria) {
    avaliacoesCategorias = `
      <div class="category-ratings">
        ${jogo.avaliacoesPorCategoria.gameplay ?
          `<div class="category-score">Gameplay<span>${jogo.avaliacoesPorCategoria.gameplay.toFixed(1)}</span></div>` : ''}
        ${jogo.avaliacoesPorCategoria.visual ?
          `<div class="category-score">Visual<span>${jogo.avaliacoesPorCategoria.visual.toFixed(1)}</span></div>` : ''}
        ${jogo.avaliacoesPorCategoria.som ?
          `<div class="category-score">Som<span>${jogo.avaliacoesPorCategoria.som.toFixed(1)}</span></div>` : ''}
        ${jogo.avaliacoesPorCategoria.originalidade ?
          `<div class="category-score">Original<span>${jogo.avaliacoesPorCategoria.originalidade.toFixed(1)}</span></div>` : ''}
      </div>
    `;
  }
  // Adiciona badge da categoria
  const categoriaNome = jogo.categoria.charAt(0).toUpperCase() + jogo.categoria.slice(1);
  const badgeCategoria = `<div class="category-badge ${jogo.categoria}">${categoriaNome}</div>`;

  divJogo.innerHTML = `
    ${badgeCategoria}
    <a href="${jogo.linkJogo}" target="_blank" class="thumbnail-link">
      <div class="game-thumbnail" style="--bg-image: url('${thumbnailUrl}')"></div>
    </a>
    <div class="game-info">
      <h3>${jogo.titulo}</h3>
      <p><i class="fas fa-user"></i> Por: ${jogo.autor}</p>
      <div class="rating">
        <div class="rating-stars">${gerarEstrelas(jogo.avaliacao)}</div>
        <span class="rating-text">${jogo.avaliacao.toFixed(1)}</span>
      </div>
      ${avaliacoesCategorias}
      <div class="game-buttons">
        <a href="${jogo.linkJogo}" class="pixel-button play-btn" target="_blank"><i class="fas fa-gamepad"></i> Jogar</a>
        <a href="avaliacao.html?jogo=${jogoId}" class="pixel-button rate-btn"><i class="fas fa-star"></i> Avaliar</a>
      </div>
      ${acoesBtns}
    </div>
  `;

  return divJogo;
}

// Função para gerar as estrelas de avaliação
function gerarEstrelas(avaliacao) {
  let estrelas = '';
  const totalEstrelas = 5;
  
  for (let i = 1; i <= totalEstrelas; i++) {
    if (i <= Math.floor(avaliacao)) {
      // Estrela completa
      estrelas += `<span class="pixel-star filled" title="${i} de 5"></span>`;
    } else if (i - 0.5 <= avaliacao) {
      // Meia estrela (para avaliações como 3.5, 4.5)
      estrelas += `<span class="pixel-star half-filled" title="${i-0.5} de 5"></span>`;
    } else {
      // Estrela vazia
      estrelas += `<span class="pixel-star" title="${i} de 5"></span>`;
    }
  }
  
  return estrelas;
}

// Função para filtrar jogos por categoria
function filtrarJogos(categoria) {
  const jogos = document.querySelectorAll('.game-card');
  
  // Atualiza a classe ativa nos botões de filtro
  document.querySelectorAll('.filter-btn').forEach(btn => {
    if (btn.dataset.filter === categoria) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Filtra os jogos com animação
  jogos.forEach(jogo => {
    if (categoria === 'all' || jogo.dataset.category === categoria) {
      // Reset da animação
      jogo.style.animation = 'none';
      jogo.offsetHeight; // Forçar reflow
      jogo.style.animation = null;
      
      // Exibe com animação
      jogo.style.display = 'block';
      jogo.style.opacity = '0';
      jogo.style.transform = 'translateY(20px)';
      
      // Pequeno atraso para cada card, criando efeito cascata
      setTimeout(() => {
        jogo.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        jogo.style.opacity = '1';
        jogo.style.transform = 'translateY(0)';
      }, 50 * Array.from(jogos).indexOf(jogo) % 10); // Limita atraso para evitar atrasos longos
    } else {
      // Esconde com animação
      jogo.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
      jogo.style.opacity = '0';
      jogo.style.transform = 'translateY(10px)';
      
      setTimeout(() => {
        jogo.style.display = 'none';
      }, 200);
    }
  });
  
  // Mensagem quando não há jogos na categoria
  const jogosGrid = document.querySelector('.games-grid');
  const jogosVisiveis = Array.from(jogos).filter(jogo => 
    categoria === 'all' || jogo.dataset.category === categoria
  );
  
  // Remove mensagem anterior se existir
  const mensagemAnterior = document.querySelector('.empty-category-message');
  if (mensagemAnterior) mensagemAnterior.remove();
  
  // Adiciona mensagem se não houver jogos na categoria selecionada
  if (jogosVisiveis.length === 0) {
    const mensagem = document.createElement('p');
    mensagem.className = 'empty-category-message';
    mensagem.innerHTML = `<i class="fas fa-info-circle"></i> Nenhum jogo na categoria "${categoria}" encontrado. <br>Que tal ser o primeiro a submeter um?`;
    jogosGrid.appendChild(mensagem);
  }
}

// Melhoria de responsividade para o game-stats
function ajustarTextoContadorResponsivo() {
  const counterText = document.querySelector('.counter-text');
  if (!counterText) return;
  
  const filteredCount = document.querySelector('.filtered-count').textContent;
  const totalCount = document.querySelector('.total-count').textContent;
  
  // Verifica o tamanho da tela e ajusta o texto conforme necessário
  if (window.innerWidth <= 320) {
    // Telas muito pequenas - formato extremamente compacto
    if (filteredCount === totalCount) {
      counterText.innerHTML = `<span class="total-count">${totalCount}</span>j`;
    } else {
      counterText.innerHTML = `<span class="filtered-count">${filteredCount}</span>/<span class="total-count">${totalCount}</span>j`;
    }
  } else if (window.innerWidth <= 360) {
    // Telas pequenas - formato compacto
    if (filteredCount === totalCount) {
      counterText.innerHTML = `<span class="total-count">${totalCount}</span> jogos`;
    } else {
      counterText.innerHTML = `<span class="filtered-count">${filteredCount}</span>/<span class="total-count">${totalCount}</span> jogos`;
    }
  } else if (window.innerWidth <= 480) {
    // Telas médias - formato semicompacto
    if (filteredCount === totalCount) {
      counterText.innerHTML = `<span class="total-count">${totalCount}</span> jogos`;
    } else {
      counterText.innerHTML = `<span class="filtered-count">${filteredCount}</span> de <span class="total-count">${totalCount}</span>`;
    }
  } else {
    // Telas maiores - formato completo
    if (filteredCount === totalCount) {
      counterText.innerHTML = `<span class="total-count">${totalCount}</span> jogos disponíveis`;
    } else {
      counterText.innerHTML = `Exibindo <span class="filtered-count">${filteredCount}</span> de <span class="total-count">${totalCount}</span> jogos`;
    }
  }
  
  // Adiciona atributo aria-label para acessibilidade
  counterText.setAttribute('aria-label', `Exibindo ${filteredCount} de ${totalCount} jogos`);
}

// Versão melhorada da função de atualizar contadores
function atualizarContadores() {
  const totalJogos = document.querySelectorAll('.game-card').length;
  const jogosFiltrados = document.querySelectorAll('.game-card[style="display: block;"], .game-card:not([style*="display"])').length;
  
  document.querySelector('.total-count').textContent = totalJogos;
  document.querySelector('.filtered-count').textContent = jogosFiltrados;
  
  // Aplica responsividade ao texto do contador
  ajustarTextoContadorResponsivo();
}

// Adiciona evento de redimensionamento para ajustar o texto
window.addEventListener('resize', ajustarTextoContadorResponsivo);

// Função para ordenar jogos
function ordenarJogos(criterio) {
  const jogosGrid = document.querySelector('.games-grid');
  const jogos = Array.from(document.querySelectorAll('.game-card'));
  
  // Ordena os jogos com base no critério selecionado
  jogos.sort((a, b) => {
    switch(criterio) {
      case 'recentes':
        // Ordena pela data de criação, assumindo que o ID tenha timestamp ou ordem de criação
        return b.dataset.id.localeCompare(a.dataset.id);
      
      case 'populares':
        // Para uma ordenação real baseada em popularidade, você precisaria 
        // adicionar um atributo de contagem de visualizações ao carregar os jogos
        // Aqui simulamos um contador básico baseado no ID como exemplo
        return parseInt(b.dataset.id.slice(-5), 16) - parseInt(a.dataset.id.slice(-5), 16);
      
      case 'avaliacao':
        // Ordena pela avaliação (nota)
        const avaliacaoA = parseFloat(a.querySelector('.rating-text').textContent);
        const avaliacaoB = parseFloat(b.querySelector('.rating-text').textContent);
        return avaliacaoB - avaliacaoA;
      
      case 'titulo':
        // Ordena pelo título alfabeticamente
        return a.querySelector('h3').textContent.localeCompare(b.querySelector('h3').textContent);
      
      default:
        return 0;
    }
  });
  
  // Reordena os elementos no DOM
  jogos.forEach(jogo => jogosGrid.appendChild(jogo));
  
  // Aplicar animações sutis após a ordenação
  jogos.forEach((jogo, index) => {
    jogo.style.animation = 'none';
    jogo.offsetHeight; // Forçar reflow
    jogo.style.animation = `fadeIn 0.3s ease-out ${index * 0.05}s forwards`;
  });
}

// Função para adicionar novo jogo
async function adicionarJogo(evento) {
  evento.preventDefault();

  // Verifica se o usuário está logado
  const currentUser = window.userAuth?.currentUser();
  if (!currentUser) {
    alert('Você precisa estar logado para submeter um jogo.');
    fecharModal();
    return;
  }

  const formulario = document.getElementById('form-jogo');
  const btnSubmit = formulario.querySelector('button[type="submit"]');

  try {
    btnSubmit.disabled = true;
    btnSubmit.textContent = 'Salvando...'; 

    // Obtém valores do formulário
    const titulo = formulario.titulo.value;
    const autor = formulario.autor.value || currentUser.displayName;
    const categoria = formulario.categoria.value;
    const linkJogo = formulario.linkJogo.value;    // Upload da thumbnail se fornecida
    let thumbnailUrl = 'assets/default-game.png';
    const thumbnailInput = formulario.thumbnail;

    if (thumbnailInput.files.length > 0) {
      const file = thumbnailInput.files[0];
      
      // Verifica se o arquivo é uma imagem
      if (!file.type.startsWith('image/')) {
        throw new Error('O arquivo enviado não é uma imagem válida.');
      }
      
      const filename = `${Date.now()}_${file.name}`;
      const storageRef = storage.ref(`thumbnails/${filename}`);
      
      // Usa metadados específicos para o tipo de arquivo
      const metadata = criarMetadados(file);
      await storageRef.put(file, metadata);
      thumbnailUrl = await storageRef.getDownloadURL();
    }
    // Cria documento no Firestore com os dados do usuário
    await jogosCollection.add({
      titulo,
      autor,
      categoria,
      avaliacao: 0, // Valor inicial de avaliação (sem avaliações)
      numeroAvaliacoes: 0, // Contador de avaliações
      linkJogo,
      thumbnailUrl,
      autorId: currentUser.uid,
      autorEmail: currentUser.email,
      dataCriacao: firebase.firestore.FieldValue.serverTimestamp()
    });

    // Recarrega jogos e fecha modal
    await carregarJogos();
    fecharModal();

    alert('Jogo adicionado com sucesso!');  } catch (error) {
    console.error("Erro ao adicionar jogo:", error);
    
    // Mensagem de erro mais detalhada com base no tipo de erro
    if (error.code === 'storage/unauthorized') {
      alert("Erro: Você não tem permissão para fazer upload de arquivos.");
    } else if (error.code === 'storage/canceled') {
      alert("O upload foi cancelado.");
    } else if (error.code === 'storage/unknown') {
      alert("Erro desconhecido no upload. Verifique o console para mais detalhes.");
    } else if (error.message.includes('não é uma imagem')) {
      alert(error.message);
    } else {
      alert("Erro ao adicionar jogo. Por favor, tente novamente.");
    }
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.textContent = 'Salvar Jogo';
  }
}

// Função para abrir formulário de edição
async function abrirFormularioEdicao(jogoId) {
  try {
    const doc = await jogosCollection.doc(jogoId).get();

    if (!doc.exists) {
      alert('Jogo não encontrado.');
      return;
    }

    const jogo = doc.data();

    // Verifica se o usuário atual é o dono do jogo
    const currentUser = window.userAuth?.currentUser();
    if (jogo.autorId && jogo.autorId !== currentUser?.uid) {
      alert('Você não tem permissão para editar este jogo.');
      return;
    }

    // Preenche o formulário com os dados atuais
    const formulario = document.getElementById('form-jogo');
    formulario.reset();    formulario.titulo.value = jogo.titulo;
    formulario.autor.value = jogo.autor;
    formulario.categoria.value = jogo.categoria;
    formulario.linkJogo.value = jogo.linkJogo;

    // Adiciona um campo oculto para o ID do jogo
    let idInput = formulario.querySelector('input[name="jogoId"]');
    if (!idInput) {
      idInput = document.createElement('input');
      idInput.type = 'hidden';
      idInput.name = 'jogoId';
      formulario.appendChild(idInput);
    }
    idInput.value = jogoId;

    // Altera o modo e título do formulário
    document.querySelector('.form-title').textContent = 'Editar Jogo';
    formulario.querySelector('button[type="submit"]').textContent = 'Atualizar Jogo';

    // Exibe o modal
    abrirModal();
  } catch (error) {
    console.error("Erro ao carregar jogo para edição:", error);
    alert("Erro ao carregar jogo para edição. Por favor, tente novamente.");
  }
}

// Função para atualizar jogo existente
async function atualizarJogo(evento, jogoId) {
  evento.preventDefault();

  // Verifica se o usuário está logado
  const currentUser = window.userAuth?.currentUser();
  if (!currentUser) {
    alert('Você precisa estar logado para editar um jogo.');
    fecharModal();
    return;
  }

  // Verifica se o usuário é o dono do jogo
  const doc = await jogosCollection.doc(jogoId).get();
  if (doc.exists && doc.data().autorId !== currentUser.uid) {
    alert('Você não tem permissão para editar este jogo.');
    fecharModal();
    return;
  }

  const formulario = document.getElementById('form-jogo');
  const btnSubmit = formulario.querySelector('button[type="submit"]');

  try {
    btnSubmit.disabled = true;
    btnSubmit.textContent = 'Atualizando...';    
    
    // Obtém valores do formulário
    const titulo = formulario.titulo.value;
    const autor = formulario.autor.value;
    const categoria = formulario.categoria.value;
    const linkJogo = formulario.linkJogo.value;

    // Dados a atualizar
    const dadosAtualizados = {
      titulo,
      autor,
      categoria,
      linkJogo,
      dataAtualizacao: firebase.firestore.FieldValue.serverTimestamp()
    };    // Upload da thumbnail se fornecida
    const thumbnailInput = formulario.thumbnail;
    if (thumbnailInput.files.length > 0) {
      const file = thumbnailInput.files[0];
      
      // Verifica se o arquivo é uma imagem
      if (!file.type.startsWith('image/')) {
        throw new Error('O arquivo enviado não é uma imagem válida.');
      }
      
      const filename = `${Date.now()}_${file.name}`;
      const storageRef = storage.ref(`thumbnails/${filename}`);
      
      // Usa metadados específicos para o tipo de arquivo
      const metadata = criarMetadados(file);
      await storageRef.put(file, metadata);
      dadosAtualizados.thumbnailUrl = await storageRef.getDownloadURL();
    }

    // Atualiza documento no Firestore
    await jogosCollection.doc(jogoId).update(dadosAtualizados);

    // Recarrega jogos e fecha modal
    await carregarJogos();
    fecharModal();

    alert('Jogo atualizado com sucesso!');
  } catch (error) {
    console.error("Erro ao atualizar jogo:", error);
    alert("Erro ao atualizar jogo. Por favor, tente novamente.");
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.textContent = 'Atualizar Jogo';
  }
}

// Função para confirmar exclusão de jogo
async function confirmarExclusao(jogoId) {
  // Verifica se o usuário está logado
  const currentUser = window.userAuth?.currentUser();
  if (!currentUser) {
    alert('Você precisa estar logado para excluir um jogo.');
    return;
  }

  // Verifica se o usuário é o dono do jogo
  const doc = await jogosCollection.doc(jogoId).get();
  if (doc.exists && doc.data().autorId !== currentUser.uid) {
    alert('Você não tem permissão para excluir este jogo.');
    return;
  }

  if (confirm('Tem certeza que deseja excluir este jogo? Esta ação não pode ser desfeita.')) {
    excluirJogo(jogoId);
  }
}

// Função para excluir jogo
async function excluirJogo(jogoId) {
  try {
    // Obtém a referência do jogo para pegar a URL da thumbnail
    const doc = await jogosCollection.doc(jogoId).get();

    if (doc.exists) {
      const jogo = doc.data();

      // Exclui a thumbnail do Storage se não for a imagem padrão
      if (jogo.thumbnailUrl && !jogo.thumbnailUrl.includes('default-game.png')) {
        const thumbRef = storage.refFromURL(jogo.thumbnailUrl);
        await thumbRef.delete();
      }

      // Exclui o documento do Firestore
      await jogosCollection.doc(jogoId).delete();

      // Recarrega os jogos
      await carregarJogos();

      alert('Jogo excluído com sucesso!');
    }
  } catch (error) {
    console.error("Erro ao excluir jogo:", error);
    alert("Erro ao excluir jogo. Por favor, tente novamente.");
  }
}

// Função para abrir o modal de jogo
function abrirModal() {
  // Verifica se o usuário está logado antes de abrir o modal
  const currentUser = window.userAuth?.currentUser();
  if (!currentUser) {
    alert('Você precisa estar logado para submeter ou editar um jogo.');
    // Redireciona para a página de usuário para login
    window.location.href = 'usuario.html';
    return;
  }

  const modal = document.getElementById('modal-jogo');
  if (!modal) {
    console.error('Elemento modal-jogo não encontrado!');
    return;
  }
  
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';

  // Pré-preenche o nome do autor com o nome do usuário logado
  const autorInput = document.getElementById('autor');
  if (autorInput && currentUser.displayName) {
    autorInput.value = currentUser.displayName;
  }
}

// Função para fechar o modal de jogo
function fecharModal() {
  const modal = document.getElementById('modal-jogo');
  modal.style.display = 'none';
  document.body.style.overflow = 'auto';

  // Reseta formulário
  document.getElementById('form-jogo').reset();
  document.querySelector('.form-title').textContent = 'Adicionar Novo Jogo';
  document.querySelector('button[type="submit"]').textContent = 'Salvar Jogo';

  // Remove campo de ID se existir
  const idInput = document.querySelector('input[name="jogoId"]');
  if (idInput) idInput.remove();
}

// Função para verificar se é adição ou edição
function salvarJogo(evento) {
  evento.preventDefault();

  const formulario = document.getElementById('form-jogo');
  const jogoId = formulario.querySelector('input[name="jogoId"]')?.value;

  (jogoId) ? atualizarJogo(evento, jogoId) : adicionarJogo(evento);
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {  // Verifica se está na página de jogos antes de inicializar funcionalidades específicas
  const isJogosPage = window.location.pathname.includes('jogos.html');
  
  // Carrega jogos apenas se estiver na página de jogos
  if (isJogosPage) {
    carregarJogos();
    
    // Inicializa o texto responsivo dos contadores
    ajustarTextoContadorResponsivo();
    
    // Configura listeners para filtros
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        filtrarJogos(e.target.dataset.filter);
      });
    });
    
    // Configura listener para botão de adicionar jogo
    const addButton = document.querySelector('.add-game-btn');
    if (addButton) {
      console.log('Botão de adicionar jogo encontrado:', addButton);
      addButton.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Clique no botão de adicionar jogo detectado');
        abrirModal();
      });
    } else console.error('Botão de adicionar jogo não encontrado na página de jogos!');
  }

  // Configura listeners apenas se estiver na página de jogos
  if (isJogosPage) {
    // Configura listener para formulário
    const formulario = document.getElementById('form-jogo');
    if (formulario) formulario.addEventListener('submit', salvarJogo);

    // Configura listeners para fechar modal
    const closeButtons = document.querySelectorAll('.close-modal, .cancel-btn');
    closeButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        fecharModal();
      });
    });
  }

  // Escuta eventos de autenticação (isso pode ser útil em qualquer página)
  document.addEventListener('userAuthenticated', () => {
    // Atualiza a interface quando um usuário faz login
    if (isJogosPage) carregarJogos();

    // Mostra o botão de adicionar jogo
    const addBtn = document.querySelector('.add-game-btn');
    if (addBtn) {
      addBtn.style.display = 'inline-block';
      console.log('Usuário autenticado, botão visível');
    }
  });

  document.addEventListener('userLoggedOut', () => {
    // Atualiza a interface quando um usuário faz logout
    carregarJogos();

    // Esconde o botão de adicionar jogo se necessário
    const addBtn = document.querySelector('.add-game-btn');
    if (addBtn) {
      addBtn.style.display = 'none';
      console.log('Usuário deslogado, botão oculto');
    }
  });

  // Verifica se o usuário está logado ao carregar a página
  const currentUser = window.userAuth?.currentUser();
  const addBtn = document.querySelector('.add-game-btn');
  
  if (addBtn) {
    // Força exibição do botão se estiver logado
    if (currentUser) {
      addBtn.style.display = 'inline-block';
      console.log('Usuário logado, botão visível na inicialização');
    } else {
      addBtn.style.display = 'none';
      console.log('Usuário não logado, botão oculto na inicialização');
    }
  }

  // Configurar select de ordenação
  const sortSelect = document.getElementById('sort-games');
  if (sortSelect) {
    sortSelect.addEventListener('change', function() {
      ordenarJogos(this.value);
    });
  }
  
  // Setup de filtros com atualização de contadores
  const botoesFiltragem = document.querySelectorAll('.filter-btn');
  botoesFiltragem.forEach(botao => {
    botao.addEventListener('click', function() {
      const filtro = this.dataset.filter;
      
      // Remove classe ativa de todos os botões
      botoesFiltragem.forEach(b => b.classList.remove('active'));
      
      // Adiciona classe ativa ao botão clicado
      this.classList.add('active');
      
      // Filtra os jogos
      filtrarJogos(filtro);
      
      // Atualiza contadores após a filtragem
      setTimeout(atualizarContadores, 300); // Dá tempo para as animações terminarem
    });
  });
});