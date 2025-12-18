import { useNavigate } from 'react-router-dom';
import type { Category } from '../types';
import Layout from '../components/Layout';

const categories: { id: Category; label: string; desc: string }[] = [
  { id: 'reading', label: '독서 (비문학)', desc: '인문, 사회, 과학 지문 독해' },
  { id: 'literature', label: '문학', desc: '현대시, 고전소설 등 감상' },
  { id: 'grammar', label: '언어와 매체', desc: '국어 문법 핵심 정리' },
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <Layout>
      <h2 className="text-2xl font-bold mb-6 text-center">영역을 선택하세요</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => navigate(`/quiz/${cat.id}`)}
            className="p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition border border-gray-100 text-left"
          >
            <h3 className="text-xl font-bold text-blue-600 mb-2">{cat.label}</h3>
            <p className="text-gray-500 text-sm">{cat.desc}</p>
          </button>
        ))}
      </div>
    </Layout>
  );
}