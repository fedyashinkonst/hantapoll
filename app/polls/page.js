'use client';
import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, doc, updateDoc, deleteDoc } from 'firebase/firestore';
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
  const [copiedPollId, setCopiedPollId] = useState(null);

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

  const copyPollLink = (pollId) => {
    if (!navigator.clipboard) {
      const textArea = document.createElement('textarea');
      const pollUrl = `${window.location.origin}/poll/${pollId}`;
      textArea.value = pollUrl;
      document.body.appendChild(textArea);
      textArea.select();
      
      try {
        document.execCommand('copy');
        setCopiedPollId(pollId);
        setTimeout(() => setCopiedPollId(null), 2000);
      } catch (err) {
        setError('Не удалось скопировать ссылку');
        console.error('Ошибка при копировании:', err);
      }
      document.body.removeChild(textArea);
      return;
    }
    const pollUrl = `${window.location.origin}/poll/${pollId}`;
    navigator.clipboard.writeText(pollUrl)
      .then(() => {
        setCopiedPollId(pollId);
        setTimeout(() => setCopiedPollId(null), 2000);
      })
      .catch(err => {
        setError('Не удалось скопировать ссылку');
        console.error('Ошибка при копировании:', err);
      });
  };

  const handleDeletePoll = async (pollId) => {
    if (window.confirm('Вы уверены, что хотите удалить этот опрос? Это действие нельзя отменить.')) {
      try {
        await deleteDoc(doc(db, 'polls', pollId));
        setPolls(polls.filter(poll => poll.id !== pollId));
        setSuccess('Опрос успешно удален');
      } catch (error) {
        setError('Ошибка при удалении опроса: ' + error.message);
      }
    }
  };

  if (loading) return <div className={styles.loading}>Загрузка...</div>;

  if (!user) {
    return (
      <div className={styles["homeContainer"]}>
        <h1 className={styles["homeContainerh1"]}>Добро пожаловать в HantaPoll!</h1><br/>
        <p className={styles["homeContainerP"]}>Пожалуйста, <u><Link href="/login">войдите</Link></u> или <u><Link href="/registr">зарегистрируйтесь</Link></u> для начала работы.</p>
      </div>
    );
  }

  return (
    <div 
      className={styles["mainlk"]} 
      style={{ 
        height: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        backgroundImage: 'url("/Group 23.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        minHeight: '100vh',
      }}
    >
      <header className={styles["app-header"]} style={{ 
        backgroundColor: '#FFF',
        width: '100%',
      }}>
        <Link href="/" className={styles["logo"]}>HantaPoll</Link>
        <div className={styles["header-nav"]}>
          <Link href="/pollbuild" className={styles["nav-link"]}>
            Конструктор опросов
          </Link>
          <u><strong><Link href="/polls" className={styles["nav-link"]}>
            Мои опросы
          </Link></strong></u>
        </div>
        <Link href="/profile"><div className={styles["user-avatar"]}>
          {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
        </div></Link>
      </header>

      <div className={styles["homeContainer"]} style={{ backgroundColor: '#4B3D6E00' }}>
        <div className={styles["profileHeader"]}>
        </div>
        <div className={styles["pollsSection"]}>
          <h2 className={styles["inf"]}>ВАШИ ОПРОСЫ</h2>
          
          <div className={styles["actions"]}>
            <Link href="/pollbuild" className={styles["createButton"]}>
              Создать новый опрос
            </Link>
          </div>
          
          {polls.length === 0 ? (
            <p className={styles["newp"]}>У вас пока нет созданных опросов - <u><Link href={"/pollbuild"}>исправьте это</Link></u>!)</p>
          ) : (
            <div className={styles["pollsList"]}>
              {polls.map(poll => (
                <div key={poll.id} className={styles["pollItem"]} style={{ backgroundColor: '#FFFFFF' }}>
                  <h3>{poll.title}</h3><br/>
                  <p>Вопросов: {poll.questions.length}</p>
                  <p>Ответов: {poll.responsesCount || 0}</p>
                  
                  <div className={styles["pollActions"]}>
                    <button 
                      onClick={() => copyPollLink(poll.id)} 
                      className={styles["actionButton"]}
                    >
                      {copiedPollId === poll.id ? 'Скопировано!' : 'Поделиться'}
                    </button>
                    <Link href={`/results/${poll.id}`} className={styles["actionButton"]}>
                      Результаты
                    </Link>
                  </div>
                  <div className={styles["deleteAction"]}>
                    <button 
                      onClick={() => handleDeletePoll(poll.id)} 
                      className={`${styles["delButton"]} ${styles["deleteButton"]}`}
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div> <br/>
      </div>
    </div>
  );
}