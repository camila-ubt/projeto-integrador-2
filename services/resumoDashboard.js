async function buscarApi() {
  const resposta = await fetch("/api/admin/resumo", { cache: "no-store" });

  if (!resposta.ok) {
    throw new Error("Erro ao buscar dados do dashboard.");
  }

  return resposta.json();
}

export async function buscarResumoDashboard() {
  return buscarApi();
}
