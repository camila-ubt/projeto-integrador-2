export async function buscarResumoDashboard(filtros = {}) {
  const params = new URLSearchParams();

  Object.entries(filtros).forEach(([chave, valor]) => {
    if (valor) params.set(chave, valor);
  });

  const resposta = await fetch(`/api/admin/resumo?${params.toString()}`, {
    cache: "no-store",
  });

  if (!resposta.ok) {
    const erro = await resposta.json().catch(() => null);
    throw new Error(erro?.error || "Erro ao buscar dados do dashboard.");
  }

  return resposta.json();
}
