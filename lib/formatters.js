// Funções utilitárias de formatação compartilhadas entre as telas do admin.

/**
 * Formata uma data (string ISO "AAAA-MM-DD" ou "AAAA-MM-DDTHH:mm:ss...")
 * para o formato curto brasileiro "DD/MM/AAAA".
 * Retorna string vazia se a data for inválida ou não informada.
 */
export function formatarDataCurta(data) {
  if (!data) return "";

  // Pega só a parte "AAAA-MM-DD", ignorando hora/timezone se houver,
  // para evitar que o fuso horário local mude o dia exibido.
  const soData = String(data).slice(0, 10);
  const partes = soData.split("-");
  if (partes.length !== 3) return "";

  const [ano, mes, dia] = partes;
  if (!ano || !mes || !dia) return "";

  return `${dia}/${mes}/${ano}`;
}

/**
 * Formata um número de telefone brasileiro enquanto o usuário digita
 * (aceita entrada parcial) ou para exibição de um número já completo.
 * Suporta telefone fixo (8 dígitos) e celular (9 dígitos).
 * Ex.: "11987654321" -> "(11) 98765-4321"
 *      "1133334444"  -> "(11) 3333-4444"
 */
export function formatarTelefone(valor) {
  if (!valor) return "";

  const digitos = String(valor).replace(/\D/g, "").slice(0, 11);

  if (digitos.length === 0) return "";
  if (digitos.length <= 2) return `(${digitos}`;

  const ddd = digitos.slice(0, 2);
  const resto = digitos.slice(2);

  if (resto.length <= 4) {
    return `(${ddd}) ${resto}`;
  }

  // Celular tem 9 dígitos no número (5 antes do hífen), fixo tem 8 (4 antes do hífen)
  const tamanhoPrimeiraParte = digitos.length > 10 ? 5 : 4;
  const primeiraParte = resto.slice(0, tamanhoPrimeiraParte);
  const segundaParte = resto.slice(tamanhoPrimeiraParte);

  return segundaParte
    ? `(${ddd}) ${primeiraParte}-${segundaParte}`
    : `(${ddd}) ${primeiraParte}`;
}