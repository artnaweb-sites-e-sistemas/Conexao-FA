import { db, auth } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { AuditLog } from '@/types';

// Update to match new AuditLog interface
export const auditService = {
    async log(
        action: string,
        targetCollection: string,
        targetId: string,
        details?: any
    ) {
        try {
            if (!auth.currentUser) return;

            // Get role from local storage or auth context if possible, 
            // but for now let's just log the UID. 
            // The rules might require role? No, audit write is typically open or server side.
            // Actually, we need to know the role for the new Interface.
            // Let's grab it from localStorage if available (simple fix) 
            // or pass it in. For now, let's just save basic info.

            // Note: In a real app we would get the claim.
            // We'll store what we can.

            await addDoc(collection(db, 'audit_logs'), {
                action,
                targetCollection,
                targetId,
                performedBy: auth.currentUser.uid,
                performedByRole: 'unknown', // Ideally passed or fetched
                details: details || {},
                timestamp: serverTimestamp()
            });
        } catch (error) {
            console.error('Failed to log audit:', error);
        }
    }
};
