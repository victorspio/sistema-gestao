import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, writeBatch, updateDoc } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import fs from "fs";

// Read .env
const envContent = fs.readFileSync(".env", "utf-8");
const env = {};
envContent.split("\n").forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || "";
    value = value.trim().replace(/^['"](.*)['"]$/, "$1");
    env[match[1]] = value;
  }
});

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig, "cleanup_app");
const db = getFirestore(app);
const auth = getAuth(app);

async function runCleanup() {
  console.log("🚀 Conectando ao Firebase do projeto:", firebaseConfig.projectId);

  // Autenticação
  try {
    await signInWithEmailAndPassword(auth, "temp_admin@app.com", "TempAdmin@2026");
    console.log("✅ Autenticado com sucesso!");
  } catch (err) {
    try {
      await createUserWithEmailAndPassword(auth, "temp_admin@app.com", "TempAdmin@2026");
      console.log("✅ Usuário temporário criado e autenticado!");
    } catch (e2) {
      console.error("❌ Falha de autenticação:", e2.message);
      process.exit(1);
    }
  }

  // Coleções financeiras e operacionais para zerar
  const colecoesParaZerar = [
    "contasReceber",
    "contasPagar",
    "fluxoCaixa",
    "compras",
    "vendas",
    "ordensServico",
    "orcamentos",
    "movimentacoesEstoque",
    "equipamentosInstalados"
  ];

  console.log("\n🧹 Limpando coleções financeiras e operacionais...");
  for (const colName of colecoesParaZerar) {
    const colRef = collection(db, colName);
    const snap = await getDocs(colRef);
    console.log(`Coleção '${colName}': ${snap.size} documentos encontrados.`);

    if (snap.size === 0) continue;

    const docs = [...snap.docs];
    while (docs.length > 0) {
      const batch = writeBatch(db);
      const chunk = docs.splice(0, 450);
      chunk.forEach(d => {
        batch.delete(doc(db, colName, d.id));
      });
      await batch.commit();
    }
    console.log(`  ✅ Todos os ${snap.size} documentos de '${colName}' foram removidos.`);
  }

  // Garantir que todos os produtos continuam no catálogo, mas com estoque zerado
  console.log("\n📦 Verificando catálogo de produtos...");
  const produtosSnap = await getDocs(collection(db, "produtos"));
  console.log(`Total de produtos no catálogo: ${produtosSnap.size}`);

  const batchProd = writeBatch(db);
  let atualizados = 0;
  produtosSnap.forEach(d => {
    const p = d.data();
    if (p.quantidade !== 0) {
      batchProd.update(doc(db, "produtos", d.id), {
        quantidade: 0
      });
      atualizados++;
    }
  });

  if (atualizados > 0) {
    await batchProd.commit();
    console.log(`  ✅ ${atualizados} produtos tiveram o estoque redefinido para 0.`);
  } else {
    console.log(`  ✅ Todos os produtos já estão com estoque zerado (0).`);
  }

  console.log("\n✨ Operação concluída com sucesso! Financeiro e Relatórios estão zerados.");
  process.exit(0);
}

runCleanup().catch(err => {
  console.error("Erro fatal durante a limpeza:", err);
  process.exit(1);
});
