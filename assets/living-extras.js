'use strict';
/* Daughter of the Moon Wiki: additive UI improvements only. No content data is changed on load. */
(function () {
  let strandPage = 0;
  let strandMotion = true;
  const THREADS_PER_PAGE = 8;
  const MAP_STYLES = [
    {id:'cartographer',name:'Cartographer',hint:'Ink, parchment & contour lines'},
    {id:'moonlit',name:'Moonlit coast',hint:'Celestial blue & silver'},
    {id:'woodland',name:'Verdant wilds',hint:'Woods, rivers & hills'},
    {id:'highlands',name:'Highland roads',hint:'Ochre passes & stone'},
    {id:'shadow',name:'Shadow realm',hint:'Twilight violet & ash'}
  ];
  const REGION_PRESETS = [
    {id:'greater-threskel',name:'Greater Threskel',subtitle:'A regional canvas for the roads beyond Thamor',layout:'highlands'},
    {id:'forgotten-roads',name:'Forgotten Roads',subtitle:'A blank atlas for settlements and byways',layout:'cartographer'},
    {id:'moonfall-waters',name:'Moonfall Waters',subtitle:'Chart discoveries beneath moonlit waves',layout:'moonlit'},
    {id:'verdant-wilds',name:'Verdant Wilds',subtitle:'Explore the forests and hidden groves',layout:'woodland'}
  ];
  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if(cls) n.className=cls;
    if(text!==undefined) n.textContent=text;
    return n;
  };
  const labelOf=id=>article(id)?.title||id;
  const getRegion=()=>atlasData().regions.find(r=>r.id===currentRegion);
  const activeStyle=()=>MAP_STYLES.find(t=>t.id===getRegion()?.layout)?.id ||
    (currentRegion==='shadow'?'shadow':currentRegion==='coast'?'moonlit':currentRegion==='threskel'?'highlands':'cartographer');
  const safeId=name=>name.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,50);
  const makeButton=(text,cls,handler)=>{const b=el('button',cls,text);b.type='button';b.addEventListener('click',handler);return b;};

  function relatedTo(id) {
    const found=new Map();
    function put(other,label,kind) {if(other!==id&&article(other)&&!found.has(other))found.set(other,{id:other,label:label||'Related story',kind});}
    for(const c of atlasData().connections||[]) {
      if(c.from===id)put(c.to,c.label,'explicit');
      if(c.to===id)put(c.from,c.label,'explicit');
    }
    const current=article(id);
    if(current) {
      for(const a of linkedIdSet(current))put(a,'Mentioned here','reference');
      for(const a of backlinks(current))put(a.id,'Links to this entry','reference');
    }
    return [...found.values()].sort((a,b)=>(a.kind===b.kind?0:a.kind==='explicit'?-1:1)||labelOf(a.id).localeCompare(labelOf(b.id)));
  }

  function helixSVG(items, focusId) {
    const ns='http://www.w3.org/2000/svg';
    const svg=document.createElementNS(ns,'svg');
    svg.setAttribute('viewBox','0 0 600 680');
    svg.setAttribute('preserveAspectRatio','xMidYMid meet');
    svg.setAttribute('class','dna-svg');
    svg.setAttribute('role','group');
    svg.setAttribute('aria-label','Interactive double helix of related wiki entries');
    const s=(tag,attrs,parent=svg)=>{const x=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs||{}))x.setAttribute(k,String(v));parent.append(x);return x;};
    const defs=s('defs');
    const grad=s('linearGradient',{id:'strandGoldGradient',x1:'0',y1:'0',x2:'0',y2:'1'},defs);
    s('stop',{offset:'0%','stop-color':'#a3dbe9'},grad);
    s('stop',{offset:'50%','stop-color':'#e9c788'},grad);
    s('stop',{offset:'100%','stop-color':'#c0a5f4'},grad);
    const shade=s('linearGradient',{id:'strandPurpleGradient',x1:'0',y1:'0',x2:'0',y2:'1'},defs);
    s('stop',{offset:'0%','stop-color':'#ccb7e8'},shade);
    s('stop',{offset:'100%','stop-color':'#6bb9cf'},shade);
    const yMin=85, yMax=588;
    const sideX=(side,y)=>{
      const turn=(y-yMin)/(yMax-yMin)*Math.PI*2.7;
      return 300+(side===0?-1:1)*145*Math.cos(turn);
    };
    const pathOf=side=>{const bits=[];for(let y=45;y<=632;y+=8)bits.push((bits.length?'L':'M')+sideX(side,y).toFixed(1)+' '+y);return bits.join(' ')};
    for(let y=75;y<=605;y+=37){const line=s('line',{x1:sideX(0,y),y1:y,x2:sideX(1,y),y2:y,class:'dna-rung'});const hint=s('title',{},line);hint.textContent='A shared thread in the story';}
    s('path',{d:pathOf(0),class:'dna-rail gold'});
    s('path',{d:pathOf(1),class:'dna-rail blue'});
    const displayed=items.length;
    items.forEach((rel,i)=>{
      const p=article(rel.id);
      if(!p)return;
      const count=Math.max(3,displayed);
      const y=105 + i*470/Math.max(1,count-1);
      const x=sideX(i%2,y),side=i%2;
      const group=s('g',{class:'dna-node '+(side?'aqua':'amber'),role:'button',tabindex:'0','aria-label':'Follow '+p.title});
      s('circle',{cx:x,cy:y,r:31,class:'dna-node-halo'},group);
      s('circle',{cx:x,cy:y,r:23,class:'dna-node-core'},group);
      const glyph=s('text',{x,y:y+8,'text-anchor':'middle',class:'dna-node-icon'},group);glyph.textContent=iconFor(p);
      const label=s('text',{x:x+(x<300?37:-37),y:y+6,'text-anchor':x<300?'start':'end',class:'dna-node-text'},group);
      label.textContent=p.title.length>17?p.title.slice(0,16)+'…':p.title;
      const tip=s('title',{},group);tip.textContent=p.title+' — '+rel.label;
      const navigate=()=>{graphFocus=rel.id;strandPage=0;renderConnections()};
      group.addEventListener('click',navigate);
      group.addEventListener('keydown',ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();navigate()}});
    });
    const core=s('g',{class:'dna-core','aria-hidden':'true'});
    s('circle',{cx:300,cy:340,r:45,class:'dna-core-glow'},core);
    s('circle',{cx:300,cy:340,r:25,class:'dna-core-circle'},core);
    const moon=s('text',{x:300,y:348,'text-anchor':'middle',class:'dna-center-glyph'},core);moon.textContent='☾';
    return svg;
  }

  // Replace only the graph's presentation. The original editor and data model stay intact.
  renderConnections=function () {
    const main=document.getElementById('main');
    if(!main)return;
    const focus=article(graphFocus)||article('the-four-seasons')||database.pages[0];
    if(!focus)return;
    graphFocus=focus.id;
    const relatives=relatedTo(focus.id);
    const pages=Math.max(1,Math.ceil(relatives.length/THREADS_PER_PAGE));
    strandPage=Math.min(Math.max(0,strandPage),pages-1);
    const visible=relatives.slice(strandPage*THREADS_PER_PAGE,(strandPage+1)*THREADS_PER_PAGE);
    main.replaceChildren(livingHeader('THE THREADS OF FATE','The Moonweave','Explore the living strands connecting people, places, mysteries and history. Each thread opens another chapter.'));
    const bar=el('div','dna-toolbar');
    const pick=el('select','focus-select dna-focus-select');pick.setAttribute('aria-label','Choose a focused article');articleOptions(pick);pick.value=graphFocus;
    pick.addEventListener('change',()=>{graphFocus=pick.value;strandPage=0;renderConnections()});
    const findWrap=el('div','dna-lookup'), search=el('input','dna-search');search.type='search';search.placeholder='Find any character, place or story…';search.setAttribute('aria-label','Search wiki entries to focus');
    const results=el('div','dna-find-results');results.hidden=true;
    search.addEventListener('input',()=>{
      const query=search.value.trim().toLowerCase();results.replaceChildren();
      if(!query){results.hidden=true;return}
      const matches=database.pages.filter(p=>(p.title+' '+(p.summary||'')).toLowerCase().includes(query)).slice(0,7);
      if(!matches.length)results.append(el('p','','No matching entries'));
      for(const p of matches) results.append(makeButton(p.title,'dna-suggestion',()=>{graphFocus=p.id;strandPage=0;renderConnections()}));
      results.hidden=false;
    });
    findWrap.append(search,results);
    bar.append(findWrap,pick,makeButton('✧ Manage relationships','btn outline mini',()=>openConnectionEditor()));main.append(bar);
    const content=el('div','dna-layout');
    const stage=el('section','dna-stage'+(strandMotion?'':' motion-paused'));stage.setAttribute('aria-label','Double helix navigation');
    const stHead=el('div','dna-stage-heading');
    stHead.append(el('span','eyebrow','THE LIVING HELIX'),el('strong','',focus.title),el('small','',`${relatives.length} known connections · ${strandPage+1} / ${pages}`));
    stage.append(stHead,helixSVG(visible,focus.id));
    const nav=el('div','dna-controls');
    const prev=makeButton('← Earlier threads','dna-nav-btn',()=>{strandPage=Math.max(0,strandPage-1);renderConnections()});prev.disabled=strandPage===0;
    const next=makeButton('More threads →','dna-nav-btn',()=>{strandPage=Math.min(pages-1,strandPage+1);renderConnections()});next.disabled=strandPage===pages-1;
    const motion=makeButton(strandMotion?'Ⅱ Pause motion':'▶ Resume motion','dna-nav-btn dna-motion',()=>{strandMotion=!strandMotion;renderConnections()});
    nav.append(prev,motion,next);stage.append(nav);
    const note=el('p','dna-hint','Tap a glowing node to follow it · Use the list for quick access');stage.append(note);
    let startX=null;
    stage.addEventListener('touchstart',e=>{startX=e.touches[0]?.clientX??null},{passive:true});
    stage.addEventListener('touchend',e=>{if(startX===null)return;const delta=(e.changedTouches[0]?.clientX??startX)-startX;startX=null;if(Math.abs(delta)<85)return;if(delta<0&&strandPage<pages-1){strandPage++;renderConnections()}else if(delta>0&&strandPage>0){strandPage--;renderConnections()}},{passive:true});
    stage.addEventListener('keydown',e=>{if(e.target.closest('.dna-node'))return;if(e.key==='ArrowRight'&&strandPage<pages-1){strandPage++;renderConnections()}if(e.key==='ArrowLeft'&&strandPage>0){strandPage--;renderConnections()}});
    stage.tabIndex=0;
    const detail=el('aside','dna-detail');
    detail.append(el('div','eyebrow','CURRENT THREAD'),el('h2','',focus.title),el('p','dna-summary',focus.summary||'This article is part of the campaign archive.'));
    const links=el('div','dna-actions');const open=el('a','btn primary mini','Read full entry ↗');open.href=qPage(focus.id);links.append(open,makeButton('＋ Add link','btn outline mini',()=>openConnectionEditor()));detail.append(links);
    detail.append(el('h3','','Linked stories'));
    const list=el('div','dna-relations');
    if(!relatives.length)list.append(el('p','dna-no-links','No known relationships yet. Use Add link to connect this entry to the story.'));
    for(const relation of relatives){const p=article(relation.id);const b=makeButton('', 'dna-relation',()=>{graphFocus=relation.id;strandPage=0;renderConnections()});
      b.append(el('span','dna-relation-glyph',iconFor(p)),el('span','dna-relation-body'));
      b.lastChild.append(el('strong','',p.title),el('small','',relation.label));list.append(b)}
    detail.append(list);content.append(stage,detail);main.append(content);
    rightSidebar(null);updateNav('connections');
  };

  // Extend the existing, editable atlas without replacing any original locations or routes.
  const oldMapCanvas=mapCanvas;
  mapCanvas=function(){const surface=oldMapCanvas();const style=activeStyle();surface.classList.add('map-skin-'+style);
    if(!['coast','threskel','shadow'].includes(currentRegion)){
      const outdated=surface.querySelectorAll('.shadow-haze,.shadow-halo');outdated.forEach(n=>n.remove());
      const svg=surface.querySelector('.atlas-paths');
      if(svg){const ns='http://www.w3.org/2000/svg';const deco=document.createElementNS(ns,'path');deco.setAttribute('d','M -20 455 C 145 275 255 418 410 328 S 710 243 1020 140 L 1050 670 L -20 680 Z');deco.setAttribute('class','landmass region-generic-land');svg.insertBefore(deco,svg.firstChild)}
    }
    return surface;
  };
  const originalRenderAtlas=renderAtlas;
  renderAtlas=function(){originalRenderAtlas();const main=document.getElementById('main');const tools=main?.querySelector('.living-tools');if(!tools)return;
    const region=getRegion();const extras=el('div','atlas-custom-tools');
    const chooser=el('label','map-style-selector');chooser.append(el('span','','Map artwork'));
    const select=el('select','focus-select');select.setAttribute('aria-label','Choose map background style');
    for(const style of MAP_STYLES){const opt=el('option','',style.name);opt.value=style.id;select.append(opt)}select.value=activeStyle();
    select.addEventListener('change',()=>{
      const layout=select.value;
      if(setLivingDraft(()=>{const selected=getRegion();if(selected)selected.layout=layout},'Map layout saved locally. Publish to share with players.'))renderAtlas();
    });chooser.append(select);extras.append(chooser);
    const create=el('details','new-map-panel');const toggle=el('summary','','＋ New regional map');create.append(toggle);
    const form=el('div','new-map-form');const presets=el('select','focus-select');presets.setAttribute('aria-label','Map template');
    for(const p of REGION_PRESETS){const o=el('option','',p.name);o.value=p.id;presets.append(o)}const customOption=el('option','','Custom map…');customOption.value='custom';presets.append(customOption);
    const title=el('input','');title.type='text';title.maxLength=80;title.placeholder='Map name (for custom maps)';title.setAttribute('aria-label','Custom map name');title.hidden=true;
    presets.addEventListener('change',()=>{title.hidden=presets.value!=='custom'});
    const add=makeButton('Create empty map','btn primary mini',()=>{
      const preset=REGION_PRESETS.find(p=>p.id===presets.value);
      const name=preset?.name||title.value.trim();const id=preset?.id||safeId(name);
      if(!name||!id){localize('Give the new map a name.');return}
      if(atlasData().regions.some(r=>r.id===id)){currentRegion=id;selectedPin=null;renderAtlas();localize('That map already exists; showing it now.');return}
      if(setLivingDraft(()=>{database.atlas.regions.push({id,name,subtitle:preset?.subtitle||'An editable regional map',layout:preset?.layout||'cartographer'})},'New blank map added. Add places using Edit map & routes.')){currentRegion=id;selectedPin=null;renderAtlas()}
    });form.append(presets,title,add);create.append(form);extras.append(create);
    extras.append(makeButton('✎ Rename map','btn outline mini',()=>{
      const current=getRegion();if(!current)return;
      const proposed=prompt('Rename this regional map:',current.name);
      if(proposed===null)return;
      const value=proposed.trim();
      if(!value||value.length>80){localize('Map names must be 1–80 characters.');return}
      if(setLivingDraft(()=>{current.name=value},'Map name saved as a local draft.'))renderAtlas();
    }));
    tools.append(extras);
    const map=main.querySelector('.atlas-surface');if(map){const key=el('div','map-style-name',MAP_STYLES.find(x=>x.id===activeStyle())?.name||'');map.append(key)}
    const tabList=main.querySelector('.living-tabs');if(tabList)tabList.setAttribute('aria-label','Choose a regional map');
  };
})();
