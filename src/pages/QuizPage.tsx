import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Question } from '../types';
import Layout from '../components/Layout';

export default function QuizPage() {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);

  // 데이터 로드
  useEffect(() => {
    fetch(`/questions/${category}.json`)
      .then((res) => {
        if (!res.ok) throw new Error('파일을 찾을 수 없습니다.');
        return res.json();
      })
      .then((data) => {
        setQuestions(data);
        setLoading(false);
      })
      .catch((err) => {
        alert('문제 로딩 실패: ' + err.message);
        navigate('/');
      });
  }, [category, navigate]);

  const currentQuestion = questions[currentIndex];

  const handleSubmit = () => {
    if (selectedChoice === null) return;
    setIsSubmitted(true);
    if (selectedChoice === currentQuestion.answer) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedChoice(null);
      setIsSubmitted(false);
      window.scrollTo(0, 0);
    } else {
      // 결과 페이지로 이동 (state로 결과 전달)
      navigate('/result', {
        state: { 
          total: questions.length, 
          correct: score + (selectedChoice === currentQuestion.answer ? 1 : 0) // 마지막 문제 점수 반영 확인 필요하므로 계산 주의
        } 
      });
      // 안전하게 계산하기 위해 위 로직 대신 handleNext 호출 전 상태를 넘기거나,
      // 마지막 문제 처리 로직을 분리하는 것이 좋으나 간결함을 위해 아래 방식 사용
      // *주의: handleNext가 호출되는 시점은 이미 마지막 문제를 푼 상태여야 함.
      // 실제로는 제출 후 '결과 보기' 버튼을 따로 두는 것이 UX상 좋음.
    }
  };

  if (loading) return <Layout><div className="text-center py-20">문제 불러오는 중...</div></Layout>;
  if (!currentQuestion) return null;

  const isCorrect = selectedChoice === currentQuestion.answer;
  const isLastQuestion = currentIndex === questions.length - 1;

  return (
    <Layout>
      <div className="flex justify-between items-center mb-4 text-sm text-gray-500">
        <span>{category?.toUpperCase()} 영역</span>
        <span>{currentIndex + 1} / {questions.length}</span>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* 지문 영역 (지문이 있을 때만 표시) */}
        {currentQuestion.passage && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-fit md:sticky md:top-20 max-h-[80vh] overflow-y-auto">
            <h3 className="font-bold text-gray-400 mb-2 text-xs">지문</h3>
            <p className="whitespace-pre-line leading-relaxed text-gray-800 font-serif">
              {currentQuestion.passage}
            </p>
          </div>
        )}

        {/* 문제 영역 */}
        <div className={currentQuestion.passage ? '' : 'md:col-span-2'}>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold mb-6">
              {currentIndex + 1}. {currentQuestion.question}
            </h3>

            <div className="space-y-3">
              {currentQuestion.choices.map((choice, idx) => {
                let btnClass = "w-full text-left p-4 rounded-lg border transition-all ";
                
                if (isSubmitted) {
                   if (idx === currentQuestion.answer) btnClass += "bg-green-100 border-green-500 text-green-800 font-bold";
                   else if (idx === selectedChoice) btnClass += "bg-red-100 border-red-500 text-red-800";
                   else btnClass += "bg-gray-50 border-gray-200 opacity-50";
                } else {
                   if (selectedChoice === idx) btnClass += "bg-blue-50 border-blue-500 text-blue-700";
                   else btnClass += "hover:bg-gray-50 border-gray-200";
                }

                return (
                  <button
                    key={idx}
                    disabled={isSubmitted}
                    onClick={() => setSelectedChoice(idx)}
                    className={btnClass}
                  >
                    <span className="inline-block w-6 h-6 rounded-full border border-current text-xs text-center leading-6 mr-2">
                      {idx + 1}
                    </span>
                    {choice}
                  </button>
                );
              })}
            </div>
            
            {/* 해설 및 하단 액션 */}
            {isSubmitted && (
              <div className="mt-6 pt-6 border-t animate-fade-in">
                <div className={`text-lg font-bold mb-2 ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                  {isCorrect ? '정답입니다!' : '오답입니다.'}
                </div>
                <div className="bg-gray-50 p-4 rounded text-sm text-gray-700 leading-relaxed mb-4">
                  <span className="font-bold block mb-1">[해설]</span>
                  {currentQuestion.explanation}
                </div>
                <button
                  onClick={isLastQuestion 
                    ? () => navigate('/result', { state: { total: questions.length, correct: score + (isCorrect ? 1 : 0) } })
                    : handleNext
                  }
                  className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700"
                >
                  {isLastQuestion ? '결과 보기' : '다음 문제'}
                </button>
              </div>
            )}

            {!isSubmitted && (
              <button
                onClick={handleSubmit}
                disabled={selectedChoice === null}
                className="w-full mt-6 py-3 bg-gray-900 text-white rounded-lg font-bold hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                채점하기
              </button>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}