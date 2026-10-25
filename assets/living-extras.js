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

  function buildConstellationPositions(items) {
    const centerX = 390, centerY = 330;
    const count = Math.max(1, items.length);
    const positions = [];
    const rings = [180, 255, 315];
    const caps = count <= 4 ? [count, 0, 0] : count <= 7 ? [4, count - 4, 0] : [4, 3, count - 7];
    let placed = 0;
    rings.forEach((radius, ringIndex) => {
      const cap = caps[ringIndex];
      if(!cap) return;
      const startAngle = -Math.PI / 2 + (ringIndex === 1 ? Math.PI / 8 : ringIndex === 2 ? Math.PI / 14 : 0);
      for(let i = 0; i < cap; i++) {
        const angle = startAngle + (Math.PI * 2 * i / cap);
        positions.push({
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius,
          angle,
          radius,
          item: items[placed]
        });
        placed++;
      }
    });
    return {centerX, centerY, rings, positions};
  }

  function constellationSVG(items, focusId) {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 780 660');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.setAttribute('class', 'const-svg');
    svg.setAttribute('role', 'group');
    svg.setAttribute('aria-label', 'Interactive constellation of related wiki entries');
    const s = (tag, attrs, parent = svg) => {
      const x = document.createElementNS(ns, tag);
      for(const [k, v] of Object.entries(attrs || {})) x.setAttribute(k, String(v));
      parent.append(x);
      return x;
    };
    const defs = s('defs');
    const lineGrad = s('linearGradient', {id: 'constLineGradient', x1:'0', y1:'0', x2:'1', y2:'1'}, defs);
    s('stop', {offset:'0%', 'stop-color':'#ead096'}, lineGrad);
    s('stop', {offset:'55%', 'stop-color':'#c6ddff'}, lineGrad);
    s('stop', {offset:'100%', 'stop-color':'#cdbaf5'}, lineGrad);

    for(const star of seededStars(focusId + ':' + items.map(x => x.id).join(','))) {
      s('circle', {cx: star.x, cy: star.y, r: star.r, fill: '#ffffff', opacity: star.r < 1.2 ? '.42' : '.82'});
    }

    const {centerX, centerY, rings, positions} = buildConstellationPositions(items);
    rings.forEach((ring, idx) => {
      if(idx === 0 || positions.length > idx * 2) s('circle', {cx:centerX, cy:centerY, r:ring, class:'const-orbit'});
    });

    positions.forEach((pos, idx) => {
      s('line', {x1:centerX, y1:centerY, x2:pos.x, y2:pos.y, class:'const-link strong', stroke:'url(#constLineGradient)'});
      const next = positions[(idx + 1) % positions.length];
      if(next && positions.length > 2) s('line', {x1:pos.x, y1:pos.y, x2:next.x, y2:next.y, class:'const-link'});
    });

    const core = s('g', {'aria-hidden':'true'});
    s('circle', {cx:centerX, cy:centerY, r:46, class:'const-core-star'}, core);
    s('circle', {cx:centerX, cy:centerY, r:24, class:'const-core-disc'}, core);
    const moon = s('text', {x:centerX, y:centerY + 8, 'text-anchor':'middle', class:'const-core-glyph'}, core);
    moon.textContent = '✦';

    positions.forEach((pos, index) => {
      const rel = pos.item;
      const p = article(rel.id);
      if(!p) return;
      const x = pos.x, y = pos.y;
      const group = s('g', {class: `const-star ${starClass(index)} entering`, role:'button', tabindex:'0', 'aria-label':'Follow ' + p.title});
      s('circle', {cx:x, cy:y, r:42, class:'const-halo'}, group);
      s('circle', {cx:x, cy:y, r:30, class:'const-core'}, group);
      const glyph = s('text', {x, y:y+9, 'text-anchor':'middle', class:'const-glyph'}, group);
      glyph.textContent = iconFor(p);
      const labelAnchor = Math.cos(pos.angle) >= 0 ? 'start' : 'end';
      const labelX = x + (labelAnchor === 'start' ? 54 : -54);
      const labelY = y + 8;
      const label = s('text', {x:labelX, y:labelY, 'text-anchor':labelAnchor, class:'const-label'}, group);
      label.textContent = p.title.length > 26 ? p.title.slice(0, 25) + '…' : p.title;
      const tip = s('title', {}, group);
      tip.textContent = p.title + ' — ' + rel.label;
      const navigate = () => {
        group.classList.add('zooming');
        setTimeout(() => {
          graphFocus = rel.id;
          constellationPage = 0;
          renderConnections();
        }, 170);
      };
      group.addEventListener('click', navigate);
      group.addEventListener('keydown', ev => {
        if(ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault();
          navigate();
        }
      });
    });

    return svg;
  }

  renderConnections = function () {
    const main = document.getElementById('main');
    if(!main) return;
    const focus = article(graphFocus) || article('the-four-seasons') || database.pages[0];
    if(!focus) return;
    graphFocus = focus.id;
    const relatives = relatedTo(focus.id);
    const pages = Math.max(1, Math.ceil(relatives.length / THREADS_PER_PAGE));
    constellationPage = Math.min(Math.max(0, constellationPage), pages - 1);
    const visible = relatives.slice(constellationPage * THREADS_PER_PAGE, (constellationPage + 1) * THREADS_PER_PAGE);

    main.replaceChildren(livingHeader('THE THREADS OF FATE', 'Constellation Web', 'Follow the brighter links between people, places, mysteries and history. Tap a star to drift toward the next thread of the story.'));

    const bar = el('div', 'const-toolbar');
    const pick = el('select', 'focus-select const-focus-select');
    pick.setAttribute('aria-label', 'Choose a focused article');
    articleOptions(pick);
    pick.value = graphFocus;
    pick.addEventListener('change', () => { graphFocus = pick.value; constellationPage = 0; renderConnections(); });

    const findWrap = el('div', 'const-lookup');
    const search = el('input', 'const-search');
    search.type = 'search';
    search.placeholder = 'Find any character, place or story…';
    search.setAttribute('aria-label', 'Search wiki entries to focus');
    const results = el('div', 'const-find-results');
    results.hidden = true;
    search.addEventListener('input', () => {
      const query = search.value.trim().toLowerCase();
      results.replaceChildren();
      if(!query) { results.hidden = true; return; }
      const matches = database.pages.filter(p => (p.title + ' ' + (p.summary || '')).toLowerCase().includes(query)).slice(0, 7);
      if(!matches.length) results.append(el('p', '', 'No matching entries'));
      for(const p of matches) results.append(makeButton(p.title, 'const-suggestion', () => { graphFocus = p.id; constellationPage = 0; renderConnections(); }));
      results.hidden = false;
    });
    findWrap.append(search, results);
    bar.append(findWrap, pick, makeButton('✧ Manage relationships', 'btn outline mini', () => openConnectionEditor()));
    main.append(bar);

    const content = el('div', 'const-layout');
    const stage = el('section', 'const-stage' + (constellationMotion ? '' : ' motion-paused'));
    stage.setAttribute('aria-label', 'Constellation navigation');
    stage.setAttribute('aria-describedby', 'constellation-help');
    stage.tabIndex = 0;
    const heading = el('div', 'const-stage-heading');
    heading.append(el('span', 'eyebrow', 'THE LIVING SKY'), el('strong', '', focus.title), el('small', '', `${relatives.length} known connections · ${constellationPage + 1} / ${pages}`));
    stage.append(heading, constellationSVG(visible, focus.id));
    const controls = el('div', 'const-controls');
    const prev = makeButton('← Earlier stars', 'const-nav-btn', () => { constellationPage = Math.max(0, constellationPage - 1); renderConnections(); });
    prev.disabled = constellationPage === 0;
    const next = makeButton('More stars →', 'const-nav-btn', () => { constellationPage = Math.min(pages - 1, constellationPage + 1); renderConnections(); });
    next.disabled = constellationPage === pages - 1;
    const motion = makeButton(constellationMotion ? 'Ⅱ Pause motion' : '▶ Resume motion', 'const-nav-btn', () => { constellationMotion = !constellationMotion; renderConnections(); });
    controls.append(prev, motion, next);
    stage.append(controls);
    const hint = el('p', 'const-hint', 'Tap a glowing star to follow it · Swipe left or right for more links on mobile · Use the list for quick access');
    hint.id = 'constellation-help';
    stage.append(hint);
    const legend = el('div', 'const-legend');
    const l1 = el('span'); l1.append(el('i', 'gold'), document.createTextNode('explicit links'));
    const l2 = el('span'); l2.append(el('i', 'ice'), document.createTextNode('mentions & references'));
    const l3 = el('span'); l3.append(el('i', 'violet'), document.createTextNode('other connected stories'));
    legend.append(l1, l2, l3);
    stage.append(legend);

    let startX = null;
    stage.addEventListener('touchstart', e => { startX = e.touches[0]?.clientX ?? null; }, {passive:true});
    stage.addEventListener('touchend', e => {
      if(startX === null) return;
      const delta = (e.changedTouches[0]?.clientX ?? startX) - startX;
      startX = null;
      if(Math.abs(delta) < 85) return;
      if(delta < 0 && constellationPage < pages - 1) { constellationPage++; renderConnections(); }
      else if(delta > 0 && constellationPage > 0) { constellationPage--; renderConnections(); }
    }, {passive:true});
    stage.addEventListener('keydown', e => {
      if(e.target.closest('.const-star')) return;
      if(e.key === 'ArrowRight' && constellationPage < pages - 1) { constellationPage++; renderConnections(); }
      if(e.key === 'ArrowLeft' && constellationPage > 0) { constellationPage--; renderConnections(); }
    });

    const detail = el('aside', 'const-detail');
    detail.append(el('div', 'eyebrow', 'CURRENT STAR'), el('h2', '', focus.title), el('p', 'const-summary', focus.summary || 'This article is part of the campaign archive.'));
    const links = el('div', 'const-actions');
    const open = el('a', 'btn primary mini', 'Read full entry ↗');
    open.href = qPage(focus.id);
    links.append(open, makeButton('＋ Add link', 'btn outline mini', () => openConnectionEditor()));
    detail.append(links);
    detail.append(el('h3', '', 'Linked stories'));
    const list = el('div', 'const-relations');
    if(!relatives.length) list.append(el('p', 'const-no-links', 'No known relationships yet. Use Add link to connect this entry to the story.'));
    for(const relation of relatives) {
      const p = article(relation.id);
      const b = makeButton('', 'const-relation', () => {
        graphFocus = relation.id;
        constellationPage = 0;
        renderConnections();
      });
      b.append(el('span', 'const-relation-glyph', iconFor(p)), el('span', 'const-relation-body'));
      b.lastChild.append(el('strong', '', p.title), el('small', '', relation.label));
      list.append(b);
    }
    detail.append(list);
    content.append(stage, detail);
    main.append(content);
    rightSidebar(null);
    updateNav('connections');
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
