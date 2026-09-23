export function aniversarioValido(valor) {
  if (valor === null || valor === undefined || valor === "") return true;
  if (typeof valor !== "string" || !/^\d{2}\/\d{2}$/.test(valor)) return false;

  const [dia, mes] = valor.split("/").map(Number);
  const data = new Date(Date.UTC(2000, mes - 1, dia));
  return data.getUTCDate() === dia && data.getUTCMonth() === mes - 1;
}

export function formatarDiaMesDigitado(valor) {
  const digitos = valor.replace(/\D/g, "").slice(0, 4);
  return digitos.length > 2 ? `${digitos.slice(0, 2)}/${digitos.slice(2)}` : digitos;
}
