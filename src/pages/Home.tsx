import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Category } from '../types';
import Layout from '../components/Layout';
import { auth } from '../firebase'; 
import { signOut } from 'firebase/auth';

const categories: { id: Category; label: string; desc: string }[] = [
  { id: 'reading', label: '독서 (비문학)', desc: '인문, 사회, 과학 지문 독해' },
  { id: 'literature', label: '문학', desc: '현대시, 고전소설 등 감상' },
  { id: 'grammar', label: '언어와 매체', desc: '국어 문법 핵심 정리' },
];

export default function Home() {
  const navigate = useNavigate();
  const user = auth.currentUser;
  // 상태 관리 추가
  const [selectedCat, setSelectedCat] = useState<Category | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 카테고리 클릭 시 바로 이동하지 않고 모달을 띄움
  const handleCategoryClick = (id: Category) => {
    setSelectedCat(id);
    setIsModalOpen(true);
  };

  // 실제 퀴즈 페이지로 이동
  const handleStart = (count: number | 'all') => {
    navigate(`/quiz/${selectedCat}`, { state: { limit: count } });
    setIsModalOpen(false);
  };
const handleLogout = () => {
    if (window.confirm("로그아웃 하시겠습니까?")) {
      signOut(auth);
    }
  };
  return (
    <Layout>
      <h2 className="text-2xl font-bold mb-6 text-center">영역을 선택하세요</h2>
      <div className="max-w-4xl mx-auto px-4">
        {/* 상단 유저 바 */}
        <div className="flex justify-between items-center mb-10 py-4">
          <div>
            {user ? (
              <p className="text-gray-600 font-bold"><span className="text-blue-600">@{user.email?.split('@')[0]}</span>님, 안녕하세요!</p>
            ) : (
              <p className="text-gray-400 font-medium text-sm italic">로그인하고 랭킹에 도전하세요!</p>
            )}
          </div>
          {user ? (
            <button onClick={handleLogout} className="text-xs font-black text-red-400 border border-red-100 px-4 py-2 rounded-full hover:bg-red-50 transition-all">LOGOUT</button>
          ) : (
            <button onClick={() => navigate('/auth')} className="text-xs font-black text-blue-600 border border-blue-100 px-4 py-2 rounded-full hover:bg-blue-50 transition-all">LOGIN</button>
          )}
        </div>
        
      </div>

      {/* 기존 디자인 유지 */}
      <div className="grid gap-4 md:grid-cols-3">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleCategoryClick(cat.id)}
            className="p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition border border-gray-100 text-left active:scale-[0.98]"
          >
            <h3 className="text-xl font-bold text-blue-600 mb-2">{cat.label}</h3>
            <p className="text-gray-500 text-sm">{cat.desc}</p>
          </button>
        ))}
      </div>
      
      <div className="mt-12 text-center">
          <button onClick={() => navigate('/ranking')} className="text-gray-400 font-bold text-sm hover:text-blue-600 transition-colors">
            🏆 실시간 학습 랭킹 확인하기
          </button>
        </div>

      {/* 문제 수 선택 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-2xl p-8 shadow-2xl animate-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-center mb-1">학습량 선택</h3>
            <p className="text-gray-500 text-sm text-center mb-6">몇 문제를 풀지 선택해주세요.</p>
            
            <div className="grid gap-3 mb-6">
              {[5, 10, 20].map((num) => (
                <button
                  key={num}
                  onClick={() => {
                    if (!user && num > 10) {
          alert("로그인하지 않으면 10문제까지만 가능해요!");
          return;
        }
        handleStart(num)}}
                  className="w-full py-3 bg-gray-50 hover:bg-blue-50 hover:text-blue-600 rounded-xl font-semibold transition text-gray-700 border border-gray-100"
                >
                  {num}문제 풀기
                </button>
              ))}
              <button
                onClick={() => {
                  if (!user) {
        alert("전체 문제 도전은 로그인 후 이용 가능합니다!");
        return;
      }
      handleStart('all')}}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold shadow-md active:scale-95 transition"
              >
                전체 문제 풀기
              </button>
            </div>

            <button 
              onClick={() => setIsModalOpen(false)} 
              className="w-full text-gray-400 text-sm font-medium hover:text-gray-600"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
}