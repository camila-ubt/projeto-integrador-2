-- Execute uma vez no SQL Editor do Neon para ativar o Caixa automatico.
-- O script pode ser repetido sem criar lancamentos duplicados.
BEGIN;

CREATE UNIQUE INDEX IF NOT EXISTS receita_automatica_por_agendamento
ON public.movimentacoes_financeiras (agendamento_id)
WHERE tipo = 'receita' AND categoria = 'atendimento_automatico';

CREATE OR REPLACE FUNCTION public.registrar_receita_ao_concluir()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    total_servicos numeric(10,2);
    recebido_manualmente numeric(10,2);
    valor_automatico numeric(10,2);
    nome_cliente text;
BEGIN
    IF NEW.status <> 'realizado' THEN
        DELETE FROM public.movimentacoes_financeiras
        WHERE agendamento_id = NEW.id
          AND tipo = 'receita'
          AND categoria = 'atendimento_automatico';
        RETURN NEW;
    END IF;

    SELECT COALESCE(SUM(valor), 0)
    INTO total_servicos
    FROM public.agendamento_servicos
    WHERE agendamento_id = NEW.id;

    IF total_servicos <= 0 THEN
        RAISE EXCEPTION 'Informe servicos com valor positivo antes de concluir o atendimento.'
            USING ERRCODE = '23514';
    END IF;

    SELECT COALESCE(SUM(valor), 0)
    INTO recebido_manualmente
    FROM public.movimentacoes_financeiras
    WHERE agendamento_id = NEW.id
      AND tipo = 'receita'
      AND categoria IS DISTINCT FROM 'atendimento_automatico';

    valor_automatico := total_servicos - recebido_manualmente;
    IF valor_automatico <= 0 THEN
        DELETE FROM public.movimentacoes_financeiras
        WHERE agendamento_id = NEW.id
          AND tipo = 'receita'
          AND categoria = 'atendimento_automatico';
        RETURN NEW;
    END IF;

    SELECT nome INTO nome_cliente
    FROM public.clientes WHERE id = NEW.cliente_id;

    INSERT INTO public.movimentacoes_financeiras
        (agendamento_id, tipo, descricao, categoria, valor, data_movimentacao)
    VALUES
        (NEW.id, 'receita', 'Atendimento de ' || nome_cliente,
         'atendimento_automatico', valor_automatico,
         (now() AT TIME ZONE 'America/Sao_Paulo')::date)
    ON CONFLICT (agendamento_id)
        WHERE tipo = 'receita' AND categoria = 'atendimento_automatico'
    DO UPDATE SET valor = EXCLUDED.valor, descricao = EXCLUDED.descricao;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS registrar_receita_ao_concluir ON public.agendamentos;

CREATE TRIGGER registrar_receita_ao_concluir
AFTER UPDATE OF status ON public.agendamentos
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION public.registrar_receita_ao_concluir();

COMMIT;
