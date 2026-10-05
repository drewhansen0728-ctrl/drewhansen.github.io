// My Texas Planner: hide graded rows; only completed assignments await grades.
(function(){
  'use strict';
  const store=window.TexasPlannerGrades;
  if(!store)throw new Error('Load grades.js before assignment-grade-sync.js.');
  const $=id=>document.getElementById(id);
  const style=document.createElement('style');
  style.textContent=`
    main.main{min-width:0}
    #assignments .table-wrap{overflow-x:auto}
    #assignmentTable{min-width:740px}
    #assignmentTable tr[hidden]{display:none!important}
    #assignmentTable tr.awaiting-grade{opacity:1!important}
    #assignmentTable tr.awaiting-grade td{background:#fffbea}
    #assignmentTable tr.awaiting-grade td:first-child{border-left:3px solid #d59b13}
    #assignmentTable .awaiting-grade-label{display:inline-block;margin-top:7px;padding:5px 9px;border:1px solid #eac866;border-radius:8px;background:#fff1bb;color:#705000;font-size:12px;font-weight:800;line-height:1.4}
    #assignmentGradeStatusSummary{margin:0 0 16px;padding:12px 15px;border:1px solid #e8d8a0;border-radius:12px;background:#fffbea;color:#65501a;font-size:13px;line-height:1.6}
    #assignmentGradeError{color:#a12622;font-size:13px;line-height:1.5;margin-top:12px}
  `;
  document.head.appendChild(style);
  function ensureModal(){
    if($('assignmentGradeModal'))return;
    const back=document.createElement('div');back.className='modal-backdrop';back.id='assignmentGradeModal';back.innerHTML=`
      <div class="modal"><div class="modal-head"><h3 id="assignmentGradeTitle">Add Grade</h3><button class="icon-btn" id="closeAssignmentGrade" aria-label="Close grade form">\u2715</button></div>
      <p class="item-meta" id="assignmentGradeMeta" style="margin-bottom:16px"></p>
      <form id="assignmentGradeForm"><input type="hidden" id="assignmentGradeId"><div class="form-grid">
        <div class="field"><label for="assignmentGradeEarned">Points earned</label><input id="assignmentGradeEarned" type="number" min="0" step="0.01" required></div>
        <div class="field"><label for="assignmentGradePossible">Points possible</label><input id="assignmentGradePossible" type="number" min="0.01" step="0.01" required></div>
        <div class="field full"><label for="assignmentGradeCategory">Category</label><input id="assignmentGradeCategory" placeholder="Quiz, Exam, Homework, Project..."></div></div>
        <div id="assignmentGradeError" role="alert"></div><p class="item-meta">Saving a grade hides this assignment from Assignments. Its score stays editable in Grades.</p>
        <div class="actions"><button type="button" class="secondary-btn" id="skipAssignmentGrade">Skip for now</button><button type="submit" class="primary-btn">Save to Grades</button></div>
      </form></div>`;
    document.body.appendChild(back);
    const close=()=>back.classList.remove('open');
    $('closeAssignmentGrade').onclick=close;$('skipAssignmentGrade').onclick=close;
    back.addEventListener('click',e=>{if(e.target===back)close()});
    $('assignmentGradeForm').addEventListener('submit',e=>{
      e.preventDefault();
      try{
        const a=data.assignments.find(x=>x.id===$('assignmentGradeId').value);if(!a)return close();
        const score={earned:$('assignmentGradeEarned').value,possible:$('assignmentGradePossible').value};
        if(!store.validScore(score))throw new Error('Enter points earned (zero or more) and points possible (greater than zero).');
        const book=store.read(),course=store.ensure(book,a.courseId),existing=store.itemFor(a,book);
        const item={...existing,id:existing?.id||('assignment-'+a.id),assignmentId:a.id,name:a.title,category:$('assignmentGradeCategory').value.trim()||a.type||'Assignment',earned:Number(score.earned),possible:Number(score.possible)};
        const i=course.items.findIndex(x=>x.id===item.id);if(i>=0)course.items[i]=item;else course.items.push(item);
        store.write(book);close();
      }catch(err){$('assignmentGradeError').textContent=err.message||'Unable to save the grade. Your existing data was not changed.';}
    });
  }
  function openGradeForAssignment(id){
    ensureModal();const a=data.assignments.find(x=>x.id===id);if(!a)return;
    try{
      const c=courseById(a.courseId),book=store.read(),existing=store.itemFor(a,book);
      $('assignmentGradeId').value=a.id;$('assignmentGradeTitle').textContent=existing?'Edit Assignment Grade':'Add Assignment Grade';$('assignmentGradeMeta').textContent=(c?.code?c.code+' / ':'')+a.title;
      $('assignmentGradeEarned').value=existing?.earned??'';$('assignmentGradePossible').value=existing?.possible??'';$('assignmentGradeCategory').value=existing?.category??a.type??'';$('assignmentGradeError').textContent='';$('assignmentGradeModal').classList.add('open');
    }catch(err){alert('Unable to read saved grades. Your data was not changed.');}
  }
  const baseToggle=toggleAssignment;
  toggleAssignment=function(id){
    const wasDone=!!data.assignments.find(x=>x.id===id)?.done;
    const result=baseToggle.apply(this,arguments);const now=data.assignments.find(x=>x.id===id);
    if(now&&!wasDone&&now.done){try{if(!store.hasGrade(now,store.read()))setTimeout(()=>openGradeForAssignment(id),0);}catch(_){/* Keep saved data unchanged on read failure. */}}
    return result;
  };
  function sortedAssignments(){return [...data.assignments].sort((a,b)=>{if(a.done!==b.done)return a.done?1:-1;if(!a.due&&b.due)return 1;if(a.due&&!b.due)return -1;return (a.due||'').localeCompare(b.due||'')})}
  function decorateRows(){
    const table=$('assignmentTable');if(!table)return;
    let summary=$('assignmentGradeStatusSummary');
    if(!summary){summary=document.createElement('div');summary.id='assignmentGradeStatusSummary';summary.setAttribute('role','status');summary.setAttribute('aria-live','polite');const wrap=table.closest('.table-wrap')||table.closest('table');wrap?.before(summary);}
    let book;
    try{book=store.read();}catch(_){summary.textContent='Saved grades could not be read. All assignments are shown and saved data is unchanged.';return;}
    $('assignmentStatusEmpty')?.remove();
    const sorted=sortedAssignments();let hidden=0,awaiting=0;
    table.querySelectorAll('tr').forEach((tr,i)=>{
      const a=sorted[i];if(!a||!tr.querySelector('input.checkbox'))return;
      tr.dataset.assignmentId=a.id;
      const graded=store.hasGrade(a,book),awaitingGrade=!!a.done&&!graded;
      tr.hidden=graded;tr.classList.toggle('awaiting-grade',awaitingGrade);if(graded)hidden++;if(awaitingGrade)awaiting++;
      const titleCell=tr.querySelector('td:nth-child(2)');
      if(titleCell){titleCell.querySelector('.awaiting-grade-label')?.remove();if(awaitingGrade){const tag=document.createElement('div');tag.className='awaiting-grade-label';tag.textContent='Awaiting grade';tag.title='Marked complete in the planner; no score entered yet.';titleCell.appendChild(tag);}}
      const cell=tr.querySelector('td:last-child');if(!cell)return;
      let btn=cell.querySelector('.assignment-grade-btn');
      if(!btn){btn=document.createElement('button');btn.type='button';btn.className='mini-btn assignment-grade-btn';btn.style.marginLeft='6px';cell.appendChild(btn);}
      btn.textContent=graded?'Edit Grade':'Add Grade';btn.onclick=()=>openGradeForAssignment(a.id);
    });
    const unfinished=sorted.length-hidden-awaiting;
    summary.textContent=unfinished+' unfinished / '+awaiting+' awaiting grade / '+hidden+' graded '+(hidden===1?'assignment hidden':'assignments hidden')+'. Scores are kept in Grades. The checkbox still tracks assignment completion.';
    if(sorted.length&&hidden===sorted.length){const row=document.createElement('tr');row.id='assignmentStatusEmpty';const cell=document.createElement('td');cell.colSpan=7;const empty=document.createElement('div');empty.className='empty';empty.textContent='All assignments have grades. View or edit their scores in the Grades tab.';cell.appendChild(empty);row.appendChild(cell);table.appendChild(row);}
    // Keep hidden rows in place so existing row-index-based editors remain correct.
  }
  const baseRenderAssignments=renderAssignments;
  renderAssignments=function(){baseRenderAssignments.apply(this,arguments);decorateRows();};
  window.addEventListener(store.changeEvent,()=>renderAssignments());
  window.addEventListener('storage',e=>{if(e.key===store.key||e.key===null)renderAssignments();});
  ensureModal();renderAssignments();
})();
