import styles from "@/app/page.module.css";
import Link from "next/link";

export const Footer = () => {
    return(
        <div className={styles["footermain"]}>
            <div className={styles["footerInfo"]}>
                <p className={styles["footxtb"]}>© 2025 HantaPoll — платформа для интерактивных опросов и квизов <br/> Поддержка: support@hantapoll.com | Telegram: @hantapoll_support</p>
                <div className={styles["footpl"]}>
                    <Link href={'/politic'}><p className={styles["footxt"]}>• Политика конфиденциальности</p></Link>
                    <Link href={'/politic'}><p className={styles["footxt"]}>• Условия использования</p></Link>
                    <p className={styles["footxt"]}>• Контакты</p>
                </div>
            </div>
        </div>
    );
}