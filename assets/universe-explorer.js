'use strict';
/* Daughter of the Moon V2.9. Progressive-discovery constellation explorer.
   UI only. No writes to database, storage, article bodies, imagery or remote data. */
(() => {
  const NS = 'http://www.w3.org/2000/svg';
  const WORLD = {w: 3100, h: 1840};
  const CLUSTERS = {
    'Characters': {x: 560, y: 535},
    'Locations': {x: 1570, y: 535},
    'Chronicle': {x: 2570, y: 535},
    'Deities & Lore': {x: 520, y: 1410},
    'Party': {x: 1250, y: 1410},
    'Artifacts': {x: 1985, y: 1410},
    'Guides': {x: 2660, y: 1410}
  };
  const COLORS = ['gold','ice','violet','rose','mint','amber','silver'];
  const STATE = {
    focus: null,
    history: [],
    camera: null,
    connectionMode: 'focused', // focused | cluster | all
    category: 'All',
    motion: true,
    dragged: false,
    lastWheelTime: -10000,
    animation: null,
    cleanup: null,
    hoveredCluster: null,
    activeCluster: null,
    lastCameraBeforeFocus: null,
    selectionActive: false,
    linkedIds: new Set(),
    linkedCategories: new Set(),
  };
  const OVERVIEW_ZOOM = 1.38;
  const NODE_REVEAL_ZOOM = 1.55;
  const LABEL_REVEAL_ZOOM = 2.22;
  const FAR_LABEL_REVEAL_ZOOM = 3.15;

  const E = (tag, cls='', txt) => { const n = document.createElement(tag); if (cls) n.className = cls; if (txt !== undefined) n.textContent = txt; return n; };
  const S = (tag, attrs={}, parent) => { const n = document.createElementNS(NS, tag); for (const [k,v] of Object.entries(attrs)) n.setAttribute(k, String(v)); if (parent) parent.append(n); return n; };
  const btn = (label, cls, cb) => { const n = E('button', cls, label); n.type='button'; n.addEventListener('click', cb); return n; };
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  const categoryKeys = Object.keys(CLUSTERS);
  const allCamera = () => ({x:0,y:0,w:WORLD.w,h:WORLD.h});

  function clusterColor(cat){
    return COLORS[Math.max(0, categoryKeys.indexOf(cat))] || 'silver';
  }

  function groupPages(pages){
    const grouped = new Map(categoryKeys.map(k => [k, []]));
    for (const p of pages) (grouped.get(p.category) || grouped.get('Guides')).push(p);
    for (const list of grouped.values()) list.sort((a,b)=>a.title.localeCompare(b.title));
    return grouped;
  }

  function buildPositions(pages){
    const grouped = groupPages(pages);
    const positions = new Map();
    for (const [category, group] of grouped){
      const base = CLUSTERS[category] || CLUSTERS.Guides;
      group.forEach((p, i) => {
        let ring, slot, count;
        if (i < 8){ ring = 0; slot = i; count = Math.min(8, group.length); }
        else if (i < 20){ ring = 1; slot = i - 8; count = Math.min(12, group.length - 8); }
        else { ring = 2; slot = i - 20; count = group.length - 20; }
        const radius = [128, 238, 326][ring];
        const angle = 2*Math.PI*(slot/Math.max(1,count)) - Math.PI/2 + (ring===1?0.22:ring===2?-0.11:0);
        positions.set(p.id, {x: base.x + Math.cos(angle)*radius, y: base.y + Math.sin(angle)*radius, category, page: p, ring});
      });
    }
    return {positions, grouped};
  }

  function relationships(pages){
    const nodes = new Set(pages.map(p=>p.id));
    const pairs = new Map();
    const add = (a,b,label,kind) => {
      if (a === b || !nodes.has(a) || !nodes.has(b)) return;
      const key = [a,b].sort().join('~~~');
      const prior = pairs.get(key);
      if (!prior || kind === 'explicit') pairs.set(key, {a,b,label:label||'Related story',kind});
    };
    for (const r of atlasData().connections || []) add(r.from,r.to,r.label,'explicit');
    for (const p of pages) for (const id of linkedIdSet(p)) add(p.id,id,'Mentioned here','reference');
    return [...pairs.values()];
  }
  function linkedEdges(id, edges){ return edges.filter(r=>r.a===id||r.b===id).map(r=>({...r,id:r.a===id?r.b:r.a})); }

  function centerOnCluster(category, zoom=2.08){
    const c = CLUSTERS[category];
    if (!c) return null;
    const width = clamp(WORLD.w / zoom, 620, 1700);
    const ratio = STATE._ratio ? STATE._ratio() : WORLD.w/WORLD.h;
    const height = width / ratio;
    return {x: c.x - width/2, y: c.y - height/2, w: width, h: height};
  }

  function createGraph(stage, model, edges, onSelect, onClusterSelect){
    const {positions, grouped} = model;
    const svg = S('svg', {class:'universe-svg', tabindex:'0', viewBox:`0 0 ${WORLD.w} ${WORLD.h}`, role:'group', 'aria-label':'Interactive map of the campaign archive'}, stage);
    const defs = S('defs', {}, svg);
    const gradient = S('linearGradient', {id:'universe-line-color', x1:'0%',x2:'100%',y1:'0%',y2:'100%'}, defs);
    S('stop',{offset:'0%','stop-color':'#f0d9a3'},gradient);
    S('stop',{offset:'48%','stop-color':'#b9d8f0'},gradient);
    S('stop',{offset:'100%','stop-color':'#d5bff2'},gradient);
    const motionGrad = S('linearGradient',{id:'universe-motion-dot',x1:'0%',x2:'100%',y1:'0%',y2:'0%'},defs);
    S('stop',{offset:'0%','stop-color':'#ffffff00'},motionGrad);
    S('stop',{offset:'50%','stop-color':'#fff3d2'},motionGrad);
    S('stop',{offset:'100%','stop-color':'#ffffff00'},motionGrad);

    const sky = S('g', {'aria-hidden':'true'}, svg);
    for (let i=0,seed=12671;i<150;i++){
      seed=(seed*1664525+1013904223)>>>0;const x=seed%WORLD.w;
      seed=(seed*1664525+1013904223)>>>0;const y=seed%WORLD.h;
      const twinkle = i % 11 === 0 ? 'universe-sky-star strong' : 'universe-sky-star';
      S('circle',{cx:x,cy:y,r:1+(i%7===0?1.2:0),class:twinkle},sky);
    }

    const clustersLayer = S('g',{class:'universe-clusters','aria-hidden':'true'},svg);
    const clusterNodes = new Map();
    for (const category of categoryKeys){
      const pos = CLUSTERS[category];
      const tone = clusterColor(category);
      // Only the small central hub is a mouse/touch target. The wide category
      // outline and its labels must never intercept wheel zoom or pan gestures.
      const group = S('g',{class:`universe-cluster tone-${tone}`,role:'button',tabindex:'0','aria-label':`Zoom into ${category}`,'pointer-events':'none'},clustersLayer);
      S('circle',{cx:pos.x,cy:pos.y,r:350,class:`universe-cluster-bg tone-${tone}`,'pointer-events':'none'},group);
      const hub = S('circle',{cx:pos.x,cy:pos.y,r:48,class:'universe-cluster-core','pointer-events':'all',cursor:'pointer'},group);
      const count = grouped.get(category)?.length || 0;
      const label = S('text',{x:pos.x,y:pos.y-362,class:'universe-cluster-title','text-anchor':'middle','pointer-events':'none'},group); label.textContent = category;
      const meta = S('text',{x:pos.x,y:pos.y+8,class:'universe-cluster-count','text-anchor':'middle','pointer-events':'none'},group); meta.textContent = `${count} entries`;
      const hint = S('text',{x:pos.x,y:pos.y+31,class:'universe-cluster-hint','text-anchor':'middle','pointer-events':'none'},group); hint.textContent = 'click to explore';
      const fire = ()=> onClusterSelect(category);
      group.addEventListener('click', e=>{
        // Middle-click and gesture-generated clicks must not cancel a selected
        // article's cross-constellation links. Only a deliberate hub click does.
        if (e.target !== hub || e.button !== 0 || STATE.dragged || performance.now() - STATE.lastWheelTime < 250) return;
        e.stopPropagation();
        fire();
      });
      group.addEventListener('keydown', e=>{ if (e.key==='Enter' || e.key===' '){ e.preventDefault(); fire(); } });
      group.addEventListener('mouseenter', ()=> { STATE.hoveredCluster = category; stage.classList.add('cluster-hovering'); stage.dataset.hoveredCluster = category; updateExposure(); });
      group.addEventListener('mouseleave', ()=> { STATE.hoveredCluster = null; stage.classList.remove('cluster-hovering'); delete stage.dataset.hoveredCluster; updateExposure(); });
      clusterNodes.set(category, group);
    }

    const edgeLayer = S('g',{class:'universe-edges','aria-hidden':'true'},svg);
    const motionLayer = S('g',{class:'universe-motion-layer','aria-hidden':'true'},svg);
    const edgeNodes = [];
    edges.forEach((r, i) => {
      const a = positions.get(r.a), b = positions.get(r.b); if (!a || !b) return;
      const line = S('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,class:`universe-edge ${r.kind==='explicit'?'explicit':'reference'}`},edgeLayer);
      const dot = S('circle',{cx:a.x,cy:a.y,r:2.8,class:'universe-edge-dot'},motionLayer);
      edgeNodes.push({edge:r,node:line,dot,ax:a.x,ay:a.y,bx:b.x,by:b.y,phase:(i%19)/19});
    });

    const nodesLayer = S('g',{class:'universe-nodes'},svg);
    const nodeNodes = new Map();
    for (const [id, p] of positions){
      const tone = clusterColor(p.category);
      const group = S('g',{class:`universe-node tone-${tone}`, role:'button', tabindex:'0', 'aria-label':`Explore ${p.page.title}`, 'data-category': p.category}, nodesLayer);
      S('circle',{cx:p.x,cy:p.y,r:27,class:'universe-node-hit'},group);
      S('circle',{cx:p.x,cy:p.y,r:20,class:'universe-node-aura'},group);
      S('circle',{cx:p.x,cy:p.y,r:12,class:'universe-node-core'},group);
      const icon = S('text',{x:p.x,y:p.y+5,'text-anchor':'middle',class:'universe-node-icon'},group); icon.textContent = iconFor(p.page);
      const label = S('text',{x:p.x+24,y:p.y+6,class:'universe-node-label'},group); label.textContent = p.page.title.length>21 ? p.page.title.slice(0,20)+'…' : p.page.title;
      const title = S('title',{},group); title.textContent = p.page.title;
      const fire = ()=> { if (STATE.dragged) return; onSelect(id, true); };
      group.addEventListener('click', fire);
      group.addEventListener('keydown', e=>{ if (e.key==='Enter' || e.key===' '){ e.preventDefault(); fire(); } });
      nodeNodes.set(id, group);
    }

    let motionClock = 0;
    function animateMotion(){
      if (STATE.motion){
        motionClock += 0.0065;
        for (const item of edgeNodes){
          // Animate only illuminated connections: invisible edges do not consume frames.
          if (!item.dot.classList.contains('lit')) continue;
          const t = (motionClock + item.phase) % 1;
          const x = item.ax + (item.bx - item.ax) * t;
          const y = item.ay + (item.by - item.ay) * t;
          item.dot.setAttribute('cx', x.toFixed(2));
          item.dot.setAttribute('cy', y.toFixed(2));
        }
      }
      STATE._motionFrame = requestAnimationFrame(animateMotion);
    }
    if (STATE._motionFrame) cancelAnimationFrame(STATE._motionFrame);
    STATE._motionFrame = requestAnimationFrame(animateMotion);

    function updateExposure(){
      const zoom = WORLD.w / (STATE.camera?.w || WORLD.w);
      stage.style.setProperty('--ux-zoom', String(zoom));
      // A chosen star is a navigation focus, not a category filter. Connected
      // entries must remain visible even when they live in other constellations.
      const overview = !STATE.selectionActive && zoom < NODE_REVEAL_ZOOM && STATE.category === 'All' && !STATE.activeCluster;
      const categoryFocus = STATE.category !== 'All' ? STATE.category : (STATE.activeCluster || STATE.hoveredCluster);
      const revealLabels = zoom >= LABEL_REVEAL_ZOOM;
      const revealFarLabels = zoom >= FAR_LABEL_REVEAL_ZOOM;
      stage.classList.toggle('overview-mode', overview);
      stage.classList.toggle('focused-cluster-mode', !!categoryFocus && !overview);
      stage.dataset.activeCluster = categoryFocus || '';
      for (const [category, node] of clusterNodes){
        node.classList.toggle('active', category === categoryFocus);
        // Never mute a hub whose stars are linked to the selected article.
        node.classList.toggle('muted', !!categoryFocus && category !== categoryFocus &&
          !(STATE.selectionActive && STATE.linkedCategories.has(category)));
      }
      for (const [id, node] of nodeNodes){
        const p = positions.get(id); if (!p) continue;
        const selected = STATE.selectionActive && id === STATE.focus;
        const connected = STATE.selectionActive && STATE.linkedIds.has(id);
        const inCategory = !categoryFocus || p.category === categoryFocus;
        // The cross-category OR is crucial: lines should never end in invisible
        // stars after a user selects an entry and zooms into its connections.
        const visible = !overview && (inCategory || selected || connected);
        node.classList.toggle('cluster-hidden', !visible);
        node.classList.toggle('label-ready', revealLabels || selected || (connected && zoom >= 1.6));
        node.classList.toggle('label-far-ready', revealFarLabels);
      }
    }

    return {svg, stage, positions, grouped, nodeNodes, edgeNodes, clusterNodes, updateExposure};
  }

  function normalizeCamera(box, ratio){
    const w = clamp(box.w, 430, 3900);
    const h = w / ratio;
    const maxX = WORLD.w - w, maxY = WORLD.h - h;
    return {x:maxX<0?maxX/2:clamp(box.x,0,maxX), y:maxY<0?maxY/2:clamp(box.y,0,maxY), w, h};
  }

  function installCamera(graph, stage){
    const {svg} = graph;
    const pointers = new Map();
    let dragging = false, anchor = null, pinch = null;
    const ratio = ()=> { const r = svg.getBoundingClientRect(); return r.width / Math.max(1, r.height); };
    STATE._ratio = ratio;
    const apply = ()=>{
      const cam = STATE.camera = normalizeCamera(STATE.camera || allCamera(), ratio());
      svg.setAttribute('viewBox', `${cam.x} ${cam.y} ${cam.w} ${cam.h}`);
      const zoom = WORLD.w / cam.w;
      stage.classList.toggle('universe-zoomed', zoom >= NODE_REVEAL_ZOOM);
      stage.classList.toggle('universe-close', zoom >= LABEL_REVEAL_ZOOM);
      const pct = stage.querySelector('.universe-zoom-level'); if (pct) pct.textContent = `${Math.round(zoom*100)}%`;
      graph.updateExposure();
    };
    const zoomAt = (factor, px=.5, py=.5) => {
      const c = STATE.camera;
      const nw = clamp(c.w * factor, 430, 3900);
      const nh = nw / ratio();
      STATE.camera = {x:c.x + (c.w - nw) * px, y:c.y + (c.h - nh) * py, w:nw, h:nh};
      apply();
    };
    const pan = (dx,dy)=>{ const c=STATE.camera, r=svg.getBoundingClientRect(); STATE.camera={...c,x:c.x-dx*c.w/r.width,y:c.y-dy*c.h/r.height}; apply(); };
    const fit = ()=> { STATE.activeCluster = null; STATE.selectionActive = false; STATE.linkedIds.clear(); STATE.linkedCategories.clear(); STATE.camera = allCamera(); apply(); };
    const focusOn = (id, targetZoom, animate=true, restored=null) => {
      const position = graph.positions.get(id); if (!position) return;
      const r = ratio();
      const w = restored?.w || clamp(WORLD.w/(targetZoom || 2.7), 450, 1600);
      const h = w / r;
      const desired = restored || {x:position.x - w/2, y:position.y - h/2, w, h};
      if (STATE.animation) cancelAnimationFrame(STATE.animation);
      const start = {...STATE.camera}, end = normalizeCamera(desired, r);
      if (!animate || window.matchMedia('(prefers-reduced-motion: reduce)').matches){ STATE.camera = end; apply(); return; }
      const begin = performance.now();
      const tick = now => {
        const t = Math.min(1, (now-begin)/380), ease = 1 - Math.pow(1 - t, 3);
        STATE.camera = {x:start.x + (end.x-start.x)*ease, y:start.y + (end.y-start.y)*ease, w:start.w + (end.w-start.w)*ease, h:start.h + (end.h-start.h)*ease};
        apply();
        if (t < 1) STATE.animation = requestAnimationFrame(tick); else STATE.animation = null;
      };
      STATE.animation = requestAnimationFrame(tick);
    };
    const point = e => { const r = svg.getBoundingClientRect(); return {x:(e.clientX-r.left)/r.width, y:(e.clientY-r.top)/r.height}; };
    svg.addEventListener('wheel', e => {
      e.preventDefault();
      STATE.lastWheelTime = performance.now();
      const p = point(e);
      zoomAt(Math.exp(e.deltaY * .0011), p.x, p.y);
    }, {passive:false});
    svg.addEventListener('pointerdown', e => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      if (STATE.animation){ cancelAnimationFrame(STATE.animation); STATE.animation = null; }
      pointers.set(e.pointerId, {x:e.clientX, y:e.clientY});
      if (!e.target.closest('.universe-node') && !e.target.closest('.universe-cluster')) svg.setPointerCapture(e.pointerId);
      if (pointers.size === 1){ anchor = {x:e.clientX, y:e.clientY}; dragging = false; }
      else if (pointers.size === 2){ const p=[...pointers.values()]; pinch = Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y); STATE.dragged = true; }
    });
    svg.addEventListener('pointermove', e => {
      if (!pointers.has(e.pointerId)) return;
      const prev = pointers.get(e.pointerId);
      pointers.set(e.pointerId, {x:e.clientX,y:e.clientY});
      if (pointers.size === 2){
        const pts=[...pointers.values()]; const d=Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y);
        const mid={clientX:(pts[0].x+pts[1].x)/2,clientY:(pts[0].y+pts[1].y)/2}; const p=point(mid);
        if (pinch && d) zoomAt(clamp(pinch/d,.85,1.18), p.x, p.y); pinch=d; return;
      }
      if (anchor && Math.hypot(e.clientX-anchor.x,e.clientY-anchor.y) > 6){ dragging=true; STATE.dragged=true; stage.classList.add('is-panning'); }
      if (dragging) pan(e.clientX-prev.x, e.clientY-prev.y);
    });
    const release = e => {
      pointers.delete(e.pointerId);
      try { svg.releasePointerCapture(e.pointerId); } catch(_){}
      if (!pointers.size){ stage.classList.remove('is-panning'); anchor=null; pinch=null; dragging=false; setTimeout(()=>{STATE.dragged=false;},0); }
      else if (pointers.size === 1){ const v=[...pointers.values()][0]; anchor = {x:v.x,y:v.y}; pinch = null; }
    };
    svg.addEventListener('pointerup', release); svg.addEventListener('pointercancel', release);
    svg.addEventListener('keydown', e => {
      if (e.target !== svg) return;
      if (e.key === '+' || e.key === '='){ e.preventDefault(); zoomAt(.8); }
      else if (e.key === '-'){ e.preventDefault(); zoomAt(1.25); }
      else if (e.key === 'Home'){ e.preventDefault(); fit(); }
      else if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)){
        e.preventDefault(); pan(e.key==='ArrowLeft'?90:e.key==='ArrowRight'?-90:0, e.key==='ArrowUp'?90:e.key==='ArrowDown'?-90:0);
      }
    });
    const observer = new ResizeObserver(apply); observer.observe(svg);
    STATE.cleanup = ()=> observer.disconnect();
    apply();
    return {apply, zoomAt, fit, focusOn, pan};
  }

  function renderExplorer(){
    if (STATE.cleanup){ STATE.cleanup(); STATE.cleanup = null; }
    if (STATE.animation){ cancelAnimationFrame(STATE.animation); STATE.animation = null; }
    if (STATE._motionFrame){ cancelAnimationFrame(STATE._motionFrame); STATE._motionFrame = null; }
    const main = document.getElementById('main'); if (!main) return;
    const all = [...database.pages].sort((a,b)=>a.title.localeCompare(b.title)); if (!all.length) return;
    STATE.focus = article(graphFocus)?.id || STATE.focus || 'the-four-seasons';
    const model = buildPositions(all), edges = relationships(all);

    main.replaceChildren(livingHeader('THE THREADS OF FATE','The Living Constellation','Begin with the great constellations, then zoom into their stars. The sky reveals more only when you need it.'));
    const root = E('section','universe-layout');
    const toolbar = E('div','universe-toolbar');
    const back = btn('← Previous star','universe-btn universe-back',()=>goBack());
    const search = E('input','universe-search'); search.type='search'; search.placeholder='Find a star — character, city, journal…'; search.setAttribute('aria-label','Search all wiki entries');
    const searchWrap = E('div','universe-search-wrap'), results = E('div','universe-results'); results.hidden = true; searchWrap.append(search, results);
    const filter = E('select','universe-select'); filter.setAttribute('aria-label','Focus one collection');
    for (const cat of ['All', ...categoryKeys]){ const opt=E('option','',cat==='All'?'Overview: all constellations':cat); opt.value=cat; filter.append(opt); }
    filter.value = STATE.category;
    const scope = E('select','universe-select'); scope.setAttribute('aria-label','Choose visible links');
    for (const [value, text] of [['focused','Focused star only'],['cluster','Focused cluster'],['all','Entire network']]){ const opt=E('option','',text); opt.value=value; scope.append(opt); }
    scope.value = STATE.connectionMode;
    toolbar.append(back, searchWrap, filter, scope, btn('✧ Edit relationships','universe-btn',()=>openConnectionEditor()));
    root.append(toolbar);

    const stage = E('div','universe-stage');
    const stageTitle = E('div','universe-stage-title');
    stageTitle.append(E('span','eyebrow','THE LIVING SKY'), E('span','universe-count',`${all.length} stars · ${edges.length} links`), E('span','universe-mode-badge','Overview')); stage.append(stageTitle);
    const graph = createGraph(stage, model, edges, selectStar, selectCluster);
    const controls = E('div','universe-controls');
    controls.append(
      btn('＋','universe-control',()=>camera.zoomAt(.75)),
      btn('−','universe-control',()=>camera.zoomAt(1.333)),
      btn('⊞ Fit All','universe-control universe-fit',()=>{ STATE.category='All'; filter.value='All'; STATE.activeCluster=null; camera.fit(); refresh(); }),
      E('span','universe-zoom-level','100%')
    );
    const pause = btn('Ⅱ Animate','universe-control',()=>{ STATE.motion=!STATE.motion; stage.classList.toggle('universe-paused',!STATE.motion); pause.textContent = STATE.motion ? 'Ⅱ Animate' : '▶ Animate'; });
    controls.append(pause); stage.append(controls);
    const hint = E('div','universe-help','Overview shows only the seven constellations · Zoom or click one to reveal stars · Drag to pan · Use Fit All to reset'); stage.append(hint);
    const chips = E('div','universe-overview-chips');
    for (const category of categoryKeys){ const b = btn(category, 'universe-chip', ()=> selectCluster(category)); chips.append(b); }
    stage.append(chips);
    root.append(stage);

    const detail = E('section','universe-detail'); detail.setAttribute('aria-label','Selected star details');
    const left = E('div','universe-detail-main'), right = E('div','universe-detail-related'); detail.append(left,right); root.append(detail);
    main.append(root);

    const camera = installCamera(graph, stage);

    function visibleEdgesFor(selectedId){
      const selected = article(selectedId);
      const category = selected?.category || STATE.activeCluster || STATE.category;
      if (STATE.connectionMode === 'all') return new Set(edges.map((_,i)=>i));
      if (STATE.connectionMode === 'cluster'){
        return new Set(edges.map((e,i)=>{
          const a = article(e.a), b = article(e.b);
          return (a?.category===category || b?.category===category) ? i : -1;
        }).filter(i=>i>=0));
      }
      return new Set(edges.map((e,i)=> (e.a===selectedId || e.b===selectedId) ? i : -1).filter(i=>i>=0));
    }

    function refresh(){
      const selected = article(STATE.focus) || all[0];
      STATE.focus = selected.id; graphFocus = selected.id;
      const zoom = WORLD.w / (STATE.camera?.w || WORLD.w);
      const connected = linkedEdges(selected.id, edges);
      STATE.linkedIds = STATE.selectionActive ? new Set(connected.map(e=>e.id)) : new Set();
      STATE.linkedCategories = STATE.selectionActive ? new Set(connected.map(e=>article(e.id)?.category).filter(Boolean)) : new Set();
      const categoryFocus = STATE.category !== 'All' ? STATE.category : (STATE.activeCluster || null);
      const visibleEdgeIndexes = visibleEdgesFor(selected.id);
      const modeBadge = stage.querySelector('.universe-mode-badge');
      const inOverview = !STATE.selectionActive && zoom < NODE_REVEAL_ZOOM && STATE.category === 'All' && !STATE.activeCluster;
      if (modeBadge) modeBadge.textContent = inOverview ? 'Overview' : (categoryFocus ? `${categoryFocus}` : selected.title);
      for (const [id, node] of graph.nodeNodes){
        const pos = graph.positions.get(id); if (!pos) continue;
        const page = pos.page;
        const inCategory = !categoryFocus || page.category === categoryFocus;
        const isFocus = id === selected.id;
        const isNeighbor = connected.some(e=>e.id===id);
        const reveal = !(inOverview) && (inCategory || (STATE.selectionActive && (isFocus || isNeighbor)));
        node.classList.toggle('active', STATE.selectionActive && isFocus);
        node.classList.toggle('adjacent', STATE.selectionActive && !isFocus && isNeighbor);
        node.classList.toggle('cluster-hidden', !reveal);
        node.classList.toggle('faded', reveal && STATE.selectionActive && STATE.connectionMode==='focused' && !isFocus && !isNeighbor && zoom >= NODE_REVEAL_ZOOM);
      }
      graph.edgeNodes.forEach((item, index) => {
        const e = item.edge;
        const a = article(e.a), b = article(e.b);
        const categoryOK = !categoryFocus || a?.category===categoryFocus || b?.category===categoryFocus ||
          (STATE.selectionActive && (e.a===selected.id || e.b===selected.id));
        const lit = visibleEdgeIndexes.has(index) && categoryOK && !inOverview &&
          (STATE.selectionActive || STATE.connectionMode !== 'focused');
        item.node.classList.toggle('lit', lit);
        item.node.classList.toggle('quiet', !lit);
        item.dot.classList.toggle('lit', lit && STATE.motion);
        item.dot.classList.toggle('quiet', !lit || !STATE.motion);
      });
      back.disabled = STATE.history.length === 0;
      back.textContent = STATE.history.length ? '← Back to ' + (article(STATE.history[STATE.history.length-1].id)?.title || 'previous star') : '← Previous star';
      left.replaceChildren(
        E('div','eyebrow', categoryFocus ? `CURRENT STAR · ${categoryFocus}` : 'CURRENT STAR'),
        E('h2','', selected.title),
        E('p','', selected.summary || 'Open this article to read its full story.')
      );
      const meta = E('p','universe-meta', `${selected.category} · ${connected.length} known connections`);
      left.append(meta);
      const actions = E('div','universe-actions');
      const link = E('a','btn primary','Read article ↗'); link.href = qPage(selected.id);
      actions.append(link, btn('＋ Add connection','btn outline',()=>openConnectionEditor()));
      left.append(actions);

      right.replaceChildren(E('h3','', `Connected stories (${connected.length})`));
      const cards = E('div','universe-neighbor-list');
      if (!connected.length) cards.append(E('p','', 'No connections yet. Use Add connection to link this entry.'));
      for (const r of connected.sort((a,b)=>article(a.id).title.localeCompare(article(b.id).title))){
        const p = article(r.id); if (!p) continue;
        const card = btn('', 'universe-neighbor', ()=> selectStar(p.id, true));
        card.append(E('span','universe-neighbor-icon', iconFor(p)));
        const text = E('span'); text.append(E('strong','',p.title), E('small','',r.label)); card.append(text);
        cards.append(card);
      }
      right.append(cards);
      graph.updateExposure();
      const chipsEls = [...stage.querySelectorAll('.universe-chip')];
      chipsEls.forEach(ch => ch.classList.toggle('active', ch.textContent === categoryFocus));
    }

    function selectStar(id, withHistory){
      if (!article(id)) return;
      if (withHistory && id !== STATE.focus){
        STATE.history.push({id: STATE.focus, camera: {...STATE.camera}, category: STATE.category, activeCluster: STATE.activeCluster, mode: STATE.connectionMode, selectionActive: STATE.selectionActive});
        if (STATE.history.length > 80) STATE.history.shift();
      }
      const page = article(id);
      if (page && page.category){
        STATE.activeCluster = page.category;
        if (STATE.category === 'All') {
          // keep overview filter, but exploration focuses this cluster visually
        }
      }
      STATE.focus = id;
      STATE.selectionActive = true;
      refresh();
      camera.focusOn(id, Math.max(2.5, WORLD.w / STATE.camera.w));
    }

    function selectCluster(category){
      STATE.selectionActive = false;
      STATE.activeCluster = category;
      if (STATE.category === 'All') filter.value = 'All';
      STATE.camera = centerOnCluster(category, 2.18) || STATE.camera;
      camera.apply();
      const preferred = model.grouped.get(category)?.[0];
      if (preferred){
        STATE.focus = preferred.id;
      }
      refresh();
    }

    function goBack(){
      const old = STATE.history.pop(); if (!old) return;
      STATE.focus = old.id; STATE.category = old.category || 'All'; filter.value = STATE.category;
      STATE.activeCluster = old.activeCluster || null; STATE.connectionMode = old.mode || 'focused'; scope.value = STATE.connectionMode;
      STATE.selectionActive = !!old.selectionActive;
      refresh();
      camera.focusOn(old.id, 1, true, old.camera);
    }

    search.addEventListener('input', ()=>{
      const q = search.value.trim().toLocaleLowerCase(); results.replaceChildren(); results.hidden = !q;
      if (!q) return;
      const found = all.filter(p=>(p.title+' '+(p.summary||'')).toLocaleLowerCase().includes(q)).slice(0,10);
      if (!found.length) results.append(E('p','universe-empty','No matching entries'));
      for (const p of found) results.append(btn(p.title,'universe-result',()=>{ selectStar(p.id, true); results.hidden=true; search.value=''; }));
    });
    filter.addEventListener('change', ()=> {
      STATE.category = filter.value;
      STATE.selectionActive = false;
      STATE.activeCluster = filter.value === 'All' ? null : filter.value;
      if (STATE.activeCluster){ STATE.camera = centerOnCluster(STATE.activeCluster, 2.1) || STATE.camera; camera.apply(); }
      else camera.fit();
      refresh();
    });
    scope.addEventListener('change', ()=> { STATE.connectionMode = scope.value; refresh(); });
    stage.classList.toggle('universe-paused', !STATE.motion);
    refresh(); camera.fit();
    if (window.matchMedia('(max-width: 690px)').matches) camera.fit();
    rightSidebar(null); updateNav('connections');
    window.addEventListener('orientationchange',()=>requestAnimationFrame(camera.apply),{once:true});
  }

  renderConnections = renderExplorer;
})();
