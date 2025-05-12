// Utilitário para corrigir problemas de CORS em imagens do Firebase Storage

// Função para verificar se uma URL de imagem tem problemas de CORS
async function verificarCorrigirUrl(url) {
  // Se for uma URL relativa ou uma URL de imagem padrão, não precisa verificar
  if (!url || url.startsWith('/') || url.includes('default') || url.includes('assets/')) {
    return url;
  }

  try {
    // Tenta um fetch HEAD para verificar acesso CORS
    const response = await fetch(url, { method: 'HEAD' });
    if (response.ok) {
      return url; // A URL está acessível e sem problemas de CORS
    }
  } catch (error) {
    console.log(`Erro de CORS detectado para URL: ${url}. Tentando corrigir...`);
  }

  try {
    // Se a URL não funcionou, tenta reconstruir uma URL com token
    if (url.includes('firebasestorage.googleapis.com')) {
      // Extrai o caminho e token da URL existente
      const matches = url.match(/\/o\/([^?]+)\?([^#]+)/);
      if (matches && matches[1]) {
        const path = decodeURIComponent(matches[1]);
        const bucket = firebase.app().options.storageBucket;
        
        // Gera um novo token
        const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
        
        // Constrói uma nova URL
        return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(path)}?alt=media&token=${token}`;
      }
    }
  } catch (error) {
    console.error('Erro ao reconstruir URL:', error);
  }
  
  // Se todas as tentativas falharem, retorna a URL original
  return url;
}

// Função para corrigir URLs em coleções específicas do Firebase
async function corrigirUrlsFirebase() {
  if (typeof jogosCollection === 'undefined') {
    console.error('Coleções do Firebase não disponíveis para correção de URLs.');
    return;
  }
  
  try {
    // Corrige URLs nas miniaturas dos jogos
    const jogosSnapshot = await jogosCollection.get();
    
    if (!jogosSnapshot.empty) {
      const batch = db.batch();
      let corrigidos = 0;
      
      for (const doc of jogosSnapshot.docs) {
        const jogo = doc.data();
        
        if (jogo.thumbnailUrl) {
          const urlCorrigida = await verificarCorrigirUrl(jogo.thumbnailUrl);
          
          if (urlCorrigida !== jogo.thumbnailUrl) {
            const ref = jogosCollection.doc(doc.id);
            batch.update(ref, { thumbnailUrl: urlCorrigida });
            corrigidos++;
          }
        }
      }
      
      if (corrigidos > 0) {
        await batch.commit();
        console.log(`Corrigidas ${corrigidos} URLs de miniaturas.`);
      } else {
        console.log('Nenhuma URL precisou ser corrigida.');
      }
    }
  } catch (error) {
    console.error('Erro ao corrigir URLs no Firebase:', error);
  }
}

// Exporta as funções
window.imageUrlFixer = {
  verificarCorrigirUrl,
  corrigirUrlsFirebase
};
