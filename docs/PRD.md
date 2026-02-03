# Product Requirements Document (PRD) - Conexão FA

## 1. Visão Geral
Sistema web para gestão de clientes e documentos, conectando Profissionais (Médicos/Secretárias) a Clientes (Pacientes), com supervisão de Administradores. Foco em segurança, usabilidade e auditoria.

## 2. Perfis de Usuário
- **ADMIN**: Acesso total. Gerencia usuários, atribui clientes a profissionais, visualiza tudo.
- **PROFISSIONAL**: Visualiza e gerencia apenas os clientes atribuídos a ele. Avalia documentos.
- **CLIENTE**: Visualiza seus próprios dados e pendências. Faz upload de documentos.

## 3. Funcionalidades (MVP)
### 3.1 Autenticação
- Login com Email/Senha.
- Recuperação de senha.
- Controle de sessão persistente.

### 3.2 Gestão de Usuários (Admin)
- Listagem de usuários (Profissionais e Clientes).
- Criação/Edição de usuários.
- Desativação de acesso.
- **Vínculo**: Atribuir Cliente -> Profissional.

### 3.3 Gestão de Documentos
- **Cliente**: Upload de arquivos (IMG, PDF). Seleção de categoria (ex: Exames, Laudos).
- **Profissional/Admin**: Visualização e Download. Alteração de status (Pendente -> Aprovado/Recusado).
- **Regras**: Validação de tamanho/tipo no front e back (Storage Rules).

### 3.4 Pendências
- Sistema de checklist simples.
- Profissional cria pendência para cliente (ex: "Falta RG").
- Cliente vê pendência e resolve (geralmente via upload).

### 3.5 Dashboard
- Resumo visual de status (Pendências, novos uploads).

## 4. Requisitos Não-Funcionais
- **Segurança**: RBAC estrito via Firestore/Storage Rules.
- **Audit Log**: Registrar quem fez o que e quando (criação, edição, delete).
- **Performance**: Lazy loading, otimização de imagens.
- **UX**: Design premium, feedback visual (loading, toasts).

## 5. Estrutura de Rotas
- `/login`: Autenticação.
- `/`: Dashboard (redireciona conforme role).
- `/users`: Gestão de usuários (Admin).
- `/clients`: Lista de clientes (Admin/Profissional).
- `/clients/:id`: Detalhe do cliente (Docs, Pendências).
- `/documents`: Minha área de documentos (Cliente).

## 6. Modelo de Dados (Firestore)

### `users`
Coleção raiz. Dados de perfil e controle de acesso.
```typescript
{
  uid: string; // ID do Auth
  email: string;
  name: string;
  role: 'admin' | 'professional' | 'client';
  active: boolean;
  createdAt: timestamp;
}
```

### `clients`
Coleção raiz. Dados específicos do vínculo de atendimento.
```typescript
{
  id: string; // Auto-id ou igual user uid (preferível auto-id para flexibilidade)
  uid: string; // Link para user
  name: string; // Desnormalizado para facilidade
  assignedProfessionalIds: string[]; // Array de UIDs de profissionais
  status: 'active' | 'inactive';
  createdAt: timestamp;
}
```

### `documents`
Coleção raiz.
```typescript
{
  id: string;
  clientId: string; // Link para client
  uploadedByUid: string;
  category: string;
  note: string;
  filePath: string; // Caminho no Storage
  fileName: string;
  fileType: string;
  fileSize: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: timestamp;
}
```

### `todos` (Pendências)
Coleção raiz.
```typescript
{
  id: string;
  clientId: string;
  createdByUid: string;
  title: string;
  description: string;
  status: 'pending' | 'resolved';
  createdAt: timestamp;
}
```

### `audit_logs`
Coleção raiz.
```typescript
{
  id: string;
  actorUid: string;
  action: string;
  entity: 'user' | 'client' | 'document';
  entityId: string;
  timestamp: timestamp;
}
```

## 7. Regras de Segurança (Resumo)
- **Users**: Admin lê/escreve tudo. User lê o próprio.
- **Clients**: Admin lê/escreve. Profissional lê/escreve se `auth.uid in resource.data.assignedProfessionalIds`.
- **Documents**: Admin lê/escreve. Profissional lê/escreve se tiver acesso ao client. Cliente cria (upload) e lê os seus.
- **Audit**: Apenas criação permitida (append-only), ninguém edita/deleta.
