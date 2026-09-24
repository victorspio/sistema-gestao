import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfigDeposito = {
  apiKey: process.env.FIREBASE_DEPOSITO_API_KEY || "dummy",
  authDomain: process.env.FIREBASE_DEPOSITO_AUTH_DOMAIN || "dummy",
  projectId: process.env.FIREBASE_DEPOSITO_PROJECT_ID || "dummy",
  storageBucket: process.env.FIREBASE_DEPOSITO_STORAGE_BUCKET || "dummy",
  messagingSenderId: process.env.FIREBASE_DEPOSITO_MESSAGING_SENDER_ID || "dummy",
  appId: process.env.FIREBASE_DEPOSITO_APP_ID || "dummy",
};

const appDeposito = initializeApp(firebaseConfigDeposito, "deposito_dump");
const dbDeposito = getFirestore(appDeposito);

async function dump(db, name) {
  console.log(`=== DUMP ${name} ===`);
  
  const prodSnap = await getDocs(collection(db, "produtos"));
  console.log(`\nProdutos (${prodSnap.size}):`);
  prodSnap.forEach(d => {
    const p = d.data();
    console.log(`- ID: ${d.id} | Nome: ${p.nome} | Código: ${p.codigo} | Quantidade: ${p.quantidade} ${p.unidade} | Fator: ${p.fatorConversao}`);
  });

  const convSnap = await getDocs(collection(db, "produto_fornecedor_conversao"));
  console.log(`\nConversões (${convSnap.size}):`);
  convSnap.forEach(d => {
    const c = d.data();
    console.log(`- ID: ${d.id} | ProdID: ${c.produtoId} | FornCod: ${c.codigoFornecedor} | Fator: ${c.fatorConversao} | UnBase: ${c.unidadeBase}`);
  });
}

async function run() {
  try {
    await dump(dbDeposito, "DEPÓSITO");
  } catch (err) {
    console.error("Erro ao dar dump no Depósito:", err.message);
  }
  process.exit(0);
}

run();

