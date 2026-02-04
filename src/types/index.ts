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
    userId?: string; // Optional link to UserProfile
    name: string;
    assignedProfessionalIds: string[];
    active: boolean; // Using boolean instead of status string as requested
    createdAt: any; // Firestore Timestamp or string
    updatedAt?: any;
}

export type DocumentStatus = 'pending' | 'approved' | 'rejected';

export type UserRole = 'admin' | 'professional' | 'client';

export interface DocumentFile {
    id: string;
    clientId: string;
    uploadedByUid: string;
    uploadedByRole: UserRole;
    category: string;
    note: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    filePath: string;
    downloadURL: string;
    status: DocumentStatus;
    createdAt: any;
    updatedAt: any;
    // Denormalized permissions
    clientUserId?: string | null;
    assignedProfessionalIds?: string[];
}

export type TodoStatus = 'open' | 'resolved' | 'cancelled';

export interface Todo {
    id: string;
    clientId: string;
    title: string;
    description?: string;
    createdByUid: string;
    createdByRole: UserRole;
    assignedToRole: 'client' | 'professional';
    status: TodoStatus;
    createdAt: any;
    updatedAt: any;
    resolvedAt?: any;
    // Denormalized permissions
    clientUserId?: string | null;
    assignedProfessionalIds?: string[];
}

export interface AuditLog {
    id: string;
    action: string;
    targetCollection: string;
    targetId: string;
    performedBy: string; // uid
    performedByRole: UserRole;
    details: any;
    timestamp: any;
}
