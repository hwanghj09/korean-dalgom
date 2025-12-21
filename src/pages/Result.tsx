import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import type { Question } from '../types';
import Layout from '../components/Layout';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';

export default function Result() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'correct' | 'incorrect'>('all');
  const [showTopBtn, setShowTopBtn] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  
  const user = auth.currentUser;

  // 데이터가 없을 경우 얼리 리턴
  if (!state) return <Layout><div className="text-center py-20">데이터가 없습니다.</div></Layout>;

  const { questions, userAnswers, category } = state as { questions: Question[]; userAnswers: number[]; category: string };
  const incorrectList = questions.filter((q, idx) => q.answer !== userAnswers[idx]);
  const correctCount = questions.length - incorrectList.length;
  const score = Math.round((correctCount / questions.length) * 100);

  // --- 🔥 [핵심] Firestore 자동 저장 로직 ---
  useEffect(() => {
    const saveToFirestore = async () => {
      // 로그인하지 않았거나 결과 데이터가 없으면 중단
      if (!user || !state) return;

      const userRef = doc(db, "users", user.uid);
      
      try {
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          // 1. 기존 데이터가 있는 경우: 기존 값에 현재 점수 합산
          const currentData = userSnap.data();
          await updateDoc(userRef, {
            totalSolved: (currentData.totalSolved || 0) + questions.length,
            totalCorrect: (currentData.totalCorrect || 0) + correctCount,
            totalIncorrect: (currentData.totalIncorrect || 0) + (questions.length - correctCount),
            lastUpdated: new Date().toISOString()
          });
        } else {
          // 2. 처음 플레이하는 유저인 경우: 새 문서 생성
          await setDoc(userRef, {
            email: user.email,
            totalSolved: questions.length,
            totalCorrect: correctCount,
            totalIncorrect: questions.length - correctCount,
            lastUpdated: new Date().toISOString()
          });
        }
        console.log("✅ Firestore 데이터 업데이트 성공!");
      } catch (e) {
        console.error("❌ Firestore 저장 실패:", e);
      }
    };

    saveToFirestore();
  }, []); // 의존성 배열을 비워두어 페이지 진입 시 단 1회만 실행

  // 스크롤 버튼 로직
  useEffect(() => {
    const handleScroll = () => setShowTopBtn(window.scrollY > 300);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const filtered = questions.map((q, idx) => ({ q, idx })).filter(({ q, idx }) => {
    if (filter === 'correct') return q.answer === userAnswers[idx];
    if (filter === 'incorrect') return q.answer !== userAnswers[idx];
    return true;
  });

  return (
    <Layout>
      <div className="max-w-3xl mx-auto pb-24 px-4 animate-in fade-in duration-700">
        {/* 상단 점수판 */}
        <div className="bg-white p-10 rounded-[2.5rem] shadow-xl shadow-blue-50 border border-blue-50 mb-8 text-center">
          <h2 className="text-gray-400 font-bold mb-2 text-sm tracking-widest uppercase">Result</h2>
          <div className="text-7xl font-black text-blue-600 mb-6 italic">{score}점</div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => navigate('/')} className="py-4 bg-gray-100 rounded-2xl font-bold text-gray-600 active:scale-95 transition-all">홈으로</button>
            <button 
              onClick={() => navigate(`/quiz/${category}`, { state: { retryQuestions: incorrectList } })}
              disabled={incorrectList.length === 0}
              className="py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 disabled:bg-gray-200 active:scale-95 transition-all"
            >오답 재도전</button>
          </div>
        </div>

        {/* 필터 탭 */}
        <div className="flex p-1.5 bg-gray-100 rounded-2xl mb-8">
          {(['all', 'correct', 'incorrect'] as const).map((t) => (
            <button key={t} onClick={() => setFilter(t)} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${filter === t ? "bg-white text-blue-600 shadow-sm" : "text-gray-400"}`}>
              {t === 'all' ? '전체' : t === 'correct' ? '정답' : '오답'}
            </button>
          ))}
        </div>

        {/* 문제 리스트 */}
        <div className="space-y-6">
          {filtered.map(({ q, idx }) => {
            const isCorrect = q.answer === userAnswers[idx];
            return (
              <div key={q.id} className={`bg-white p-6 rounded-2xl border-2 ${isCorrect ? 'border-green-100' : 'border-red-100 shadow-sm'}`}>
                <div className="flex justify-between items-center mb-4">
                  <span className={`px-3 py-1 rounded-lg text-xs font-black ${isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{isCorrect ? '정답' : '오답'}</span>
                  <span className="text-gray-400 font-bold text-sm"># {idx + 1}</span>
                </div>
                <p className="font-bold text-gray-800 mb-6 leading-relaxed">{q.question}</p>
                
                <div className="bg-gray-50 p-4 rounded-xl border mb-4 flex justify-between text-sm font-bold">
                  <span className="text-blue-600">정답: {q.answer + 1}번</span>
                  <span className={isCorrect ? "text-green-600" : "text-red-600"}>내 선택: {userAnswers[idx] !== null ? `${userAnswers[idx] + 1}번` : '미선택'}</span>
                </div>

                {/* 해설 영역 */}
                {user ? (
                  <div className="bg-gray-50 p-5 rounded-2xl text-[14px] text-gray-700 mb-4 italic border border-gray-100 shadow-inner">
                    <span className="block font-black text-blue-800 mb-1 not-italic">해설</span>
                    {q.explanation}
                  </div>
                ) : (
                  <div className="bg-gray-100 p-4 rounded-xl text-center text-sm text-gray-400 mb-4 font-bold border border-dashed border-gray-300">
                    🔒 해설은 로그인 후 볼 수 있습니다.
                  </div>
                )}

                <button 
                  onClick={() => {
                    if (!user) {
                      alert("지문 보기는 로그인한 사용자만 가능합니다! 🐻");
                      navigate('/auth');
                      return;
                    }
                    setSelectedQuestion(q);
                  }} 
                  className="w-full py-4 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  {user ? "문제 및 지문 상세 보기" : "🔍 로그인하고 지문 보기"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 상세보기 모달 */}
      {selectedQuestion && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-4 transition-all">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-t-[2.5rem] md:rounded-3xl flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50">
              <span className="font-black text-gray-800">문제 원본</span>
              <button onClick={() => setSelectedQuestion(null)} className="text-gray-400 font-bold text-xl">×</button>
            </div>
            <div className="p-6 overflow-y-auto space-y-6">
              {selectedQuestion.passage && <div className="p-5 bg-yellow-50 rounded-2xl font-serif leading-relaxed border border-yellow-100 whitespace-pre-line text-gray-800">{selectedQuestion.passage}</div>}
              <p className="font-black text-lg">Q. {selectedQuestion.question}</p>
              <div className="space-y-2">
                {selectedQuestion.choices.map((choice, i) => {
                  const isCorrectChoice = selectedQuestion.answer === i;
                  const myAns = userAnswers[questions.findIndex(q => q.id === selectedQuestion.id)];
                  const isMine = myAns === i;
                  return (
                    <div key={i} className={`p-4 rounded-xl border-2 flex items-center justify-between ${isCorrectChoice ? 'border-blue-500 bg-blue-50' : isMine ? 'border-red-400 bg-red-50' : 'border-gray-50'}`}>
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isCorrectChoice ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'}`}>{i + 1}</span>
                        <span className={`text-sm ${isCorrectChoice ? 'text-blue-700 font-bold' : isMine ? 'text-red-700' : 'text-gray-400'}`}>{choice}</span>
                      </div>
                      {isCorrectChoice && <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded">정답</span>}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="p-6 border-t bg-white">
              <button onClick={() => setSelectedQuestion(null)} className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold active:scale-95 transition-all">확인 완료</button>
            </div>
          </div>
        </div>
      )}

      {/* 탑 버튼 */}
      <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className={`fixed bottom-8 right-6 w-14 h-14 bg-white border shadow-2xl rounded-full flex items-center justify-center transition-all z-50 ${showTopBtn ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}>
        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 15l7-7 7 7"/></svg>
      </button>
    </Layout>
  );
}