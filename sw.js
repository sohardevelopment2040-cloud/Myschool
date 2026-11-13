// عامل الخدمة للمفكرة المدرسية — يعمل بدون إنترنت
// عند تعديل أي ملف ارفع رقم الإصدار حتى يتحدّث التطبيق عند المستخدمين
const CACHE = 'school-planner-v2';
const FILES = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './maskable-512.png',
  './apple-touch-icon.png',
  './favicon-32.png'
];

self.addEventListener('install', e => {
  // كل ملف على حدة: لو نقص ملف لا يفشل التثبيت كله
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(FILES.map(f => c.add(f).catch(() => {})))));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// الشبكة أولاً لصفحة التطبيق (لتصل التحديثات)، والذاكرة المؤقتة عند انقطاع الإنترنت
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put('./index.html', copy));
        return res;
      }).catch(() => caches.match('./index.html'))
    );
    return;
  }
  e.respondWith(caches.match(req).then(r => r || fetch(req)));
});

// فتح التطبيق عند الضغط على الإشعار
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) if ('focus' in c) return c.focus();
      return self.clients.openWindow('./index.html');
    })
  );
});
