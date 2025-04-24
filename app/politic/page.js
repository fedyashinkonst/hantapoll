import React from 'react';
import styles from '../page.module.css';

const PrivacyPolicy = () => {
  return (
    <div className={styles["privacy-policy"]}>
      <div className={styles["container"]}>
        <h1 className={styles["h1"]}>Пользовательское Соглашение</h1>
        
        <section className={styles["section"]}>
          <p className={styles["p"]}>
            Настоящее Пользовательское Соглашение (Далее Соглашение) регулирует отношения между владельцем HantaPoll.ru 
            (далее HantaPoll или Администрация) с одной стороны и пользователем сайта с другой.
          </p>
          <p className={styles["p"]}>Сайт HantaPoll не является средством массовой информации.</p>
          <p className={styles["p"]}>
            Используя сайт, Вы соглашаетесь с условиями данного соглашения.
            Если Вы не согласны с условиями данного соглашения, не используйте сайт HantaPoll!
          </p>
        </section>

        <section className={styles["section"]}>
          <h2 className={styles["h2"]}>Предмет соглашения</h2>
          <p className={styles["p"]}>
            Администрация предоставляет пользователю право на размещение на сайте следующей информации:
          </p>
          <ul className={styles["ul"]}>
            <li className={styles["li"]}>Текстовой информации</li>
            <li className={styles["li"]}>Ссылок на материалы, размещенные на других сайтах</li>
          </ul>
        </section>

        <section className={styles["section"]}>
          <h2 className={styles["h2"]}>Права и обязанности сторон</h2>
          <h3 className={styles["h3"]}>Пользователь имеет право:</h3>
          <ul className={styles["ul"]}>
            <li className={styles["li"]}>осуществлять поиск информации на сайте</li>
            <li className={styles["li"]}>получать информацию на сайте</li>
            <li className={styles["li"]}>создавать информацию для сайта</li>
            <li className={styles["li"]}>распространять информацию на сайте</li>
            <li className={styles["li"]}>использовать информацию сайта в личных некоммерческих целях</li>
          </ul>

          <h3 className={styles["h3"]}>Администрация имеет право:</h3>
          <ul className={styles["ul"]}>
            <li className={styles["li"]}>по своему усмотрению и необходимости создавать, изменять, отменять правила</li>
            <li className={styles["li"]}>ограничивать доступ к любой информации на сайте</li>
          </ul>

          <h3 className={styles["h3"]}>Пользователь обязуется:</h3>
          <ul className={styles["ul"]}>
            <li className={styles["li"]}>не нарушать работоспособность сайта</li>
            <li className={styles["li"]}>не использовать скрипты (программы) для автоматизированного сбора информации и/или взаимодействия с Сайтом и его Сервисами</li>
          </ul>

          <h3 className={styles["h3"]}>Администрация обязуется:</h3>
          <ul className={styles["ul"]}>
            <li className={styles["li"]}>поддерживать работоспособность сайта за исключением случаев, когда это невозможно по независящим от Администрации причинам.</li>
          </ul>
        </section>

        <section className={styles["section"]}>
          <h2 className={styles["h2"]}>Ответственность сторон</h2>
          <ul className={styles["ul"]}>
            <li className={styles["li"]}>администрация не несет никакой ответственности за услуги, предоставляемые третьими лицами</li>
            <li className={styles["li"]}>
              в случае возникновения форс-мажорной ситуации (боевые действия, чрезвычайное положение, стихийное бедствие и т. д.) 
              Администрация не гарантирует сохранность информации, размещённой Пользователем, а также бесперебойную работу 
              информационного ресурса
            </li>
          </ul>
        </section>

        <section className={styles["section"]}>
          <h2 className={styles["h2"]}>Условия действия Соглашения</h2>
          <ul className={styles["ul"]}>
            <li className={styles["li"]}>Данное Соглашение вступает в силу при любом использовании данного сайта.</li>
            <li className={styles["li"]}>Соглашение перестает действовать при появлении его новой версии.</li>
            <li className={styles["li"]}>Администрация оставляет за собой право в одностороннем порядке изменять данное соглашение по своему усмотрению.</li>
            <li className={styles["li"]}>Администрация не оповещает пользователей об изменении в Соглашении.</li>
          </ul>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;