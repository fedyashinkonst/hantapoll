'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { app, auth, db } from '@/lib/firebaseConfig';
import { getAuth, deleteUser } from 'firebase/auth';
import styles from '../page.module.css';

const AdminPage = () => {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [users, setUsers] = useState([]);
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const ADMIN_PASSWORD = '12345';

  useEffect(() => {
    const storedAuth = localStorage.getItem('adminAuth');
    if (storedAuth === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      fetchData();
    }
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      setUsers(usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })));

      const pollsSnapshot = await getDocs(collection(db, 'polls'));
      setPolls(pollsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })));
    } catch (err) {
      setError('Ошибка загрузки данных: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      localStorage.setItem('adminAuth', ADMIN_PASSWORD);
      fetchData();
    } else {
      setError('Неверный пароль');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Вы уверены, что хотите удалить этого пользователя?')) return;
    
    try {
      try {
        await deleteUser(getAuth(app), userId);
      } catch (authError) {
        console.log('Не удалось удалить из аутентификации:', authError);
      }
      
      await deleteDoc(doc(db, 'users', userId));
      
      setUsers(users.filter(user => user.id !== userId));
    } catch (err) {
      setError('Ошибка удаления пользователя: ' + err.message);
    }
  };

  const handleDeletePoll = async (pollId) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот опрос и все ответы?')) return;
    
    try {
      const batch = writeBatch(db);
      
      batch.delete(doc(db, 'polls', pollId));
      
      const responsesRef = collection(db, 'polls', pollId, 'responses');
      const responsesSnapshot = await getDocs(responsesRef);
      responsesSnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      setPolls(polls.filter(poll => poll.id !== pollId));
    } catch (err) {
      setError('Ошибка удаления опроса: ' + err.message);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('adminAuth');
    setPassword('');
  };

  if (!isAuthenticated) {
    return (
      <div className={styles.adminContainer}>
        <div className={styles.loginForm}>
          <h1>Вход в админ-панель</h1>
          {error && <p className={styles.error}>{error}</p>}
          <form onSubmit={handleLogin}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Введите пароль администратора"
              className={styles.input}
              required
            />
            <button type="submit" className={styles.buttonad}>
              Войти
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.adminContainer}>
      <div className={styles.header}>
        <h1 className={styles.headerh1}>АДМИНКА</h1>
        <button onClick={handleLogout} className={styles.logoutButton}>
          Выйти
        </button>
      </div>

      {loading && <p className={styles.loading}>Загрузка данных...</p>}
      {error && <p className={styles.error}>{error}</p>}

      

      <div className={styles.section}>
        <h2>Опросы ({polls.length})</h2>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Название</th>
                <th>Автор</th>
                <th>Дата создания</th>
                <th>Ответов</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {polls.map(poll => (
                <tr key={poll.id}>
                  <td>{poll.id}</td>
                  <td>{poll.title}</td>
                  <td>{poll.createdBy}</td>
                  <td>{poll.createdAt?.toDate().toLocaleString()}</td>
                  <td>{poll.responsesCount || 0}</td>
                  <td>
                    <button 
                      onClick={() => handleDeletePoll(poll.id)}
                      className={styles.deleteButton}
                    >
                      Удалить
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;