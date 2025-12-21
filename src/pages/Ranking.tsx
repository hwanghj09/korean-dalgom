import { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import Layout from '../components/Layout';

// 인터페이스 정의 (Firestore 문서 구조와 일치)
interface UserRank {
  id: string;
  email: string;
  totalCorrect: number;
  totalIncorrect: number;
  totalSolved: number;
}

export default function Ranking() {
  const [ranks, setRanks] = useState<UserRank[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Firestore 'users' 컬렉션에서 맞춘 문제 수(totalCorrect) 기준 내림차순 정렬
    const q = query(
      collection(db, "users"),
      orderBy("totalCorrect", "desc"),
      limit(10) // 상위 10명만 표시
    );

    // 2. 실시간 리스너 연결
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const list: UserRank[] = [];
      querySnapshot.forEach((doc) => {
        // 문서 ID(uid)와 데이터를 합쳐서 배열에 저장
        list.push({ 
          id: doc.id, 
          ...doc.data() 
        } as UserRank);
      });
      
      setRanks(list);
      setLoading(false);
    }, (error) => {
      console.error("랭킹 데이터를 가져오는 중 오류 발생:", error);
      setLoading(false);
    });

    // 컴포넌트 언마운트 시 리스너 해제
    return () => unsubscribe();
  }, []);

  return (
    <Layout>
      <div className="max-w-2xl mx-auto pt-6 px-4 pb-20">
        <h2 className="text-3xl font-black mb-8 text-center italic text-blue-600">RANKING</h2>
        
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="bg-white rounded-[2rem] shadow-xl border border-gray-50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-400 text-xs uppercase font-black">
                    <th className="px-6 py-4">순위</th>
                    <th className="px-6 py-4">사용자</th>
                    <th className="px-6 py-4 text-center">맞음</th>
                    <th className="px-6 py-4 text-center">푼 문제</th>
                    <th className="px-6 py-4 text-center">정답률</th>
                  </tr>
                </thead>
                <tbody>
                  {ranks.map((user, idx) => {
                    const accuracy = user.totalSolved > 0 
                      ? Math.round((user.totalCorrect / user.totalSolved) * 100) 
                      : 0;
                      
                    return (
                      <tr key={user.id} className={`border-b border-gray-50 ${idx === 0 ? 'bg-yellow-50/30' : ''}`}>
                        <td className="px-6 py-5 font-black text-lg">
                          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                        </td>
                        <td className="px-6 py-5">
                          <p className="font-bold text-gray-700">{user.email?.split('@')[0] || '익명'}</p>
                        </td>
                        <td className="px-6 py-5 text-center text-blue-600 font-black">
                          {user.totalCorrect}
                        </td>
                        <td className="px-6 py-5 text-center text-gray-500 font-medium">
                          {user.totalSolved}
                        </td>
                        <td className="px-6 py-5 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            accuracy >= 80 ? 'bg-green-100 text-green-600' : 
                            accuracy >= 50 ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {accuracy}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {ranks.length === 0 && (
              <div className="text-center py-20 text-gray-400 font-bold">
                아직 랭킹 데이터가 없습니다.
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}