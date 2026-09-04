// Unique calendar colors for every course/category.
(function(){
  const courseColors={adv:'#6f2c91',ast:'#005f86',kin350:'#2e7d32',kin316:'#f2a900',ugs:'#00a9b7'};
  const categoryColors={Personal:'#e91e63',Work:'#455a64',Social:'#c62828',Health:'#00897b',Other:'#795548'};
  const sportsColor='#bf5700';
  try{
    Object.assign(categories,categoryColors);
    for(const c of data.courses||[]){if(courseColors[c.id])c.color=courseColors[c.id]}
    for(const e of data.events||[]){
      if(categoryColors[e.category])e.color=categoryColors[e.category];
      else if(courseColors[e.category])e.color=courseColors[e.category];
    }
    if(typeof utSportsEvents!=='undefined')for(const e of utSportsEvents)e.color=sportsColor;
    localStorage.setItem(STORAGE_KEY,JSON.stringify(data));
    if(typeof renderAll==='function')renderAll();
  }catch(err){console.error('Calendar color update failed',err)}
})();
