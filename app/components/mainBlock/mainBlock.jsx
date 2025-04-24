'use client';

import styles from "@/app/page.module.css";
import Link from "next/link";
import { motion } from "framer-motion";
import { auth } from '@/lib/firebaseConfig';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';

export const MainBlock = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const headerItem = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  const headingAnimation = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" }
    }
  };

  const buttonAnimation = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.5, delay: 0.3 }
    },
    hover: { scale: 1.05, transition: { duration: 0.2 } },
    tap: { scale: 0.95 }
  };

  const footerAnimation = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, delay: 0.5 }
    }
  };

  const handleCreatePollClick = (e) => {
    e.preventDefault();
    if (user) {
      router.push('/polls');
    } else {
      router.push('/login');
    }
  };

  if (loading) {
    return <div className={styles.loading}>Загрузка...</div>;
  }

  return (
    <div className={styles["mainBlock"]}>
      <div className={styles["unmainblock"]}>
        <motion.div 
          className={styles["header"]}
          initial="hidden"
          animate="visible"
        >
          <motion.div className={styles["headertxt"]}>
            {!user ? (
              <>
                <motion.div variants={headerItem}>
                  <Link href={'/login'}><p className={styles["headertxtel"]}>ВОЙТИ</p></Link>
                </motion.div>
                <motion.div variants={headerItem}>
                  <Link href={'/registr'}><p className={styles["headertxtel"]}>ЗАРЕГИСТРИРОВАТЬСЯ</p></Link>
                </motion.div>
              </>
            ) : (
              <></>
            )}
            <motion.div variants={headerItem}>
              <p className={styles["headertxtel"]}>О НАС</p>
            </motion.div>
            <motion.div variants={headerItem}>
              <p className={styles["headertxtel"]}>КОНТАКТЫ</p>
            </motion.div>
          </motion.div>
          
          <motion.button 
            className={styles["bigButton"]}
            variants={buttonAnimation}
            whileHover="hover"
            whileTap="tap"
            onClick={handleCreatePollClick}
          >
            {user ? "ЛИЧНЫЙ КАБИНЕТ" : "СОЗДАТЬ ОПРОС"}
          </motion.button>
        </motion.div>

        <motion.div 
          className={styles["headerformobile"]}
          initial="hidden"
          animate="visible"
        >
          <motion.div className={styles["headertxtmob"]}>
            <motion.div className={styles["headertxtmob1"]} variants={headerItem}>
              {!user ? (
                <>
                  <Link href={'/login'}><p className={styles["headertxtelm"]}>ВОЙТИ</p></Link>
                  <Link href={'/registr'}><p className={styles["headertxtelm"]}>ЗАРЕГИСТРИРОВАТЬСЯ</p></Link>
                </>
              ) : (
                <Link href={'/profile'}><p className={styles["headertxtelm"]}>ЛИЧНЫЙ КАБИНЕТ</p></Link>
              )}
            </motion.div>
            <motion.div className={styles["headertxtmob1"]} variants={headerItem}>
              <a href="#aboutus"><p className={styles["headertxtelm"]}>О НАС</p></a>
              <p className={styles["headertxtelm"]}>КОНТАКТЫ</p>
            </motion.div>
          </motion.div>
        </motion.div>

        <br/><br/>

        <motion.div 
          className={styles["textInfo"]}
          initial="hidden"
          animate="visible"
        >
          <motion.h1 
            className={styles["heading"]}
            variants={headingAnimation}
          >
            СОЗДАВАЙТЕ, ПРОВОДИТЕ, АНАЛИЗИРУЙТЕ – <br/> ЛЕГКО И ЭФФЕКТИВНО!
          </motion.h1>
          <br/>
          <p className={styles["txtpol"]}>HantaPoll – это мощный инструмент для создания опросов, тестов и голосований с мгновенной аналитикой. Готовые шаблоны, автоматическая обработка данных и удобные отчеты помогают быстро получать ценные инсайты. Используйте для исследований, обучения или принятия решений – HantaPoll делает сбор информации простым и эффективным!</p>
        </motion.div>

        <motion.div 
          className={styles["footerText"]}
          initial="hidden"
          animate="visible"
          variants={footerAnimation}
        >
          {user ? (
            "Создавайте опросы и анализируйте результаты!"
          ) : (
            "Зарегистрируйся и создай свой первый опрос/квиз/голосование бесплатно уже сейчас!"
          )}
        </motion.div>
        
        <motion.button 
          className={styles["bigButtonM"]}
          variants={buttonAnimation}
          whileHover="hover"
          whileTap="tap"
          onClick={handleCreatePollClick}
        >
          {user ? "КАБИНЕТ" : "СОЗДАТЬ"}
        </motion.button>
      </div>
    </div>
  );
};