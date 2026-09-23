-- Massa de dados ficticios para desenvolvimento e demonstracao.
-- Compativel com database/schema.sql (PostgreSQL/Neon).
--
-- Execucao com psql:
--   psql -v ON_ERROR_STOP=1 "$DATABASE_URL" -f database/seed.sql
--
-- O script pode ser executado novamente. Os UUIDs abaixo usam prefixos reservados
-- por tabela; somente agendamentos e registros dependentes desse conjunto de teste
-- sao recriados para que as datas relativas a CURRENT_DATE continuem atuais.
-- Execute apenas em um banco de demonstracao: a nova execucao substitui os
-- agendamentos ficticios anteriores e seus registros vinculados.

BEGIN;

-- Mantem os horarios coerentes com a operacao do salao, independentemente do fuso
-- configurado na sessao do Neon.
SET LOCAL TIME ZONE 'America/Sao_Paulo';

-- Remove apenas registros pertencentes a esta massa de teste. A limpeza dos
-- dependentes vem antes dos agendamentos por causa das chaves estrangeiras.
DELETE FROM public.retornos
WHERE id::text LIKE '60000000-0000-4000-8000-%'
   OR agendamento_origem_id::text LIKE '30000000-0000-4000-8000-%';

DELETE FROM public.movimentacoes_financeiras
WHERE id::text LIKE '50000000-0000-4000-8000-%'
   OR agendamento_id::text LIKE '30000000-0000-4000-8000-%';

DELETE FROM public.historico_procedimentos
WHERE id::text LIKE '70000000-0000-4000-8000-%'
   OR agendamento_id::text LIKE '30000000-0000-4000-8000-%';

DELETE FROM public.agendamento_servicos
WHERE id::text LIKE '40000000-0000-4000-8000-%'
   OR agendamento_id::text LIKE '30000000-0000-4000-8000-%';

DELETE FROM public.agendamentos
WHERE id::text LIKE '30000000-0000-4000-8000-%';

-- A demonstracao ocupa dias posteriores ao ultimo agendamento real. Assim a
-- agenda ficticia nao disputa um horario que ja esteja reservado no banco.
CREATE TEMP TABLE seed_primeiro_dia_livre ON COMMIT DROP AS
SELECT GREATEST(
    CURRENT_DATE,
    COALESCE(MAX((fim AT TIME ZONE 'America/Sao_Paulo')::date), CURRENT_DATE)
) + 1 AS dia
FROM public.agendamentos
WHERE status = 'agendado';

-- Clientes ficticios. Datas de nascimento sao fixas por representarem dados
-- pessoais; datas operacionais e de criacao permanecem relativas ao dia atual.
INSERT INTO public.clientes (
    id,
    nome,
    telefone,
    aniversario,
    observacoes,
    criado_em,
    atualizado_em
)
VALUES
    ('10000000-0000-4000-8000-000000000001', 'Maria Silva',       '+55 11 90000-0001', DATE '1988-03-12', 'Prefere atendimento no periodo da manha.', CURRENT_TIMESTAMP - INTERVAL '14 months', CURRENT_TIMESTAMP - INTERVAL '20 days'),
    ('10000000-0000-4000-8000-000000000002', 'Ana Souza',         '+55 11 90000-0002', DATE '1994-07-25', 'Cabelo sensivel a produtos com amonia.',     CURRENT_TIMESTAMP - INTERVAL '12 months', CURRENT_TIMESTAMP - INTERVAL '15 days'),
    ('10000000-0000-4000-8000-000000000003', 'Juliana Lima',      '+55 11 90000-0003', DATE '1990-11-08', NULL,                                         CURRENT_TIMESTAMP - INTERVAL '11 months', CURRENT_TIMESTAMP - INTERVAL '10 days'),
    ('10000000-0000-4000-8000-000000000004', 'Carla Mendes',      '+55 11 90000-0004', DATE '1985-01-30', 'Solicitar teste de mecha antes de quimica.', CURRENT_TIMESTAMP - INTERVAL '10 months', CURRENT_TIMESTAMP - INTERVAL '21 days'),
    ('10000000-0000-4000-8000-000000000005', 'Fernanda Costa',    '+55 11 90000-0005', DATE '1997-05-19', NULL,                                         CURRENT_TIMESTAMP - INTERVAL '9 months',  CURRENT_TIMESTAMP - INTERVAL '14 days'),
    ('10000000-0000-4000-8000-000000000006', 'Patricia Almeida',  '+55 11 90000-0006', DATE '1992-09-02', 'Entrar em contato preferencialmente por mensagem.', CURRENT_TIMESTAMP - INTERVAL '8 months', CURRENT_TIMESTAMP - INTERVAL '7 days'),
    ('10000000-0000-4000-8000-000000000007', 'Roberta Alves',     '+55 11 90000-0007', DATE '1989-12-14', NULL,                                         CURRENT_TIMESTAMP - INTERVAL '7 months',  CURRENT_TIMESTAMP - INTERVAL '3 days'),
    ('10000000-0000-4000-8000-000000000008', 'Beatriz Santos',    '+55 11 90000-0008', DATE '2000-04-06', 'Gosta de tons quentes.',                     CURRENT_TIMESTAMP - INTERVAL '6 months',  CURRENT_TIMESTAMP - INTERVAL '5 days'),
    ('10000000-0000-4000-8000-000000000009', 'Camila Oliveira',   '+55 11 90000-0009', DATE '1996-08-21', NULL,                                         CURRENT_TIMESTAMP - INTERVAL '5 months',  CURRENT_TIMESTAMP - INTERVAL '1 day'),
    ('10000000-0000-4000-8000-000000000010', 'Larissa Ferreira',  '+55 11 90000-0010', DATE '1993-02-17', 'Prefere produtos sem fragrancia.',             CURRENT_TIMESTAMP - INTERVAL '4 months',  CURRENT_TIMESTAMP - INTERVAL '6 days'),
    ('10000000-0000-4000-8000-000000000011', 'Renata Rodrigues',  '+55 11 90000-0011', DATE '1987-06-10', NULL,                                         CURRENT_TIMESTAMP - INTERVAL '3 months',  CURRENT_TIMESTAMP - INTERVAL '2 days'),
    ('10000000-0000-4000-8000-000000000012', 'Aline Barbosa',     '+55 11 90000-0012', DATE '1999-10-29', 'Avisar com antecedencia sobre mudancas de horario.', CURRENT_TIMESTAMP - INTERVAL '75 days', CURRENT_TIMESTAMP - INTERVAL '8 days'),
    ('10000000-0000-4000-8000-000000000013', 'Gabriela Martins',  '+55 11 90000-0013', DATE '1991-01-05', NULL,                                         CURRENT_TIMESTAMP - INTERVAL '60 days', CURRENT_TIMESTAMP - INTERVAL '4 days'),
    ('10000000-0000-4000-8000-000000000014', 'Natalia Ribeiro',   '+55 11 90000-0014', DATE '1986-05-27', 'Primeira progressiva no salao.',               CURRENT_TIMESTAMP - INTERVAL '45 days', CURRENT_TIMESTAMP - INTERVAL '5 days'),
    ('10000000-0000-4000-8000-000000000015', 'Isabela Nascimento','+55 11 90000-0015', DATE '1998-09-16', NULL,                                         CURRENT_TIMESTAMP - INTERVAL '30 days', CURRENT_TIMESTAMP - INTERVAL '1 day')
ON CONFLICT (id) DO UPDATE SET
    nome = EXCLUDED.nome,
    telefone = EXCLUDED.telefone,
    aniversario = EXCLUDED.aniversario,
    observacoes = EXCLUDED.observacoes,
    atualizado_em = EXCLUDED.atualizado_em;

-- Catalogo com duracoes, precos e intervalos de retorno variados.
INSERT INTO public.servicos (
    id,
    nome,
    descricao,
    duracao_minutos,
    preco_padrao,
    necessita_avaliacao,
    retorno_dias,
    ativo,
    criado_em
)
VALUES
    ('20000000-0000-4000-8000-000000000001', 'Corte feminino',       'Corte, lavagem e finalizacao.',                       60,  90.00, false, 60, true, CURRENT_TIMESTAMP - INTERVAL '18 months'),
    ('20000000-0000-4000-8000-000000000002', 'Escova',               'Lavagem e modelagem com escova.',                     45,  70.00, false, 30, true, CURRENT_TIMESTAMP - INTERVAL '18 months'),
    ('20000000-0000-4000-8000-000000000003', 'Coloracao',            'Coloracao completa com avaliacao previa.',            120, 220.00, true,  45, true, CURRENT_TIMESTAMP - INTERVAL '16 months'),
    ('20000000-0000-4000-8000-000000000004', 'Hidratacao',           'Tratamento de hidratacao e finalizacao.',              60, 110.00, false, 30, true, CURRENT_TIMESTAMP - INTERVAL '14 months'),
    ('20000000-0000-4000-8000-000000000005', 'Escova progressiva',   'Alinhamento dos fios com avaliacao e teste de mecha.', 180, 350.00, true,  90, true, CURRENT_TIMESTAMP - INTERVAL '12 months'),
    ('20000000-0000-4000-8000-000000000006', 'Manicure',             'Cutilagem e esmaltacao tradicional.',                  45,  50.00, false, 14, true, CURRENT_TIMESTAMP - INTERVAL '10 months')
ON CONFLICT (id) DO UPDATE SET
    nome = EXCLUDED.nome,
    descricao = EXCLUDED.descricao,
    duracao_minutos = EXCLUDED.duracao_minutos,
    preco_padrao = EXCLUDED.preco_padrao,
    necessita_avaliacao = EXCLUDED.necessita_avaliacao,
    retorno_dias = EXCLUDED.retorno_dias,
    ativo = EXCLUDED.ativo;

-- Agenda distribuida entre passado, hoje e futuro. Como o fuso foi definido no
-- inicio da transacao, os horarios abaixo sao gravados corretamente em timestamptz.
INSERT INTO public.agendamentos (
    id,
    cliente_id,
    inicio,
    fim,
    status,
    observacoes,
    google_event_id,
    criado_em
)
VALUES
    ('30000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', CURRENT_DATE - 75 + TIME '09:00', CURRENT_DATE - 75 + TIME '11:00', 'realizado',  'Coloracao completa em tom castanho.',       NULL, CURRENT_TIMESTAMP - INTERVAL '82 days'),
    ('30000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', CURRENT_DATE - 48 + TIME '13:00', CURRENT_DATE - 48 + TIME '14:00', 'realizado',  'Hidratacao para fios sensibilizados.',       NULL, CURRENT_TIMESTAMP - INTERVAL '55 days'),
    ('30000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000003', CURRENT_DATE - 35 + TIME '10:00', CURRENT_DATE - 35 + TIME '11:45', 'realizado',  'Corte em camadas e escova.',                 NULL, CURRENT_TIMESTAMP - INTERVAL '40 days'),
    ('30000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000004', CURRENT_DATE - 21 + TIME '14:00', CURRENT_DATE - 21 + TIME '17:00', 'realizado',  'Teste de mecha aprovado antes do servico.',  NULL, CURRENT_TIMESTAMP - INTERVAL '30 days'),
    ('30000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000005', CURRENT_DATE - 14 + TIME '09:00', CURRENT_DATE - 14 + TIME '09:45', 'realizado',  NULL,                                           NULL, CURRENT_TIMESTAMP - INTERVAL '18 days'),
    ('30000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000006', CURRENT_DATE -  7 + TIME '11:00', CURRENT_DATE -  7 + TIME '12:00', 'cancelado',  'Cancelado pela cliente com antecedencia.',   NULL, CURRENT_TIMESTAMP - INTERVAL '12 days'),
    ('30000000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000007', CURRENT_DATE -  3 + TIME '15:00', CURRENT_DATE -  3 + TIME '16:00', 'faltou',     'Cliente nao compareceu.',                    NULL, CURRENT_TIMESTAMP - INTERVAL '8 days'),
    ('30000000-0000-4000-8000-000000000008', '10000000-0000-4000-8000-000000000008', (SELECT dia FROM seed_primeiro_dia_livre) + TIME '09:00', (SELECT dia FROM seed_primeiro_dia_livre) + TIME '11:00', 'agendado', 'Confirmado por mensagem.', NULL, CURRENT_TIMESTAMP - INTERVAL '5 days'),
    ('30000000-0000-4000-8000-000000000009', '10000000-0000-4000-8000-000000000009', CURRENT_DATE      + TIME '11:30', CURRENT_DATE      + TIME '12:30', 'realizado',  'Atendimento concluido hoje.',                NULL, CURRENT_TIMESTAMP - INTERVAL '4 days'),
    ('30000000-0000-4000-8000-000000000010', '10000000-0000-4000-8000-000000000010', (SELECT dia FROM seed_primeiro_dia_livre) + 1 + TIME '14:00', (SELECT dia FROM seed_primeiro_dia_livre) + 1 + TIME '15:30', 'agendado', 'Corte e escova para evento.', NULL, CURRENT_TIMESTAMP - INTERVAL '3 days'),
    ('30000000-0000-4000-8000-000000000011', '10000000-0000-4000-8000-000000000011', (SELECT dia FROM seed_primeiro_dia_livre) + 2 + TIME '16:00', (SELECT dia FROM seed_primeiro_dia_livre) + 2 + TIME '17:00', 'agendado', NULL, NULL, CURRENT_TIMESTAMP - INTERVAL '2 days'),
    ('30000000-0000-4000-8000-000000000012', '10000000-0000-4000-8000-000000000012', CURRENT_DATE      + TIME '17:30', CURRENT_DATE      + TIME '18:15', 'cancelado',  'Cancelado por indisponibilidade da cliente.',NULL, CURRENT_TIMESTAMP - INTERVAL '4 days'),
    ('30000000-0000-4000-8000-000000000013', '10000000-0000-4000-8000-000000000013', (SELECT dia FROM seed_primeiro_dia_livre) + 3 + TIME '10:00', (SELECT dia FROM seed_primeiro_dia_livre) + 3 + TIME '10:45', 'agendado', 'Escova para compromisso profissional.', NULL, CURRENT_TIMESTAMP - INTERVAL '2 days'),
    ('30000000-0000-4000-8000-000000000014', '10000000-0000-4000-8000-000000000014', (SELECT dia FROM seed_primeiro_dia_livre) + 4 + TIME '13:00', (SELECT dia FROM seed_primeiro_dia_livre) + 4 + TIME '16:00', 'agendado', 'Realizar avaliacao antes do procedimento.', NULL, CURRENT_TIMESTAMP - INTERVAL '6 days'),
    ('30000000-0000-4000-8000-000000000015', '10000000-0000-4000-8000-000000000015', (SELECT dia FROM seed_primeiro_dia_livre) + 5 + TIME '09:00', (SELECT dia FROM seed_primeiro_dia_livre) + 5 + TIME '09:45', 'agendado', NULL, NULL, CURRENT_TIMESTAMP - INTERVAL '1 day'),
    ('30000000-0000-4000-8000-000000000016', '10000000-0000-4000-8000-000000000001', (SELECT dia FROM seed_primeiro_dia_livre) + 6 + TIME '14:00', (SELECT dia FROM seed_primeiro_dia_livre) + 6 + TIME '16:00', 'agendado', 'Retoque de raiz.', NULL, CURRENT_TIMESTAMP - INTERVAL '3 days'),
    ('30000000-0000-4000-8000-000000000017', '10000000-0000-4000-8000-000000000002', (SELECT dia FROM seed_primeiro_dia_livre) + 7 + TIME '10:00', (SELECT dia FROM seed_primeiro_dia_livre) + 7 + TIME '11:00', 'agendado', 'Aparar pontas.', NULL, CURRENT_TIMESTAMP - INTERVAL '1 day'),
    ('30000000-0000-4000-8000-000000000018', '10000000-0000-4000-8000-000000000003', (SELECT dia FROM seed_primeiro_dia_livre) + 8 + TIME '15:00', (SELECT dia FROM seed_primeiro_dia_livre) + 8 + TIME '16:00', 'agendado', NULL, NULL, CURRENT_TIMESTAMP - INTERVAL '12 hours'),
    ('30000000-0000-4000-8000-000000000019', '10000000-0000-4000-8000-000000000013', CURRENT_DATE -  1 + TIME '09:00', CURRENT_DATE -  1 + TIME '09:45', 'realizado',  'Esmaltacao em tom neutro.',                   NULL, CURRENT_TIMESTAMP - INTERVAL '5 days'),
    ('30000000-0000-4000-8000-000000000020', '10000000-0000-4000-8000-000000000015', CURRENT_DATE - 90 + TIME '13:00', CURRENT_DATE - 90 + TIME '14:00', 'realizado',  'Primeiro atendimento da cliente.',           NULL, CURRENT_TIMESTAMP - INTERVAL '95 days');

-- Servicos contratados em cada agendamento, incluindo combinacoes de dois itens.
INSERT INTO public.agendamento_servicos (
    id,
    agendamento_id,
    servico_id,
    valor,
    criado_em
)
VALUES
    ('40000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000003', 220.00, CURRENT_TIMESTAMP - INTERVAL '82 days'),
    ('40000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000004', 110.00, CURRENT_TIMESTAMP - INTERVAL '55 days'),
    ('40000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000001',  90.00, CURRENT_TIMESTAMP - INTERVAL '40 days'),
    ('40000000-0000-4000-8000-000000000004', '30000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000002',  65.00, CURRENT_TIMESTAMP - INTERVAL '40 days'),
    ('40000000-0000-4000-8000-000000000005', '30000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000005', 350.00, CURRENT_TIMESTAMP - INTERVAL '30 days'),
    ('40000000-0000-4000-8000-000000000006', '30000000-0000-4000-8000-000000000005', '20000000-0000-4000-8000-000000000006',  50.00, CURRENT_TIMESTAMP - INTERVAL '18 days'),
    ('40000000-0000-4000-8000-000000000007', '30000000-0000-4000-8000-000000000006', '20000000-0000-4000-8000-000000000001',  90.00, CURRENT_TIMESTAMP - INTERVAL '12 days'),
    ('40000000-0000-4000-8000-000000000008', '30000000-0000-4000-8000-000000000007', '20000000-0000-4000-8000-000000000004', 110.00, CURRENT_TIMESTAMP - INTERVAL '8 days'),
    ('40000000-0000-4000-8000-000000000009', '30000000-0000-4000-8000-000000000008', '20000000-0000-4000-8000-000000000003', 220.00, CURRENT_TIMESTAMP - INTERVAL '5 days'),
    ('40000000-0000-4000-8000-000000000010', '30000000-0000-4000-8000-000000000009', '20000000-0000-4000-8000-000000000001',  90.00, CURRENT_TIMESTAMP - INTERVAL '4 days'),
    ('40000000-0000-4000-8000-000000000011', '30000000-0000-4000-8000-000000000010', '20000000-0000-4000-8000-000000000001',  90.00, CURRENT_TIMESTAMP - INTERVAL '3 days'),
    ('40000000-0000-4000-8000-000000000012', '30000000-0000-4000-8000-000000000010', '20000000-0000-4000-8000-000000000002',  70.00, CURRENT_TIMESTAMP - INTERVAL '3 days'),
    ('40000000-0000-4000-8000-000000000013', '30000000-0000-4000-8000-000000000011', '20000000-0000-4000-8000-000000000004', 110.00, CURRENT_TIMESTAMP - INTERVAL '2 days'),
    ('40000000-0000-4000-8000-000000000014', '30000000-0000-4000-8000-000000000012', '20000000-0000-4000-8000-000000000006',  50.00, CURRENT_TIMESTAMP - INTERVAL '4 days'),
    ('40000000-0000-4000-8000-000000000015', '30000000-0000-4000-8000-000000000013', '20000000-0000-4000-8000-000000000002',  70.00, CURRENT_TIMESTAMP - INTERVAL '2 days'),
    ('40000000-0000-4000-8000-000000000016', '30000000-0000-4000-8000-000000000014', '20000000-0000-4000-8000-000000000005', 350.00, CURRENT_TIMESTAMP - INTERVAL '6 days'),
    ('40000000-0000-4000-8000-000000000017', '30000000-0000-4000-8000-000000000015', '20000000-0000-4000-8000-000000000006',  50.00, CURRENT_TIMESTAMP - INTERVAL '1 day'),
    ('40000000-0000-4000-8000-000000000018', '30000000-0000-4000-8000-000000000016', '20000000-0000-4000-8000-000000000003', 220.00, CURRENT_TIMESTAMP - INTERVAL '3 days'),
    ('40000000-0000-4000-8000-000000000019', '30000000-0000-4000-8000-000000000017', '20000000-0000-4000-8000-000000000001',  90.00, CURRENT_TIMESTAMP - INTERVAL '1 day'),
    ('40000000-0000-4000-8000-000000000020', '30000000-0000-4000-8000-000000000018', '20000000-0000-4000-8000-000000000004', 110.00, CURRENT_TIMESTAMP - INTERVAL '12 hours'),
    ('40000000-0000-4000-8000-000000000021', '30000000-0000-4000-8000-000000000019', '20000000-0000-4000-8000-000000000006',  50.00, CURRENT_TIMESTAMP - INTERVAL '5 days'),
    ('40000000-0000-4000-8000-000000000022', '30000000-0000-4000-8000-000000000020', '20000000-0000-4000-8000-000000000001',  85.00, CURRENT_TIMESTAMP - INTERVAL '95 days');

-- Receitas dos atendimentos realizados e despesas operacionais independentes.
-- O valor e sempre positivo; a coluna tipo determina entrada ou saida.
INSERT INTO public.movimentacoes_financeiras (
    id,
    agendamento_id,
    tipo,
    descricao,
    categoria,
    valor,
    forma_pagamento,
    data_movimentacao,
    criado_em
)
VALUES
    ('50000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', 'receita', 'Coloracao - Maria Silva',             'servicos',        220.00, 'pix',      CURRENT_DATE - 75, CURRENT_TIMESTAMP - INTERVAL '75 days'),
    ('50000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000002', 'receita', 'Hidratacao - Ana Souza',                'servicos',        110.00, 'debito',   CURRENT_DATE - 48, CURRENT_TIMESTAMP - INTERVAL '48 days'),
    ('50000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000003', 'receita', 'Corte e escova - Juliana Lima',          'servicos',        155.00, 'credito',  CURRENT_DATE - 35, CURRENT_TIMESTAMP - INTERVAL '35 days'),
    ('50000000-0000-4000-8000-000000000004', '30000000-0000-4000-8000-000000000004', 'receita', 'Escova progressiva - Carla Mendes',      'servicos',        350.00, 'pix',      CURRENT_DATE - 21, CURRENT_TIMESTAMP - INTERVAL '21 days'),
    ('50000000-0000-4000-8000-000000000005', '30000000-0000-4000-8000-000000000005', 'receita', 'Manicure - Fernanda Costa',              'servicos',         50.00, 'dinheiro', CURRENT_DATE - 14, CURRENT_TIMESTAMP - INTERVAL '14 days'),
    ('50000000-0000-4000-8000-000000000006', '30000000-0000-4000-8000-000000000009', 'receita', 'Corte feminino - Camila Oliveira',       'servicos',         90.00, 'pix',      CURRENT_DATE,      CURRENT_TIMESTAMP),
    ('50000000-0000-4000-8000-000000000007', '30000000-0000-4000-8000-000000000019', 'receita', 'Manicure - Gabriela Martins',            'servicos',         50.00, 'debito',   CURRENT_DATE -  1, CURRENT_TIMESTAMP - INTERVAL '1 day'),
    ('50000000-0000-4000-8000-000000000008', '30000000-0000-4000-8000-000000000020', 'receita', 'Corte feminino - Isabela Nascimento',    'servicos',         85.00, 'credito',  CURRENT_DATE - 90, CURRENT_TIMESTAMP - INTERVAL '90 days'),
    ('50000000-0000-4000-8000-000000000009', NULL,                                   'despesa', 'Compra de coloracao e oxidantes',        'produtos',        420.00, 'pix',      CURRENT_DATE - 45, CURRENT_TIMESTAMP - INTERVAL '45 days'),
    ('50000000-0000-4000-8000-000000000010', NULL,                                   'despesa', 'Aluguel do espaco',                     'estrutura',      1200.00, 'pix',      CURRENT_DATE - 30, CURRENT_TIMESTAMP - INTERVAL '30 days'),
    ('50000000-0000-4000-8000-000000000011', NULL,                                   'despesa', 'Divulgacao em redes sociais',           'marketing',       180.00, 'credito',  CURRENT_DATE - 10, CURRENT_TIMESTAMP - INTERVAL '10 days'),
    ('50000000-0000-4000-8000-000000000012', NULL,                                   'despesa', 'Materiais descartaveis',                'materiais',        95.50, 'debito',   CURRENT_DATE,      CURRENT_TIMESTAMP),
    ('50000000-0000-4000-8000-000000000013', NULL,                                   'despesa', 'Conta de energia eletrica',              'estrutura',       145.80, 'pix',      CURRENT_DATE -  3, CURRENT_TIMESTAMP - INTERVAL '3 days');

-- Retornos coerentes com o intervalo configurado em cada servico. Ha exemplos
-- vencidos, para hoje e futuros, alem de todos os status aceitos pelo schema.
INSERT INTO public.retornos (
    id,
    cliente_id,
    servico_id,
    agendamento_origem_id,
    data_recomendada,
    status,
    observacoes,
    criado_em
)
VALUES
    ('60000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000001', CURRENT_DATE - 30, 'pendente',  'Retorno de coloracao em atraso.',                CURRENT_TIMESTAMP - INTERVAL '75 days'),
    ('60000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000004', '30000000-0000-4000-8000-000000000002', CURRENT_DATE - 18, 'pendente',  'Entrar em contato para nova hidratacao.',         CURRENT_TIMESTAMP - INTERVAL '48 days'),
    ('60000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000003', CURRENT_DATE + 25, 'pendente',  NULL,                                                 CURRENT_TIMESTAMP - INTERVAL '35 days'),
    ('60000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000003', CURRENT_DATE -  5, 'pendente',  'Sugerir escova para o proximo evento.',            CURRENT_TIMESTAMP - INTERVAL '35 days'),
    ('60000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000005', '30000000-0000-4000-8000-000000000004', CURRENT_DATE + 69, 'agendado',  'Retorno ja combinado com a cliente.',              CURRENT_TIMESTAMP - INTERVAL '21 days'),
    ('60000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000005', '20000000-0000-4000-8000-000000000006', '30000000-0000-4000-8000-000000000005', CURRENT_DATE,      'pendente',  'Retorno recomendado para hoje.',                   CURRENT_TIMESTAMP - INTERVAL '14 days'),
    ('60000000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000009', '20000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000009', CURRENT_DATE + 60, 'pendente',  NULL,                                                 CURRENT_TIMESTAMP),
    ('60000000-0000-4000-8000-000000000008', '10000000-0000-4000-8000-000000000013', '20000000-0000-4000-8000-000000000006', '30000000-0000-4000-8000-000000000019', CURRENT_DATE + 13, 'cancelado', 'Cliente informou que fara o retorno em outra data.', CURRENT_TIMESTAMP - INTERVAL '1 day'),
    ('60000000-0000-4000-8000-000000000009', '10000000-0000-4000-8000-000000000015', '20000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000020', CURRENT_DATE - 30, 'realizado',  'Retorno realizado e encerrado.',                   CURRENT_TIMESTAMP - INTERVAL '90 days'),
    ('60000000-0000-4000-8000-000000000010', '10000000-0000-4000-8000-000000000006', '20000000-0000-4000-8000-000000000001', NULL,                                   CURRENT_DATE -  2, 'pendente',  'Retorno cadastrado manualmente apos contato.',     CURRENT_TIMESTAMP - INTERVAL '3 days');

-- Historico dos servicos efetivamente realizados, ligado ao cliente, agendamento
-- e servico correspondente.
INSERT INTO public.historico_procedimentos (
    id,
    cliente_id,
    agendamento_id,
    servico_id,
    produto_utilizado,
    cor,
    tecnica,
    observacoes,
    data_procedimento,
    criado_em
)
VALUES
    ('70000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000003', 'Coloracao profissional sem amonia', 'Castanho 5.0', 'Aplicacao global',       'Boa cobertura dos fios brancos.',           CURRENT_DATE - 75, CURRENT_TIMESTAMP - INTERVAL '75 days'),
    ('70000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000004', 'Mascara de reconstrucao',          NULL,           'Enluvamento',            'Usar linha suave nas proximas sessoes.',     CURRENT_DATE - 48, CURRENT_TIMESTAMP - INTERVAL '48 days'),
    ('70000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000001', NULL,                              NULL,           'Corte em camadas longas','Mantido o comprimento.',                    CURRENT_DATE - 35, CURRENT_TIMESTAMP - INTERVAL '35 days'),
    ('70000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000002', 'Protetor termico',                 NULL,           'Escova modelada',        'Finalizacao com pontas onduladas.',           CURRENT_DATE - 35, CURRENT_TIMESTAMP - INTERVAL '35 days'),
    ('70000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000004', '30000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000005', 'Redutor de volume profissional',   NULL,           'Alinhamento termico',    'Teste de mecha sem alteracoes.',              CURRENT_DATE - 21, CURRENT_TIMESTAMP - INTERVAL '21 days'),
    ('70000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000005', '30000000-0000-4000-8000-000000000005', '20000000-0000-4000-8000-000000000006', 'Esmalte cremoso',                   'Vermelho',     'Esmaltacao tradicional','Sem observacoes.',                              CURRENT_DATE - 14, CURRENT_TIMESTAMP - INTERVAL '14 days'),
    ('70000000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000009', '30000000-0000-4000-8000-000000000009', '20000000-0000-4000-8000-000000000001', NULL,                              NULL,           'Corte reto',             'Franja levemente ajustada.',                  CURRENT_DATE,      CURRENT_TIMESTAMP),
    ('70000000-0000-4000-8000-000000000008', '10000000-0000-4000-8000-000000000013', '30000000-0000-4000-8000-000000000019', '20000000-0000-4000-8000-000000000006', 'Esmalte hipoalergenico',            'Nude',         'Esmaltacao tradicional','Cliente satisfeita com a cor.',                 CURRENT_DATE -  1, CURRENT_TIMESTAMP - INTERVAL '1 day'),
    ('70000000-0000-4000-8000-000000000009', '10000000-0000-4000-8000-000000000015', '30000000-0000-4000-8000-000000000020', '20000000-0000-4000-8000-000000000001', NULL,                              NULL,           'Corte em U',             'Primeiro registro no historico da cliente.', CURRENT_DATE - 90, CURRENT_TIMESTAMP - INTERVAL '90 days');

-- A serie amplia a demonstracao com visitas distribuidas pelos ultimos 90 dias
-- e horarios futuros. O mesmo agendamento liga agenda, servicos, Caixa, historico
-- e retornos. Apenas um atendimento realizado recebe receita e procedimento.
CREATE TEMP TABLE seed_agenda_analitica ON COMMIT DROP AS
SELECT
    eventos.numero,
    ('30000000-0000-4000-8000-' || lpad(eventos.numero::text, 12, '0'))::uuid AS agendamento_id,
    ('10000000-0000-4000-8000-' || lpad((1 + (eventos.numero - 101) % 15)::text, 12, '0'))::uuid AS cliente_id,
    ('20000000-0000-4000-8000-' || lpad((1 + (eventos.numero - 101) % 6)::text, 12, '0'))::uuid AS servico_id,
    (eventos.dia + (ARRAY[TIME '09:00', TIME '10:30', TIME '13:00', TIME '15:00', TIME '17:00'])[1 + (eventos.numero - 101) % 5])::timestamptz AS inicio,
    eventos.status
FROM (
    SELECT numero, CURRENT_DATE - (190 - numero) AS dia,
        CASE WHEN numero % 17 = 0 THEN 'faltou'
             WHEN numero % 11 = 0 THEN 'cancelado'
             ELSE 'realizado' END AS status
    FROM generate_series(101, 190) AS serie(numero)
    UNION ALL
    SELECT numero, (SELECT dia FROM seed_primeiro_dia_livre) + (numero - 192) AS dia, 'agendado' AS status
    FROM generate_series(201, 212) AS serie(numero)
) AS eventos;

INSERT INTO public.agendamentos (id, cliente_id, inicio, fim, status, observacoes, criado_em)
SELECT d.agendamento_id, d.cliente_id, d.inicio,
       d.inicio + make_interval(mins => s.duracao_minutos),
       d.status, 'Atendimento ficticio para demonstracao.',
       d.inicio - INTERVAL '10 days'
FROM seed_agenda_analitica d
JOIN public.servicos s ON s.id = d.servico_id;

INSERT INTO public.agendamento_servicos (id, agendamento_id, servico_id, valor, criado_em)
SELECT ('40000000-0000-4000-8000-' || lpad(d.numero::text, 12, '0'))::uuid,
       d.agendamento_id, d.servico_id, s.preco_padrao, d.inicio - INTERVAL '10 days'
FROM seed_agenda_analitica d
JOIN public.servicos s ON s.id = d.servico_id;

-- Alguns atendimentos combinam dois servicos; o recibo abaixo soma ambos.
INSERT INTO public.agendamento_servicos (id, agendamento_id, servico_id, valor, criado_em)
SELECT ('40000000-0000-4000-8000-' || lpad((d.numero + 1000)::text, 12, '0'))::uuid,
       d.agendamento_id, s.id, s.preco_padrao, d.inicio - INTERVAL '10 days'
FROM seed_agenda_analitica d
JOIN public.servicos s ON s.id =
    ('20000000-0000-4000-8000-' || lpad((1 + (d.numero - 100) % 6)::text, 12, '0'))::uuid
WHERE d.numero % 7 = 0;

INSERT INTO public.movimentacoes_financeiras
    (id, agendamento_id, tipo, descricao, categoria, valor, forma_pagamento, data_movimentacao, criado_em)
SELECT ('50000000-0000-4000-8000-' || lpad(d.numero::text, 12, '0'))::uuid,
       d.agendamento_id, 'receita', 'Servicos realizados - demonstracao',
       'servicos', SUM(ags.valor),
       (ARRAY['pix', 'dinheiro', 'debito', 'credito'])[1 + d.numero % 4],
       (d.inicio AT TIME ZONE 'America/Sao_Paulo')::date,
       d.inicio + INTERVAL '1 hour'
FROM seed_agenda_analitica d
JOIN public.agendamento_servicos ags ON ags.agendamento_id = d.agendamento_id
WHERE d.status = 'realizado'
GROUP BY d.numero, d.agendamento_id, d.inicio;

INSERT INTO public.historico_procedimentos
    (id, cliente_id, agendamento_id, servico_id, tecnica, observacoes, data_procedimento, criado_em)
SELECT ('70000000-0000-4000-8000-' || right(ags.id::text, 12))::uuid,
       d.cliente_id, d.agendamento_id, ags.servico_id,
       'Procedimento demonstrativo', 'Servico concluido na demonstracao.',
       (d.inicio AT TIME ZONE 'America/Sao_Paulo')::date, d.inicio
FROM seed_agenda_analitica d
JOIN public.agendamento_servicos ags ON ags.agendamento_id = d.agendamento_id
WHERE d.status = 'realizado';

INSERT INTO public.retornos
    (id, cliente_id, servico_id, agendamento_origem_id, data_recomendada, status, observacoes, criado_em)
SELECT ('60000000-0000-4000-8000-' || right(ags.id::text, 12))::uuid,
       d.cliente_id, ags.servico_id, d.agendamento_id,
       (d.inicio AT TIME ZONE 'America/Sao_Paulo')::date + s.retorno_dias,
       CASE WHEN EXISTS (
           SELECT 1 FROM seed_agenda_analitica posterior
           JOIN public.agendamento_servicos servico_posterior
             ON servico_posterior.agendamento_id = posterior.agendamento_id
           WHERE posterior.cliente_id = d.cliente_id
             AND posterior.inicio > d.inicio
             AND posterior.status = 'realizado'
             AND servico_posterior.servico_id = ags.servico_id
       ) THEN 'realizado' ELSE 'pendente' END,
       'Retorno calculado a partir do atendimento demonstrativo.', d.inicio
FROM seed_agenda_analitica d
JOIN public.agendamento_servicos ags ON ags.agendamento_id = d.agendamento_id
JOIN public.servicos s ON s.id = ags.servico_id
WHERE d.status = 'realizado';

-- Uma divergencia cancela toda a transacao, inclusive a limpeza inicial.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM public.agendamentos a
        LEFT JOIN LATERAL (
            SELECT SUM(valor) AS total FROM public.agendamento_servicos
            WHERE agendamento_id = a.id
        ) servicos ON true
        LEFT JOIN LATERAL (
            SELECT SUM(valor) AS total FROM public.movimentacoes_financeiras
            WHERE agendamento_id = a.id AND tipo = 'receita'
        ) caixa ON true
        WHERE a.id::text LIKE '30000000-0000-4000-8000-%'
          AND (servicos.total IS NULL
            OR (a.status = 'realizado' AND caixa.total IS DISTINCT FROM servicos.total)
            OR (a.status <> 'realizado' AND caixa.total IS NOT NULL))
    ) THEN
        RAISE EXCEPTION 'Seed inconsistente: status, servicos e receitas nao conferem';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM public.agendamentos a
        JOIN public.agendamento_servicos ags ON ags.agendamento_id = a.id
        WHERE a.id::text LIKE '30000000-0000-4000-8000-%'
          AND a.status = 'realizado'
          AND NOT EXISTS (
              SELECT 1 FROM public.historico_procedimentos h
              WHERE h.agendamento_id = a.id AND h.servico_id = ags.servico_id
          )
    ) THEN
        RAISE EXCEPTION 'Seed inconsistente: procedimento realizado sem historico';
    END IF;
END $$;

COMMIT;

-- Resumo exibido ao final da execucao. As contagens consideram apenas os UUIDs
-- reservados para esta massa de teste.
SELECT 'clientes' AS entidade, COUNT(*) AS quantidade
FROM public.clientes WHERE id::text LIKE '10000000-0000-4000-8000-%'
UNION ALL
SELECT 'servicos', COUNT(*)
FROM public.servicos WHERE id::text LIKE '20000000-0000-4000-8000-%'
UNION ALL
SELECT 'agendamentos', COUNT(*)
FROM public.agendamentos WHERE id::text LIKE '30000000-0000-4000-8000-%'
UNION ALL
SELECT 'agendamento_servicos', COUNT(*)
FROM public.agendamento_servicos WHERE id::text LIKE '40000000-0000-4000-8000-%'
UNION ALL
SELECT 'movimentacoes_financeiras', COUNT(*)
FROM public.movimentacoes_financeiras WHERE id::text LIKE '50000000-0000-4000-8000-%'
UNION ALL
SELECT 'retornos', COUNT(*)
FROM public.retornos WHERE id::text LIKE '60000000-0000-4000-8000-%'
UNION ALL
SELECT 'historico_procedimentos', COUNT(*)
FROM public.historico_procedimentos WHERE id::text LIKE '70000000-0000-4000-8000-%';

SELECT a.status, COUNT(*) AS atendimentos,
       COALESCE(SUM(caixa.valor), 0) AS receita_no_caixa
FROM public.agendamentos a
LEFT JOIN (
    SELECT agendamento_id, SUM(valor) AS valor
    FROM public.movimentacoes_financeiras
    WHERE tipo = 'receita'
    GROUP BY agendamento_id
) caixa ON caixa.agendamento_id = a.id
WHERE a.id::text LIKE '30000000-0000-4000-8000-%'
GROUP BY a.status
ORDER BY a.status;
