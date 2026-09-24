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

      .kin350-early-alert{margin:0 0 20px;padding:16px 18px;border:3px solid #bf5700;border-left-width:8px;border-radius:14px;background:#fff0dc;box-shadow:0 8px 24px rgba(191,87,0,.16)}
      .kin350-early-alert .alert-kicker{font-size:12px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;color:#8f3f00}
      .kin350-early-alert .alert-main{margin-top:4px;font-size:20px;font-weight:900;color:#4d2500}
      .kin350-early-alert .alert-assignments{margin-top:6px;font-size:14px;font-weight:800;color:#4d2500}
      .item.kin350-early-warning{border:3px solid #bf5700!important;background:#fff0dc!important;box-shadow:0 0 0 4px rgba(191,87,0,.14)!important}
      .item.kin350-early-warning .item-title{font-weight:900!important}
      #assignmentTable tr.kin350-early-warning td{background:#fff0dc!important;border-top:2px solid #bf5700!important;border-bottom:2px solid #bf5700!important;font-weight:700}
      #assignmentTable tr.kin350-early-warning td:first-child{border-left:5px solid #bf5700!important}
      #assignmentTable tr.kin350-early-warning td:nth-child(2) strong{font-weight:900!important}
      .kin350-early-note{display:inline-block;margin-left:7px;padding:4px 8px;border-radius:999px;background:#8f3f00;color:#fff;font-size:10px;font-weight:900;letter-spacing:.04em}
    `;
    document.head.appendChild(style);

    function isKin350EarlyTomorrow(a){
      return !!a && !a.done && a.courseId==='kin350' && a.time==='09:30' && daysUntil(a.due)===1;
    }

    function renderKin350EarlyAlert(){
      const dashboard=document.getElementById('dashboard');
      if(!dashboard)return;
      let alert=document.getElementById('kin350EarlyDueAlert');
      const matches=data.assignments
        .filter(isKin350EarlyTomorrow)
        .sort((a,b)=>(a.due||'').localeCompare(b.due||'')||(a.title||'').localeCompare(b.title||''));

      if(!matches.length){
        if(alert)alert.remove();
        return;
      }

      if(!alert){
        alert=document.createElement('div');
        alert.id='kin350EarlyDueAlert';
        alert.className='kin350-early-alert';
        const topbar=dashboard.querySelector('.topbar');
        if(topbar)topbar.insertAdjacentElement('afterend',alert);
        else dashboard.prepend(alert);
      }

      alert.innerHTML=`
        <div class="alert-kicker">⚠️ KIN 350 EARLY DEADLINE</div>
        <div class="alert-main">Due tomorrow at <strong>9:30 AM</strong></div>
        <div class="alert-assignments">${matches.map(a=>escapeHtml(a.title)).join(' · ')}</div>
      `;
    }

    const baseRenderDashboard = renderDashboard;
    renderDashboard = function(){
      baseRenderDashboard();
      renderKin350EarlyAlert();

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
        const kin350Early=isKin350EarlyTomorrow(a);
        el.classList.toggle('due-soon',dueSoon);
        el.classList.toggle('kin350-early-warning',kin350Early);
        const title=el.querySelector('.item-title');
        if(title){
          title.querySelectorAll('.due-soon-note,.kin350-early-note').forEach(x=>x.remove());
          if(kin350Early){
            const tag=document.createElement('span');
            tag.className='kin350-early-note';
            tag.textContent='⚠️ DUE TOMORROW · 9:30 AM';
            title.appendChild(tag);
          }else if(dueSoon){
            const tag=document.createElement('span');
            tag.className='due-soon-note';
            tag.textContent=d===0?'DUE TODAY':'DUE TOMORROW';
            title.appendChild(tag);
          }
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
        const kin350Early=isKin350EarlyTomorrow(a);
        tr.classList.toggle('due-soon',dueSoon);
        tr.classList.toggle('kin350-early-warning',kin350Early);
        const titleCell=tr.querySelector('td:nth-child(2) strong');
        if(titleCell){
          titleCell.querySelectorAll('.due-soon-note,.kin350-early-note').forEach(x=>x.remove());
          if(kin350Early){
            const tag=document.createElement('span');
            tag.className='kin350-early-note';
            tag.textContent='⚠️ DUE TOMORROW · 9:30 AM';
            titleCell.appendChild(tag);
          }else if(dueSoon){
            const tag=document.createElement('span');
            tag.className='due-soon-note';
            tag.textContent=d===0?'DUE TODAY':'DUE TOMORROW';
            titleCell.appendChild(tag);
          }
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
