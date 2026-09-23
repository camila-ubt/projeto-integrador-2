-- Permite guardar o aniversário sem exigir o ano de nascimento.
-- As datas completas já cadastradas continuam disponíveis como legado.
ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS aniversario_dia_mes character varying(5);
