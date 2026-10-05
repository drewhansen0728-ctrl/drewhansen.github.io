// My Texas Planner: editable grade tracker with stable assignment links.
(function(){
  'use strict';
  const KEY='my_texas_planner_grades_v1';
  const CHANGE='texas-planner-grades-changed';
  const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
  const normalize=v=>String(v||'').trim().replace(/\s+/g,' ').toLowerCase();
  function read(){
    const raw=localStorage.getItem(KEY);
    if(!raw)return {};
    const value=JSON.parse(raw);
    if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Saved grades could not be read. Your saved data has not been changed.');
    return value;
  }
  function write(value){
    localStorage.setItem(KEY,JSON.stringify(value));
    window.dispatchEvent(new Event(CHANGE));
  }
  function ensure(book,id){
    if(!own(book,id))book[id]={target:90,override:'',items:[]};
    if(!book[id]||!Array.isArray(book[id].items))throw new Error('This course has invalid saved grade data. Nothing was overwritten.');
    return book[id];
  }
  function validScore(item){
    const numeric=v=>(typeof v==='number'||typeof v==='string')&&String(v).trim()!==''&&Number.isFinite(Number(v));
    return !!item&&numeric(item.earned)&&numeric(item.possible)&&Number(item.earned)>=0&&Number(item.possible)>0;
  }
  function assignmentFor(item,courseId){
    if(!item)return null;
    const list=(data.assignments||[]).filter(a=>a.courseId===courseId);
    // Explicit links survive title edits; null deliberately means standalone.
    if(own(item,'assignmentId'))return list.find(a=>a.id===item.assignmentId)||null;
    const linked=list.find(a=>item.id==='assignment-'+a.id);
    if(linked)return linked;
    // Older manually entered scores can match a unique title, never duplicate quizzes.
    const matches=list.filter(a=>normalize(a.title)===normalize(item.name));
    return matches.length===1?matches[0]:null;
  }
  function itemFor(a,book){
    const items=book[a.courseId]?.items;
    return Array.isArray(items)?items.find(x=>assignmentFor(x,a.courseId)?.id===a.id):undefined;
  }
  function hasGrade(a,book){
    const items=book[a.courseId]?.items;
    return Array.isArray(items)&&items.some(x=>validScore(x)&&assignmentFor(x,a.courseId)?.id===a.id);
  }
  window.TexasPlannerGrades={key:KEY,changeEvent:CHANGE,read,write,ensure,validScore,assignmentFor,itemFor,hasGrade};

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
    .grades-layout>div{min-width:0}.grade-table-wrap{overflow-x:auto}.grade-actions{display:flex;gap:8px;flex-wrap:wrap}
    .grade-link-help{font-size:12px;line-height:1.5;color:var(--muted);margin:0}
    .grade-error{color:#a12622;font-size:13px;line-height:1.5;margin:12px 0}
    @media(max-width:850px){.grades-layout{grid-template-columns:1fr}.grade-course-list{grid-template-columns:repeat(2,minmax(0,1fr))}.grade-summary{grid-template-columns:1fr}}
    @media(max-width:560px){.grade-course-list{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);
  let book={},active=data.courses?.[0]?.id||'',editingId=null,editingCourse='',manualLink=false;
  const $=id=>document.getElementById(id);
  function letter(p){if(p===''||p==null||!Number.isFinite(Number(p)))return '\u2014';p=Number(p);if(p>=93)return'A';if(p>=90)return'A-';if(p>=87)return'B+';if(p>=83)return'B';if(p>=80)return'B-';if(p>=77)return'C+';if(p>=73)return'C';if(p>=70)return'C-';if(p>=67)return'D+';if(p>=63)return'D';if(p>=60)return'D-';return'F'}
  function computed(g){const items=g.items.filter(validScore);const possible=items.reduce((s,x)=>s+Number(x.possible),0);return possible?items.reduce((s,x)=>s+Number(x.earned),0)/possible*100:''}
  function current(g){return g.override!==''&&g.override!=null?Number(g.override):computed(g)}
  function errorMessage(e){return e instanceof SyntaxError?'Saved grades could not be read. Your saved data has not been changed.':e.message||'Unable to save grades. Your data was not changed.'}
  function close(){ $('gradeItemModal').classList.remove('open');editingId=null;editingCourse=''; }
  function uniqueAssignment(name,courseId){const list=(data.assignments||[]).filter(a=>a.courseId===courseId&&normalize(a.title)===normalize(name));return list.length===1?list[0]:null;}

  function addView(){
    if(document.querySelector('[data-view="grades"]'))return;
    const goals=document.querySelector('[data-view="goals"]');
    const btn=document.createElement('button');btn.className='nav-btn';btn.dataset.view='grades';btn.textContent='\uD83D\uDCCA Grades';goals?.parentNode.insertBefore(btn,goals);btn.addEventListener('click',()=>switchView('grades'));
    const section=document.createElement('section');section.className='view';section.id='grades';section.innerHTML=`
      <div class="topbar"><div><h1>Grades</h1><p>Track and edit grades for each class. Graded assignments stay here and are hidden from Assignments.</p></div><button class="primary-btn" id="addGradeBtn">+ Add Grade</button></div>
      <div id="gradeBookError" class="grade-error" role="alert"></div>
      <div class="grades-layout"><div class="grade-course-list" id="gradeCourseList"></div><div>
        <div class="grade-summary"><div class="grade-stat"><div class="k">Current Grade</div><div class="v" id="gradeCurrent">\u2014</div></div><div class="grade-stat"><div class="k">Letter Grade</div><div class="v" id="gradeLetter">\u2014</div></div><div class="grade-stat"><div class="k">Target</div><div class="v" id="gradeTarget">90%</div></div></div>
        <div class="card" style="margin-bottom:18px"><div class="section-title"><h2>Course Settings</h2></div><div class="form-grid"><div class="field"><label for="gradeTargetInput">Target grade (%)</label><input id="gradeTargetInput" type="number" min="0" max="100" step="0.1"></div><div class="field"><label for="gradeOverrideInput">Current grade override (optional)</label><input id="gradeOverrideInput" type="number" min="0" max="100" step="0.01" placeholder="Leave blank to calculate from items"></div></div></div>
        <div class="card"><div class="section-title"><h2 id="gradeCourseTitle">Grade Items</h2></div><div class="grade-table-wrap"><table><thead><tr><th>Assignment</th><th>Category</th><th>Score</th><th>Percent</th><th></th></tr></thead><tbody id="gradeTable"></tbody></table></div></div>
      </div></div>`;
    document.querySelector('main.main')?.appendChild(section);
    $('addGradeBtn').onclick=()=>openModal();
    function setting(field,value){try{book=read();ensure(book,active)[field]=value;write(book);}catch(e){$('gradeBookError').textContent=errorMessage(e);}}
    $('gradeTargetInput').addEventListener('input',e=>setting('target',Number(e.target.value)||0));
    $('gradeOverrideInput').addEventListener('input',e=>setting('override',e.target.value));
    ensureModal();render();
  }
  function ensureModal(){
    if($('gradeItemModal'))return;
    const back=document.createElement('div');back.className='modal-backdrop';back.id='gradeItemModal';back.innerHTML=`<div class="modal"><div class="modal-head"><h3 id="gradeModalTitle">Add Grade</h3><button class="icon-btn" id="closeGradeModal" aria-label="Close grade form">\u2715</button></div><form id="gradeItemForm"><div class="form-grid"><div class="field full"><label for="gradeAssignmentLink">Link to planner assignment</label><select id="gradeAssignmentLink"></select><p class="grade-link-help">A linked assignment disappears from Assignments after its score is saved. Dates distinguish assignments with the same name.</p></div><div class="field full"><label for="gradeItemName">Assignment / Exam</label><input id="gradeItemName" required></div><div class="field"><label for="gradeItemCategory">Category</label><input id="gradeItemCategory" placeholder="Exam, Quiz, Homework..."></div><div class="field"><label for="gradeItemEarned">Points earned</label><input id="gradeItemEarned" type="number" step="0.01" min="0" required></div><div class="field"><label for="gradeItemPossible">Points possible</label><input id="gradeItemPossible" type="number" step="0.01" min="0.01" required></div></div><div id="gradeItemError" class="grade-error" role="alert"></div><div class="actions"><button type="button" class="secondary-btn" id="cancelGradeModal">Cancel</button><button type="submit" class="primary-btn">Save</button></div></form></div>`;
    document.body.appendChild(back);
    $('closeGradeModal').onclick=close;$('cancelGradeModal').onclick=close;back.addEventListener('click',e=>{if(e.target===back)close()});
    $('gradeAssignmentLink').onchange=()=>{
      manualLink=true;const a=data.assignments.find(x=>x.id===$('gradeAssignmentLink').value&&x.courseId===editingCourse);
      if(a){$('gradeItemName').value=a.title;$('gradeItemCategory').value=a.type||'';}
    };
    $('gradeItemName').addEventListener('input',()=>{
      if(manualLink||editingId)return;
      const a=uniqueAssignment($('gradeItemName').value,editingCourse);
      $('gradeAssignmentLink').value=a&&[...$('gradeAssignmentLink').options].some(o=>o.value===a.id)?a.id:'';
    });
    $('gradeItemForm').addEventListener('submit',e=>{
      e.preventDefault();
      try{
        // Read the latest book at the moment of mutation, not a stale tab snapshot.
        book=read();const g=ensure(book,editingCourse),previous=editingId?g.items.find(x=>x.id===editingId):null;
        if(editingId&&!previous)throw new Error('This grade was removed elsewhere. Close this form and reopen it.');
        const linkedId=$('gradeAssignmentLink').value;
        const a=linkedId?data.assignments.find(x=>x.id===linkedId&&x.courseId===editingCourse):null;
        if(linkedId&&!a)throw new Error('The linked assignment changed. Close this form and try again.');
        if(a&&g.items.some(x=>x.id!==editingId&&assignmentFor(x,editingCourse)?.id===a.id))throw new Error('This assignment already has a grade entry. Edit that entry instead.');
        const score={earned:$('gradeItemEarned').value,possible:$('gradeItemPossible').value};
        if(!validScore(score))throw new Error('Enter points earned (zero or more) and points possible (greater than zero).');
        const name=$('gradeItemName').value.trim();if(!name)throw new Error('Enter an assignment name.');
        const item={...previous,id:editingId||('gr-'+crypto.randomUUID()),assignmentId:a?.id||null,name,category:$('gradeItemCategory').value.trim(),earned:Number(score.earned),possible:Number(score.possible)};
        if(editingId)g.items[g.items.findIndex(x=>x.id===editingId)]=item;else g.items.push(item);
        write(book);close();
      }catch(err){$('gradeItemError').textContent=errorMessage(err);}
    });
  }
  function openModal(id){
    try{
      ensureModal();book=read();const g=ensure(book,active);editingId=id||null;editingCourse=active;manualLink=false;
      const item=id?g.items.find(x=>x.id===id):null;const linked=item?assignmentFor(item,active):null;
      const select=$('gradeAssignmentLink');select.replaceChildren(new Option('Standalone grade (not linked to an assignment)',''));
      (data.assignments||[]).filter(a=>a.courseId===active).sort((a,b)=>(a.due||'9999').localeCompare(b.due||'9999')).forEach(a=>{
        const existing=itemFor(a,book);if(existing&&existing.id!==editingId)return;
        select.add(new Option(a.title+' - '+(a.due||'No due date'),a.id));
      });
      select.value=linked?.id||'';
      $('gradeModalTitle').textContent=item?'Edit Grade':'Add Grade';$('gradeItemName').value=item?.name||'';$('gradeItemCategory').value=item?.category||'';$('gradeItemEarned').value=item?.earned??'';$('gradeItemPossible').value=item?.possible??'';$('gradeItemError').textContent='';$('gradeItemModal').classList.add('open');
    }catch(e){$('gradeBookError').textContent=errorMessage(e);}
  }
  function del(id){try{book=read();const g=ensure(book,active);g.items=g.items.filter(x=>x.id!==id);write(book);}catch(e){$('gradeBookError').textContent=errorMessage(e);}}
  function render(){
    const list=$('gradeCourseList');if(!list)return;
    try{
      book=read();$('gradeBookError').textContent='';
      if(!data.courses.some(c=>c.id===active))active=data.courses[0]?.id||'';
      if(!active){list.replaceChildren();$('gradeTable').innerHTML='<tr><td colspan="5"><div class="empty">Add a course before entering grades.</div></td></tr>';$('addGradeBtn').disabled=true;return;}
      $('addGradeBtn').disabled=false;
      list.innerHTML=(data.courses||[]).map(c=>`<button class="grade-course-btn ${c.id===active?'active':''}" data-grade-course="${escapeHtml(c.id)}"><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${escapeHtml(c.color)};margin-right:8px"></span>${escapeHtml(c.code)}</button>`).join('');
      list.querySelectorAll('[data-grade-course]').forEach(b=>b.onclick=()=>{active=b.dataset.gradeCourse;render()});
      const c=courseById(active),g=ensure(book,active),p=current(g);$('gradeCourseTitle').textContent=(c?c.code+' ':'')+'Grade Items';$('gradeCurrent').textContent=p===''?'\u2014':p.toFixed(2)+'%';$('gradeLetter').textContent=letter(p);$('gradeTarget').textContent=(Number(g.target)||0).toFixed(1).replace('.0','')+'%';$('gradeTargetInput').value=g.target??90;$('gradeOverrideInput').value=g.override??'';
      $('gradeTable').innerHTML=g.items.length?g.items.map(x=>{const pct=validScore(x)?(Number(x.earned)/Number(x.possible)*100).toFixed(1)+'%':'\u2014';const a=assignmentFor(x,active);return `<tr><td><strong>${escapeHtml(x.name)}</strong>${a?'<div class="item-meta">Linked to planner'+(a.due?' - '+escapeHtml(a.due):'')+'</div>':''}</td><td>${escapeHtml(x.category||'\u2014')}</td><td>${escapeHtml(x.earned)} / ${escapeHtml(x.possible)}</td><td>${pct}</td><td><div class="grade-actions"><button class="mini-btn" data-edit-grade="${escapeHtml(x.id)}">Edit</button><button class="mini-btn" data-delete-grade="${escapeHtml(x.id)}">Delete</button></div></td></tr>`}).join(''):'<tr><td colspan="5"><div class="empty">No grades added yet.</div></td></tr>';
      $('gradeTable').querySelectorAll('[data-edit-grade]').forEach(b=>b.onclick=()=>openModal(b.dataset.editGrade));$('gradeTable').querySelectorAll('[data-delete-grade]').forEach(b=>b.onclick=()=>del(b.dataset.deleteGrade));
      // Rendering must never write old data back over a newly entered score.
    }catch(e){$('gradeBookError').textContent=errorMessage(e);}
  }
  addView();
  window.addEventListener(CHANGE,render);
  window.addEventListener('storage',e=>{if(e.key===KEY||e.key===null)render();});
  const baseSwitch=switchView;
  switchView=function(id){const result=baseSwitch.apply(this,arguments);if(id==='grades')render();return result;};
})();
