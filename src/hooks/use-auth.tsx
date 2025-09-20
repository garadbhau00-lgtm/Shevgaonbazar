
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

    const handleLogout = useCallback(async () => {
        try {
            await signOut(auth);
            // onAuthStateChanged will handle the rest
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
            // onAuthStateChanged will handle login toasts and state updates
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
        let profileUnsubscribe: Unsubscribe | null = null;

        const authUnsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            // Clean up old profile listener if it exists
            if (profileUnsubscribe) {
                profileUnsubscribe();
                profileUnsubscribe = null;
            }

            if (firebaseUser) {
                // User is signed in.
                const wasAlreadyLoggedIn = !!user; // Check if there was a user *before* this auth state change
                
                profileUnsubscribe = onSnapshot(doc(db, "users", firebaseUser.uid), (docSnap) => {
                    if (docSnap.exists()) {
                        const profileData = docSnap.data() as UserProfile;

                        if (profileData.disabled) {
                            toast({ variant: 'destructive', title: 'खाते अक्षम केले आहे', description: 'तुमचे खाते प्रशासकाने अक्षम केले आहे.' });
                            signOut(auth); // This will trigger onAuthStateChanged again to log out state
                            return;
                        }

                        // Set user and profile
                        setUser(firebaseUser);
                        setUserProfile(profileData);
                        setLoading(false);

                        // Only show welcome toast on a fresh login, not on profile updates
                        if (!wasAlreadyLoggedIn) {
                            toast({
                                title: "लॉगिन यशस्वी!",
                                description: "शेवगाव बाजारमध्ये तुमचे स्वागत आहे.",
                            });
                        }
                    } else {
                        // This might happen if a user's document is deleted from Firestore.
                        // Treat as an error and log them out.
                        toast({ variant: 'destructive', title: 'प्रोफाइल आढळले नाही', description: 'तुमचे वापरकर्ता प्रोफाइल सापडत नाही.' });
                        signOut(auth);
                    }
                }, (error) => {
                    console.error("Error fetching user profile:", error);
                    toast({ variant: 'destructive', title: 'प्रोफाइल आणण्यात त्रुटी', description: 'तुमचे प्रोफाइल लोड करण्यात अयशस्वी.' });
                    signOut(auth);
                });
            } else {
                // User is signed out.
                if (user) { // Only toast if there was a user before (i.e., this is a logout event)
                    toast({ title: 'तुम्ही यशस्वीरित्या लॉग आउट झाला आहात.' });
                }
                setUser(null);
                setUserProfile(null);
                setLoading(false);
            }
        });

        // Cleanup function to unsubscribe from both listeners when the provider unmounts
        return () => {
            authUnsubscribe();
            if (profileUnsubscribe) {
                profileUnsubscribe();
            }
        };
    // The empty dependency array is crucial. This effect should only run once.
    // All login/logout logic is handled by the onAuthStateChanged listener itself.
    }, []);


    return (
        <AuthContext.Provider value={{ user, userProfile, loading, handleLogout, handleGoogleSignIn }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
