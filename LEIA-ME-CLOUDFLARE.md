# YOUR Magazine — publicar no Cloudflare Workers

Este ZIP contém o projeto-fonte completo, preparado para Next.js + OpenNext no Cloudflare Workers. Não é um site estático e não deve ser arrastado para o upload do Cloudflare Pages. O Admin, o envio de pautas, os PDFs e os uploads precisam de servidor e PostgreSQL.

## O que vem no arquivo

- `src/`: páginas, Admin, APIs, catálogo, matérias e conteúdo inicial.
- `public/brand/`: logo oficial e fotografias do fundador.
- `wrangler.toml`: configuração real do Worker, sem proxy ORIGIN.
- `open-next.config.ts`: adaptador OpenNext.
- `scripts/cloudflare.mjs`: build e publicação.
- `.env.example`: nomes de variáveis, sem suas senhas.
- `package.json` e `package-lock.json`: versões reproduzíveis das dependências.

Não estão incluídos `.env`, tokens, chaves, credenciais do banco, formulários recebidos ou backup do banco do preview. As matérias e o catálogo iniciais estão incluídos. Edições feitas apenas no banco atual e anexos enviados precisam de backup/migração PostgreSQL se você quiser mantê-los no novo banco.

## Alternativa sem download: enviar direto ao GitHub

Se a plataforma bloquear o ZIP, não é necessário baixá-lo:

1. Entre no Admin com sua senha. O login usa um token em memória e não depende de cookies de terceiros.
2. Clique em **Publicar sem ZIP**, no Admin, ou **Publicar / Exportar**, no canto inferior esquerdo.
3. Crie na sua conta GitHub um repositório privado dedicado ao portal.
4. No GitHub, gere um fine-grained personal access token temporário com acesso apenas a esse repositório e permissão **Contents: Read and write**.
5. Preencha a URL e o token no formulário de exportação, confirme a autorização e clique em **Enviar projeto ao meu GitHub — sem ZIP**. Nunca envie tokens nesta conversa.
6. O token não é salvo no portal e o campo é limpo após o envio. Você pode revogar a autorização no GitHub depois.
7. Se o GitHub confirmar, o portal mostra a URL do repositório e a quantidade real de arquivos enviados. Continue no passo 4 abaixo para conectar o repositório ao Cloudflare.

A transferência de código não é uma publicação automática do site. Ainda são necessários o deploy na sua conta e um banco PostgreSQL público. Arquivos de mesmo nome são atualizados; use um repositório novo ou dedicado.

## Acesso administrativo persistente

A senha administrativa fica armazenada somente como hash PBKDF2 na tabela `admin_credentials`, e as sessões revogáveis são registradas no banco somente por hash do token. O login já retorna os dados do editor, sem uma segunda autenticação. As requisições protegidas podem enviar a sessão no corpo JSON/FormData para funcionar mesmo quando a prévia remove cookies e cabeçalhos especiais. Tokens nunca são incluídos nas URLs. A ausência de `ADMIN_PASSWORD` em uma próxima inicialização não invalida a senha que já foi configurada nesse banco. As tabelas de credenciais e de sessões não integram o ZIP nem a exportação de conteúdo.

Em um banco de produção novo, configure `ADMIN_PASSWORD` no Worker antes do primeiro login. A senha do banco de prévia não é exportada. Para configurar ou redefinir por terminal, forneça `ADMIN_PASSWORD` como variável de ambiente e execute `npx tsx scripts/configure-admin.ts`.

## Caminho recomendado: GitHub + Workers Builds

### 1. Baixe e extraia o ZIP

Na própria prévia do portal, clique em **Baixar ZIP** (canto inferior esquerdo), depois em **Preparar arquivo ZIP** e, quando estiver pronto, **Salvar ZIP no computador**. O download é feito pela prévia atual, sem abrir o host temporário em outra aba. Um 403 com “Unable to resume sandbox” é um bloqueio da plataforma, não uma resposta do portal; não reutilize links externos de previews antigos.

Extraia `your-magazine-cloudflare.zip`. Abra a pasta `your-magazine`. Você deve ver `package.json`, `wrangler.toml`, `src` e `public` na mesma pasta.

### 2. Crie um banco PostgreSQL público

Recomendo um projeto novo no Neon (https://neon.tech). Em **Connect**, selecione PostgreSQL / Node.js e copie a connection string com SSL. Ela terá o formato `postgresql://USUARIO:SENHA@HOST/BANCO?sslmode=require`.

- A conexão do preview `127.0.0.1:5432` não funciona no Cloudflare.
- A chave pública/anon do Supabase também não é uma connection string PostgreSQL.
- Se usar Supabase, use a conexão PostgreSQL/pooler em **Connect**, com a senha do banco.
- Use um banco dedicado: na primeira visita, o portal cria as tabelas e carrega o conteúdo inicial.
- Nas próximas publicações, as alterações do Admin não são apagadas.

### 3. Crie um repositório privado no GitHub

1. Entre em https://github.com e crie um repositório privado chamado `your-magazine`.
2. Use **Add file > Upload files**.
3. Envie o conteúdo da pasta extraída: `src`, `public`, `scripts` e os arquivos da raiz. Não envie apenas o ZIP.
4. Confirme que `package.json` está na raiz do repositório, não dentro de uma segunda pasta.
5. Não envie `.env`, `.dev.vars`, `node_modules`, `.next` ou senhas.
6. Se o upload web avisar sobre o limite de arquivos, envie por etapas ou use GitHub Desktop: copie os arquivos para o repositório local, faça Commit e Publish/Push.

### 4. Crie o Worker no Cloudflare

1. Entre em https://dash.cloudflare.com.
2. Vá em **Workers & Pages > Create application > Connect Git** (ou **Import a repository**).
3. Selecione GitHub e autorize o repositório `your-magazine`.
4. Escolha **Workers**. Não escolha o upload estático do Pages.
5. Nome do Worker: `your-magazine` (igual a `name` no `wrangler.toml`).
6. Branch: `main`.
7. Root directory: deixe em branco se `package.json` está na raiz.
8. Build command:

   `node scripts/cloudflare.mjs build`

9. Deploy command:

   `node scripts/cloudflare.mjs deploy`

10. Se houver um campo de instalação, use `npm ci`; normalmente o Cloudflare detecta o `package-lock.json` e instala automaticamente.
11. Use Node.js 22 (variável de build `NODE_VERSION=22`).
12. Confirme o deploy. O build não precisa das credenciais do banco.

O script executa Next.js com Webpack e gera o Worker em `.open-next/worker.js`. Não use somente `npm run build` para o deploy no Cloudflare: falta a conversão do OpenNext.

### 5. Adicione os 2 segredos de execução

Em **Workers & Pages > your-magazine > Settings > Variables and Secrets**, adicione como **Secret**:

| Nome | Valor |
| --- | --- |
| `DATABASE_URL` | A connection string PostgreSQL pública com SSL do passo 2 |
| `ADMIN_PASSWORD` | A senha que você definiu para o Admin |

São variáveis do Worker em execução. `AUTH_SECRET` não é mais necessário: as sessões são verificadas e revogadas diretamente no banco. Não basta adicioná-las em **Build variables**. Não coloque `NEXT_PUBLIC_` na frente desses nomes.

Salve e use **Deploy / Save and deploy** se o painel pedir. Até configurar `DATABASE_URL`, as páginas que precisam do banco podem dar erro.

### 6. Abra o site

O Cloudflare mostra um endereço como `https://your-magazine.SEU-SUBDOMINIO.workers.dev`.

1. Abra `/api/health`: deve retornar `{"ok":true}`.
2. Abra `/pt`: o conteúdo inicial é criado no primeiro acesso; essa visita pode demorar mais.
3. Abra `/admin`: entre com a senha de `ADMIN_PASSWORD`.
4. Teste trocar texto/imagem e recarregar a página.
5. Teste `/pt/press#enviar-pauta` e confira o envio em **Admin > Central de Pautas**.
6. Teste um PDF e uma imagem enviada.

O build OpenNext e a inicialização foram testados localmente no runtime Workers. A publicação na sua conta e a conexão ao seu banco remoto ainda dependem das suas credenciais. Alguns limites do plano gratuito podem não comportar todo o processamento do portal; consulte https://developers.cloudflare.com/workers/platform/pricing/ e considere Workers Paid para produção.

### 7. Coloque o domínio próprio

1. Adicione seu domínio à sua conta Cloudflare e conclua a configuração dos nameservers.
2. Abra **Workers & Pages > your-magazine > Settings > Domains & Routes > Add > Custom Domain**.
3. Digite o domínio ou subdomínio e confirme.
4. Se quiser o domínio raiz e `www`, adicione ambos.
5. Aguarde a ativação do certificado e teste o HTTPS antes de remover a publicação antiga.

## Publicação por terminal (alternativa)

Na pasta onde está `package.json`:

1. `npm ci`
2. `npx wrangler login`
3. `node scripts/cloudflare.mjs build`
4. `node scripts/cloudflare.mjs deploy`
5. `npx wrangler secret put DATABASE_URL`
6. `npx wrangler secret put ADMIN_PASSWORD`

O nome de usuário é autorizado no navegador por `wrangler login`. Não inclua senhas diretamente na linha de comando.

## Hyperdrive (opcional)

O código também aceita o binding `HYPERDRIVE`, usando `getCloudflareContext()`. Para esse modo, crie a configuração no painel do Hyperdrive e preencha o bloco comentado em `wrangler.toml`. O identificador do Hyperdrive não é uma `DATABASE_URL`; são formas distintas de conexão. Para o primeiro deploy, o segredo `DATABASE_URL` de um PostgreSQL público é o caminho mais simples.

## Dúvidas comuns

- **Onde arrasto o ZIP?** Em nenhum campo do Pages. Extraia-o, envie os fontes ao GitHub e conecte como Worker.
- **Preciso de um segundo servidor?** Não. O OpenNext executa o Next.js no Worker. Só o PostgreSQL precisa estar acessível externamente.
- **Uso D1?** Não neste pacote. O schema é PostgreSQL/Drizzle; não foi convertido para SQLite/D1.
- **Banco recusou a conexão?** Confira SSL, usuário, senha, hostname público e regras de rede. Veja os logs em Observability do Worker.
- **Admin perde a sessão na prévia?** Use a versão atual: o login já devolve o painel autenticado na mesma resposta e as operações usam sessão no corpo JSON/FormData, sem depender de cookies ou cabeçalhos especiais.
- **Deploy passou, site dá erro?** Confira os 2 segredos em execução e os logs. Não publique a URL local do preview como banco.
- **Fiz alterações no Admin e vou publicar novamente. Vou perder?** Não. Use o mesmo banco; o bootstrap não substitui configurações existentes.
- **O ZIP contém minhas pautas privadas?** Não. Um backup privado do PostgreSQL é separado do código-fonte.
