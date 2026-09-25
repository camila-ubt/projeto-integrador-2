import Link from "next/link";
import styles from "./meus-agendamentos.module.css";
import { PreviaResultados } from "./ResultadosConsulta";

export const metadata = {
  title: "Meus agendamentos | Paola Galvão Studio",
  description: "Acompanhe seus horários no Paola Galvão Studio.",
};

export default function MeusAgendamentosPage() {
  return (
    <main className={styles.pagina}>
      <div className={styles.container}>
        <Link href="/" className={styles.voltar}>
          ← Voltar ao início
        </Link>

        <header className={styles.cabecalho}>
          <span className={styles.sobretitulo}>Paola Galvão Studio</span>
          <h1>Meus agendamentos</h1>
          <p>Em breve, você poderá consultar seus próximos horários por aqui.</p>
        </header>

        <section className={styles.painel} aria-labelledby="consulta-titulo">
          <div className={styles.painelCabecalho}>
            <h2 id="consulta-titulo">Consultar horários</h2>
            <p>
              A consulta ficará disponível quando a verificação de acesso
              estiver pronta.
            </p>
          </div>

          <form className={styles.formulario}>
            <div className={styles.campo}>
              <label htmlFor="nome-cliente">Nome usado no agendamento</label>
              <input
                id="nome-cliente"
                name="nome"
                type="text"
                autoComplete="name"
                placeholder="Seu nome"
                disabled
              />
            </div>

            <div className={styles.campo}>
              <label htmlFor="telefone-cliente">
                Telefone usado no agendamento
              </label>
              <input
                id="telefone-cliente"
                name="telefone"
                type="tel"
                autoComplete="tel"
                placeholder="(00) 00000-0000"
                disabled
              />
            </div>

            <button type="button" className={styles.botao} disabled>
              Consultar meus agendamentos
            </button>
          </form>

          <p className={styles.aviso} role="status">
            A consulta ainda não está disponível. Nome e telefone, sozinhos,
            não confirmam a identidade da cliente. Estamos preparando uma
            forma segura de mostrar seus horários.
          </p>
        </section>

    {process.env.NODE_ENV === "development" && <PreviaResultados />}

        <section className={styles.ajuda} aria-labelledby="ajuda-titulo">
                <h2 id="ajuda-titulo">Precisa confirmar um horário agora?</h2>
          <p>Entre em contato diretamente com o estúdio.</p>
          <Link href="/#contato" className={styles.linkContato}>
            Ver opções de contato
          </Link>
        </section>
      </div>
    </main>
  );
}