# Conexão FA - Sistema de Gestão

Plataforma unificada para interação entre Administradores, Profissionais (Contabilidade/Financeiro) e Clientes.

## 🚀 Funcionalidades Principais

### 1. Sistema de Convites Seguro
- Usuários não se cadastram livremente.
- O Admin gera um **Convite** (link único).
- O usuário acessa o link, valida o código e cria sua senha.
- O sistema vincula automaticamente o perfil criado ao convite e define o nível de permissão.

### 2. Gestão de Clientes & Atribuição
- Admin cadastra Empresas/Fichas de Clientes.
- Admin atribui **Profissionais** específicos a cada Empresa.
- Clientes são vinculados a um Usuário (Login) para acesso ao Portal do Cliente.

### 3. Gestão de Documentos (GED)
- Upload seguro de arquivos (PDF, Imagem, Office).
- Separação estrita: Cliente só vê seus docs. Profissional só vê docs de clientes atribuídos.
- Workflow: Envio -> Visualização -> Aprovação/Rejeição por profissional.

### 4. Gestão de Pendências (Feature G)
- Controle de solicitações/tarefas vinculadas ao cliente.
- **Admin**: Controle total (Criar/Resolver).
- **Profissional**: Abre solicitações para seus clientes e resolve.
- **Cliente**: Visualiza pendências e marca como resolvida (read-only em criação).
- **Segurança**: Isolamento total via regras de banco.

---

## 🔐 Perfis de Acesso

1. **ADMINISTRADOR** (`role: admin`)
   - Acesso total ao sistema.
   - Gestão de Usuários, Convites e Auditoria.
   - Gestão de Clientes e Atribuições.
   - Gestão Global de Documentos.
   - Deleção permanente de dados.

2. **PROFISSIONAL** (`role: professional`)
   - Portal dedicado.
   - Visualiza apenas **Meus Clientes** (atribuídos pelo admin).
   - Analisa documentos e gerencia status (Aprovado/Rejeitado).
   - Não pode excluir dados críticos.

3. **CLIENTE/EMPRESA** (`role: client`)
   - Portal dedicado.
   - Visualiza dashboard da sua empresa vinculada.
   - Envia documentos para a contabilidade.
   - Visualiza status dos arquivos.
   - Acesso estrito apenas aos seus dados.

---

## 🛠️ Instalação e Execução

### Pré-requisitos
- Node.js 18+
- Projeto Firebase configurado (Authentication, Firestore, Storage)

### Passos
1. Clone o repositório.
2. Instale dependências: `npm install`
3. Crie `.env` com credenciais do Firebase (baseado no `.env.example`).
4. **Segurança**: Copie o conteúdo de `firestore.rules` e `storage.rules` para as Regras do seu projeto Firebase Console.
5. Inicie: `npm run dev`

### Como criar o primeiro Admin?
Como o sistema é fechado via convites, o primeiro usuário deve ser criado manualmente no banco de dados para iniciar o ciclo:
1. Crie um usuário no Firebase Auth (Email/Senha).
2. Crie manualmente o documento correspondente em `users/{uid}` no Firestore:
   ```json
   {
     "email": "admin@seuemail.com",
     "name": "Super Admin",
     "role": "admin",
     "active": true,
     "createdAt": serverTimestamp()
   }
   ```

---

## 🛡️ Segurança & Arquitetura

- **Frontend**: React + Vite + TypeScript + TailwindCSS.
- **Rules (RBAC)**: Logica de negócio crítica implementada em `firestore.rules`. O frontend apenas reflete o que é permitido, mas o bloqueio real ocorre no banco.
- **Storage**: Arquivos isolados em `/clients/{clientId}/documents/`. A validação de tamanho (10MB) e tipo de arquivo é feita no servidor.
- **Auditoria**: Ações críticas (delete, change role, upload) geram logs na coleção `audit_logs`.

---

## 🧪 Como Testar o Fluxo Completo

1. **Fluxo Admin -> Profissional**:
   - Logue como Admin. Vá em Usuários -> Convites. Convide um email como "Professional".
   - Abra aba anônima com o link, aceite o convite (`/setup`).
   - Volte ao Admin, crie um Cliente "Empresa Teste" e atribua ao novo Profissional.
   - No perfil Profissional, verifique se a "Empresa Teste" aparece em "Meus Clientes".

2. **Fluxo Admin -> Cliente**:
   - Logue como Admin. Convide um email como "Client".
   - Aceite o convite e crie a senha.
   - No Admin > Clientes, edite a "Empresa Teste" e vincule ao "Usuário do Cliente" criado (campo: Usuário Vinculado).
   - Logue como Cliente. O sistema deve redirecionar para o Painel da Empresa Teste.
   - Faça upload de um documento.
   - Verifique se o Profissional vê esse documento na aba "Documentos".

---
Desenvolvido por Art na Web
