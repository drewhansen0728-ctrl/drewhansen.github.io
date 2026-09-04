// Dashboard aesthetic v3: reliable UT-inspired visual cards, no captions.
(function(){
  const dashboard=document.getElementById('dashboard');
  if(!dashboard)return;
  document.querySelectorAll('.ut-gallery').forEach(el=>el.remove());
  const style=document.createElement('style');
  style.textContent=`
    .ut-aesthetic{display:grid;grid-template-columns:1.5fr .75fr .75fr;gap:14px;margin-bottom:20px}
    .ut-aesthetic-card{height:220px;border-radius:20px;overflow:hidden;position:relative;box-shadow:var(--shadow);background:#333f48}
    .ut-aesthetic-card img{width:100%;height:100%;object-fit:cover;display:block}
    .ut-aesthetic-logo{display:grid;place-items:center;background:linear-gradient(145deg,#bf5700,#8f4100)}
    .ut-aesthetic-logo svg{width:72%;max-width:230px;filter:drop-shadow(0 8px 18px rgba(0,0,0,.18))}
    .ut-aesthetic-card:after{content:'';position:absolute;inset:0;box-shadow:inset 0 0 0 1px rgba(255,255,255,.12);border-radius:inherit;pointer-events:none}
    @media(max-width:1000px){.ut-aesthetic{grid-template-columns:1fr 1fr}.ut-aesthetic-card:first-child{grid-column:1/-1}}
    @media(max-width:650px){.ut-aesthetic{grid-template-columns:1fr}.ut-aesthetic-card:first-child{grid-column:auto}.ut-aesthetic-card{height:190px}}
  `;
  document.head.appendChild(style);
  const wrap=document.createElement('div');wrap.className='ut-aesthetic';
  wrap.innerHTML=`
    <div class="ut-aesthetic-card"><img src="https://images.unsplash.com/photo-1591115765373-5207764f72e7?auto=format&fit=crop&w=1400&q=85" alt="Austin skyline aesthetic"></div>
    <div class="ut-aesthetic-card ut-aesthetic-logo" aria-label="Texas Longhorn inspired mark"><svg viewBox="0 0 500 240" role="img" aria-hidden="true"><path fill="white" d="M250 126c-35-1-62-17-82-38-22-23-48-36-79-42-24-5-45-3-64 2 35 3 63 15 84 36 18 18 31 39 47 57 18 21 43 36 76 39v27h36v-27c33-3 58-18 76-39 16-18 29-39 47-57 21-21 49-33 84-36-19-5-40-7-64-2-31 6-57 19-79 42-20 21-47 37-82 38z"/><path fill="white" d="M224 176h52l-9 45h-34z"/></svg></div>
    <div class="ut-aesthetic-card"><img src="https://images.unsplash.com/photo-1564981797816-1043664bf78d?auto=format&fit=crop&w=900&q=85" alt="College football stadium atmosphere"></div>`;
  const stats=dashboard.querySelector('.stats');if(stats)stats.parentNode.insertBefore(wrap,stats);
})();
