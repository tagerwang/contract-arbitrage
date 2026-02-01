import React from 'react';
import type { OpportunityTableProps } from '../types';
import { formatPercent, formatRelativeTime, getConfidenceColor } from '../utils/format';

/**
 * 机会表格组件
 */
export const OpportunityTable: React.FC<OpportunityTableProps> = ({ 
  opportunities,
  loading = false 
}) => {
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: '#666' }}>
        <div className="spinner" style={{
          width: '48px',
          height: '48px',
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #667eea',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 16px'
        }} />
        <div>加载中...</div>
      </div>
    );
  }

  if (opportunities.length === 0) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '60px', 
        color: '#999',
        background: '#f8f9fa',
        borderRadius: '8px'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
        <div style={{ fontSize: '16px' }}>暂无套利机会</div>
        <div style={{ fontSize: '14px', marginTop: '8px', color: '#bbb' }}>
          系统会自动监控并在发现机会时显示
        </div>
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ 
        width: '100%', 
        borderCollapse: 'collapse',
        fontSize: '14px'
      }}>
        <thead>
          <tr style={{ 
            borderBottom: '2px solid #f0f0f0',
            background: '#fafafa'
          }}>
            <th style={tableHeaderStyle}>交易对</th>
            <th style={tableHeaderStyle}>做多交易所</th>
            <th style={tableHeaderStyle}>做空交易所</th>
            <th style={tableHeaderStyle}>费率差</th>
            <th style={tableHeaderStyle}>年化收益</th>
            <th style={tableHeaderStyle}>价格差</th>
            <th style={tableHeaderStyle}>置信度</th>
            <th style={tableHeaderStyle}>发现时间</th>
          </tr>
        </thead>
        <tbody>
          {opportunities.map((opp, index) => (
            <tr 
              key={opp.id || index} 
              style={{
                borderBottom: '1px solid #f5f5f5',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f8f9fa';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'white';
              }}
            >
              <td style={tableCellStyle}>
                <strong style={{ fontSize: '15px' }}>{opp.symbol}</strong>
              </td>
              <td style={tableCellStyle}>
                <ExchangeBadge 
                  exchange={opp.long_exchange} 
                  type="long"
                  rate={opp.long_rate}
                />
              </td>
              <td style={tableCellStyle}>
                <ExchangeBadge 
                  exchange={opp.short_exchange} 
                  type="short"
                  rate={opp.short_rate}
                />
              </td>
              <td style={tableCellStyle}>
                <strong style={{ 
                  color: '#667eea',
                  fontSize: '15px'
                }}>
                  {formatPercent(opp.spread_rate, 4)}
                </strong>
              </td>
              <td style={tableCellStyle}>
                <strong style={{ 
                  color: opp.annualized_return > 100 ? '#00c853' : '#ff9800',
                  fontSize: '15px'
                }}>
                  {formatPercent(opp.annualized_return, 2)}
                </strong>
              </td>
              <td style={tableCellStyle}>
                <span style={{ color: '#666' }}>
                  {formatPercent(opp.price_spread_percent, 3)}
                </span>
              </td>
              <td style={tableCellStyle}>
                <ConfidenceBar confidence={opp.confidence} />
              </td>
              <td style={tableCellStyle}>
                <span style={{ color: '#999', fontSize: '13px' }}>
                  {formatRelativeTime(opp.detected_at)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/**
 * 交易所徽章组件
 */
const ExchangeBadge: React.FC<{
  exchange: string;
  type: 'long' | 'short';
  rate: number;
}> = ({ exchange, type, rate }) => {
  const bgColor = type === 'long' ? '#e3f2fd' : '#fce4ec';
  const textColor = type === 'long' ? '#1976d2' : '#c2185b';
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <span style={{
        background: bgColor,
        color: textColor,
        padding: '4px 10px',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: 600,
        display: 'inline-block',
        textTransform: 'uppercase'
      }}>
        {exchange}
      </span>
      <span style={{ fontSize: '12px', color: '#999' }}>
        {formatPercent(rate, 4)}
      </span>
    </div>
  );
};

/**
 * 置信度进度条组件
 */
const ConfidenceBar: React.FC<{ confidence: number }> = ({ confidence }) => {
  const percentage = confidence * 100;
  const color = getConfidenceColor(confidence);
  
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{
        width: '80px',
        height: '8px',
        background: '#f0f0f0',
        borderRadius: '4px',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${percentage}%`,
          height: '100%',
          background: color,
          transition: 'width 0.3s ease',
          borderRadius: '4px'
        }} />
      </div>
      <span style={{ 
        fontSize: '12px', 
        color: color,
        fontWeight: 600,
        minWidth: '35px'
      }}>
        {percentage.toFixed(0)}%
      </span>
    </div>
  );
};

// 样式常量
const tableHeaderStyle: React.CSSProperties = {
  padding: '14px 12px',
  textAlign: 'left',
  color: '#666',
  fontSize: '13px',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.5px'
};

const tableCellStyle: React.CSSProperties = {
  padding: '14px 12px'
};

export default OpportunityTable;
