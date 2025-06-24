import '@ant-design/v5-patch-for-react-19';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { ConfigProvider, theme } from 'antd';
import App from './App.tsx';
import 'antd/dist/reset.css';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#4384de',
          colorBgBase: '#2d2d2f',
          colorTextBase: 'rgba(255,255,255,0.7)',
          borderRadius: 4,
        },
      }}
    >
      <App />
    </ConfigProvider>
  </React.StrictMode>,
)
