
'use client';

import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { onAuthStateChanged, User as FirebaseUser, signOut, signInWithPopup } from 'firebase/auth';
import { doc, onSnapshot, Unsubscribe, DocumentData, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '@/lib/firebase';
import type { UserProfile } from '@/lib/types';
import { useToast } from './use-toast';

interface AuthContextType {
    user: FirebaseUser | null;
    userProfile: UserProfile | null;
    loading: boolean;
    handleLogout: () => Promise<void>;
    handleGoogleSignIn: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    userProfile: null,
    loading: true,
    handleLogout: async () => {},
    handleGoogleSignIn: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const handleLogout = useCallback(async () => {
        try {
            await signOut(auth);
            toast({ title: 'तुम्ही यशस्वीरित्या लॉग आउट झाला आहात.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'लॉगआउट अयशस्वी', description: 'कृपया पुन्हा प्रयत्न करा.' });
        }
    }, [toast]);

    const handleGoogleSignIn = useCallback(async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);

            if (!userDoc.exists()) {
                const userRole = 'Farmer';
                await setDoc(userDocRef, {
                    uid: user.uid,
                    email: user.email,
                    name: user.displayName,
                    role: userRole,
                    disabled: false,
                    createdAt: serverTimestamp(),
                });
                toast({
                    title: "खाते तयार झाले!",
                    description: `तुम्ही आता '${userRole}' म्हणून लॉग इन आहात.`,
                });
            } else {
                 toast({
                    title: "लॉगिन यशस्वी!",
                    description: "शेवगाव बाजारमध्ये तुमचे स्वागत आहे.",
                });
            }
        } catch (error) {
            console.error("Google sign-in error", error);
            toast({ variant: 'destructive', title: 'Google साइन-इन अयशस्वी', description: 'कृपया पुन्हा प्रयत्न करा.' });
        }
    }, [toast]);

    useEffect(() => {
        let unsubscribeSnapshot: Unsubscribe | undefined;

        const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
            if (unsubscribeSnapshot) {
                unsubscribeSnapshot();
                unsubscribeSnapshot = undefined;
            }

            if (firebaseUser) {
                setUser(firebaseUser);
                const userDocRef = doc(db, 'users', firebaseUser.uid);
                unsubscribeSnapshot = onSnapshot(userDocRef, (docSnap) => {
                    if (docSnap.exists()) {
                        setUserProfile(docSnap.data() as UserProfile);
                    } else {
                        setUserProfile(null);
                    }
                    setLoading(false);
                }, (error) => {
                    console.error("Error in snapshot listener:", error);
                    setUserProfile(null);
                    setLoading(false);
                });
            } else {
                setUser(null);
                setUserProfile(null);
                setLoading(false);
            }
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeSnapshot) {
                unsubscribeSnapshot();
            }
        };
    }, []);

    return (
        <AuthContext.Provider value={{ user, userProfile, loading, handleLogout, handleGoogleSignIn }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
