# 💬 Chat Platform

<div align="center">

![.NET](https://img.shields.io/badge/.NET-9.0-512BD4?style=for-the-badge&logo=dotnet)
![Angular](https://img.shields.io/badge/Angular-22-DD0031?style=for-the-badge&logo=angular)
![Azure](https://img.shields.io/badge/Azure-0078D4?style=for-the-badge&logo=microsoft-azure)
![SQL Server](https://img.shields.io/badge/SQL_Server-CC2927?style=for-the-badge&logo=microsoft-sql-server)

**Plataforma de chat completa com comunicação em tempo real e assistente de IA integrado**

[Demo Frontend](https://chatplatformapp-ui.azurewebsites.net) • [API Backend](https://chatplatformapi.azurewebsites.net/scalar/)

</div>

---

## 📋 Sumário

- [Sobre o Projeto](#-sobre-o-projeto)
- [Funcionalidades Principais](#-funcionalidades-principais)
- [Tecnologias Utilizadas](#-tecnologias-utilizadas)
- [Autenticação JWT](#-autenticação-jwt)
- [Lazy Loading de Mensagens](#-lazy-loading-de-mensagens)
- [Integração com OpenAI](#-integração-com-openai)
- [Deploy na Azure](#️-deploy-na-azure)
- [Banco de Dados](#️-banco-de-dados)
- [Executando Localmente](#-executando-localmente)

---

## 🎯 Sobre o Projeto

Esta é uma plataforma de chat completa desenvolvida com .NET e Angular, que oferece duas experiências distintas:

- **Chat entre Usuários**: Comunicação em tempo real entre usuários da plataforma
- **Chat com IA**: Assistente inteligente integrado com a API da OpenAI para interações avançadas

---

## ✨ Funcionalidades Principais

- ✅ Sistema completo de autenticação e autorização
- ✅ Chat em tempo real entre usuários
- ✅ Assistente de IA integrado (OpenAI)
- ✅ Lazy loading otimizado para histórico de mensagens
- ✅ Interface responsiva e moderna
- ✅ Deploy automatizado com CI/CD
- ✅ Armazenamento seguro de tokens

---

## 🛠 Tecnologias Utilizadas

### Backend
- **.NET 9.0**
- **ASP.NET Core Web API** - Construção da API RESTful usando Minimal API's
- **Scalar** - Documentação da API
- **Entity Framework Core** - ORM para acesso ao banco de dados
- **SQL Server** - Banco de dados relacional
- **JWT Bearer Authentication** - Segurança e autenticação

### Frontend
- **Angular 22**
- **Angular Materials** - Componentes UI

### Infraestrutura
- **Azure App Service** - Hospedagem da aplicação
- **Azure SQL Database** - Banco de dados em nuvem
- **Azure Pipelines** - Deploy automático

### Integrações
- **OpenAI API** - Inteligência Artificial conversacional

---

## 🔐 Autenticação JWT

O sistema implementa autenticação baseada em JSON Web Tokens (JWT), garantindo segurança e escalabilidade.

### Como funciona:

1. **Cadastro**: Usuário cria uma conta com credenciais seguras
2. **Login**: Sistema valida as credenciais e gera um token JWT
3. **Armazenamento**: Token é armazenado no localStorage do navegador
4. **Autorização**: Token é enviado em todas as requisições autenticadas
5. **Validação**: Backend valida o token em cada requisição protegida

### Segurança Implementada

- ✅ Senhas criptografadas com BCrypt
- ✅ Tokens com tempo de expiração configurável
- ✅ Refresh tokens para renovação segura
- ✅ Validação de claims e roles

---

## 🔄 Lazy Loading de Mensagens

Para otimizar a performance e a experiência do usuário, implementamos lazy loading no carregamento do histórico de mensagens.

### Benefícios:

- ⚡ **Performance**: Carrega apenas as mensagens visíveis
- 📱 **Economia de dados**: Reduz o tráfego de rede
- 🎯 **UX aprimorada**: Scroll infinito suave e responsivo
- 🚀 **Escalabilidade**: Suporta conversas com milhares de mensagens

---

## 🤖 Integração com OpenAI

A plataforma conta com um assistente de IA inteligente, integrado à API da OpenAI, oferecendo respostas contextuais e naturais.

### Exemplo de Integração:

```csharp
group.MapPost("/chatOpenai", async (
    ChatRequest request,
    IHttpClientFactory httpClientFactory,
    IConfiguration configuration) =>
{
    var apiKey = configuration["OpenAI:ApiKey"];

    if (string.IsNullOrEmpty(apiKey))
        return Results.BadRequest(new { error = "API Key não configurada" });

    var client = httpClientFactory.CreateClient();
    client.DefaultRequestHeaders.Authorization = 
        new AuthenticationHeaderValue("Bearer", apiKey);

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
            return Results.Json(
                new { error = responseContent }, 
                statusCode: (int)response.StatusCode
            );

        return Results.Ok(
            JsonSerializer.Deserialize<object>(responseContent)
        );
    }
    catch (HttpRequestException ex)
    {
        return Results.Json(new { error = ex.Message }, statusCode: 500);
    }
});
```

---

## ☁️ Deploy na Azure

O projeto está hospedado na Microsoft Azure, com deploy automatizado via Azure Pipelines.

### URLs de Acesso:

- 🌐 **Frontend**: https://chatplatformapp-ui.azurewebsites.net
- 🔧 **Backend API**: https://chatplatformapi.azurewebsites.net/scalar/

### CI/CD Automatizado

O projeto utiliza Azure Pipelines com arquivo YML configurado para deploy automático:

```yaml
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
    msbuildArgs: '/p:DeployOnBuild=true /p:WebPublishMethod=Package'
    platform: '$(buildPlatform)'
    configuration: '$(buildConfiguration)'

- task: PublishBuildArtifacts@1
  inputs:
    PathtoPublish: '$(build.artifactStagingDirectory)'
    ArtifactName: 'backend'
```

### Vantagens do Deploy Automatizado:

- 🚀 Deploy automático ao fazer push na branch main
- 🔄 Rollback rápido em caso de erros
- 📊 Logs e monitoramento integrados
- 🔒 Variáveis de ambiente seguras

---

## 🗄️ Banco de Dados

O projeto utiliza SQL Server hospedado no Azure SQL Database, garantindo alta disponibilidade e performance.

### Configuração Local:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=(localdb)\\MSSQLLocalDB;Database=ChatAppDb;Trusted_Connection=True"
  }
}
```

### Estrutura Principal:

- **Users**: Informações dos usuários
- **Messages**: Mensagens do chat entre usuários
- **AIConversations**: Histórico de conversas com IA
- **Tokens**: Gerenciamento de tokens de autenticação

### Migrations:

```bash
# Criar nova migration
dotnet ef migrations add NomeDaMigration

# Aplicar migrations
dotnet ef database update
```

---

## 🚀 Executando Localmente

### Pré-requisitos

- .NET SDK 9.0+
- Node.js 22+
- SQL Server (Local ou Docker)
- Conta OpenAI com API Key

### Backend (.NET)

```bash
# 1. Clone o repositório
git clone https://github.com/stefanieborges/chat-platform.git

# 2. Navegue até a pasta do backend
cd API

# 3. Restaure as dependências
dotnet restore

# 4. Configure o appsettings.json
# Adicione suas configurações de banco e OpenAI API Key

# 5. Execute as migrations
dotnet ef database update

# 6. Execute o projeto com hot reload
dotnet watch run
```

**A API estará disponível em**: `https://localhost:5000`

### Frontend (Angular)

```bash
# 1. Navegue até a pasta do cliente
cd client

# 2. Instale as dependências
npm install

# 3. Execute o projeto
npm start
```

**A aplicação estará disponível em**: `http://localhost:4200`

---
