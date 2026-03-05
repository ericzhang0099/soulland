const CACHE_NAME = 'genloop-v1';
const STATIC_ASSETS = [
  '/',
  '/market',
  '/leaderboard',
  '/profile',
  '/training',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// 安装时缓存静态资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// 激活时清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// 拦截请求
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // API请求使用网络优先
  if (request.url.includes('/api/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // 静态资源使用缓存优先
  event.respondWith(cacheFirst(request));
});

// 缓存优先策略
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return new Response('Offline', { status: 503 });
  }
}

// 网络优先策略
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    return new Response('Offline', { status: 503 });
  }
}

// 后台同步
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-transactions') {
    event.waitUntil(syncTransactions());
  }
});

async function syncTransactions() {
  // 同步待处理的交易
  const db = await openDB('genloop-db', 1);
  const transactions = await db.getAll('pending-transactions');
  
  for (const tx of transactions) {
    try {
      await fetch('/api/market/purchase', {
        method: 'POST',
        body: JSON.stringify(tx),
      });
      await db.delete('pending-transactions', tx.id);
    } catch (error) {
      console.error('Sync failed:', error);
    }
  }
}

// 推送通知
self.addEventListener('push', (event) => {
  const data = event.data.json();
  
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      data: data.url,
      actions: [
        { action: 'open', title: '打开' },
        { action: 'close', title: '关闭' },
      ],
    })
  );
});

// 通知点击
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow(event.notification.data || '/')
    );
  }
});
