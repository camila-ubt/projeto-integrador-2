import { createHash } from "node:crypto";
import { query } from "@/lib/db";

function gerarChave(escopo, identificador) {
  return createHash("sha256")
    .update(`${escopo}:${identificador}`)
    .digest("hex");
}

export async function consumirLimite({
  escopo,
  identificador,
  limite = 5,
  janelaMinutos = 10,
}) {
  const chave = gerarChave(escopo, identificador);

  const { rows } = await query(
    `INSERT INTO rate_limits (chave, tentativas, inicio_janela)
     VALUES ($1, 1, NOW())
     ON CONFLICT (chave)
     DO UPDATE SET
       tentativas = CASE
         WHEN rate_limits.inicio_janela <= NOW() - ($2::integer * INTERVAL '1 minute')
           THEN 1
         ELSE rate_limits.tentativas + 1
       END,
       inicio_janela = CASE
         WHEN rate_limits.inicio_janela <= NOW() - ($2::integer * INTERVAL '1 minute')
           THEN NOW()
         ELSE rate_limits.inicio_janela
       END
     RETURNING tentativas`,
    [chave, janelaMinutos]
  );

  const tentativas = Number(rows[0].tentativas);

  return {
    permitido: tentativas <= limite,
    tentativas,
  };
}

export async function limparLimite({ escopo, identificador }) {
  const chave = gerarChave(escopo, identificador);

  await query("DELETE FROM rate_limits WHERE chave = $1", [chave]);
}
