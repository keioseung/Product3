"use client"

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaChartLine, FaArrowRight, FaGlobe, FaCode, FaCoins, FaPiggyBank, FaMoneyBillWave, FaTrophy, FaLightbulb, FaUsers, FaBookOpen, FaCalendar, FaClipboard, FaBullseye, FaFire, FaStar, FaCrosshairs, FaChartBar } from 'react-icons/fa'
import { TrendingUp, Calendar, Trophy, Sun, Target, BarChart3, BookOpen } from 'lucide-react'
import Sidebar from '@/components/sidebar'
import AIInfoCard from '@/components/ai-info-card'
import TermsQuizSection from '@/components/terms-quiz-section'
import ProgressSection from '@/components/progress-section'
import LearnedTermsSection from '@/components/learned-terms-section'
import useAIInfo from '@/hooks/use-ai-info'
import useUserProgress, { useUserStats } from '@/hooks/use-user-progress'
import { useRouter } from 'next/navigation'
import { useFetchAINews } from '@/hooks/use-ai-info'
import { useQueryClient } from '@tanstack/react-query'
import { userProgressAPI } from '@/lib/api'

// 예시 용어 데이터
const TERMS = [
  { term: '복리', desc: '이자가 원금에 합쳐져서 그 합계 금액에 대해 다시 이자가 계산되는 방식입니다.' },
  { term: '인플레이션', desc: '물가가 지속적으로 상승하여 화폐의 구매력이 감소하는 경제 현상.' },
  { term: '포트폴리오', desc: '위험 분산을 위해 여러 종류의 투자 상품을 조합한 투자 구성.' },
  { term: '주가수익비율', desc: '주가를 주당순이익으로 나눈 값으로 주식의 상대적 가치를 평가하는 지표.' },
  { term: '채권', desc: '정부나 기업이 자금 조달을 위해 발행하는 부채 증서.' },
  { term: '배당수익률', desc: '주당 배당금을 주가로 나눈 비율로 투자 수익성을 나타내는 지표.' },
  { term: '자산배분', desc: '투자 목표와 위험 성향에 따라 주식, 채권 등 자산군별로 투자 비중을 정하는 것.' },
  { term: '금리', desc: '돈을 빌려준 대가로 받는 이자의 비율.' },
  { term: '환율', desc: '한 나라 화폐와 다른 나라 화폐 간의 교환 비율.' },
  { term: '펀드', desc: '여러 투자자의 자금을 모아 전문가가 대신 운용하는 투자 상품.' },
]

// 1. 주간 학습 현황 막대 그래프 컴포넌트 추가 (탭 위에)
function WeeklyBarGraph({ weeklyData }: { weeklyData: any[] }) {
        const maxFinance = 3;
      const maxTerms = 20;
      const maxQuiz = 100;
      return (
        <div className="w-full max-w-3xl mx-auto mb-8">
          <div className="flex justify-between mb-2 px-2">
            {weeklyData.map((day, idx) => (
              <div key={idx} className={`text-xs font-bold text-center ${day.isToday ? 'text-yellow-400' : 'text-white/60'}`}>{day.day}</div>
            ))}
          </div>
          <div className="flex gap-2 h-32 items-end">
            {weeklyData.map((day, idx) => {
              const financeHeight = Math.round((day.ai / maxFinance) * 80);
              const termsHeight = Math.round((day.terms / maxTerms) * 80);
              const quizHeight = Math.round((day.quiz / maxQuiz) * 80);
              return (
                <div key={idx} className="flex-1 flex flex-col items-center">
                  <div className="flex flex-col-reverse h-28 w-6 relative">
                    {/* 퀴즈 */}
                    <div style={{ height: `${quizHeight}px` }} className="w-full bg-gradient-to-t from-green-500 to-emerald-400 rounded-t-md" />
                    {/* 용어 */}
                    <div style={{ height: `${termsHeight}px` }} className="w-full bg-gradient-to-t from-emerald-500 to-green-400" />
                    {/* 금융 정보 */}
                    <div style={{ height: `${financeHeight}px` }} className="w-full bg-gradient-to-t from-teal-500 to-green-400 rounded-b-md" />
                    {day.isToday && <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-xs text-yellow-400 font-bold">오늘</div>}
                  </div>
                  <div className="mt-1 text-xs text-white/70">{day.ai + day.terms + Math.round(day.quiz/10)}</div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-2 px-2 text-[10px] text-white/40">
            <div>금융</div><div>용어</div><div>퀴즈</div>
          </div>
        </div>
      );
}

export default function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })
  const [sessionId] = useState(() => {
    if (typeof window !== 'undefined') {
      let id = localStorage.getItem('sessionId')
      if (!id) {
        id = Math.random().toString(36).substring(2, 15)
        localStorage.setItem('sessionId', id)
      }
      return id
    }
    return 'default'
  })
  const { data: aiInfo, isLoading: aiInfoLoading } = useAIInfo(selectedDate)
  const { data: userProgress, isLoading: progressLoading } = useUserProgress(sessionId)
  const { data: userStats } = useUserStats(sessionId)
  const router = useRouter()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'ai' | 'quiz' | 'progress' | 'news' | 'term'>('ai')
  const { data: news, isLoading: newsLoading } = useFetchAINews()
  const [randomTerm, setRandomTerm] = useState(() => TERMS[Math.floor(Math.random() * TERMS.length)])
  
  // 타이핑 애니메이션 상태
  const [typedText, setTypedText] = useState('')
  const [isTyping, setIsTyping] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const fullText = "Finance Mastery Hub"
  
  // 환영 메시지 애니메이션
  const [currentWelcome, setCurrentWelcome] = useState(0)
  const welcomeMessages = [
    "오늘도 금융 학습을 시작해보세요! 🚀",
    "새로운 지식이 여러분을 기다리고 있어요! 💡",
    "함께 성장하는 금융 여정을 떠나볼까요? 🌟"
  ]

  const handleRandomTerm = () => {
    setRandomTerm(TERMS[Math.floor(Math.random() * TERMS.length)])
  }

  // 타이핑 애니메이션
  useEffect(() => {
    if (currentIndex < fullText.length) {
      const timeout = setTimeout(() => {
        setTypedText(fullText.slice(0, currentIndex + 1))
        setCurrentIndex(currentIndex + 1)
      }, 150)
      return () => clearTimeout(timeout)
    } else {
      setIsTyping(false)
    }
  }, [currentIndex, fullText])

  // 환영 메시지 순환
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWelcome((prev) => (prev + 1) % welcomeMessages.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [welcomeMessages.length])

  useEffect(() => {
    const userStr = localStorage.getItem('currentUser')
    if (!userStr) {
      router.replace('/auth')
      return
    }
    const user = JSON.parse(userStr)
    if (user.role !== 'user') {
      router.replace('/admin')
    }
  }, [router])

  // 학습 진행률 계산 (로컬 스토리지와 백엔드 데이터 통합)
  const totalAIInfo = aiInfo?.length || 0
  
  // 로컬 스토리지에서 학습 상태 확인 (강제 업데이트 포함)
  const localProgress = (() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('userProgress')
        if (stored) {
          const parsed = JSON.parse(stored)
          return parsed[sessionId]?.[selectedDate] || []
        }
      } catch (error) {
        console.error('Failed to parse local progress:', error)
      }
    }
    return []
  })()
  
  // 백엔드 데이터와 로컬 데이터 통합
  const backendProgress = userProgress?.[selectedDate] || []
  const learnedAIInfo = Math.max(localProgress.length, backendProgress.length)
  const aiInfoProgress = totalAIInfo > 0 ? (learnedAIInfo / totalAIInfo) * 100 : 0

  const totalTerms = 60 // 3개 AI 정보 × 20개 용어씩
  const learnedTerms = Array.isArray(userProgress?.total_terms_learned) ? userProgress.total_terms_learned.length : (userProgress?.total_terms_learned ?? 0)
  const termsProgress = totalTerms > 0 ? (learnedTerms / totalTerms) * 100 : 0

  // 퀴즈 점수 계산 - 당일 푼 전체 문제수가 분모, 정답 맞춘 총 개수가 분자
  const quizScore = (() => {
    if (typeof userProgress?.quiz_score === 'number') {
      return Math.min(userProgress.quiz_score, 100)
    }
    if (Array.isArray(userProgress?.quiz_score)) {
      const totalQuestions = userProgress.quiz_score.length
      const correctAnswers = userProgress.quiz_score.filter(score => score > 0).length
      return totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0
    }
    return 0
  })()
  const maxQuizScore = 100
  const quizProgress = (quizScore / maxQuizScore) * 100

  const streakDays = Array.isArray(userProgress?.streak_days) ? userProgress.streak_days.length : (userProgress?.streak_days ?? 0)
  const maxStreak = Array.isArray(userProgress?.max_streak) ? userProgress.max_streak.length : (userProgress?.max_streak ?? 0)
  const streakProgress = maxStreak > 0 ? (streakDays / maxStreak) * 100 : 0

  // 오늘 날짜 확인
  const today = new Date()
  const todayDay = today.getDay() // 0: 일요일, 1: 월요일, ..., 6: 토요일

  // 주간 학습 데이터 - 실제 사용자 데이터 기반 (월~일 7일 모두)
  const getWeeklyDates = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0: 일, 1: 월, ...
    // 이번주 월요일 구하기
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
    // 7일치 날짜 배열 생성
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  };
  const weeklyDates = getWeeklyDates();
  const weeklyData = weeklyDates.map((dateObj, idx) => {
    const dateStr = dateObj.toISOString().split('T')[0];
    // AI 정보, 용어, 퀴즈 데이터 추출 (userProgress 기준)
    const ai = Array.isArray(userProgress?.[dateStr]) ? userProgress[dateStr].length : 0;
    const termsArr =
      userProgress &&
      typeof userProgress.terms_by_date === 'object' &&
      userProgress.terms_by_date !== null &&
      !Array.isArray(userProgress.terms_by_date) &&
      Object.prototype.hasOwnProperty.call(userProgress.terms_by_date, dateStr)
        ? (userProgress.terms_by_date as Record<string, any[]>)[dateStr]
        : undefined;
    const terms = Array.isArray(termsArr) ? termsArr.length : 0;
    let quiz = 0;
    const quizScoreArr =
      userProgress &&
      typeof userProgress.quiz_score_by_date === 'object' &&
      userProgress.quiz_score_by_date !== null &&
      !Array.isArray(userProgress.quiz_score_by_date) &&
      Object.prototype.hasOwnProperty.call(userProgress.quiz_score_by_date, dateStr)
        ? (userProgress.quiz_score_by_date as Record<string, any[]>)[dateStr]
        : undefined;
    if (Array.isArray(quizScoreArr)) {
      const totalQuestions = quizScoreArr.length;
      const correctAnswers = quizScoreArr.filter((score: number) => score > 0).length;
      quiz = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
    } else if (typeof quizScoreArr === 'number') {
      quiz = quizScoreArr;
    }
    // 오늘 여부
    const isToday = dateStr === selectedDate;
    // 요일명
    const days = ['월', '화', '수', '목', '금', '토', '일'];
    return {
      day: days[idx],
      ai,
      terms,
      quiz,
      isToday,
    };
  });

  // 오늘 학습 데이터 반영
  const todayIndex = todayDay === 0 ? 6 : todayDay - 1 // 일요일은 인덱스 6
  weeklyData[todayIndex].ai = learnedAIInfo
  weeklyData[todayIndex].terms = learnedTerms
  weeklyData[todayIndex].quiz = Math.min(quizScore, 100) // 퀴즈 점수는 최대 100점

  // AI 정보 3개만 정확히 보여줌
  const aiInfoFixed = aiInfo && aiInfo.length > 0 ? aiInfo.slice(0, 3) : []

  const [forceUpdate, setForceUpdate] = useState(0)
  
  // 진행률 업데이트 핸들러
  const handleProgressUpdate = () => {
    queryClient.invalidateQueries({ queryKey: ['user-progress', sessionId] })
    queryClient.invalidateQueries({ queryKey: ['user-stats', sessionId] })
    queryClient.invalidateQueries({ queryKey: ['learned-terms', sessionId] })
    setForceUpdate(prev => prev + 1) // 강제 리렌더링
  }

  // 새로고침 핸들러(탭별)
  const handleRefresh = () => window.location.reload()

  // 토스트 알림 상태
  const [toast, setToast] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 2500)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900 relative overflow-hidden px-4">
      {/* 고급스러운 배경 효과 */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.3),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(16,185,129,0.15),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(34,197,94,0.15),transparent_50%)]" />
      
      {/* 움직이는 파티클 효과 */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 4}s`
            }}
          />
        ))}
      </div>

      {/* 토스트 알림 */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            className="fixed top-8 left-1/2 z-50 -translate-x-1/2 px-6 py-3 rounded-2xl shadow-xl text-white font-bold text-lg glass"
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 헤더 섹션 */}
      <div className="relative z-10 flex flex-col items-center justify-center pt-8 md:pt-12 pb-6">
        {/* 상단 아이콘과 제목 */}
        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 mb-6 md:mb-8 text-center md:text-left">
          <div className="relative">
            <span className="text-5xl md:text-6xl text-green-400 drop-shadow-2xl animate-bounce-slow">
              <FaChartLine />
            </span>
            <div className="absolute -top-2 -right-2 w-4 h-4 md:w-6 md:h-6 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full animate-pulse" />
          </div>
          <div className="flex flex-col items-center md:items-start">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black bg-gradient-to-r from-white via-green-200 to-emerald-200 bg-clip-text text-transparent drop-shadow-2xl tracking-tight leading-tight">
              {typedText}
              {isTyping && <span className="animate-blink">|</span>}
            </h1>
            <div className="h-6 md:h-8 mt-2">
              <p className="text-lg md:text-xl lg:text-2xl text-green-300 font-medium animate-fade-in-out">
                {welcomeMessages[currentWelcome]}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 날짜 선택 (금융 정보 탭에서만 표시) */}
      {activeTab === 'ai' && (
        <div className="flex justify-center mb-6 md:mb-8">
          <div className="glass backdrop-blur-xl rounded-2xl px-4 md:px-8 py-3 md:py-4 flex items-center gap-4 md:gap-6 shadow-xl border border-white/10">
            <FaCalendar className="w-5 h-5 md:w-6 md:h-6 text-green-400" />
            <input 
              type="date" 
              value={selectedDate} 
              onChange={e => setSelectedDate(e.target.value)} 
              className="p-2 md:p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-300 text-sm md:text-lg font-semibold shadow" 
              style={{ minWidth: 140, maxWidth: 180 }} 
            />
            <span className="px-2 md:px-3 py-1 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold text-xs md:text-sm shadow">
              {selectedDate === new Date().toISOString().split('T')[0] ? '오늘' : selectedDate}
            </span>
          </div>
        </div>
      )}

      {/* 탭 메뉴 */}
      <div className="flex justify-center mb-6 md:mb-8">
        <div className="flex flex-wrap gap-2 md:gap-4 bg-white/10 backdrop-blur-xl rounded-2xl p-2 md:p-3 shadow-lg border border-white/10">
          {[
            { id: 'ai', label: '금융 정보', gradient: 'from-green-500 to-emerald-500' },
            { id: 'quiz', label: '용어 퀴즈', gradient: 'from-emerald-500 to-green-500' },
            { id: 'progress', label: '진행률', gradient: 'from-green-500 to-teal-500' },
            { id: 'news', label: '금융 뉴스', gradient: 'from-teal-500 to-green-500' },
            { id: 'term', label: '용어 학습', gradient: 'from-emerald-500 to-teal-500' }
          ].map((tab) => (
            <button
              key={tab.id}
              className={`px-4 md:px-6 py-2 md:py-3 rounded-xl font-bold text-sm md:text-base transition-all ${
                activeTab === tab.id 
                  ? `bg-gradient-to-r ${tab.gradient} text-white shadow-lg` 
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
              onClick={() => setActiveTab(tab.id as any)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button 
          onClick={handleRefresh} 
          className="ml-3 md:ml-6 px-3 md:px-4 py-2 bg-white/20 backdrop-blur-xl text-white rounded-lg hover:bg-white/30 transition-all font-semibold shadow border border-white/10"
        >
          새로고침
        </button>
      </div>

      {/* 메인 컨텐츠 */}
      <main className="flex-1 pb-8 md:pb-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5 }} 
          className="max-w-4xl mx-auto"
        >
          {/* 탭별 컨텐츠 */}
          {activeTab === 'ai' && (
            <section className="mb-8 md:mb-16">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                {aiInfoFixed.length === 0 && (
                  <div className="glass backdrop-blur-xl rounded-2xl p-6 md:p-8 flex flex-col items-center justify-center text-center text-white/70 shadow-xl min-h-[180px] border border-white/10">
                    <FaBookOpen className="w-10 h-10 md:w-12 md:h-12 mb-3 opacity-60" />
                    <span className="text-base md:text-lg font-semibold">금융 정보가 없습니다</span>
                  </div>
                )}
                {aiInfoFixed.map((info, index) => {
                  // 로컬 스토리지와 백엔드 데이터를 모두 확인하여 학습 상태 결정
                  const isLearnedLocally = localProgress.includes(index)
                  const isLearnedBackend = backendProgress.includes(index)
                  const isLearned = isLearnedLocally || isLearnedBackend
                  
                  return (
                    <AIInfoCard
                      key={index}
                      info={info}
                      index={index}
                      date={selectedDate}
                      sessionId={sessionId}
                      isLearned={isLearned}
                      onProgressUpdate={handleProgressUpdate}
                      forceUpdate={forceUpdate}
                      setForceUpdate={setForceUpdate}
                    />
                  )
                })}
              </div>
            </section>
          )}
          {activeTab === 'quiz' && (
            <section className="mb-8 md:mb-16">
              <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-6 md:mb-8 flex items-center gap-3 md:gap-4 drop-shadow">
                <Target className="w-6 h-6 md:w-8 md:h-8" />
                용어 퀴즈
              </h2>
              <TermsQuizSection 
                sessionId={sessionId} 
                selectedDate={selectedDate} 
                onProgressUpdate={handleProgressUpdate}
                onDateChange={setSelectedDate}
              />
            </section>
          )}
          {activeTab === 'progress' && (
            <section className="mb-8 md:mb-16">
              <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-6 md:mb-8 flex items-center gap-3 md:gap-4 drop-shadow">
                <TrendingUp className="w-6 h-6 md:w-8 md:h-8" />
                나의 학습 성장도
              </h2>
              <ProgressSection 
                sessionId={sessionId} 
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
              />
            </section>
          )}
          {activeTab === 'news' && (
            <section className="mb-8 md:mb-16">
              <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-6 md:mb-8 flex items-center gap-3 md:gap-4 drop-shadow">
                <FaBookOpen className="w-6 h-6 md:w-8 md:h-8" />
                금융 뉴스
              </h2>
              {newsLoading ? (
                <div className="text-white/80 text-center">뉴스를 불러오는 중...</div>
              ) : news && news.length > 0 ? (
                <div className="space-y-4 md:space-y-6">
                  {news.map((item: any, idx: number) => (
                    <a 
                      key={idx} 
                      href={item.link} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="block glass backdrop-blur-xl rounded-2xl p-4 md:p-6 shadow hover:bg-white/10 transition-all border border-white/10"
                    >
                      <h3 className="text-lg md:text-xl font-bold text-white mb-2 line-clamp-2">{item.title}</h3>
                      <p className="text-white/80 mb-2 line-clamp-3">{item.content}</p>
                      <span className="text-green-300 text-sm">뉴스 원문 보기 →</span>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="text-white/70 text-center">금융 뉴스가 없습니다.</div>
              )}
            </section>
          )}
          {activeTab === 'term' && (
            <section className="mb-8 md:mb-16">
              <LearnedTermsSection sessionId={sessionId} />
            </section>
          )}
        </motion.div>
      </main>

      {/* 커스텀 애니메이션 스타일 */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.2; }
          50% { transform: translateY(-20px) rotate(180deg); opacity: 0.8; }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s infinite;
        }
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        .animate-blink {
          animation: blink 1s infinite;
        }
        @keyframes fade-in-out {
          0%, 100% { opacity: 0; transform: translateY(10px); }
          20%, 80% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-out {
          animation: fade-in-out 3s ease-in-out infinite;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: none; }
        }
        .animate-fade-in {
          animation: fade-in 1.5s cubic-bezier(0.22,1,0.36,1) both;
        }
      `}</style>
    </div>
  )
} 