import type { ApiEndpoint, ApiParameter, CodeLanguage } from '../types';

/**
 * 构建完整的API URL
 */
export function buildUrl(
  baseUrl: string,
  path: string,
  params: Record<string, string>
): string {
  const url = new URL(path, baseUrl);
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== '' && value !== undefined) {
      url.searchParams.set(key, value);
    }
  });
  
  return url.toString();
}

/**
 * 格式化JSON
 */
export function formatJson(obj: any, indent: number = 2): string {
  try {
    return JSON.stringify(obj, null, indent);
  } catch {
    return String(obj);
  }
}

/**
 * 复制到剪贴板
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // 降级方案
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  }
}

/**
 * 生成cURL命令
 */
export function generateCurl(url: string, method: string = 'GET'): string {
  return `curl -X ${method} "${url}"`;
}

/**
 * 生成JavaScript代码
 */
export function generateJavaScript(url: string, method: string = 'GET'): string {
  return `// 使用 fetch API
const response = await fetch('${url}', {
  method: '${method}'
});
const data = await response.json();
console.log(data);`;
}

/**
 * 生成TypeScript代码
 */
export function generateTypeScript(
  endpoint: ApiEndpoint,
  params: Record<string, string>,
  baseUrl: string
): string {
  const url = buildUrl(baseUrl, endpoint.path, params);
  
  return `// TypeScript with type safety
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

async function ${toCamelCase(endpoint.name)}(): Promise<ApiResponse> {
  const response = await fetch('${url}', {
    method: '${endpoint.method}'
  });
  
  if (!response.ok) {
    throw new Error(\`HTTP error! status: \${response.status}\`);
  }
  
  const data: ApiResponse = await response.json();
  return data;
}

// 使用示例
try {
  const result = await ${toCamelCase(endpoint.name)}();
  console.log(result.data);
} catch (error) {
  console.error('请求失败:', error);
}`;
}

/**
 * 生成Python代码
 */
export function generatePython(url: string, method: string = 'GET'): string {
  return `import requests

# 发送请求
response = requests.${method.toLowerCase()}('${url}')

# 检查响应
if response.status_code == 200:
    data = response.json()
    print(data)
else:
    print(f"请求失败: {response.status_code}")`;
}

/**
 * 生成Go代码
 */
export function generateGo(url: string, method: string = 'GET'): string {
  return `package main

import (
    "encoding/json"
    "fmt"
    "io"
    "net/http"
)

func main() {
    // 创建请求
    req, err := http.NewRequest("${method}", "${url}", nil)
    if err != nil {
        panic(err)
    }

    // 发送请求
    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        panic(err)
    }
    defer resp.Body.Close()

    // 读取响应
    body, err := io.ReadAll(resp.Body)
    if err != nil {
        panic(err)
    }

    // 解析JSON
    var result map[string]interface{}
    json.Unmarshal(body, &result)
    
    fmt.Printf("%+v\\n", result)
}`;
}

/**
 * 生成代码片段
 */
export function generateCode(
  language: CodeLanguage,
  endpoint: ApiEndpoint,
  params: Record<string, string>,
  baseUrl: string
): string {
  const url = buildUrl(baseUrl, endpoint.path, params);
  const method = endpoint.method;

  switch (language) {
    case 'curl':
      return generateCurl(url, method);
    case 'javascript':
      return generateJavaScript(url, method);
    case 'typescript':
      return generateTypeScript(endpoint, params, baseUrl);
    case 'python':
      return generatePython(url, method);
    case 'go':
      return generateGo(url, method);
    default:
      return generateCurl(url, method);
  }
}

/**
 * 转换为驼峰命名
 */
function toCamelCase(str: string): string {
  return str
    .replace(/[^\w\s]/g, '')
    .replace(/\s(.)/g, (_m, group1) => group1.toUpperCase())
    .replace(/\s/g, '')
    .replace(/^(.)/, (_m, group1) => group1.toLowerCase());
}

/**
 * 获取参数默认值
 */
export function getParamDefaultValue(param: ApiParameter): string {
  if (param.default !== undefined) {
    return String(param.default);
  }
  return '';
}

/**
 * 验证参数值
 */
export function validateParam(param: ApiParameter, value: string): string | null {
  if (param.required && !value) {
    return `${param.name} 是必需参数`;
  }

  if (value && param.type === 'number' && isNaN(Number(value))) {
    return `${param.name} 必须是数字`;
  }

  return null;
}

/**
 * 验证所有参数
 */
export function validateAllParams(
  params: ApiParameter[],
  values: Record<string, string>
): string[] {
  const errors: string[] = [];

  params.forEach(param => {
    const error = validateParam(param, values[param.name] || '');
    if (error) {
      errors.push(error);
    }
  });

  return errors;
}

/**
 * 格式化持续时间
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * 格式化时间戳
 */
export function formatTimestamp(date: Date): string {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(date);
}

/**
 * 获取HTTP状态描述
 */
export function getStatusText(status: number): string {
  const statusTexts: Record<number, string> = {
    200: 'OK',
    201: 'Created',
    204: 'No Content',
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable'
  };

  return statusTexts[status] || 'Unknown';
}

/**
 * 生成唯一ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 下载为文件
 */
export function downloadAsFile(content: string, filename: string, type: string = 'text/plain'): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
