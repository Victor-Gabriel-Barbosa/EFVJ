// Funções para manipulação de jogos no Firestore

// Configuração dos metadados para resolver problema de CORS
const metadataStorage = {
  contentType: 'image/jpeg',
  customMetadata: {
    'firebaseStorageDownloadTokens': Math.random().toString(36).substring(2)
  }
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
    if (filtroAtivo && filtroAtivo.dataset.filter !== 'all') {
      filtrarJogos(filtroAtivo.dataset.filter);
    }

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
      <button class="pixel-button edit-btn" onclick="abrirFormularioEdicao('${jogoId}')">Editar</button>
      <button class="pixel-button delete-btn" onclick="confirmarExclusao('${jogoId}')">Excluir</button>
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

  divJogo.innerHTML = `
    <div class="game-thumbnail" style="--bg-image: url('${thumbnailUrl}')"></div>
    <div class="game-info">
      <h3>${jogo.titulo}</h3>
      <p>Por: ${jogo.autor}</p>
      <div class="rating">
        ${gerarEstrelas(jogo.avaliacao)}
        <span class="rating-text">${jogo.avaliacao.toFixed(1)}</span>
      </div>
      ${avaliacoesCategorias}
      <a href="${jogo.linkJogo}" class="pixel-button play-btn" target="_blank">Jogar</a>
      <a href="avaliacao.html?jogo=${jogoId}" class="pixel-button rate-btn">Avaliar</a>
      ${acoesBtns}
    </div>
  `;

  return divJogo;
}

// Função para gerar as estrelas de avaliação
function gerarEstrelas(avaliacao) {
  let estrelas = '';
  for (let i = 1; i <= 5; i++) estrelas += `<span class="pixel-star ${i <= avaliacao ? 'filled' : ''}"></span>`;
  return estrelas;
}

// Função para filtrar jogos por categoria
function filtrarJogos(categoria) {
  const jogos = document.querySelectorAll('.game-card');

  jogos.forEach(jogo => {
    if (categoria === 'all' || jogo.dataset.category === categoria) jogo.style.display = 'block';
    else jogo.style.display = 'none';
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
  if (!formulario) {
    console.error("Formulário de jogo não encontrado.");
    alert("Erro ao acessar o formulário. Por favor, recarregue a página e tente novamente.");
    return;
  }

  const btnSubmit = formulario.querySelector('button[type="submit"]');
  if (!btnSubmit) {
    console.error("Botão de submit não encontrado no formulário.");
    return;
  }
  try {
    btnSubmit.disabled = true;
    btnSubmit.textContent = 'Salvando...';
    
    // Obtém valores do formulário com verificações de segurança
    if (!formulario.titulo || !formulario.categoria || !formulario.linkJogo) {
      throw new Error("Campos obrigatórios do formulário não encontrados");
    }
    
    const titulo = formulario.titulo.value;
    const autor = formulario.autor && formulario.autor.value ? formulario.autor.value : currentUser.displayName;
    const categoria = formulario.categoria.value;
    const linkJogo = formulario.linkJogo.value;// Upload da thumbnail se fornecida
    let thumbnailUrl = 'assets/default-game.png';
    const thumbnailInput = formulario.thumbnail;

    try {
      if (thumbnailInput && thumbnailInput.files && thumbnailInput.files.length > 0) {
        const file = thumbnailInput.files[0];
        const filename = `${Date.now()}_${file.name}`;
        
        // Verifica se o storage está disponível
        if (!storage) {
          console.error("Firebase Storage não está inicializado");
          throw new Error("Erro ao acessar o Firebase Storage");
        }
        
        const storageRef = storage.ref(`thumbnails/${filename}`);
        
        // Usar os metadados customizados para resolver problema de CORS
        await storageRef.put(file, metadataStorage);
        thumbnailUrl = await storageRef.getDownloadURL();
      }
    } catch (uploadError) {
      console.error("Erro ao fazer upload da imagem:", uploadError);
      throw new Error("Falha ao fazer upload da imagem. Por favor, tente novamente.");
    }// Criar documento no Firestore com os dados do usuário
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

    // Recarregar jogos e fechar modal
    await carregarJogos();
    fecharModal();

    alert('Jogo adicionado com sucesso!');

  } catch (error) {
    console.error("Erro ao adicionar jogo:", error);
    alert("Erro ao adicionar jogo. Por favor, tente novamente.");
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
    btnSubmit.textContent = 'Atualizando...';    // Obtém valores do formulário
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
    };

    // Upload da thumbnail se fornecida
    const thumbnailInput = formulario.thumbnail;
    if (thumbnailInput.files.length > 0) {
      const file = thumbnailInput.files[0];
      const filename = `${Date.now()}_${file.name}`;
      const storageRef = storage.ref(`thumbnails/${filename}`);
      
      // Usar os metadados customizados para resolver problema de CORS
      await storageRef.put(file, metadataStorage);
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

  // Resetar formulário
  document.getElementById('form-jogo').reset();
  document.querySelector('.form-title').textContent = 'Adicionar Novo Jogo';
  document.querySelector('button[type="submit"]').textContent = 'Salvar Jogo';

  // Remover campo de ID se existir
  const idInput = document.querySelector('input[name="jogoId"]');
  if (idInput) idInput.remove();
}

// Função para verificar se é adição ou edição
function salvarJogo(evento) {
  evento.preventDefault();

  try {
    const formulario = document.getElementById('form-jogo');
    if (!formulario) {
      console.error("Formulário não encontrado");
      alert("Erro ao encontrar o formulário. Por favor, recarregue a página.");
      return;
    }
    
    const jogoId = formulario.querySelector('input[name="jogoId"]')?.value;

    (jogoId) ? atualizarJogo(evento, jogoId) : adicionarJogo(evento);
  } catch (err) {
    console.error("Erro ao processar formulário:", err);
    alert("Erro ao processar o formulário: " + err.message);
  }
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  // Verifica se estamos na página de jogos antes de inicializar funcionalidades específicas
  const isJogosPage = window.location.pathname.includes('jogos.html');
  
  // Carrega jogos apenas se estiver na página de jogos
  if (isJogosPage) {
    carregarJogos();
    
    // Configurar listeners para filtros
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        filtrarJogos(e.target.dataset.filter);
      });
    });
    
    // Configurar listener para botão de adicionar jogo
    const addButton = document.querySelector('.add-game-btn');
    if (addButton) {
      console.log('Botão de adicionar jogo encontrado:', addButton);
      addButton.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Clique no botão de adicionar jogo detectado');
        abrirModal();
      });
    } else {
      console.error('Botão de adicionar jogo não encontrado na página de jogos!');
    }
  }

  // Configurar listeners apenas se estiver na página de jogos
  if (isJogosPage) {
    // Configurar listener para formulário
    const formulario = document.getElementById('form-jogo');
    if (formulario) formulario.addEventListener('submit', salvarJogo);

    // Configurar listeners para fechar modal
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
    if (isJogosPage) {
      carregarJogos();
    }

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
    // Forçar exibição do botão se estiver logado
    if (currentUser) {
      addBtn.style.display = 'inline-block';
      console.log('Usuário logado, botão visível na inicialização');
    } else {
      addBtn.style.display = 'none';
      console.log('Usuário não logado, botão oculto na inicialização');
    }
  }
});