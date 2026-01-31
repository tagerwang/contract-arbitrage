import { API_CATALOG, ExchangeConfig } from '../../constants/apiCatalog';

interface ExchangeSelectorProps {
  selectedExchange: string;
  onSelect: (exchange: string) => void;
}

/**
 * 交易所选择器组件
 */
export default function ExchangeSelector({ selectedExchange, onSelect }: ExchangeSelectorProps) {
  return (
    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
      <h3 className="text-sm font-semibold text-slate-300 mb-3">选择交易所</h3>
      <div className="space-y-2">
        {Object.entries(API_CATALOG).map(([key, exchange]: [string, ExchangeConfig]) => (
          <button
            key={key}
            onClick={() => onSelect(key)}
            className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
              selectedExchange === key
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg shadow-purple-500/20'
                : 'bg-slate-700/50 hover:bg-slate-600 border border-slate-600'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${exchange.color}`} />
              <span className="font-medium text-white">{exchange.name}</span>
            </div>
            <div className={`text-xs mt-1 ml-6 ${
              selectedExchange === key ? 'text-blue-100' : 'text-slate-400'
            }`}>
              {exchange.apis.length} 个接口
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
