import { useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useAuthStore } from '@/store/authStore';
import { UserProfile } from '@/types';

export function useAuthInit() {
    const { setUser, setProfile, setLoading } = useAuthStore();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            try {
                if (firebaseUser) {
                    setUser(firebaseUser);
                    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
                    if (userDoc.exists()) {
                        setProfile(userDoc.data() as UserProfile);
                    } else {
                        // Edge case: User created but no profile yet (e.g. half-finished registration)
                        setProfile(null);
                    }
                } else {
                    setUser(null);
                    setProfile(null);
                }
            } catch (err) {
                console.error("Auth init error", err);
                setProfile(null);
            } finally {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, [setUser, setProfile, setLoading]);
}
