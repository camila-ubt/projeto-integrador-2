import { Cormorant_Garamond, Jost } from "next/font/google";
import "./styles/tokens.css";
import "./styles/global.css";
import "./styles/style.css";

const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
  variable: "--font-titulo-next",
  display: "swap",
});

const jost = Jost({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-corpo-next",
  display: "swap",
});

export const metadata = {
  title: "Paola Galvão Studio",
  description: "Especialista em beleza e bem-estar",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={`${cormorantGaramond.variable} ${jost.variable}`}>
      <body>{children}</body>
    </html>
  );
}
