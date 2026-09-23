"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { buscarResumoDashboard } from "@/services/resumoDashboard";
import { formatarMoeda, formatarDataCurta, formatarDataSemAno } from "@/lib/formatters";
import DatePickerField from "@/app/components/DatePickerField";
import { dataHojeSalao, limitesDoMes } from "@/lib/periodo-filtros";
import styles from "./Dashboard.module.css";

const DIAS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const CATEGORIAS_DESPESA = {
  produtos: "Produtos", materiais: "Materiais", estrutura: "Estrutura",
  marketing: "Marketing", equipe: "Equipe", outros: "Outros",
};

function dataLocal(data) {
  return new Date(`${String(data).slice(0, 10)}T12:00:00`);
}

function dataInput(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function periodoInicial() {
  const hoje = dataHojeSalao();
  return { inicio: limitesDoMes(hoje.slice(0, 7)).inicio, fim: hoje };
}

function formatarPercentual(valor) {
  return `${Number(valor || 0).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
}

function Comparacao({ valor, pontos = false, melhorQuandoCresce = true }) {
  if (valor === null) return <span className={styles.comparacaoNeutra}>Sem base anterior</span>;
  const positivo = valor > 0;
  const negativo = valor < 0;
  return (
    <span className={valor === 0 ? styles.comparacaoNeutra : (positivo === melhorQuandoCresce) ? styles.comparacaoPositiva : styles.comparacaoNegativa}>
      {positivo ? "↑" : negativo ? "↓" : "•"} {formatarPercentual(Math.abs(valor))} {pontos ? "p.p. " : ""}vs. período anterior
    </span>
  );
}

function Kpi({ titulo, valor, comparacao, destaque, complemento, pontos, melhorQuandoCresce }) {
  return (
    <article className={`${styles.kpi} ${destaque ? styles.kpiDestaque : ""}`}>
      <p>{titulo}</p>
      <strong>{valor}</strong>
      {comparacao !== undefined && <Comparacao valor={comparacao} pontos={pontos} melhorQuandoCresce={melhorQuandoCresce} />}
      {complemento && <small>{complemento}</small>}
    </article>
  );
}

function Secao({ titulo, subtitulo, children, className = "", abertaInicialmente = false }) {
  const [aberta, setAberta] = useState(abertaInicialmente);
  return (
    <section className={`${styles.secao} ${className} ${aberta ? styles.secaoAberta : ""}`}>
      <div className={styles.cabecalhoSecao}>
        <div>
          <h2>{titulo}</h2>
          {subtitulo && <p>{subtitulo}</p>}
        </div>
        <button
          className={styles.botaoSecao}
          type="button"
          aria-label={`${aberta ? "Recolher" : "Expandir"} ${titulo}`}
          aria-expanded={aberta}
          onClick={() => setAberta((valor) => !valor)}
        >
          {aberta ? "−" : "+"}
        </button>
      </div>
      <div className={styles.conteudoSecao}>{children}</div>
    </section>
  );
}

function BarraRanking({ rotulo, valor, maximo, detalhe, cor = "primaria" }) {
  const largura = maximo ? Math.max((valor / maximo) * 100, valor ? 4 : 0) : 0;
  return (
    <div className={styles.itemRanking}>
      <div className={styles.rotuloRanking}><span>{rotulo}</span><strong>{detalhe}</strong></div>
      <div className={styles.trilho}><span className={styles[cor]} style={{ width: `${largura}%` }} /></div>
    </div>
  );
}

function agruparEvolucao(itens) {
  if (!itens?.length) return [];
  const modo = itens.length > 120 ? "mes" : itens.length > 45 ? "semana" : "dia";
  const grupos = new Map();

  itens.forEach((item) => {
    const data = dataLocal(item.data);
    let chave;
    let rotulo;
    if (modo === "mes") {
      chave = `${data.getFullYear()}-${data.getMonth()}`;
      rotulo = data.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
    } else if (modo === "semana") {
      const segunda = new Date(data);
      const deslocamento = (data.getDay() + 6) % 7;
      segunda.setDate(data.getDate() - deslocamento);
      chave = dataInput(segunda);
      rotulo = `Sem. ${formatarDataSemAno(segunda)}`;
    } else {
      chave = String(item.data).slice(0, 10);
      rotulo = formatarDataSemAno(data);
    }
    const grupo = grupos.get(chave) || { rotulo, faturamento: 0, atendimentos: 0 };
    grupo.faturamento += item.faturamento;
    grupo.atendimentos += item.atendimentos;
    grupos.set(chave, grupo);
  });
  return [...grupos.values()];
}

function GraficoEvolucao({ dados }) {
  const pontos = agruparEvolucao(dados);
  const maximoFaturamento = Math.max(...pontos.map((item) => item.faturamento), 1);
  const maximoAtendimentos = Math.max(...pontos.map((item) => item.atendimentos), 1);
  if (!pontos.some((item) => item.faturamento || item.atendimentos)) {
    return <EstadoVazio texto="Ainda não há movimentação nesse período." />;
  }
  return (
    <>
      <div className={styles.legendaEvolucao}>
        <span><i className={styles.amostraFaturamento} />Valor dos serviços realizados</span>
        <span><i className={styles.amostraAtendimentos} />Atendimentos realizados</span>
      </div>
      <div className={styles.graficoEvolucao}>
        {pontos.map((item) => (
          <div className={styles.colunaGrafico} key={item.rotulo} title={`${formatarMoeda(item.faturamento)} · ${item.atendimentos} atendimento(s)`}>
            <div className={styles.areaBarra}>
              <span className={styles.barraFaturamento} style={{ height: `${item.faturamento ? Math.max((item.faturamento / maximoFaturamento) * 100, 6) : 0}%` }} />
              <span className={styles.barraAtendimentos} style={{ height: `${item.atendimentos ? Math.max((item.atendimentos / maximoAtendimentos) * 100, 6) : 0}%` }} />
            </div>
            <span className={styles.rotuloGrafico}>{item.rotulo}</span>
            <span className={styles.numeroAtendimentos}>{item.atendimentos ? `${item.atendimentos} atend.` : ""}</span>
          </div>
        ))}
      </div>
    </>
  );
}

function EstadoVazio({ texto }) {
  return <p className={styles.vazio}>{texto}</p>;
}

function Filtros({ filtros, setFiltros, opcoes, aoAplicar, carregando }) {
  const [mesSelecionado, setMesSelecionado] = useState(() => dataHojeSalao().slice(0, 7));
  const [maisFiltrosAbertos, setMaisFiltrosAbertos] = useState(false);
  const hoje = dataHojeSalao();
  const filtroHojeAtivo = filtros.inicio === hoje && filtros.fim === hoje;
  const mesAtual = hoje.slice(0, 7);
  const periodoMesAtual = limitesDoMes(mesAtual);
  const filtroMesAtualAtivo = filtros.inicio === periodoMesAtual.inicio && filtros.fim === periodoMesAtual.fim;
  const filtrosExtrasAtivos = Boolean(filtros.servico_id || filtros.status || filtros.cliente_id || (!mesSelecionado && !filtroHojeAtivo));
  function alterar(evento) {
    if (evento.target.name === "inicio" || evento.target.name === "fim") setMesSelecionado("");
    setFiltros((atuais) => ({ ...atuais, [evento.target.name]: evento.target.value }));
  }
  function escolherMes(evento) {
    const mes = evento.target.value;
    setMesSelecionado(mes);
    const periodo = mes ? limitesDoMes(mes) : { inicio: "", fim: "" };
    const novosFiltros = { ...filtros, ...periodo };
    setFiltros(novosFiltros);
    aoAplicar(novosFiltros);
  }
  function escolherHoje() {
    const novosFiltros = { ...filtros, inicio: hoje, fim: hoje, servico_id: "", status: "", cliente_id: "" };
    setMesSelecionado(hoje.slice(0, 7));
    setFiltros(novosFiltros);
    setMaisFiltrosAbertos(false);
    aoAplicar(novosFiltros);
  }
  function escolherMesAtual() {
    const novosFiltros = { ...filtros, ...periodoMesAtual, servico_id: "", status: "", cliente_id: "" };
    setMesSelecionado(mesAtual);
    setFiltros(novosFiltros);
    setMaisFiltrosAbertos(false);
    aoAplicar(novosFiltros);
  }
  return (
    <form className={styles.filtros} onSubmit={(evento) => { evento.preventDefault(); aoAplicar(); }}>
      <div className={styles.filtrosPrincipais}>
        <label>Mês<DatePickerField type="month" value={mesSelecionado} onChange={escolherMes} /></label>
        <button type="button" className={filtroMesAtualAtivo ? styles.btnHojeAtivo : ""} aria-pressed={filtroMesAtualAtivo} onClick={escolherMesAtual}>Mês atual</button>
        <button type="button" className={filtroHojeAtivo ? styles.btnHojeAtivo : ""} aria-pressed={filtroHojeAtivo} onClick={escolherHoje}>Hoje</button>
        <button type="button" aria-expanded={maisFiltrosAbertos} aria-controls="filtrosAvancadosDashboard" onClick={() => setMaisFiltrosAbertos((valor) => !valor)}>{maisFiltrosAbertos ? "Menos opções" : filtrosExtrasAtivos ? "Mais opções •" : "Mais opções"}</button>
      </div>
      <div id="filtrosAvancadosDashboard" className={maisFiltrosAbertos ? styles.filtrosAvancados : styles.filtrosOcultos}>
        <label>De<DatePickerField name="inicio" value={filtros.inicio} max={filtros.fim} onChange={alterar} /></label>
        <label>Até<DatePickerField name="fim" value={filtros.fim} min={filtros.inicio} onChange={alterar} /></label>
        <label>Serviço<select name="servico_id" value={filtros.servico_id} onChange={alterar}><option value="">Todos</option>{opcoes.servicos?.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</select></label>
        <label>Status<select name="status" value={filtros.status} onChange={alterar}><option value="">Todos</option><option value="realizado">Realizado</option><option value="agendado">Agendado</option><option value="cancelado">Cancelado</option><option value="faltou">Faltou</option></select></label>
        <label>Cliente<select name="cliente_id" value={filtros.cliente_id} onChange={alterar}><option value="">Todos</option>{opcoes.clientes?.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</select></label>
        <button type="submit" disabled={carregando}>{carregando ? "Atualizando…" : "Aplicar filtros"}</button>
      </div>
    </form>
  );
}

export default function PaginaDashboard() {
  const { status: statusSessao } = useSession();
  const [filtros, setFiltros] = useState(() => ({ ...periodoInicial(), servico_id: "", status: "", cliente_id: "" }));
  const [filtrosAplicados, setFiltrosAplicados] = useState(filtros);
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    if (statusSessao !== "authenticated") return undefined;
    let ativo = true;

    buscarResumoDashboard(filtrosAplicados)
      .then((resultado) => {
        if (ativo) setDados(resultado);
      })
      .catch((error) => {
        if (ativo) setErro(error.message || "Não foi possível carregar os dados.");
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });

    return () => { ativo = false; };
  }, [statusSessao, filtrosAplicados, tentativa]);

  const diasSemana = useMemo(() => DIAS.map((nome, indice) => ({ nome, quantidade: dados?.diasSemana.find((item) => item.dia === indice + 1)?.quantidade || 0 })), [dados]);

  if (!dados && carregando) {
    return <div className={styles.carregando}><div className="spinner-border" role="status"><span className="visually-hidden">Carregando...</span></div><p>Preparando sua visão do negócio…</p></div>;
  }

  if (!dados) {
    return <div className={styles.erroInicial} role="alert"><strong>Não foi possível abrir a dashboard.</strong><span>{erro}</span><button type="button" onClick={() => { setCarregando(true); setErro(""); setTentativa((valor) => valor + 1); }}>Tentar novamente</button></div>;
  }

  const kpis = dados?.kpis;
  const maiorServico = Math.max(...(dados?.servicos.map((item) => item.quantidade) || [0]));
  const maiorFaturamentoServico = Math.max(...(dados?.servicos.map((item) => item.faturamento) || [0]));
  const maiorDia = Math.max(...diasSemana.map((item) => item.quantidade), 0);
  const maiorHorario = Math.max(...(dados?.horarios.map((item) => item.quantidade) || [0]));
  const totalClientesSegmentados = (dados?.clientes.novos || 0) + (dados?.clientes.recorrentes || 0);
  const retorno = dados.clientes.retorno;
  const taxaRetorno = retorno.totalClientes ? retorno.clientes / retorno.totalClientes * 100 : null;
  const taxaRetornoAnterior = retorno.totalClientesAnterior ? retorno.clientesAnterior / retorno.totalClientesAnterior * 100 : null;
  const proporcaoDespesas = kpis.receitasCaixa ? kpis.despesas / kpis.receitasCaixa * 100 : null;

  return (
    <div className={styles.pagina}>
      <div className={styles.introducao}>
        <div><span>Visão do negócio</span><h1>Como o studio está performando?</h1><p>Compare resultados, entenda o comportamento dos clientes e encontre os horários de maior movimento.</p></div>
        <span className={styles.periodoAtual}>{formatarDataCurta(dados.periodo.inicio)} — {formatarDataCurta(dados.periodo.fim)}</span>
      </div>

      <Filtros filtros={filtros} setFiltros={setFiltros} opcoes={dados.opcoes} carregando={carregando} aoAplicar={(proximos = filtros) => { setCarregando(true); setErro(""); setFiltrosAplicados({ ...proximos }); }} />
      {erro && <div className={styles.erro} role="alert">{erro}<button type="button" onClick={() => { setCarregando(true); setErro(""); setTentativa((valor) => valor + 1); }}>Tentar novamente</button></div>}

      <div className={styles.gradeKpis} aria-busy={carregando}>
        <Kpi titulo="Valor dos atendimentos" valor={formatarMoeda(kpis.faturamento)} comparacao={kpis.comparacao.faturamento} destaque complemento={`Receitas lançadas no Caixa: ${formatarMoeda(kpis.receitasCaixa)}`} />
        <Kpi titulo="Atendimentos" valor={kpis.atendimentos} comparacao={kpis.comparacao.atendimentos} complemento={`${kpis.realizados} realizados · ${kpis.agendados} agendados`} />
        <Kpi titulo="Ticket médio" valor={formatarMoeda(kpis.ticketMedio)} comparacao={kpis.comparacao.ticketMedio} complemento="valor de serviços por atendimento realizado" />
        <Kpi titulo="Clientes atendidos" valor={kpis.clientes} comparacao={kpis.comparacao.clientes} complemento="clientes únicos" />
        <Kpi titulo="Cancelamentos e faltas" valor={formatarPercentual(kpis.taxaAusencias)} comparacao={kpis.comparacao.taxaAusencias} pontos melhorQuandoCresce={false} complemento={`${kpis.cancelados} cancelados · ${kpis.faltas} faltas`} />
      </div>

      <Secao titulo="Despesas e saldo do Caixa" subtitulo="Entradas e saídas registradas no período.">
        <div className={styles.analiseFinanceira}>
          <div className={styles.indicadoresFinanceiros}>
            <div>
              <span>Despesas registradas</span>
              <strong>{formatarMoeda(kpis.despesas)}</strong>
              <Comparacao valor={dados.financeiro.comparacaoDespesas} melhorQuandoCresce={false} />
            </div>
            <div>
              <span>Saldo do Caixa</span>
              <strong>{formatarMoeda(kpis.saldo)}</strong>
              <small>Receitas lançadas: {formatarMoeda(kpis.receitasCaixa)}</small>
              <small>{proporcaoDespesas === null ? "Sem receitas lançadas no período" : `Despesas equivalem a ${formatarPercentual(proporcaoDespesas)} das receitas`}</small>
            </div>
          </div>
          <div className={styles.faixasRetorno}>
            <h3>Despesas por categoria</h3>
            {dados.financeiro.categorias.length ? dados.financeiro.categorias.map((item) => (
              <BarraRanking
                key={item.categoria}
                rotulo={CATEGORIAS_DESPESA[item.categoria] || item.categoria}
                valor={item.total}
                maximo={kpis.despesas}
                detalhe={`${formatarMoeda(item.total)} · ${formatarPercentual(item.total / kpis.despesas * 100)}`}
              />
            )) : <EstadoVazio texto="Nenhuma despesa registrada no período." />}
          </div>
          <p className={styles.notaRetorno}>Os valores vêm dos lançamentos do Caixa e seguem o período selecionado. Despesas sem vínculo com atendimentos não são filtradas por cliente, serviço ou status. Saldo do Caixa não representa lucro.</p>
          <Link className={styles.linkCaixa} href="/admin/caixa">Ver lançamentos no Caixa →</Link>
        </div>
      </Secao>

      <Secao titulo="Evolução do período" subtitulo="Compare o valor dos serviços e os atendimentos realizados em cada data.">
        <GraficoEvolucao dados={dados.evolucao} />
      </Secao>

      <div className={styles.gradeDuasColunas}>
        <Secao titulo="Serviços mais realizados" subtitulo="Participação por quantidade de serviços concluídos.">
          {dados.servicos.length ? dados.servicos.map((item) => <BarraRanking key={item.id} rotulo={item.nome} valor={item.quantidade} maximo={maiorServico} detalhe={`${item.quantidade} · ${formatarPercentual(item.quantidade / item.totalServicos * 100)}`} />) : <EstadoVazio texto="Nenhum serviço realizado no período." />}
        </Secao>
        <Secao titulo="Serviços de maior valor" subtitulo="Soma dos valores registrados nos serviços concluídos.">
          {dados.servicos.length ? [...dados.servicos].sort((a, b) => b.faturamento - a.faturamento).map((item) => <BarraRanking key={item.id} rotulo={item.nome} valor={item.faturamento} maximo={maiorFaturamentoServico} detalhe={formatarMoeda(item.faturamento)} cor="dourada" />) : <EstadoVazio texto="Nenhum faturamento por serviço no período." />}
        </Secao>
      </div>

      <div className={styles.gradeDuasColunas}>
        <Secao titulo="Movimento por dia" subtitulo="Quantidade de agendamentos em cada dia da semana.">
          <div className={styles.diasSemana}>{diasSemana.map((item) => <div key={item.nome}><span style={{ height: `${Math.max(item.quantidade / Math.max(maiorDia, 1) * 100, item.quantidade ? 8 : 0)}%` }} /><strong>{item.quantidade}</strong><small>{item.nome}</small></div>)}</div>
        </Secao>
        <Secao titulo="Clientes novos e recorrentes" subtitulo="Classificação pelo histórico de atendimentos realizados.">
          <div className={styles.clientesResumo}>
            <div className={styles.anel} style={{ "--percentual": `${totalClientesSegmentados ? dados.clientes.recorrentes / totalClientesSegmentados * 100 : 0}%` }}><strong>{totalClientesSegmentados ? Math.round(dados.clientes.recorrentes / totalClientesSegmentados * 100) : 0}%</strong><span>recorrentes</span></div>
            <div className={styles.legendaClientes}><p><span className={styles.pontoNovo} />Novos <strong>{dados.clientes.novos}</strong></p><p><span className={styles.pontoRecorrente} />Recorrentes <strong>{dados.clientes.recorrentes}</strong></p><p className={styles.intervalo}>Intervalo médio <strong>{dados.clientes.intervaloMedio === null ? "Sem histórico" : `${Math.round(dados.clientes.intervaloMedio)} dias`}</strong></p></div>
          </div>
        </Secao>
      </div>

      <Secao titulo="Retorno de clientes" subtitulo="Novas visitas em dias diferentes, considerando atendimentos realizados.">
        {retorno.totalClientes ? (
          <div className={styles.analiseRetorno}>
            <div className={styles.indicadoresRetorno}>
              <div>
                <span>Clientes que voltaram</span>
                <strong>{formatarPercentual(taxaRetorno)}</strong>
                <small>{retorno.clientes} de {retorno.totalClientes} clientes atendidas</small>
                <Comparacao valor={taxaRetornoAnterior === null ? null : taxaRetorno - taxaRetornoAnterior} pontos />
                {retorno.totalClientesAnterior > 0 && <small>Período anterior: {retorno.clientesAnterior} de {retorno.totalClientesAnterior}</small>}
              </div>
              <div>
                <span>Intervalo típico de retorno</span>
                <strong>{retorno.medianaDias === null ? "—" : `${Number(retorno.medianaDias).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} dias`}</strong>
                <small>Mediana de {retorno.visitas} visitas de retorno</small>
              </div>
            </div>
            <div className={styles.faixasRetorno}>
              <h3>Tempo até a nova visita</h3>
              {retorno.visitas ? retorno.faixas.map((faixa) => <BarraRanking key={faixa.rotulo} rotulo={faixa.rotulo} valor={faixa.quantidade} maximo={retorno.visitas} detalhe={`${faixa.quantidade} · ${formatarPercentual(faixa.quantidade / retorno.visitas * 100)}`} />) : <EstadoVazio texto="Ainda não houve visitas de retorno no período." />}
            </div>
            <p className={styles.notaRetorno}>Clientes únicas com uma nova visita em outro dia, entre as atendidas no período. É um percentual observado, não uma previsão. O filtro de serviço considera a visita atual; a anterior pode ter sido de outro serviço.</p>
          </div>
        ) : <EstadoVazio texto="Nenhuma cliente atendida no período para analisar retornos." />}
      </Secao>

      <div className={styles.gradeDuasColunas}>
        <Secao titulo="Horários mais procurados" subtitulo="Horário de início dos agendamentos.">
          {dados.horarios.length ? dados.horarios.map((item) => <BarraRanking key={item.hora} rotulo={`${String(item.hora).padStart(2, "0")}:00`} valor={item.quantidade} maximo={maiorHorario} detalhe={`${item.quantidade} atendimento${item.quantidade === 1 ? "" : "s"}`} />) : <EstadoVazio texto="Nenhum horário encontrado no período." />}
          <div className={styles.destaqueSecundario}><span>Duração média agendada</span><strong>{Math.round(kpis.duracaoMedia)} min</strong></div>
        </Secao>
        <Secao titulo="Clientes que mais retornam" subtitulo="Visitas de retorno realizadas no período.">
          {dados.clientes.ranking.length ? <div className={styles.tabelaSimples}>{dados.clientes.ranking.map((item, indice) => <div key={item.id}><span>{indice + 1}</span><p><Link href={`/admin/clientes?cliente_id=${item.id}`} aria-label={`Ver dados de ${item.nome}`}>{item.nome}</Link></p><strong>{item.retornos}</strong></div>)}</div> : <EstadoVazio texto="Ainda não há visitas de retorno no período." />}
        </Secao>
      </div>

      {dados.aniversariantes?.clientes.length > 0 && (
        <Secao
          titulo="Aniversariantes do mês"
          subtitulo={`Clientes com aniversário em ${dataLocal(`${dados.aniversariantes.mes}-01`).toLocaleDateString("pt-BR", { month: "long" })}.`}
        >
          <div className={styles.aniversariantes}>
            {dados.aniversariantes.clientes.map((cliente) => (
              <Link className={styles.aniversariante} href={`/admin/clientes?cliente_id=${cliente.id}`} key={cliente.id} aria-label={`Ver dados de ${cliente.nome}, aniversariante do dia ${cliente.dia}`}>
                <span className={styles.diaAniversario}>{String(cliente.dia).padStart(2, "0")}</span>
                <span className={styles.nomeAniversariante}>{cliente.nome}</span>
                <span className={styles.verCliente}>Ver cliente →</span>
              </Link>
            ))}
          </div>
        </Secao>
      )}

      <Secao titulo="Próximos atendimentos" subtitulo="A agenda operacional continua por perto, sem competir com a análise." abertaInicialmente>
        {dados.proximosAtendimentos.length ? <div className={styles.proximos}>{dados.proximosAtendimentos.map((item) => <Link className={styles.proximoLink} href={`/admin/agendamentos?agendamento_id=${item.id}`} key={item.id} aria-label={`Ver agendamento de ${item.cliente_nome}`}><article><time>{formatarDataCurta(new Date(item.inicio).toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" }))}<strong>{new Date(item.inicio).toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" })}</strong></time><div><strong>{item.cliente_nome}</strong><span>{item.servicos}</span></div></article></Link>)}</div> : <EstadoVazio texto="Nenhum próximo atendimento encontrado." />}
      </Secao>

      <p className={styles.nota}>A taxa de ocupação será calculada quando os horários disponíveis do studio forem definidos.</p>
    </div>
  );
}
