import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { db, auth } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import Layout from '../components/Layout';

// 1. Question 타입 정의 (Firestore 필드명 'image' 반영)
interface Question {
  id: string;
  text: string;
  options: string[];
  correct: number;
  memo: string;
  useBox: boolean;
  smartBoxData: string;
  image?: string; // Firestore의 image 필드와 매칭
  tags: {
    subject: string;
  };
}

export default function QuizPage() {
  const { category } = useParams<{ category: string }>();
  const { state } = useLocation();
  const navigate = useNavigate();
  const user = auth.currentUser;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      try {
        let finalQuestions: Question[] = [];

        // 1. 오답 재도전 모드
        if (state?.retryQuestions && state.retryQuestions.length > 0) {
          finalQuestions = state.retryQuestions;
        } 
        // 2. Firestore에서 데이터 호출
        else {
          const rawCategory = category || "";
          const decodedCategory = decodeURIComponent(rawCategory).trim();
          
          const q = query(
            collection(db, "questions"),
            where("tags.subject", "==", decodedCategory)
          );
          
          const querySnapshot = await getDocs(q);
          const data = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Question[];

          // 문제 무작위 섞기
          finalQuestions = [...data].sort(() => Math.random() - 0.5);

          // 로그인 여부에 따른 제한
          if (!user) {
            finalQuestions = finalQuestions.slice(0, 10);
          } else if (state?.limit && state.limit !== 'all') {
            finalQuestions = finalQuestions.slice(0, Number(state.limit));
          }
        }

        if (finalQuestions.length === 0) {
          alert(`'${decodeURIComponent(category || "")}' 카테고리에 등록된 문제가 없습니다.`);
          navigate('/');
          return;
        }

        setQuestions(finalQuestions);
        setUserAnswers(new Array(finalQuestions.length).fill(null));
      } catch (error) {
        console.error("❌ 데이터 로딩 에러:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [category, user, state, navigate]);

  const currentQuestion = questions[currentIndex];
  const isFirstQuestion = currentIndex === 0;
  const isLastQuestion = currentIndex === questions.length - 1;

  const handleSelect = (idx: number) => {
    const updated = [...userAnswers];
    updated[currentIndex] = idx;
    setUserAnswers(updated);
  };

  const handleSubmit = () => {
    if (userAnswers.includes(null)) {
      if (!window.confirm("아직 풀지 않은 문제가 있습니다. 그대로 제출할까요?")) return;
    }
    navigate('/result', { state: { questions, userAnswers, category } });
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-40">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="font-black italic text-blue-600 tracking-widest">GETTING QUESTIONS...</p>
        </div>
      </Layout>
    );
  }

  if (questions.length === 0) return null;

  return (
    <Layout>
      <div className="max-w-2xl mx-auto pb-32 pt-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* 상단 프로그레스 바 영역 */}
        <div className="mb-6 px-2">
          <div className="flex justify-between items-end mb-3">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Category</span>
              <span className="text-blue-600 font-black text-2xl uppercase tracking-tighter leading-none">
                {decodeURIComponent(category || "")}
              </span>
            </div>
            <span className="text-sm font-bold text-gray-400 bg-gray-50 px-3 py-1 rounded-full border">
              <span className="text-blue-600">{currentIndex + 1}</span> / {questions.length}
            </span>
          </div>
          <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden shadow-inner border border-gray-50">
            <div 
              className="bg-blue-600 h-full transition-all duration-500 ease-out" 
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} 
            />
          </div>
        </div>

        {/* 지문 박스 (smartBoxData) */}
        {currentQuestion.useBox && currentQuestion.smartBoxData && (
          <div className="bg-white rounded-[2.5rem] p-8 mb-6 shadow-sm border border-gray-100 font-serif leading-relaxed text-gray-800 whitespace-pre-line text-[16px] shadow-blue-50/50">
            {currentQuestion.smartBoxData}
          </div>
        )}

        {/* [이미지 영역] DB 필드명 'image'를 사용하도록 수정 */}
        {currentQuestion.image && (
          <div className="mb-6 rounded-[2.5rem] overflow-hidden border border-gray-100 bg-white p-3 shadow-sm flex justify-center">
            <img 
              // data: 접두사가 없을 경우 강제로 추가
              src={currentQuestion.image.startsWith('data:') 
                ? currentQuestion.image 
                : `data:image/png;base64,${currentQuestion.image}`} 
              alt="문제 이미지" 
              className="max-w-full h-auto rounded-[1.8rem] object-contain shadow-sm"
              // 로딩 실패 시 엑박 대신 영역 숨김
              onError={(e) => {
                console.error("이미지 로드 실패");
                e.currentTarget.parentElement!.style.display = 'none';
              }}
            />
          </div>
        )}

        {/* 문제 텍스트 및 선지 영역 */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-blue-50/20 border border-gray-100 mb-4">
          <h3 className="text-xl font-bold text-gray-900 mb-10 leading-snug">
            <span className="inline-block bg-blue-600 text-white px-2 py-0.5 rounded-lg text-sm mr-3 align-middle italic">Q{currentIndex + 1}</span>
            {currentQuestion.text}
          </h3>
          
          <div className="space-y-3">
            {currentQuestion.options.map((option, idx) => {
              const isSelected = userAnswers[currentIndex] === idx;
              return (
                <button
                  key={idx}
                  onClick={() => handleSelect(idx)}
                  className={`w-full text-left p-5 rounded-[1.5rem] border-2 transition-all flex items-center gap-4 group ${
                    isSelected 
                      ? "border-blue-600 bg-blue-50/50 shadow-md transform scale-[1.02]" 
                      : "border-gray-50 bg-gray-50/30 hover:border-blue-200 hover:bg-white active:scale-[0.98]"
                  }`}
                >
                  <div className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center font-black text-sm transition-colors ${
                    isSelected ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "bg-white text-gray-300 border border-gray-100 group-hover:text-blue-400"
                  }`}>
                    {idx + 1}
                  </div>
                  <span className={`text-[15px] leading-snug ${isSelected ? "text-blue-900 font-bold" : "text-gray-600"}`}>
                    {option}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 하단 플로팅 네비게이션 바 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/70 backdrop-blur-xl border-t border-gray-100 px-6 py-5 pb-10 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-40">
        <div className="max-w-2xl mx-auto flex gap-4">
          <button 
            onClick={() => !isFirstQuestion && setCurrentIndex(c => c-1)} 
            disabled={isFirstQuestion} 
            className="flex-1 py-4 rounded-2xl font-bold bg-gray-100 text-gray-400 disabled:opacity-0 transition-all hover:bg-gray-200"
          >
            이전
          </button>
          
          {isLastQuestion 
            ? <button onClick={handleSubmit} className="flex-[2.5] py-4 rounded-2xl font-bold bg-blue-600 text-white shadow-xl shadow-blue-200 active:scale-95 transition-all hover:bg-blue-700">제출하여 결과보기</button>
            : <button onClick={() => setCurrentIndex(c => c+1)} className="flex-[2.5] py-4 rounded-2xl font-bold bg-gray-900 text-white active:scale-95 transition-all hover:bg-black shadow-xl shadow-gray-200">다음 문제로</button>
          }
        </div>
      </div>
    </Layout>
  );
}