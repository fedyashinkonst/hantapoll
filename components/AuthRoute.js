'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { auth } from '@/lib/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

const AuthRoute = ({ children, requireAuth = true }) => {
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (requireAuth && !user) {
                router.push('/login');
            } else if (!requireAuth && user) {
                router.push('/pollbuild');
            }
        });

        return () => unsubscribe();
    }, [router, requireAuth]);

    return children;
};

export default AuthRoute;