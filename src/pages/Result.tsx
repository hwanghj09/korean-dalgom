import { useLocation, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';

export default function Result() {
  const { state } = useLocation();
  const navigate = useNavigate();
  
  // 직접 URL 접근 시 방어 코드
  if (!state) {
    return (
      <Layout>
        <div className="text-center">
          <p>잘못된 접근입니다.</p>
          <button onClick={() => navigate('/')} className="mt-4 text-blue-600">홈으로</button>
        </div>
      </Layout>
    );
  }

  const { total, correct } = state as { total: number; correct: number };
  const percentage = Math.round((correct / total) * 100);

  return (
    <Layout>
      <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-lg text-center mt-10">
        <h2 className="text-3xl font-bold mb-2">학습 결과</h2>
        <p className="text-gray-500 mb-8">수고하셨습니다!</p>

        <div className="flex justify-center items-end gap-2 mb-8">
          <span className="text-6xl font-extrabold text-blue-600">{percentage}</span>
          <span className="text-xl text-gray-400 mb-2">점</span>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8 bg-gray-50 p-4 rounded-lg">
          <div>
            <div className="text-xs text-gray-500">총 문제</div>
            <div className="text-xl font-bold">{total}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">정답 개수</div>
            <div className="text-xl font-bold text-green-600">{correct}</div>
          </div>
        </div>

        <button
          onClick={() => navigate('/')}
          className="w-full py-3 bg-gray-900 text-white rounded-lg font-bold hover:bg-black transition"
        >
          다른 영역 풀기
        </button>
      </div>
    </Layout>
  );
}