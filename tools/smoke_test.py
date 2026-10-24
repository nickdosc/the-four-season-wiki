from pathlib import Path
import json
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parent.parent
html=(root/'index.html').read_text()
html=html.replace('<meta http-equiv="Content-Security-Policy" content="default-src \'self\'; script-src \'self\'; style-src \'self\'; img-src \'self\' data: blob: https:; connect-src \'self\' https://api.github.com; font-src \'self\'; object-src \'none\'; base-uri \'self\'; form-action \'none\'; frame-ancestors \'none\'">','')
html=html.replace('<head>','<head><base href="https://nickdosc.github.io/the-four-season-wiki/">')
html=html.replace('<link rel="stylesheet" href="assets/style.css">','').replace('<link rel="icon" href="assets/favicon.svg" type="image/svg+xml">','').replace('<script src="assets/app.js" defer></script>','')
css=(root/'assets/style.css').read_text()
js=(root/'assets/app.js').read_text()
data=json.loads((root/'data/pages.json').read_text())
out=root/'tools/_previews'
out.mkdir(exist_ok=True)
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 errors=[]
 def setup(page):
  page.set_default_timeout(6000)
  page.on('pageerror',lambda err: errors.append(str(err)))
  page.set_content(html,wait_until='domcontentloaded')
  page.add_style_tag(content=css)
  page.evaluate('''(data)=>{
    const draft={};Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:(k)=>draft[k]??null,setItem:(k,v)=>{draft[k]=v},removeItem:(k)=>{delete draft[k]}}});
    window.fetch=async (url,opts)=>({ok:true,json:async()=>structuredClone(data)});
    window.indexedDB=undefined;
  }''',data)
  page.add_script_tag(content=js)
  page.wait_for_selector('.hero')
 page=browser.new_page(viewport={'width':1440,'height':980},device_scale_factor=1)
 setup(page)
 assert page.locator('.starfield i').count()==40
 assert page.locator('.brand-copy strong').inner_text()=='DAUGHTER OF THE MOON'
 assert 'Moon Wiki' in page.locator('.hero h1').inner_text()
 button=page.locator('#newEntry')
 before=button.bounding_box()
 page.mouse.move(before['x']+4,before['y']+5)
 page.wait_for_timeout(300)
 assert before==button.bounding_box(), 'Button moved while being hovered'
 assert button.evaluate('(e)=>e.matches(":hover")'), 'Button lost hover state'
 assert button.evaluate('(e)=>getComputedStyle(e).transform')=='none', 'Unexpected button transform'
 print('POLISH PASS: 40 stars, correct title, stable hover position')
 page.screenshot(path=str(out/'desktop.png'),full_page=True)
 assert page.locator('.wiki-card').count()==6,page.locator('.wiki-card').count()
 page.evaluate("location.hash='#/article/thamor'")
 page.wait_for_selector('.article-hero h1')
 assert page.locator('.article-hero h1').inner_text()=='Thamor'
 assert page.locator('.article-prose a[href="#/article/arven"]').count()>=1
 page.locator('.article-topline button').click()
 assert page.locator('#editorDialog').evaluate('(x) => x.open')
 page.locator('#editSummary').fill('Updated summary for testing')
 page.locator('#saveDraft').click()
 assert 'Updated summary' in page.locator('.article-hero p').inner_text()
 page.locator('#newEntry').click()
 page.locator('#editTitle').fill('The Testing Scribe')
 page.locator('#editSummary').fill('Created via the wiki editor')
 page.locator('#editBody').fill('# Hello\nA new road to [[Thamor]] and [[Bramwell Elixor|Bramwell]].')
 page.locator('#saveDraft').click()
 assert page.locator('.article-hero h1').inner_text()=='The Testing Scribe'
 assert page.locator('#main .article-prose .wiki-link').count()==2
 # Simulate a minimal local image store and test an actual image attachment.
 page.evaluate("""() => {
  window.__mockImages={};
  imageDb={transaction:()=>{const tx={};tx.objectStore=()=>({put:(obj)=>{window.__mockImages[obj.path]=obj.dataUrl},delete:(key)=>{delete window.__mockImages[key]}});setTimeout(()=>tx.oncomplete?.(),1);return tx}};
 }""")
 from io import BytesIO
 from PIL import Image
 b=BytesIO();Image.new('RGBA',(10,10),(150,50,230,255)).save(b,format='PNG')
 page.locator('.article-topline button').click()
 page.locator('#inlineImageInput').set_input_files({'name':'sample.png','mimeType':'image/png','buffer':b.getvalue()})
 page.wait_for_function('Object.keys(window.__mockImages).length>0')
 assert 'assets/uploads/' in page.locator('#editBody').input_value()
 page.locator('#saveDraft').click()
 assert page.locator('#main figure img').count()==1
 page.locator('#editorHub').click()
 assert '2 unpublished article changes' in page.locator('#draftStatus').inner_text()
 # Publish through an entirely mocked GitHub API and verify image/data PUT order.
 page.evaluate("""() => {
  window.__gitWrites=[];
  window.fetch=async (url,opts={})=>{
   if(opts.method==='PUT'){
     const payload=JSON.parse(opts.body);
     window.__gitWrites.push({url,content:payload.content});
     return {ok:true,json:async()=>({content:{sha:'committed'}})};
   }
   return {ok:true,json:async()=>({sha:'oldhash',content:encodeBase64(JSON.stringify(baselineData))})};
  }
 }""")
 page.locator('#githubToken').fill('github_pat_smoketest')
 page.locator('#publishNow').click()
 page.wait_for_function("document.querySelector('#publishProgress').textContent.includes('Published successfully')",timeout=8000)
 assert page.evaluate('window.__gitWrites.length')==2
 assert page.evaluate("window.__gitWrites[0].url.includes('/assets/uploads/')")
 assert page.evaluate("window.__gitWrites[1].url.includes('/data/pages.json')")
 page.locator('[data-close="publishDialog"]').click()
 assert not errors,errors
 print('DESKTOP PASS: homepage, editor, article creation, links, image upload, GitHub publish mock')
 mobile=browser.new_page(viewport={'width':390,'height':844},device_scale_factor=1)
 setup(mobile)
 mobile.screenshot(path=str(out/'mobile.png'),full_page=True)
 assert mobile.locator('h1').first.is_visible()
 assert mobile.evaluate('document.documentElement.scrollWidth <= window.innerWidth+2'), 'Mobile horizontal overflow'
 mobile.locator('#searchOpen').click()
 mobile.locator('#searchInput').fill('Velka')
 assert mobile.locator('.search-result').count()>0
 mobile.locator('.search-result').first.click()
 assert mobile.locator('.article-hero h1').inner_text()=='Velka'
 assert not errors,errors
 print('MOBILE PASS: responsive, no overflow, search and navigation')
 browser.close()
