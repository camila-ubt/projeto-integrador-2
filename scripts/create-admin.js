// Cria (ou atualiza a senha de) o usuário admin no banco, direto pela linha de comando. Não existe endpoint público de cadastro de propósito, já que o sistema é de uso interno (perfil único: admin).
//

import { Pool } from "pg";
import bcrypt from "bcryptjs";

async function main() {
  const [, , nome, email, senha] = process.argv;

  if (!nome || !email || !senha) {
    console.error("Uso: node scripts/create-admin.js \"Nome\" email@exemplo.com senha123");
    process.exit(1);
  }
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL não encontrada. Configure sistema/.env.local antes de rodar o script.");
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes("localhost") ? false : { rejectUnauthorized: false },
  });

  const senhaHash = await bcrypt.hash(senha, 10);

  const { rows } = await pool.query(
    `INSERT INTO usuarios (nome, email, senha_hash)
     VALUES ($1, $2, $3)
     ON CONFLICT (email) DO UPDATE SET senha_hash = EXCLUDED.senha_hash, nome = EXCLUDED.nome
     RETURNING id, nome, email`,
    [nome, email.toLowerCase(), senhaHash]
  );

  console.log("Usuário admin pronto para login:", rows[0]);
  await pool.end();
}

main().catch((error) => {
  console.error("Erro ao criar usuário admin:", error);
  process.exit(1);
});
