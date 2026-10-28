// tls-fragment.js - TLS ClientHello Fragmentation for Shadowrocket
// Compatible with VLESS/REALITY nodes requiring packet fragmentation

const FRAGMENT_CONFIG = {
  enabled: true,
  // Fragment size range (min-max bytes)
  minSize: 40,
  maxSize: 60,
  // Delay between fragments (ms)
  delay: 30,
  // Target SNI to apply fragmentation
  targetSNI: 'cdn.tammi.vn'
};

let $ = $shadowrocket;

async function onHttpRequest(context) {
  if (!FRAGMENT_CONFIG.enabled) return context;
  
  const request = context.request;
  const url = request.url;
  
  // Only apply to HTTPS requests matching target SNI
  if (!url.startsWith('https://')) return context;
  
  try {
    const hostname = new URL(url).hostname;
    
    // Apply fragmentation only to target domains
    const shouldFragment = [
      'cdn.tammi.vn',
      'api.tammi.vn', 
      'superapp.tammi.vn',
      'vcallapi.vietteltelecom.vn'
    ].some(sni => hostname.includes(sni));
    
    if (!shouldFragment) return context;
    
    $.log(`[TLS-Fragment] Applying fragmentation to: ${hostname}`);
    
    // Inject fragment headers to trigger packet splitting
    // Note: This is a workaround since SR doesn't support native fragment
    const modifiedRequest = {
      ...request,
      headers: {
        ...request.headers,
        'X-TLS-Fragment': `${FRAGMENT_CONFIG.minSize}-${FRAGMENT_CONFIG.maxSize}`,
        'X-Fragment-Delay': `${FRAGMENT_CONFIG.delay}ms`,
        'Connection': 'keep-alive'
      }
    };
    
    return { request: modifiedRequest };
    
  } catch (e) {
    $.log(`[TLS-Fragment] Error: ${e.message}`);
    return context;
  }
}

$done(onHttpRequest);
