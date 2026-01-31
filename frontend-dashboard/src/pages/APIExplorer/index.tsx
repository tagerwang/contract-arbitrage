import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { API_CATALOG, APIEndpoint } from '../../constants/apiCatalog';
import ExchangeSelector from './ExchangeSelector';
import CategoryFilter from './CategoryFilter';
import APIList from './APIList';
import APIDetail from './APIDetail';

/**
 * API 管理中心页面
 */
export default function APIExplorer() {
  const [selectedExchange, setSelectedExchange] = useState('binance');
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [selectedAPI, setSelectedAPI] = useState<APIEndpoint | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const currentExchange = API_CATALOG[selectedExchange];

  // 筛选 API 列表
  const filteredAPIs = useMemo(() => {
    return currentExchange.apis.filter(api => {
      const matchCategory = selectedCategory === '全部' || api.category === selectedCategory;
      const matchSearch = 
        api.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        api.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        api.endpoint.toLowerCase().includes(searchTerm.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [currentExchange.apis, selectedCategory, searchTerm]);

  // 切换交易所时清除选中的 API
  const handleExchangeSelect = (exchange: string) => {
    setSelectedExchange(exchange);
    setSelectedAPI(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-900/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                合约套利系统 - API管理中心
              </h1>
              <p className="text-slate-400 mt-2">三大交易所完整API接口文档与测试平台</p>
            </div>
            <Link 
              to="/"
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-sm"
            >
              返回首页
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Sidebar */}
          <div className="col-span-3 space-y-4">
            <ExchangeSelector
              selectedExchange={selectedExchange}
              onSelect={handleExchangeSelect}
            />
            <CategoryFilter
              selectedCategory={selectedCategory}
              onSelect={setSelectedCategory}
            />
          </div>

          {/* Main Content */}
          <div className="col-span-9">
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="搜索API接口..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-400"
                />
              </div>
            </div>

            {/* Content Area */}
            {!selectedAPI ? (
              <APIList 
                apis={filteredAPIs} 
                onSelect={setSelectedAPI} 
              />
            ) : (
              <APIDetail 
                api={selectedAPI} 
                exchange={selectedExchange}
                onBack={() => setSelectedAPI(null)} 
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
