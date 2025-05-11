/* Efeitos de rolagem para a barra de estatísticas */
document.addEventListener('DOMContentLoaded', function() {
  const gamesStats = document.querySelector('.games-stats');
  
  if (!gamesStats) return;
  
  // Função para ajustar a aparência da barra de estatísticas durante a rolagem
  function handleScroll() {
    const scrollPosition = window.scrollY;
    
    // Adiciona uma classe quando a rolagem ultrapassa um determinado ponto
    if (scrollPosition > 100) {
      gamesStats.classList.add('games-stats-scrolled');
    } else {
      gamesStats.classList.remove('games-stats-scrolled');
    }
  }
  
  // Adiciona listener para evento de rolagem
  window.addEventListener('scroll', handleScroll);
});
