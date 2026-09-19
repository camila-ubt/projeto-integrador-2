import Link from "next/link";
import Image from "next/image";
import styles from "./home.module.css";

export default function Home() {
  return (
    <main>
      {/* Hero */}
      <section className={styles.hero}>
        <p className={styles.heroMarca}>Paola Galvão Studio</p>

        <h1 className={styles.heroTitulo}>
          Beleza, cuidado e autoestima.
        </h1>

        <p className={styles.heroSubtitulo}>
          Atendimento personalizado em Ubatuba.
        </p>

        <Link href="/agendar" className="btn-primario">
          Agendar horário
        </Link>
      </section>

      {/* Sobre */}
      <section id="sobre" className={styles.sobre}>
        <div className={styles.sobreConteudo}>
          <div className={styles.sobreImagem}>
            <Image
              src="/images/salao.jpg"
              alt="Interior do Paola Galvão Studio"
              width={600}
              height={450}
              className={styles.imagemStudio}
            />
          </div>

          <div className={styles.sobreTexto}>
            <p className={styles.secaoLegenda}>Sobre o Studio</p>

            <h2>12 anos cuidando da beleza em Ubatuba</h2>

            <p>
              Há 12 anos em Ubatuba, o Paola Galvão Studio é um espaço
              dedicado à beleza, ao cuidado e ao bem-estar.
            </p>

            <p>
              À frente do Studio, Paola atua como cabeleireira há 12 anos,
              oferecendo atendimento personalizado e construindo ao longo
              dessa trajetória uma relação próxima com suas clientes.
            </p>
          </div>
        </div>
      </section>

      {/* Serviços */}
      <section className={styles.servicos}>
        <div className={styles.servicosConteudo}>
          <p className={styles.secaoLegenda}>Nossos serviços</p>

          <h2>Cuidados pensados para você</h2>

          <p className={styles.servicosTexto}>
            Conheça os procedimentos oferecidos pelo Paola Galvão Studio
            e encontre o cuidado ideal para você.
          </p>

          <Link href="/servicos" className="btn-primario">
            Conhecer serviços
          </Link>
        </div>
      </section>

      {/* Contato */}
      <section id="contato" className={styles.contato}>
        <div className={styles.contatoConteudo}>
          <p className={styles.secaoLegenda}>Contato</p>

          <h2>Onde estamos</h2>

          <p className={styles.endereco}>
            Rua Conceição, 180 - Loja 13
            <br />
            Ubatuba - SP
          </p>

          <div className={styles.contatoLinks}>
            <a
              href="https://wa.me/5512996190740"
              target="_blank"
              rel="noopener noreferrer"
            >
              WhatsApp
            </a>

            <a
              href="https://www.instagram.com/paola.gallvao/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Instagram
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}