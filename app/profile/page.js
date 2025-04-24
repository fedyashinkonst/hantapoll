'use client';
import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebaseConfig';
import { signOut, updateEmail, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import Link from 'next/link';
import styles from '../page.module.css';
import { onAuthStateChanged } from 'firebase/auth';

export default function Home() {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        setFormData(prev => ({ ...prev, email: user.email }));
        fetchPolls(user.uid);
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchPolls = async (userId) => {
    try {
      const pollsQuery = query(
        collection(db, 'polls'),
        where('createdBy', '==', userId)
      );
      
      const querySnapshot = await getDocs(pollsQuery);
      const pollsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setPolls(pollsData);
    } catch (error) {
      console.error("Ошибка при загрузке опросов:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      setError('Ошибка при выходе: ' + error.message);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const credential = EmailAuthProvider.credential(
        user.email,
        formData.currentPassword
      );
      await reauthenticateWithCredential(user, credential);

      if (formData.email !== user.email) {
        await updateEmail(user, formData.email);
      }

      if (formData.newPassword && formData.newPassword === formData.confirmPassword) {
        await updatePassword(user, formData.newPassword);
      }

      setSuccess('Профиль успешно обновлен!');
      setEditMode(false);
    } catch (error) {
      setError('Ошибка обновления: ' + error.message);
      console.error(error);
    }
  };

  if (loading) return <div className={styles.loading}>Загрузка...</div>;

  if (!user) {
    return (
      <div className={styles["homeContainer"]}
      style={{
        backgroundImage: 'url("/Group 23.png")',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    height: '100vh',
    borderRadius: '0px'
      }}>
        <h1 className={styles["homeContainerh1"]}>Добро пожаловать в HantaPoll!</h1><br/>
        <p className={styles["homeContainerP"]}>Пожалуйста, <u><Link href="/login">войдите</Link></u> или <u><Link href="/registr">зарегистрируйтесь</Link></u> для начала работы.</p>
      </div>
    );
  }

  return (
    <div className={styles["mainlk"]} style={{backgroundColor: '#fff'}}>
      {/* Новая шапка */}
      <header className={styles["app-header"]}>
        <Link href="/" className={styles["logo"]}>HantaPoll</Link>
        <div className={styles["header-nav"]}>
          <Link href="/pollbuild" className={styles["nav-link"]}>
            Конструктор опросов
          </Link>
          <Link href="/polls" className={styles["nav-link"]}>
            Мои опросы
          </Link>
        </div>
        <div className={styles["user-avatar"]}>
          {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
        </div>
      </header>

      <div className={styles["homeContainer"]}>
        <div className={styles["profileHeader"]}>
          <h1 className={styles["profileHeaderh1"]}>Настройки профиля</h1>
        </div><br/><br/>
        {!editMode ? (
          <div className={styles["profileInfo"]}>
            <p className={styles["inf1"]}><strong>Ваш Email:</strong> {user.email}</p>
              <button 
                  onClick={() => setEditMode(true)}
                  className={styles["editButton"]}
              >
                  Редактировать профиль
              </button>
              <br/>
              <button onClick={handleLogout} className={styles["logoutButton"]}>
              Выйти
              </button>
          </div>
        ) : (
          <form onSubmit={handleUpdateProfile} className={styles["profileForm"]}>
            <h2 className={styles["inf1"]}>Редактирование профиля</h2><br/>
            
            <div className={styles["formGroup"]}>
              <label>Новый Email:</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={styles["inplk"]}
                required
              />
            </div>

            <div className={styles["formGroup"]}>
              <label>Текущий пароль:</label>
              <input
                type="password"
                name="currentPassword"
                value={formData.currentPassword}
                className={styles["inplk"]}
                placeholder="Текущий пароль" 
                onChange={handleInputChange}
                required
              />
            </div>

            <div className={styles["formGroup"]}>
              <label>Новый пароль (оставьте пустым, если не хотите менять):</label>
              <input
                type="password"
                name="newPassword"
                value={formData.newPassword}
                className={styles["inplk"]}
                placeholder="Новый пароль" 
                onChange={handleInputChange}
              />
            </div>

            {formData.newPassword && (
              <div className={styles["formGroup"]}>
                <label>Подтвердите новый пароль:</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                />
              </div>
            )}

            {error && <p className={styles["error"]}>{error}</p>}
            {success && <p className={styles["success"]}>{success}</p>}

            <div className={styles["formActions"]}>
              <button type="submit" className={styles["saveButton"]}>
                Сохранить
              </button>
              <button 
                type="button"
                onClick={() => setEditMode(false)}
                className={styles["cancelButton"]}
              >
                Отмена
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}