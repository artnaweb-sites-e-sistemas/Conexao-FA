import { db } from '@/lib/firebase';
import {
    collection,
    doc,
    getDocs,
    addDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    serverTimestamp,
    getDoc
} from 'firebase/firestore';
import { UserProfile, Role } from '@/types';
import { auditService } from './auditService';

const COLLECTION = 'users';
const INVITES_COLLECTION = 'invites';

export interface Invite {
    id: string;
    email: string;
    name: string;
    role: Role;
    createdAt: any;
}

export const userService = {
    // Getting all users (Admin only usually)
    async getAll() {
        const snapshot = await getDocs(collection(db, COLLECTION));
        return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as unknown as UserProfile));
    },

    // Update a user profile
    async update(uid: string, data: Partial<UserProfile>) {
        await updateDoc(doc(db, COLLECTION, uid), data);
        await auditService.log('update_user', 'user', uid, data);
    },

    // Invites Management
    async getAllInvites() {
        const snapshot = await getDocs(collection(db, INVITES_COLLECTION));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invite));
    },

    async createInvite(data: Omit<Invite, 'id' | 'createdAt'>) {
        const normalizedEmail = data.email.trim().toLowerCase();

        // Using email as Document ID ensures uniqueness and simpler lookup/rules
        // Check if user already exists
        const usersQ = query(collection(db, COLLECTION), where("email", "==", normalizedEmail));
        const usersSnapshot = await getDocs(usersQ);
        if (!usersSnapshot.empty) {
            throw new Error("Usuário já cadastrado no sistema.");
        }

        // Use setDoc to force the ID to be the email
        await setDoc(doc(db, INVITES_COLLECTION, normalizedEmail), {
            ...data,
            email: normalizedEmail,
            createdAt: serverTimestamp()
        });

        await auditService.log('create_invite', 'user', normalizedEmail, { ...data, email: normalizedEmail });
        return normalizedEmail;
    },

    async deleteInvite(emailId: string) {
        // ID is now the email itself
        await deleteDoc(doc(db, INVITES_COLLECTION, emailId));
        await auditService.log('delete_invite', 'user', emailId);
    },

    async getInviteByEmail(email: string) {
        const normalizedEmail = email.trim().toLowerCase();
        // Direct GET by ID pattern
        const docRef = doc(db, INVITES_COLLECTION, normalizedEmail);
        const snapshot = await getDoc(docRef);

        if (!snapshot.exists()) return null;
        return { id: snapshot.id, ...snapshot.data() } as Invite;
    },

    async deleteUser(uid: string) {
        await deleteDoc(doc(db, COLLECTION, uid));
        await auditService.log('delete_user', 'user', uid);
    }
};
