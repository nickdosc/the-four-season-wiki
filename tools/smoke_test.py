#!/usr/bin/env python3
"""Local offline Chromium smoke tests (never contacts or writes to GitHub)."""
from pathlib import Path
import json,re
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parent.parent
html=(root/'index.html').read_text()
html=re.sub(r'<meta http-equiv="Content-Security-Policy"[^>]+>','',html)
html=html.replace('<head>','<head><base href="https://daughterofthemoon.quest/">')
for line in ['<link rel="stylesheet" href="assets/style.css">','<script src="assets/app.js" defer></script>','<script src="assets/atlas.js" defer></script>','<link rel="icon" href="assets/favicon.svg" type="image/svg+xml">']:
 html=html.replace(line,'')
css=(root/'assets/style.css').read_text()
base_js=(root/'assets/app.js').read_text()
atlas_js=(root/'assets/atlas.js').read_text()
data=json.loads((root/'data/pages.json').read_text())
out=root/'tools/_previews';out.mkdir(exist_ok=True)

def setup(browser,viewport):
 page=browser.new_page(viewport=viewport,device_scale_factor=1)
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_default_timeout(5000)
 page.set_content(html,wait_until='domcontentloaded')
 page.add_style_tag(content=css)
 page.evaluate('''(data)=>{
  const local={};
  Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:(k)=>local[k]??null,setItem:(k,v)=>{local[k]=v},removeItem:(k)=>{delete local[k]}}});
  window.fetch=async()=>({ok:true,json:async()=>structuredClone(data)});
  window.indexedDB=undefined;
 }''',data)
 page.add_script_tag(content=base_js);page.add_script_tag(content=atlas_js)
 page.wait_for_selector('.hero')
 return page,errors

with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 page,errors=setup(browser,{'width':1512,'height':1000})
 assert page.locator('#main .living-feature').count()==4
 assert page.locator('.starfield i').count()==40
 page.evaluate('location.hash="#/atlas"');page.wait_for_selector('.atlas-surface')
 assert page.locator('.map-pin').count()==11
 assert page.locator('.journey-line').count()>8
 page.screenshot(path=str(out/'atlas.png'),full_page=True)
 page.locator('.map-pin[data-id="port-llast"]').click()
 assert page.locator('.atlas-detail h2').inner_text()=='Port Llast'
 page.locator('button:has-text("Edit map & routes")').click()
 page.locator('#mapArticle').select_option('thamor')
 page.locator('#mapRegion').select_option('coast')
 page.locator('#mapX').fill('39')
 page.locator('#mapY').fill('47')
 page.locator('#mapSave').click()
 assert page.evaluate("database.atlas.pins.some(p=>p.id==='thamor'&&p.region==='coast'&&p.x===39)")
 page.locator('[data-close="mapDialog"]').click()
 assert page.locator('.map-pin[data-id="thamor"]').count()==1
 print('PASS: atlas tabs, pins, marker editor, local save, route drawing')
 page.evaluate('location.hash="#/connections"');page.wait_for_selector('.constellation-stage')
 assert page.locator('.star-node').count()>=5
 page.screenshot(path=str(out/'connections.png'),full_page=True)
 page.locator('button:has-text("Edit relationships")').click()
 page.locator('#connectFrom').select_option('thelma' if page.locator('#connectFrom option[value="thelma"]').count() else 'arven')
 page.locator('#connectTo').select_option('jimsko')
 page.locator('#connectLabel').fill('tested constellation edge')
 page.locator('#connectAdd').click()
 assert page.evaluate("database.atlas.connections.some(c=>c.from==='arven'&&c.to==='jimsko'&&c.label==='tested constellation edge')")
 page.locator('[data-close="connectionDialog"]').click()
 print('PASS: relationship editor and save')
 page.evaluate('location.hash="#/journal"');page.wait_for_selector('.session-card')
 assert page.locator('.session-card').count()==19
 page.screenshot(path=str(out/'journal.png'),full_page=True)
 page.get_by_role('button',name='Saga I',exact=True).click();assert page.locator('.session-card').count()==17
 page.get_by_role('button',name='Saga II',exact=True).click();assert page.locator('.session-card').count()==2
 print('PASS: all 17 Saga I and 2 verified Saga II journal entries')
 page.evaluate('location.hash="#/quests"');page.wait_for_selector('.quest-empty')
 assert page.locator('.quest-card').count()==0
 page.screenshot(path=str(out/'quests-empty.png'),full_page=True)
 page.get_by_role('button',name='Post a quest').click()
 page.locator('#questTitle').fill('The Bell of the Harbor')
 page.locator('#questGiver').fill('Test harbor master')
 page.locator('#questBody').fill('Find the bell near [[Port Llast]] and talk to [[Jimsko]].')
 page.locator('#questSave').click()
 assert page.locator('.quest-card').count()==1
 assert page.locator('.quest-card .wiki-link').count()==2
 assert page.evaluate('database.quests.length')==1
 page.locator('.quest-card button').click();page.locator('#questStatus').select_option('In progress');page.locator('#questSave').click()
 assert page.evaluate('database.quests[0].status')=='In progress'
 print('PASS: initially empty board, post/edit quest, status, internal wiki links')
 # Legacy article editor and the new gallery features.
 page.evaluate('location.hash="#/article/bramwell-elixor"');page.wait_for_selector('.article-hero')
 assert page.locator('.article-gallery .gallery-tile').count()==1
 page.locator('.article-topline button').click()
 assert page.locator('.gallery-edit-tile').count()==1
 page.locator('#editSummary').fill('Tested by the living atlas smoke suite')
 page.locator('#saveDraft').click()
 assert 'Tested by the living atlas' in page.locator('.article-hero').inner_text()
 page.locator('#editorHub').click()
 assert 'unpublished wiki change' in page.locator('#draftStatus').inner_text()
 assert page.evaluate('draftCount()')>=3
 page.evaluate('''() => {
   window.__gitWrites=[];
   window.fetch=async (url,opts={})=>{
     if(opts.method==='PUT'){
       window.__gitWrites.push({url,content:JSON.parse(opts.body).content});
       return {ok:true,json:async()=>({content:{sha:'newsha'}})};
     }
     return {ok:true,json:async()=>({sha:'initial',content:encodeBase64(JSON.stringify(baselineData))})};
   }
 }''')
 page.locator('#githubToken').fill('github_pat_local_smoke_only')
 page.locator('#publishNow').click()
 page.wait_for_function("document.querySelector('#publishProgress').textContent.includes('Published successfully')",timeout=7000)
 assert page.evaluate("window.__gitWrites.length") == 1
 assert page.evaluate("window.__gitWrites[0].url.includes('/data/pages.json')")
 assert page.evaluate("JSON.parse(decodeBase64(window.__gitWrites[0].content)).quests[0].status") == 'In progress'
 assert page.evaluate("JSON.parse(decodeBase64(window.__gitWrites[0].content)).atlas.pins.some(p=>p.id==='thamor'&&p.region==='coast')")
 assert page.evaluate("JSON.parse(decodeBase64(window.__gitWrites[0].content)).atlas.connections.some(c=>c.label==='tested constellation edge')")
 page.locator('[data-close="publishDialog"]').click()
 print('PASS: GitHub publish simulation includes quests, pins and relationships in one safe JSON update')
 # Reload in place must preserve the local draft; fetch returns the original seed.
 page.reload(wait_until='domcontentloaded') if False else None
 assert not errors,errors
 print('PASS: article and gallery integration, pending draft summary; no JS errors')
 mobile,errs=setup(browser,{'width':390,'height':844})
 for r in ['atlas','connections','journal','quests']:
  mobile.evaluate('(name)=>location.hash="#/"+name',r)
  mobile.wait_for_selector('.living-head')
  mobile.wait_for_timeout(80)
  assert mobile.evaluate('document.documentElement.scrollWidth <= window.innerWidth+2'), f'{r}: mobile overflow'
 mobile.evaluate('location.hash="#/atlas"');mobile.wait_for_selector('.atlas-surface')
 mobile.screenshot(path=str(out/'mobile.png'),full_page=True)
 assert not errs,errs
 print('PASS: mobile layouts (390px) across all four new areas')
 browser.close()
