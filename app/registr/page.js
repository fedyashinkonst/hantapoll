'use client';
import styles from "@/app/page.module.css";
import Link from "next/link";
import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebaseConfig';
import { useRouter } from 'next/navigation';

const RegisterPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            router.push('/polls');
        } catch (err) {
            setError(err.message);
            console.error("Ошибка регистрации:", err);
        }
    };

    return (
        <div className={styles["loginPage"]}>
            <div className={styles["divloginPage"]}>
                <div className={styles["logBox"]}>
                    <h1 className={styles["txtlog2"]}>Создайте аккаунт для разработки опросов.</h1>
                    <div className={styles["form"]}>
                        <div className={styles["forminfo"]}>
                            <h1 className={styles["txtlog3"]}>Регистрация</h1>
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
                                onClick={handleRegister}
                            >
                                ЗАРЕГИСТРИРОВАТЬСЯ
                            </button><br/>
                            <p className={styles["txtb"]}>
                                Уже есть аккаунт? 
                                <Link href={'/login'}>
                                    <span className={styles["stxtb"]}> Войти</span>
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default RegisterPage;