-- ============================================================
-- RODEI — schema do banco (PostgreSQL)
-- Rode este arquivo direto no Postgres do seu EasyPanel:
--   psql $DATABASE_URL -f schema.sql
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- necessário pro gen_random_uuid()

-- Identidade = telefone, sem senha (autenticação via WhatsApp + link mágico)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telefone VARCHAR(20) UNIQUE NOT NULL,
  nome VARCHAR(100),
  veiculo VARCHAR(50),
  placa VARCHAR(10),
  magic_token VARCHAR(64) UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
  status VARCHAR(20) NOT NULL DEFAULT 'onboarding', -- onboarding | ativo | inadimplente
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_magic_token ON users(magic_token);
CREATE INDEX IF NOT EXISTS idx_users_telefone ON users(telefone);

-- Registro diário — o core do produto
CREATE TABLE IF NOT EXISTS daily_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  faturamento_bruto NUMERIC(10,2) NOT NULL,
  km_rodado NUMERIC(8,2),
  horas_trabalhadas NUMERIC(5,2),
  gasto_combustivel NUMERIC(10,2) NOT NULL DEFAULT 0,
  gasto_outros NUMERIC(10,2) NOT NULL DEFAULT 0,
  origem VARCHAR(10) NOT NULL DEFAULT 'whatsapp', -- whatsapp | formulario
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE(user_id, data)
);

CREATE INDEX IF NOT EXISTS idx_records_user_data ON daily_records(user_id, data DESC);

-- Assinatura via Mercado Pago
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mp_subscription_id VARCHAR(100),
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending | authorized | paused | cancelled
  valor NUMERIC(6,2) NOT NULL DEFAULT 30.00,
  proxima_cobranca DATE,
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);

-- Log bruto de mensagens — debug e auditoria do parsing por IA
CREATE TABLE IF NOT EXISTS message_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  mensagem_original TEXT,
  parsed_json JSONB,
  sucesso BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);
