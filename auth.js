import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { query } from "@/lib/db";

// Proteção simples contra força bruta no login: bloqueia um e-mail depois de
// 5 tentativas de senha erradas seguidas, por 10 minutos.
// OBS: em ambiente serverless (várias instâncias), isso é uma primeira
// barreira, não uma garantia absoluta — cada instância guarda seu próprio contador.
const tentativasLoginPorEmail = new Map();
const LIMITE_TENTATIVAS_LOGIN = 5;
const JANELA_BLOQUEIO_MS = 10 * 60 * 1000; // 10 minutos

function loginBloqueado(email) {
  const registro = tentativasLoginPorEmail.get(email);
  if (!registro) return false;
  if (Date.now() - registro.desde > JANELA_BLOQUEIO_MS) {
    tentativasLoginPorEmail.delete(email);
    return false;
  }
  return registro.tentativas >= LIMITE_TENTATIVAS_LOGIN;
}

function registrarTentativaFalha(email) {
  const agora = Date.now();
  const registro = tentativasLoginPorEmail.get(email);
  if (!registro || agora - registro.desde > JANELA_BLOQUEIO_MS) {
    tentativasLoginPorEmail.set(email, { tentativas: 1, desde: agora });
  } else {
    registro.tentativas++;
  }
}

function limparTentativas(email) {
  tentativasLoginPorEmail.delete(email);
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "Credenciais",
      credentials: {
        email: { label: "E-mail", type: "email" },
        senha: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toString().trim().toLowerCase();
        const senha = credentials?.senha?.toString();
        if (!email || !senha) return null;

        if (loginBloqueado(email)) return null;

        const { rows } = await query(
          `SELECT id, nome, email, senha_hash, perfil, ativo
             FROM usuarios
            WHERE email = $1`,
          [email]
        );
        const usuario = rows[0];
        if (!usuario || !usuario.ativo) {
          registrarTentativaFalha(email);
          return null;
        }

        const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
        if (!senhaValida) {
          registrarTentativaFalha(email);
          return null;
        }

        limparTentativas(email);

        // Objeto retornado aqui vira 'user' no callback jwt abaixo.
        return {
          id: usuario.id,
          name: usuario.nome,
          email: usuario.email,
          perfil: usuario.perfil,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/admin/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.perfil = user.perfil;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.perfil = token.perfil;
      }
      return session;
    },
  },
  trustHost: true,
});
