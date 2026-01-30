import React, { useState } from 'react';
import { Copy, CheckCircle } from 'lucide-react';
import type { CodeGeneratorProps, CodeLanguage } from '../types';
import { generateCode, copyToClipboard } from '../utils/helpers';

/**
 * 代码生成器组件
 */
export const CodeGenerator: React.FC<CodeGeneratorProps> = ({ 
  endpoint, 
  params,
  baseUrl 
}) => {
  const [language, setLanguage] = useState<CodeLanguage>('curl');
  const [copied, setCopied] = useState(false);

  const code = generateCode(language, endpoint, params, baseUrl);

  const handleCopy = async () => {
    const success = await copyToClipboard(code);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const languages: Array<{ value: CodeLanguage; label: string }> = [
    { value: 'curl', label: 'cURL' },
    { value: 'javascript', label: 'JavaScript' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'python', label: 'Python' },
    { value: 'go', label: 'Go' }
  ];

  return (
    <div>
      {/* 语言选择器 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px'
      }}>
        <div style={{
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap'
        }}>
          {languages.map((lang) => (
            <button
              key={lang.value}
              onClick={() => {
                setLanguage(lang.value);
                setCopied(false);
              }}
              style={{
                background: language === lang.value ? '#667eea' : '#f5f5f5',
                color: language === lang.value ? 'white' : '#666',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (language !== lang.value) {
                  e.currentTarget.style.background = '#ebebeb';
                }
              }}
              onMouseLeave={(e) => {
                if (language !== lang.value) {
                  e.currentTarget.style.background = '#f5f5f5';
                }
              }}
            >
              {lang.label}
            </button>
          ))}
        </div>

        <button
          onClick={handleCopy}
          style={{
            background: copied ? '#e8f5e9' : 'white',
            border: `1px solid ${copied ? '#81c784' : '#ddd'}`,
            color: copied ? '#2e7d32' : '#666',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            fontWeight: 500,
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
              复制代码
            </>
          )}
        </button>
      </div>

      {/* 代码显示区 */}
      <div style={{
        background: '#282c34',
        color: '#abb2bf',
        padding: '16px',
        borderRadius: '8px',
        overflowX: 'auto',
        fontFamily: "'Courier New', monospace",
        fontSize: '13px',
        lineHeight: '1.6',
        maxHeight: '400px',
        overflowY: 'auto'
      }}>
        <pre style={{ margin: 0 }}>
          <code>{code}</code>
        </pre>
      </div>

      {/* 提示信息 */}
      <div style={{
        marginTop: '12px',
        fontSize: '12px',
        color: '#999',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}>
        <span>💡</span>
        <span>
          {language === 'curl' && '在终端中运行此命令'}
          {language === 'javascript' && '在浏览器控制台或Node.js中运行'}
          {language === 'typescript' && '使用TypeScript编译器运行'}
          {language === 'python' && '使用 requests 库（pip install requests）'}
          {language === 'go' && '保存为 .go 文件并使用 go run 运行'}
        </span>
      </div>
    </div>
  );
};

export default CodeGenerator;
