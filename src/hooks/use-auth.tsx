
'use client';

import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { onAuthStateChanged, User as FirebaseUser, signOut, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, onSnapshot, Unsubscribe, getDoc, setDoc, serverTimestamp, getDocs, collection, query, where } from 'firebase/firestore';
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

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
            setUser(firebaseUser);
            setLoading(false);
        });

        return () => unsubscribeAuth();
    }, []);

    useEffect(() => {
        let unsubscribeProfile: Unsubscribe | undefined;

        if (user) {
            setLoading(true);
            const userDocRef = doc(db, 'users', user.uid);
            unsubscribeProfile = onSnapshot(userDocRef, (docSnap) => {
                if (docSnap.exists()) {
                    const profileData = docSnap.data() as UserProfile;
                     if (profileData.disabled) {
                        toast({ 
                            variant: 'destructive', 
                            title: 'खाते अक्षम केले आहे', 
                            description: 'तुमचे खाते प्रशासकाने अक्षम केले आहे.' 
                        });
                        signOut(auth);
                    } else {
                        setUserProfile(profileData);
                    }
                } else {
                    // This can happen briefly if the user document hasn't been created yet
                    // especially during sign up.
                    setUserProfile(null);
                }
                setLoading(false);
            }, (error) => {
                console.error("Error fetching user profile:", error);
                toast({ variant: 'destructive', title: 'प्रोफाइल त्रुटी', description: 'वापरकर्ता प्रोफाइल आणण्यात अयशस्वी.' });
                setUserProfile(null);
                setLoading(false);
            });
        } else {
            setUserProfile(null);
        }

        return () => {
            if (unsubscribeProfile) {
                unsubscribeProfile();
            }
        };
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
                const usersQuery = query(collection(db, "users"));
                const userSnapshot = await getDocs(usersQuery);
                const isFirstUser = userSnapshot.empty;
                const userRole = isFirstUser ? 'Admin' : 'Farmer';

                await setDoc(userDocRef, {
                    uid: signedInUser.uid,
                    email: signedInUser.email,
                    name: signedInUser.displayName || signedInUser.email?.split('@')[0],
                    role: userRole,
                    disabled: false,
                    createdAt: serverTimestamp(),
                });
                 toast({
                    title: "खाते तयार झाले!",
                    description: `शेवगाव बाजारमध्ये तुमचे स्वागत आहे. तुमची भूमिका: ${userRole}`,
                });
            } else {
                 toast({
                    title: "लॉगिन यशस्वी!",
                    description: "शेवगाव बाजारमध्ये तुमचे स्वागत आहे.",
                });
            }
        } catch (error: any) {
            console.error("Google sign-in error:", error);
            let title = 'Google साइन-इन अयशस्वी';
            let description = 'एक अनपेक्षित त्रुटी आली. कृपया पुन्हा प्रयत्न करा.';

            switch (error.code) {
                case 'auth/popup-closed-by-user':
                case 'auth/cancelled-popup-request':
                    title = 'Google साइन-इन रद्द केले';
                    description = 'तुम्ही साइन-इन विंडो बंद केली आहे किंवा विनंती रद्द केली आहे.';
                    break;
                case 'auth/popup-blocked':
                    title = 'पॉप-अप ब्लॉक केला';
                    description = 'तुमच्या ब्राउझरने Google साइन-इन पॉप-अप ब्लॉक केला आहे. कृपया तुमच्या ब्राउझर सेटिंग्ज तपासा.';
                    break;
                case 'auth/unauthorized-domain':
                    title = 'डोमेन अधिकृत नाही';
                    description = 'या अॅपला Google साइन-इन वापरण्याची परवानगी नाही. (SHA-1 fingerprint configuration error).';
                    break;
                case 'permission-denied':
                    title = 'परवानगी नाकारली';
                    description = 'डेटाबेसमध्ये प्रोफाइल तयार करण्यासाठी परवानगी नाही. कृपया तुमचे फायरस्टोअर नियम तपासा.';
                    break;
            }
            
            toast({
                variant: 'destructive',
                title: title,
                description: description,
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);
    
    return (
        <AuthContext.Provider value={{ user, userProfile, loading, handleLogout, handleGoogleSignIn }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
