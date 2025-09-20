
'use client';

import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { onAuthStateChanged, User as FirebaseUser, signOut, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, onSnapshot, Unsubscribe, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { UserProfile } from '@/lib/types';
import { useToast } from './use-toast';
import { useRouter } from 'next/navigation';

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
    const router = useRouter();

    const handleLogout = useCallback(async () => {
        try {
            await signOut(auth);
            // The onAuthStateChanged listener will handle state updates and toasts.
        } catch (error) {
            console.error("Logout error", error);
            toast({ variant: 'destructive', title: 'लॉगआउट अयशस्वी', description: 'कृपया पुन्हा प्रयत्न करा.' });
        }
    }, [toast]);

    const handleGoogleSignIn = useCallback(async () => {
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);

            if (!userDoc.exists()) {
                const userRole = 'Farmer';
                await setDoc(userDocRef, {
                    uid: user.uid,
                    email: user.email,
                    name: user.displayName || user.email?.split('@')[0],
                    role: userRole,
                    disabled: false,
                    createdAt: serverTimestamp(),
                });
            }
            // The onAuthStateChanged listener will handle toast and redirects
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

    useEffect(() => {
        let unsubscribeSnapshot: Unsubscribe | undefined;

        const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
            // First, cleanup any existing snapshot listener
            if (unsubscribeSnapshot) {
                unsubscribeSnapshot();
                unsubscribeSnapshot = undefined;
            }
            
            // If a user is logged in
            if (firebaseUser) {
                const wasAlreadyLoggedIn = !!user; // Check if there was a user before this change
                const userDocRef = doc(db, 'users', firebaseUser.uid);

                unsubscribeSnapshot = onSnapshot(userDocRef, (docSnap) => {
                    if (docSnap.exists()) {
                        const profileData = docSnap.data() as UserProfile;
                        if (profileData.disabled) {
                            toast({ variant: 'destructive', title: 'खाते अक्षम केले आहे', description: 'तुमचे खाते प्रशासकाने अक्षम केले आहे.' });
                            handleLogout(); // This will trigger another auth state change to logged out
                        } else {
                            setUser(firebaseUser);
                            setUserProfile(profileData);
                            setLoading(false);
                            if (!wasAlreadyLoggedIn) { // Only toast on new login
                                 toast({
                                    title: "लॉगिन यशस्वी!",
                                    description: "शेवगाव बाजारमध्ये तुमचे स्वागत आहे.",
                                });
                            }
                        }
                    } else {
                        // This case can happen if the user's record is deleted from Firestore while they are logged in.
                        handleLogout();
                    }
                }, (error) => {
                    console.error("Error in profile snapshot listener:", error);
                    handleLogout();
                });

            } else { // If user is logged out
                if (user) { // Only show toast if there was a user before
                    toast({ title: 'तुम्ही यशस्वीरित्या लॉग आउट झाला आहात.' });
                }
                setUser(null);
                setUserProfile(null);
                setLoading(false);
            }
        });

        // Cleanup function for the auth listener
        return () => {
            unsubscribeAuth();
            if (unsubscribeSnapshot) {
                unsubscribeSnapshot();
            }
        };
    // The dependency array is intentionally sparse. 
    // We want this to run once and handle its own state.
    // handleLogout is memoized with useCallback.
    // `user` is added to correctly toast on logout.
    }, [user, handleLogout, toast]);

    return (
        <AuthContext.Provider value={{ user, userProfile, loading, handleLogout, handleGoogleSignIn }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
