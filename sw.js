const CACHE_NAME = 'image-tool-v2';
// این لیست شامل تمام فایل‌های ضروری برای اجرای آفلاین برنامه است
const urlsToCache = [
  '/',
  '/index.html',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;600;700&display=swap'
  // آدرس فایل‌های آیکون را اضافه نکنید، manifest.json خودش آن‌ها را مدیریت می‌کند
];

// مرحله نصب: ذخیره کردن فایل‌های اصلی در حافظه پنهان (Cache)
self.addEventListener('install', event => {
  self.skipWaiting(); // فعال‌سازی فوری سرویس ورکر جدید
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache opened');
        return cache.addAll(urlsToCache);
      })
  );
});

// مرحله فعال‌سازی: پاک کردن حافظه‌های پنهان قدیمی
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => {
          // اگر نام cache قدیمی با نام جدید متفاوت بود، آن را حذف کن
          return cacheName !== CACHE_NAME;
        }).map(cacheName => {
          return caches.delete(cacheName);
        })
      );
    })
  );
});


// مرحله Fetch: پاسخ به درخواست‌ها از طریق Cache یا شبکه
self.addEventListener('fetch', event => {
  // فقط درخواست‌های GET را مدیریت کن
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      // ابتدا تلاش برای یافتن پاسخ در Cache
      const cachedResponse = await cache.match(event.request);
      
      // سپس درخواست به شبکه (این کار در پس‌زمینه انجام می‌شود)
      const fetchedResponse = fetch(event.request).then((networkResponse) => {
        // اگر پاسخ از شبکه معتبر بود، آن را در Cache ذخیره کن
        if (networkResponse && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
        }
        return networkResponse;
      }).catch(() => {
        // اگر شبکه قطع بود و فایل در Cache هم نبود، خطا برگردان
        // می‌توانید یک صفحه آفلاین پیش‌فرض اینجا برگردانید
      });

      // اگر فایل در Cache بود، آن را برگردان، در غیر این صورت منتظر پاسخ شبکه بمان
      return cachedResponse || fetchedResponse;
    })
  );
});
