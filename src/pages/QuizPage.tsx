import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Question } from '../types';
import Layout from '../components/Layout';

export default function QuizPage() {
  const { category } = useParams<{ category: string }>();
  const { state } = useLocation();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (state?.retryQuestions) {
      // 오답 재도전 모드
      setQuestions(state.retryQuestions);
      setUserAnswers(new Array(state.retryQuestions.length).fill(null));
      setLoading(false);
    } else {
      // 일반 풀이 모드
      fetch(`/questions/${category}.json?t=${new Date().getTime()}`)
        .then((res) => res.json())
        .then((data) => {
          setQuestions(data);
          setUserAnswers(new Array(data.length).fill(null));
          setLoading(false);
        });
    }
  }, [category, state]);

  // QuizPage.tsx 내의 useEffect 수정
useEffect(() => {
  if (state?.retryQuestions) {
    // 오답 재도전 모드 (기존 동일)
    setQuestions(state.retryQuestions);
    setUserAnswers(new Array(state.retryQuestions.length).fill(null));
    setLoading(false);
  } else {
    // 일반 풀이 모드
    fetch(`/questions/${category}.json?t=${new Date().getTime()}`)
      .then((res) => res.json())
      .then((data: Question[]) => {
        let finalQuestions = data;
        
        // 중요: 문제 수 제한 로직 추가
        if (state?.limit && state.limit !== 'all') {
          // 문제를 무작위로 섞은 후 요청한 수만큼만 가져옴
          finalQuestions = [...data]
            .sort(() => Math.random() - 0.5)
            .slice(0, state.limit);
        }

        setQuestions(finalQuestions);
        setUserAnswers(new Array(finalQuestions.length).fill(null));
        setLoading(false);
      });
  }
}, [category, state]);

  const currentQuestion = questions[currentIndex];
  const isFirstQuestion = currentIndex === 0;
  const isLastQuestion = currentIndex === questions.length - 1;

  const handleSelect = (choiceIdx: number) => {
    const updated = [...userAnswers];
    updated[currentIndex] = choiceIdx;
    setUserAnswers(updated);
  };

  const handleSubmit = () => {
    if (userAnswers.includes(null) && !window.confirm("안 푼 문제가 있습니다. 제출할까요?")) return;
    navigate('/result', { state: { questions, userAnswers, category } });
  };

  if (loading) return <Layout><div className="text-center py-20 font-bold">로딩 중...</div></Layout>;

  return (
    <Layout>
      <div className="max-w-2xl mx-auto pb-32 pt-2 animate-in fade-in duration-500">
        <div className="mb-6 px-2">
          <div className="flex justify-between items-end mb-2">
            <span className="text-blue-600 font-black text-xl uppercase">{category}</span>
            <span className="text-sm font-bold text-gray-400">{currentIndex + 1} / {questions.length}</span>
          </div>
          <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
            <div className="bg-blue-600 h-full transition-all duration-300" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} />
          </div>
        </div>

        {currentQuestion.passage && (
          <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-gray-100 font-serif leading-relaxed text-gray-800 whitespace-pre-line">
            {currentQuestion.passage}
          </div>
        )}

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-8 leading-relaxed">
            <span className="text-blue-600 mr-2">Q.</span>{currentQuestion.question}
          </h3>
          <div className="space-y-3">
            {currentQuestion.choices.map((choice, idx) => (
              <button
                key={idx}
                onClick={() => handleSelect(idx)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${
                  userAnswers[currentIndex] === idx ? "border-blue-600 bg-blue-50/50 shadow-sm" : "border-gray-50 bg-gray-50/50 active:scale-[0.98]"
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-sm ${
                  userAnswers[currentIndex] === idx ? "bg-blue-600 text-white" : "bg-white text-gray-400 border border-gray-200"
                }`}>{idx + 1}</div>
                <span className={userAnswers[currentIndex] === idx ? "text-blue-900 font-bold" : "text-gray-700"}>{choice}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t px-6 py-5 pb-8 shadow-2xl z-40">
        <div className="max-w-2xl mx-auto flex gap-4">
          <button onClick={() => !isFirstQuestion && setCurrentIndex(c => c-1)} disabled={isFirstQuestion} className="flex-1 py-4 rounded-2xl font-bold bg-gray-50 text-gray-400 disabled:opacity-30">이전</button>
          {isLastQuestion 
            ? <button onClick={handleSubmit} className="flex-[2.5] py-4 rounded-2xl font-bold bg-blue-600 text-white shadow-lg shadow-blue-200">제출하기</button>
            : <button onClick={() => setCurrentIndex(c => c+1)} className="flex-[2.5] py-4 rounded-2xl font-bold bg-gray-900 text-white">다음 문제</button>
          }
        </div>
      </div>
    </Layout>
  );
}