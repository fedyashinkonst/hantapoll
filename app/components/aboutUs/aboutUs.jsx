'use client';
import styles from "@/app/page.module.css";
import { motion } from "framer-motion";

export const AboutUs = () => {
    return (
        <div className={styles["aboutMain"]} id='aboutus'>
            <motion.div 
                className={styles["unmainblock1"]}
                initial={{ opacity: 0, y: -50 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ duration: 0.5 }}
            >
                <h1 className={styles["btxt"]}>С НАШИМ СЕРВИСОМ <br/> ВЫ МОЖЕТЕ</h1><br/><br/><br/>
                <br/><br/><br/>
                <div className={styles["cards"]}>
                    <motion.div 
                        className={styles["card1"]}
                        initial={{ scale: 0 }} 
                        animate={{ scale: 1 }} 
                        transition={{ duration: 0.5 }}
                    >
                        <br/>
                        <p className={styles["cardBigTXT"]}>СОЗДАТЬ ОПРОС</p><br/><br/><br/><br/><br/>
                        <p className={styles["cardSmallTXT"]}>Удобный конструктор анкет и настройка опроса.</p>
                    </motion.div>
                    <motion.div 
                        className={styles["card2"]}
                        initial={{ scale: 0 }} 
                        animate={{ scale: 1 }} 
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <br/>
                        <p className={styles["cardBigTXT"]}>СОБРАТЬ ОТВЕТЫ</p><br/><br/><br/><br/><br/>
                        <p className={styles["cardSmallTXT"]}>Онлайн-панель с лучшими и удобными способами визуализации</p>
                    </motion.div>
                    <motion.div 
                        className={styles["card3"]}
                        initial={{ scale: 0 }} 
                        animate={{ scale: 1 }} 
                        transition={{ duration: 0.5, delay: 0.4 }}
                    >
                        <br/>
                        <p className={styles["cardBigTXT"]}>ПОЛУЧИТЬ РЕЗУЛЬТАТ</p><br/><br/><br/><br/><br/>
                        <p className={styles["cardSmallTXT"]}>Результаты опроса в форматах PDF, SVF, PNG. Данные в виде графиков, диаграмм и таблиц.</p>
                    </motion.div>
                </div>
                <div className={styles["imgm"]}>
                </div>
            </motion.div>
        </div>
    );
}