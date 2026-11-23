import { readFile } from 'node:fs/promises';
import mysql from 'mysql2/promise';

/** Cria o pool de conexões do MySQL (pagamentos_db). */
export function criarPool({ url, ssl }) {
  return mysql.createPool({
    uri: url,
    waitForConnections: true,
    connectionLimit: 5,
    timezone: 'Z', // datas sempre em UTC
    ssl: ssl ? { rejectUnauthorized: true } : undefined,
  });
}

/**
 * Cria o banco (CREATE DATABASE IF NOT EXISTS) se ele ainda não existir, para rodar local sem passo manual.
 * Em bancos na nuvem o banco costuma já existir e o usuário pode não ter permissão de criar: nesse caso só avisa e segue.
 */
export async function garantirBanco({ url, ssl }) {
  const endereco = new URL(url);
  const nome = decodeURIComponent(endereco.pathname.slice(1));
  if (!/^\w+$/.test(nome)) return; // nome estranho: não mexe, deixa o erro normal aparecer na conexão
  endereco.pathname = '/';
  let conexao;
  try {
    conexao = await mysql.createConnection({ uri: endereco.toString(), ssl: ssl ? { rejectUnauthorized: true } : undefined });
    await conexao.query(`CREATE DATABASE IF NOT EXISTS \`${nome}\` CHARACTER SET utf8mb4`);
  } catch (erro) {
    console.warn(`Não consegui criar o banco "${nome}" automaticamente (${erro.code ?? erro.message}); seguindo com ele como está.`);
  } finally {
    await conexao?.end();
  }
}

/** Cria as tabelas se ainda não existirem (migração mínima, suficiente para uma tabela). */
export async function migrar(pool) {
  const sql = await readFile(new URL('../../../db/schema.sql', import.meta.url), 'utf8');
  for (const comando of sql.split(';').map((c) => c.trim()).filter(Boolean)) {
    await pool.query(comando);
  }
}
