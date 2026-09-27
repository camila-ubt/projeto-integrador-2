import Navbar from "../components/Navbar";
import Acessibilidade from "../components/Acessibilidade";

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
      <Acessibilidade />
      {/* Conteúdo da página (rota) atual */}
      {children}
    </>
  );
}
