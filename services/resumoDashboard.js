// Dados mockados enquanto não há dados reais para o dashboard
const mockAgendamentos = [
  {
    id: '1',
    inicio: new Date().setHours(9, 0),
    fim: new Date().setHours(11, 0),
    status: 'agendado',
    cliente_nome: 'Maria Silva',
    servicos: 'Coloração',
  },
  {
    id: '2',
    inicio: new Date().setHours(11, 0),
    fim: new Date().setHours(12, 30),
    status: 'realizado',
    cliente_nome: 'Ana Souza',
    servicos: 'Corte + Escova',
  },
  {
    id: '3',
    inicio: new Date().setHours(14, 0),
    fim: new Date().setHours(15, 0),
    status: 'agendado',
    cliente_nome: 'Julia Lima',
    servicos: 'Hidratação',
  },
  {
    id: '4',
    inicio: new Date().setHours(16, 0),
    fim: new Date().setHours(17, 0),
    status: 'agendado',
    cliente_nome: 'Carla Mendes',
    servicos: 'Escova',
  },
]

const mockRetornos = [
  {
    id: '1',
    cliente_nome: 'Fernanda Costa',
    servico_nome: 'Coloração',
    data_recomendada: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
  {
    id: '2',
    cliente_nome: 'Patrícia Lima',
    servico_nome: 'Hidratação',
    data_recomendada: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: '3',
    cliente_nome: 'Roberta Alves',
    servico_nome: 'Escova Progressiva',
    data_recomendada: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
  },
]

const mockFaturamento = 480.00

// Função para simular a busca de dados do dashboard

async function buscarMock() {
    await new Promise( (res) => setTimeout(res, 800))
    return {
        agendamentosHoje: mockAgendamentos,
        retornosPendentes: mockRetornos,
        faturamentoDia: mockFaturamento,
    }    
}

// Função para buscar dados reais do dashboard via API

//  async function buscarApi() {
//   const resposta = await fetch('/api/admin/resumo')
//   if (!resposta.ok) throw new Error('Erro ao buscar dados do dashboard.')
//   return resposta.json()

//Finalmente, exportamos a função que será utilizada para buscar os dados do dashboard, atualmente utilizando os dados mockados. 
// Quando a API estiver disponível, basta substituir a chamada para `buscarMock()` por `buscarApi()`.

export async function buscarResumoDashboard() {
    return buscarMock() // alterar com buscarApi
}

