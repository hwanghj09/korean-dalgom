import { useLocation, useNavigate } from 'react-router-dom';
import type { Question } from '../types';
import Layout from '../components/Layout';
import { useEffect, useState } from 'react';

export default function Result() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [showTopBtn, setShowTopBtn] = useState(false);
  
  // 모달 상태 관리
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);

  useEffect(() => {
    const handleScroll = () => setShowTopBtn(window.scrollY > 300);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!state) return null;

  const { questions, userAnswers } = state as { questions: Question[]; userAnswers: number[] };
  const correctCount = questions.filter((q, idx) => q.answer === userAnswers[idx]).length;
  const score = Math.round((correctCount / questions.length) * 100);

  // 문제 상세보기 모달 열기
  const openModal = (question: Question) => {
    setSelectedQuestion(question);
    setIsModalOpen(true);
    document.body.style.overflow = 'hidden'; // 스크롤 방지
  };

  // 모달 닫기
  const closeModal = () => {
    setIsModalOpen(false);
    document.body.style.overflow = 'auto';
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto pb-24">
        {/* 상단 점수 카드 (생략 - 기존과 동일) */}
        <div className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100 mb-10 text-center">
          <h2 className="text-xl font-bold text-gray-400 mb-2">테스트 결과</h2>
          <div className="text-7xl font-black text-blue-600 mb-6">{score}점</div>
          <button onClick={() => navigate('/')} className="px-8 py-3 bg-gray-900 text-white rounded-2xl font-bold">홈으로 이동</button>
        </div>

        <h3 className="text-xl font-black mb-6 text-gray-800">오답 노트</h3>

        <div className="space-y-6">
          {questions.map((q, idx) => {
            const isCorrect = q.answer === userAnswers[idx];
            return (
              <div key={q.id} className={`bg-white p-6 rounded-2xl border-2 ${isCorrect ? 'border-green-100' : 'border-red-100 shadow-sm'}`}>
                <div className="flex justify-between items-center mb-4">
                   <span className={`px-3 py-1 rounded-lg text-xs font-black ${isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {isCorrect ? '정답' : '오답'}
                    </span>
                    <span className="font-bold text-gray-400 text-sm italic"># {idx + 1}</span>
                </div>
                
                <p className="font-bold text-gray-800 mb-4">{q.question}</p>

                {/* 결과 요약 바 */}
                <div className="flex items-center gap-3 mb-6 text-sm font-bold">
                   <div className="flex-1 p-3 bg-blue-50 text-blue-700 rounded-xl text-center">정답: {q.answer + 1}번</div>
                   <div className={`flex-1 p-3 rounded-xl text-center ${isCorrect ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      내 선택: {userAnswers[idx] !== null ? `${userAnswers[idx] + 1}번` : '미선택'}
                   </div>
                </div>

                <div className="bg-gray-50 p-5 rounded-2xl text-[14px] text-gray-700 mb-4 italic border border-gray-100">
                  <span className="block font-black text-blue-800 mb-1 not-italic">해설</span>
                  {q.explanation}
                </div>

                {/* 문제보기 버튼 (모달 호출) */}
                <button
                  onClick={() => openModal(q)}
                  className="w-full py-4 bg-white border-2 border-gray-100 rounded-xl text-sm font-bold text-gray-600 hover:border-blue-200 hover:text-blue-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  🔍 문제 다시보기 (지문 포함)
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* --- 문제 보기 모달창 --- */}
      {isModalOpen && selectedQuestion && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/60 backdrop-blur-sm transition-opacity">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-t-[2rem] md:rounded-3xl overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
            {/* 모달 헤더 */}
            <div className="p-6 border-b flex justify-between items-center bg-gray-50/50">
              <h4 className="font-black text-lg text-gray-800 underline decoration-blue-500 underline-offset-4">문제 원본 확인</h4>
              <button onClick={closeModal} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            {/* 모달 컨텐츠 (스크롤 가능) */}
            <div className="p-6 overflow-y-auto space-y-6">
              {selectedQuestion.passage && (
                <div className="p-5 bg-yellow-50/50 border border-yellow-100 rounded-2xl font-serif leading-relaxed text-gray-800">
                  <span className="text-[10px] font-bold text-yellow-600 uppercase block mb-2">[ 지문 ]</span>
                  {selectedQuestion.passage}
                </div>
              )}
              
              <div className="space-y-3">
                {selectedQuestion.choices.map((choice, i) => {
                  // 1. 현재 이 보기가 정답인가?
                  const isCorrectChoice = selectedQuestion.answer === i;
                  // 2. 현재 이 보기가 내가 선택했던 것인가? (userAnswers에서 해당 문제 인덱스를 찾아야 함)
                  const myAnswer = userAnswers[questions.findIndex(q => q.id === selectedQuestion.id)];
                  const isMyChoice = myAnswer === i;

                  // 스타일 결정 로직
                  let borderColor = "border-gray-50";
                  let bgColor = "bg-gray-50 text-gray-400";
                  let badgeColor = "bg-gray-200 text-gray-500";
                  let statusText = null;

                  if (isCorrectChoice) {
                    borderColor = "border-blue-500";
                    bgColor = "bg-blue-50 text-blue-700 font-bold";
                    badgeColor = "bg-blue-500 text-white";
                    statusText = <span className="text-[10px] ml-auto bg-blue-100 px-2 py-0.5 rounded text-blue-600">정답</span>;
                  } else if (isMyChoice) {
                    borderColor = "border-red-400";
                    bgColor = "bg-red-50 text-red-700";
                    badgeColor = "bg-red-500 text-white";
                    statusText = <span className="text-[10px] ml-auto bg-red-100 px-2 py-0.5 rounded text-red-600">내 오답</span>;
                  }

                  return (
                    <div 
                      key={i} 
                      className={`p-4 rounded-2xl border-2 flex items-center gap-3 transition-all ${borderColor} ${bgColor}`}
                    >
                      <span className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${badgeColor}`}>
                        {i + 1}
                      </span>
                      <span className="text-[15px]">{choice}</span>
                      {statusText}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 모달 푸터 */}
            <div className="p-6 border-t bg-gray-50/50">
              <button onClick={closeModal} className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black shadow-lg shadow-gray-200 active:scale-95 transition-all">
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 맨 위로 이동 버튼 (기존 유지) */}
      <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className={`fixed bottom-8 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center transition-all ${showTopBtn ? 'scale-100' : 'scale-0'}`}>
        ▲
      </button>
    </Layout>
  );
}