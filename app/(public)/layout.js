import Navbar from "../components/Navbar";

// Título padrão para todas as páginas públicas
export const metadata = {
  title: "Paola Galvão Studio",
  description: "Especialista em beleza e bem-estar",
};

// Componenete de Layout
export default function PublicLayout({ children }) {
  return (
    <>
      {/* Navbar aparece em todas as páginas públicas */}
      <Navbar />
           {/* Conteúdo da página (rota) atual */}
      <div
  id="conteudo-principal"
  tabIndex={-1}
  style={{ scrollMarginTop: "7rem" }}
>
  {children}
</div>
    </>
  );
}
