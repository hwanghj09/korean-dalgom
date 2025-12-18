import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Question } from '../types';
import Layout from '../components/Layout';

export default function QuizPage() {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  // 중요: 사용자의 답안을 문제 수만큼 null로 초기화하여 관리
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/questions/${category}.json`)
      .then((res) => res.json())
      .then((data: Question[]) => {
        setQuestions(data);
        setUserAnswers(new Array(data.length).fill(null)); // [null, null, null...]
        setLoading(false);
      });
  }, [category]);

  const currentQuestion = questions[currentIndex];
  const isFirstQuestion = currentIndex === 0;
  const isLastQuestion = currentIndex === questions.length - 1;

  // 답안 선택 시 동작
  const handleSelect = (choiceIdx: number) => {
    const updatedAnswers = [...userAnswers];
    updatedAnswers[currentIndex] = choiceIdx;
    setUserAnswers(updatedAnswers);
  };

  // 이전 문제로 이동
  const handlePrev = () => {
    if (!isFirstQuestion) {
      setCurrentIndex((prev) => prev - 1);
      window.scrollTo(0, 0);
    }
  };

  // 다음 문제로 이동
  const handleNext = () => {
    if (!isLastQuestion) {
      setCurrentIndex((prev) => prev + 1);
      window.scrollTo(0, 0);
    }
  };

  // 최종 제출 (모든 문제를 풀었는지 체크 가능)
  const handleSubmit = () => {
    const unfinished = userAnswers.some(ans => ans === null);
    if (unfinished && !window.confirm("아직 풀지 않은 문제가 있습니다. 제출하시겠습니까?")) {
      return;
    }

    navigate('/result', {
      state: { 
        questions, 
        userAnswers 
      } 
    });
  };

  if (loading) return <Layout><div className="text-center py-20 font-bold">문제를 불러오는 중입니다...</div></Layout>;

  // QuizPage.tsx의 return 부분 핵심 수정
return (
  <Layout>
    <div className="max-w-2xl mx-auto pb-32 pt-2 fade-in">
      {/* 진행 상황 표시 바 */}
      <div className="mb-6 px-2">
        <div className="flex justify-between items-end mb-2">
          <span className="text-blue-600 font-black text-xl">{category?.toUpperCase()}</span>
          <span className="text-sm font-medium text-gray-400">
            <strong className="text-gray-900">{currentIndex + 1}</strong> / {questions.length}
          </span>
        </div>
        <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
          <div 
            className="bg-blue-600 h-full transition-all duration-300" 
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* 지문 영역: 카드 스타일로 변경 */}
      {currentQuestion.passage && (
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-gray-100 ring-1 ring-black/5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-4 bg-blue-600 rounded-full"></div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Passage</span>
          </div>
          <div className="passage-text text-gray-800 font-serif whitespace-pre-line">
            {currentQuestion.passage}
          </div>
        </div>
      )}

      {/* 문제 영역 */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 ring-1 ring-black/5">
        <h3 className="text-lg font-bold text-gray-900 mb-8 leading-relaxed">
          <span className="text-blue-600 mr-2">Q.</span>
          {currentQuestion.question}
        </h3>

        <div className="space-y-3">
          {currentQuestion.choices.map((choice, idx) => (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${
                userAnswers[currentIndex] === idx 
                ? "border-blue-600 bg-blue-50/50 shadow-sm" 
                : "border-gray-50 bg-gray-50/50 hover:border-gray-200 active:scale-[0.98]"
              }`}
            >
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                userAnswers[currentIndex] === idx ? "bg-blue-600 text-white" : "bg-white text-gray-400 border border-gray-200"
              }`}>
                {idx + 1}
              </div>
              <span className={`text-[15px] ${userAnswers[currentIndex] === idx ? "text-blue-900 font-bold" : "text-gray-700"}`}>
                {choice}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>

    {/* 하단 플로팅 네비게이션: 더 세련되게 수정 */}
    <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-gray-100 px-6 py-5 pb-8 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
      <div className="max-w-2xl mx-auto flex gap-4">
        <button
          onClick={handlePrev}
          disabled={isFirstQuestion}
          className="flex-1 py-4 px-2 rounded-2xl font-bold text-gray-400 bg-gray-50 active:bg-gray-100 disabled:opacity-30 transition-all"
        >
          이전
        </button>
        
        {isLastQuestion ? (
          <button
            onClick={handleSubmit}
            className="flex-[2.5] py-4 px-2 rounded-2xl font-bold bg-blue-600 text-white shadow-xl shadow-blue-200 active:scale-95 transition-all"
          >
            시험 종료 및 제출
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="flex-[2.5] py-4 px-2 rounded-2xl font-bold bg-gray-900 text-white active:scale-95 transition-all"
          >
            다음 문제
          </button>
        )}
      </div>
    </div>
  </Layout>
);
}