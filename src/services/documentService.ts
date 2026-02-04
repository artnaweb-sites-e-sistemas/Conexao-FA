import { db, storage } from '@/lib/firebase';
import {
    collection, addDoc, updateDoc, deleteDoc, doc, query, where, getDocs, orderBy, serverTimestamp, limit
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { auditService } from './auditService';
import { DocumentFile, DocumentStatus } from '@/types';

const COLLECTION = 'documents';

export const documentService = {
    async getByClientId(clientId: string, user?: { uid: string, role: string }) {
        // Base Query
        let q = query(
            collection(db, COLLECTION),
            where('clientId', '==', clientId),
            limit(100)
        );

        // Security Filter: Ensure we only query what we are allowed to read
        // This filters out legacy documents that lack permission fields, satisfying Firestore Rules
        if (user && user.role === 'professional') {
            q = query(q, where('assignedProfessionalIds', 'array-contains', user.uid));
        } else if (user && user.role === 'client') {
            q = query(q, where('clientUserId', '==', user.uid));
        }

        const snapshot = await getDocs(q);
        const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as unknown as DocumentFile));
        // Sort in memory (newest first)
        return docs.sort((a: any, b: any) => {
            const dateA = a.createdAt?.seconds || 0;
            const dateB = b.createdAt?.seconds || 0;
            return dateB - dateA;
        });
    },

    async getPendingCount(user: { uid: string, role: string }) {
        if (user.role !== 'professional') return 0;

        // Safe query: Filter in memory to avoid Index requirements
        const q = query(
            collection(db, COLLECTION),
            where('assignedProfessionalIds', 'array-contains', user.uid),
            limit(100)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.filter(d => d.data().status === 'pending').length;
    },

    async getRecent(limitCount: number, user?: { uid: string, role: string }) {
        let q;

        if (user && user.role === 'professional') {
            q = query(
                collection(db, COLLECTION),
                where('assignedProfessionalIds', 'array-contains', user.uid),
                limit(50)
            );
        } else if (user && user.role === 'client') {
            q = query(
                collection(db, COLLECTION),
                where('clientUserId', '==', user.uid),
                limit(50)
            );
        } else {
            // Admin
            q = query(
                collection(db, COLLECTION),
                orderBy('createdAt', 'desc'),
                limit(limitCount)
            );
        }

        const snapshot = await getDocs(q);
        const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as unknown as DocumentFile));

        return docs.sort((a: any, b: any) => {
            const dateA = a.createdAt?.seconds || 0;
            const dateB = b.createdAt?.seconds || 0;
            return dateB - dateA;
        }).slice(0, limitCount);
    },

    async upload(
        file: File,
        metadata: {
            clientId: string;
            uploadedByUid: string;
            uploadedByRole: string;
            category: string;
            note?: string;
            clientUserId?: string;           // New
            assignedProfessionalIds?: string[]; // New
        },
        onProgress?: (progress: number) => void
    ) {
        // 1. Generate ID for folder structure consistency
        // Note: We use addDoc later which generates its own ID, but we want consistency in Storage path.
        // So we might get a slight mismatch if we let addDoc generate ID. 
        // Better: doc(collection) generates a ref with ID.
        const newDocRef = doc(collection(db, COLLECTION));
        const docId = newDocRef.id;

        const path = `clients/${metadata.clientId}/documents/${docId}/${file.name}`;
        const storageRef = ref(storage, path);

        // 2. Upload Task
        const uploadTask = uploadBytesResumable(storageRef, file);

        return new Promise<void>((resolve, reject) => {
            uploadTask.on('state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    if (onProgress) onProgress(progress);
                },
                (error) => {
                    console.error("Upload error:", error);
                    reject(error);
                },
                async () => {
                    // 3. Upload Complete
                    try {
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

                        // 4. Create Firestore Document using the specific ID or allow standard addDoc? 
                        // Let's use setDoc on the generated ref to keep ID consistent with folder
                        // Import setDoc needed
                        const { setDoc } = await import('firebase/firestore');

                        await setDoc(newDocRef, {
                            clientId: metadata.clientId,
                            uploadedByUid: metadata.uploadedByUid,
                            uploadedByRole: metadata.uploadedByRole,
                            category: metadata.category,
                            note: metadata.note || '',
                            fileName: file.name,
                            fileType: file.type,
                            fileSize: file.size,
                            filePath: path,
                            downloadURL,
                            status: 'pending',
                            createdAt: serverTimestamp(),
                            updatedAt: serverTimestamp(),
                            clientUserId: metadata.clientUserId || null,
                            assignedProfessionalIds: metadata.assignedProfessionalIds || []
                        });

                        await auditService.log('document_uploaded', 'document', docId, { fileName: file.name, clientId: metadata.clientId });
                        resolve();
                    } catch (e) {
                        console.error("Firestore error:", e);
                        // Cleanup storage if firestore fails
                        await deleteObject(storageRef).catch(() => { });
                        reject(e);
                    }
                }
            );
        });
    },

    async updateStatus(docId: string, status: DocumentStatus, note?: string) {
        const data: any = { status, updatedAt: serverTimestamp() };
        if (note !== undefined) data.note = note;

        await updateDoc(doc(db, COLLECTION, docId), data);
        await auditService.log('document_status_changed', 'document', docId, { status });
    },

    async delete(docId: string, filePath: string) {
        // Delete from Storage first
        const storageRef = ref(storage, filePath);
        await deleteObject(storageRef).catch(err => console.warn("File not found in storage", err));

        // Delete from Firestore
        await deleteDoc(doc(db, COLLECTION, docId));
        await auditService.log('document_deleted', 'document', docId);
    }
};
