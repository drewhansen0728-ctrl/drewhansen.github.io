// Forty Acres Planner live enhancements
// This file is loaded by the wrapper page and injected into app.html.
(function(){
  function install(){
    if (window.__fortyAcresEnhancementsInstalled) return;
    window.__fortyAcresEnhancementsInstalled = true;

    const style = document.createElement('style');
    style.textContent = `
      .item.due-soon{border:2px solid #bf5700!important;background:#fff7f0!important;box-shadow:0 0 0 3px rgba(191,87,0,.08)!important}
      #assignmentTable tr.due-soon td{background:#fff7f0!important;border-top:1px solid #bf5700!important;border-bottom:1px solid #bf5700!important}
      #assignmentTable tr.due-soon td:first-child{border-left:3px solid #bf5700!important}
      .due-soon-note{display:inline-block;margin-left:6px;padding:3px 7px;border-radius:999px;background:#bf5700;color:#fff;font-size:10px;font-weight:800;letter-spacing:.02em}
    `;
    document.head.appendChild(style);

    const baseRenderDashboard = renderDashboard;
    renderDashboard = function(){
      baseRenderDashboard();

      const open = data.assignments.filter(a=>!a.done);
      const twoWeeks = open.filter(a=>{const d=daysUntil(a.due);return d>=0&&d<=14}).length;
      const stat = document.getElementById('statOpen');
      if(stat){
        stat.textContent = twoWeeks;
        const card = stat.closest('.stat-card');
        if(card){
          const label = card.querySelector('.label');
          const sub = card.querySelector('.sub');
          if(label) label.textContent = 'Next 2 Weeks';
          if(sub) sub.textContent = 'Open assignments due in the next 14 days';
        }
      }

      const upcoming=[...open].filter(a=>a.due).sort((a,b)=>a.due.localeCompare(b.due)||(a.time||'').localeCompare(b.time||'')).slice(0,7);
      document.querySelectorAll('#upcomingList .item').forEach((el,i)=>{
        const a=upcoming[i];
        if(!a)return;
        const d=daysUntil(a.due);
        const dueSoon=d>=0&&d<=1;
        el.classList.toggle('due-soon',dueSoon);
        const title=el.querySelector('.item-title');
        if(title){
          const old=title.querySelector('.due-soon-note');
          if(old)old.remove();
          if(dueSoon){const tag=document.createElement('span');tag.className='due-soon-note';tag.textContent=d===0?'DUE TODAY':'DUE TOMORROW';title.appendChild(tag)}
        }
      });
    };

    const baseRenderAssignments = renderAssignments;
    renderAssignments = function(){
      baseRenderAssignments();
      const rows=[...data.assignments].sort((a,b)=>{if(a.done!==b.done)return a.done?1:-1;if(!a.due&&b.due)return 1;if(a.due&&!b.due)return -1;return(a.due||'').localeCompare(b.due||'')});
      document.querySelectorAll('#assignmentTable tr').forEach((tr,i)=>{
        const a=rows[i];
        if(!a)return;
        const d=daysUntil(a.due);
        const dueSoon=!a.done&&d>=0&&d<=1;
        tr.classList.toggle('due-soon',dueSoon);
        const titleCell=tr.querySelector('td:nth-child(2) strong');
        if(titleCell){
          const old=titleCell.querySelector('.due-soon-note');
          if(old)old.remove();
          if(dueSoon){const tag=document.createElement('span');tag.className='due-soon-note';tag.textContent=d===0?'DUE TODAY':'DUE TOMORROW';titleCell.appendChild(tag)}
        }
      });
    };

    renderDashboard();
    renderAssignments();

    let lastPlannerDate = localDateString(new Date());
    setInterval(()=>{
      const nowDate = localDateString(new Date());
      if(nowDate!==lastPlannerDate){
        lastPlannerDate=nowDate;
        renderDashboard();
        renderAssignments();
        if(typeof renderCalendar==='function')renderCalendar();
        if(typeof renderMiniCalendar==='function')renderMiniCalendar();
      }
    },60000);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);
  else install();
})();
