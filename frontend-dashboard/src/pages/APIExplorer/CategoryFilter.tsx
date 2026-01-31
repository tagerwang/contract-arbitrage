import { CATEGORIES } from '../../constants/apiCatalog';

interface CategoryFilterProps {
  selectedCategory: string;
  onSelect: (category: string) => void;
}

/**
 * API 分类筛选组件
 */
export default function CategoryFilter({ selectedCategory, onSelect }: CategoryFilterProps) {
  return (
    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
      <h3 className="text-sm font-semibold text-slate-300 mb-3">接口分类</h3>
      <div className="space-y-1">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => onSelect(cat)}
            className={`w-full text-left px-3 py-2 rounded text-sm transition-all ${
              selectedCategory === cat
                ? 'bg-blue-600 text-white font-semibold shadow-lg shadow-blue-500/20'
                : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600 hover:text-white border border-slate-600'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
}
