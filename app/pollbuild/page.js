'use client';
import React, { useState, useEffect } from 'react';
import styles from "@/app/page.module.css";
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebaseConfig';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import Link from 'next/link';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import QRCode from 'react-qr-code';

const PollCreator = () => {
  const [pollTitle, setPollTitle] = useState('НАЗВАНИЕ ОПРОСА');
  const [questions, setQuestions] = useState([
    {
      id: 1,
      text: '',
      type: 'single',
      options: ['', ''],
      scaleRange: { min: 1, max: 5 }
    }
  ]);
  const [user, setUser] = useState(null);
  const [publishedPollId, setPublishedPollId] = useState(null);
  const [designSettings, setDesignSettings] = useState({
    primaryColor: '#ffffff',
    secondaryColor: '#000000',
    fontFamily: 'Arial, sans-serif',
    logo: null
  });
  const [timeSettings, setTimeSettings] = useState({
    hasTimeLimit: false,
    startTime: '',
    endTime: '',
    duration: 60
  });
  const [pollSettings, setPollSettings] = useState({
    isAnonymous: true,
    requireLogin: false
  });
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (!user) {
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  const addQuestion = () => {
    setQuestions([...questions, {
      id: questions.length + 1,
      text: '',
      type: 'single',
      options: ['', ''],
      scaleRange: { min: 1, max: 5 }
    }]);
  };

  const addOption = (questionId) => {
    setQuestions(questions.map(q => 
      q.id === questionId 
        ? {...q, options: [...q.options, '']} 
        : q
    ));
  };

  const removeQuestion = (questionId) => {
    if (questions.length > 1) {
      setQuestions(questions.filter(q => q.id !== questionId));
    }
  };

  const handleQuestionChange = (id, field, value) => {
    setQuestions(questions.map(q => 
      q.id === id ? {...q, [field]: value} : q
    ));
  };

  const handleOptionChange = (questionId, optionIndex, value) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId) {
        const newOptions = [...q.options];
        newOptions[optionIndex] = value;
        return {...q, options: newOptions};
      }
      return q;
    }));
  };

  const handleScaleChange = (questionId, field, value) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId) {
        return {
          ...q,
          scaleRange: {
            ...q.scaleRange,
            [field]: parseInt(value) || 0
          }
        };
      }
      return q;
    }));
  };

  const handleDesignChange = (e) => {
    const { name, value } = e.target;
    setDesignSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Размер файла не должен превышать 2MB');
        return;
      }
      
      if (!file.type.match('image.*')) {
        toast.error('Пожалуйста, загрузите изображение');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setDesignSettings(prev => ({
          ...prev,
          logo: reader.result
        }));
        toast.success('Логотип успешно загружен');
      };
      reader.onerror = () => {
        toast.error('Ошибка при загрузке файла');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTimeChange = (e) => {
    const { name, value, type, checked } = e.target;
    setTimeSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePollSettingChange = (e) => {
    const { name, checked } = e.target;
    if (name === 'isAnonymous') {
      setPollSettings({
        isAnonymous: checked,
        requireLogin: checked ? false : pollSettings.requireLogin
      });
    } else if (name === 'requireLogin') {
      setPollSettings({
        requireLogin: checked,
        isAnonymous: checked ? false : pollSettings.isAnonymous
      });
    }
  };

  const publishPoll = async () => {
    if (!user) return;
    if (!pollTitle.trim() || pollTitle.trim() === 'НОВЫЙ ОПРОС') {
        toast.error('Введите уникальное название опроса');
        return;
    }
    if (questions.length === 0) {
        toast.error('Добавьте хотя бы один вопрос');
        return;
    }

    for (const question of questions) {
        if (!question.text.trim()) {
            toast.error(`Вопрос #${question.id}: введите текст вопроса`);
            return;
        }

        if (question.type !== 'text' && question.type !== 'scale') {
            if (question.options.length < 2) {
                toast.error(`Вопрос #${question.id}: добавьте минимум 2 варианта ответа`);
                return;
            }
            const emptyOptions = question.options.filter(opt => !opt.trim());
            if (emptyOptions.length > 0) {
                toast.error(`Вопрос #${question.id}: все варианты ответа должны быть заполнены`);
                return;
            }
            const uniqueOptions = new Set(question.options.map(opt => opt.trim().toLowerCase()));
            if (uniqueOptions.size !== question.options.length) {
                toast.error(`Вопрос #${question.id}: удалите повторяющиеся варианты ответа`);
                return;
            }
        }
        if (question.type === 'scale') {
            if (question.scaleRange.min >= question.scaleRange.max) {
                toast.error(`Вопрос #${question.id}: максимальное значение шкалы должно быть больше минимального`);
                return;
            }
        }
    }
    if (pollSettings.requireLogin && pollSettings.isAnonymous) {
        toast.error('Нельзя одновременно требовать авторизацию и разрешать анонимные ответы');
        return;
    }

    try {
        const pollData = {
            title: pollTitle.trim(),
            questions: questions.map(q => ({
                id: q.id,
                text: q.text.trim(),
                type: q.type,
                options: q.type !== 'text' && q.type !== 'scale' 
                    ? q.options.map(opt => opt.trim()) 
                    : [],
                scaleRange: q.type === 'scale' ? q.scaleRange : null
            })),
            designSettings,
            timeSettings,
            pollSettings: {
                isAnonymous: pollSettings.isAnonymous,
                requireLogin: pollSettings.requireLogin
            },
            createdAt: serverTimestamp(),
            createdBy: user.uid,
            responsesCount: 0
        };

        const docRef = await addDoc(collection(db, 'polls'), pollData);
        setPublishedPollId(docRef.id);
        
        toast.success('Опрос успешно опубликован!');
    } catch (error) {
        console.error("Ошибка при публикации опроса:", error);
        toast.error('Ошибка при публикации опроса');
    }
};

  const pollUrl = publishedPollId ? `${window.location.origin}/poll/${publishedPollId}` : '';

  return (
    <div className={styles["poll-creator-container"]}
      style={{
        height: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        backgroundImage: 'url("/Group 23.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <ToastContainer />
      
      <header className={styles["app-header"]}>
        <Link href="/" className={styles["logo"]}>HantaPoll</Link>
        <div className={styles["header-nav"]}>
          <u><strong><Link href="/pollbuild" className={styles["nav-link"]}>
            Конструктор опросов
          </Link></strong></u>
          <Link href="/polls" className={styles["nav-link"]}>
            Мои опросы
          </Link>
        </div>
        <Link href="/profile"><div className={styles["user-avatar"]}>
          {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
        </div></Link>
      </header>

      {!publishedPollId ? (
        <div className={styles["poll-creator"]}
        style={{
          height: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#ffffff00'
        }}>
          <div className={styles["creator-header"]}>
            <input
              type="text"
              value={pollTitle}
              onChange={(e) => setPollTitle(e.target.value)}
              className={styles["poll-title-input"]}
            />
            <div className={styles["header-actions"]}>
              <button 
                className={styles["publish-btn"]}
                onClick={publishPoll}
              >
                Опубликовать
              </button>
            </div>
          </div>

          <div className={styles["questions-container"]}>
            {questions.map((question) => (
              <div key={question.id} className={styles["question-card"]}>
                <div className={styles["question-header"]}>
                  <input
                    type="text"
                    placeholder="Введите вопрос"
                    value={question.text}
                    onChange={(e) => 
                      handleQuestionChange(question.id, 'text', e.target.value)
                    }
                    className={styles["question-input"]}
                  />
                  <select
                    value={question.type}
                    onChange={(e) => 
                      handleQuestionChange(question.id, 'type', e.target.value)
                    }
                    className={styles["question-type"]}
                  >
                    <option value="single">Один вариант</option>
                    <option value="multiple">Несколько вариантов</option>
                    <option value="text">Текстовый ответ</option>
                    <option value="scale">Шкала</option>
                  </select>
                  {questions.length > 1 && (
                    <button 
                      onClick={() => removeQuestion(question.id)}
                      className={styles["remove-question-btn"]}
                    >
                      ×
                    </button>
                  )}
                </div>

                {question.type === 'scale' ? (
                  <div className={styles["scale-controls"]}>
                    <div className={styles["form-group"]}>
                      <label>Минимальное значение:</label>
                      <input
                        type="number"
                        value={question.scaleRange.min}
                        onChange={(e) => 
                          handleScaleChange(question.id, 'min', e.target.value)
                        }
                        className={styles["sch"]}
                        min="0"
                      />
                    </div>
                    <div className={styles["form-group"]}>
                      <label>Максимальное значение:</label>
                      <input
                        className={styles["sch"]}
                        type="number"
                        value={question.scaleRange.max}
                        onChange={(e) => 
                          handleScaleChange(question.id, 'max', e.target.value)
                        }
                        min={question.scaleRange.min + 1}
                      />
                    </div>
                  </div>
                ) : question.type !== 'text' ? (
                  <div className={styles["options-container"]}>
                    {question.options.map((option, index) => (
                      <div key={index} className={styles["option-item"]}>
                        {question.type === 'single' ? (
                          <input type="radio" disabled />
                        ) : (
                          <input type="checkbox" disabled />
                        )}
                        <input
                          type="text"
                          placeholder={`Вариант ${index + 1}`}
                          value={option}
                          onChange={(e) => 
                            handleOptionChange(question.id, index, e.target.value)
                          }
                          className={styles["option-input"]}
                        />
                        {question.options.length > 2 && (
                          <button 
                            onClick={() => {
                              const newOptions = [...question.options];
                              newOptions.splice(index, 1);
                              handleQuestionChange(question.id, 'options', newOptions);
                            }}
                            className={styles["remove-option-btn"]}
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                    <button 
                      onClick={() => addOption(question.id)}
                      className={styles["add-option-btn"]}
                    >
                      + Добавить вариант
                    </button>
                  </div>
                ) : null}
              </div>
            ))}

            <button onClick={addQuestion} className={styles["add-question-btn"]}>
              + Добавить вопрос
            </button><br/><br/><br/>
          </div>

          <div className={styles["settings-tabs"]}>
            <div className={styles["settings-section"]}>
              <h3>Настройки дизайна</h3>
              <div className={styles["design-controls"]}>
                <div className={styles["form-group"]}>
                  <label>Основной цвет:</label>
                  <input
                    type="color"
                    name="primaryColor"
                    value={designSettings.primaryColor}
                    onChange={handleDesignChange}
                  />
                </div>
                <div className={styles["form-group"]}>
                  <label>Дополнительный цвет:</label>
                  <input
                    type="color"
                    name="secondaryColor"
                    value={designSettings.secondaryColor}
                    onChange={handleDesignChange}
                  />
                </div>
                <div className={styles["form-group"]}>
                  <label>Шрифт:</label>
                  <select
                    name="fontFamily"
                    value={designSettings.fontFamily}
                    onChange={handleDesignChange}
                    className={styles["question-type"]}
                  >
                    <option value="Arial, sans-serif">Arial</option>
                    <option value="Helvetica, sans-serif">Helvetica</option>
                    <option value="'Times New Roman', serif">Times New Roman</option>
                  </select>
                </div>
                <div className={styles["form-group"]}>
                  <label>Логотип:</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                  />
                  {designSettings.logo && (
                    <div className={styles["logo-preview"]}>
                      <img 
                        src={designSettings.logo} 
                        alt="Логотип опроса" 
                        style={{ maxWidth: '100px', maxHeight: '50px' }}
                      />
                      <button 
                        onClick={() => setDesignSettings(prev => ({ ...prev, logo: null }))}
                        className={styles["remove-logo-btn"]}
                      >
                        Удалить
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className={styles["settings-section"]}>
              <h3>Настройки времени</h3>
              <div className={styles["time-controls"]}>
                <div className={styles["form-group"]}>
                  <label className={styles["timelim"]}>
                    <input
                      type="checkbox"
                      name="hasTimeLimit"
                      checked={timeSettings.hasTimeLimit}
                      onChange={handleTimeChange}
                    />
                      Ограничить по времени
                  </label>
                </div>
                {timeSettings.hasTimeLimit && (
                  <>
                    <div className={styles["form-group"]}>
                      <label>Начало опроса:</label>
                      <input
                        type="datetime-local"
                        name="startTime"
                        value={timeSettings.startTime}
                        onChange={handleTimeChange}
                      />
                    </div>
                    <div className={styles["form-group"]}>
                      <label>Окончание опроса:</label>
                      <input
                        type="datetime-local"
                        name="endTime"
                        value={timeSettings.endTime}
                        onChange={handleTimeChange}
                        min={timeSettings.startTime}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className={styles["settings-section"]}>
              <h3>Настройки доступа</h3>
              <div className={styles["access-controls"]}>
                <div className={styles["form-group"]}>
                  <label>
                    <input
                      type="checkbox"
                      name="isAnonymous"
                      checked={pollSettings.isAnonymous}
                      onChange={handlePollSettingChange}
                      disabled={pollSettings.requireLogin}
                    />
                    Анонимные ответы
                  </label>
                  <p className={styles["setting-description"]}>
                    Ответы не будут привязаны к пользователям
                  </p>
                </div>
                <div className={styles["form-group"]}>
                  <label>
                    <input
                      type="checkbox"
                      name="requireLogin"
                      checked={pollSettings.requireLogin}
                      onChange={handlePollSettingChange}
                    />
                    Требовать авторизацию
                  </label>
                  <p className={styles["setting-description"]}>
                    Только зарегистрированные пользователи смогут отвечать
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className={styles["poll-share-section"]}>
          <h3>Опрос опубликован!</h3>
          <div className={styles["share-controls"]}>
            <div className={styles["share-link"]}>
              <label>Ссылка на опрос:</label>
              <input
                type="text"
                value={pollUrl}
                readOnly
                onClick={(e) => e.target.select()}
              />
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(pollUrl);
                  toast.info('Ссылка скопирована!');
                }}
                className={styles["copy-btn"]}
              >
                Копировать
              </button>
            </div>
            <div className={styles["qr-code"]}>
              <QRCode 
                value={pollUrl}
                size={128}
                level="H"
              />
              <p>QR-код для опроса</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PollCreator;