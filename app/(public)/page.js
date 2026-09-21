import Link from "next/link";
import Image from "next/image";
import styles from "./home.module.css";

export default function Home() {
  return (
    <main>
      {/* Hero */}
      <section className={styles.hero}>
  <p className={styles.heroTitulo}>
    Beleza, cuidado e autoestima.
  </p>

  <h1 className={styles.heroMarca}>
    Paola Galvão Studio
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
              <svg
  className={styles.iconeContato}
  viewBox="0 0 24 24"
  aria-hidden="true"
>
  <path
    fill="currentColor"
    d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.198-.347.223-.644.074-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.009-.371-.011-.57-.011-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479s1.065 2.875 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.262.489 1.693.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.981.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.029 6.988 2.895a9.825 9.825 0 0 1 2.893 6.99c-.003 5.45-4.437 9.884-9.885 9.884"
  />
</svg>
<span>Falar no WhatsApp</span>
            </a>

            <a
              href="https://www.instagram.com/paola.gallvao/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg
  className={styles.iconeContato}
  viewBox="0 0 24 24"
  aria-hidden="true"
>
  <path
    fill="currentColor"
    d="M7 2C4.24 2 2 4.24 2 7v10c0 2.76 2.24 5 5 5h10c2.76 0 5-2.24 5-5V7c0-2.76-2.24-5-5-5H7zm10 2c1.66 0 3 1.34 3 3v10c0 1.66-1.34 3-3 3H7c-1.66 0-3-1.34-3-3V7c0-1.66 1.34-3 3-3h10zm-5 3a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm5.25-3.5a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5z"
  />
</svg>
<span>Instagram</span>
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}