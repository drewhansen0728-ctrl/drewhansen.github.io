// My Texas Planner: editable grade tracker
(function(){
  const KEY='my_texas_planner_grades_v1';
  const style=document.createElement('style');
  style.textContent=`
    .grades-layout{display:grid;grid-template-columns:240px minmax(0,1fr);gap:20px}
    .grade-course-list{display:grid;gap:10px;align-content:start}
    .grade-course-btn{border:1px solid var(--line);background:#fff;border-radius:12px;padding:12px;text-align:left;font-weight:800;color:var(--text)}
    .grade-course-btn.active{border-color:#bf5700;background:#fff7f0;color:#9d4700}
    .grade-summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-bottom:18px}
    .grade-stat{border:1px solid var(--line);border-radius:14px;padding:16px;background:#fff}
    .grade-stat .k{font-size:12px;color:var(--muted);font-weight:800;text-transform:uppercase;letter-spacing:.04em}
    .grade-stat .v{font-size:28px;font-weight:900;margin-top:6px}
    .grade-table-wrap{overflow-x:auto}
    .grade-actions{display:flex;gap:8px;flex-wrap:wrap}
    @media(max-width:850px){.grades-layout{grid-template-columns:1fr}.grade-course-list{grid-template-columns:repeat(2,minmax(0,1fr))}.grade-summary{grid-template-columns:1fr}}
    @media(max-width:560px){.grade-course-list{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  function read(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return{}}}
  function write(v){localStorage.setItem(KEY,JSON.stringify(v))}
  let book=read();
  let active=(data.courses&&data.courses[0]?.id)||'';
  let editingId=null;

  function ensureCourse(id){if(!book[id])book[id]={target:90,override:'',items:[]};return book[id]}
  function letter(p){if(p===''||p==null||Number.isNaN(Number(p)))return '—';p=Number(p);if(p>=93)return'A';if(p>=90)return'A-';if(p>=87)return'B+';if(p>=83)return'B';if(p>=80)return'B-';if(p>=77)return'C+';if(p>=73)return'C';if(p>=70)return'C-';if(p>=67)return'D+';if(p>=63)return'D';if(p>=60)return'D-';return'F'}
  function computed(g){const possible=g.items.reduce((s,x)=>s+(Number(x.possible)||0),0);const earned=g.items.reduce((s,x)=>s+(Number(x.earned)||0),0);return possible?earned/possible*100:''}
  function current(g){return g.override!==''&&g.override!=null?Number(g.override):computed(g)}

  function addView(){
    if(document.querySelector('[data-view="grades"]'))return;
    const goals=document.querySelector('[data-view="goals"]');
    const btn=document.createElement('button');btn.className='nav-btn';btn.dataset.view='grades';btn.innerHTML='📊 Grades';goals?.parentNode.insertBefore(btn,goals);btn.addEventListener('click',()=>switchView('grades'));
    const main=document.querySelector('main.main');
    const section=document.createElement('section');section.className='view';section.id='grades';section.innerHTML=`
      <div class="topbar"><div><h1>Grades</h1><p>Track and edit grades for each class. Everything saves automatically in this browser.</p></div><button class="primary-btn" id="addGradeBtn">+ Add Grade</button></div>
      <div class="grades-layout">
        <div class="grade-course-list" id="gradeCourseList"></div>
        <div>
          <div class="grade-summary">
            <div class="grade-stat"><div class="k">Current Grade</div><div class="v" id="gradeCurrent">—</div></div>
            <div class="grade-stat"><div class="k">Letter Grade</div><div class="v" id="gradeLetter">—</div></div>
            <div class="grade-stat"><div class="k">Target</div><div class="v" id="gradeTarget">90%</div></div>
          </div>
          <div class="card" style="margin-bottom:18px"><div class="section-title"><h2>Course Settings</h2></div><div class="form-grid"><div class="field"><label>Target grade (%)</label><input id="gradeTargetInput" type="number" min="0" max="100" step="0.1"></div><div class="field"><label>Current grade override (optional)</label><input id="gradeOverrideInput" type="number" min="0" max="100" step="0.01" placeholder="Leave blank to calculate from items"></div></div></div>
          <div class="card"><div class="section-title"><h2 id="gradeCourseTitle">Grade Items</h2></div><div class="grade-table-wrap"><table><thead><tr><th>Assignment</th><th>Category</th><th>Score</th><th>Percent</th><th></th></tr></thead><tbody id="gradeTable"></tbody></table></div></div>
        </div>
      </div>`;
    main?.appendChild(section);
    document.getElementById('addGradeBtn').onclick=()=>openModal();
    document.getElementById('gradeTargetInput').addEventListener('input',e=>{const g=ensureCourse(active);g.target=Number(e.target.value)||0;write(book);render()});
    document.getElementById('gradeOverrideInput').addEventListener('input',e=>{const g=ensureCourse(active);g.override=e.target.value;write(book);render()});
    ensureModal();render();
  }

  function ensureModal(){
    if(document.getElementById('gradeItemModal'))return;
    const back=document.createElement('div');back.className='modal-backdrop';back.id='gradeItemModal';back.innerHTML=`<div class="modal"><div class="modal-head"><h3 id="gradeModalTitle">Add Grade</h3><button class="icon-btn" id="closeGradeModal">✕</button></div><form id="gradeItemForm"><div class="form-grid"><div class="field full"><label>Assignment / Exam</label><input id="gradeItemName" required></div><div class="field"><label>Category</label><input id="gradeItemCategory" placeholder="Exam, Quiz, Homework..."></div><div class="field"><label>Points earned</label><input id="gradeItemEarned" type="number" step="0.01" min="0" required></div><div class="field"><label>Points possible</label><input id="gradeItemPossible" type="number" step="0.01" min="0.01" required></div></div><div class="actions"><button type="button" class="secondary-btn" id="cancelGradeModal">Cancel</button><button type="submit" class="primary-btn">Save</button></div></form></div>`;
    document.body.appendChild(back);
    const close=()=>{back.classList.remove('open');editingId=null};
    document.getElementById('closeGradeModal').onclick=close;document.getElementById('cancelGradeModal').onclick=close;back.addEventListener('click',e=>{if(e.target===back)close()});
    document.getElementById('gradeItemForm').addEventListener('submit',e=>{e.preventDefault();const g=ensureCourse(active);const item={id:editingId||('gr-'+Date.now()),name:document.getElementById('gradeItemName').value.trim(),category:document.getElementById('gradeItemCategory').value.trim(),earned:Number(document.getElementById('gradeItemEarned').value),possible:Number(document.getElementById('gradeItemPossible').value)};if(editingId){const i=g.items.findIndex(x=>x.id===editingId);if(i>=0)g.items[i]=item}else g.items.push(item);write(book);close();render()});
  }

  function openModal(id){
    ensureModal();const g=ensureCourse(active);editingId=id||null;const item=id?g.items.find(x=>x.id===id):null;document.getElementById('gradeModalTitle').textContent=item?'Edit Grade':'Add Grade';document.getElementById('gradeItemName').value=item?.name||'';document.getElementById('gradeItemCategory').value=item?.category||'';document.getElementById('gradeItemEarned').value=item?.earned??'';document.getElementById('gradeItemPossible').value=item?.possible??'';document.getElementById('gradeItemModal').classList.add('open');
  }
  function del(id){const g=ensureCourse(active);g.items=g.items.filter(x=>x.id!==id);write(book);render()}

  function render(){
    const list=document.getElementById('gradeCourseList');if(!list)return;
    list.innerHTML=(data.courses||[]).map(c=>`<button class="grade-course-btn ${c.id===active?'active':''}" data-grade-course="${c.id}"><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${c.color};margin-right:8px"></span>${escapeHtml(c.code)}</button>`).join('');
    list.querySelectorAll('[data-grade-course]').forEach(b=>b.onclick=()=>{active=b.dataset.gradeCourse;render()});
    const c=courseById(active),g=ensureCourse(active),p=current(g);document.getElementById('gradeCourseTitle').textContent=(c?c.code+' ':'')+'Grade Items';document.getElementById('gradeCurrent').textContent=p===''?'—':p.toFixed(2)+'%';document.getElementById('gradeLetter').textContent=letter(p);document.getElementById('gradeTarget').textContent=(Number(g.target)||0).toFixed(1).replace('.0','')+'%';document.getElementById('gradeTargetInput').value=g.target??90;document.getElementById('gradeOverrideInput').value=g.override??'';
    document.getElementById('gradeTable').innerHTML=g.items.length?g.items.map(x=>{const pct=x.possible?x.earned/x.possible*100:0;return `<tr><td><strong>${escapeHtml(x.name)}</strong></td><td>${escapeHtml(x.category||'—')}</td><td>${x.earned} / ${x.possible}</td><td>${pct.toFixed(1)}%</td><td><div class="grade-actions"><button class="mini-btn" data-edit-grade="${x.id}">Edit</button><button class="mini-btn" data-delete-grade="${x.id}">Delete</button></div></td></tr>`}).join(''):'<tr><td colspan="5"><div class="empty">No grades added yet.</div></td></tr>';
    document.querySelectorAll('[data-edit-grade]').forEach(b=>b.onclick=()=>openModal(b.dataset.editGrade));document.querySelectorAll('[data-delete-grade]').forEach(b=>b.onclick=()=>del(b.dataset.deleteGrade));write(book);
  }
  addView();
})();
