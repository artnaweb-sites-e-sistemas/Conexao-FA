export type Role = 'admin' | 'professional' | 'client';

export interface UserProfile {
    uid: string;
    email: string;
    name: string;
    role: Role;
    active: boolean;
    createdAt: string;
}

export interface Client {
    id: string;
    uid: string;
    name: string;
    email: string; // Helper to display email
    assignedProfessionalIds: string[];
    status: 'active' | 'inactive';
    createdAt: string;
}

export type DocumentStatus = 'pending' | 'approved' | 'rejected';

export interface DocumentFile {
    id: string;
    clientId: string;
    uploadedByUid: string;
    category: string;
    note?: string;
    filePath: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    status: DocumentStatus;
    createdAt: string;
}

export interface AuditLog {
    id: string;
    actorUid: string;
    action: string;
    entity: 'user' | 'client' | 'document';
    entityId: string;
    timestamp: string;
}
