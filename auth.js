import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { query } from "@/lib/db";

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

        const { rows } = await query(
          `SELECT id, nome, email, senha_hash, perfil, ativo
             FROM usuarios
            WHERE email = $1`,
          [email]
        );
        const usuario = rows[0];
        if (!usuario || !usuario.ativo) return null;

        const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
        if (!senhaValida) return null;

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
