import packageInfo from "../../package.json";

export default function AppVersion() {
  const sha = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7);
  const ambiente = process.env.VERCEL_ENV;

  let versao = `v${packageInfo.version}-dev`;

  if (sha && ambiente === "production") {
    versao = `v${packageInfo.version}-beta.${sha}`;
  } else if (sha) {
    versao = `v${packageInfo.version}-preview.${sha}`;
  }

  return (
    <footer
      style={{
        textAlign: "center",
        padding: "12px 16px",
        fontSize: "11px",
        color: "var(--texto-secundario)",
        opacity: 0.7,
      }}
    >
      Paola Galvão Studio • {versao}
    </footer>
  );
}