'use client';
import styles from "@/app/page.module.css";
import Link from "next/link";
import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebaseConfig';
import { useRouter } from 'next/navigation';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await signInWithEmailAndPassword(auth, email, password);
            router.push('/polls');
        } catch (err) {
            setError(err.message);
            console.error("Ошибка входа:", err);
        }
    };

    return (
        <div className={styles["loginPage"]}>
            <div className={styles["divloginPage"]}>
                <div className={styles["logBox"]}>
                    <h1 className={styles["txtlog2"]}>Продолжайте создавать и анализировать опросы.</h1>
                    <div className={styles["form"]}>
                        <div className={styles["forminfo"]}>
                            <h1 className={styles["txtlog3"]}>Вход</h1>
                            {error && <p className={styles["error"]}>{error}</p>}
                            <input 
                                placeholder="Электронная почта" 
                                className={styles["formInput"]}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                            <input 
                                placeholder="Пароль" 
                                className={styles["formInput"]}
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <button 
                                className={styles["formBut"]}
                                onClick={handleLogin}
                            >
                                ВОЙТИ
                            </button>
                            <p className={styles["txtb"]}>
                                Ещё нету аккаунта? 
                                <Link href={'/registr'}>
                                    <span className={styles["stxtb"]}>Зарегистрироваться</span>
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;