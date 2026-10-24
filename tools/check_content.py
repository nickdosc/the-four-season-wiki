#!/usr/bin/env python3
"""Read-only structural and link checks for Daughter of the Moon Wiki."""
from pathlib import Path
import json,re,sys
base=Path(__file__).resolve().parent.parent
raw=json.loads((base/'data/pages.json').read_text(encoding='utf-8'))
errors=[];warnings=[]
if raw.get('schema') != 1:errors.append('Unsupported schema')
pages=raw.get('pages')
if not isinstance(pages,list) or not pages:errors.append('Missing pages array');pages=[]
ids=set();names={}
allowed={'Characters','Locations','Party','Chronicle','Deities & Lore','Artifacts','Guides'}
for i,p in enumerate(pages):
 if not isinstance(p,dict):errors.append(f'Page {i} not a record');continue
 id=p.get('id'); title=p.get('title');category=p.get('category');body=p.get('body')
 if not isinstance(id,str) or not re.fullmatch(r'[a-z0-9-]+',id):errors.append(f'Invalid id at page {i}');continue
 if id in ids:errors.append(f'Duplicate id {id}')
 ids.add(id)
 if not isinstance(title,str) or not title.strip():errors.append(f'Missing title {id}')
 if not isinstance(body,str) or not body.strip():errors.append(f'Missing body {id}')
 if not isinstance(p.get('summary'),str):errors.append(f'Missing summary {id}')
 if category not in allowed:errors.append(f'Invalid category {id}: {category}')
 if not isinstance(p.get('facts'),list):errors.append(f'Invalid facts {id}')
 if not isinstance(p.get('aliases'),list):errors.append(f'Invalid aliases {id}')
 for name in [title or '',*(p.get('aliases') or [])]:
  norm=name.casefold().strip()
  if norm in names and names[norm]!=id: warnings.append(f'Ambiguous name {name}: {names[norm]} vs {id}')
  else:names[norm]=id
for p in pages:
 if not isinstance(p,dict) or not isinstance(p.get('body'),str):continue
 for target in re.findall(r'\[\[([^\]|]+)(?:\|[^\]]+)?\]\]',p['body']):
  if target.casefold().strip() not in names and target not in ids:warnings.append(f"Missing wiki link in {p['id']}: {target}")
 for path in ([p.get('cover')] if p.get('cover') else [])+re.findall(r'!\[[^\]]*\]\((assets/uploads/[^)]+)\)',p['body']):
  if not re.fullmatch(r'assets/uploads/[a-zA-Z0-9._-]+\.(webp|png|jpg|jpeg|gif)',path,re.I):errors.append(f"Disallowed image path in {p['id']}: {path}")
  elif not (base/path).is_file():warnings.append(f"Image not yet in repository: {path}")
print(f"Wiki content check: {len(pages)} articles, {len(ids)} distinct IDs")
for w in warnings:print('WARN:',w)
for e in errors:print('FAIL:',e)
if errors:sys.exit(1)
print(f"PASS: article structure and internal links ({len(warnings)} nonfatal warnings)")
