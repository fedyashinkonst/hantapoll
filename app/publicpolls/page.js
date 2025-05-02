'use client';
import { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import Link from 'next/link';
import styles from '@/app/page.module.css';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebaseConfig';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { PulseLoader } from 'react-spinners';

const PublicPollsPage = () => {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [user, setUser] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
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

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setShowProfileMenu(false);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (loading) return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: '#D6E8EE'
    }}>
      <PulseLoader color="#02457A" size={15} margin={5} />
    </div>
  );

  return (
    <div className={styles.publicPollsContainer} style={{
      height: 'auto',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      backgroundColor:'#D6E8EE',
      minHeight: '100vh',
    }}>
      <header className={styles["app-header1"]} style={{ 
        backgroundColor: '#D6E8EE',
        width: '100%',
      }}>
        <Link href="/" className={styles["logo"]}>HantaPoll</Link>
        <div className={styles["header-nav"]}>
          {user ? (
            <div className={styles["user-avatar-container"]}>
              <div 
                className={styles["user-avatar"]}
                onClick={() => setShowProfileMenu(!showProfileMenu)}
              >
                {user.email?.charAt(0).toUpperCase()}
              </div>
              
              {showProfileMenu && (
                <div className={styles["profile-menu"]}>
                  <div className={styles["profile-menu-header"]}>
                    <div className={styles["profile-avatar"]}>
                      {user.email?.charAt(0).toUpperCase()}
                    </div>
                    <div className={styles["profile-email"]}>
                      {user.email}
                    </div>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className={styles["profile-menu-button-rem"]}
                  >
                    Выйти
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login" className={styles["nav-link"]}>
              Войти
            </Link>
          )}
        </div>
      </header>

      <div className={styles.pollsHeader}>
        <h1>Публичные опросы</h1>
        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="Поиск опроса..."
            className={styles.searchBar}
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
                <a className={styles.takePollLink}>
                  Пройти опрос
                </a>
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