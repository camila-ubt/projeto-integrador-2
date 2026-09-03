import { Pool } from "pg";

let pool;

/**
 * Retorna sempre o mesmo Pool de conexões (evita esgotar conexões do Neon
 * a cada hot-reload em dev ou a cada invocação de função na Vercel).
 */
export function getPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error(
        "DATABASE_URL não configurada. Crie sistema/.env.local com a connection string do Neon."
      );
    }

    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      // Neon exige SSL; em localhost normalmente não precisa.
      ssl: process.env.DATABASE_URL.includes("localhost")
        ? false
        : { rejectUnauthorized: false },
    });
  }
  return pool;
}

/**
 * Executa uma query simples (sem transação).
 * @param {string} text - SQL com placeholders $1, $2...
 * @param {any[]} params
 */
export async function query(text, params = []) {
  const client = getPool();
  return client.query(text, params);
}

/**
 * Executa uma função dentro de uma transação (BEGIN/COMMIT/ROLLBACK).
 * Use quando precisar inserir/atualizar em mais de uma tabela de forma atômica
 * (ex: criar agendamento + seus serviços).
 *
 * @param {(client: import('pg').PoolClient) => Promise<any>} callback
 */
export async function withTransaction(callback) {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
