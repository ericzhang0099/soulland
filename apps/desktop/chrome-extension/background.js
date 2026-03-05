/**
 * Chrome Extension Background Script
 * 
 * 功能:
 * - 与 GenLoop Desktop 应用通信
 * - 管理标签页操作
 * - 执行脚本注入
 * - 截图功能
 */

// 连接状态
let isConnected = false;
let desktopPort = null;

// 与桌面应用通信的配置
const DESKTOP_WS_URL = 'ws://localhost:9876'; // GenLoop Desktop WebSocket 端口

// ==================== WebSocket 连接 ====================

function connectToDesktop() {
  try {
    const ws = new WebSocket(DESKTOP_WS_URL);
    
    ws.onopen = () => {
      console.log('[GenLoop Ext] Connected to Desktop');
      isConnected = true;
      desktopPort = ws;
      
      // 发送注册消息
      ws.send(JSON.stringify({
        type: 'register',
        client: 'chrome-extension',
        version: chrome.runtime.getManifest().version
      }));
    };
    
    ws.onmessage = async (event) => {
      try {
        const message = JSON.parse(event.data);
        await handleDesktopMessage(message, ws);
      } catch (error) {
        console.error('[GenLoop Ext] Failed to handle message:', error);
      }
    };
    
    ws.onclose = () => {
      console.log('[GenLoop Ext] Disconnected from Desktop');
      isConnected = false;
      desktopPort = null;
      
      // 尝试重连
      setTimeout(connectToDesktop, 5000);
    };
    
    ws.onerror = (error) => {
      console.error('[GenLoop Ext] WebSocket error:', error);
    };
  } catch (error) {
    console.error('[GenLoop Ext] Failed to connect:', error);
    setTimeout(connectToDesktop, 5000);
  }
}

// 启动连接
connectToDesktop();

// ==================== 消息处理 ====================

async function handleDesktopMessage(message: any, ws: WebSocket) {
  console.log('[GenLoop Ext] Received message:', message);
  
  const { action, requestId, params = {} } = message;
  
  try {
    let result;
    
    switch (action) {
      case 'openTab':
        result = await openTab(params.url);
        break;
        
      case 'closeTab':
        result = await closeTab(params.tabId);
        break;
        
      case 'getTabs':
        result = await getTabs();
        break;
        
      case 'navigate':
        result = await navigateTab(params.tabId, params.url);
        break;
        
      case 'executeScript':
        result = await executeScript(params.tabId, params.script);
        break;
        
      case 'screenshot':
        result = await captureScreenshot(params.tabId);
        break;
        
      case 'click':
        result = await clickElement(params.tabId, params.selector, params.x, params.y);
        break;
        
      case 'type':
        result = await typeText(params.tabId, params.selector, params.text);
        break;
        
      case 'getPageInfo':
        result = await getPageInfo(params.tabId);
        break;
        
      case 'startRecording':
        result = await startRecording(params.tabId);
        break;
        
      case 'stopRecording':
        result = await stopRecording(params.tabId);
        break;
        
      default:
        throw new Error(`Unknown action: ${action}`);
    }
    
    ws.send(JSON.stringify({
      type: 'response',
      requestId,
      success: true,
      result
    }));
  } catch (error: any) {
    ws.send(JSON.stringify({
      type: 'response',
      requestId,
      success: false,
      error: error.message
    }));
  }
}

// ==================== 标签页操作 ====================

async function openTab(url: string) {
  const tab = await chrome.tabs.create({ url, active: true });
  return { tabId: tab.id, url: tab.url };
}

async function closeTab(tabId: number) {
  await chrome.tabs.remove(tabId);
  return { closed: true, tabId };
}

async function getTabs() {
  const tabs = await chrome.tabs.query({});
  return tabs.map(tab => ({
    id: tab.id,
    url: tab.url,
    title: tab.title,
    active: tab.active,
    windowId: tab.windowId
  }));
}

async function navigateTab(tabId: number, url: string) {
  const tab = await chrome.tabs.update(tabId, { url });
  return { tabId: tab.id, url: tab.url };
}

// ==================== 脚本执行 ====================

async function executeScript(tabId: number, script: string) {
  const results = await chrome.scripting.executeScript({
    target: { tabId },
    func: (code) => {
      try {
        return eval(code);
      } catch (e) {
        return { error: (e as Error).message };
      }
    },
    args: [script]
  });
  return { results: results.map(r => r.result) };
}

async function clickElement(tabId: number, selector?: string, x?: number, y?: number) {
  const results = await chrome.scripting.executeScript({
    target: { tabId },
    func: (sel, clickX, clickY) => {
      try {
        if (sel) {
          const el = document.querySelector(sel);
          if (el) {
            (el as HTMLElement).click();
            return { clicked: sel };
          }
          return { error: 'Element not found' };
        } else if (clickX !== undefined && clickY !== undefined) {
          const el = document.elementFromPoint(clickX, clickY);
          if (el) {
            (el as HTMLElement).click();
            return { clicked: { x: clickX, y: clickY } };
          }
          return { error: 'No element at coordinates' };
        }
        return { error: 'No selector or coordinates provided' };
      } catch (e) {
        return { error: (e as Error).message };
      }
    },
    args: [selector, x, y]
  });
  return results[0]?.result;
}

async function typeText(tabId: number, selector: string, text: string) {
  const results = await chrome.scripting.executeScript({
    target: { tabId },
    func: (sel, txt) => {
      try {
        const el = document.querySelector(sel) as HTMLInputElement;
        if (!el) return { error: 'Element not found' };
        
        el.focus();
        el.value = txt;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        
        return { typed: txt, selector: sel };
      } catch (e) {
        return { error: (e as Error).message };
      }
    },
    args: [selector, text]
  });
  return results[0]?.result;
}

async function getPageInfo(tabId: number) {
  const results = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      return {
        url: location.href,
        title: document.title,
        readyState: document.readyState,
        scrollX: window.scrollX,
        scrollY: window.scrollY,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      };
    }
  });
  return results[0]?.result;
}

// ==================== 截图功能 ====================

async function captureScreenshot(tabId?: number) {
  // 获取当前窗口
  const windowId = tabId 
    ? (await chrome.tabs.get(tabId)).windowId 
    : chrome.windows.WINDOW_ID_CURRENT;
    
  const dataUrl = await chrome.tabs.captureVisibleTab(windowId, {
    format: 'png'
  });
  
  return { screenshot: dataUrl };
}

// ==================== 录制功能 ====================

let recordingTabs = new Map<number, boolean>();

async function startRecording(tabId: number) {
  recordingTabs.set(tabId, true);
  
  // 注入录制脚本
  await chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      if ((window as any).__genloopRecording) return;
      (window as any).__genloopRecording = true;
      
      // 生成选择器
      function generateSelector(el: Element): string {
        if (el.id) return `#${el.id}`;
        if (el.className) {
          const classes = el.className.split(' ').filter(c => c).join('.');
          if (classes) return `.${classes}`;
        }
        
        let selector = el.tagName.toLowerCase();
        const parent = el.parentElement;
        if (parent) {
          const siblings = Array.from(parent.children).filter(
            s => s.tagName === el.tagName
          );
          if (siblings.length > 1) {
            const index = siblings.indexOf(el) + 1;
            selector += `:nth-of-type(${index})`;
          }
        }
        return selector;
      }
      
      // 发送操作到 background
      function sendAction(action: any) {
        chrome.runtime.sendMessage({
          type: 'recordedAction',
          action
        });
      }
      
      // 监听点击
      document.addEventListener('click', (e) => {
        const target = e.target as Element;
        sendAction({
          type: 'click',
          selector: generateSelector(target),
          x: e.clientX,
          y: e.clientY,
          timestamp: Date.now()
        });
      }, true);
      
      // 监听输入
      document.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
          sendAction({
            type: 'type',
            selector: generateSelector(target),
            text: target.value,
            timestamp: Date.now()
          });
        }
      }, true);
      
      // 监听导航
      let lastUrl = location.href;
      new MutationObserver(() => {
        if (location.href !== lastUrl) {
          sendAction({
            type: 'navigate',
            url: location.href,
            timestamp: Date.now()
          });
          lastUrl = location.href;
        }
      }).observe(document, { subtree: true, childList: true });
    }
  });
  
  return { recording: true, tabId };
}

async function stopRecording(tabId: number) {
  recordingTabs.delete(tabId);
  
  // 停止录制脚本
  await chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      (window as any).__genloopRecording = false;
    }
  });
  
  return { recording: false, tabId };
}

// 监听来自 content script 的录制操作
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'recordedAction') {
    // 转发到 Desktop
    if (desktopPort && desktopPort.readyState === WebSocket.OPEN) {
      desktopPort.send(JSON.stringify({
        type: 'recordedAction',
        action: message.action,
        tabId: sender.tab?.id,
        url: sender.tab?.url
      }));
    }
    sendResponse({ received: true });
  }
  return true;
});

// ==================== 外部消息通信 ====================

// 允许外部应用（GenLoop Desktop）通过 chrome.runtime.sendMessage 通信
chrome.runtime.onMessageExternal.addListener(
  async (request, sender, sendResponse) => {
    console.log('[GenLoop Ext] External message:', request);
    
    try {
      let result;
      
      switch (request.action) {
        case 'ping':
          result = { pong: true, version: chrome.runtime.getManifest().version };
          break;
          
        case 'getStatus':
          result = { connected: isConnected, version: chrome.runtime.getManifest().version };
          break;
          
        case 'openTab':
          result = await openTab(request.url);
          break;
          
        case 'getTabs':
          result = await getTabs();
          break;
          
        case 'executeScript':
          result = await executeScript(request.tabId, request.script);
          break;
          
        case 'screenshot':
          result = await captureScreenshot(request.tabId);
          break;
          
        default:
          throw new Error(`Unknown action: ${request.action}`);
      }
      
      sendResponse({ success: true, result });
    } catch (error: any) {
      sendResponse({ success: false, error: error.message });
    }
    
    return true; // 异步响应
  }
);

// ==================== 安装/更新处理 ====================

chrome.runtime.onInstalled.addListener((details) => {
  console.log('[GenLoop Ext] Extension installed/updated:', details.reason);
  
  if (details.reason === 'install') {
    // 首次安装，打开设置页面
    chrome.tabs.create({
      url: 'https://genloop.app/desktop/setup'
    });
  }
});
