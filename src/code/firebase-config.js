// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCdBAIQtvoVBAn7vyCSrBnQsyz93w09GRY",
  authDomain: "eufacovcjoga.firebaseapp.com",
  projectId: "eufacovcjoga",
  storageBucket: "eufacovcjoga.firebasestorage.app",
  messagingSenderId: "275681503197",
  appId: "1:275681503197:web:e3d4dbe26803b45d0ff834",
  measurementId: "G-WPLF4G1GFB"
};

// Inicializa o Firebase
firebase.initializeApp(firebaseConfig);

// Configurações adicionais
const storageSettings = {
  // Configura o storage para permitir acesso cross-origin
  corsOptions: {
    origin: '*', // Permitir acesso de qualquer origem
    methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'], // Métodos permitidos
    allowedHeaders: ['Content-Type', 'Authorization', 'Content-Length', 'X-Requested-With']
  }
};

// Referências ao Firestore e Storage
const db = firebase.firestore();
const storage = firebase.storage();

// Referências às coleções
const jogosCollection = db.collection('jogos');
const avaliacoesCollection = db.collection('avaliacoes');
const comentariosCollection = db.collection('comentarios');
const usuariosCollection = db.collection('usuarios');
const atividadesCollection = db.collection('atividades');
const conquistasCollection = db.collection('conquistas');