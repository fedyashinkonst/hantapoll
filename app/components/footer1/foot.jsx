import Link from "next/link";
import styles from "../../page.module.css"; // Создайте отдельный CSS модуль для футера

export const Footer = () => {
    return (
        <footer className={styles.footerContainer}>
            <div className={styles.footerWrapper}>
                <div className={styles.footerLogo}>HantaPoll</div>
                
                <div className={styles.footerMainContent}>
                    <p className={styles.footerCopyright}>
                        © 2025 HantaPoll — платформа для интерактивных опросов и квизов <br />
                        Поддержка: support@hantapoll.com | Telegram: @hantapoll_support
                    </p>
                    
                    <div className={styles.footerLinksContainer}>
                        <div className={styles.footerLinksColumn}>
                            <Link href="example" className={styles.footerLink}>• Политика конфиденциальности</Link>
                            <Link href="example" className={styles.footerLink}>• Условия использования</Link>
                            <Link href="example" className={styles.footerLink}>• О компании</Link>
                        </div>
                        <div className={styles.footerLinksColumn}>
                            <Link href="example" className={styles.footerLink}>• Тарифы</Link>
                            <Link href="example" className={styles.footerLink}>• API для разработчиков</Link>
                            <Link href="example" className={styles.footerLink}>• Блог</Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};