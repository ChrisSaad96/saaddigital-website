import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createPreviewServer} from './preview.mjs';

const browserPath = process.env.CHROME_PATH || ['C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(file => fs.existsSync(file));
assert(browserPath, 'Set CHROME_PATH to an installed Chromium browser. Requires Node 22+.');
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'saad-digital-review-'));
const profile = path.join(temporary, 'browser-profile');
const server = createPreviewServer();
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = spawn(browserPath, ['--headless=new','--no-sandbox','--disable-gpu','--disable-software-rasterizer','--disable-background-networking','--no-first-run','--remote-debugging-port=0',`--user-data-dir=${profile}`,'about:blank'], {windowsHide:true,stdio:'ignore'});
let socket;
const errors = [];
try {
  const activePort = path.join(profile,'DevToolsActivePort');
  for (let i=0; i<100 && !fs.existsSync(activePort); i++) await new Promise(resolve => setTimeout(resolve,100));
  assert(fs.existsSync(activePort), 'Browser did not start its test endpoint');
  const port = fs.readFileSync(activePort,'utf8').split('\n')[0];
  const target = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, {method:'PUT'}).then(response=>response.json());
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true});});
  const pending = new Map();
  let sequence = 0;
  socket.addEventListener('message', ({data})=>{
    const message=JSON.parse(data);
    if (message.method==='Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text);
    if (message.method==='Log.entryAdded' && message.params.entry.level==='error' && !message.params.entry.text.includes('404')) errors.push(message.params.entry.text);
    if(pending.has(message.id)){const task=pending.get(message.id);pending.delete(message.id);message.error?task.reject(Error(message.error.message)):task.resolve(message.result);}
  });
  function send(method,params={}) {
    const id=++sequence;
    return new Promise((resolve,reject)=>{pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));});
  }
  async function evaluate(expression) {
    const result=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
    if(result.exceptionDetails) throw Error(result.exceptionDetails.text);
    return result.result.value;
  }
  await send('Page.enable'); await send('Runtime.enable'); await send('Log.enable');
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  async function visit(route,width) {
    await send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<=480});
    await send('Page.navigate',{url:origin+route});
    for(let i=0;i<80;i++){
      await new Promise(resolve=>setTimeout(resolve,25));
      if(await evaluate(`document.readyState==='complete' && location.href===${JSON.stringify(origin+route)}`)) break;
    }
    const result=await evaluate(`({width:innerWidth,client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,body:document.body.scrollWidth,brokenImages:[...document.images].filter(i=>i.complete&&!i.naturalWidth).map(i=>i.src)})`);
    if(result.width!==width) console.log('Overflow elements:', await evaluate(`JSON.stringify([...document.querySelectorAll('body *')].filter(e=>e.getBoundingClientRect().right>${width}).map(e=>({tag:e.tagName,class:e.className,text:e.innerText?.slice(0,45),right:e.getBoundingClientRect().right})))`));
    assert.equal(result.width,width,`${route}: incorrect viewport`);
    assert(result.scroll<=result.client,`${route} at ${width}px overflows: ${JSON.stringify(result)}`);
    assert(result.body<=result.client,`${route} body overflow at ${width}px`);
    assert.deepEqual(result.brokenImages,[],`${route}: missing image`);
    return result;
  }
  const routes=['/','/support.html','/privacy.html','/terms.html','/mivaro-privacy.html','/mivaro-terms.html','/splitmate-privacy.html','/splitmate-terms.html','/sortbound-privacy.html','/sortbound-terms.html','/mivaro/delete-account','/r/?c=AbCdEfGhIjKlMnOpQrStUv','/404.html'];
  let renders=0;
  for(const width of [1920,1440,1024,768,390,320]) {
    for(const route of routes) { await visit(route,width); renders++; }
    console.log(`${width}px: all ${routes.length} pages passed overflow, image and render checks.`);
  }
  for(const width of [1920,1440,1024,768,390,320]) {
    await visit('/r/?c=AbCdEfGhIjKlMnOpQrStUv',width);
    const share=await evaluate(`({left:document.querySelector('.share-card').getBoundingClientRect().left,right:document.querySelector('.share-card').getBoundingClientRect().right,viewport:document.documentElement.clientWidth,tokenVisible:document.body.innerText.includes('AbCdEfGhIjKlMnOpQrStUv'),href:document.querySelector('#open-mivaro').getAttribute('href')})`);
    assert(Math.abs(share.left-(share.viewport-share.right))<=1,'Shared reminder is not centred');
    assert(!share.tokenVisible,'Capability visible in UI');
    assert.equal(share.href,'mivaro://r/AbCdEfGhIjKlMnOpQrStUv');
  }
  for(const query of ['', '?c=short', '?c=AbCdEfGhIjKlMnOpQrStUv&c=AbCdEfGhIjKlMnOpQrStUv']) {
    await visit('/r/'+query,390);
    assert(await evaluate(`document.querySelector('#open-mivaro').hidden`),'Invalid capability enabled action');
  }
  await send('Page.navigate',{url:origin+'/r/AbCdEfGhIjKlMnOpQrStUv'});
  for(let i=0;i<80;i++){await new Promise(resolve=>setTimeout(resolve,25));if(await evaluate(`location.pathname==='/r/'&&location.search==='?c=AbCdEfGhIjKlMnOpQrStUv'`))break;}
  assert(await evaluate(`location.pathname==='/r/'&&location.search==='?c=AbCdEfGhIjKlMnOpQrStUv'`),'Legacy recovery failed');
  await visit('/',390);
  assert(await evaluate(`getComputedStyle(document.querySelector('[data-nav-menu]')).display==='none'`));
  await evaluate(`document.querySelector('[data-nav-toggle]').click()`);
  assert(await evaluate(`document.querySelector('[data-nav-toggle]').getAttribute('aria-expanded')==='true'`));
  await evaluate(`document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))`);
  assert(await evaluate(`document.querySelector('[data-nav-toggle]').getAttribute('aria-expanded')==='false'`));
  assert(await evaluate(`document.activeElement===document.querySelector('[data-nav-toggle]')`),'Escape must return focus to menu button');
  await evaluate(`document.querySelector('[data-nav-toggle]').click(); document.querySelector('[data-nav-menu] a:last-child span').click()`);
  assert(await evaluate(`document.querySelector('[data-nav-toggle]').getAttribute('aria-expanded')==='false'`),'Clicking nested link content must close menu');
  async function capture(name,route,width,selector) {
    await visit(route,width);
    if(selector) await evaluate(`document.querySelector(${JSON.stringify(selector)}).scrollIntoView()`);
    await new Promise(resolve=>setTimeout(resolve,100));
    const image=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
    fs.writeFileSync(path.join(temporary,name+'.png'),Buffer.from(image.data,'base64'));
  }
  await capture('home-desktop','/',1440);
  await capture('products-desktop','/',1440,'.category-heading');
  await capture('sortbound-desktop','/',1440,'#games');
  await capture('home-phone','/',390);
  await capture('products-phone','/',390,'#mivaro');
  await capture('sortbound-phone','/',320,'#games');
  await capture('legal-phone','/sortbound-privacy.html',320);
  await capture('support-tablet','/support.html',768);
  await capture('share-desktop','/r/?c=AbCdEfGhIjKlMnOpQrStUv',1920);
  assert.deepEqual(errors,[],'Browser runtime/CSP errors');
  console.log(`Passed ${renders} page/viewport renders; shared-link centring, privacy, validation, legacy recovery and mobile menu checks. No browser errors.`);
  console.log(`Visual review screenshots: ${temporary}`);
} finally {
  socket?.close();
  browser.kill();
  await new Promise(resolve=>server.close(resolve));
}
