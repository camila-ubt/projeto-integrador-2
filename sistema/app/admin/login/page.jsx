"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const router = useRouter();

  // useState - controla o estado dos componentes
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState("");

  //   Lógica do componente
  async function aoEnviar(e) {
    e.preventDefault();
    setErro("");

    if (!email || !senha) {
      setErro("Preencha email e senha.");
      return;
    }

    setCarregando(true);

    const resultado = await signIn("credentials", {
      email,
      senha,
      redirect: false,
    });

    setCarregando(false);

    // Tratamento de erro
    if (resultado?.error) {
      setErro("Usuário ou senha incorretos.");
    } else {
      router.push("/admin/dashboard");
    }
  }
  
  // Renderização do componente
  return (
    <div
      className="d-flex align-items-center justify-content-center vg=100"
      style={{ backgroundColor: "var(--fundo)" }}
    >
      <div className="col-11 col-sm-8 col-md-5 col-lg-4 col-xl-3">
        {/*card  */}
        <div
          className="card border-0 rouded-4 shadow-sm p-4 p-md-5"
          style={{ backgroundColor: "var(--superficie)" }}
        >
          {/* Cabeçalho do card */}
          <div className="text-center mb-4">
            <p
              className="fst-italic fw-semibold fs-5 mb-1"
              style={{
                color: "var(--texto-principal)",
                fontFamily: "var(--fonte-titulo)",
              }}
            >
              Paola Galvão Studio
            </p>
            <p
              className="text-uppercase mb-0"
              style={{
                color: "var(--texto-secundario)",
                fontFamily: "var(--fonte-corpo)",
                letterSpacing: "0.1em",
                fontSize: "11px",
              }}
            >
              Área Administrativa
            </p>
          </div>

          {/* Formulário */}

          <form onSubmit={aoEnviar} noValidate>
            {/* Campo Email */}
            <div className="mb-3">
              <label
                htmlFor="email"
                className="form-label small fw-medium"
                style={{
                  color: "var(--texto-secundario)",
                  fontFamily: "var(--fonte-corpo)",
                  letterSpacing: "0.04em",
                }}
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                className="form-control"
                placeholder="seu@email.com"
                value={email}
                onChange={(evento) => setEmail(evento.target.value)}
                autoComplete="email"
                style={{
                  backgroundColor: "var(--fundo)",
                  border: "1px solid var(--borda-escura)",
                  borderRadius: "var(--radius-medium)",
                  color: "var(--texto-principal)",
                  fontFamily: "(--fonte-corpo)",
                  padding: "10px 14px",
                }}
              />
            </div>

            {/* Campo Senha */}
            <div className="mb-4">
              <label
                htmlFor="senha"
                className="form-label small fw-medium"
                style={{
                  color: "var(--texto-secundario)",
                  fontFamily: "var(--fonte-corpo)",
                  letterSpacing: "0.04em",
                }}
              >
                Senha
              </label>
              <input
                type="password"
                id="senha"
                className="form-control"
                placeholder="*********"
                value={senha}
                onChange={(evento) => setSenha(evento.target.value)}
                autoComplete="current-password"
                style={{
                  backgroundColor: "var(--fundo)",
                  border: "1px solid var(--borda-escura)",
                  borderRadius: "var(--radius-medium)",
                  color: "var(--texto-principal)",
                  fontFamily: "var(--fonte-corpo)",
                  padding: "10px 14px",
                }}
              />
            </div>

            {/* Mensagem de erro - renderização condicional */}
            {erro && (
              <div
                className="rouded-3 py-2 px-3 mb-3 small"
                role="alert"
                style={{
                  backgroundColor: "var(--erro-fundo)",
                  color: "var(--erro-texto)",
                  border: "1px solid var(--erro-borda)",
                  fontFamily: "var(--fonte-corpo)",
                }}
              >
                {erro}
              </div>
            )}

            {/* Botão enviar*/}
            <button
              type="submit"
              className="btn w-100 fw-medium text-uppercase"
              disabled={carregando}
              style={{
                backgroundColor: carregando
                  ? "var(--primaria-escura)"
                  : "var(--primaria)",
                color: "var(--superficie)",
                border: "none",
                borderRadius: "var(--radius-medium)",
                padding: "11px",
                fontFamily: "var(--fonte-corpo)",
                letterSpacing: "0.08em",
                fontSize: "13px",
                transition: "background-color 0.2s ease",
                cursor: carregando ? "not-allowed" : "pointer",
              }}
            >
              {carregando ? "Entrando..." : "Entrar"}
            </button>
          </form>

          {/* Rodapé */}
          <p
            className="text-center mt-4 mb-o"
            style={{
              fontSize: "11px",
              color: "var(--borda-escura)",
              fontFamily: "var(--fonte-corpo)",
            }}
          >
            Acesso restrito à equipe do studio
          </p>
        </div>
      </div>
    </div>
  );
}
