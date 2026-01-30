import { useState, useCallback } from 'react';
import { Play, Code, BookOpen, Settings } from 'lucide-react';
import axios from 'axios';
import ParamEditor from './components/ParamEditor';
import ResponseViewer from './components/ResponseViewer';
import CodeGenerator from './components/CodeGenerator';
import { API_ENDPOINTS, ENDPOINTS_BY_CATEGORY, CATEGORIES, METHOD_COLORS } from './constants/endpoints';
import { buildUrl, validateAllParams, generateId } from './utils/helpers';
import type { ApiEndpoint, ApiResponse, RequestHistory, TabType } from './types';
import './App.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

function App() {
  // 状态管理
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint>(API_ENDPOINTS[0]);
  const [params, setParams] = useState<Record<string, string>>({});
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [activeTab, setActiveTab] = useState<TabType>('test');
  const [history, setHistory] = useState<RequestHistory[]>([]);

  // 参数变更处理
  const handleParamChange = useCallback((name: string, value: string) => {
    setParams(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  // 发送请求
  const handleSendRequest = async () => {
    // 验证参数
    const errors = validateAllParams(selectedEndpoint.params, params);
    if (errors.length > 0) {
      setError(errors.join(', '));
      return;
    }

    setLoading(true);
    setError(null);
    setResponse(null);

    const startTime = Date.now();

    try {
      const url = buildUrl(API_BASE_URL, selectedEndpoint.path, params);
      
      const res = await axios({
        method: selectedEndpoint.method,
        url,
        timeout: 30000
      });

      const requestDuration = Date.now() - startTime;
      setDuration(requestDuration);
      setResponse(res.data);

      // 添加到历史记录
      const historyRecord: RequestHistory = {
        id: generateId(),
        endpoint: selectedEndpoint,
        params: { ...params },
        url,
        method: selectedEndpoint.method,
        timestamp: new Date(),
        response: res.data,
        duration: requestDuration,
        status: res.status
      };

      setHistory(prev => [historyRecord, ...prev].slice(0, 50));

    } catch (err: any) {
      const requestDuration = Date.now() - startTime;
      setDuration(requestDuration);
      
      if (err.response) {
        setError(`HTTP ${err.response.status}: ${err.response.statusText}`);
        setResponse(err.response.data);
      } else if (err.request) {
        setError('请求超时或服务器无响应');
      } else {
        setError(err.message);
      }

      // 添加错误到历史记录
      const historyRecord: RequestHistory = {
        id: generateId(),
        endpoint: selectedEndpoint,
        params: { ...params },
        url: buildUrl(API_BASE_URL, selectedEndpoint.path, params),
        method: selectedEndpoint.method,
        timestamp: new Date(),
        error: err.message,
        duration: requestDuration,
        status: err.response?.status || 0
      };

      setHistory(prev => [historyRecord, ...prev].slice(0, 50));

    } finally {
      setLoading(false);
    }
  };

  // 选择端点
  const handleSelectEndpoint = (endpoint: ApiEndpoint) => {
    setSelectedEndpoint(endpoint);
    setParams({});
    setResponse(null);
    setError(null);
    setDuration(0);
  };

  // 重放历史请求
  const handleReplayHistory = (record: RequestHistory) => {
    setSelectedEndpoint(record.endpoint);
    setParams(record.params);
    setActiveTab('test');
  };

  return (
    <div className="app">
      {/* 顶部导航栏 */}
      <header style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '24px 32px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h1 style={{ 
              fontSize: '28px', 
              marginBottom: '6px',
              fontWeight: 700 
            }}>
              🔌 API 管理面板
            </h1>
            <p style={{ opacity: 0.95, fontSize: '14px', margin: 0 }}>
              测试和管理合约套利监控系统API
            </p>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.2)',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '13px'
          }}>
            🌐 {API_BASE_URL}
          </div>
        </div>
      </header>

      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '24px 32px'
      }}>
        <div style={{ display: 'flex', gap: '24px', minHeight: 'calc(100vh - 180px)' }}>
          {/* 左侧边栏 - 端点列表 */}
          <aside style={{
            width: '320px',
            flexShrink: 0,
            background: 'white',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            overflowY: 'auto',
            maxHeight: 'calc(100vh - 180px)'
          }}>
            <h3 style={{ 
              marginBottom: '16px', 
              fontSize: '16px',
              color: '#333',
              fontWeight: 600
            }}>
              API 端点
            </h3>

            {CATEGORIES.map(category => (
              <div key={category} style={{ marginBottom: '20px' }}>
                <div style={{
                  fontSize: '13px',
                  color: '#999',
                  fontWeight: 600,
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  {category}
                </div>

                {ENDPOINTS_BY_CATEGORY[category].map(endpoint => (
                  <div
                    key={endpoint.id}
                    onClick={() => handleSelectEndpoint(endpoint)}
                    style={{
                      padding: '10px 12px',
                      marginBottom: '6px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      background: selectedEndpoint.id === endpoint.id ? '#667eea' : '#f5f5f5',
                      color: selectedEndpoint.id === endpoint.id ? 'white' : '#333',
                      transition: 'all 0.2s',
                      border: selectedEndpoint.id === endpoint.id ? '1px solid #667eea' : '1px solid transparent'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedEndpoint.id !== endpoint.id) {
                        e.currentTarget.style.background = '#ebebeb';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedEndpoint.id !== endpoint.id) {
                        e.currentTarget.style.background = '#f5f5f5';
                      }
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '4px'
                    }}>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 'bold',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: selectedEndpoint.id === endpoint.id 
                          ? 'rgba(255,255,255,0.3)' 
                          : METHOD_COLORS[endpoint.method] + '20',
                        color: selectedEndpoint.id === endpoint.id 
                          ? 'white' 
                          : METHOD_COLORS[endpoint.method]
                      }}>
                        {endpoint.method}
                      </span>
                      <span style={{
                        fontSize: '13px',
                        fontWeight: 500,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {endpoint.name}
                      </span>
                    </div>
                    <div style={{
                      fontSize: '11px',
                      opacity: 0.8,
                      fontFamily: 'monospace'
                    }}>
                      {endpoint.path}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </aside>


          {/* 主内容区域 */}
          <main style={{ flex: 1, minWidth: 0 }}>
            {/* 端点信息卡片 */}
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '12px'
              }}>
                <span style={{
                  fontSize: '14px',
                  fontWeight: 'bold',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  background: METHOD_COLORS[selectedEndpoint.method] + '20',
                  color: METHOD_COLORS[selectedEndpoint.method]
                }}>
                  {selectedEndpoint.method}
                </span>
                <code style={{
                  flex: 1,
                  background: '#f5f5f5',
                  padding: '8px 14px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontFamily: 'monospace'
                }}>
                  {selectedEndpoint.path}
                </code>
              </div>
              <p style={{ 
                color: '#666', 
                fontSize: '14px',
                lineHeight: '1.6',
                margin: 0
              }}>
                {selectedEndpoint.description}
              </p>
            </div>

            {/* 标签页 */}
            <div style={{
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              overflow: 'hidden'
            }}>
              {/* 标签页导航 */}
              <div style={{
                display: 'flex',
                borderBottom: '1px solid #e0e0e0',
                background: '#fafafa'
              }}>
                {[
                  { id: 'test' as TabType, icon: <Play size={16} />, label: '测试' },
                  { id: 'docs' as TabType, icon: <Code size={16} />, label: '代码' },
                  { id: 'history' as TabType, icon: <BookOpen size={16} />, label: `历史 (${history.length})` }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      background: activeTab === tab.id ? 'white' : 'transparent',
                      border: 'none',
                      padding: '14px 20px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '14px',
                      fontWeight: 500,
                      color: activeTab === tab.id ? '#667eea' : '#666',
                      borderBottom: activeTab === tab.id ? '2px solid #667eea' : '2px solid transparent',
                      transition: 'all 0.2s'
                    }}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* 标签页内容 */}
              <div style={{ padding: '24px' }}>
                {/* 测试标签页 */}
                {activeTab === 'test' && (
                  <div>
                    {/* 参数编辑器 */}
                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ 
                        marginBottom: '16px', 
                        fontSize: '16px',
                        fontWeight: 600,
                        color: '#333'
                      }}>
                        请求参数
                      </h4>
                      <ParamEditor
                        params={selectedEndpoint.params}
                        values={params}
                        onChange={handleParamChange}
                      />
                    </div>

                    {/* 发送按钮 */}
                    <button
                      onClick={handleSendRequest}
                      disabled={loading}
                      style={{
                        width: '100%',
                        background: loading ? '#ccc' : '#667eea',
                        color: 'white',
                        border: 'none',
                        padding: '14px',
                        borderRadius: '8px',
                        fontSize: '15px',
                        fontWeight: 600,
                        cursor: loading ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        transition: 'all 0.2s',
                        marginBottom: '24px'
                      }}
                      onMouseEnter={(e) => {
                        if (!loading) {
                          e.currentTarget.style.background = '#5568d3';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!loading) {
                          e.currentTarget.style.background = '#667eea';
                        }
                      }}
                    >
                      <Play size={18} />
                      {loading ? '发送中...' : '发送请求'}
                    </button>

                    {/* 响应查看器 */}
                    <div>
                      <h4 style={{ 
                        marginBottom: '16px', 
                        fontSize: '16px',
                        fontWeight: 600,
                        color: '#333'
                      }}>
                        响应结果
                      </h4>
                      <ResponseViewer
                        response={response}
                        loading={loading}
                        error={error}
                        duration={duration}
                      />
                    </div>
                  </div>
                )}

                {/* 代码标签页 */}
                {activeTab === 'docs' && (
                  <div>
                    <h4 style={{ 
                      marginBottom: '16px', 
                      fontSize: '16px',
                      fontWeight: 600,
                      color: '#333'
                    }}>
                      代码示例
                    </h4>
                    <CodeGenerator
                      endpoint={selectedEndpoint}
                      params={params}
                      baseUrl={API_BASE_URL}
                    />
                  </div>
                )}

                {/* 历史标签页 */}
                {activeTab === 'history' && (
                  <div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '16px'
                    }}>
                      <h4 style={{ 
                        fontSize: '16px',
                        fontWeight: 600,
                        color: '#333',
                        margin: 0
                      }}>
                        请求历史
                      </h4>
                      {history.length > 0 && (
                        <button
                          onClick={() => setHistory([])}
                          style={{
                            background: '#f5f5f5',
                            border: '1px solid #ddd',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '13px',
                            cursor: 'pointer',
                            color: '#666'
                          }}
                        >
                          清空历史
                        </button>
                      )}
                    </div>

                    {history.length === 0 ? (
                      <div style={{
                        padding: '60px',
                        textAlign: 'center',
                        color: '#999',
                        background: '#f8f9fa',
                        borderRadius: '8px'
                      }}>
                        <div style={{ fontSize: '48px', marginBottom: '12px' }}>📜</div>
                        <div>暂无请求历史</div>
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gap: '12px' }}>
                        {history.map(record => (
                          <div
                            key={record.id}
                            onClick={() => handleReplayHistory(record)}
                            style={{
                              padding: '16px',
                              background: '#f8f9fa',
                              borderRadius: '8px',
                              border: '1px solid #e9ecef',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#e9ecef';
                              e.currentTarget.style.borderColor = '#667eea';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#f8f9fa';
                              e.currentTarget.style.borderColor = '#e9ecef';
                            }}
                          >
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'flex-start',
                              marginBottom: '8px'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{
                                  fontSize: '11px',
                                  fontWeight: 'bold',
                                  padding: '3px 8px',
                                  borderRadius: '4px',
                                  background: METHOD_COLORS[record.method] + '20',
                                  color: METHOD_COLORS[record.method]
                                }}>
                                  {record.method}
                                </span>
                                <span style={{ fontSize: '14px', fontWeight: 500 }}>
                                  {record.endpoint.name}
                                </span>
                              </div>
                              <span style={{
                                fontSize: '12px',
                                color: record.error ? '#f44336' : '#00c853',
                                fontWeight: 500
                              }}>
                                {record.error ? '失败' : '成功'}
                              </span>
                            </div>
                            <div style={{ fontSize: '12px', color: '#666', marginBottom: '6px' }}>
                              {record.timestamp.toLocaleString('zh-CN')} · 耗时 {record.duration}ms
                            </div>
                            {Object.keys(record.params).length > 0 && (
                              <div style={{ fontSize: '12px', color: '#999' }}>
                                参数: {JSON.stringify(record.params)}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;
