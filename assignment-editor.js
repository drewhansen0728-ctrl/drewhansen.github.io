// My Texas Planner: edit existing assignments
(function(){
  function ensureModal(){
    if(document.getElementById('assignmentEditModal'))return;
    const back=document.createElement('div');back.className='modal-backdrop';back.id='assignmentEditModal';back.innerHTML=`
      <div class="modal">
        <div class="modal-head"><h3>Edit Assignment</h3><button class="icon-btn" id="closeAssignmentEdit">✕</button></div>
        <form id="assignmentEditForm">
          <input type="hidden" id="assignmentEditId">
          <div class="form-grid">
            <div class="field full"><label>Assignment name</label><input id="assignmentEditTitle" required></div>
            <div class="field"><label>Course</label><select id="assignmentEditCourse"></select></div>
            <div class="field"><label>Type</label><input id="assignmentEditType"></div>
            <div class="field"><label>Due date</label><input id="assignmentEditDue" type="date"></div>
            <div class="field"><label>Due time</label><input id="assignmentEditTime" type="time"></div>
            <div class="field"><label>Priority</label><select id="assignmentEditPriority"><option>High</option><option>Medium</option><option>Low</option></select></div>
            <div class="field full"><label>Description / Notes</label><textarea id="assignmentEditNotes" rows="5"></textarea></div>
          </div>
          <div class="actions"><button type="button" class="secondary-btn" id="cancelAssignmentEdit">Cancel</button><button type="submit" class="primary-btn">Save Changes</button></div>
        </form>
      </div>`;
    document.body.appendChild(back);
    const close=()=>back.classList.remove('open');
    document.getElementById('closeAssignmentEdit').onclick=close;
    document.getElementById('cancelAssignmentEdit').onclick=close;
    back.addEventListener('click',e=>{if(e.target===back)close()});
    document.getElementById('assignmentEditForm').addEventListener('submit',e=>{
      e.preventDefault();
      const id=document.getElementById('assignmentEditId').value;
      const a=data.assignments.find(x=>x.id===id);if(!a)return close();
      a.title=document.getElementById('assignmentEditTitle').value.trim();
      a.courseId=document.getElementById('assignmentEditCourse').value;
      a.type=document.getElementById('assignmentEditType').value.trim()||'Assignment';
      a.due=document.getElementById('assignmentEditDue').value;
      a.time=document.getElementById('assignmentEditTime').value;
      a.priority=document.getElementById('assignmentEditPriority').value;
      a.notes=document.getElementById('assignmentEditNotes').value.trim();
      saveData();close();
    });
  }

  function openEdit(id){
    ensureModal();const a=data.assignments.find(x=>x.id===id);if(!a)return;
    const sel=document.getElementById('assignmentEditCourse');sel.innerHTML=data.courses.map(c=>`<option value="${c.id}">${escapeHtml(c.code)} — ${escapeHtml(c.name)}</option>`).join('');
    document.getElementById('assignmentEditId').value=a.id;
    document.getElementById('assignmentEditTitle').value=a.title||'';
    sel.value=a.courseId||'';
    document.getElementById('assignmentEditType').value=a.type||'';
    document.getElementById('assignmentEditDue').value=a.due||'';
    document.getElementById('assignmentEditTime').value=a.time||'';
    document.getElementById('assignmentEditPriority').value=a.priority||'Medium';
    document.getElementById('assignmentEditNotes').value=a.notes||'';
    document.getElementById('assignmentEditModal').classList.add('open');
  }

  function sortedAssignments(){return [...data.assignments].sort((a,b)=>{if(a.done!==b.done)return a.done?1:-1;if(!a.due&&b.due)return 1;if(a.due&&!b.due)return -1;return (a.due||'').localeCompare(b.due||'')})}
  function decorate(){
    const rows=document.querySelectorAll('#assignmentTable tr'),sorted=sortedAssignments();
    rows.forEach((tr,i)=>{const a=sorted[i];if(!a)return;const cell=tr.querySelector('td:last-child');if(!cell||cell.querySelector('.assignment-edit-btn'))return;const btn=document.createElement('button');btn.className='mini-btn assignment-edit-btn';btn.style.marginLeft='6px';btn.textContent='Edit';btn.onclick=()=>openEdit(a.id);cell.appendChild(btn)});
  }
  const base=renderAssignments;renderAssignments=function(){base();decorate()};
  ensureModal();decorate();
})();
