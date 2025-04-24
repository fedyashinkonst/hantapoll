'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, collection, addDoc, updateDoc, increment } from 'firebase/firestore';
import { db, auth } from '@/lib/firebaseConfig';
import styles from '@/app/page.module.css';

const TakePollPage = () => {
    const { id } = useParams();
    const [poll, setPoll] = useState(null);
    const [answers, setAnswers] = useState({});
    const [isSubmitted, setIsSubmitted] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const fetchPoll = async () => {
            const pollRef = doc(db, 'polls', id);
            const pollSnap = await getDoc(pollRef);
            
            if (pollSnap.exists()) {
                setPoll({ id: pollSnap.id, ...pollSnap.data() });
                const initialAnswers = {};
                pollSnap.data().questions.forEach(question => {
                    if (question.type === 'text') {
                        initialAnswers[question.id] = '';
                    } else {
                        initialAnswers[question.id] = {};
                        question.options.forEach((_, index) => {
                            initialAnswers[question.id][index] = false;
                        });
                    }
                });
                setAnswers(initialAnswers);
            } else {
                router.push('/');
            }
        };

        fetchPoll();
    }, [id, router]);

    const handleAnswerChange = (questionId, optionIndex, value) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: {
                ...prev[questionId],
                [optionIndex]: value
            }
        }));
    };

    const handleTextAnswerChange = (questionId, value) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: value
        }));
    };

    const submitPoll = async () => {
        try {
            const responsesRef = collection(db, 'polls', id, 'responses');
            await addDoc(responsesRef, {
                answers,
                userId: auth.currentUser?.uid || null,
                timestamp: new Date()
            });
            const pollRef = doc(db, 'polls', id);
            await updateDoc(pollRef, {
                responsesCount: increment(1)
            });

            setIsSubmitted(true);
        } catch (error) {
            console.error("Ошибка при отправке ответов:", error);
            alert("Произошла ошибка при отправке ответов");
        }
    };

    if (!poll) return <div className={styles.loading}>Загрузка опроса...</div>;

    if (isSubmitted) {
        return (
            <div className={styles.submittedContainer}>
                <h1>СПАСИБО ЗА УЧАСТИЕ В ОПРОСЕ!</h1>
                <p>Ваши ответы были сохранены.</p><br/>
                <button 
                    onClick={() => router.push(`/results/${id}`)}
                    className={styles.buttonr}
                >
                    Посмотреть результаты
                </button>
                <button 
                    onClick={() => router.push('/')}
                    className={styles.buttonSecondary}
                >
                    Вернуться на главную
                </button>
            </div>
        );
    }

    return (
        <div className={styles.pollContainer}>
            <h1 className={styles.pollTitle}>{poll.title}</h1>
            
            {poll.questions.map((question) => (
                <div key={question.id} className={styles.questionCard}>
                    <h3 className={styles.questionText}>{question.text}</h3>
                    
                    {question.type === 'text' ? (
                        <textarea
                            className={styles.textAnswer}
                            value={answers[question.id] || ''}
                            onChange={(e) => handleTextAnswerChange(question.id, e.target.value)}
                            placeholder="Введите ваш ответ..."
                        />
                    ) : (
                        <div className={styles.optionsContainer}>
                            {question.options.map((option, index) => (
                                <div key={index} className={styles.optionItem}>
                                    <label className={styles.optionLabel}>
                                        <input 
                                            type={question.type === 'single' ? 'radio' : 'checkbox'}
                                            name={`question_${question.id}`}
                                            checked={answers[question.id]?.[index] || false}
                                            onChange={(e) => handleAnswerChange(
                                                question.id, 
                                                index, 
                                                question.type === 'single' ? true : e.target.checked
                                            )}
                                            className={styles.optionInput}
                                        />
                                        <span className={styles.optionText}>{option}</span>
                                    </label>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
            
            <button 
                className={styles.submitButton}
                onClick={submitPoll}
            >
                Отправить ответы
            </button>
        </div>
    );
};

export default TakePollPage;