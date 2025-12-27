import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState(localStorage.getItem('savedEmail') || ''); // 이메일 기억 기능
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [checkingAuth, setCheckingAuth] = useState(true); // 로딩 상태 추가
  const navigate = useNavigate();

  // 🔥 핵심: 새로고침 시 로그인 상태를 끝까지 확인하는 로직
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // 이미 로그인된 상태라면 홈으로 이동
        navigate('/');
      }
      setCheckingAuth(false); // 확인 완료
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        localStorage.setItem('savedEmail', email); // 로그인 성공 시 이메일 저장
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, "users", userCredential.user.uid), {
          email: userCredential.user.email,
          totalSolved: 0,
          totalCorrect: 0,
          totalIncorrect: 0,
          createdAt: serverTimestamp()
        });
      }
      navigate('/');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') setError('이미 사용 중인 이메일입니다.');
      else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') setError('이메일 또는 비밀번호가 틀렸습니다.');
      else setError('인증에 실패했습니다. 다시 시도해주세요.');
    }
  };

  // 로딩 중일 때는 빈 화면이나 스피너를 보여줌
  if (checkingAuth) return <Layout><div className="text-center py-20 animate-pulse">인증 확인 중...</div></Layout>;

  return (
    <Layout>
      <div className="max-w-md mx-auto pt-10 px-4 animate-in fade-in duration-500">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl shadow-blue-900/5 border border-gray-50">
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
              <span className="text-2xl text-white">🔐</span>
            </div>
            <h2 className="text-2xl font-black text-gray-900">
              {isLogin ? '반가워요!' : '새로운 시작!'}
            </h2>
            <p className="text-gray-400 text-sm mt-2 font-medium">서비스 이용을 위해 인증이 필요합니다.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-black text-gray-400 ml-2 mb-2 block uppercase tracking-widest">Email</label>
              <input
                type="email" placeholder="test@example.com"
                className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-blue-600 focus:bg-white outline-none transition-all"
                value={email} onChange={(e) => setEmail(e.target.value)} required
              />
            </div>
            <div>
              <label className="text-xs font-black text-gray-400 ml-2 mb-2 block uppercase tracking-widest">Password</label>
              <input
                type="password" placeholder="••••••••"
                className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-blue-600 focus:bg-white outline-none transition-all"
                value={password} onChange={(e) => setPassword(e.target.value)} required
              />
            </div>
            
            {error && (
              <div className="bg-red-50 text-red-500 text-xs font-bold p-4 rounded-xl border border-red-100 animate-bounce">
                ⚠️ {error}
              </div>
            )}

            <button className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-200 active:scale-95 transition-all mt-6">
              {isLogin ? '로그인하기' : '회원가입 완료'}
            </button>
          </form>

          <button 
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }} 
            className="w-full mt-8 text-gray-400 text-sm font-bold hover:text-blue-600 transition-colors"
          >
            {isLogin ? '아직 계정이 없으신가요? ➔' : '이미 계정이 있나요? ➔'}
          </button>
        </div>
      </div>
    </Layout>
  );
}