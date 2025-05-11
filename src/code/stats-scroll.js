/* Efeitos de rolagem para a barra de estatísticas e navegação responsiva */
document.addEventListener('DOMContentLoaded', function() {
  const gamesStats = document.querySelector('.games-stats');
  const scrollIndicator = document.querySelector('.scroll-indicator');
  
  if (!gamesStats) return;
  
  // Variável para controlar se o indicador de rolagem já foi mostrado
  let scrollIndicatorShown = false;
  
  // Função para ajustar a aparência da barra de estatísticas durante a rolagem
  function handleScroll() {
    const scrollPosition = window.scrollY;
    const pageHeight = document.body.scrollHeight;
    const windowHeight = window.innerHeight;
    const scrollPercentage = (scrollPosition / (pageHeight - windowHeight)) * 100;
    
    // Adiciona uma classe quando a rolagem ultrapassa um determinado ponto
    if (scrollPosition > 100) {
      gamesStats.classList.add('games-stats-scrolled');
    } else {
      gamesStats.classList.remove('games-stats-scrolled');
    }
    
    // Mostra o indicador de rolagem apenas se:
    // 1. Estivermos próximo do topo (para incentivar o usuário a rolar)
    // 2. O indicador ainda não foi mostrado nesta sessão
    // 3. A página tem conteúdo suficiente para rolar
    if (scrollIndicator && !scrollIndicatorShown && scrollPosition < 50 && pageHeight > windowHeight * 1.3) {
      scrollIndicator.classList.add('visible');
      
      // Remove o indicador após 5 segundos
      setTimeout(() => {
        scrollIndicator.classList.remove('visible');
        scrollIndicatorShown = true;
      }, 5000);
    }
    
    // Verifica a visibilidade da barra de estatísticas e adiciona classe de destaque 
    // quando jogos entram na viewport
    const gamesGrid = document.querySelector('.games-grid');
    if (gamesGrid) {
      const gridRect = gamesGrid.getBoundingClientRect();
      // Se a grid de jogos está visível e começou a aparecer na tela
      if (gridRect.top < window.innerHeight && gridRect.bottom > 0) {
        gamesStats.classList.add('games-stats-active');
      } else {
        gamesStats.classList.remove('games-stats-active');
      }
    }
  }
  
  // Adiciona listener para evento de rolagem
  window.addEventListener('scroll', handleScroll);
  
  // Ajusta ao carregar a página
  handleScroll();
  
  // Otimização para dispositivos móveis - reduz frequência de disparo de eventos
  let ticking = false;
  window.addEventListener('scroll', function() {
    if (!ticking) {
      window.requestAnimationFrame(function() {
        handleScroll();
        ticking = false;
      });
      ticking = true;
    }
  });
  
  // Configurar o botão de voltar ao topo
  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', function() {
      // Rolagem suave para o topo
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
    
    // Adicionar toque longo para feedback em dispositivos móveis
    backToTopBtn.addEventListener('touchstart', function() {
      backToTopBtn.style.transform = 'scale(0.95)';
    });
    
    backToTopBtn.addEventListener('touchend', function() {
      backToTopBtn.style.transform = 'scale(1)';
    });
  }
});
