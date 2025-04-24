'use client';
import React, { useState, useEffect } from 'react';
import styles from "@/app/page.module.css";
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebaseConfig';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';

const PollCreator = () => {
  const [pollTitle, setPollTitle] = useState('НОВЫЙ ОПРОС');
  const [questions, setQuestions] = useState([
    {
      id: 1,
      text: '',
      type: 'single',
      options: ['', '']
    }
  ]);
  const [user, setUser] = useState(null);
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
      options: ['', '']
    }]);
  };

  const addOption = (questionId) => {
    setQuestions(questions.map(q => 
      q.id === questionId 
        ? {...q, options: [...q.options, '']} 
        : q
    ));
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

  const publishPoll = async () => {
    if (!user) return;

    try {
      const pollData = {
        title: pollTitle,
        questions: questions.map(q => ({
          id: q.id,
          text: q.text,
          type: q.type,
          options: q.options.filter(opt => opt.trim() !== '')
        })),
        createdAt: serverTimestamp(),
        createdBy: user.uid,
        responsesCount: 0
      };

      const docRef = await addDoc(collection(db, 'polls'), pollData);
      alert(`Опрос опубликован! Ссылка для прохождения: /poll/${docRef.id}`);
      router.push(`/poll/${docRef.id}`);
    } catch (error) {
      console.error("Ошибка при публикации опроса:", error);
      alert("Произошла ошибка при публикации опроса");
    }
  };

  return (
    <div className={styles["poll-creator"]}>
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
              </select>
            </div>

            {question.type !== 'text' && (
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
                  </div>
                ))}
                <button 
                  onClick={() => addOption(question.id)}
                  className={styles["add-option-btn"]}
                >
                  + Добавить вариант
                </button>
              </div>
            )}
          </div>
        ))}

        <button onClick={addQuestion} className={styles["add-question-btn"]}>
          + Добавить вопрос
        </button>
      </div>
    </div>
  );
};

export default PollCreator;