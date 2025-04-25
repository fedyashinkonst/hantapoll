'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, collection, addDoc, updateDoc, increment, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '@/lib/firebaseConfig';
import styles from '@/app/page.module.css';
import { onAuthStateChanged } from 'firebase/auth';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
    const [hasAlreadyResponded, setHasAlreadyResponded] = useState(false);
    const [isCreator, setIsCreator] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const submitLock = useRef(false);
    const router = useRouter();

    useEffect(() => {
        const checkResponseStatus = async (userId) => {
            try {
                const responsesRef = collection(db, 'polls', id, 'responses');
                const q = query(responsesRef, where('userId', '==', userId));
                const querySnapshot = await getDocs(q);
                
                if (!querySnapshot.empty) {
                    setHasAlreadyResponded(true);
                    const prevResponse = querySnapshot.docs[0].data();
                    setAnswers(prevResponse.answers);
                    setIsSubmitted(true);
                }
            } catch (error) {
                console.error("Ошибка при проверке ответов:", error);
            }
        };

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user && poll?.pollSettings?.requireLogin) {
                router.push(`/login?redirect=/poll/${id}`);
                return;
            }

            const pollRef = doc(db, 'polls', id);
            const pollSnap = await getDoc(pollRef);
            
            if (!pollSnap.exists()) {
                router.push('/');
                return;
            }

            const pollData = pollSnap.data();
            setPoll({ id: pollSnap.id, ...pollData });
            
            if (pollData.designSettings) {
                setDesignSettings(pollData.designSettings);
            }

            if (user) {
                if (user.uid === pollData.createdBy) {
                    setIsCreator(true);
                }
                await checkResponseStatus(user.uid);
            }

            if (!hasAlreadyResponded) {
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
            }

            setAuthChecked(true);
        });

        return () => unsubscribe();
    }, [id, router]);

    useEffect(() => {
        if (typeof document !== 'undefined') {
            document.documentElement.style.setProperty('--primary-color', designSettings.primaryColor);
            document.documentElement.style.setProperty('--secondary-color', designSettings.secondaryColor);
            document.documentElement.style.setProperty('--font-family', designSettings.fontFamily);
            document.body.style.backgroundColor = designSettings.primaryColor;
        }
    }, [designSettings]);

    const handleAnswerChange = (questionId, optionIndex, value) => {
        if (hasAlreadyResponded || isCreator) return;
        
        setAnswers(prev => {
            const newAnswers = { ...prev };
            if (poll.questions.find(q => q.id === questionId)?.type === 'single') {
                newAnswers[questionId] = { [optionIndex]: value };
            } else {
                newAnswers[questionId] = { ...prev[questionId], [optionIndex]: value };
            }
            return newAnswers;
        });
    };

    const handleTextAnswerChange = (questionId, value) => {
        if (hasAlreadyResponded || isCreator) return;
        setAnswers(prev => ({ ...prev, [questionId]: value }));
    };

    const handleScaleChange = (questionId, value) => {
        if (hasAlreadyResponded || isCreator) return;
        setAnswers(prev => ({ ...prev, [questionId]: parseInt(value) || 0 }));
    };

    const validateAnswers = () => {
        if (!poll) return false;
        
        for (const question of poll.questions) {
            if (question.type === 'text' && !answers[question.id]?.trim()) {
                toast.error('Пожалуйста, ответьте на все вопросы');
                return false;
            }
            
            if (question.type === 'scale' && !answers[question.id]) {
                toast.error('Пожалуйста, ответьте на все вопросы');
                return false;
            }
            
            if (question.type !== 'text' && question.type !== 'scale') {
                const hasAnswer = Object.values(answers[question.id] || {}).some(val => val);
                if (!hasAnswer) {
                    toast.error('Пожалуйста, ответьте на все вопросы');
                    return false;
                }
            }
        }
        
        return true;
    };

    const submitPoll = async () => {
        if (submitLock.current) return;
        submitLock.current = true;
        setIsSubmitting(true);

        if (!authChecked || hasAlreadyResponded || isCreator) {
            submitLock.current = false;
            setIsSubmitting(false);
            return;
        }
        
        if (!validateAnswers()) {
            submitLock.current = false;
            setIsSubmitting(false);
            return;
        }

        try {
            const user = auth.currentUser;
            if (!user && poll.pollSettings.requireLogin) {
                router.push(`/login?redirect=/poll/${id}`);
                return;
            }

            const responseData = {
                answers,
                timestamp: new Date(),
                userId: user?.uid || null,
                userEmail: user?.email || null
            };

            const responsesRef = collection(db, 'polls', id, 'responses');
            await addDoc(responsesRef, responseData);

            const pollRef = doc(db, 'polls', id);
            await updateDoc(pollRef, {
                responsesCount: increment(1)
            });

            setIsSubmitted(true);
            setHasAlreadyResponded(true);
            
            if (user) {
                localStorage.setItem(`poll_${id}_responded`, 'true');
            }
        } catch (error) {
            console.error("Ошибка при отправке ответов:", error);
            toast.error("Произошла ошибка при отправке ответов");
        } finally {
            submitLock.current = false;
            setIsSubmitting(false);
        }
    };

    if (!poll || !authChecked) return <div className={styles.loading}>Загрузка опроса...</div>;

    if (isSubmitted) {
        return (
            <div className={styles.submittedContainer}
                 style={{
                     background: designSettings.primaryColor,
                     fontFamily: designSettings.fontFamily,
                     color: designSettings.secondaryColor,
                 }}>
                <h1 style={{ color: designSettings.secondaryColor }}>СПАСИБО ЗА УЧАСТИЕ В ОПРОСЕ!</h1>
                <p>Ваши ответы были сохранены.</p>
                <button onClick={() => router.push('/')}
                        className={styles.buttonSecondary}
                        style={{
                            backgroundColor: designSettings.secondaryColor,
                            color: designSettings.primaryColor
                        }}>
                    Вернуться на главную
                </button>
            </div>
        );
    }

    return (
        <div className={styles.pollContainer}
             style={{ 
                 fontFamily: designSettings.fontFamily,
                 backgroundColor: designSettings.primaryColor 
             }}>
            <ToastContainer position="top-right" autoClose={3000} />

            {designSettings.logo && (
                <div className={styles.pollLogo} style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexDirection: 'column'
                }}>
                    <img src={designSettings.logo} 
                         alt="Логотип опроса"
                         style={{ height: '200px', width: '200px', borderRadius: '50%'}} /><br/><br/>
                </div>
            )}
            
            {isCreator && (
                <div className={styles.creatorWarning}>
                    Вы создатель этого опроса и не можете в нём участвовать
                </div>
            )}
            
            {hasAlreadyResponded && (
                <div className={styles.responseWarning}>
                    Вы уже проходили этот опрос
                </div>
            )}
            
            <h1 className={styles.pollTitle}
                style={{ color: designSettings.secondaryColor }}>
                {poll.title}
            </h1>
            
            {poll.questions.map((question) => (
                <div key={question.id} 
                     className={styles.questionCard}
                     style={{ borderColor: designSettings.primaryColor, border: 'solid 1px #fff', borderColor: designSettings.primaryColor  }}>
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
                            disabled={hasAlreadyResponded || isCreator}
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
                                style={{ accentColor: designSettings.primaryColor }}
                                disabled={hasAlreadyResponded || isCreator}
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
                                            style={{ accentColor: designSettings.primaryColor }}
                                            disabled={hasAlreadyResponded || isCreator}
                                        />
                                        <span className={styles.optionText}>{option}</span>
                                    </label>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
            
            <button className={styles.submitButton}
                    onClick={submitPoll}
                    style={{
                        backgroundColor: designSettings.secondaryColor,
                        fontFamily: designSettings.fontFamily,
                        color: designSettings.primaryColor,
                        opacity: isCreator || hasAlreadyResponded || isSubmitting ? 0.6 : 1,
                        cursor: isCreator || hasAlreadyResponded || isSubmitting ? 'not-allowed' : 'pointer'
                    }}
                    disabled={isCreator || hasAlreadyResponded || isSubmitting}>
                {isSubmitting ? 'Отправка...' : 'Отправить ответы'}
            </button>
        </div>
    );
};

export default TakePollPage;