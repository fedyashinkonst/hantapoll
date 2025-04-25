'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, collection, addDoc, updateDoc, increment } from 'firebase/firestore';
import { db, auth } from '@/lib/firebaseConfig';
import styles from '@/app/page.module.css';
import { onAuthStateChanged } from 'firebase/auth';

const TakePollPage = () => {
    const { id } = useParams();
    const [poll, setPoll] = useState(null);
    const [answers, setAnswers] = useState({});
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [designSettings, setDesignSettings] = useState({
        primaryColor: '#4CAF50',
        secondaryColor: '#2196F3',
        fontFamily: 'Arial, sans-serif',
        logo: null
    });
    const [authChecked, setAuthChecked] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const fetchPoll = async () => {
            const pollRef = doc(db, 'polls', id);
            const pollSnap = await getDoc(pollRef);
            
            if (pollSnap.exists()) {
                const pollData = pollSnap.data();
                setPoll({ id: pollSnap.id, ...pollData });
                
                if (pollData.designSettings) {
                    setDesignSettings(pollData.designSettings);
                }
                
                const initialAnswers = {};
                pollData.questions.forEach(question => {
                    if (question.type === 'text') {
                        initialAnswers[question.id] = '';
                    } else if (question.type === 'scale') {
                        initialAnswers[question.id] = question.scaleRange?.min || 1;
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

        const checkAuth = async () => {
            await new Promise(resolve => {
                const unsubscribe = onAuthStateChanged(auth, (user) => {
                    if (poll?.pollSettings?.requireLogin && !user) {
                        router.push(`/login?redirect=/poll/${id}`);
                    }
                    setAuthChecked(true);
                    resolve();
                    unsubscribe();
                });
            });
        };

        fetchPoll().then(checkAuth);
    }, [id, router]);

    useEffect(() => {
        if (typeof document !== 'undefined') {
            document.documentElement.style.setProperty('--primary-color', designSettings.primaryColor);
            document.documentElement.style.setProperty('--secondary-color', designSettings.secondaryColor);
            document.documentElement.style.setProperty('--font-family', designSettings.fontFamily);
        }
    }, [designSettings]);

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

    const handleScaleChange = (questionId, value) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: parseInt(value) || 0
        }));
    };

    const submitPoll = async () => {
        if (!authChecked) return;
        
        if (poll.pollSettings.requireLogin && !auth.currentUser) {
            router.push(`/login?redirect=/poll/${id}`);
            return;
        }

        try {
            const responseData = {
                answers,
                timestamp: new Date()
            };

            if (!poll.pollSettings.isAnonymous && auth.currentUser) {
                responseData.userId = auth.currentUser.uid;
                responseData.userEmail = auth.currentUser.email;
            }

            const responsesRef = collection(db, 'polls', id, 'responses');
            await addDoc(responsesRef, responseData);

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
    document.body.setAttribute('style', `background-color: ${designSettings.primaryColor};`);

    if (!poll || !authChecked) return <div className={styles.loading}>Загрузка опроса...</div>;

    if (isSubmitted) {
        return (
            <div 
                className={styles.submittedContainer}
                style={{
                    // backgroundColor: designSettings.primaryColor + '20',
                    background: designSettings.primaryColor,
                    fontFamily: designSettings.fontFamily,
                    color: designSettings.secondaryColor,
                }}
            >
                <h1 style={{ color: designSettings.secondaryColor }}>СПАСИБО ЗА УЧАСТИЕ В ОПРОСЕ!</h1>
                <br/>
                <p>Ваши ответы были сохранены.</p>
                <br/><br/>
                <button 
                    onClick={() => router.push('/')}
                    className={styles.buttonSecondary}
                    style={{
                        backgroundColor: designSettings.secondaryColor,
                        color: designSettings.primaryColor
                    }}
                >
                    Вернуться на главную
                </button>
            </div>
        );
    }

    return (
        <div 
            className={styles.pollContainer}
            style={{ fontFamily: designSettings.fontFamily,
            backgroundColor: designSettings.primaryColor }}
        >
            {designSettings.logo && (
                <div className={styles.pollLogo}>
                    <img 
                        src={designSettings.logo} 
                        alt="Логотип опроса"
                        style={{ height: '300px', width: '100%', borderRadius: '5px' }}
                    />
                </div>
            )}
            
            <h1 
                className={styles.pollTitle}
                style={{ color: designSettings.secondaryColor }}
            >
                {poll.title}
            </h1>
            
            {poll.questions.map((question) => (
                <div 
                    key={question.id} 
                    className={styles.questionCard}
                    style={{ borderColor: designSettings.primaryColor }}
                >
                    <h3 className={styles.questionText}>{question.text}</h3>
                    
                    {question.type === 'text' ? (
                        <textarea
                            className={styles.textAnswer}
                            value={answers[question.id] || ''}
                            onChange={(e) => handleTextAnswerChange(question.id, e.target.value)}
                            placeholder="Введите ваш ответ..."
                            style={{ 
                                borderColor: designSettings.primaryColor,
                                fontFamily: designSettings.fontFamily
                            }}
                        />
                    ) : question.type === 'scale' ? (
                        <div className={styles.scaleContainer}>
                            <input
                                type="range"
                                min={question.scaleRange?.min || 1}
                                max={question.scaleRange?.max || 5}
                                value={answers[question.id] || question.scaleRange?.min || 1}
                                onChange={(e) => handleScaleChange(question.id, e.target.value)}
                                className={styles.scaleInput}
                                style={{
                                    accentColor: designSettings.primaryColor
                                }}
                            />
                            <div className={styles.scaleLabels}>
                                <span>{question.scaleRange?.min || 1}</span>
                                <span>{answers[question.id] || question.scaleRange?.min || 1}</span>
                                <span>{question.scaleRange?.max || 5}</span>
                            </div>
                        </div>
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
                                            style={{
                                                accentColor: designSettings.primaryColor
                                            }}
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
                style={{
                    backgroundColor: designSettings.secondaryColor,
                    fontFamily: designSettings.fontFamily,
                    color: designSettings.primaryColor
                }}
            >
                Отправить ответы
            </button>
        </div>
    );
};

export default TakePollPage;