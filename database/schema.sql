--
-- PostgreSQL database dump
--

\restrict wq0b0otigTxSJ2itjfOn0TwlwXmmYNUj1nWZZGgtJg4e9KtttYyUNK5Tnj3GkcB

-- Dumped from database version 18.6
-- Dumped by pg_dump version 18.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: btree_gist; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA public;


--
-- Name: EXTENSION btree_gist; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION btree_gist IS 'support for indexing common datatypes in GiST';


--
-- Name: criar_retorno_automatico(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.criar_retorno_automatico() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN

    INSERT INTO retornos (
        cliente_id,
        servico_id,
        agendamento_origem_id,
        data_recomendada
    )
    SELECT
        NEW.cliente_id,
        s.id,
        NEW.id,
        NEW.inicio::date + s.retorno_dias
    FROM agendamento_servicos ags
    JOIN servicos s
        ON s.id = ags.servico_id
    WHERE ags.agendamento_id = NEW.id
      AND s.retorno_dias IS NOT NULL
      AND NOT EXISTS (
          SELECT 1
          FROM retornos r
          WHERE r.agendamento_origem_id = NEW.id
            AND r.servico_id = s.id
      );

    RETURN NEW;

END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: agendamento_servicos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agendamento_servicos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    agendamento_id uuid NOT NULL,
    servico_id uuid NOT NULL,
    valor numeric(10,2) NOT NULL,
    criado_em timestamp with time zone DEFAULT now()
);


--
-- Name: agendamentos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agendamentos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    cliente_id uuid NOT NULL,
    inicio timestamp with time zone NOT NULL,
    fim timestamp with time zone NOT NULL,
    status character varying(20) DEFAULT 'agendado'::character varying NOT NULL,
    observacoes text,
    google_event_id character varying(255),
    criado_em timestamp with time zone DEFAULT now(),
    CONSTRAINT agendamentos_check CHECK ((fim > inicio)),
    CONSTRAINT agendamentos_status_check CHECK (((status)::text = ANY ((ARRAY['agendado'::character varying, 'realizado'::character varying, 'cancelado'::character varying, 'faltou'::character varying])::text[])))
);


--
-- Name: clientes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clientes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome character varying(120) NOT NULL,
    telefone character varying(20) NOT NULL,
    aniversario date,
    observacoes text,
    criado_em timestamp with time zone DEFAULT now(),
    atualizado_em timestamp with time zone DEFAULT now()
);


--
-- Name: historico_procedimentos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.historico_procedimentos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    cliente_id uuid NOT NULL,
    agendamento_id uuid,
    servico_id uuid,
    produto_utilizado character varying(255),
    cor character varying(100),
    tecnica character varying(255),
    observacoes text,
    data_procedimento date DEFAULT CURRENT_DATE NOT NULL,
    criado_em timestamp with time zone DEFAULT now()
);


--
-- Name: movimentacoes_financeiras; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.movimentacoes_financeiras (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    agendamento_id uuid,
    tipo character varying(10) NOT NULL,
    descricao character varying(255) NOT NULL,
    categoria character varying(100),
    valor numeric(10,2) NOT NULL,
    forma_pagamento character varying(20),
    data_movimentacao date DEFAULT CURRENT_DATE NOT NULL,
    criado_em timestamp with time zone DEFAULT now(),
    CONSTRAINT movimentacoes_financeiras_forma_pagamento_check CHECK (((forma_pagamento IS NULL) OR ((forma_pagamento)::text = ANY ((ARRAY['dinheiro'::character varying, 'pix'::character varying, 'debito'::character varying, 'credito'::character varying])::text[])))),
    CONSTRAINT movimentacoes_financeiras_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['receita'::character varying, 'despesa'::character varying])::text[]))),
    CONSTRAINT movimentacoes_financeiras_valor_check CHECK ((valor > (0)::numeric))
);


--
-- Name: retornos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.retornos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    cliente_id uuid NOT NULL,
    servico_id uuid,
    agendamento_origem_id uuid,
    data_recomendada date NOT NULL,
    status character varying(20) DEFAULT 'pendente'::character varying NOT NULL,
    observacoes text,
    criado_em timestamp with time zone DEFAULT now(),
    CONSTRAINT retornos_status_check CHECK (((status)::text = ANY ((ARRAY['pendente'::character varying, 'agendado'::character varying, 'realizado'::character varying, 'cancelado'::character varying])::text[])))
);


--
-- Name: servicos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.servicos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome character varying(120) NOT NULL,
    descricao text,
    duracao_minutos integer,
    preco_padrao numeric(10,2),
    necessita_avaliacao boolean DEFAULT false,
    retorno_dias integer,
    ativo boolean DEFAULT true,
    criado_em timestamp with time zone DEFAULT now()
);


--
-- Name: usuarios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usuarios (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome character varying(120) NOT NULL,
    email character varying(150) NOT NULL,
    senha_hash text NOT NULL,
    perfil character varying(20) DEFAULT 'admin'::character varying NOT NULL,
    ativo boolean DEFAULT true NOT NULL,
    criado_em timestamp with time zone DEFAULT now() NOT NULL,
    atualizado_em timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT usuarios_perfil_check CHECK (((perfil)::text = 'admin'::text))
);


--
-- Name: agendamento_servicos agendamento_servicos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agendamento_servicos
    ADD CONSTRAINT agendamento_servicos_pkey PRIMARY KEY (id);


--
-- Name: agendamentos agendamentos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agendamentos
    ADD CONSTRAINT agendamentos_pkey PRIMARY KEY (id);


--
-- Name: clientes clientes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_pkey PRIMARY KEY (id);


--
-- Name: historico_procedimentos historico_procedimentos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historico_procedimentos
    ADD CONSTRAINT historico_procedimentos_pkey PRIMARY KEY (id);


--
-- Name: agendamentos impedir_conflito_horarios; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agendamentos
    ADD CONSTRAINT impedir_conflito_horarios EXCLUDE USING gist (tstzrange(inicio, fim, '[)'::text) WITH &&) WHERE (((status)::text = 'agendado'::text));


--
-- Name: movimentacoes_financeiras movimentacoes_financeiras_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimentacoes_financeiras
    ADD CONSTRAINT movimentacoes_financeiras_pkey PRIMARY KEY (id);


--
-- Name: retornos retornos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.retornos
    ADD CONSTRAINT retornos_pkey PRIMARY KEY (id);


--
-- Name: servicos servicos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.servicos
    ADD CONSTRAINT servicos_pkey PRIMARY KEY (id);


--
-- Name: usuarios usuarios_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key UNIQUE (email);


--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- Name: agendamentos gerar_retorno_ao_realizar; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER gerar_retorno_ao_realizar AFTER UPDATE OF status ON public.agendamentos FOR EACH ROW WHEN ((((new.status)::text = 'realizado'::text) AND ((old.status)::text IS DISTINCT FROM 'realizado'::text))) EXECUTE FUNCTION public.criar_retorno_automatico();


--
-- Name: agendamento_servicos agendamento_servicos_agendamento_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agendamento_servicos
    ADD CONSTRAINT agendamento_servicos_agendamento_id_fkey FOREIGN KEY (agendamento_id) REFERENCES public.agendamentos(id) ON DELETE CASCADE;


--
-- Name: agendamento_servicos agendamento_servicos_servico_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agendamento_servicos
    ADD CONSTRAINT agendamento_servicos_servico_id_fkey FOREIGN KEY (servico_id) REFERENCES public.servicos(id);


--
-- Name: agendamentos agendamentos_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agendamentos
    ADD CONSTRAINT agendamentos_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id);


--
-- Name: historico_procedimentos historico_procedimentos_agendamento_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historico_procedimentos
    ADD CONSTRAINT historico_procedimentos_agendamento_id_fkey FOREIGN KEY (agendamento_id) REFERENCES public.agendamentos(id);


--
-- Name: historico_procedimentos historico_procedimentos_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historico_procedimentos
    ADD CONSTRAINT historico_procedimentos_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id);


--
-- Name: historico_procedimentos historico_procedimentos_servico_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historico_procedimentos
    ADD CONSTRAINT historico_procedimentos_servico_id_fkey FOREIGN KEY (servico_id) REFERENCES public.servicos(id);


--
-- Name: movimentacoes_financeiras movimentacoes_financeiras_agendamento_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimentacoes_financeiras
    ADD CONSTRAINT movimentacoes_financeiras_agendamento_id_fkey FOREIGN KEY (agendamento_id) REFERENCES public.agendamentos(id);


--
-- Name: retornos retornos_agendamento_origem_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.retornos
    ADD CONSTRAINT retornos_agendamento_origem_id_fkey FOREIGN KEY (agendamento_origem_id) REFERENCES public.agendamentos(id);


--
-- Name: retornos retornos_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.retornos
    ADD CONSTRAINT retornos_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id);


--
-- Name: retornos retornos_servico_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.retornos
    ADD CONSTRAINT retornos_servico_id_fkey FOREIGN KEY (servico_id) REFERENCES public.servicos(id);


--
-- PostgreSQL database dump complete
--

\unrestrict wq0b0otigTxSJ2itjfOn0TwlwXmmYNUj1nWZZGgtJg4e9KtttYyUNK5Tnj3GkcB

