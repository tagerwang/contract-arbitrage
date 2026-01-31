import { defineConfig, presetUno, presetAttributify } from 'unocss'

export default defineConfig({
  presets: [
    presetUno(), // 包含 Tailwind / Windi CSS 的大部分工具类
    presetAttributify(), // 支持属性模式
  ],
  // 自定义快捷方式
  shortcuts: {
    'btn': 'px-4 py-2 rounded-lg transition-colors cursor-pointer',
    'btn-primary': 'btn bg-blue-600 hover:bg-blue-700 text-white',
    'btn-secondary': 'btn bg-slate-700 hover:bg-slate-600 text-white',
  },
  // 主题扩展
  theme: {
    colors: {
      // 可以在这里添加自定义颜色
    }
  }
})
