import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { useAppStore } from './stores/appStore';

// 初始化应用状态
const initializeApp = () => {
  const { initialize } = useAppStore.getState();
  initialize();
};

// 在渲染前初始化
initializeApp();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
