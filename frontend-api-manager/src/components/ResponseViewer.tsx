import React, { useState } from 'react';
import { Copy, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import type { ResponseViewerProps } from '../types';
import { formatJson, copyToClipboard, formatDuration, getStatusText } from '../utils/helpers';

/**
 * 响应查看器组件
 */
export const ResponseViewer: React.FC<ResponseViewerProps> = ({ 
  response, 
  loading, 
  error,
  duration 
}) => {
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<'formatted' | 'raw'>('formatted');

  const handleCopy = async () => {
    if (!response) return;
    
    const text = formatJson(response, 2);
    const success = await copyToClipboard(text);
    
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // 加载状态
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px',
        color: '#666'
      }}>
        <div className="spinner" style={{
          width: '48px',
          height: '48px',
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #667eea',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '16px'
        }} />
        <div style={{ fontSize: '15px' }}>发送请求中...</div>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div style={{
        padding: '24px',
        background: '#fff3e0',
        border: '1px solid #ffb74d',
        borderRadius: '12px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px'
        }}>
          <AlertCircle size={24} color="#f57c00" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ flex: 1 }}>
            <div style={{ 
              fontWeight: 600, 
              color: '#e65100', 
              marginBottom: '8px',
              fontSize: '15px'
            }}>
              请求失败
            </div>
            <div style={{ fontSize: '14px', color: '#666', wordBreak: 'break-word' }}>
              {error}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 无响应
  if (!response) {
    return (
      <div style={{
        padding: '60px',
        textAlign: 'center',
        color: '#999',
        background: '#f8f9fa',
        borderRadius: '12px'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚀</div>
        <div style={{ fontSize: '16px', marginBottom: '8px' }}>
          准备就绪
        </div>
        <div style={{ fontSize: '14px' }}>
          点击"发送请求"按钮查看响应
        </div>
      </div>
    );
  }

  // 成功响应
  const isSuccess = response.success;
  const formattedJson = formatJson(response, 2);

  return (
    <div>
      {/* 响应头信息 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
        padding: '12px 16px',
        background: isSuccess ? '#e8f5e9' : '#ffebee',
        borderRadius: '8px',
        border: `1px solid ${isSuccess ? '#81c784' : '#e57373'}`
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isSuccess ? (
            <CheckCircle size={20} color="#2e7d32" />
          ) : (
            <AlertCircle size={20} color="#c62828" />
          )}
          <div>
            <div style={{ 
              fontSize: '14px', 
              fontWeight: 600,
              color: isSuccess ? '#2e7d32' : '#c62828'
            }}>
              {isSuccess ? '请求成功' : '请求失败'}
            </div>
            {duration > 0 && (
              <div style={{ 
                fontSize: '12px', 
                color: '#666',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                marginTop: '2px'
              }}>
                <Clock size={12} />
                耗时: {formatDuration(duration)}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={handleCopy}
          style={{
            background: 'white',
            border: '1px solid #ddd',
            padding: '6px 12px',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            fontWeight: 500,
            color: copied ? '#2e7d32' : '#666',
            transition: 'all 0.2s'
          }}
        >
          {copied ? (
            <>
              <CheckCircle size={14} />
              已复制
            </>
          ) : (
            <>
              <Copy size={14} />
              复制
            </>
          )}
        </button>
      </div>

      {/* 标签页 */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '12px',
        borderBottom: '1px solid #e0e0e0'
      }}>
        <button
          onClick={() => setTab('formatted')}
          style={{
            background: 'none',
            border: 'none',
            padding: '10px 16px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
            color: tab === 'formatted' ? '#667eea' : '#666',
            borderBottom: tab === 'formatted' ? '2px solid #667eea' : '2px solid transparent',
            transition: 'all 0.2s'
          }}
        >
          格式化
        </button>
        <button
          onClick={() => setTab('raw')}
          style={{
            background: 'none',
            border: 'none',
            padding: '10px 16px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
            color: tab === 'raw' ? '#667eea' : '#666',
            borderBottom: tab === 'raw' ? '2px solid #667eea' : '2px solid transparent',
            transition: 'all 0.2s'
          }}
        >
          原始数据
        </button>
      </div>

      {/* 响应内容 */}
      <div style={{
        background: '#282c34',
        color: '#abb2bf',
        padding: '16px',
        borderRadius: '8px',
        overflowX: 'auto',
        fontFamily: "'Courier New', monospace",
        fontSize: '13px',
        lineHeight: '1.6',
        maxHeight: '500px',
        overflowY: 'auto'
      }}>
        {tab === 'formatted' ? (
          <pre style={{ margin: 0 }}>
            <code>{formattedJson}</code>
          </pre>
        ) : (
          <div style={{ wordBreak: 'break-all' }}>
            {JSON.stringify(response)}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResponseViewer;
