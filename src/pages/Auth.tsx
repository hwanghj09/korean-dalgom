import { useState } from 'react';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // 회원가입 시 랭킹 시스템을 위한 데이터 초기화
        await setDoc(doc(db, "users", userCredential.user.uid), {
          email: userCredential.user.email,
          totalSolved: 0,
          totalCorrect: 0,
          totalIncorrect: 0,
          createdAt: serverTimestamp() // 또는 new Date().toISOString()
        });
      }
      navigate('/');
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') setError('이미 사용 중인 이메일입니다.');
      else setError('이메일 또는 비밀번호를 확인해주세요.');
    }
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto pt-10 px-4">
        <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-gray-100">
          <h2 className="text-2xl font-black text-center mb-8">
            {isLogin ? '반가워요!' : '새로운 시작을 해보세요!'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email" placeholder="이메일"
              className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 outline-none"
              value={email} onChange={(e) => setEmail(e.target.value)} required
            />
            <input
              type="password" placeholder="비밀번호"
              className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 outline-none"
              value={password} onChange={(e) => setPassword(e.target.value)} required
            />
            {error && <p className="text-red-500 text-sm pl-2">{error}</p>}
            <button className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-100 active:scale-95 transition-all mt-4">
              {isLogin ? '로그인' : '회원가입'}
            </button>
          </form>
          <button onClick={() => setIsLogin(!isLogin)} className="w-full mt-6 text-gray-400 text-sm font-medium">
            {isLogin ? '아직 계정이 없으신가요? 회원가입' : '이미 계정이 있나요? 로그인'}
          </button>
        </div>
      </div>
    </Layout>
  );
}