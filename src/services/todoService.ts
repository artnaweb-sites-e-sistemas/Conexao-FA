import { db } from '@/lib/firebase';
import {
    collection, addDoc, updateDoc, doc, query, where, getDocs, serverTimestamp, limit, orderBy
} from 'firebase/firestore';
import { auditService } from './auditService';
import { Todo, TodoStatus, UserRole } from '@/types';

const COLLECTION = 'todos';

export const todoService = {
    async getByClientId(clientId: string, user?: { uid: string, role: string }) {
        let q = query(
            collection(db, COLLECTION),
            where('clientId', '==', clientId),
            limit(100)
        );

        if (user && user.role === 'professional') {
            q = query(q, where('assignedProfessionalIds', 'array-contains', user.uid));
        } else if (user && user.role === 'client') {
            q = query(q, where('clientUserId', '==', user.uid));
        }

        const snapshot = await getDocs(q);
        const todos = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as unknown as Todo));

        return todos.sort((a: any, b: any) => {
            return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
        });
    },

    async getRecentOpen(limitCount: number, user?: { uid: string, role: string }) {
        let q;

        if (user && user.role === 'professional') {
            q = query(
                collection(db, COLLECTION),
                where('assignedProfessionalIds', 'array-contains', user.uid),
                where('status', '==', 'open'),
                limit(50)
            );
        } else if (user && user.role === 'client') {
            q = query(
                collection(db, COLLECTION),
                where('clientUserId', '==', user.uid),
                where('status', '==', 'open'),
                limit(50)
            );
        } else {
            // Admin - Query without orderBy to avoid Index requirement breakdown
            q = query(
                collection(db, COLLECTION),
                where('status', '==', 'open'),
                limit(100)
            );
        }

        const snapshot = await getDocs(q);
        const todos = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as unknown as Todo));

        return todos.sort((a: any, b: any) => {
            return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
        }).slice(0, limitCount);
    },

    async create(data: {
        clientId: string;
        title: string;
        description?: string;
        createdByUid: string;
        createdByRole: UserRole;
        assignedToRole: 'client' | 'professional';
        clientUserId?: string | null;
        assignedProfessionalIds?: string[];
    }) {
        const docRef = await addDoc(collection(db, COLLECTION), {
            ...data,
            status: 'open',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            clientUserId: data.clientUserId || null,
            assignedProfessionalIds: data.assignedProfessionalIds || []
        });

        await auditService.log('todo_created', 'todos', docRef.id, { title: data.title, clientId: data.clientId });
        return docRef.id;
    },

    async updateStatus(todoId: string, status: TodoStatus, userUid: string) {
        const updateData: any = {
            status,
            updatedAt: serverTimestamp()
        };

        if (status === 'resolved') {
            updateData.resolvedAt = serverTimestamp();
        }

        await updateDoc(doc(db, COLLECTION, todoId), updateData);
        await auditService.log('todo_status_changed', 'todos', todoId, { status, updatedBy: userUid });
    }
};
