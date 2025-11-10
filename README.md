# chat platform 

📋 Sumário

Sobre o Projeto
Funcionalidades Principais
Tecnologias Utilizadas
Autenticação JWT
Lazy Loading de Mensagens
Integração com OpenAI
Deploy na Azure
Banco de Dados
Executando Localmente
Estrutura do Projeto


🎯 Sobre o Projeto
Esta é uma plataforma de chat completa desenvolvida com .NET e Angular, que oferece duas experiências distintas:

Chat entre Usuários: Comunicação em tempo real entre usuários da plataforma
Chat com IA: Assistente inteligente integrado com a API da OpenAI para interações avançadas

✨ Funcionalidades Principais

✅ Sistema completo de autenticação e autorização
✅ Chat em tempo real entre usuários
✅ Assistente de IA integrado (OpenAI)
✅ Lazy loading otimizado para histórico de mensagens
✅ Interface responsiva e moderna
✅ Deploy automatizado com CI/CD
✅ Armazenamento seguro de tokens

🛠 Tecnologias Utilizadas
Backend

.NET 9.0
ASP.NET Core Web API - Construção da API RESTful usando Minimal API's
Scalar
Entity Framework Core - ORM para acesso ao banco de dados
SQL Server - Banco de dados relacional
JWT Bearer Authentication - Segurança e autenticação

Frontend

Angular 22
Angular Materials

Infraestrutura

Azure App Service 
Azure SQL Database
Azure Pipelines -Deploy automático

Integrações

OpenAI API - Inteligência Artificial conversacional


🔐 Autenticação JWT
O sistema implementa autenticação baseada em JSON Web Tokens (JWT), garantindo segurança e escalabilidade.
Como funciona:

Cadastro: Usuário cria uma conta com credenciais seguras
Login: Sistema valida as credenciais e gera um token JWT
Armazenamento: Token é armazenado no localStorage do navegador
Autorização: Token é enviado em todas as requisições autenticadas
Validação: Backend valida o token em cada requisição protegida

Fluxo de Autenticação
Página de Cadastro
Mostrar Imagem
Interface de cadastro com validação de dados em tempo real
Página de Login
Mostrar Imagem
Sistema de login com feedback visual de erros
Token no LocalStorage
Mostrar Imagem
Token JWT armazenado de forma segura no navegador
Segurança Implementada

✅ Senhas criptografadas com BCrypt
✅ Tokens com tempo de expiração configurável
✅ Refresh tokens para renovação segura
✅ Validação de claims e roles


🔄 Lazy Loading de Mensagens
Para otimizar a performance e a experiência do usuário, implementamos lazy loading no carregamento do histórico de mensagens.
Benefícios:

⚡ Performance: Carrega apenas as mensagens visíveis
📱 Economia de dados: Reduz o tráfego de rede
🎯 UX aprimorada: Scroll infinito suave e responsivo
🚀 Escalabilidade: Suporta conversas com milhares de mensagens


🤖 Integração com OpenAI
A plataforma conta com um assistente de IA inteligente, integrado à API da OpenAI, oferecendo respostas contextuais e naturais.
Mostrar Imagem
Interface do chat com assistente de IA integrado
Recursos do Chat com IA:

Configuração da API:
csharp// Exemplo da integração no backend
group.MapPost("/chatOpenai", async (
            ChatRequest request,
            IHttpClientFactory httpClientFactory,
            IConfiguration configuration) =>
        {
            var apiKey = configuration["OpenAI:ApiKey"];

            if (string.IsNullOrEmpty(apiKey))
                return Results.BadRequest(new { error = "API Key não configurada" });

            var client = httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

            var payload = new
            {
                model = "gpt-5",
                input = request.Message
            };

            var content = new StringContent(
                JsonSerializer.Serialize(payload),
                Encoding.UTF8,
                new MediaTypeHeaderValue("application/json")
            );

            try
            {
                var response = await client.PostAsync(
                    "https://api.openai.com/v1/responses",
                    content
                );

                var responseContent = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                    return Results.Json(new { error = responseContent }, statusCode: (int)response.StatusCode);

                return Results.Ok(JsonSerializer.Deserialize<object>(responseContent));
            }
            catch (HttpRequestException ex)
            {
                return Results.Json(new { error = ex.Message }, statusCode: 500);
            }
        });
  
☁️ Deploy na Azure
O projeto está hospedado na Microsoft Azure, com deploy automatizado via Azure Pipelines.
URLs de Acesso:

🌐 Frontend: https://chatplatformapp-ui.azurewebsites.net
🔧 Backend API: https://chatplatformapi.azurewebsites.net/scalar/

CI/CD Automatizado
O projeto utiliza Azure Pipelines com arquivo YML configurado para deploy automático:
yaml# azure-pipelines.yml
trigger:
- master

pool:
  vmImage: 'windows-latest'

variables:
  solution: '**/*.csproj'
  buildPlatform: 'Any CPU'
  buildConfiguration: 'Release'

steps:
- task: NuGetToolInstaller@1

- task: NuGetCommand@2
  inputs:
    restoreSolution: '$(solution)'

- task: VSBuild@1
  inputs:
    solution: '$(solution)'
    msbuildArgs: '/p:DeployOnBuild=true /p:WebPublishMethod=Package /p:PackageAsSingleFile=true /p:SkipInvalidConfigurations=true /p:PackageLocation="$(build.artifactStagingDirectory)"'
    platform: '$(buildPlatform)'
    configuration: '$(buildConfiguration)'

- task: PublishBuildArtifacts@1
  inputs:
    PathtoPublish: '$(build.artifactStagingDirectory)'
    ArtifactName: 'backend'
  
Vantagens do Deploy Automatizado:

🚀 Deploy automático ao fazer push na branch main
🔄 Rollback rápido em caso de erros
📊 Logs e monitoramento integrados
🔒 Variáveis de ambiente seguras


🗄️ Banco de Dados
O projeto utiliza SQL Server hospedado no Azure SQL Database, garantindo alta disponibilidade e performance.
Configuração do Banco local:
json {"ConnectionStrings": {
    "DefaultConnection": "Server=(localdb)\\MSSQLLocalDB;Database=ChatAppDb;Trusted_Connection=True"
  }
Estrutura Principal:

Users: Informações dos usuários
Messages: Mensagens do chat entre usuários
AIConversations: Histórico de conversas com IA
Tokens: Gerenciamento de tokens de autenticação

Migrations:
O projeto utiliza Entity Framework Core Migrations para versionamento do banco:
bash# Criar nova migration
dotnet ef migrations add NomeDaMigration

# Aplicar migrations
dotnet ef database update

🚀 Executando Localmente
Pré-requisitos

.NET SDK 9.0+
Node.js 22
SQL Server (Local ou Docker)
Conta OpenAI com API Key

Backend (.NET)
bash# 1. Clone o repositório
git clone https://github.com/stefanieborges/chat-platform.git

# 2. Navegue até a pasta do backend
cd API

# 3. Restaure as dependências
dotnet restore

# 4. Configure o appsettings.json
- Adicione suas configurações de banco e OpenAI API Key

# 5. Execute as migrations
dotnet ef database update

# 6. Execute o projeto com hot reload
dotnet watch run
A API estará disponível em: https://localhost:5000
Frontend (React)
bash# 1. Navegue até a pasta do cliente
cd client

# 2. Instale as dependências
npm install

# 3. Execute o projeto
npm start
A aplicação estará disponível em: http://localhost:4200
