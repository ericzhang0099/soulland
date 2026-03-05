import { useRef, useEffect } from 'react';

export function Web3Mode() {
  const webviewRef = useRef<HTMLWebViewElement>(null);

  useEffect(() => {
    const webview = webviewRef.current;
    if (!webview) return;

    // 监听消息
    const handleMessage = (event: any) => {
      if (event.channel === 'wallet-request') {
        // 转发到桌面端钱包
        console.log('Wallet request from webview:', event.args);
      }
    };

    webview.addEventListener('ipc-message', handleMessage);

    return () => {
      webview.removeEventListener('ipc-message', handleMessage);
    };
  }, []);

  return (
    <div className="w-full h-full bg-slate-900">
      <webview
        ref={webviewRef}
        src="https://genloop.app"
        partition="persist:genloop"
        allowpopups
        className="w-full h-full"
        style={{ border: 'none' }}
      />
    </div>
  );
}

// 默认导出，用于 React.lazy
export default Web3Mode;
