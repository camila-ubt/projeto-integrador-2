import { auth } from "@/auth";
import { jsonError } from "@/lib/api-helpers";

/**
 * Usa dentro de rotas de API (POST/PUT/DELETE) para exigir usuário logado.
 * Retorna { session } se autenticado, ou { errorResponse } pronto para
 * `return` direto na rota.
 *
 * Exemplo:
 *   const { session, errorResponse } = await requireAuth();
 *   if (errorResponse) return errorResponse;
 */
export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    return { session: null, errorResponse: jsonError("Não autenticado.", 401) };
  }
  return { session, errorResponse: null };
}
