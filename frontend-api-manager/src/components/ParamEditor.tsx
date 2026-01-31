import React from 'react';
import { Select } from '@arco-design/web-react';
import type { ParamEditorProps } from '../types';
import { getParamDefaultValue, validateParam } from '../utils/helpers';

const EXCHANGE_OPTIONS = [
  { label: 'binance', value: 'binance' },
  { label: 'okx', value: 'okx' },
  { label: 'bybit', value: 'bybit' }
];

/**
 * 参数编辑器组件
 */
export const ParamEditor: React.FC<ParamEditorProps> = ({
  params,
  values,
  onChange,
  symbolOptions = [],
  symbolsLoading = false
}) => {
  if (params.length === 0) {
    return (
      <div style={{
        padding: '24px',
        textAlign: 'center',
        color: '#999',
        background: '#f8f9fa',
        borderRadius: '8px'
      }}>
        <div style={{ fontSize: '16px', marginBottom: '8px' }}>📝</div>
        <div>此端点无需参数</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: '16px' }}>
      {params.map((param) => {
        const value = values[param.name] ?? String(getParamDefaultValue(param) ?? '');
        const error = value ? validateParam(param, value) : null;
        const isSymbol = param.name === 'symbol';
        const isExchange = param.name === 'exchange';

        const useSelect = (isSymbol && symbolOptions.length > 0) || isExchange;
        const selectOptions = isExchange ? EXCHANGE_OPTIONS : symbolOptions;

        return (
          <div key={param.name}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: 500,
              color: '#333'
            }}>
              {param.name}
              {param.required && (
                <span style={{ color: '#f44336', marginLeft: '4px' }}>*</span>
              )}
              {param.optional && (
                <span style={{
                  color: '#999',
                  fontSize: '12px',
                  fontWeight: 'normal',
                  marginLeft: '6px'
                }}>
                  (可选)
                </span>
              )}
            </label>

            {useSelect ? (
              <Select
                placeholder={
                  param.default !== undefined
                    ? `默认: ${param.default}`
                    : `请选择${param.name}`
                }
                value={value || undefined}
                onChange={(v) => onChange(param.name, v ?? '')}
                options={selectOptions}
                showSearch={isSymbol}
                allowClear
                allowCreate={isSymbol}
                loading={isSymbol && symbolsLoading}
                style={{ width: '100%' }}
              />
            ) : (
              <input
                type={param.type === 'number' ? 'number' : 'text'}
                value={value}
                onChange={(e) => onChange(param.name, e.target.value)}
                placeholder={
                  param.default !== undefined
                    ? `默认: ${param.default}`
                    : `请输入${param.name}`
                }
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: error ? '1px solid #f44336' : '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => {
                  if (!error) e.currentTarget.style.borderColor = '#667eea';
                }}
                onBlur={(e) => {
                  if (!error) e.currentTarget.style.borderColor = '#ddd';
                }}
              />
            )}

            {param.description && (
              <div style={{ fontSize: '12px', color: '#666', marginTop: '6px' }}>
                {param.description}
              </div>
            )}

            {error && (
              <div style={{
                fontSize: '12px',
                color: '#f44336',
                marginTop: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <span>⚠️</span>
                {error}
              </div>
            )}

            {param.default !== undefined && !value && (
              <div style={{ fontSize: '12px', color: '#999', marginTop: '6px' }}>
                默认值:{' '}
                <code style={{
                  background: '#f5f5f5',
                  padding: '2px 6px',
                  borderRadius: '3px'
                }}>
                  {param.default}
                </code>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ParamEditor;
