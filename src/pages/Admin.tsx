import { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, doc, writeBatch, getDocs, deleteDoc, query, where } from 'firebase/firestore';
import Layout from '../components/Layout';

const CATEGORIES = [
  { id: 'all', name: '전체' },
  { id: '문법', name: '문법' },
  { id: '비문학', name: '비문학' },
  { id: '언어와 매체', name: '언어와 매체' }
];
const compressBase64 = (base64Str: string, maxWidth = 800, quality = 0.7): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height *= maxWidth / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      
      // 용량을 줄이기 위해 jpeg 형식으로 변환 및 화질 조정
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(base64Str); // 실패 시 원본 반환
  });
};
export default function Admin() {
  const [jsonContent, setJsonContent] = useState<any[] | null>(null);
  const [dbQuestions, setDbQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [currentTab, setCurrentTab] = useState('all');
  const [selectedView, setSelectedView] = useState<any | null>(null);

  const fetchQuestions = async () => {
    try {
      let q = query(collection(db, "questions"));
      if (currentTab !== 'all') {
        q = query(collection(db, "questions"), where("tags.subject", "==", currentTab));
      }
      const querySnapshot = await getDocs(q);
      const questions = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDbQuestions(questions);
    } catch (e) {
      console.error("불러오기 에러:", e);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [currentTab]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const dataArray = Array.isArray(json) ? json : [json];
        
        // 업로드 전 용량 체크 (선택 사항)
        setJsonContent(dataArray);
        setMessage(`✅ ${file.name} 파일을 읽었습니다. (${dataArray.length}개의 문제)`);
      } catch (error) {
        alert("JSON 파싱 에러: 파일 형식을 확인하세요.");
      }
    };
    reader.readAsText(file);
  };

  const handleUpload = async () => {
  if (!jsonContent || !auth.currentUser) return;
  setLoading(true);
  setMessage("⏳ 이미지 압축 및 업로드 중...");
  
  try {
    const batch = writeBatch(db);
    
    for (const item of jsonContent) {
      let finalItem = { ...item };

      // 이미지 용량이 클 경우 압축 진행
      if (item.image && item.image.length > 500000) { // 약 500KB 넘으면 압축
        console.log(`${item.id || '문제'} 이미지 압축 중...`);
        finalItem.image = await compressBase64(item.image);
      }

      const docId = item.id?.toString() || Math.random().toString(36).substr(2, 9);
      const newDocRef = doc(collection(db, "questions"), docId);
      
      batch.set(newDocRef, { 
        ...finalItem,
        updatedAt: new Date().toISOString() 
      });
    }

    await batch.commit();
    setMessage(`🚀 ${jsonContent.length}개 업로드 완료!`);
    setJsonContent(null);
    fetchQuestions();
  } catch (e: any) {
    console.error(e);
    setMessage(`❌ 오류: ${e.message}`);
  } finally {
    setLoading(false);
  }
};

  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-12 px-4 space-y-10">
        <h2 className="text-3xl font-black italic text-gray-800 tracking-tighter">ADMIN PANEL</h2>

        {/* --- 업로드 섹션 --- */}
        <section className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-blue-50">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
             <span className="w-1.5 h-5 bg-blue-600 rounded-full"></span>
             문제 파일 업로드
          </h3>
          <p className="text-xs text-gray-400 mb-4">* JSON 내부 tags.subject 값에 따라 자동 분류됩니다.</p>
          
          <input 
            type="file" 
            accept=".json" 
            onChange={handleFileChange} 
            className="mb-6 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-blue-50 file:text-blue-700" 
          />
          
          <button
            onClick={handleUpload}
            disabled={!jsonContent || loading}
            className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold shadow-lg shadow-gray-200 disabled:bg-gray-100 transition-all hover:bg-black"
          >
            {loading ? "저장 중..." : "업로드 및 저장하기"}
          </button>
          {message && <p className="text-center mt-4 text-blue-600 font-bold text-sm">{message}</p>}
        </section>

        {/* --- 관리 섹션 --- */}
        <section>
          <div className="flex gap-2 mb-6 bg-gray-100 p-1.5 rounded-2xl overflow-x-auto">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setCurrentTab(cat.id)}
                className={`flex-none px-6 py-3 rounded-xl text-sm font-bold transition-all ${currentTab === cat.id ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="grid gap-4">
            {dbQuestions.length === 0 ? (
               <div className="text-center py-20 bg-gray-50 rounded-[2rem] border border-dashed border-gray-200 text-gray-400 font-bold">등록된 문제가 없습니다.</div>
            ) : (
              dbQuestions.map((q) => (
                <div 
                  key={q.id} 
                  onClick={() => setSelectedView(q)}
                  className="bg-white p-6 rounded-2xl border border-gray-100 flex justify-between items-center cursor-pointer hover:border-blue-300 hover:shadow-md transition-all group"
                >
                  <div className="flex-1 truncate mr-4">
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-black mr-2 uppercase">
                      {q.tags?.subject || '미지정'}
                    </span>
                    <span className="font-bold text-gray-700">{q.text}</span>
                  </div>
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      if(window.confirm("삭제할까요?")) deleteDoc(doc(db, "questions", q.id.toString())).then(fetchQuestions); 
                    }} 
                    className="text-gray-300 hover:text-red-500 p-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* --- 상세보기 모달 (이미지 보기 추가) --- */}
      {selectedView && (
         <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-2xl rounded-[2.5rem] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh]">
               <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                  <span className="font-black text-gray-400 text-xs tracking-tighter uppercase">Subject: {selectedView.tags?.subject}</span>
                  <button onClick={() => setSelectedView(null)} className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-full font-bold">×</button>
               </div>
               
               <div className="p-8 overflow-y-auto space-y-6">
                  <p className="text-xl font-bold text-gray-800 leading-relaxed">{selectedView.text}</p>
                  
                  {/* [관리자 모드 이미지 미리보기 추가] */}
                  {selectedView.image && (
                    <div className="mt-4 rounded-2xl overflow-hidden border bg-white p-2">
                      <img 
                        src={selectedView.image.startsWith('data:') ? selectedView.image : `data:image/png;base64,${selectedView.image}`} 
                        alt="Preview" 
                        className="w-full h-auto"
                      />
                    </div>
                  )}

                  {selectedView.useBox && selectedView.smartBoxData && (
                    <div className="p-5 bg-gray-50 border rounded-2xl font-serif text-gray-700 whitespace-pre-line">
                      {selectedView.smartBoxData}
                    </div>
                  )}

                  <div className="space-y-2">
                     {selectedView.options?.map((opt: string, i: number) => (
                       <div key={i} className={`p-4 rounded-xl border-2 flex items-center gap-4 ${i === selectedView.correct ? 'border-blue-500 bg-blue-50 text-blue-700 font-bold' : 'border-gray-100 text-gray-600'}`}>
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${i === selectedView.correct ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-400'}`}>{i+1}</span>
                          {opt}
                       </div>
                     ))}
                  </div>

                  <div className="p-5 bg-amber-50 rounded-2xl border border-amber-100 text-sm text-amber-800 leading-relaxed">
                     <span className="font-black block mb-1 underline decoration-amber-200">해설 (Memo)</span>
                     {selectedView.memo || "해설 정보가 없습니다."}
                  </div>
               </div>
               
               <div className="p-6 border-t bg-white">
                  <button onClick={() => setSelectedView(null)} className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold">확인 완료</button>
               </div>
            </div>
         </div>
      )}
    </Layout>
  );
}