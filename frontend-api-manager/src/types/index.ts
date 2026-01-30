// ==================== API端点类型 ====================

/**
 * HTTP方法
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

/**
 * 参数类型
 */
export type ParamType = 'string' | 'number' | 'boolean';

/**
 * API参数定义
 */
export interface ApiParameter {
  name: string;
  type: ParamType;
  required?: boolean;
  optional?: boolean;
  default?: string | number;
  description?: string;
}

/**
 * API端点定义
 */
export interface ApiEndpoint {
  id: string;
  name: string;
  method: HttpMethod;
  path: string;
  params: ApiParameter[];
  description: string;
  category: string;
  example?: string;
}

/**
 * API响应
 */
export interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  timestamp: number;
}

// ==================== 请求/响应历史 ====================

/**
 * 请求历史记录
 */
export interface RequestHistory {
  id: string;
  endpoint: ApiEndpoint;
  params: Record<string, string>;
  url: string;
  method: HttpMethod;
  timestamp: Date;
  response?: ApiResponse;
  error?: string;
  duration: number;
  status: number;
}

// ==================== 代码生成 ====================

/**
 * 代码语言
 */
export type CodeLanguage = 
  | 'curl' 
  | 'javascript' 
  | 'typescript'
  | 'python' 
  | 'go'
  | 'java';

/**
 * 代码片段
 */
export interface CodeSnippet {
  language: CodeLanguage;
  code: string;
  label: string;
}

// ==================== UI状态 ====================

/**
 * 标签页
 */
export type TabType = 'test' | 'history' | 'docs' | 'settings';

/**
 * 主题
 */
export type Theme = 'light' | 'dark';

/**
 * 应用设置
 */
export interface AppSettings {
  theme: Theme;
  apiBaseUrl: string;
  autoFormat: boolean;
  saveHistory: boolean;
  maxHistoryItems: number;
}

// ==================== 组件Props ====================

/**
 * 端点列表Props
 */
export interface EndpointListProps {
  endpoints: ApiEndpoint[];
  selectedEndpoint: ApiEndpoint | null;
  onSelect: (endpoint: ApiEndpoint) => void;
  category?: string;
}

/**
 * 参数编辑器Props
 */
export interface ParamEditorProps {
  params: ApiParameter[];
  values: Record<string, string>;
  onChange: (name: string, value: string) => void;
}

/**
 * 响应查看器Props
 */
export interface ResponseViewerProps {
  response: ApiResponse | null;
  loading: boolean;
  error: string | null;
  duration: number;
}

/**
 * 代码生成器Props
 */
export interface CodeGeneratorProps {
  endpoint: ApiEndpoint;
  params: Record<string, string>;
  baseUrl: string;
}

/**
 * 历史记录Props
 */
export interface HistoryListProps {
  history: RequestHistory[];
  onReplay: (record: RequestHistory) => void;
  onClear: () => void;
}

// ==================== 工具类型 ====================

/**
 * 深度只读
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

/**
 * 可选键
 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
