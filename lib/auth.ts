import { pool } from "./db";
import { User } from "./types";

export async function getUserByToken(token: string): Promise<User | null> {
  const { rows } = await pool.query<User>(
    `SELECT * FROM users WHERE magic_token = $1`,
    [token]
  );
  return rows[0] ?? null;
}

export async function getUserByPhone(telefone: string): Promise<User | null> {
  const { rows } = await pool.query<User>(
    `SELECT * FROM users WHERE telefone = $1`,
    [telefone]
  );
  return rows[0] ?? null;
}

/**
 * Confere o header x-internal-secret usado pelo n8n pra chamar a API
 * em nome de um motorista (não existe login de motorista no n8n,
 * só o segredo compartilhado entre o workflow e a aplicação).
 */
export function isInternalCall(req: Request): boolean {
  const secret = req.headers.get("x-internal-secret");
  return !!secret && secret === process.env.INTERNAL_API_SECRET;
}
