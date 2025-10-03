
'use client';

import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { onAuthStateChanged, User as FirebaseUser, signOut, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, onSnapshot, Unsubscribe, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { UserProfile } from '@/lib/types';
import { useToast } from './use-toast';
import { useLanguage } from '@/contexts/language-context';
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
    const { dictionary } = useLanguage();
    const router = useRouter();
    
    const authDict = dictionary.auth;

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
            setUser(firebaseUser);
            if (!firebaseUser) {
                setLoading(false);
                setUserProfile(null);
            }
        });
        return () => unsubscribeAuth();
    }, []);

    useEffect(() => {
        let unsubscribeProfile: Unsubscribe | undefined;
        let activityInterval: NodeJS.Timeout | undefined;

        if (user) {
            // We are now loading the profile
            if (!userProfile) setLoading(true);

            const userDocRef = doc(db, 'users', user.uid);

            const updateLastSeen = async () => {
                try {
                    await updateDoc(userDocRef, { lastSeen: serverTimestamp() });
                } catch (error) {
                    // It might fail if the doc doesn't exist yet, which is fine
                }
            };
            
            activityInterval = setInterval(updateLastSeen, 60 * 1000); // Update every 60 seconds
            updateLastSeen(); // Initial update

            unsubscribeProfile = onSnapshot(userDocRef, (docSnap) => {
                if (docSnap.exists()) {
                    const profileData = docSnap.data() as UserProfile;
                     if (profileData.disabled) {
                        toast({ 
                            variant: 'destructive', 
                            title: authDict.accountDisabledTitle, 
                            description: authDict.accountDisabledDescription
                        });
                        signOut(auth);
                    } else {
                        setUserProfile(profileData);
                    }
                } else {
                    // This case is handled by the Google Sign-in logic
                    // For email/pass, the signup page creates the doc.
                    setUserProfile(null); 
                }
                setLoading(false); 
            }, (error) => {
                console.error("Error fetching user profile:", error);
                toast({ variant: 'destructive', title: authDict.profileErrorTitle, description: authDict.profileErrorDescription });
                setUserProfile(null);
                setLoading(false);
            });
        } else {
            setUserProfile(null);
            setLoading(false);
        }

        return () => {
            if (unsubscribeProfile) {
                unsubscribeProfile();
            }
            if (activityInterval) {
                clearInterval(activityInterval);
            }
        };
    }, [user, toast, authDict]);


    const handleLogout = useCallback(async () => {
        try {
            if (user) {
                const userDocRef = doc(db, 'users', user.uid);
                await updateDoc(userDocRef, { lastSeen: serverTimestamp() });
            }
            await signOut(auth);
            toast({ title: authDict.logoutSuccess });
        } catch (error) {
            console.error("Logout error", error);
            toast({ variant: 'destructive', title: authDict.logoutFailedTitle, description: authDict.logoutFailedDescription });
        }
    }, [user, toast, authDict]);

    const handleGoogleSignIn = useCallback(async () => {
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            const signedInUser = result.user;

            const userDocRef = doc(db, 'users', signedInUser.uid);
            const userDoc = await getDoc(userDocRef);

            if (!userDoc.exists()) {
                const userRole = 'Farmer';
                const mobileNumber = signedInUser.phoneNumber || '';
                try {
                    await setDoc(userDocRef, {
                        uid: signedInUser.uid,
                        email: signedInUser.email,
                        name: signedInUser.displayName || signedInUser.email?.split('@')[0],
                        mobileNumber: mobileNumber,
                        photoURL: signedInUser.photoURL || '',
                        role: userRole,
                        disabled: false,
                        createdAt: serverTimestamp(),
                        lastSeen: serverTimestamp(),
                    });
                     toast({
                        title: authDict.accountCreatedTitle,
                        description: authDict.accountCreatedDescription.replace('${role}', userRole),
                    });
                    if (!mobileNumber) {
                        router.push('/settings?promptMobile=true');
                    }

                } catch (dbError: any) {
                    await signOut(auth); // Rollback auth state if profile creation fails
                    if (dbError.code === 'permission-denied' || dbError.code === 'PERMISSION_DENIED') {
                         toast({
                            variant: 'destructive',
                            title: authDict.permissionDeniedTitle,
                            description: authDict.permissionDeniedDescription,
                        });
                    } else {
                        throw dbError; 
                    }
                }
            } else {
                 toast({
                    title: authDict.loginSuccessTitle,
                    description: authDict.welcomeBack,
                });
            }
        } catch (error: any) {
            let title = authDict.googleSignInFailedTitle;
            let description = authDict.googleSignInFailedDescription;

            if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
                return; // User cancelled, so we don't show an error.
            } else if (error.code === 'auth/popup-blocked') {
                title = authDict.popupBlockedTitle;
                description = authDict.popupBlockedDescription;
            } else if (error.code === 'auth/unauthorized-domain') {
                title = authDict.unauthorizedDomainTitle;
                description = authDict.unauthorizedDomainDescription;
            }
            
            console.error("Google Sign-In Error: ", error);
            toast({
                variant: 'destructive',
                title: title,
                description: description,
                duration: 9000,
            });
        }
    }, [toast, authDict, router]);
    
    return (
        <AuthContext.Provider value={{ user, userProfile, loading, handleLogout, handleGoogleSignIn }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
    
