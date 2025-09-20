
'use client';

import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { onAuthStateChanged, User as FirebaseUser, signOut, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, onSnapshot, Unsubscribe, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
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
    
    // Listen for auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                 if (user?.uid !== firebaseUser.uid) { // Check if it's a new user login
                    setUser(firebaseUser);
                }
            } else {
                setUser(null);
                setUserProfile(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    // Listen for user profile changes
    useEffect(() => {
        if (!user) {
            setUserProfile(null);
            return;
        }

        const unsubscribe = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
            if (docSnap.exists()) {
                const profileData = docSnap.data() as UserProfile;
                if (profileData.disabled) {
                    toast({ variant: 'destructive', title: 'खाते अक्षम केले आहे', description: 'तुमचे खाते प्रशासकाने अक्षम केले आहे.' });
                    signOut(auth);
                } else {
                    setUserProfile(profileData);
                }
            } else {
                // This might happen if a user is created via auth but their doc creation fails.
                // We can try to create it here as a fallback.
                console.error("User profile document not found. This should not happen.");
            }
        });

        return () => unsubscribe();

    }, [user, toast]);


    const handleLogout = useCallback(async () => {
        try {
            await signOut(auth);
            toast({ title: 'तुम्ही यशस्वीरित्या लॉग आउट झाला आहात.' });
        } catch (error) {
            console.error("Logout error", error);
            toast({ variant: 'destructive', title: 'लॉगआउट अयशस्वी', description: 'कृपया पुन्हा प्रयत्न करा.' });
        }
    }, [toast]);

    const handleGoogleSignIn = useCallback(async () => {
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            const signedInUser = result.user;

            const userDocRef = doc(db, 'users', signedInUser.uid);
            const userDoc = await getDoc(userDocRef);

            if (!userDoc.exists()) {
                const userRole = 'Farmer';
                await setDoc(userDocRef, {
                    uid: signedInUser.uid,
                    email: signedInUser.email,
                    name: signedInUser.displayName || signedInUser.email?.split('@')[0],
                    role: userRole,
                    disabled: false,
                    createdAt: serverTimestamp(),
                });
            }
            toast({
                title: "लॉगिन यशस्वी!",
                description: "शेवगाव बाजारमध्ये तुमचे स्वागत आहे.",
            });
        } catch (error: any) {
            console.error("Google sign-in error", error);
             if (error.code === 'auth/popup-closed-by-user') {
                 toast({
                    variant: "destructive",
                    title: 'Google साइन-इन रद्द केले',
                    description: 'तुम्ही साइन-इन विंडो बंद केली आहे.',
                });
            } else {
                toast({ variant: 'destructive', title: 'Google साइन-इन अयशस्वी', description: 'कृपया पुन्हा प्रयत्न करा.' });
            }
        }
    }, [toast]);
    
    return (
        <AuthContext.Provider value={{ user, userProfile, loading, handleLogout, handleGoogleSignIn }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
