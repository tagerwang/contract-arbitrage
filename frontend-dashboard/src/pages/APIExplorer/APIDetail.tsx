import { useState } from 'react';
import { Play, Copy, Check, ArrowLeft, Loader2 } from 'lucide-react';
import { Select } from '@arco-design/web-react';
import type { APIEndpoint } from '../../constants/apiCatalog';
import { apiClient } from '../../api/client';
import { useSymbolsForExchange } from '../../hooks/useSymbolsForExchange';

interface APIDetailProps {
  api: APIEndpoint;
  onBack: () => void;
  exchange: string;
}

interface TestResult {
  status: 'success' | 'error' | 'info';
  data: unknown;
  timestamp: string;
  error?: string;
}

/** 固定选项：paramName -> options (label, value) */
const FIXED_OPTIONS: Record<string, { label: string; value: string }[]> = {
  side: [
    { label: '买（BUY）', value: 'BUY' },
    { label: '卖（SELL）', value: 'SELL' }
  ],
  type: [
    { label: '限价单（LIMIT）', value: 'LIMIT' },
    { label: '市价单（MARKET）', value: 'MARKET' }
  ],
  ordType: [
    { label: '限价单（limit）', value: 'limit' },
    { label: '市价单（market）', value: 'market' }
  ],
  orderType: [
    { label: '市价单（Market）', value: 'Market' },
    { label: '限价单（Limit）', value: 'Limit' }
  ],
  positionSide: [
    { label: '单向持仓（BOTH）', value: 'BOTH' },
    { label: '双向做多（LONG）', value: 'LONG' },
    { label: '双向做空（SHORT）', value: 'SHORT' }
  ],
  tdMode: [
    { label: '全仓模式（cross）', value: 'cross' },
    { label: '逐仓模式（isolated）', value: 'isolated' }
  ],
  category: [{ label: '合约（linear）', value: 'linear' }],
  instType: [{ label: '永续合约（SWAP）', value: 'SWAP' }]
};

/** OKX 的 side 选项为小写 */
const OKX_SIDE_OPTIONS = [
  { label: '买（buy）', value: 'buy' },
  { label: '卖（sell）', value: 'sell' }
];

/**
 * API 详情组件
 */
export default function APIDetail({ api, onBack, exchange }: APIDetailProps) {
  const [copied, setCopied] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const { symbolOptionsWithInfo, loading: symbolsLoading } = useSymbolsForExchange(exchange);

  const copyEndpoint = () => {
    navigator.clipboard.writeText(api.endpoint);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleParamChange = (paramName: string, value: string) => {
    setParamValues(prev => ({
      ...prev,
      [paramName]: value
    }));
  };

  /** 当前 param 是否用 Select 以及对应 options（交易对用 symbolOptionsWithInfo，其余用固定选项） */
  const getParamSelectOptions = (paramName: string) => {
    if (paramName === 'symbol' && (exchange === 'binance' || exchange === 'bybit')) {
      return symbolOptionsWithInfo.map((o) => ({ label: o.label, value: o.value }));
    }
    if (paramName === 'instId' && exchange === 'okx') {
      return symbolOptionsWithInfo.map((o) => ({ label: o.label, value: o.value }));
    }
    if (paramName === 'side' && exchange === 'okx') {
      return OKX_SIDE_OPTIONS;
    }
    return FIXED_OPTIONS[paramName] ?? null;
  };

  /** 是否为需要本地搜索的 Select（交易对） */
  const isSymbolParam = (paramName: string) =>
    (paramName === 'symbol' && (exchange === 'binance' || exchange === 'bybit')) ||
    (paramName === 'instId' && exchange === 'okx');

  const handleTest = async () => {
    setIsLoading(true);
    setTestResult(null);

    try {
      let data: unknown;

      // 根据端点 ID 调用对应的 API
      switch (api.id) {
        // Binance APIs
        case 'bn_funding_rate':
          data = await apiClient.getExchangeFundingRate('binance', paramValues.symbol || 'BTCUSDT');
          break;
        case 'bn_premium_index':
          data = await apiClient.getExchangeFundingRate('binance', paramValues.symbol || 'BTCUSDT');
          break;
        case 'bn_contract_list':
          data = await apiClient.getExchangeInfo('binance');
          break;
        case 'bn_account':
          setTestResult({
            status: 'info',
            data: {
              tip: '该接口需要 API Key 和签名认证',
              suggestion: '请使用 Postman、交易所官方 API 文档或配置好密钥的后端进行测试'
            },
            timestamp: new Date().toLocaleString('zh-CN')
          });
          return;
        case 'bn_new_order': {
          const bnParams: Record<string, string> = {
            symbol: paramValues.symbol || 'BTCUSDT',
            side: (paramValues.side || 'BUY').toUpperCase(),
            type: (paramValues.type || 'MARKET').toUpperCase(),
            quantity: paramValues.quantity || '0.001'
          };
          if (paramValues.positionSide) {
            bnParams.positionSide = paramValues.positionSide.toUpperCase();
          }
          if (paramValues.price) bnParams.price = paramValues.price;
          data = await apiClient.placeOrder('binance', bnParams);
          break;
        }
        
        // OKX APIs
        case 'okx_funding_rate':
          data = await apiClient.getExchangeFundingRate('okx', paramValues.instId || 'BTC-USDT-SWAP');
          break;
        case 'okx_funding_history':
          data = await apiClient.getExchangeKlines('okx', paramValues.instId || 'BTC-USDT-SWAP', '1H', 10);
          break;
        case 'okx_instruments':
          data = await apiClient.getExchangeSymbols('okx');
          break;
        case 'okx_account_balance':
          setTestResult({
            status: 'info',
            data: {
              tip: '该接口需要 API Key 和签名认证',
              suggestion: '请使用 Postman、交易所官方 API 文档或配置好密钥的后端进行测试'
            },
            timestamp: new Date().toLocaleString('zh-CN')
          });
          return;
        case 'okx_place_order': {
          const okxParams: Record<string, string> = {
            instId: paramValues.instId || 'BTC-USDT-SWAP',
            tdMode: paramValues.tdMode || 'cross',
            side: (paramValues.side || 'buy').toLowerCase(),
            ordType: (paramValues.ordType || 'market').toLowerCase(),
            sz: paramValues.sz || '1'
          };
          if (paramValues.px) okxParams.px = paramValues.px;
          data = await apiClient.placeOrder('okx', okxParams);
          break;
        }
        
        // Bybit APIs
        case 'bybit_funding_rate':
          data = await apiClient.getExchangeKlines('bybit', paramValues.symbol || 'BTCUSDT', '60', 10);
          break;
        case 'bybit_tickers':
          data = await apiClient.getExchangeFundingRate('bybit', paramValues.symbol || 'BTCUSDT');
          break;
        case 'bybit_instruments':
          data = await apiClient.getExchangeSymbols('bybit');
          break;
        case 'bybit_wallet_balance':
          setTestResult({
            status: 'info',
            data: {
              tip: '该接口需要 API Key 和签名认证',
              suggestion: '请使用 Postman、交易所官方 API 文档或配置好密钥的后端进行测试'
            },
            timestamp: new Date().toLocaleString('zh-CN')
          });
          return;
        case 'bybit_place_order': {
          const bybitParams: Record<string, string> = {
            symbol: paramValues.symbol || 'BTCUSDT',
            side: /sell/i.test(paramValues.side || '') ? 'Sell' : 'Buy',
            orderType: /limit/i.test(paramValues.orderType || '') ? 'Limit' : 'Market',
            qty: paramValues.qty || '0.001'
          };
          if (paramValues.price) bybitParams.price = paramValues.price;
          data = await apiClient.placeOrder('bybit', bybitParams);
          break;
        }

        // 通用测试接口
        default:
          // 尝试根据参数自动调用
          if (paramValues.symbol) {
            data = await apiClient.getExchangePrice(exchange, paramValues.symbol);
          } else {
            data = await apiClient.getExchangeFundingRates(exchange);
          }
          break;
      }

      setTestResult({
        status: 'success',
        data,
        timestamp: new Date().toLocaleString('zh-CN')
      });
    } catch (error: unknown) {
      let errorMsg = '未知错误';
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { error?: string }; status?: number } };
        errorMsg = axiosError.response?.data?.error ?? `HTTP ${axiosError.response?.status ?? 500}`;
      } else if (error instanceof Error) {
        errorMsg = error.message;
      }
      setTestResult({
        status: 'error',
        data: null,
        timestamp: new Date().toLocaleString('zh-CN'),
        error: errorMsg
      });
    } finally {
      setIsLoading(false);
    }
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
            <div className="space-y-3">
              {api.params.map((param, idx) => {
                const selectOptions = getParamSelectOptions(param.name);
                const useSelect = selectOptions && selectOptions.length > 0;
                return (
                  <div key={idx} className="bg-slate-900 rounded border border-slate-700 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-blue-400">{param.name}</span>
                        <span className="text-xs px-2 py-1 bg-slate-700 rounded text-slate-300">
                          {param.type}
                        </span>
                        {param.required && (
                          <span className="text-xs px-2 py-1 bg-red-600/20 text-red-400 rounded">
                            必填
                          </span>
                        )}
                      </div>
                    </div>
                    {useSelect ? (
                      <Select
                        placeholder={param.desc}
                        value={paramValues[param.name] || undefined}
                        onChange={(value) => handleParamChange(param.name, value ?? '')}
                        options={selectOptions}
                        showSearch={isSymbolParam(param.name)}
                        allowClear
                        allowCreate={isSymbolParam(param.name)}
                        filterOption={isSymbolParam(param.name)
                          ? (inputValue, option: { value?: unknown; label?: unknown; props?: { value?: unknown; children?: unknown } }) => {
                              const val = String(option?.value ?? option?.props?.value ?? '');
                              const lbl = String(option?.label ?? option?.props?.children ?? '');
                              const q = inputValue.toLowerCase().trim();
                              return !q || val.toLowerCase().includes(q) || lbl.toLowerCase().includes(q);
                            }
                          : undefined}
                        loading={isSymbolParam(param.name) && symbolsLoading}
                        className="w-full [&_.arco-select-view]:bg-slate-800 [&_.arco-select-view]:border-slate-600 [&_.arco-select-view]:text-white"
                      />
                    ) : (
                      <input
                        type="text"
                        placeholder={param.desc}
                        value={paramValues[param.name] || ''}
                        onChange={(e) => handleParamChange(param.name, e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-white text-sm placeholder-slate-400"
                      />
                    )}
                    <p className="text-xs text-slate-400 mt-2">{param.desc}</p>
                  </div>
                );
              })}
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
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              测试中...
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              测试接口
            </>
          )}
        </button>

        {/* 测试结果 */}
        {testResult && (
          <div className={`mt-4 rounded-lg overflow-hidden border ${
            testResult.status === 'success' 
              ? 'border-green-500/30' 
              : testResult.status === 'info'
              ? 'border-amber-500/30'
              : 'border-red-500/30'
          }`}>
            {/* 状态头部 */}
            <div className={`${
              testResult.status === 'success' 
                ? 'bg-green-600/20 border-green-500/30' 
                : testResult.status === 'info'
                ? 'bg-amber-600/20 border-amber-500/30'
                : 'bg-red-600/20 border-red-500/30'
            } border-b px-4 py-3 flex items-center gap-2`}>
              <div className={`w-2 h-2 rounded-full ${
                testResult.status === 'success' ? 'bg-green-400' : 
                testResult.status === 'info' ? 'bg-amber-400' : 'bg-red-400'
              } animate-pulse`} />
              <span className={`font-semibold ${
                testResult.status === 'success' ? 'text-green-400' : 
                testResult.status === 'info' ? 'text-amber-400' : 'text-red-400'
              }`}>
                {testResult.status === 'success' ? '测试成功' : 
                 testResult.status === 'info' ? '说明' : '测试失败'}
              </span>
              <span className="text-slate-400 text-sm ml-auto">{testResult.timestamp}</span>
            </div>
            {/* 错误信息或响应数据 */}
            <div className="bg-slate-900 p-4">
              {testResult.status === 'error' && testResult.error !== undefined && (
                <div className="mb-2 text-red-400 text-sm">{testResult.error}</div>
              )}
              {testResult.status === 'info' && (() => {
                const d = testResult.data as Record<string, string> | undefined;
                if (d && typeof d.tip === 'string') {
                  return (
                    <div className="space-y-2 text-amber-200">
                      <p className="font-medium">{d.tip}</p>
                      <p className="text-sm text-slate-400">{d.suggestion ?? ''}</p>
                    </div>
                  );
                }
                return null;
              })()}
              {testResult.status === 'success' && testResult.data !== undefined && (
                <pre className="text-sm text-green-400 font-mono overflow-x-auto bg-#333">
                  {JSON.stringify(testResult.data, null, 2)}
                </pre>
              )}
              {testResult.status === 'error' && !testResult.data && (
                <pre className="text-sm text-red-400 font-mono overflow-x-auto bg-#333">
                  无数据返回
                </pre>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
