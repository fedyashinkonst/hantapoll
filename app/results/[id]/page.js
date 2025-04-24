'use client';
import React, { useEffect, useState } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import styles from '@/app/page.module.css';
import { useParams } from 'next/navigation';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
);

const PollResultsPage = () => {
    const { id } = useParams();
    const [poll, setPoll] = useState(null);
    const [responses, setResponses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [chartData, setChartData] = useState([]);
    const [isCopied, setIsCopied] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const pollRef = doc(db, 'polls', id);
                const pollSnap = await getDoc(pollRef);
                
                if (pollSnap.exists()) {
                    setPoll({ id: pollSnap.id, ...pollSnap.data() });
                    
                    const responsesRef = collection(db, 'polls', id, 'responses');
                    const responsesSnap = await getDocs(responsesRef);
                    const responsesData = responsesSnap.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                    
                    setResponses(responsesData);
                    prepareChartData(pollSnap.data().questions, responsesData);
                }
            } catch (error) {
                console.error("Ошибка при загрузке данных:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    const prepareChartData = (questions, responses) => {
        const preparedData = questions.map(question => {
            if (question.type === 'text') {
                const textAnswers = responses
                    .map(response => response.answers[question.id])
                    .filter(answer => answer && answer.trim() !== '');
                
                return {
                    questionId: question.id,
                    questionText: question.text,
                    type: 'text',
                    answers: textAnswers
                };
            } else {
                const optionCounts = question.options.map((option, index) => {
                    return responses.reduce((count, response) => {
                        if (question.type === 'single') {
                            return count + (response.answers[question.id]?.[index] ? 1 : 0);
                        } else {
                            return count + (response.answers[question.id]?.[index] ? 1 : 0);
                        }
                    }, 0);
                });

                return {
                    questionId: question.id,
                    questionText: question.text,
                    type: question.type,
                    options: question.options,
                    counts: optionCounts,
                    totalResponses: responses.length
                };
            }
        });

        setChartData(preparedData);
    };

    const downloadResults = () => {
        alert("Функция скачивания будет реализована позже");
    };

    const copyPollLink = () => {
        const pollUrl = `${window.location.origin}/poll/${id}`;
        navigator.clipboard.writeText(pollUrl)
            .then(() => {
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 2000);
            })
            .catch(err => {
                console.error('Не удалось скопировать ссылку:', err);
                alert('Не удалось скопировать ссылку');
            });
    };

    if (loading) return <div className={styles.loading}>Загрузка результатов...</div>;
    if (!poll) return <div className={styles.error}>Опрос не найден</div>;

    return (
        <div className={styles.resultsContainer}>
            <div className={styles.resultsHeader}>
                <h1>АНАЛИТИКА ОПРОСА "{poll.title}"</h1>
                <div className={styles.headerActions}>
                    <button 
                        onClick={downloadResults}
                        className={styles.downloadButton}
                    >
                        Скачать результаты
                    </button>
                    <button 
                        onClick={copyPollLink}
                        className={styles.shareButton}
                    >
                        {isCopied ? 'Ссылка скопирована!' : 'Поделиться'}
                    </button>
                </div>
            </div>

            <div className={styles.summaryInfo}>
                <p>Всего ответов: {responses.length}</p>
                <p>Дата создания: {poll.createdAt?.toDate().toLocaleString()}</p>
            </div>

            {chartData.map((chart, index) => (
                <div key={index} className={styles.chartSection}>
                    <h2>{chart.questionText}</h2>
                    
                    {chart.type === 'text' ? (
                        <div className={styles.textAnswersSection}>
                            <h3>Текстовые ответы ({chart.answers.length}):</h3>
                            <div className={styles.textAnswersList}>
                                {chart.answers.map((answer, i) => (
                                    <div key={i} className={styles.textAnswerItem}>
                                        {answer}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className={styles.chartWrapper}>
                            <Bar
                                data={{
                                    labels: chart.options,
                                    datasets: [{
                                        label: 'Количество ответов',
                                        data: chart.counts,
                                        backgroundColor: '#3B536A',
                                    }]
                                }}
                                options={{
                                    responsive: true,
                                    plugins: {
                                        tooltip: {
                                            callbacks: {
                                                label: function(context) {
                                                    const percentage = Math.round(
                                                        (context.raw / chart.totalResponses) * 100
                                                    );
                                                    return `${context.raw} (${percentage}%)`;
                                                }
                                            }
                                        }
                                    },
                                    scales: {
                                        y: {
                                            beginAtZero: true,
                                            max: chart.totalResponses,
                                            ticks: {
                                                stepSize: 1
                                            }
                                        }
                                    }
                                }}
                            />
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default PollResultsPage;