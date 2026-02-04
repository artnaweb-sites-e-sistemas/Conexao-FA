import { db } from '@/lib/firebase';
import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    serverTimestamp,
    orderBy,
    limit
} from 'firebase/firestore';
import { Client } from '@/types';
import { auditService } from './auditService';

const COLLECTION = 'clients';

export interface ClientData extends Omit<Client, 'id' | 'createdAt'> {
    // mapped types for creation
}

export const clientService = {
    async getAll() {
        // Admin listing - strict rule will allow, others will fail if they try query all
        const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
    },

    async getById(id: string) {
        const docRef = doc(db, COLLECTION, id);
        const snap = await getDoc(docRef);
        if (!snap.exists()) return null;
        return { id: snap.id, ...snap.data() } as Client;
    },

    async create(data: Omit<Client, 'id' | 'createdAt' | 'assignedProfessionalIds'>) {
        // Check uniqueness of userId if provided
        if (data.userId) {
            const q = query(collection(db, COLLECTION), where('userId', '==', data.userId));
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                throw new Error('Este usuário já está vinculado a outro cliente.');
            }
        }

        const docRef = await addDoc(collection(db, COLLECTION), {
            ...data,
            assignedProfessionalIds: [],
            active: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });

        await auditService.log('client_created', 'client', docRef.id, data);
        return docRef.id;
    },

    async update(id: string, data: Partial<Client>) {
        // Check uniqueness if userId is being changed
        if (data.userId) {
            // If we are changing to a new userId, check if that new userId is taken
            // We need to exclude current doc from check (logic done by fetching first)
            const q = query(collection(db, COLLECTION), where('userId', '==', data.userId));
            const snapshot = await getDocs(q);
            const duplicate = snapshot.docs.find(d => d.id !== id);
            if (duplicate) {
                throw new Error('Este usuário já está vinculado a outro cliente.');
            }
        }

        await updateDoc(doc(db, COLLECTION, id), {
            ...data,
            updatedAt: serverTimestamp()
        });

        await auditService.log('client_updated', 'client', id, data);
    },

    // Professional Assignment
    async assignProfessionals(clientId: string, professionalIds: string[]) {
        await updateDoc(doc(db, COLLECTION, clientId), {
            assignedProfessionalIds: professionalIds, // This replaces the array. Logic should handle merging if UI sends partial, but usually UI sends full state.
            updatedAt: serverTimestamp()
        });
        await auditService.log('professional_assigned', 'client', clientId, { professionalIds });
    },

    // Helpers usually for Professional dashboard
    async getMyClients(professionalUid: string) {
        const q = query(
            collection(db, COLLECTION),
            where('assignedProfessionalIds', 'array-contains', professionalUid),
            where('active', '==', true),
            limit(100)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
    },

    async getMyClientByUserId(userId: string) {
        // For the Client Portal: Find the client document linked to this auth user
        const q = query(
            collection(db, COLLECTION),
            where('userId', '==', userId),
            where('active', '==', true),
            limit(1)
        );
        const snapshot = await getDocs(q);
        if (snapshot.empty) return null;
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() } as Client;
    },

    async delete(id: string) {
        await deleteDoc(doc(db, COLLECTION, id));
        await auditService.log('delete_client', 'client', id);
    }
};
