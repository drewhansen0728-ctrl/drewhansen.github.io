// Calendar detail viewer/editor + My Texas Planner branding
(function(){
  const SPORTS_OVERRIDES_KEY='my_texas_planner_sports_overrides_v1';
  const sportsOverrides=JSON.parse(localStorage.getItem(SPORTS_OVERRIDES_KEY)||'{}');

  function applySportsOverrides(){
    if(typeof utSportsEvents==='undefined')return;
    for(const e of utSportsEvents){if(sportsOverrides[e.id])Object.assign(e,sportsOverrides[e.id])}
  }
  applySportsOverrides();

  // Branding
  document.title='My Texas Planner';
  const brand=document.querySelector('.brand span'); if(brand)brand.textContent='My Texas Planner';
  const dashTitle=document.querySelector('#dashboard .topbar h1'); if(dashTitle)dashTitle.textContent='My Texas Planner';

  // Add a UT visual to the dashboard using the university wordmark asset.
  const topbar=document.querySelector('#dashboard .topbar');
  if(topbar&&!document.getElementById('utDashboardLogo')){
    const logo=document.createElement('img');
    logo.id='utDashboardLogo';
    logo.alt='The University of Texas at Austin';
    logo.src='https://upload.wikimedia.org/wikipedia/commons/8/8d/University_of_Texas_at_Austin_logo.svg';
    logo.style.cssText='width:min(260px,38vw);max-height:72px;object-fit:contain;object-position:right center;margin-left:auto';
    logo.onerror=()=>logo.style.display='none';
    topbar.appendChild(logo);
  }

  // Rename Notes to Description for user-created calendar events.
  const notes=document.getElementById('eNotes');
  if(notes){
    const field=notes.closest('.field');
    const label=field&&field.querySelector('label');
    if(label)label.textContent='Description';
    notes.placeholder='Add details, location, reminders, or anything else you want to remember...';
  }

  const css=document.createElement('style');
  css.textContent=`
    .event-view-backdrop{position:fixed;inset:0;background:rgba(17,24,39,.58);display:none;align-items:center;justify-content:center;padding:20px;z-index:1000}
    .event-view-backdrop.open{display:flex}.event-view-modal{width:min(620px,100%);max-height:90vh;overflow:auto;background:#fff;border-radius:20px;padding:24px;box-shadow:0 25px 70px rgba(0,0,0,.28)}
    .event-view-head{display:flex;justify-content:space-between;gap:18px;align-items:flex-start;margin-bottom:18px}.event-view-head h2{margin:0;font-size:23px;line-height:1.25}
    .event-view-type{display:inline-block;margin-top:8px;padding:5px 9px;border-radius:999px;font-size:11px;font-weight:800;color:#fff}
    .event-view-grid{display:grid;grid-template-columns:1fr 1fr;gap:13px}.event-view-grid .full{grid-column:1/-1}.event-view-grid label{display:grid;gap:6px;font-size:12px;font-weight:800;color:#4b5563}
    .event-view-grid input,.event-view-grid textarea{width:100%;border:1px solid #d1d5db;border-radius:11px;padding:11px 12px;background:#fff}.event-view-grid textarea{min-height:130px;resize:vertical}
    .event-view-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:18px}.event-detail-click{cursor:pointer}.event-detail-click:hover{background:#faf7f4}
    @media(max-width:600px){.event-view-grid{grid-template-columns:1fr}.event-view-grid .full{grid-column:auto}#utDashboardLogo{display:none}}
  `;
  document.head.appendChild(css);

  const modal=document.createElement('div');
  modal.id='eventViewModal'; modal.className='event-view-backdrop';
  modal.innerHTML=`<div class="event-view-modal"><div class="event-view-head"><div><h2 id="evHeading">Event</h2><span id="evType" class="event-view-type"></span></div><button class="icon-btn" id="evClose">✕</button></div><form id="evEditForm"><div class="event-view-grid"><label class="full">Name<input id="evTitle" required></label><label>Date<input id="evDate" type="date" required></label><label>Time<input id="evTime" type="time"></label><label class="full">Description<textarea id="evDescription" placeholder="Add details about this event..."></textarea></label></div><div class="event-view-actions"><button type="button" class="secondary-btn" id="evCancel">Cancel</button><button class="primary-btn">Save changes</button></div></form></div>`;
  document.body.appendChild(modal);
  document.getElementById('evClose').onclick=()=>modal.classList.remove('open');
  document.getElementById('evCancel').onclick=()=>modal.classList.remove('open');
  modal.addEventListener('click',e=>{if(e.target===modal)modal.classList.remove('open')});

  let editing=null;
  function defaultAssignmentDescription(a){
    const c=courseById(a.courseId); const prep=(typeof assignmentPrep==='function'?assignmentPrep(a):[]);
    let txt=a.notes||'';
    if(prep&&prep.length)txt+=(txt?'\n\n':'')+'What to know / do before this:\n• '+prep.join('\n• ');
    if(c)txt+=(txt?'\n\n':'')+'Course: '+c.code+' — '+c.name;
    return txt;
  }
  function defaultSportsDescription(e){
    const where=e.location?`Location: ${e.location}. `:'';
    const home=(e.location||'').toLowerCase().includes('austin')?'This is a Texas home event. ':'';
    return (e.description||'') || `${where}${home}UT Athletics event. You can edit this description to add tickets, parking, TV information, plans, or other game-day details.`;
  }
  function eventDescription(e){
    if(e.kind==='assignment')return e.description||defaultAssignmentDescription(e);
    if(e.kind==='sport')return e.description||defaultSportsDescription(e);
    return e.description||e.notes||'';
  }
  window.openPlannerEvent=function(e){
    editing=e;
    const type=e.kind==='assignment'?'Assignment':e.kind==='sport'?'UT Sports':'Personal / Calendar Event';
    document.getElementById('evHeading').textContent=e.title||'Event';
    const badge=document.getElementById('evType'); badge.textContent=type; badge.style.background=e.color||'#bf5700';
    document.getElementById('evTitle').value=e.title||'';
    document.getElementById('evDate').value=e.date||e.due||'';
    document.getElementById('evTime').value=e.time||'';
    document.getElementById('evDescription').value=eventDescription(e);
    modal.classList.add('open');
  };

  document.getElementById('evEditForm').onsubmit=function(ev){
    ev.preventDefault(); if(!editing)return;
    const title=document.getElementById('evTitle').value.trim();
    const date=document.getElementById('evDate').value;
    const time=document.getElementById('evTime').value;
    const description=document.getElementById('evDescription').value.trim();
    if(editing.kind==='assignment'){
      const a=data.assignments.find(x=>x.id===editing.id); if(a){a.title=title;a.due=date;a.time=time;a.description=description;a.notes=description;}
      localStorage.setItem(STORAGE_KEY,JSON.stringify(data));
    }else if(editing.kind==='custom'){
      const e=data.events.find(x=>x.id===editing.id); if(e){e.title=title;e.date=date;e.time=time;e.description=description;e.notes=description;}
      localStorage.setItem(STORAGE_KEY,JSON.stringify(data));
    }else if(editing.kind==='sport'){
      sportsOverrides[editing.id]={title,date,time,description,location:editing.location||''};
      localStorage.setItem(SPORTS_OVERRIDES_KEY,JSON.stringify(sportsOverrides));
      const e=utSportsEvents.find(x=>x.id===editing.id); if(e)Object.assign(e,sportsOverrides[editing.id]);
    }
    modal.classList.remove('open');
    if(typeof renderAll==='function')renderAll();
    wireCalendarClicks();
  };

  function eventsForDate(ds){
    const result=[];
    for(const a of data.assignments.filter(a=>a.due===ds)){const c=courseById(a.courseId);result.push({kind:'assignment',id:a.id,title:a.title,date:a.due,time:a.time,color:c?.color||'#6366f1',courseId:a.courseId,notes:a.notes,description:a.description})}
    for(const e of data.events.filter(e=>e.date===ds)){result.push({kind:'custom',...e})}
    if(typeof utSportsEvents!=='undefined')for(const e of utSportsEvents.filter(e=>e.date===ds)){result.push({kind:'sport',...e})}
    return result.sort((a,b)=>(a.time||'').localeCompare(b.time||''));
  }
  function wireCalendarClicks(){
    if(typeof calendarCursor==='undefined')return;
    const y=calendarCursor.getFullYear(),m=calendarCursor.getMonth(),first=new Date(y,m,1),start=new Date(y,m,1-first.getDay());
    document.querySelectorAll('#calendarGrid .day').forEach((day,i)=>{
      const d=new Date(start);d.setDate(start.getDate()+i);const ds=localDateString(d);const evs=eventsForDate(ds);
      day.querySelectorAll('.cal-event').forEach((btn,j)=>{const e=evs[j];if(!e)return;btn.onclick=function(evt){evt.stopPropagation();openPlannerEvent(e)}});
    });
    // Selected-day cards are also clickable.
    const selected=document.getElementById('selectedDayEvents');
    if(selected&&selectedDate){const evs=eventsForDate(selectedDate);selected.querySelectorAll('.event-detail').forEach((el,i)=>{if(evs[i]){el.classList.add('event-detail-click');el.onclick=()=>openPlannerEvent(evs[i])}})}
  }
  const oldRenderCalendar=renderCalendar;
  renderCalendar=function(){oldRenderCalendar();setTimeout(wireCalendarClicks,0)};
  const oldRenderSelectedDay=renderSelectedDay;
  renderSelectedDay=function(){oldRenderSelectedDay();setTimeout(wireCalendarClicks,0)};
  renderCalendar();
})();
