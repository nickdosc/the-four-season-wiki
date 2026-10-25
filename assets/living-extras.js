'use strict';
/* Daughter of the Moon Wiki: additive UI improvements only. No content data is changed on load. */
(function () {
  let constellationPage = 0;
  let constellationMotion = true;
  const THREADS_PER_PAGE = 7;
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
    if(cls) n.className = cls;
    if(text !== undefined) n.textContent = text;
    return n;
  };
  const labelOf = id => article(id)?.title || id;
  const getRegion = () => atlasData().regions.find(r => r.id === currentRegion);
  const activeStyle = () => MAP_STYLES.find(t => t.id === getRegion()?.layout)?.id ||
    (currentRegion === 'shadow' ? 'shadow' : currentRegion === 'coast' ? 'moonlit' : currentRegion === 'threskel' ? 'highlands' : 'cartographer');
  const safeId = name => name.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50);
  const makeButton = (text, cls, handler) => { const b = el('button', cls, text); b.type = 'button'; b.addEventListener('click', handler); return b; };

  // Navigation stays entirely in memory. No wiki content or browser history is modified.
  const starHistory = [];
  function followStar(nextId) {
    const next = article(nextId);
    if(!next || graphFocus === next.id) return;
    const current = article(graphFocus);
    if(current) {
      starHistory.push({id:current.id,page:constellationPage});
      if(starHistory.length > 50) starHistory.shift();
    }
    graphFocus = next.id;
    constellationPage = 0;
    renderConnections();
  }
  function backToStar() {
    while(starHistory.length) {
      const previous = starHistory.pop();
      if(article(previous.id)) {
        graphFocus = previous.id;
        constellationPage = previous.page;
        renderConnections();
        return;
      }
    }
  }

  function relatedTo(id) {
    const found = new Map();
    function put(other, label, kind) {
      if(other !== id && article(other) && !found.has(other)) found.set(other, {id: other, label: label || 'Related story', kind});
    }
    for(const c of atlasData().connections || []) {
      if(c.from === id) put(c.to, c.label, 'explicit');
      if(c.to === id) put(c.from, c.label, 'explicit');
    }
    const current = article(id);
    if(current) {
      for(const a of linkedIdSet(current)) put(a, 'Mentioned here', 'reference');
      for(const a of backlinks(current)) put(a.id, 'Links to this entry', 'reference');
    }
    return [...found.values()].sort((a, b) => (a.kind === b.kind ? 0 : a.kind === 'explicit' ? -1 : 1) || labelOf(a.id).localeCompare(labelOf(b.id)));
  }

  function starClass(index) {
    return index % 3 === 0 ? 'gold' : index % 3 === 1 ? 'ice' : 'violet';
  }

  function seededStars(seedText) {
    let seed = 0;
    for(const ch of seedText) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
    const stars = [];
    for(let i = 0; i < 62; i++) {
      seed = (1664525 * seed + 1013904223) >>> 0;
      const x = 32 + (seed % 720);
      seed = (1664525 * seed + 1013904223) >>> 0;
      const y = 40 + (seed % 560);
      seed = (1664525 * seed + 1013904223) >>> 0;
      const r = 0.8 + ((seed % 21) / 10);
      stars.push({x, y, r});
    }
    return stars;
  }

  // Fixed landscape constellation layout. Each nameplate stays wholly inside the canvas.
  // No force simulation, hover movement, or large moving backgrounds: stable hit areas.
  const STAR_POINTS = [
    [205,170], [505,125], [875,145], [1055,283],
    [925,465], [575,505], [245,438]
  ];
  const SVG_W = 1260, SVG_H = 630, CX = 630, CY = 304;
  function shortLines(value) {
    const words = String(value || '').trim().split(/\s+/);
    const lines = [''];
    for (const word of words) {
      const line = lines.length - 1;
      if ((lines[line] + ' ' + word).trim().length <= 22 || !lines[line]) {
        lines[line] = (lines[line] + ' ' + word).trim();
      } else if (lines.length < 2) {
        lines.push(word);
      } else {
        lines[1] += ' ' + word;
      }
    }
    if(lines[1] && lines[1].length > 24) lines[1] = lines[1].slice(0, 23).trimEnd() + '…';
    if(lines[0].length > 24) lines[0] = lines[0].slice(0, 23).trimEnd() + '…';
    return lines;
  }
  function constellationSVG(items, focus) {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns,'svg');
    svg.setAttribute('viewBox', `0 0 ${SVG_W} ${SVG_H}`);
    svg.setAttribute('preserveAspectRatio','xMidYMid meet');
    svg.setAttribute('class','sky-chart');
    svg.setAttribute('role','group');
    svg.setAttribute('aria-label',`Constellation centered on ${focus.title}. Select any connected star to explore it.`);
    const make = (tag, attrs={}, parent=svg) => {
      const n = document.createElementNS(ns,tag);
      for(const [k,v] of Object.entries(attrs)) n.setAttribute(k,String(v));
      parent.append(n);return n;
    };
    const defs = make('defs');
    const grad = make('linearGradient',{id:'sky-thread-gradient',x1:'0%',y1:'0%',x2:'100%',y2:'100%'},defs);
    make('stop',{offset:'0%','stop-color':'#e3c99a'},grad);
    make('stop',{offset:'55%','stop-color':'#98cdec'},grad);
    make('stop',{offset:'100%','stop-color':'#bca5e0'},grad);
    for(const [i,star] of seededStars(focus.id + ':' + items.map(x=>x.id).join(',')).entries()){
      const point=make('circle',{cx:star.x*1.57+14,cy:star.y*.95+18,r:star.r*.7,fill:i%4?'#d3e2f1':'#f4d7a1',opacity:Math.min(.62,.19+star.r*.13)});
      if(i%7===0) { point.setAttribute('class','sky-twinkle'); point.style.animationDelay=`-${(i%5)*1.4}s`; }
    }
    // Decorative guide rings do not obscure any article node or label.
    for(const r of [155,278,410]) make('circle',{cx:CX,cy:CY,r,class:'sky-guide'});
    const positions=items.map((item,i)=>({item,x:STAR_POINTS[i][0],y:STAR_POINTS[i][1]}));
    for(const [i,pos] of positions.entries()) {
      make('line',{x1:CX,y1:CY,x2:pos.x,y2:pos.y,class:'sky-ray '+(pos.item.kind==='explicit'?'sky-explicit':'sky-reference')});
      if(i>0 && i%2===0) make('line',{x1:positions[i-1].x,y1:positions[i-1].y,x2:pos.x,y2:pos.y,class:'sky-secondary'});
    }
    // Four tiny wandering lights trace established links. These animate transform
    // and opacity only; no full-canvas paint or continuously moving background.
    for(const [i,pos] of positions.entries()) {
      if(i % 2 !== 0) continue;
      const glint=make('circle',{cx:CX,cy:CY,r:3,class:'sky-thread-glint','aria-hidden':'true'});
      glint.style.setProperty('--drift-x',`${pos.x-CX}px`);
      glint.style.setProperty('--drift-y',`${pos.y-CY}px`);
      glint.style.setProperty('--glint-delay',`${-i*1.35}s`);
      glint.style.setProperty('--glint-duration',`${8+i%3}s`);
    }
    // A small fixed focal star. All connected nodes orbit outside its radius.
    const hub=make('g',{'aria-label':`Current focus: ${focus.title}`});
    make('circle',{cx:CX,cy:CY,r:62,class:'sky-focus-ring'},hub);
    make('circle',{cx:CX,cy:CY,r:39,class:'sky-focus-core'},hub);
    const focusIcon=make('text',{x:CX,y:CY+10,'text-anchor':'middle',class:'sky-focus-icon'},hub);
    focusIcon.textContent=iconFor(focus);
    make('rect',{x:CX-113,y:CY+54,width:226,height:40,rx:12,class:'sky-focus-nameplate'},hub);
    const focusName=make('text',{x:CX,y:CY+80,'text-anchor':'middle',class:'sky-focus-name'},hub);
    focusName.textContent=focus.title.length>24?focus.title.slice(0,23)+'…':focus.title;
    for(const [i,pos] of positions.entries()) {
      const page=article(pos.item.id);
      if(!page)continue;
      const lines=shortLines(page.title);
      const group=make('g',{class:'sky-node sky-'+(i%3===0?'gold':i%3===1?'ice':'violet'),role:'button',tabindex:'0','aria-label':'Explore '+page.title});
      // The invisible click target never changes size when hovered or animated.
      make('circle',{cx:pos.x,cy:pos.y,r:47,class:'sky-hit'},group);
      make('circle',{cx:pos.x,cy:pos.y,r:36,class:'sky-node-halo'},group);
      make('circle',{cx:pos.x,cy:pos.y,r:27,class:'sky-node-core'},group);
      const icon=make('text',{x:pos.x,y:pos.y+8,'text-anchor':'middle',class:'sky-node-icon'},group);icon.textContent=iconFor(page);
      const labelY=pos.y+51;
      make('rect',{x:pos.x-111,y:labelY,width:222,height:lines.length>1?60:41,rx:11,class:'sky-nameplate'},group);
      for(const [j,text] of lines.entries()) {
        const t=make('text',{x:pos.x,y:labelY+(lines.length>1?24:27)+j*23,'text-anchor':'middle',class:'sky-node-label'},group);
        t.textContent=text;
      }
      make('title',{},group).textContent=page.title+' — '+pos.item.label;
      let activating=false;
      const navigate=()=>{
        if(activating)return;
        activating=true;
        group.classList.add('sky-selected');
        const go=()=>followStar(page.id);
        const noMotion=window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if(noMotion)go();else setTimeout(go,170);
      };
      group.addEventListener('click',navigate);
      group.addEventListener('keydown',ev=>{
        if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();navigate();}
      });
    }
    return svg;
  }

  renderConnections=function(){
    const main=document.getElementById('main');if(!main)return;
    const focus=article(graphFocus)||article('the-four-seasons')||database.pages[0];if(!focus)return;
    graphFocus=focus.id;
    const relatives=relatedTo(focus.id);
    const pages=Math.max(1,Math.ceil(relatives.length/THREADS_PER_PAGE));
    constellationPage=Math.min(Math.max(0,constellationPage),pages-1);
    const visible=relatives.slice(constellationPage*THREADS_PER_PAGE,(constellationPage+1)*THREADS_PER_PAGE);
    main.replaceChildren(livingHeader('THE THREADS OF FATE','The Constellation Atlas','A living chart of shared stories. Follow a star to reveal its connections, or search for anyone in the campaign.'));
    const toolbar=el('div','sky-toolbar');
    const searchWrap=el('div','sky-search-wrap');
    const search=el('input','sky-search');search.type='search';search.placeholder='Find a character, location or chapter…';search.setAttribute('aria-label','Search wiki entries to focus');
    const matchesBox=el('div','sky-search-results');matchesBox.hidden=true;
    search.addEventListener('input',()=>{
      const query=search.value.trim().toLowerCase();matchesBox.replaceChildren();
      if(!query){matchesBox.hidden=true;return;}
      const found=database.pages.filter(p=>(p.title+' '+(p.summary||'')).toLowerCase().includes(query)).slice(0,8);
      if(!found.length) matchesBox.append(el('p','','No matching entries'));
      for(const p of found)matchesBox.append(makeButton(p.title,'sky-search-result',()=>followStar(p.id)));
      matchesBox.hidden=false;
    });
    searchWrap.append(search,matchesBox);
    const pick=el('select','focus-select sky-pick');pick.setAttribute('aria-label','Choose a focused article');articleOptions(pick);pick.value=graphFocus;
    pick.addEventListener('change',()=>followStar(pick.value));
    const latest = starHistory[starHistory.length-1];
    const back = makeButton(latest ? '← Back to ' + (labelOf(latest.id).length > 24 ? labelOf(latest.id).slice(0,23) + '…' : labelOf(latest.id)) : '← Back to previous star', 'sky-control', backToStar);
    back.disabled = !latest;
    back.setAttribute('aria-label',latest ? 'Back to previous star: ' + labelOf(latest.id) : 'No previous star to return to');
    if(latest) back.title = 'Return to ' + labelOf(latest.id);
    toolbar.append(back,searchWrap,pick,makeButton('✧ Edit relationships','btn outline sky-edit-btn',()=>openConnectionEditor()));
    main.append(toolbar);

    const layout=el('div','sky-layout');
    const scene=el('section','sky-scene');scene.setAttribute('aria-label','Interactive landscape constellation map');
    const head=el('div','sky-scene-heading');
    head.append(el('span','eyebrow','THE LIVING SKY'),el('strong','',focus.title),el('small','',`${relatives.length} connections · page ${constellationPage+1} of ${pages}`));scene.append(head);
    scene.append(el('p','sky-mobile-hint','Swipe sideways to explore the wide constellation, or use the linked-story list above.'));
    const viewport=el('div','sky-viewport');viewport.tabIndex=0;viewport.setAttribute('aria-label','Scrollable constellation. Move sideways on smaller screens to explore stars.');
    viewport.append(constellationSVG(visible,focus));scene.append(viewport);
    const controls=el('div','sky-controls');
    const previous=makeButton('← Previous stars','sky-control',()=>{constellationPage=Math.max(0,constellationPage-1);renderConnections()});previous.disabled=constellationPage===0;
    const next=makeButton('Next stars →','sky-control',()=>{constellationPage=Math.min(pages-1,constellationPage+1);renderConnections()});next.disabled=constellationPage===pages-1;
    const motion=makeButton(constellationMotion?'✧ Pause twinkle':'✦ Resume twinkle','sky-control',()=>{constellationMotion=!constellationMotion;renderConnections()});
    controls.append(previous,el('span','sky-control-status',`${visible.length} of ${relatives.length} connections`),motion,next);scene.append(controls);
    const hint=el('p','sky-hint','Select a star to explore its story. On phones, swipe the chart sideways or use the relationship cards below.');scene.append(hint);
    if(!constellationMotion)scene.classList.add('sky-static');
    const details=el('section','sky-story');details.setAttribute('aria-label','Selected story and relationships');
    const summary=el('div','sky-story-summary');
    summary.append(el('div','eyebrow','IN FOCUS'),el('h2','',focus.title),el('p','',focus.summary||'This article is part of the campaign archive.'));
    const actions=el('div','sky-actions');const read=el('a','btn primary','Read full article ↗');read.href=qPage(focus.id);
    actions.append(read,makeButton('＋ Add connection','btn outline',()=>openConnectionEditor()));summary.append(actions);details.append(summary);
    const linked=el('div','sky-story-links');linked.append(el('h3','','Follow another story · '+relatives.length));
    const list=el('div','sky-card-grid');
    if(!relatives.length)list.append(el('p','sky-empty','No links yet. Add a relationship to connect this story to the campaign.'));
    for(const rel of relatives){const p=article(rel.id);if(!p)continue;
      const b=makeButton('','sky-story-card',()=>followStar(rel.id));
      b.append(el('span','sky-story-icon',iconFor(p)));
      const body=el('span','sky-story-text');body.append(el('strong','',p.title),el('small','',rel.label));b.append(body);list.append(b);
    }
    linked.append(list);details.append(linked);
    layout.append(scene,details);main.append(layout);
    // Keep keyboard, touch, and scrolling predictable without trapping focus.
    viewport.addEventListener('keydown',e=>{
      if(e.target!==viewport)return;
      if(e.key==='ArrowLeft')viewport.scrollBy({left:-180,behavior:'smooth'});
      if(e.key==='ArrowRight')viewport.scrollBy({left:180,behavior:'smooth'});
    });
    const mobile=window.matchMedia && window.matchMedia('(max-width: 900px)').matches;
    if(mobile)viewport.scrollLeft=Math.max(0,(viewport.scrollWidth-viewport.clientWidth)/2);
    rightSidebar(null);updateNav('connections');
  };

  // Extend the existing, editable atlas without replacing original locations or routes.
  const oldMapCanvas = mapCanvas;
  mapCanvas = function(){
    const surface = oldMapCanvas();
    const style = activeStyle();
    surface.classList.add('map-skin-' + style);
    if(!['coast','threskel','shadow'].includes(currentRegion)) {
      const outdated = surface.querySelectorAll('.shadow-haze,.shadow-halo');
      outdated.forEach(n => n.remove());
      const svg = surface.querySelector('.atlas-paths');
      if(svg) {
        const ns = 'http://www.w3.org/2000/svg';
        const deco = document.createElementNS(ns, 'path');
        deco.setAttribute('d', 'M -20 455 C 145 275 255 418 410 328 S 710 243 1020 140 L 1050 670 L -20 680 Z');
        deco.setAttribute('class', 'landmass region-generic-land');
        svg.insertBefore(deco, svg.firstChild);
      }
    }
    return surface;
  };

  const originalRenderAtlas = renderAtlas;
  renderAtlas = function() {
    originalRenderAtlas();
    const main = document.getElementById('main');
    const tools = main?.querySelector('.living-tools');
    if(!tools) return;
    const extras = el('div', 'atlas-custom-tools');
    const chooser = el('label', 'map-style-selector');
    chooser.append(el('span', '', 'Map artwork'));
    const select = el('select', 'focus-select');
    select.setAttribute('aria-label', 'Choose map background style');
    for(const style of MAP_STYLES) {
      const opt = el('option', '', style.name);
      opt.value = style.id;
      select.append(opt);
    }
    select.value = activeStyle();
    select.addEventListener('change', () => {
      const layout = select.value;
      if(setLivingDraft(() => { const selected = getRegion(); if(selected) selected.layout = layout; }, 'Map layout saved locally. Publish to share with players.')) renderAtlas();
    });
    chooser.append(select);
    extras.append(chooser);

    const create = el('details', 'new-map-panel');
    const toggle = el('summary', '', '＋ New regional map');
    create.append(toggle);
    const form = el('div', 'new-map-form');
    const presets = el('select', 'focus-select');
    presets.setAttribute('aria-label', 'Map template');
    for(const p of REGION_PRESETS) {
      const o = el('option', '', p.name);
      o.value = p.id;
      presets.append(o);
    }
    const customOption = el('option', '', 'Custom map…');
    customOption.value = 'custom';
    presets.append(customOption);
    const title = el('input', '');
    title.type = 'text';
    title.maxLength = 80;
    title.placeholder = 'Map name (for custom maps)';
    title.setAttribute('aria-label', 'Custom map name');
    title.hidden = true;
    presets.addEventListener('change', () => { title.hidden = presets.value !== 'custom'; });
    const add = makeButton('Create empty map', 'btn primary mini', () => {
      const preset = REGION_PRESETS.find(p => p.id === presets.value);
      const name = preset?.name || title.value.trim();
      const id = preset?.id || safeId(name);
      if(!name || !id) { localize('Give the new map a name.'); return; }
      if(atlasData().regions.some(r => r.id === id)) {
        currentRegion = id; selectedPin = null; renderAtlas(); localize('That map already exists; showing it now.'); return;
      }
      if(setLivingDraft(() => { database.atlas.regions.push({id, name, subtitle: preset?.subtitle || 'An editable regional map', layout: preset?.layout || 'cartographer'}); }, 'New blank map added. Add places using Edit map & routes.')) {
        currentRegion = id; selectedPin = null; renderAtlas();
      }
    });
    form.append(presets, title, add);
    create.append(form);
    extras.append(create);
    extras.append(makeButton('✎ Rename map', 'btn outline mini', () => {
      const current = getRegion(); if(!current) return;
      const proposed = prompt('Rename this regional map:', current.name);
      if(proposed === null) return;
      const value = proposed.trim();
      if(!value || value.length > 80) { localize('Map names must be 1–80 characters.'); return; }
      if(setLivingDraft(() => { current.name = value; }, 'Map name saved as a local draft.')) renderAtlas();
    }));
    tools.append(extras);
    const map = main.querySelector('.atlas-surface');
    if(map) {
      const key = el('div', 'map-style-name', MAP_STYLES.find(x => x.id === activeStyle())?.name || '');
      map.append(key);
    }
    const tabList = main.querySelector('.living-tabs');
    if(tabList) tabList.setAttribute('aria-label', 'Choose a regional map');
  };
})();
