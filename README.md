# Rodei — controle de faturamento pra motorista de app

MVP completo: dashboard web (Next.js) + API + workflow de bot WhatsApp (n8n).

## O que já está pronto

- **Schema do banco** (`schema.sql`) — users, daily_records, subscriptions, message_log
- **API** (`app/api/`):
  - `POST /api/users` — onboarding do motorista (chamado pelo n8n)
  - `GET /api/users/lookup?telefone=` — verifica se motorista já existe (chamado pelo n8n)
  - `GET /api/records?token=` — busca registros do motorista (usado pelo dashboard)
  - `POST /api/records` — cria/atualiza o registro do dia (usado pelo formulário web **e** pelo n8n)
  - `POST /api/webhook/mercadopago` — esqueleto pra confirmação de pagamento (precisa plugar a consulta real na API do Mercado Pago, tem um TODO marcado no arquivo)
- **Dashboard** (`/r/[token]`) — instrument cluster com o dia de hoje, abas semana/mês/ano, gráfico e extrato
- **Formulário** (`/r/[token]/registrar`) — registro manual, mesma origem de dados do bot
- **Workflow n8n** (`n8n/rodei-whatsapp-workflow.json`) — pronto pra importar

## Passo a passo pra subir

### 1. Banco de dados

No Postgres que já roda no seu EasyPanel:

```bash
psql $DATABASE_URL -f schema.sql
```

### 2. Variáveis de ambiente

Copie `.env.example` pra `.env.local` (dev) ou configure direto no EasyPanel (prod):

```
DATABASE_URL=postgresql://...
INTERNAL_API_SECRET=<gere com: openssl rand -hex 32>
MERCADOPAGO_ACCESS_TOKEN=<pegue no painel do Mercado Pago>
```

### 3. Rodar local

```bash
npm install
npm run dev
```

### 4. Deploy no EasyPanel

Mesmo fluxo que você já usa pro resto do stack — sobe como app Next.js, aponta um subdomínio (sugestão: `rodei.sdzlab.com.br`), configura as env vars acima.

### 5. Importar o workflow no n8n

1. Abra seu n8n → **Import from File** → selecione `n8n/rodei-whatsapp-workflow.json`
2. Configure duas variáveis de ambiente no n8n: `RODEI_APP_URL` (ex: `https://rodei.sdzlab.com.br`) e `RODEI_INTERNAL_SECRET` (o mesmo valor de `INTERNAL_API_SECRET`)
3. **Atenção:** os nodes `Confirma registro`, `Pede pra refazer` e `Mensagem de boas-vindas` estão como placeholder (`n8n-nodes-base.evolutionApi`) — troque pelo node real do Evolution API que você já usa no seu n8n (provavelmente um community node ou um HTTP Request pra API do Evolution). A lógica e os textos das mensagens já estão prontos, só falta apontar pro node certo.
4. O node `Extrai dados (IA)` está configurado como Anthropic — confere se o nome do node bate com a versão do seu n8n e se a credencial da API está plugada.
5. Configure o **webhook da instância do Evolution API** pra apontar pro endpoint que o node `Webhook Evolution API` expõe (evento `MESSAGES_UPSERT`).

### 6. Mercado Pago

Falta plugar a parte de cobrança em si:
- Criar o plano de assinatura (`R$30/mês`) no painel do Mercado Pago
- Gerar o link de assinatura e mandar pro motorista (pode ser no fluxo de onboarding do bot)
- Completar o TODO em `app/api/webhook/mercadopago/route.ts` pra consultar o status real da assinatura e atualizar a tabela `subscriptions`

## Testando o fluxo sem o bot

Enquanto não pluga o WhatsApp de verdade, dá pra testar a API direto:

```bash
# Cria um usuário de teste
curl -X POST https://rodei.sdzlab.com.br/api/users \
  -H "Content-Type: application/json" \
  -H "x-internal-secret: SEU_SECRET" \
  -d '{"telefone": "5531999999999", "nome": "Teste"}'

# Pega o magic_token na resposta, abra https://rodei.sdzlab.com.br/r/{token}
```

## Próximos passos sugeridos (pós-MVP)

- Resposta do bot quando o motorista esquece um dia (lembrete às 22h se não registrou)
- Comparativo entre apps (Uber vs 99) se você expandir o escopo de captura
- Export de relatório em PDF (pro motorista mostrar pro contador)
