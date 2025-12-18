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

  return (
    <Layout>
      {/* 상단 프로그레스 바 영역 */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex flex-col">
          <span className="text-xs font-bold text-blue-500 uppercase tracking-wider">{category}</span>
          <h2 className="text-xl font-black">실전 모의고사</h2>
        </div>
        <div className="bg-blue-50 px-4 py-2 rounded-lg border border-blue-100">
          <span className="text-blue-700 font-bold">{currentIndex + 1}</span>
          <span className="text-gray-400 mx-1">/</span>
          <span className="text-gray-500">{questions.length}</span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-20"> {/* 하단 버튼 공간을 위해 mb-20 추가 */}
        {/* 지문 영역 */}
        {currentQuestion.passage && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit md:sticky md:top-24 max-h-[65vh] overflow-y-auto">
            <div className="text-[15px] leading-[1.8] text-gray-800 font-serif whitespace-pre-line">
              {currentQuestion.passage}
            </div>
          </div>
        )}

        {/* 문제 및 보기 영역 */}
        <div className={currentQuestion.passage ? '' : 'md:col-span-2 max-w-2xl mx-auto w-full'}>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold mb-8 leading-snug">
              {currentIndex + 1}. {currentQuestion.question}
            </h3>

            <div className="space-y-3">
              {currentQuestion.choices.map((choice, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelect(idx)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-start gap-3 ${
                    userAnswers[currentIndex] === idx 
                    ? "border-blue-500 bg-blue-50 text-blue-800 ring-2 ring-blue-100" 
                    : "border-gray-100 hover:border-gray-300 bg-white"
                  }`}
                >
                  <span className={`flex-shrink-0 w-6 h-6 rounded-full border text-xs flex items-center justify-center mt-0.5 ${
                    userAnswers[currentIndex] === idx ? "bg-blue-500 border-blue-500 text-white" : "border-gray-300 text-gray-500"
                  }`}>
                    {idx + 1}
                  </span>
                  <span className="font-medium">{choice}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 하단 고정 내비게이션 바 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <div className="max-w-4xl mx-auto flex gap-3">
          <button
            onClick={handlePrev}
            disabled={isFirstQuestion}
            className="flex-1 py-4 px-6 rounded-xl font-bold bg-gray-100 text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-200 transition-all"
          >
            이전 문제
          </button>
          
          {isLastQuestion ? (
            <button
              onClick={handleSubmit}
              className="flex-[2] py-4 px-6 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
            >
              최종 답변 제출하기
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="flex-[2] py-4 px-6 rounded-xl font-bold bg-gray-900 text-white hover:bg-black transition-all"
            >
              다음 문제
            </button>
          )}
        </div>
      </div>
    </Layout>
  );
}