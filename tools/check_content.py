#!/usr/bin/env python3
"""Read-only content, illustration, atlas, journey, and quest-board validator."""
from pathlib import Path
import json,re,sys
base=Path(__file__).resolve().parent.parent
raw=json.loads((base/'data/pages.json').read_text(encoding='utf-8'))
errors=[];warnings=[]
if raw.get('schema') != 1: errors.append('Unsupported wiki schema')
if raw.get('siteName')!='Daughter of the Moon Wiki':errors.append('Incorrect site name')
pages=raw.get('pages')
if not isinstance(pages,list) or not pages:errors.append('Missing pages array');pages=[]
ids=set();names={}
allowed={'Characters','Locations','Party','Chronicle','Deities & Lore','Artifacts','Guides'}
imgpat=r'assets/uploads/[a-zA-Z0-9._-]+\.(?:webp|png|jpg|jpeg|gif)'
for i,p in enumerate(pages):
 if not isinstance(p,dict):errors.append(f'Page {i} not a record');continue
 ident=p.get('id');title=p.get('title');cat=p.get('category');body=p.get('body')
 if not isinstance(ident,str) or not re.fullmatch(r'[a-z0-9-]+',ident):errors.append(f'Invalid id page {i}');continue
 if ident in ids:errors.append(f'Duplicate page id: {ident}')
 ids.add(ident)
 if not isinstance(title,str) or not title.strip():errors.append(f'Missing title {ident}')
 if not isinstance(body,str) or not body.strip():errors.append(f'Missing body {ident}')
 if not isinstance(p.get('summary'),str):errors.append(f'Missing summary {ident}')
 if cat not in allowed:errors.append(f'Invalid category {ident}: {cat}')
 if not isinstance(p.get('facts'),list):errors.append(f'Invalid facts {ident}')
 if not isinstance(p.get('aliases'),list):errors.append(f'Invalid aliases {ident}')
 for name in [title or '',*(p.get('aliases') or [])]:
  norm=name.casefold().strip()
  if norm in names and names[norm]!=ident:warnings.append(f'Ambiguous name {name}')
  else:names[norm]=ident
 if p.get('session'):
  sess=p['session']
  if cat!='Chronicle' or sess.get('saga') not in ['I','II','III'] or not isinstance(sess.get('number'),int) or sess.get('number')<1:errors.append(f'Invalid session metadata in {ident}')
for p in pages:
 if not isinstance(p,dict) or not isinstance(p.get('body'),str):continue
 for name in re.findall(r'\[\[([^\]|]+)(?:\|[^\]]+)?\]\]',p['body']):
  if name.casefold().strip() not in names and name not in ids:warnings.append(f'Missing wiki link in {p["id"]}: {name}')
 imgs=([p['cover']] if p.get('cover') else [])+(p.get('gallery') or [])+re.findall(r'!\[[^\]]*\]\((assets/uploads/[^)]+)\)',p['body'])
 for path in imgs:
  if not isinstance(path,str) or not re.fullmatch(imgpat,path,re.I):errors.append(f'Invalid image path in {p["id"]}: {path}')
  elif not (base/path).is_file():warnings.append(f'Image not yet uploaded: {path}')
party=next((p for p in pages if p.get('id')=='the-four-seasons'),None)
if not party or party.get('title')!='The Four Seasons' or party.get('category')!='Party':errors.append('Four Seasons party entry missing')
atlas=raw.get('atlas')
if not isinstance(atlas,dict):errors.append('Living atlas is absent');atlas={}
regions={r.get('id') for r in atlas.get('regions',[]) if isinstance(r,dict)}
pins={}
for p in atlas.get('pins',[]):
 ident=p.get('id')
 if ident in pins: errors.append(f'Duplicate atlas pin {ident}')
 pins[ident]=p
 if ident not in ids: errors.append(f'Atlas pin has no wiki entry: {ident}')
 if p.get('region') not in regions:errors.append(f'Atlas pin missing region: {ident}')
 for coord in ['x','y']:
  if not isinstance(p.get(coord),(int,float)) or not 0<=p[coord]<=100:errors.append(f'Invalid atlas {coord} for {ident}')
for r in atlas.get('routes',[]):
 a,b=r.get('from'),r.get('to')
 if a not in pins or b not in pins:errors.append(f'Route points to missing pin: {a} => {b}')
 elif pins[a]['region']!=pins[b]['region']:errors.append(f'Cross-region route not supported: {a} => {b}')
 if r.get('kind') not in {'journey','voyage','portal'}:errors.append('Invalid journey type')
for c in atlas.get('connections',[]):
 if c.get('from') not in ids or c.get('to') not in ids:errors.append(f'Connection points to missing article: {c}')
 if c.get('from')==c.get('to'):errors.append('Self relationship is invalid')
 if not isinstance(c.get('label'),str) or not c['label'].strip():errors.append('Relationship label is missing')
quests=raw.get('quests')
if not isinstance(quests,list):errors.append('Quest board must be an array');quests=[]
seen=set()
for q in quests:
 if q.get('id') in seen:errors.append('Duplicate quest')
 seen.add(q.get('id'))
 if not q.get('title') or q.get('status') not in {'Open','In progress','Completed','Archived'}:errors.append('Invalid quest')
 img=q.get('image')
 if img:
  if not re.fullmatch(imgpat,img,re.I):errors.append('Invalid quest image path')
  elif not (base/img).is_file():warnings.append(f'Quest image not uploaded: {img}')
print(f'Wiki check: {len(pages)} articles, {sum(bool(p.get("session")) for p in pages)} journal entries, {len(pins)} atlas pins, {len(atlas.get("connections",[]))} connections, {len(quests)} quests')
for warning in warnings:print('WARN:',warning)
for error in errors:print('FAIL:',error)
if errors:sys.exit(1)
print(f'PASS: Pages, links, gallery references, atlas, relations, quests ({len(warnings)} nonfatal warnings)')
