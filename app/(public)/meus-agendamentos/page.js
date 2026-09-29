import Link from "next/link";
import styles from "./meus-agendamentos.module.css";
import ConsultaAgendamentos from "./ConsultaAgendamentos";

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
          <p>
            Consulte seus próximos horários usando os mesmos dados informados
            no agendamento.
          </p>
        </header>

        <section className={styles.painel} aria-labelledby="consulta-titulo">
          <div className={styles.painelCabecalho}>
            <h2 id="consulta-titulo">Consultar horários</h2>
            <p>Informe seu nome e telefone para localizar seus agendamentos.</p>
          </div>

          <ConsultaAgendamentos />

          <p className={styles.aviso}>
            Por segurança, a consulta mostra somente agendamentos futuros
            vinculados exatamente ao nome e telefone informados.
          </p>
        </section>

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
