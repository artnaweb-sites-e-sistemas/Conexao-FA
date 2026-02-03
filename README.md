# Conexão FA - Sistema de Gestão

Aplicação web Full Stack para gestão de clientes e documentos, desenvolvida com React, TypeScript e Firebase.

## 🚀 Tecnologias

- **Frontend**: React, TypeScript, Vite
- **Estilização**: Tailwind CSS, Lucide Icons, Shadcn/UI patterns
- **Estado**: Zustand
- **Formulários**: React Hook Form + Zod
- **Backend (Serverless)**: Firebase (Auth, Firestore, Storage)

## 🛠️ Configuração e Instalação

1. **Clone o repositório**
   ```bash
   git clone https://github.com/artnaweb-sites-e-sistemas/Conexao-FA.git
   cd Conexao-FA
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Configure as Variáveis de Ambiente**
   Crie um arquivo `.env` na raiz baseado no exemplo abaixo (já configurado no projeto):
   ```
   VITE_FIREBASE_API_KEY="..."
   VITE_FIREBASE_AUTH_DOMAIN="..."
   ...
   ```

4. **Execute localmente**
   ```bash
   npm run dev
   ```

## 🔐 Perfis de Acesso (RBAC)

O sistema possui 3 níveis de acesso definidos no campo `role` do usuário no Firestore (`users/{uid}`):

1. **ADMIN**:
   - Gestão completa de usuários (criar/editar profissionais e clientes).
   - Visualização de todos os documentos e auditoria.
   - Atribuição de clientes a profissionais.

2. **PROFISSIONAL**:
   - Visualiza apenas clientes atribuídos a ele.
   - Gerencia pendências e avalia documentos dos seus clientes.

3. **CLIENTE**:
   - Visualiza apenas seus próprios dados.
   - Realiza upload de documentos e consulta pendências.

## 📂 Estrutura do Projeto

- `src/components`: Componentes reutilizáveis (UI, Layouts).
- `src/hooks`: Custom hooks (Auth, Firestore).
- `src/pages`: Telas da aplicação organizadas por módulo.
- `src/store`: Gerenciamento de estado global (Zustand).
- `src/lib`: Configurações de serviços (Firebase).
- `src/types`: Definições de tipos TypeScript compartilhados.

## 🛡️ Segurança

A segurança é garantida via **Firestore Security Rules** e validações no frontend.
- O acesso de leitura/escrita é estritamente validado pelo `uid` e `role` do usuário autenticado.
- Arquivos no Storage também seguem regras de pasta por usuário/cliente.

## 📄 Regras de Negócio e Docs

Consulte a pasta `docs/` para:
- `PRD.md`: Documento de Requisitos do Produto.
- `ARCHITECTURE.md`: Detalhes da arquitetura (se houver).
