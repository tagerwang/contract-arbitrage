import { useState, useEffect } from 'react';
import { RefreshCw, TrendingUp, Activity, BarChart3, Download } from 'lucide-react';
import StatCard from './components/StatCard';
import OpportunityTable from './components/OpportunityTable';
import { useOpportunities, useStatistics, useLocalStorage } from './hooks/useData';
import { formatPercent, downloadJSON, downloadCSV } from './utils/format';
import type { TopSymbol } from './types';
import './App.css';

function App() {
  const [autoRefresh, setAutoRefresh] = useLocalStorage('autoRefresh', true);
  const [refreshInterval] = useLocalStorage('refreshInterval', 10000);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // 使用自定义 Hooks 获取数据
  const { 
    opportunities, 
    loading: oppLoading, 
    error: oppError,
    refetch: refetchOpportunities 
  } = useOpportunities(autoRefresh, refreshInterval);

  const { 
    statistics, 
    loading: statsLoading,
    error: statsError,
    refetch: refetchStatistics 
  } = useStatistics(24, autoRefresh);

  // 手动刷新
  const handleRefresh = async () => {
    await Promise.all([
      refetchOpportunities(),
      refetchStatistics()
    ]);
    setLastUpdate(new Date());
  };

  // 导出数据
  const handleExportJSON = () => {
    downloadJSON({
      opportunities,
      statistics,
      exportedAt: new Date().toISOString()
    }, `arbitrage-data-${Date.now()}`);
  };

  const handleExportCSV = () => {
    if (opportunities.length > 0) {
      downloadCSV(opportunities, `arbitrage-opportunities-${Date.now()}`);
    }
  };

  // 更新最后刷新时间
  useEffect(() => {
    if (!oppLoading && !statsLoading) {
      setLastUpdate(new Date());
    }
  }, [oppLoading, statsLoading]);

  return (
    <div className="app" style={{ 
      minHeight: '100vh', 
      background: '#f5f7fa',
      padding: '20px' 
    }}>
      {/* 头部区域 */}
      <header style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '32px',
        borderRadius: '16px',
        marginBottom: '24px',
        boxShadow: '0 8px 16px rgba(102, 126, 234, 0.2)'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <h1 style={{ 
              fontSize: '32px', 
              marginBottom: '8px',
              fontWeight: 700,
              letterSpacing: '-0.5px'
            }}>
              📊 合约套利监控系统
            </h1>
            <p style={{ opacity: 0.95, fontSize: '15px' }}>
              实时监控 Binance、OKX、Bybit 资金费率差异
            </p>
          </div>
          
          <div style={{ 
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '12px'
          }}>
            <div style={{ 
              fontSize: '13px', 
              opacity: 0.9,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: autoRefresh ? '#00c853' : '#ff5722',
                animation: autoRefresh ? 'pulse 2s infinite' : 'none'
              }} />
              最后更新: {lastUpdate.toLocaleTimeString()}
            </div>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 500,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                }}
              >
                {autoRefresh ? '🔄 自动刷新中' : '⏸️ 已暂停'}
              </button>
              
              <button
                onClick={handleRefresh}
                disabled={oppLoading || statsLoading}
                style={{
                  background: 'rgba(255,255,255,0.25)',
                  border: '1px solid rgba(255,255,255,0.4)',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  cursor: oppLoading || statsLoading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px',
                  fontWeight: 500,
                  opacity: oppLoading || statsLoading ? 0.6 : 1,
                  transition: 'all 0.2s'
                }}
              >
                <RefreshCw size={16} className={oppLoading || statsLoading ? 'spinning' : ''} />
                刷新数据
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 错误提示 */}
      {(oppError || statsError) && (
        <div style={{
          background: '#fff3e0',
          border: '1px solid #ffb74d',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <span style={{ fontSize: '20px' }}>⚠️</span>
          <div>
            <div style={{ fontWeight: 600, color: '#e65100', marginBottom: '4px' }}>
              数据加载失败
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>
              {oppError || statsError}
            </div>
          </div>
        </div>
      )}


      {/* 统计卡片区域 */}
      {statistics && !statsLoading && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px',
          marginBottom: '24px'
        }}>
          <StatCard
            icon={<TrendingUp />}
            title="总机会数"
            value={statistics.totalOpportunities}
            color="#667eea"
            subtitle="最近 24 小时"
          />
          <StatCard
            icon={<Activity />}
            title="平均费差"
            value={formatPercent(statistics.avgSpread || 0, 4)}
            color="#f093fb"
            subtitle="所有交易对平均值"
          />
          <StatCard
            icon={<BarChart3 />}
            title="平均年化收益"
            value={formatPercent(statistics.avgAnnualizedReturn || 0, 2)}
            color="#4facfe"
            subtitle="理论年化回报率"
          />
        </div>
      )}

      {/* 套利机会表格 */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '28px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        marginBottom: '24px'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            <h2 style={{ 
              marginBottom: '4px', 
              fontSize: '22px',
              fontWeight: 600,
              color: '#333'
            }}>
              🔥 最新套利机会
            </h2>
            <p style={{ 
              fontSize: '14px', 
              color: '#999',
              margin: 0
            }}>
              共 {opportunities.length} 条记录
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleExportCSV}
              disabled={opportunities.length === 0}
              style={{
                background: '#f5f5f5',
                border: '1px solid #e0e0e0',
                color: '#666',
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: opportunities.length === 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                fontWeight: 500,
                opacity: opportunities.length === 0 ? 0.5 : 1,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (opportunities.length > 0) {
                  e.currentTarget.style.background = '#ebebeb';
                }
              }}
              onMouseLeave={(e) => {
                if (opportunities.length > 0) {
                  e.currentTarget.style.background = '#f5f5f5';
                }
              }}
            >
              <Download size={14} />
              导出 CSV
            </button>
            
            <button
              onClick={handleExportJSON}
              disabled={opportunities.length === 0}
              style={{
                background: '#f5f5f5',
                border: '1px solid #e0e0e0',
                color: '#666',
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: opportunities.length === 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                fontWeight: 500,
                opacity: opportunities.length === 0 ? 0.5 : 1,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (opportunities.length > 0) {
                  e.currentTarget.style.background = '#ebebeb';
                }
              }}
              onMouseLeave={(e) => {
                if (opportunities.length > 0) {
                  e.currentTarget.style.background = '#f5f5f5';
                }
              }}
            >
              <Download size={14} />
              导出 JSON
            </button>
          </div>
        </div>
        
        <OpportunityTable 
          opportunities={opportunities} 
          loading={oppLoading} 
        />
      </div>

      {/* 热门交易对 */}
      {statistics?.topSymbols && statistics.topSymbols.length > 0 && (
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '28px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}>
          <h2 style={{ 
            marginBottom: '20px', 
            fontSize: '22px',
            fontWeight: 600,
            color: '#333'
          }}>
            🏆 热门交易对（24小时）
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '16px'
          }}>
            {statistics.topSymbols.slice(0, 8).map((item: TopSymbol, index: number) => (
              <div 
                key={item.symbol} 
                style={{
                  padding: '18px',
                  background: '#f8f9fa',
                  borderRadius: '12px',
                  border: '1px solid #e9ecef',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '10px'
                }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    {index + 1}
                  </div>
                  <div style={{ 
                    fontSize: '17px', 
                    fontWeight: 'bold',
                    color: '#333'
                  }}>
                    {item.symbol}
                  </div>
                </div>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '6px' }}>
                  机会数: <strong>{item.count}</strong>
                </div>
                <div style={{ fontSize: '14px', color: '#667eea', fontWeight: 600 }}>
                  平均费差: {formatPercent(item.avgSpread, 4)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 页脚 */}
      <footer style={{
        marginTop: '40px',
        paddingTop: '24px',
        borderTop: '1px solid #e0e0e0',
        textAlign: 'center',
        color: '#999',
        fontSize: '14px'
      }}>
        <div style={{ marginBottom: '8px' }}>
          合约套利监控系统 v1.0.0
        </div>
        <div style={{ fontSize: '12px' }}>
          ⚠️ 仅供学习研究使用，投资有风险，决策需谨慎
        </div>
      </footer>
    </div>
  );
}

export default App;
