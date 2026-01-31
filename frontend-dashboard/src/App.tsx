import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import APIExplorer from './pages/APIExplorer';
import './App.css';

/**
 * 应用主入口 - 路由配置（使用 Hash 模式避免刷新 404）
 */
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/api-explorer" element={<APIExplorer />} />
      </Routes>
    </Router>
  );
}

export default App;
