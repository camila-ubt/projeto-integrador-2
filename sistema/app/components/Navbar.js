// 'use client' necessário pois usa useState e eventos do navegador
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./Navbar.module.css";

/**
 * Navbar principal da área pública.
 * Desktop: links horizontais à direita.
 * Mobile: botão hambúrguer abre drawer lateral direito com overlay.
 */
export default function Navbar() {
  // ── Estado ──────────────────────────────────────
  // Controla se o drawer mobile está aberto ou fechado
  const [menuAberto, setMenuAberto] = useState(false);
  // Controla sombra no header após scroll
  const [scrolled, setScrolled] = useState(false);

  // ── Efeito de scroll ────────────────────────────
  // Adiciona sombra ao header após 40px de scroll (ngOnInit)
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll, { passive: true });
    // Remove listener quando componente sai da tela (ngOnDestroy)
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ── Efeito de scroll do body ─────────────────────
  // Trava o scroll da página quando o drawer estiver aberto
  useEffect(() => {
    document.body.style.overflow = menuAberto ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuAberto]);

  const fecharMenu = () => setMenuAberto(false);

  // ── Renderização ────────────────────────────────
  return (
    <>
      <header className={`${styles.header} ${scrolled ? styles.scrolled : ""}`}>
        <nav className="navbar" aria-label="Navegação principal">
          <div className="container">
            {/* Logo */}
            <Link
              href="/"
              className="navbar-brand"
              aria-label="Paola Galvão Studio - Início"
            >
              <Image
                src="/images/logo.png"
                alt="Paola Galvão Studio"
                width={120}
                height={60}
                className={styles.logo}
                priority
              />
            </Link>

            {/* Links — visíveis só no desktop (d-none d-lg-flex) */}
            <ul className="navbar-nav d-none d-lg-flex flex-row align-items-center gap-4 mb-0">
              <li className="nav-item">
                <Link href="#sobre" className={styles.navLink}>
                  Sobre
                </Link>
              </li>
              <li className="nav-item">
                <Link href="#servicos" className={styles.navLink}>
                  Serviços
                </Link>
              </li>
              <li className="nav-item">
                <Link href="#avaliacoes" className={styles.navLink}>
                  Avaliações
                </Link>
              </li>
              <li className="nav-item">
                <Link href="#contato" className={styles.navLink}>
                  Contato
                </Link>
              </li>
              <li className="nav-item">
                <Link href="#agendar" className={styles.btnAgendar}>
                  Agendar
                </Link>
              </li>
            </ul>

            {/* Botão hambúrguer — visível só no mobile (d-lg-none) */}
            <button
              className={`${styles.toggler} d-lg-none`}
              onClick={() => setMenuAberto(!menuAberto)}
              aria-controls="nav-drawer"
              aria-expanded={menuAberto}
              aria-label="Abrir menu de navegação"
            >
              {/* Três linhas do hambúrguer */}
              <span
                className={`${styles.linha} ${menuAberto ? styles.linha1Aberta : ""}`}
              />
              <span
                className={`${styles.linha} ${menuAberto ? styles.linha2Aberta : ""}`}
              />
              <span
                className={`${styles.linha} ${menuAberto ? styles.linha3Aberta : ""}`}
              />
            </button>
          </div>
        </nav>
      </header>

      {/* Overlay escurecido atrás do drawer — clica para fechar */}
      {menuAberto && (
        <div
          className={styles.overlay}
          onClick={fecharMenu}
          aria-hidden="true"
        />
      )}

      {/* Drawer lateral direito */}
      <div
        id="nav-drawer"
        className={`${styles.drawer} ${menuAberto ? styles.drawerAberto : ""}`}
        aria-hidden={!menuAberto}
      >
        <ul className="list-unstyled d-flex flex-column mb-0">
          <li className={styles.drawerItem}>
            <Link
              href="#sobre"
              className={styles.drawerLink}
              onClick={fecharMenu}
            >
              Sobre
            </Link>
          </li>
          <li className={styles.drawerItem}>
            <Link
              href="#servicos"
              className={styles.drawerLink}
              onClick={fecharMenu}
            >
              Serviços
            </Link>
          </li>
          <li className={styles.drawerItem}>
            <Link
              href="#avaliacoes"
              className={styles.drawerLink}
              onClick={fecharMenu}
            >
              Avaliações
            </Link>
          </li>
          <li className={styles.drawerItem}>
            <Link
              href="#contato"
              className={styles.drawerLink}
              onClick={fecharMenu}
            >
              Contato
            </Link>
          </li>
          <li className="mt-4">
            <Link
              href="#agendar"
              className={`${styles.drawerBtnAgendar} w-100 text-center`}
              onClick={fecharMenu}
            >
              Agendar
            </Link>
          </li>
        </ul>
      </div>
    </>
  );
}
