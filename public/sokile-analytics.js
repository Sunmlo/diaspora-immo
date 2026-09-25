/* First-party consent UI. No Google request before an explicit opt-in. */
(function (w, d) {
  'use strict';
  if (w.sokileAnalytics) return;
  const ID = 'G-ES3GX7T680', KEY = 'sokile.analytics-consent.v1';
  const TTL = 180 * 86400000;
  const live = ['www.sokile.com', 'sokile.com'].includes(w.location.hostname);
  const pages = new Set(['accueil','biens','prestataires','guides','pro','compte','annonce','guide','programme','programmes','outils','docs','actu','about','cgu','confidentialite','mentions']);
  const events = new Set(['login','signup_request','listing_submit','listing_update','professional_submit','professional_update','document_request','contact_click']);
  let choice = null, started = false, current = null, currentKey = null, last = null, banner, returnFocus;
  function read() {
    try { const v = JSON.parse(w.localStorage.getItem(KEY)); return v && v.version === 1 && typeof v.accepted === 'boolean' && Number.isFinite(v.at) && v.at <= Date.now() && Date.now()-v.at < TTL ? v : null; } catch (_) { return null; }
  }
  function granted() { return choice && choice.accepted && Date.now()-choice.at < TTL; }
  function cleanCookies() {
    for (const entry of d.cookie.split(';')) {
      const name = entry.trim().split('=')[0];
      if (!/^_ga(?:_|$)/.test(name)) continue;
      for (const domain of ['', w.location.hostname, '.sokile.com', 'sokile.com']) {
        d.cookie = name + '=; Max-Age=0; path=/; SameSite=Lax' + (domain ? '; domain='+domain : '');
      }
    }
  }
  function stop() { w['ga-disable-'+ID] = true; cleanCookies(); last = null; }
  function campaign() {
    const result = {}, params = new URLSearchParams(w.location.search);
    for (const [key, field] of [['utm_source','campaign_source'],['utm_medium','campaign_medium'],['utm_campaign','campaign_name']]) {
      const value = params.get(key) || '';
      if (/^[a-z][a-z0-9_-]{0,63}$/i.test(value) && !/\d{7}/.test(value)) result[field] = value;
    }
    return result;
  }
  function context() {
    let ref = '';
    try { ref = new URL(d.referrer).origin; } catch (_) {}
    return {page_location:'https://www.sokile.com/'+(current === 'accueil' ? '' : current || ''), page_title:'Sokilé — '+(current || 'accueil'), page_referrer:ref};
  }
  function start() {
    if (!live || !granted()) return;
    w['ga-disable-'+ID] = false;
    if (started) return;
    started = true;
    w.dataLayer = w.dataLayer || [];
    w.gtag = function () { w.dataLayer.push(arguments); };
    w.gtag('consent','default',{analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
    w.gtag('js',new Date());
    w.gtag('config',ID,{send_page_view:false,allow_google_signals:false,allow_ad_personalization_signals:false,cookie_expires:33696000,cookie_update:false,...context(),...campaign()});
    const script = d.createElement('script');
    script.async = true; script.src = 'https://www.googletagmanager.com/gtag/js?id='+ID;
    script.id = 'sokile-google-tag'; d.head.appendChild(script);
  }
  function page(name, key) {
    current = pages.has(name) ? name : null;
    currentKey = current + ':' + (typeof key === 'string' || typeof key === 'number' ? String(key) : '');
    if (!current || !granted() || !live) return;
    start();
    if (last === currentKey) return;
    last = currentKey;
    w.gtag('event','page_view',context());
  }
  function event(name) {
    if (!events.has(name) || !granted() || !live) return;
    start(); w.gtag('event',name,context());
  }
  function choose(accepted) {
    const wasStarted = started;
    choice = {version:1,accepted,at:Date.now()};
    try { w.localStorage.setItem(KEY,JSON.stringify(choice)); } catch (_) {}
    if (banner) banner.hidden = true;
    if (returnFocus && returnFocus.isConnected) returnFocus.focus();
    if (!accepted) stop();
    else { start(); page(current); }
    // A withdrawal unloads any existing Google listeners, after disabling collection.
    if (!accepted && wasStarted) w.location.reload();
  }
  function preferences() {
    returnFocus = d.activeElement;
    if (banner) { banner.hidden = false; banner.querySelector('button').focus(); }
  }
  function mount() {
    const style = d.createElement('style');
    style.textContent = '#sokile-consent[hidden]{display:none}#sokile-consent{position:fixed;z-index:10000;bottom:0;left:0;right:0;background:#fffaf3;border-top:2px solid #c9a84c;padding:18px max(18px,calc((100vw - 1050px)/2));padding-bottom:max(18px,env(safe-area-inset-bottom));box-shadow:0 -4px 24px #0002;color:#1c1a17;font:15px/1.5 system-ui,sans-serif;max-height:70dvh;overflow:auto;box-sizing:border-box}#sokile-consent h2{font-size:18px;margin:0 0 6px}#sokile-consent p{margin:0 0 12px}#sokile-consent a{color:#8f442c;text-decoration:underline}#sokile-consent .actions{display:flex;gap:12px;flex-wrap:wrap}#sokile-consent button{font:600 15px system-ui,sans-serif;border:1px solid #1a3c2e;background:#1a3c2e;color:white;border-radius:8px;padding:12px 24px;cursor:pointer;min-height:44px;flex:1;max-width:240px}#sokile-consent button:focus-visible{outline:3px solid #b85c3a;outline-offset:3px}.sokile-cookie-link{background:none;border:0;text-decoration:underline;color:inherit;font:inherit;cursor:pointer;padding:8px 0}';
    d.head.appendChild(style);
    banner = d.createElement('section'); banner.id = 'sokile-consent'; banner.setAttribute('role','region'); banner.setAttribute('aria-label','Choix de mesure d’audience');
    banner.innerHTML = '<h2>Vos choix de confidentialité</h2><p>Avec votre accord, Google Analytics nous aide à comprendre les visites et les actions sur Sokilé. Vous pouvez refuser et utiliser le site normalement. Votre choix est conservé 6 mois et reste modifiable via « Gérer les cookies ». Le retrait de votre accord recharge la page. <a href="/confidentialites.html">En savoir plus</a>.</p><div class="actions"><button type="button" data-choice="no">Refuser</button><button type="button" data-choice="yes">Accepter</button></div>';
    banner.querySelector('[data-choice="no"]').addEventListener('click',()=>choose(false));
    banner.querySelector('[data-choice="yes"]').addEventListener('click',()=>choose(true));
    banner.hidden = Boolean(choice); d.body.appendChild(banner);
    d.addEventListener('click',e=>{const link=e.target.closest('[data-sokile-cookies]');if(link){e.preventDefault();preferences();}const contact=e.target.closest('a[href]');if(contact && /^(mailto:|tel:|https:\/\/wa\.me\/)/.test(contact.getAttribute('href')||''))event('contact_click');});
    const staticPages = {'/about.html':'about','/cgu.html':'cgu','/confidentialites.html':'confidentialite','/mentions%20legales.html':'mentions'};
    if (staticPages[w.location.pathname]) page(staticPages[w.location.pathname]);
  }
  choice = read(); if (!granted()) stop();
  w.setInterval(() => { if (choice && Date.now()-choice.at >= TTL) { const wasStarted = started; choice = null; stop(); if (banner) banner.hidden = false; if (wasStarted) w.location.reload(); } }, 60000);
  w.sokileAnalytics = {page,event,preferences};
  w.addEventListener('storage', e=>{if(e.key!==KEY)return;const wasStarted=started;choice=read();if(!granted()){stop();if(wasStarted)w.location.reload();}else{start();page(current);}if(banner)banner.hidden=Boolean(choice);});
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded',mount,{once:true}); else mount();
})(window, document);
