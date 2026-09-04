// My Texas Planner: send completed assignment grades into the Grades tab
(function(){
  const GRADE_KEY='my_texas_planner_grades_v1';
  function readBook(){try{return JSON.parse(localStorage.getItem(GRADE_KEY)||'{}')}catch{return{}}}
  function writeBook(v){localStorage.setItem(GRADE_KEY,JSON.stringify(v))}
  function ensureCourse(book,id){if(!book[id])book[id]={target:90,override:'',items:[]};return book[id]}
  function gradeItemId(a){return 'assignment-'+a.id}

  function ensureModal(){
    if(document.getElementById('assignmentGradeModal'))return;
    const back=document.createElement('div');back.className='modal-backdrop';back.id='assignmentGradeModal';back.innerHTML=`
      <div class="modal">
        <div class="modal-head"><h3 id="assignmentGradeTitle">Add Grade</h3><button class="icon-btn" id="closeAssignmentGrade">✕</button></div>
        <p class="item-meta" id="assignmentGradeMeta" style="margin-bottom:16px"></p>
        <form id="assignmentGradeForm">
          <input type="hidden" id="assignmentGradeId">
          <div class="form-grid">
            <div class="field"><label>Points earned</label><input id="assignmentGradeEarned" type="number" min="0" step="0.01" required></div>
            <div class="field"><label>Points possible</label><input id="assignmentGradePossible" type="number" min="0.01" step="0.01" required></div>
            <div class="field full"><label>Category</label><input id="assignmentGradeCategory" placeholder="Quiz, Exam, Homework, Project..."></div>
          </div>
          <div class="actions">
            <button type="button" class="secondary-btn" id="skipAssignmentGrade">Skip for now</button>
            <button type="submit" class="primary-btn">Save to Grades</button>
          </div>
        </form>
      </div>`;
    document.body.appendChild(back);
    const close=()=>back.classList.remove('open');
    document.getElementById('closeAssignmentGrade').onclick=close;
    document.getElementById('skipAssignmentGrade').onclick=close;
    back.addEventListener('click',e=>{if(e.target===back)close()});
    document.getElementById('assignmentGradeForm').addEventListener('submit',e=>{
      e.preventDefault();
      const id=document.getElementById('assignmentGradeId').value;
      const a=data.assignments.find(x=>x.id===id);if(!a)return close();
      const book=readBook(),course=ensureCourse(book,a.courseId),itemId=gradeItemId(a);
      const item={id:itemId,name:a.title,category:document.getElementById('assignmentGradeCategory').value.trim()||a.type||'Assignment',earned:Number(document.getElementById('assignmentGradeEarned').value),possible:Number(document.getElementById('assignmentGradePossible').value)};
      const i=course.items.findIndex(x=>x.id===itemId);if(i>=0)course.items[i]=item;else course.items.push(item);
      writeBook(book);close();
      if(document.getElementById('grades')?.classList.contains('active')){const gradeBtn=document.querySelector('[data-view="grades"]');if(gradeBtn)gradeBtn.click()}
      decorateRows();
    });
  }

  function openGradeForAssignment(id){
    ensureModal();const a=data.assignments.find(x=>x.id===id);if(!a)return;
    const c=courseById(a.courseId),book=readBook(),course=ensureCourse(book,a.courseId),existing=course.items.find(x=>x.id===gradeItemId(a));
    document.getElementById('assignmentGradeId').value=a.id;
    document.getElementById('assignmentGradeTitle').textContent=existing?'Edit Assignment Grade':'Add Assignment Grade';
    document.getElementById('assignmentGradeMeta').textContent=(c?.code?c.code+' · ':'')+a.title;
    document.getElementById('assignmentGradeEarned').value=existing?.earned??'';
    document.getElementById('assignmentGradePossible').value=existing?.possible??'';
    document.getElementById('assignmentGradeCategory').value=existing?.category??(a.type||'');
    document.getElementById('assignmentGradeModal').classList.add('open');
  }

  const baseToggle=toggleAssignment;
  toggleAssignment=function(id){
    const a=data.assignments.find(x=>x.id===id);const wasDone=!!a?.done;
    baseToggle(id);
    const now=data.assignments.find(x=>x.id===id);
    if(now && !wasDone && now.done)setTimeout(()=>openGradeForAssignment(id),0);
  };

  function sortedAssignments(){return [...data.assignments].sort((a,b)=>{if(a.done!==b.done)return a.done?1:-1;if(!a.due&&b.due)return 1;if(a.due&&!b.due)return -1;return (a.due||'').localeCompare(b.due||'')})}
  function decorateRows(){
    const table=document.getElementById('assignmentTable');if(!table)return;
    const rows=table.querySelectorAll('tr'),sorted=sortedAssignments(),book=readBook();
    rows.forEach((tr,i)=>{
      const a=sorted[i];if(!a||!a.done)return;
      const cell=tr.querySelector('td:last-child');if(!cell||cell.querySelector('.assignment-grade-btn'))return;
      const course=book[a.courseId],has=!!course?.items?.some(x=>x.id===gradeItemId(a));
      const btn=document.createElement('button');btn.className='mini-btn assignment-grade-btn';btn.style.marginLeft='6px';btn.textContent=has?'Edit Grade':'Add Grade';btn.onclick=()=>openGradeForAssignment(a.id);cell.appendChild(btn);
    });
  }

  const baseRenderAssignments=renderAssignments;
  renderAssignments=function(){baseRenderAssignments();decorateRows()};
  ensureModal();decorateRows();
})();
