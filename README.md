# Cálculo Judiciário

Aplicação SaaS em PHP puro para automatizar cálculos judiciais com atualização monetária pelo INPC e juros mensais. O projeto segue uma arquitetura MVC simples com TailwindCSS via CDN e geração de PDFs através do Dompdf.

## Estrutura de pastas

```
CALCULO/
├── app/
│   ├── Controllers/
│   ├── Models/
│   └── Views/
├── config/
├── public/
│   ├── css/
│   └── js/
├── storage/pdfs/
├── vendor/
├── database.sql
└── README.md
```

## Requisitos

- PHP 8.1 ou superior
- MySQL 5.7+ ou MariaDB equivalente
- Composer (para instalar o Dompdf)

## Instalação (ambiente local - XAMPP, Laragon, etc.)

1. Clone ou copie este diretório `CALCULO` para o diretório público do seu servidor local (`htdocs`, `www`, etc.).
2. Instale as dependências PHP:
   ```bash
   composer install
   ```
3. Crie o banco de dados e tabelas executando o script `database.sql` no MySQL:
   ```bash
   mysql -u root -p < database.sql
   ```
4. Configure as variáveis de ambiente (ex.: arquivo `.env`, `httpd-vhosts.conf`, ou painel da hospedagem):
   ```
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_NAME=calculo
   DB_USER=root
   DB_PASS=senha
   APP_BASE_URL=http://localhost/calculo/public
   ```
5. Acesse `http://localhost/calculo/public/index.php` no navegador e crie o primeiro usuário.

## Deploy na TurboCloud (ou cPanel similar)

1. Faça upload do diretório `CALCULO` para `public_html`.
2. Aponte o domínio/subdomínio para a pasta `public/` (via painel ou `.htaccess`). Caso não seja possível, mova o conteúdo de `public/` para o diretório raiz público e ajuste os caminhos.
3. Configure o banco MySQL via painel da hospedagem e execute `database.sql`.
4. Defina as variáveis de ambiente acima (a TurboCloud permite configurá-las no painel PHP).
5. Execute `composer install` no terminal da hospedagem (TurboCloud disponibiliza Composer) ou faça upload da pasta `vendor` gerada localmente.

## Fluxo principal

1. **Cadastro/Login** – o usuário cria uma conta com nome, e-mail e senha (armazenada com `password_hash`).
2. **Dashboard** – após o login, visualiza resumo dos cálculos do mês e últimos registros.
3. **Gerar cálculo** – formulário solicita valor base, datas e tipo de cálculo. A aplicação busca automaticamente o INPC mensal no endpoint `https://servicodados.ibge.gov.br/api/v3/agregados/1736/...`. Se a API estiver indisponível, o usuário pode informar manualmente o percentual acumulado.
4. **Processamento** – o valor base é corrigido pelo INPC acumulado e acrescido de juros mensais de 1% (cálculo proporcional em dias/30). O resultado é salvo na tabela `calculos`.
5. **PDF** – ao final, um PDF estilizado com Tailwind é gerado via Dompdf e armazenado em `storage/pdfs`.
6. **Histórico** – a lista “Meus Cálculos” permite baixar o PDF a qualquer momento.

## Notas técnicas

- Autenticação baseada em sessões (`session_start`) e verificação de `$_SESSION['user_id']` nas rotas protegidas.
- Consultas ao MySQL via PDO com prepared statements (`config/database.php`).
- Sanitização de entrada com `filter_input` e escape de saída com `htmlspecialchars`.
- O TailwindCSS é carregado por CDN. Personalizações adicionais podem ser feitas em `public/css/app.css`.
- O diretório `storage/pdfs` precisa de permissão de escrita pelo PHP.
- Em caso de falha na API do IBGE, é exibido um alerta e o cálculo utiliza o valor manual informado (ou segue sem correção).

## Scripts úteis

- `composer install` – instala o Dompdf e gera `vendor/autoload.php`.
- `php -S localhost:8000 -t public` – alternativa rápida para rodar o projeto sem servidor adicional.

## Segurança e evolução

- Adicione CSRF tokens em formulários para produção.
- Configure HTTPS e mantenha o PHP atualizado.
- Para outros índices (ex.: IPCA, IGP-M), adapte o método `CalculoController::buscarInpcAcumulado`.

Bom trabalho e bons cálculos!
