'use client';

import { useState } from 'react';
import { styles } from "../page.module.css"
import axios from 'axios';

function CreatePoll() {
  const [pollTitle, setPollTitle] = useState('');
  const [pollDescription, setPollDescription] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [isOpen, setIsOpen] = useState(true);
  const [questions, setQuestions] = useState([
    {
      id: 1,
      text: '',
      type: 'single',
      answers: [''],
    },
  ]);

  const generatePollId = () => {
    return Math.floor(10000000 + Math.random() * 90000000).toString();
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: questions.length + 1,
        text: '',
        type: 'single',
        answers: [''],
      },
    ]);
  };

  const removeQuestion = (id) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((q) => q.id !== id));
    }
  };

  const updateQuestionText = (id, text) => {
    setQuestions(questions.map((q) => (q.id === id ? { ...q, text } : q)));
  };

  const updateQuestionType = (id, type) => {
    setQuestions(
      questions.map((q) =>
        q.id === id
          ? {
              ...q,
              type,
              answers: type === 'text' ? [] : [''],
            }
          : q
      )
    );
  };

  const addAnswer = (questionId) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId ? { ...q, answers: [...q.answers, ''] } : q
      )
    );
  };

  const removeAnswer = (questionId, answerIndex) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              answers: q.answers.filter((_, index) => index !== answerIndex),
            }
          : q
      )
    );
  };

  const updateAnswer = (questionId, answerIndex, text) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              answers: q.answers.map((a, index) =>
                index === answerIndex ? text : a
              ),
            }
          : q
      )
    );
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const userId = localStorage.getItem('userId');
    
    if (!userId && !isAnonymous) {
      alert('Для создания авторизованного опроса необходимо войти в систему');
      return;
    }
  
    const pollData = {
      poll_name: pollTitle,
      description: pollDescription,
      poll_type: isAnonymous ? 'anonymous' : 'authenticated',
      access_type: isOpen ? 'open' : 'closed',
      questions: questions.map((q) => ({
        text: q.text,
        type: q.type,
        answers: q.type !== 'text' ? q.answers : [],
      })),
    };
  
    try {
      const response = await axios.post('http://localhost:5000/api/polls', pollData, {
        headers: {
          'Authorization': userId || null
        }
      });
      
      alert('Опрос успешно создан! ID: ' + response.data.poll_id);
      setPollTitle('');
      setPollDescription('');
      setQuestions([{ id: Date.now(), text: '', type: 'single', answers: [''] }]);
    } catch (error) {
      console.error('Ошибка при создании опроса:', error);
      let errorMessage = 'Произошла ошибка при создании опроса';
      
      if (error.response) {
        if (error.response.status === 401) {
          errorMessage = 'Требуется авторизация для создания опроса';
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      }
      
      alert(errorMessage);
    }
  };

  return (
    <div className={styles. app}>
    <h1 className={styles["h1"]}>Создание опроса</h1>
    <form onSubmit={handleSubmit}>
      <div className={styles["poll-settings"]}>
        <div className={styles["form-group"]}>
          <label htmlFor="pollTitle">Название опроса:</label>
          <input
            id="pollTitle"
            type="text"
            value={pollTitle}
            onChange={(e) => setPollTitle(e.target.value)}
            required
          />
        </div>
  
        <div className={styles["form-group"]}>
          <label htmlFor="pollDescription">Описание опроса:</label>
          <textarea
            id="pollDescription"
            value={pollDescription}
            onChange={(e) => setPollDescription(e.target.value)}
          />
        </div>
  
        <div className={styles["toggle-group"]}>
          <div className={styles["toggle-option"]}>
            <span>Тип опроса:</span>
            <label>
              <input
                type="radio"
                checked={isAnonymous}
                onChange={() => setIsAnonymous(true)}
              />
              Анонимный
            </label>
            <label>
              <input
                type="radio"
                checked={!isAnonymous}
                onChange={() => setIsAnonymous(false)}
              />
              Авторизованный
            </label>
          </div>
          <div className={styles["toggle-option"]}>
            <span>Доступ:</span>
            <label>
              <input
                type="radio"
                checked={isOpen}
                onChange={() => setIsOpen(true)}
              />
              Открытый
            </label>
            <label>
              <input
                type="radio"
                checked={!isOpen}
                onChange={() => setIsOpen(false)}
              />
              Закрытый
            </label>
          </div>
        </div>
      </div>
  
      <div className={styles["questions-list"]}>
        {questions.map((question, index) => (
          <div key={question.id} className={styles["question"]}>
            <div className={styles["question-header"]}>
              <h3>Вопрос {index + 1}</h3>
              {index > 0 && (
                <button
                  type="button"
                  className={styles["remove-btn"]}
                  onClick={() => removeQuestion(question.id)}
                >
                  Удалить вопрос
                </button>
              )}
            </div>
  
            <div className={styles["form-group"]}>
              <label htmlFor={`question-${question.id}`}>
                Текст вопроса:
              </label>
              <input
                id={`question-${question.id}`}
                type="text"
                value={question.text}
                onChange={(e) =>
                  updateQuestionText(question.id, e.target.value)
                }
                required
              />
            </div>
  
            <div className={styles["form-group"]}>
              <label>Тип ответа:</label>
              <select
                value={question.type}
                onChange={(e) =>
                  updateQuestionType(question.id, e.target.value)
                }
              >
                <option value="single">Одиночный выбор</option>
                <option value="multiple">Множественный выбор</option>
                <option value="text">Текстовый ответ</option>
              </select>
            </div>
  
            {question.type !== 'text' && (
              <div className={styles["answers-list"]}>
                <label>Варианты ответов:</label>
                {question.answers.map((answer, index) => (
                  <div key={index} className={styles["answer"]}>
                    <input
                      type="text"
                      value={answer}
                      onChange={(e) =>
                        updateAnswer(
                          question.id,
                          index,
                          e.target.value
                        )
                      }
                      required
                    />
                    {question.answers.length > 1 && (
                      <button
                        type="button"
                        className={styles["remove-btn"]}
                        onClick={() =>
                          removeAnswer(question.id, index)
                        }
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className={styles["add-btn"]}
                  onClick={() => addAnswer(question.id)}
                >
                  + Добавить вариант
                </button>
              </div>
            )}
          </div>
        ))}
  
        <button
          type="button"
          className={styles["add-btn"]}
          onClick={addQuestion}
        >
          Добавить вопрос
        </button>
      </div>
  
      <button type="submit" className={styles["submit-btn"]}>
        Создать опрос
      </button>
    </form>
  </div>
  );
}

export default CreatePoll;