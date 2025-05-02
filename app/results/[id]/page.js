'use client';
import React, { useEffect, useState, useRef } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement } from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';
import styles from '@/app/page.module.css';
import { useParams } from 'next/navigation';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db, auth } from '@/lib/firebaseConfig';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import Link from 'next/link';
import { onAuthStateChanged } from 'firebase/auth';
import { PulseLoader } from 'react-spinners';
import { Footer } from '@/app/components/footer1/foot';
import { signOut, updateEmail, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement
);

const PollResultsPage = () => {
    const { id } = useParams();
    const [formData, setFormData] = useState({
        email: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    const [poll, setPoll] = useState(null);
    const [responses, setResponses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [chartData, setChartData] = useState([]);
    const [activeTab, setActiveTab] = useState('charts');
    const [chartType, setChartType] = useState('bar');
    const [filter, setFilter] = useState('all');
    const [user, setUser] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [success, setSuccess] = useState('');
    const resultsRef = useRef(null);
    const toggleProfileMenu = () => {
        setShowProfileMenu(!showProfileMenu);
        setEditMode(false);
        setError('');
        setSuccess('');
      };
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            if (user) {
                setFormData(prev => ({ ...prev, email: user.email || '' }));
            }
        });

        const fetchData = async () => {
            try {
                const pollRef = doc(db, 'polls', id);
                const pollSnap = await getDoc(pollRef);
                
                if (pollSnap.exists()) {
                    const pollData = pollSnap.data();
                    setPoll({ 
                        id: pollSnap.id, 
                        ...pollData,
                        createdAt: pollData.createdAt?.toDate() 
                    });
                    
                    const responsesRef = collection(db, 'polls', id, 'responses');
                    const responsesSnap = await getDocs(responsesRef);
                    const responsesData = responsesSnap.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                        timestamp: doc.data().timestamp?.toDate()
                    }));
                    
                    setResponses(responsesData);
                    prepareChartData(pollData.questions, responsesData);
                }
            } catch (error) {
                console.error("Ошибка при загрузке данных:", error);
                toast.error("Ошибка при загрузке данных опроса");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        return () => unsubscribe();
    }, [id]);

    const prepareChartData = (questions, responses) => {
        const preparedData = questions.map(question => {
            if (question.type === 'text') {
                const textAnswers = responses
                    .map(response => ({
                        answer: response.answers[question.id],
                        userEmail: response.userEmail || 'Аноним',
                        timestamp: response.timestamp
                    }))
                    .filter(item => item.answer && item.answer.trim() !== '');
                
                return {
                    questionId: question.id,
                    questionText: question.text,
                    type: 'text',
                    answers: textAnswers
                };
            } else if (question.type === 'scale') {
                const scaleAnswers = responses
                    .map(response => ({
                        value: response.answers[question.id],
                        userEmail: response.userEmail || 'Аноним',
                        timestamp: response.timestamp
                    }))
                    .filter(item => item.value !== undefined);

                const counts = {};
                for (let i = question.scaleRange.min; i <= question.scaleRange.max; i++) {
                    counts[i] = 0;
                }

                scaleAnswers.forEach(item => {
                    counts[item.value]++;
                });

                return {
                    questionId: question.id,
                    questionText: question.text,
                    type: 'scale',
                    scaleRange: question.scaleRange,
                    counts: Object.values(counts),
                    labels: Object.keys(counts),
                    answers: scaleAnswers,
                    totalResponses: responses.length
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

                const detailedAnswers = responses.map(response => ({
                    options: question.options.filter((_, index) => response.answers[question.id]?.[index]),
                    userEmail: response.userEmail || 'Аноним',
                    timestamp: response.timestamp
                }));

                return {
                    questionId: question.id,
                    questionText: question.text,
                    type: question.type,
                    options: question.options,
                    counts: optionCounts,
                    answers: detailedAnswers,
                    totalResponses: responses.length
                };
            }
        });

        setChartData(preparedData);
    };

    const filteredResponses = () => {
        switch(filter) {
            case 'anonymous':
                return responses.filter(r => !r.userEmail);
            case 'named':
                return responses.filter(r => r.userEmail);
            default:
                return responses;
        }
    };

    const exportToCSV = () => {
        let content = '';
        
        content += `Опрос: "${poll.title}"\n`;
        content += `Дата создания: ${poll.createdAt.toLocaleString()}\n`;
        content += `Всего ответов: ${responses.length}\n\n`;
        
        chartData.forEach(chart => {
            content += `Вопрос: "${chart.questionText}"\n`;
            
            if (chart.type === 'text') {
                content += `Тип: Текстовый ответ\n`;
                content += `Ответы:\n`;
                chart.answers.forEach((answer, i) => {
                    content += `${i + 1}. ${answer.userEmail}: "${answer.answer}" (${answer.timestamp.toLocaleString()})\n`;
                });
            } else if (chart.type === 'scale') {
                content += `Тип: Шкала (${chart.scaleRange.min}-${chart.scaleRange.max})\n`;
                content += `Распределение ответов:\n`;
                chart.labels.forEach((label, i) => {
                    content += `${label}: ${chart.counts[i]} ответов\n`;
                });
                content += `\nДетальные ответы:\n`;
                chart.answers.forEach((answer, i) => {
                    content += `${i + 1}. ${answer.userEmail}: ${answer.value} (${answer.timestamp.toLocaleString()})\n`;
                });
            } else {
                content += `Тип: ${chart.type === 'single' ? 'Один вариант' : 'Несколько вариантов'}\n`;
                content += `Варианты и количество ответов:\n`;
                chart.options.forEach((option, i) => {
                    content += `${option}: ${chart.counts[i]} ответов\n`;
                });
                content += `\nДетальные ответы:\n`;
                chart.answers.forEach((answer, i) => {
                    content += `${i + 1}. ${answer.userEmail}: ${answer.options.join(', ')} (${answer.timestamp.toLocaleString()})\n`;
                });
            }
            
            content += '\n';
        });

        const blob = new Blob([content], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `poll_results_${poll.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast.success('Результаты экспортированы в CSV');
    };

    const exportToPDF = async () => {
        if (!resultsRef.current) return;
        
        const canvas = await html2canvas(resultsRef.current);
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`poll_results_${poll.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`);
        
        toast.success('Результаты экспортированы в PDF');
    };

    const exportToPNG = async () => {
        if (!resultsRef.current) return;
        
        const canvas = await html2canvas(resultsRef.current);
        const link = document.createElement('a');
        link.download = `poll_results_${poll.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        
        toast.success('Результаты экспортированы в PNG');
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
    
        try {
          if (!user) throw new Error('Пользователь не авторизован');
          
          const credential = EmailAuthProvider.credential(
            user.email,
            formData.currentPassword
          );
          await reauthenticateWithCredential(user, credential);
    
          if (formData.email !== user.email) {
            await updateEmail(user, formData.email);
          }
    
          if (formData.newPassword && formData.newPassword === formData.confirmPassword) {
            await updatePassword(user, formData.newPassword);
          }
    
          setSuccess('Профиль успешно обновлен!');
          setEditMode(false);
          setShowProfileMenu(false);
        } catch (error) {
          setError('Ошибка обновления: ' + error.message);
          console.error(error);
        }
      };

      const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
      };

    const handleLogout = async () => {
        try {
          await signOut(auth);
          setShowProfileMenu(false);
        } catch (error) {
          console.error('Logout error:', error);
          setError('Ошибка при выходе: ' + error.message);
        }
      };

    const copyPollLink = async () => {
        try {
            const pollUrl = `${window.location.origin}/poll/${id}`;
            
            if (!navigator.clipboard) {
                const textArea = document.createElement('textarea');
                textArea.value = pollUrl;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                toast.success('Ссылка скопирована (fallback)');
                return;
            }
            
            await navigator.clipboard.writeText(pollUrl);
            toast.success('Ссылка на опрос скопирована!');
        } catch (err) {
            console.error('Не удалось скопировать ссылку:', err);
            toast.error('Не удалось скопировать ссылку');
        }
    };

    if (loading) return (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          backgroundColor: '#D6E8EE'
        }}>
          <PulseLoader color="#02457A" size={15} margin={5} />
        </div>
      );
    if (!poll) return <div className={styles.error}>Опрос не найден</div>;

    return (
        <div className={styles.pageContainer} style={{
            backgroundColor: '#D6E8EE',
            color: '#000',
            textDecoration: 'none',
            minHeight: '100vh'
        }}>
            <header className={styles["app-header"]} style={{ 
        backgroundColor: '#D6E8EE',
        width: '100%',
      }}>
        <Link href="/" className={styles["logo"]}>HantaPoll</Link>
        <div className={styles["header-nav"]}>
          <Link href="/pollbuild" className={styles["nav-link"]}>
            Конструктор опросов
          </Link>
          <Link href="/polls" className={styles["nav-link"]}>
            Мои опросы
          </Link>
        </div>
        <div className={styles["user-avatar-container"]}>
          <div 
            className={styles["user-avatar"]}
            onClick={toggleProfileMenu}
          >
            {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
          </div>
          
          {showProfileMenu && (
            <div className={styles["profile-menu"]}>
              <div className={styles["profile-menu-header"]}>
                <div className={styles["profile-avatar"]}>
                  {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className={styles["profile-email"]}>{user?.email || 'Неизвестный пользователь'}</div>
              </div>
              
              {!editMode ? (
                <>
                  <button 
                    onClick={() => setEditMode(true)}
                    className={styles["profile-menu-button"]}
                  >
                    Редактировать профиль
                  </button>
                  <button 
                    onClick={handleLogout}
                    className={styles["profile-menu-button-rem"]}
                  >
                    Выйти
                  </button>
                </>
              ) : (
                <form onSubmit={handleUpdateProfile} className={styles["profile-menu-form"]}>
                  <div className={styles["form-group"]}>
                    <label>Email:</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className={styles["form-group"]}>
                    <label>Текущий пароль:</label>
                    <input
                      type="password"
                      name="currentPassword"
                      value={formData.currentPassword}
                      placeholder="Текущий пароль" 
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className={styles["form-group"]}>
                    <label>Новый пароль:</label>
                    <input
                      type="password"
                      name="newPassword"
                      value={formData.newPassword}
                      placeholder="Новый пароль" 
                      onChange={handleInputChange}
                    />
                  </div>

                  {formData.newPassword && (
                    <div className={styles["form-group"]}>
                      <label>Подтвердите пароль:</label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                      />
                    </div>
                  )}

                  {error && <div className={styles["error-message"]}>{error}</div>}
                  {success && <div className={styles["success-message"]}>{success}</div>}

                  <div className={styles["form-actions"]}>
                    <button type="submit" className={styles["save-button"]}>
                      Сохранить
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        setEditMode(false);
                        setError('');
                        setSuccess('');
                      }}
                      className={styles["cancel-button"]}
                    >
                      Отмена
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </header>

            <div className={styles.resultsContainer} ref={resultsRef}>
                <ToastContainer position="top-right" autoClose={3000} />
                
                <div className={styles.resultsHeader}>
                    <h1 className={styles.maintxt}>АНАЛИТИКА ОПРОСА "{poll.title}"</h1>
                </div>

                <div className={styles.summaryInfo}>
                    <p><strong>Всего ответов:</strong> {responses.length}</p>
                    <p><strong>Дата создания:</strong> {poll.createdAt.toLocaleString()}</p>
                    <p><strong>Статус:</strong> {poll.pollSettings?.isAnonymous ? 'Анонимный' : 'Именной'}</p>
                </div>

                <div className={styles.controls}>
                    <div className={styles.tabs}>
                        <button
                            className={`${styles.tabButton} ${activeTab === 'charts' ? styles.activeTab : ''}`}
                            onClick={() => setActiveTab('charts')}
                        >
                            Графики
                        </button>
                        <button
                            className={`${styles.tabButton} ${activeTab === 'details' ? styles.activeTab : ''}`}
                            onClick={() => setActiveTab('details')}
                        >
                            Детальные ответы
                        </button>
                    </div>

                    {activeTab === 'charts' && (
                        <div className={styles.chartControls}>
                            <select
                                value={chartType}
                                onChange={(e) => setChartType(e.target.value)}
                                className={styles.chartTypeSelect}
                            >
                                <option value="bar">Столбчатая</option>
                                <option value="pie">Круговая</option>
                                <option value="line">Линейная</option>
                            </select> <br/>
                        </div>
                    )}

                    <div className={styles.filterControls}>
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className={styles.filterSelect}
                        >
                            <option value="all">Все ответы</option>
                            <option value="named">Только именные</option>
                            <option value="anonymous">Только анонимные</option>
                        </select>
                    </div>
                </div>

                {activeTab === 'charts' ? (
                    <div className={styles.chartsSection}>
                        {chartData.map((chart, index) => (
                            <div key={index} className={styles.chartSection}>
                                <h2>{chart.questionText}</h2>
                                
                                {chart.type === 'text' ? (
                                    <div className={styles.textAnswersSection}>
                                        <h3>Текстовые ответы ({chart.answers.length}):</h3>
                                        <div className={styles.textAnswersList}>
                                            {chart.answers.slice(0, 3).map((answer, i) => (
                                                <div key={i} className={styles.textAnswerItem}>
                                                    <strong>{answer.userEmail}:</strong> "{answer.answer}"
                                                    <span className={styles.answerTime}>
                                                        {answer.timestamp.toLocaleString()}
                                                    </span>
                                                </div>
                                            ))}
                                            {chart.answers.length > 3 && (
                                                <p>...и еще {chart.answers.length - 3} ответов</p>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className={styles.chartWrapper}>
                                        {chartType === 'pie' ? (
                                            <Pie
                                                data={{
                                                    labels: chart.type === 'scale' ? chart.labels : chart.options,
                                                    datasets: [{
                                                        data: chart.counts,
                                                        backgroundColor: [
                                                            '#02457A',
                                                            '#3B536A',
                                                            '#2D4A6E',
                                                            '#1E3D6E',
                                                            '#0D2E6E',
                                                            '#002366'
                                                        ],
                                                        borderWidth: 1,
                                                    }]
                                                }}
                                                options={{
                                                    responsive: true,
                                                    maintainAspectRatio: false,
                                                    plugins: {
                                                        tooltip: {
                                                            callbacks: {
                                                                label: function(context) {
                                                                    const value = context.raw;
                                                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                                                    const percentage = Math.round((value / total) * 100);
                                                                    return `${context.label}: ${value} (${percentage}%)`;
                                                                }
                                                            }
                                                        },
                                                        legend: {
                                                            position: 'right',
                                                        }
                                                    }
                                                }}
                                                height={200}
                                            />
                                        ) : chartType === 'line' ? (
                                            <Line
                                                data={{
                                                    labels: chart.type === 'scale' ? chart.labels : chart.options,
                                                    datasets: [{
                                                        label: 'Количество ответов',
                                                        data: chart.counts,
                                                        borderColor: '#02457A',
                                                        backgroundColor: '#02457A55',
                                                        tension: 0.1,
                                                        fill: true
                                                    }]
                                                }}
                                                options={{
                                                    responsive: true,
                                                    maintainAspectRatio: false,
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
                                                        },
                                                        legend: {
                                                            display: false
                                                        }
                                                    },
                                                    scales: {
                                                        y: {
                                                            beginAtZero: true,
                                                            ticks: {
                                                                stepSize: 1
                                                            }
                                                        }
                                                    }
                                                }}
                                                height={200}
                                            />
                                        ) : (
                                            <Bar
                                                data={{
                                                    labels: chart.type === 'scale' ? chart.labels : chart.options,
                                                    datasets: [{
                                                        label: 'Количество ответов',
                                                        data: chart.counts,
                                                        backgroundColor: '#02457A',
                                                    }]
                                                }}
                                                options={{
                                                    indexAxis: 'y',
                                                    responsive: true,
                                                    maintainAspectRatio: false,
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
                                                        },
                                                        legend: {
                                                            display: false
                                                        }
                                                    },
                                                    scales: {
                                                        x: {
                                                            beginAtZero: true,
                                                            ticks: {
                                                                stepSize: 1
                                                            }
                                                        }
                                                    }
                                                }}
                                                height={200}
                                            />
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className={styles.detailsSection}>
                        <div className={styles.responsesTable}>
                            <table className={styles.resultsTable}>
                                <thead>
                                    <tr>
                                        <th className={styles.userHeader}>Пользователь</th>
                                        {poll.questions.map((q, i) => (
                                            <th key={i} className={styles.questionHeader}>{q.text}</th>
                                        ))}
                                        <th className={styles.timeHeader}>Время ответа</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredResponses().map((response, i) => (
                                        <tr key={i} className={styles.responseRow}>
                                            <td className={styles.userCell}>{response.userEmail || 'Аноним'}</td>
                                            {poll.questions.map((q, qIndex) => {
                                                const answer = response.answers[q.id];
                                                let displayAnswer = '';
                                                
                                                if (q.type === 'text') {
                                                    displayAnswer = answer || '-';
                                                } else if (q.type === 'scale') {
                                                    displayAnswer = answer || '-';
                                                } else {
                                                    if (typeof answer === 'object') {
                                                        const selectedOptions = [];
                                                        for (const key in answer) {
                                                            if (answer[key] && q.options[key]) {
                                                                selectedOptions.push(q.options[key]);
                                                            }
                                                        }
                                                        displayAnswer = selectedOptions.join(', ') || '-';
                                                    } else {
                                                        displayAnswer = '-';
                                                    }
                                                }
                                                
                                                return (
                                                    <td key={qIndex} className={styles.answerCell}>
                                                        {displayAnswer.length > 30 
                                                            ? `${displayAnswer.substring(0, 30)}...` 
                                                            : displayAnswer}
                                                    </td>
                                                );
                                            })}
                                            <td className={styles.answerTime}>{response.timestamp?.toLocaleString() || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
                <div className={styles.headerActions}>
                        <div className={styles.exportControls}>
                            <button onClick={exportToCSV} className={styles.exportButton}>
                                CSV
                            </button>
                            <button onClick={exportToPDF} className={styles.exportButton}>
                                PDF
                            </button>
                            <button onClick={exportToPNG} className={styles.exportButton}>
                                PNG
                            </button>
                        </div>
                        <button 
                            onClick={copyPollLink}
                            className={styles.shareButton}
                        >
                            Поделиться опросом
                        </button>
                    </div>
            </div>
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
        </div>
    );
};

export default PollResultsPage;