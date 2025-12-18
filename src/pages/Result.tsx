import { useLocation, useNavigate } from 'react-router-dom';
import type { Question } from '../types';
import Layout from '../components/Layout';

export default function Result() {
  const { state } = useLocation();
  const navigate = useNavigate();
  
  if (!state) return null;

  const { questions, userAnswers } = state as { questions: Question[]; userAnswers: number[] };
  
  // 정답 개수 계산
  const correctCount = questions.filter((q, idx) => q.answer === userAnswers[idx]).length;
  const score = Math.round((correctCount / questions.length) * 100);

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        {/* 점수 요약 카드 */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border mb-8 text-center">
          <h2 className="text-2xl font-bold mb-4">시험 결과</h2>
          <div className="text-6xl font-black text-blue-600 mb-4">{score}<span className="text-2xl text-gray-400">점</span></div>
          <p className="text-gray-600">총 {questions.length}문제 중 {correctCount}문제를 맞혔습니다.</p>
          <button
            onClick={() => navigate('/')}
            className="mt-6 px-8 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-semibold transition"
          >
            홈으로 돌아가기
          </button>
        </div>

        {/* 상세 해설 리스트 */}
        <h3 className="text-xl font-bold mb-4 ml-2 text-gray-700">오답 체크 및 해설</h3>
        <div className="space-y-6">
          {questions.map((q, idx) => {
            const isCorrect = q.answer === userAnswers[idx];
            return (
              <div key={q.id} className={`bg-white p-6 rounded-xl border-2 ${isCorrect ? 'border-green-100' : 'border-red-100'}`}>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {isCorrect ? '정답' : '오답'}
                  </span>
                  <span className="font-bold">문제 {idx + 1}</span>
                </div>
                <p className="font-medium mb-4">{q.question}</p>
                
                <div className="grid grid-cols-1 gap-2 mb-4">
                  <div className="text-sm p-3 bg-gray-50 rounded">
                    <span className="font-bold text-blue-600 mr-2">정답: {q.answer + 1}번</span>
                    <span className="text-gray-400 mx-2">|</span>
                    <span className={`font-bold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                      내 선택: {userAnswers[idx] + 1}번
                    </span>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg text-sm leading-relaxed text-gray-700">
                  <p className="font-bold mb-1 text-blue-800">[정답 해설]</p>
                  {q.explanation}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}