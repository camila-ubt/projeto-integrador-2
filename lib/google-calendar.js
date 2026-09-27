function formatarDataUTC(data) {
  return data.toISOString().replace(/[-:]|\.\d{3}/g, "");
}

export function gerarLinkGoogleCalendar({ titulo, inicio, fim, detalhes, local }) {
  if (!(inicio instanceof Date) || Number.isNaN(inicio.getTime())) {
    throw new Error("'inicio' precisa ser uma data válida.");
  }
  if (!(fim instanceof Date) || Number.isNaN(fim.getTime())) {
    throw new Error("'fim' precisa ser uma data válida.");
  }

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: titulo || "Agendamento",
    dates: `${formatarDataUTC(inicio)}/${formatarDataUTC(fim)}`,
  });

  if (detalhes) params.set("details", detalhes);
  if (local) params.set("location", local);

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
