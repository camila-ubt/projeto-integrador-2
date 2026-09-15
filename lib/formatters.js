// Funções de formatação de dados (ex: datas, valores monetários, etc) para exibição no front-end.
// Importe apenas o que precisar em cada arquivo, para não aumentar o bundle do front-end desnecessariamente.

// MOEDA - formata um número como moeda brasileira (ex: 1234.56 => "R$ 1.234,56")
export function formatarMoeda(valor) {
  if (valor === null || valor === undefined) {
    return "R$ 0,00";
  }
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

// DATAS
//Formata um string de data no formato YYYY-MM-DD ou objeto Date para exibição por extenso
export function formatarData(valor) {
  if (!valor) return "";
  const data =
    typeof valor === "string" ? parseDateLocal(valor) : new Date(valor);
  return data.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

//Formata uma string "YYYY-MM-DD" ou objeto Date para o padrão curto DD/MM/AAAA.
export function formatarDataCurta(valor) {
  if (!valor) return "";
  const data =
    typeof valor === "string" ? parseDateLocal(valor) : new Date(valor);
  return data.toLocaleDateString("pt-BR");
}

//Formata uma string "YYYY-MM-DD" para o padrão DD/MM (sem o ano).
export function formatarDiaMes(valor) {
  if (!valor) return "";
  const data =
    typeof valor === "string" ? parseDateLocal(valor) : new Date(valor);
  return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

//Retorna o dia de hoje formatado por extenso com o dia da semana.
export function formatarDataHoje() {
  const hoje = new Date();
  return hoje.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

//Data mínima para agendamento (hoje + 1 dia), formatada como YYYY-MM-DD.
export function dataMinimaAgendamento() {
  const hoje = new Date();
  hoje.setDate(hoje.getDate() + 1); // Adiciona 1 dia
  return hoje.toISOString().split("T")[0]; // Retorna no formato YYYY-MM-DD
}

// HORA -  formata uma string "HH:MM" ou objeto Date para exibição no padrão 24h.
export function formatarHora(valor) {
  if (!valor) return "";
  return new Date(valor).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

//TELEFONE - formata uma string de telefone (ex: "11987654321" => "(11) 98765-4321")
export function formatarTelefone(valor) {
  if (!valor) return "";

  //Remove tudo que não for número e limita a 11 dígitos (DDD + número)
  let numeros = valor.replace(/\D/g, "").substring(0, 11);

  if (numeros <= 10){
    numeros = numeros.replace(/^(\d{2})(\d)/g, "($1) $2");
    numeros = numeros.replace(/(\d)(\d{4})$/, "$1-$2");
  } else {
    numeros = numeros.replace(/^(\d{2})(\d)/g, "($1) $2");
    numeros = numeros.replace(/(\d{5})(\d)/, "$1-$2");
  
  }
  return numeros;
}

// Prazo e retorno - Calcula quantos dias faltam (ou passaram) para uma data de retorno.
export function calcularPrazoRetorno(dataRecomendada) {
  if (!dataRecomendada) return { texto: "", vencido: false };

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0); // Zera a hora para comparar apenas a data
  const dataRetorno = new Date(dataRecomendada);
  dataRetorno.setHours(0, 0, 0, 0); // Zera a hora para comparar apenas a data

  const diffTime = Math.round((dataRetorno - hoje) / (1000 * 60 * 60 * 24)); // Diferença em dias

  if (diffTime < 0) {
    return {
      texto: `${`Vencido há ${Math.abs(diffTime)} dia(s)`}`,
      vencido: true,
    };
  }
  if (diffTime === 0) {
    return { texto: "Hoje", vencido: false };
  }
  if (diffTime === 1) {
    return { texto: "Amanhã", vencido: false };
  }
  return { texto: `Em ${diffTime} dia(s)`, vencido: false };
}

//SAUDAÇÃO - Retorna "Bom dia", "Boa tarde" ou "Boa noite" de acordo com a hora atual.
export function saudacao() {
  const hora = new Date().getHours();
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}

//HELPERS INTERNOS - Converte "YYYY-MM-DD" para Date no fuso local, evitando o bug de UTC
function parseDateLocal(dateString) {
  const apenasData = dateString.split("T")[0]; // Remove a parte do tempo se existir
  const [ano, mes, dia] = apenasData.split("-").map(Number);
  return new Date(ano, mes - 1, dia);
}
