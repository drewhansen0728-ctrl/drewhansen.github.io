// My Texas Planner: larger class notes + reliable UT dashboard photos
(function(){
  const NOTES_KEY='my_texas_planner_class_notes_v1';
  const gallery=[
    'https://commons.wikimedia.org/wiki/Special:FilePath/Main%20building%20tower.JPG',
    'https://commons.wikimedia.org/wiki/Special:FilePath/Darrell_K_Royal%E2%80%93Texas_Memorial_Stadium_-_Texas_Longhorns_%2854983869867%29.jpg'
  ];
  const css=`
  .notes-shell{display:grid;grid-template-columns:250px minmax(0,1fr);gap:20px}.notes-course-list{display:grid;gap:10px;align-content:start}.notes-course-btn{border:1px solid var(--line);background:#fff;border-radius:12px;padding:12px;text-align:left;font-weight:800;color:var(--text)}.notes-course-btn.active{border-color:#bf5700;background:#fff7f0;color:#9d4700}.notes-editor{width:100%;min-height:650px;height:68vh;resize:vertical;line-height:1.65;font-size:15px;padding:18px}.notes-status{font-size:12px;color:var(--muted);margin-top:8px}.ut-gallery{display:grid;grid-template-columns:1.25fr .75fr;gap:14px;margin-bottom:20px}.ut-photo{position:relative;min-height:230px;border-radius:20px;overflow:hidden;box-shadow:var(--shadow);background:#ddd8d1}.ut-photo img{width:100%;height:100%;position:absolute;inset:0;object-fit:cover;display:block}.ut-photo.small{min-height:230px}@media(max-width:850px){.notes-shell,.ut-gallery{grid-template-columns:1fr}.notes-course-list{grid-template-columns:repeat(2,minmax(0,1fr))}.ut-photo,.ut-photo.small{min-height:200px}.notes-editor{min-height:520px;height:60vh}}@media(max-width:560px){.notes-course-list{grid-template-columns:1fr}}
  `;
  const style=document.createElement('style');style.textContent=css;document.head.appendChild(style);
  function readNotes(){try{return JSON.parse(localStorage.getItem(NOTES_KEY)||'{}')}catch{return{}}}
  function writeNotes(v){localStorage.setItem(NOTES_KEY,JSON.stringify(v))}
  let active=(data.courses&&data.courses[0]?.id)||'';
  function addNavAndView(){
    if(document.querySelector('[data-view="notes"]'))return;
    const goals=document.querySelector('[data-view="goals"]');
    const btn=document.createElement('button');btn.className='nav-btn';btn.dataset.view='notes';btn.innerHTML='🗒️ Class Notes';goals?.parentNode.insertBefore(btn,goals);btn.addEventListener('click',()=>switchView('notes'));
    const main=document.querySelector('main.main');const section=document.createElement('section');section.className='view';section.id='notes';section.innerHTML=`<div class="topbar"><div><h1>Class Notes</h1><p>A private notebook for each of your classes. Notes save automatically in this browser.</p></div></div><div class="notes-shell"><div class="notes-course-list" id="notesCourseList"></div><div class="card"><div class="section-title"><h2 id="notesTitle">Notes</h2><span class="badge blue" id="notesCourseCode"></span></div><textarea id="notesEditor" class="notes-editor" placeholder="Write lecture notes, reminders, questions for your professor, exam hints, study ideas, or anything else for this class..."></textarea><div class="notes-status" id="notesStatus">Saved automatically</div></div></div>`;main?.appendChild(section);renderNotes();section.querySelector('#notesEditor')?.addEventListener('input',e=>{const all=readNotes();all[active]=e.target.value;writeNotes(all);const s=document.getElementById('notesStatus');if(s){s.textContent='Saved';clearTimeout(window.__notesTimer);window.__notesTimer=setTimeout(()=>s.textContent='Saved automatically',1000)}})
  }
  function renderNotes(){const list=document.getElementById('notesCourseList'),editor=document.getElementById('notesEditor');if(!list||!editor)return;list.innerHTML=(data.courses||[]).map(c=>`<button class="notes-course-btn ${c.id===active?'active':''}" data-notes-course="${c.id}"><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${c.color};margin-right:8px"></span>${escapeHtml(c.code)}</button>`).join('');list.querySelectorAll('[data-notes-course]').forEach(b=>b.addEventListener('click',()=>{active=b.dataset.notesCourse;renderNotes()}));const c=courseById(active);document.getElementById('notesTitle').textContent=c?c.name:'Class Notes';document.getElementById('notesCourseCode').textContent=c?c.code:'';editor.value=readNotes()[active]||''}
  function addGallery(){const dashboard=document.getElementById('dashboard');if(!dashboard||dashboard.querySelector('.ut-gallery'))return;const stats=dashboard.querySelector('.stats');if(!stats)return;const galleryEl=document.createElement('div');galleryEl.className='ut-gallery';galleryEl.innerHTML=gallery.map((src,i)=>`<div class="ut-photo ${i?'small':''}"><img src="${src}" alt="University of Texas at Austin" loading="eager"></div>`).join('');stats.parentNode.insertBefore(galleryEl,stats)}
  addNavAndView();addGallery();
})();
