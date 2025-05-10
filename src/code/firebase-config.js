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

// Referências ao Firestore e Storage
const db = firebase.firestore();
const storage = firebase.storage();

// Referência à coleção de jogos
const jogosCollection = db.collection('jogos');