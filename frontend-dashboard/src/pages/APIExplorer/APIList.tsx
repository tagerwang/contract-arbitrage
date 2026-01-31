import { ChevronRight } from 'lucide-react';
import type { APIEndpoint } from '../../constants/apiCatalog';

interface APIListProps {
  apis: APIEndpoint[];
  onSelect: (api: APIEndpoint) => void;
}

/**
 * API 列表组件
 */
export default function APIList({ apis, onSelect }: APIListProps) {
  if (apis.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        没有找到匹配的API接口
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {apis.map(api => (
        <div
          key={api.id}
          onClick={() => onSelect(api)}
          className="bg-slate-800/50 border border-slate-700 rounded-lg p-5 hover:border-blue-500 cursor-pointer transition-all hover:shadow-lg hover:shadow-blue-500/10"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className={`px-2 py-1 rounded text-xs font-mono ${
                  api.method === 'GET' ? 'bg-green-600' : 'bg-blue-600'
                } text-white`}>
                  {api.method}
                </span>
                <span className="px-2 py-1 rounded text-xs bg-slate-700 text-slate-300">
                  {api.category}
                </span>
                {api.websocket && (
                  <span className="px-2 py-1 rounded text-xs bg-purple-600 text-white">
                    WebSocket
                  </span>
                )}
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">{api.name}</h3>
              <p className="text-slate-400 text-sm mb-2">{api.description}</p>
              <div className="inline-block bg-slate-900/80 border border-slate-600 rounded px-3 py-1.5">
                <code className="text-xs text-blue-400 font-mono">{api.endpoint}</code>
              </div>
            </div>
            <ChevronRight className="text-slate-400 w-5 h-5 ml-4 flex-shrink-0" />
          </div>
        </div>
      ))}
    </div>
  );
}
