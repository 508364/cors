// ====== 【核心安全配置】仅在此处修改允许的域名 ======
const ALLOWED_DOMAIN = 'cors.Your_domain.com'; // ← 需要修改成你的域名

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const host = request.headers.get('Host')?.toLowerCase() || '';
  
  // ====== 【严格域名验证】 ======
  if (host !== ALLOWED_DOMAIN) {
    return new Response(
      `ERROR 403: DOMAIN MISMATCH\n` +
      `───────────────────────────\n` +
      `This service is ONLY accessible via:\n` +
      `https://${ALLOWED_DOMAIN}\n\n` +
      `Your request attempted to access via:\n` +
      `${host || 'UNKNOWN DOMAIN'}\n\n` +
      `Security policy violation detected.`,
      {
        status: 403,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'X-Security-Policy': `Allowed domain: ${ALLOWED_DOMAIN}`
        }
      }
    );
  }

  // ====== 【根路径处理】 ======
  if (url.pathname === '/' && !url.searchParams.get('url')) {
    // 动态生成安全域名变量
    const DOMAIN_ORIGIN = `https://${ALLOWED_DOMAIN}`;
    
    // 注入当前域名到HTML模板
    const htmlContent = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CORS代理服务 | ${ALLOWED_DOMAIN}</title>
  <style>
    body { 
      max-width: 800px; 
      margin: 2em auto; 
      padding: 0 1em; 
      line-height: 1.6; 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      color: #333;
    }
    .input-group { 
      margin: 1.5em 0; 
      position: relative;
    }
    input { 
      width: 70%; 
      padding: 0.7em; 
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 16px;
    }
    button { 
      padding: 0.7em 1.2em; 
      background: #0066cc; 
      color: white; 
      border: none; 
      border-radius: 4px;
      cursor: pointer;
      font-size: 16px;
      transition: background 0.2s;
    }
    button:hover { background: #0055b3; }
    select {
      padding: 0.7em;
      margin-top: 0.5em;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 16px;
      width: 70%;
    }
    .note { 
      background: #f8f9fa; 
      padding: 1.2em; 
      border-radius: 4px; 
      margin-top: 2em;
      border-left: 4px solid #0066cc;
    }
    .alert {
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      background: #ff4444;
      color: white;
      border-radius: 4px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.15);
      transform: translateX(120%);
      transition: transform 0.3s ease-out;
      z-index: 1000;
      font-size: 14px;
    }
    .alert.show {
      transform: translateX(0);
    }
    .alert-success {
      background: #4caf50;
    }
    .domain-badge {
      background: #e0f7fa;
      padding: 3px 8px;
      border-radius: 4px;
      font-family: monospace;
      color: #0066cc;
    }
  </style>
</head>
<body>
  <h1>CORS代理服务 <span class="domain-badge">${ALLOWED_DOMAIN}</span></h1>
  <p>本服务用于解决跨域资源加载问题，使用方式：</p>
  
  <div class="input-group">
    <input type="text" id="targetUrl" placeholder="输入目标URL（例如：https://example.com）">
    <select id="modeSelect">
      <option value="text">使用源码模式 (text=true)</option>
      <option value="normal">普通代理模式</option>
    </select>
    <button onclick="goProxy()">代理访问</button>
  </div>
  
  <div id="customAlert" class="alert">请输入有效的URL地址</div>
  
  <script>
    function showCustomAlert(message, isSuccess = false) {
      const alertBox = document.getElementById('customAlert');
      alertBox.textContent = message;
      alertBox.className = 'alert ' + (isSuccess ? 'alert-success' : '');
      
      // 重置动画
      alertBox.classList.remove('show');
      void alertBox.offsetWidth; // 强制重排
      alertBox.classList.add('show');
      
      // 3秒后自动关闭
      setTimeout(() => {
        alertBox.classList.remove('show');
      }, 3000);
    }

    function goProxy() {
      const urlInput = document.getElementById('targetUrl').value.trim();
      const mode = document.getElementById('modeSelect').value;
      
      if (!urlInput) {
        showCustomAlert('请输入目标URL地址');
        return;
      }
      
      try {
        // 验证URL格式
        new URL(urlInput);
        
        // 安全检查：禁止代理自身域名
        if (new URL(urlInput).hostname === '${ALLOWED_DOMAIN}') {
          showCustomAlert('禁止代理本服务自身域名');
          return;
        }
        
        // 构建代理URL
        const proxyUrl = new URL('${DOMAIN_ORIGIN}');
        proxyUrl.searchParams.set('url', urlInput);
        if (mode === 'text') {
          proxyUrl.searchParams.set('text', 'true');
        }
        
        window.location.href = proxyUrl.toString();
      } catch (e) {
        showCustomAlert('无效的URL格式（请包含http/https协议）');
      }
    }
    
    // 默认选中源码模式
    document.getElementById('modeSelect').value = 'text';
  </script>

  <div class="note">
    <h3>使用说明</h3>
    <p><strong>基础用法</strong>：<code>${DOMAIN_ORIGIN}/?url=目标地址</code></p>
    <p><strong>获取源码模式</strong>：<code>${DOMAIN_ORIGIN}/?url=目标地址&text=true</code></p>
    <p>• 会自动重写HTML中的相对路径资源（CSS/JS/图片等）</p>
    <p>• 链接到非HTML文件（如PDF）时仅转换为绝对路径，不添加代理</p>
    <p>• <strong class="domain-badge">禁止代理本服务自身域名</strong></p>
    
    <h3 style="margin-top: 1.5em">源码模式说明</h3>
    <ul>
      <li><strong>源码模式</strong>：返回原始HTML源码（适合开发者调试）</li>
      <li><strong>普通模式</strong>：返回自动重写资源路径的HTML（适合直接浏览）</li>
    </ul>
  </div>
</body>
</html>`.replace(/\${DOMAIN_ORIGIN}/g, DOMAIN_ORIGIN); // 安全替换动态变量

    return new Response(htmlContent, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }

  // ====== 【核心代理逻辑】 ======
  const targetUrl = url.searchParams.get('url');
  if (!targetUrl) {
    return new Response('Error: Missing "url" parameter', { status: 400 });
  }

  try {
    // 安全检查：禁止代理自身域名
    if (new URL(targetUrl).hostname === ALLOWED_DOMAIN) {
      return new Response('Security Error: Cannot proxy own domain', { status: 403 });
    }

    const proxyRequest = new Request(targetUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body
    });

    const response = await fetch(proxyRequest);
    const newHeaders = new Headers(response.headers);
    
    // 添加CORS头
    newHeaders.set('Access-Control-Allow-Origin', '*');
    newHeaders.set('Access-Control-Allow-Methods', '*');
    newHeaders.set('Access-Control-Allow-Headers', '*');
    
    // 源码模式处理
    if (url.searchParams.get('text') === 'true') {
      const text = await response.text();
      return new Response(text, { 
        status: response.status, 
        headers: newHeaders 
      });
    }

    return new Response(response.body, {
      status: response.status,
      headers: newHeaders
    });
  } catch (e) {
    return new Response(`Proxy Error: ${e.message}`, { status: 502 });
  }
}
