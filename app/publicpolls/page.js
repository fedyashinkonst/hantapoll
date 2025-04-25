'use client';
import { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import Link from 'next/link';
import styles from '@/app/page.module.css';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

const PublicPollsPage = () => {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchPublicPolls = async () => {
      try {
        const pollsRef = collection(db, 'polls');
        // Получаем только опросы, которые не требуют авторизации или если пользователь авторизован
        const q = query(pollsRef, where('pollSettings.requireLogin', '==', false));
        const querySnapshot = await getDocs(q);
        
        const pollsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate()
        }));
        
        setPolls(pollsData);
      } catch (error) {
        console.error("Error fetching polls:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPublicPolls();
  }, []);

  const filteredPolls = polls.filter(poll => 
    poll.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    poll.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePollClick = (pollId, requireLogin) => {
    if (requireLogin && !user) {
      router.push(`/login?redirect=/poll/${pollId}`);
    } else {
      router.push(`/poll/${pollId}`);
    }
  };

  if (loading) return <div className={styles.loading}>Загрузка опросов...</div>;

  return (
    <div className={styles.publicPollsContainer} style={{
        height: 'auto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    backgroundImage: 'url("/Group 23.png")',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    minHeight: '100vh',
     }}>
      <div className={styles.pollsHeader}>
        <h1>Публичные опросы</h1>
        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="Поиск опросов..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.pollsGrid}>
        {filteredPolls.length > 0 ? (
          filteredPolls.map(poll => (
            <div 
              key={poll.id} 
              className={styles.pollCard}
              onClick={() => handlePollClick(poll.id, poll.pollSettings?.requireLogin)}
            >
              <div className={styles.pollHeader}>
                <h3>{poll.title}</h3>
                {poll.pollSettings?.requireLogin && (
                  <span className={styles.loginRequired}>Требуется вход</span>
                )}
              </div>
              
              {poll.description && (
                <p className={styles.pollDescription}>{poll.description}</p>
              )}
              
              <div className={styles.pollMeta}>
                <span>Вопросов: {poll.questions.length}</span>
                <span>Ответов: {poll.responsesCount || 0}</span>
                <span>Создан: {poll.createdAt?.toLocaleDateString()}</span>
              </div>
              
              <div className={styles.pollFooter}>
                <button className={styles.takePollButton}>
                  Пройти опрос
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className={styles.noPolls}>
            {searchTerm ? (
              <p>Ничего не найдено по запросу "{searchTerm}"</p>
            ) : (
              <p>Нет доступных публичных опросов</p>
            )}
            <Link href="/pollbuild" className={styles.createPollLink}>
              Создать новый опрос
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicPollsPage;