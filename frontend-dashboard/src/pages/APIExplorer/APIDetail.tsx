import { useState } from 'react';
import { Play, Copy, Check, ArrowLeft } from 'lucide-react';
import type { APIEndpoint } from '../../constants/apiCatalog';

interface APIDetailProps {
  api: APIEndpoint;
  onBack: () => void;
}

interface TestResult {
  status: 'success' | 'error';
  data: unknown;
  timestamp: string;
}

/**
 * API 详情组件
 */
export default function APIDetail({ api, onBack }: APIDetailProps) {
  const [copied, setCopied] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  const copyEndpoint = () => {
    navigator.clipboard.writeText(api.endpoint);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTest = () => {
    // 模拟测试结果
    setTestResult({
      status: 'success',
      data: api.response,
      timestamp: new Date().toLocaleString('zh-CN')
    });
  };

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="text-blue-400 hover:text-blue-300 flex items-center gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        返回列表
      </button>

      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
        {/* 头部 */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className={`px-3 py-1 rounded font-mono font-semibold text-white ${
                api.method === 'GET' ? 'bg-green-600' : 'bg-blue-600'
              }`}>
                {api.method}
              </span>
              <h2 className="text-2xl font-bold text-white">{api.name}</h2>
            </div>
            <p className="text-slate-300">{api.description}</p>
          </div>
        </div>

        {/* 接口地址 */}
        <div className="mb-6">
          <label className="text-sm text-slate-400 mb-2 block">接口地址</label>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-4 py-3 bg-slate-900 rounded font-mono text-blue-400 border border-slate-700">
              {api.endpoint}
            </code>
            <button
              onClick={copyEndpoint}
              className="px-4 py-3 bg-slate-700 hover:bg-slate-600 rounded transition-colors text-white"
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* 参数表 */}
        {api.params.length > 0 && (
          <div className="mb-6">
            <label className="text-sm text-slate-400 mb-3 block">请求参数</label>
            <div className="bg-slate-900 rounded border border-slate-700 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-800">
                  <tr>
                    <th className="text-left px-4 py-3 text-slate-300">参数名</th>
                    <th className="text-left px-4 py-3 text-slate-300">类型</th>
                    <th className="text-left px-4 py-3 text-slate-300">必填</th>
                    <th className="text-left px-4 py-3 text-slate-300">说明</th>
                  </tr>
                </thead>
                <tbody>
                  {api.params.map((param, idx) => (
                    <tr key={idx} className="border-t border-slate-700">
                      <td className="px-4 py-3 font-mono text-blue-400">{param.name}</td>
                      <td className="px-4 py-3 text-slate-400">{param.type}</td>
                      <td className="px-4 py-3">
                        {param.required ? (
                          <span className="text-red-400">是</span>
                        ) : (
                          <span className="text-slate-500">否</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-300">{param.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* WebSocket */}
        {api.websocket && (
          <div className="mb-6">
            <label className="text-sm text-slate-400 mb-2 block">WebSocket 订阅</label>
            <code className="block px-4 py-3 bg-slate-900 rounded font-mono text-sm text-purple-400 border border-slate-700">
              {api.websocket}
            </code>
          </div>
        )}

        {/* 响应示例 */}
        <div className="mb-6">
          <label className="text-sm text-slate-400 mb-2 block">响应示例</label>
          <div className="bg-slate-900 rounded border border-slate-700 p-4">
            <pre className="font-mono text-sm text-emerald-400 overflow-x-auto bg-#333">
              {JSON.stringify(api.response, null, 2)}
            </pre>
          </div>
        </div>

        {/* 测试按钮 */}
        <button
          onClick={handleTest}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl text-white"
        >
          <Play className="w-5 h-5" />
          测试接口
        </button>

        {/* 测试结果 */}
        {testResult && (
          <div className="mt-4 rounded-lg overflow-hidden border border-green-500/30">
            {/* 成功状态头部 */}
            <div className="bg-green-600/20 border-b border-green-500/30 px-4 py-3 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-green-400 font-semibold">测试成功</span>
              <span className="text-slate-400 text-sm ml-auto">{testResult.timestamp}</span>
            </div>
            {/* 响应数据 */}
            <div className="bg-slate-900 p-4">
              {/* pre用#333333 */}
              <pre className="text-sm text-green-400 font-mono overflow-x-auto bg-#333">
                {JSON.stringify(testResult.data, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
