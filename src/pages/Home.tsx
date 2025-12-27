import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Category } from '../types';
import Layout from '../components/Layout';
import { auth } from '../firebase'; 
import { signOut } from 'firebase/auth';

// 💡 중요: id를 Firestore의 tags.subject에 저장된 한글 값과 일치시켰습니다.
const categories: { id: string; label: string; desc: string }[] = [
  { id: '비문학', label: '독서 (비문학)', desc: '인문, 사회, 과학 지문 독해' },
  { id: '문학', label: '문학', desc: '현대시, 고전소설 등 감상' },
  { id: '언어와 매체', label: '언어와 매체', desc: '국어 문법 핵심 정리' },
];

export default function Home() {
  const navigate = useNavigate();
  const user = auth.currentUser;
  
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 카테고리 클릭 시 모달 오픈
  const handleCategoryClick = (id: string) => {
    setSelectedCat(id);
    setIsModalOpen(true);
  };

  // 퀴즈 페이지로 이동 (id가 '비문학' 등으로 전달됨)
  const handleStart = (count: number | 'all') => {
    if (!selectedCat) return;
    // URL에 한글이 들어가도 QuizPage에서 decodeURIComponent로 안전하게 처리합니다.
    navigate(`/quiz/${selectedCat}`, { state: { limit: count } });
    setIsModalOpen(false);
  };

  const handleLogout = () => {
    if (window.confirm("로그아웃 하시겠습니까?")) {
      signOut(auth);
      window.location.reload(); // 상태 반영을 위한 새로고침
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4">
        {/* 상단 유저 바 */}
        <div className="flex justify-between items-center mb-10 py-6 bg-white/50 backdrop-blur-sm rounded-3xl px-6 border border-white shadow-sm">
          <div>
            {user ? (
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Welcome back</span>
                <p className="text-gray-800 font-black text-lg">
                  <span className="text-blue-600">@{user.email?.split('@')[0]}</span>님, 열공하세요! 📖
                </p>
              </div>
            ) : (
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Guest Mode</span>
                <p className="text-gray-500 font-bold">로그인하고 학습 데이터를 기록하세요!</p>
              </div>
            )}
          </div>
          {user ? (
            <button onClick={handleLogout} className="text-[11px] font-black text-red-400 border-2 border-red-50 px-5 py-2.5 rounded-2xl hover:bg-red-50 hover:border-red-100 transition-all active:scale-95">LOGOUT</button>
          ) : (
            <button onClick={() => navigate('/auth')} className="text-[11px] font-black text-blue-600 border-2 border-blue-50 px-5 py-2.5 rounded-2xl hover:bg-blue-50 hover:border-blue-100 transition-all active:scale-95 shadow-sm shadow-blue-100">LOGIN</button>
          )}
        </div>

        <h2 className="text-3xl font-black mb-8 text-gray-900 tracking-tighter">어떤 영역을<br/>학습할까요?</h2>
        
        {/* 카테고리 그리드 */}
        <div className="grid gap-5 md:grid-cols-3">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.id)}
              className="group p-8 bg-white rounded-[2.5rem] shadow-xl shadow-blue-900/5 hover:shadow-blue-900/10 transition-all border border-gray-50 text-left active:scale-[0.96] relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-150 duration-500 opacity-50" />
              <h3 className="text-xl font-bold text-gray-900 mb-3 relative z-10">{cat.label}</h3>
              <p className="text-gray-400 text-sm font-medium leading-relaxed relative z-10">{cat.desc}</p>
              <div className="mt-6 flex items-center text-blue-600 font-bold text-xs relative z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                학습 시작하기 →
              </div>
            </button>
          ))}
        </div>
        
        <div className="mt-16 text-center">
          <button onClick={() => navigate('/ranking')} className="bg-gray-900 text-white px-8 py-4 rounded-2xl font-bold text-sm hover:bg-blue-600 transition-all shadow-xl shadow-gray-200 active:scale-95">
            🏆 실시간 학습 랭킹 확인하기
          </button>
        </div>
      </div>

      {/* 문제 수 선택 모달 (동일 로직) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-md transition-all">
          <div className="bg-white w-full max-w-sm rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95 duration-200 border border-gray-100">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📝</span>
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-2">학습량 선택</h3>
              <p className="text-gray-400 font-medium text-sm px-4">선택하신 '{selectedCat}' 영역을 몇 문제 풀까요?</p>
            </div>
            
            <div className="grid gap-3 mb-8">
              {[5, 10, 20].map((num) => (
                <button
                  key={num}
                  onClick={() => {
                    if (!user && num > 10) {
                      alert("로그인하지 않으면 10문제까지만 가능해요! 🐻");
                      return;
                    }
                    handleStart(num)
                  }}
                  className="w-full py-4 bg-gray-50 hover:bg-blue-600 hover:text-white rounded-2xl font-bold transition-all text-gray-600 border border-transparent active:scale-95"
                >
                  {num}문제 풀기
                </button>
              ))}
              <button
                onClick={() => {
                  if (!user) {
                    alert("전체 문제 도전은 로그인 후 이용 가능합니다! 🔥");
                    return;
                  }
                  handleStart('all')
                }}
                className="w-full py-5 bg-gray-900 text-white rounded-2xl font-bold shadow-xl shadow-gray-200 active:scale-95 transition-all mt-2"
              >
                🔥 전체 문제 도전하기
              </button>
            </div>

            <button 
              onClick={() => setIsModalOpen(false)} 
              className="w-full text-gray-400 text-sm font-bold hover:text-red-400 transition-colors"
            >
              다음에 할게요
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
}