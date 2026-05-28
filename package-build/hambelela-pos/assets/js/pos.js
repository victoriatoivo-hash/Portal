/* Hambelela POS v3.0 â€” Full vanilla JS, ChiliPOS-inspired layout */
(function(){
'use strict';
var D=document;
var API,NK,CFG={},CASHIER,SITE_URL;
var NAM_REGIONS=[
  {code:'KH',name:'Khomas',      ship:'Delivery',        cost:40},
  {code:'ER',name:'Erongo',      ship:'Courier Nampost', cost:70},
  {code:'HA',name:'Hardap',      ship:'Courier Nampost', cost:70},
  {code:'KA',name:'Karas',       ship:'Courier Nampost', cost:70},
  {code:'KU',name:'Kunene',      ship:'Courier Nampost', cost:70},
  {code:'OW',name:'Ohangwena',   ship:'Courier Nampost', cost:70},
  {code:'OM',name:'Omaheke',     ship:'Courier Nampost', cost:70},
  {code:'ON',name:'Omusati',     ship:'Courier Nampost', cost:70},
  {code:'OS',name:'Oshana',      ship:'Courier Nampost', cost:70},
  {code:'OT',name:'Oshikoto',    ship:'Courier Nampost', cost:70},
  {code:'OD',name:'Otjozondjupa',ship:'Courier Nampost', cost:70},
  {code:'CA',name:'Kavango East',ship:'Courier Nampost', cost:70},
  {code:'CW',name:'Kavango West',ship:'Courier Nampost', cost:70},
  {code:'ZA',name:'Zambezi',     ship:'Courier Nampost', cost:70},
];
var PAYS=[
  {id:'cash',     label:'Cash',            e:'banknote'},
  {id:'swipe',    label:'Card/Swipe',      e:'credit-card'},
  {id:'eft',      label:'EFT',             e:'landmark'},
  {id:'fnbwlt',   label:'FNB eWallet',     e:'wallet'},
  {id:'easywlt',  label:'EasyWallet',      e:'wallet'},
  {id:'bluewlt',  label:'Blue Wallet',     e:'wallet'},
  {id:'nedbank',  label:'Nedbank',         e:'landmark'},
  {id:'netbank',  label:'NetBank Wallet',  e:'landmark'},
  {id:'pay2cell', label:'Pay2Cell',        e:'phone'},
  {id:'paytoday', label:'PayToday',        e:'zap'},
];
var AUTO=['swipe','eft','fnbwlt','easywlt','bluewlt','nedbank','netbank','pay2cell','paytoday'];

// Payment method matching helper â€” normalises labels for filter/search
function payMatches(order, q){
  if(!q) return true;
  q=q.toLowerCase();
  var title=(order.payment_title||'').toLowerCase();
  var method=(order.payment_method||'').toLowerCase();
  // Direct match on stored title or method id
  if(title.includes(q)||method.includes(q)) return true;
  // Resolve the PAYS label for the stored method id and check that too
  var pay=PAYS.find(function(m){return m.id===method;});
  if(pay&&pay.label.toLowerCase().includes(q)) return true;
  return false;
}

function fmt(n){return (CFG.currency||'N$')+' '+Number(n||0).toFixed(2);}
function fdt(s){if(!s)return'â€”';var d=new Date(s);return isNaN(d)?s:d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})+' '+d.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',second:'2-digit'});}
function fdateOnly(s){if(!s)return'â€”';var d=new Date(s);return isNaN(d)?s:d.toLocaleDateString('en-GB',{day:'2-digit',month:'long',year:'numeric'});}
function ini(n){return(n||'').split(' ').map(function(w){return w[0]||'';}).join('').slice(0,2).toUpperCase();}
function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function iconSvg(name,size){
  size=size||18;
  var icons={
    terminal:'M4 17l6-5-6-5M12 19h8', orders:'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01', file:'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6', pause:'M8 5v14M16 5v14', box:'M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z M3.3 7 12 12l8.7-5M12 22V12', chart:'M3 3v18h18M7 16v-5M12 16V7M17 16v-8', briefcase:'M10 6V5a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v1M3 7h18v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z M3 12h18', refund:'M9 14 4 9l5-5M4 9h11a5 5 0 0 1 0 10h-1', drawer:'M4 4h16v8H4z M6 12v8h12v-8 M10 16h4', newspaper:'M4 5h16v14H4z M8 8h8M8 12h8M8 16h5', store:'M4 10h16M5 10l1-5h12l1 5M6 10v9h12v-9M9 19v-5h6v5', settings:'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.08a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.08a1.7 1.7 0 0 0 1.55-1 1.7 1.7 0 0 0-.34-1.88l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.08a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.14.45.52.83 1 1h.6a2 2 0 1 1 0 4h-.08a1.7 1.7 0 0 0-1.52 1Z', banknote:'M3 6h18v12H3z M7 10h.01M17 14h.01M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z', 'credit-card':'M3 5h18v14H3z M3 10h18 M7 15h3', landmark:'M3 21h18M5 10h14M6 18V10M10 18V10M14 18V10M18 18V10M12 3l8 7H4Z', wallet:'M3 7h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z M17 12h4v4h-4a2 2 0 0 1 0-4Z', phone:'M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.7 2.6a2 2 0 0 1-.45 2.1L8.1 9.9a16 16 0 0 0 6 6l1.5-1.3a2 2 0 0 1 2.1-.45c.8.3 1.7.6 2.6.7a2 2 0 0 1 1.7 2Z', zap:'M13 2 3 14h8l-1 8 10-12h-8z', user:'M20 21a8 8 0 0 0-16 0M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z', truck:'M10 17H6a2 2 0 0 1-2-2V5h10v12M14 8h4l3 4v3a2 2 0 0 1-2 2h-1M7 17a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM16 17a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z', tag:'M20 13 11 22 2 13V2h11z M7 7h.01', search:'M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z', printer:'M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z', x:'M18 6 6 18M6 6l12 12', check:'M20 6 9 17l-5-5', plus:'M12 5v14M5 12h14'
  };
  return '<svg class="hicon-svg" width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="'+(icons[name]||icons.box)+'"/></svg>';
}
function iconNode(name,size){return el('span',{cls:'hicon',html:iconSvg(name,size)});}
function copyOrderLine(o){
  var b=o.billing||{};
  var cust=(b.first_name?(b.first_name+' '+(b.last_name||'')).trim():'HO Customer')||'HO Customer';
  var text='#'+o.number+' - '+cust.replace(/\s+/g,' ').trim();
  if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(function(){toast('Copied: '+text,'ok');}).catch(function(){fallbackCopy(text);});}
  else fallbackCopy(text);
}
function fallbackCopy(text){var ta=el('textarea',{style:{position:'fixed',left:'-9999px',top:'0'}},[text]);D.body.appendChild(ta);ta.select();D.execCommand('copy');ta.remove();toast('Copied: '+text,'ok');}

function api(path,opts){
  return fetch(API+path,Object.assign({headers:{'Content-Type':'application/json','X-WP-Nonce':NK}},opts||{}))
    .then(function(r){return r.json().then(function(d){if(!r.ok)throw new Error(d.error||'API '+r.status);return d;});});
}

// apiForce â€” same as api() but adds cache-busting headers and a ?_t= timestamp
// Use for all product/stock reloads so browsers and WP object cache are bypassed
function apiForce(path,opts){
  var sep=path.includes('?')?'&':'?';
  var busted=path+sep+'_t='+Date.now();
  var headers=Object.assign({'Content-Type':'application/json','X-WP-Nonce':NK,
    'Cache-Control':'no-cache, no-store, must-revalidate',
    'Pragma':'no-cache'
  },(opts&&opts.headers)||{});
  return fetch(API+busted,Object.assign({},opts||{},{headers:headers}))
    .then(function(r){return r.json().then(function(d){if(!r.ok)throw new Error(d.error||'API '+r.status);return d;});});
}

function el(tag,props,kids){
  var n=D.createElement(tag);
  if(props)Object.keys(props).forEach(function(k){
    var v=props[k];
    if(k==='cls')n.className=v;
    else if(k==='style'&&typeof v==='object')Object.assign(n.style,v);
    else if(k==='html')n.innerHTML=v;
    else if(k.startsWith('on')&&typeof v==='function')n.addEventListener(k.slice(2).toLowerCase(),v);
    else if(k==='value')n.value=v;
    else if(k==='checked')n.checked=!!v;
    else if(k==='disabled'){if(v)n.disabled=true;}
    else if(k==='selected'){if(v)n.selected=true;}
    else n.setAttribute(k,v);
  });
  if(kids)[].concat(kids).forEach(function(c){
    if(c==null||c===false)return;
    n.appendChild(typeof c==='string'||typeof c==='number'?D.createTextNode(String(c)):c);
  });
  return n;
}

function toast(msg,type){
  var t=el('div',{cls:'htoast ht-'+(type||'ok')},[msg]);
  D.body.appendChild(t);setTimeout(function(){t.classList.add('hout');setTimeout(function(){t.remove();},400);},2800);
}

// â”€â”€ STATE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
var S={
  page:'pos',
  products:[],cats:['All'],loadP:true,catF:'All',srchQ:'',
  // Lazy loading / virtual paging
  gridPage:0,          // how many "pages" of GRID_PAGE_SIZE have been rendered
  // View mode: 'all' | 'best' | 'low'
  posView:'best',
  // Quick-access pinned products (array of product ids)
  quickPins:[],
  cart:[],customer:null,billing:{},shipping:{},useDiffShip:false,
  shipMethod:null,shipOptions:[],
  discount:'',discType:'%',coupon:'',couponData:null,
  payMethod:'cash',
  splitOn:false,splitCashM:'cash',splitCash:'',splitOtherM:'eft',splitOther:'',
  orderStatus:'processing',orderStatuses:[],note:'',
  orders:[],loadO:false,ordQ:'',ordPayF:'',
  quotes:[],loadQ:false,quotesLoaded:false,quoteQ:'',quoteStatusF:'all',  // payment method filter
  payDrill:null,                              // drill-down method in Summary (null = none)
  held:[],
  inv:[],loadI:false,invQ:'',invF:null,
  budget:null,budgetLoaded:false,budgetTab:'revenue',budgetAuth:false,
  budgetAttempts:0,budgetLockUntil:0,budgetSalesData:null,budgetSalesLoaded:false,
  reports:null,loadR:false,rpP:'today',rpFrom:'',rpTo:'',
  orderRef:'POS-'+(1000+Math.floor(Math.random()*9000)),
  modal:null,
  // Cash drawer
  cashSession:null,
  // Offline queue
  offlineQueue:[],isOnline:navigator.onLine,
  // Barcode buffer
  _bcode:'',_blast:0,
  // Refunds
  refunds:[],loadRef:false,
  // Print width: '58mm','80mm','a4'
  printWidth:'80mm',
  // PIN login
  pinUnlocked:false,
  // Inventory log
  invLogData:[],loadInvLog:false,invTab:'stock', // 'stock' | 'log'
  // Reports tab
  repTab:'summary', // 'summary' | 'products' | 'refunds' | 'delivery' | 'vat' | 'inventory'
  // Sensitive report PIN (session only â€” cleared on page refresh)
  repPinAuth:false,
  syncStatus:'',    // last sync confirmation message
};

var ROOT;
function boot(){
  ROOT=D.getElementById('hpos-root');
  if(!ROOT){setTimeout(boot,100);return;}
  var d=window.hposData||{};
  API=d.apiUrl||'/wp-json/hpos/v1';
  NK=d.nonce||'';
  CASHIER=d.cashierName||'Admin';
  SITE_URL=d.siteUrl||'';
  CFG.currency=d.currency||'N$';
  CFG.store_name=d.storeName||'Hambelela Organic';
  CFG.location=d.location||'Windhoek Store';
  CFG.receipt_footer=d.receiptFooter||'Thank you!';
  CFG.vat_number=d.vatNumber||'';
  CFG.store_address=d.storeAddress||'';
  CFG.store_phone=d.storePhone||'';
  CFG.store_email=d.storeEmail||'';
  CFG.logo_url=d.logoUrl||'';
  CFG.staff_pin=d.staffPin||'';
  CFG.reports_pin=d.reportsPin||'';
  CFG.budget_pin=d.budgetPin||'';
  // Expose globals so catalogue.js (outside IIFE) can call these
  window.hposAPI     = function(path,opts){ return api(path,opts); };
  window.hposCFG     = CFG;
  window.hposRedraw  = function(){ redraw(); };
  window.hposSiteUrl = function(){ return SITE_URL; };
  injectCSS();
  // Load printWidth from settings
  try{var pw=localStorage.getItem('hpos_printwidth');if(pw)S.printWidth=pw;}catch(e){}
  try{var qp=localStorage.getItem('hpos_quickpins');if(qp)S.quickPins=JSON.parse(qp)||[];}catch(e){}
  try{var pv=localStorage.getItem('hpos_posview');if(pv)S.posView=pv;}catch(e){}
  // Barcode scanner â€” listens for rapid keystrokes ending in Enter
  D.addEventListener('keydown',function(e){
    if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA'||e.target.isContentEditable)return;
    var now=Date.now();
    if(now-S._blast>100){S._bcode='';}
    S._blast=now;
    if(e.key==='Enter'){
      if(S._bcode.length>=3){handleBarcode(S._bcode);}
      S._bcode='';
    } else if(e.key.length===1){S._bcode+=e.key;}
  });
  // Offline detection
  window.addEventListener('online', function(){S.isOnline=true;syncOfflineQueue();toast('Back online â€” syncing ordersâ€¦','info');});
  window.addEventListener('offline',function(){S.isOnline=false;toast('Offline mode active','err');});
  // Load offline queue from localStorage
  try{var q=localStorage.getItem('hpos_offline');if(q)S.offlineQueue=JSON.parse(q)||[];}catch(e){}
  if(S.offlineQueue.length)toast(S.offlineQueue.length+' offline order(s) pending sync','info');

  // Load settings then render
  api('/settings').then(function(d){
    Object.keys(d).forEach(function(k){CFG[k]=d[k];});
    CFG.currency=CFG.currency||'N$';
  }).catch(function(){}).then(function(){
    draw();
    var pin=d.staffPin||CFG.staff_pin||'';
    if(pin&&!S.pinUnlocked){showPinModal(pin);}
    else{S.pinUnlocked=true;if(S.page==='pos')loadProducts();}
  });
}

function draw(){ROOT.innerHTML='';ROOT.appendChild(buildApp());}
function redraw(){draw();}
function go(page){
  S.page=page;
  if(page==='orders'&&!S.orders.length)fetchOrders();
  if(page==='inventory'&&!S.inv.length)fetchInv();
  if(page==='reports'&&!S.reports)fetchReports('today');
  redraw();
}

// â”€â”€ FETCHERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function loadProducts(force){
  S.loadP=true;
  S.syncStatus='';  // clear any previous sync message
  // Use apiForce when explicitly reloading so browser + WP cache is bypassed
  var fetcher = force ? apiForce : api;
  Promise.all([fetcher('/products'),fetcher('/shipping'),fetcher('/statuses')]).then(function(r){
    S.products=Array.isArray(r[0])?r[0]:[];
    var cats=['All'];
    S.products.forEach(function(p){(p.categories||[]).forEach(function(c){if(!cats.includes(c))cats.push(c);});});
    S.cats=cats;
    S.shipOptions=Array.isArray(r[1])?r[1]:[];
    if(!S.shipMethod&&S.shipOptions.length){
      S.shipMethod=S.shipOptions.find(function(z){return /delivery|local/i.test(z.title);})||S.shipOptions[0];
    }
    S.orderStatuses=Array.isArray(r[2])?r[2]:[{key:'processing',label:'Processing'},{key:'completed',label:'Completed'}];
    S.loadP=false;
    if(force){
      var count=S.products.length;
      toast('âœ“ '+count+' products updated from WooCommerce','ok');
      S.syncStatus='âœ“ Last synced: '+new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
    }
    redraw();
  }).catch(function(e){
    S.loadP=false;
    toast('Reload failed: '+e.message,'err');
    redraw();
  });
}
function fetchOrders(){S.loadO=true;api('/orders?per_page=300').then(function(d){S.orders=Array.isArray(d)?d:[];S.loadO=false;if(S.page==='orders')redraw();}).catch(function(){S.loadO=false;});}
function fetchInv(){S.loadI=true;api('/inventory').then(function(d){S.inv=Array.isArray(d)?d:[];S.loadI=false;if(S.page==='inventory')redraw();}).catch(function(){S.loadI=false;});}
function fetchReports(p){
  S.loadR=true;S.rpP=p;
  var x=S.rpFrom&&S.rpTo?'&from='+S.rpFrom+'&to='+S.rpTo:'';
  // Use 'today' date for daily-summary top products
  var todayDate=new Date().toISOString().slice(0,10);
  var summaryDate=p==='today'?todayDate:todayDate;
  Promise.all([
    api('/reports?period='+p+x),
    api('/daily-summary?date='+encodeURIComponent(summaryDate)),
  ]).then(function(r){
    S.reports=r[0];
    if(r[1]&&r[1].top_products)S.reports.top_products=r[1].top_products;
    S.loadR=false;
    if(S.page==='reports')redraw();
  }).catch(function(e){
    S.loadR=false;
    // Try just the reports endpoint on failure
    api('/reports?period='+p+x).then(function(d){S.reports=d;if(S.page==='reports')redraw();}).catch(function(e2){S.reports={error:e2.message};if(S.page==='reports')redraw();});
  });
}

// â”€â”€ APP SHELL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function buildApp(){
  return el('div',{cls:'happ'},[sidebar(),content()]);
}

function sidebar(){
  var items=[
    {k:'pos',      icon:'terminal',   label:'POS Terminal'},
    {k:'orders',   icon:'orders',     label:'Orders'},
    {k:'quotes',   icon:'file',       label:'Quotes'},
    {k:'held',     icon:'pause',      label:'On Hold'+(S.held.length?' ('+S.held.length+')':'')},
    {k:'inventory',icon:'box',        label:'Inventory'+(S.inv.filter(function(i){return i.stock_qty>0&&i.stock_qty<=5;}).length?' Low':'')},
    {k:'reports',  icon:'chart',      label:'Reports'},
    {k:'budget',   icon:'briefcase',  label:'Budget'},
    {k:'refunds',  icon:'refund',     label:'Refunds'},
    {k:'drawer',   icon:'drawer',     label:'Cash Drawer'+(S.cashSession?' Open':'')},
    {k:'catalogue',icon:'newspaper',  label:'Catalogue'},
    {k:'wholesale',icon:'store',      label:'Wholesale'},
    {k:'ws-products',icon:'box',      label:'WS Products'},
    {k:'settings', icon:'settings',   label:'Settings'},
  ];
  return el('div',{cls:'hsb'},[
    el('div',{cls:'hsblogo'},[
      el('div',{cls:'hsblogoico'},['H']),
      el('div',{cls:'hsblogoname'},[CFG.store_name||'POS']),
      el('div',{style:{fontSize:'9px',color:'rgba(255,255,255,.35)',marginTop:'2px',letterSpacing:'1px'}},['v4.7.0']),
    ]),
    S.offlineQueue.length?el('div',{cls:'hoffline-banner'},['Offline: '+S.offlineQueue.length+' order(s) queued']):null,
    el('nav',{cls:'hsbnav'},items.map(function(it){
      return el('button',{cls:'hsbnav-item'+(S.page===it.k?' active':''),onClick:function(){go(it.k);}},[ 
        el('span',{cls:'hsbnav-icon',html:iconSvg(it.icon,18)}),
        el('span',{cls:'hsbnav-label'},[it.label]),
      ]);
    })),
    el('div',{cls:'hsbfoot'},[
      el('div',{cls:'hsbcashier'},[
        el('div',{cls:'hsbcav'},[ini(CASHIER)]),
        el('div',{cls:'hsbcinfo'},[
          el('div',{cls:'hsbcname'},[CASHIER]),
          el('div',{cls:'hsbcloc'},[CFG.location||'Main']),
        ]),
      ]),
    ]),
  ]);
}

function content(){
  var c;
  switch(S.page){
    case 'pos':       c=posLayout(); break;
    case 'orders':    c=ordersPage(); break;
    case 'quotes':    c=quotesPage(); break;
    case 'held':      c=heldPage(); break;
    case 'inventory': c=invPage(); break;
    case 'reports':   c=reportsPage(); break;
    case 'budget':    c=budgetPage(); break;
    case 'refunds':   c=refundsPage(); break;
    case 'drawer':    c=drawerPage(); break;
    case 'catalogue': c=catPage(); break;
    case 'wholesale': c=wsAdminPage(); break;
    case 'ws-products': c=wsProductsPage(); break;
    case 'settings':  c=settingsPage(); break;
    default:          c=posLayout();
  }
  return el('div',{cls:'hcontent'},[c]);
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// POS LAYOUT â€” ChiliPOS style: products left, cart right
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function posLayout(){
  if(S.loadP&&!S.products.length)loadProducts();
  return el('div',{cls:'hpos'},[
    productPanel(),
    cartPanel(),
  ]);
}

// â”€â”€ PRODUCT PANEL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
var GRID_PAGE = 36; // products per lazy-load batch

function getFilteredProducts(){
  var q=S.srchQ.toLowerCase().trim();
  var items=S.products.filter(function(p){
    var mc=S.catF==='All'||(p.categories||[]).includes(S.catF);
    return mc&&(!q||p.name.toLowerCase().includes(q)||(p.sku||'').toLowerCase().includes(q));
  });
  // Sort by view mode when not searching/filtering
  if(!q&&S.catF==='All'&&S.posView!=='all'){
    if(S.posView==='best'){
      try{
        var bs=JSON.parse(localStorage.getItem('hpos_bscount')||'{}');
        items=items.slice().sort(function(a,b){return (bs[b.id]||0)-(bs[a.id]||0);});
      }catch(e){}
    } else if(S.posView==='low'){
      items=items.filter(function(p){return p.manage_stock&&p.stock_qty!=null&&p.stock_qty>0&&p.stock_qty<=10;})
                 .sort(function(a,b){return (a.stock_qty||0)-(b.stock_qty||0);});
    }
  }
  return items;
}

function productPanel(){
  var filtered=getFilteredProducts();

  // â”€â”€ HEADER â”€â”€
  var hdr=D.createElement('div');
  hdr.style.cssText='display:flex;align-items:center;justify-content:space-between;padding:12px 16px 10px;background:#fff;border-bottom:1px solid #e2e8f0;flex-shrink:0;gap:8px;';

  var htitle=D.createElement('div');
  htitle.style.cssText='font-size:16px;font-weight:700;color:#111;flex-shrink:0;';
  htitle.textContent='Point of Sale';

  // View toggle pills
  var viewPills=D.createElement('div');
  viewPills.style.cssText='display:flex;gap:4px;';
  [['best','Best'],['all','All'],['low','Low Stock']].forEach(function(v){
    var b=D.createElement('button');
    var active=S.posView===v[0];
    b.style.cssText='padding:4px 10px;border-radius:14px;border:1.5px solid '+(active?'#1a1a2e':'#e2e8f0')+';background:'+(active?'#1a1a2e':'#f8fafc')+';color:'+(active?'#fff':'#6b7280')+';font-size:11px;font-weight:600;cursor:pointer;font-family:inherit;white-space:nowrap;';
    b.textContent=v[1];
    b.addEventListener('click',function(){S.posView=v[0];S.gridPage=0;try{localStorage.setItem('hpos_posview',v[0]);}catch(e){}updateGrid(D.getElementById('hpgrid'));});
    viewPills.appendChild(b);
  });

  // Custom item + refresh button
  var hdrRight=D.createElement('div');
  hdrRight.style.cssText='display:flex;align-items:center;gap:6px;';
  var customBtn=D.createElement('button');
  customBtn.style.cssText='padding:5px 11px;border-radius:8px;border:1.5px solid #e2e8f0;background:#f8fafc;color:#374151;font-size:11px;font-weight:600;cursor:pointer;font-family:inherit;';
  customBtn.textContent='+ Custom Item';
  customBtn.addEventListener('click',showCustomItemModal);
  // Refresh products button â€” small, unobtrusive
  var refreshBtn=D.createElement('button');
  refreshBtn.title='Reload all products, prices and stock from WooCommerce';
  refreshBtn.style.cssText='padding:5px 9px;border-radius:8px;border:1.5px solid #e2e8f0;background:#f8fafc;color:#6b7280;font-size:11px;cursor:pointer;font-family:inherit;line-height:1;display:flex;align-items:center;gap:4px;';
  refreshBtn.innerHTML=S.loadP?'<span style="display:inline-block;width:11px;height:11px;border:2px solid #e2e8f0;border-top-color:#4ade80;border-radius:50%;animation:spin .7s linear infinite;"></span>':'â†»';
  refreshBtn.disabled=S.loadP;
  refreshBtn.addEventListener('click',function(){
    if(S.loadP)return;
    S.products=[]; S.cats=['All']; S.gridPage=0;
    S._wsProds=null;
    loadProducts(true);  // force=true â†’ cache-busting fetch
    redraw(); // show spinner immediately
  });
  // Show last sync time if available
  var syncLbl=D.createElement('div');
  syncLbl.style.cssText='font-size:10px;color:#9ca3af;white-space:nowrap;';
  syncLbl.textContent=S.syncStatus||new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
  hdrRight.appendChild(viewPills);
  hdrRight.appendChild(customBtn);
  hdrRight.appendChild(refreshBtn);
  hdrRight.appendChild(syncLbl);
  hdr.appendChild(htitle);
  hdr.appendChild(hdrRight);

  // â”€â”€ SEARCH â”€â”€
  var srch=D.createElement('input');
  srch.type='text';
  srch.placeholder='Search name, SKU or scan barcode...';
  srch.value=S.srchQ;
  srch.style.cssText='width:100%;padding:9px 14px;border:1.5px solid #e2e8f0;border-radius:10px;background:#f8fafc;font-size:13px;color:#111;outline:none;font-family:inherit;box-sizing:border-box;';
  srch.addEventListener('focus',function(){this.style.borderColor='#4ade80';});
  srch.addEventListener('blur',function(){this.style.borderColor='#e2e8f0';});
  srch.addEventListener('keydown',function(e){e.stopPropagation();});
  srch.addEventListener('input',function(){
    S.srchQ=srch.value;S.gridPage=0;
    var grid=D.getElementById('hpgrid');
    if(grid)updateGrid(grid);
  });
  var srchWrap=D.createElement('div');
  srchWrap.style.cssText='padding:8px 16px 0;flex-shrink:0;';
  srchWrap.appendChild(srch);

  // â”€â”€ QUICK PINS â”€â”€
  var quickBar=buildQuickBar();

  // â”€â”€ CATEGORY BAR â”€â”€
  var catBar=D.createElement('div');
  catBar.style.cssText='display:flex;gap:6px;padding:8px 16px 0;overflow-x:auto;scrollbar-width:none;flex-shrink:0;';
  S.cats.forEach(function(c){
    var active=S.catF===c;
    var btn=D.createElement('button');
    btn.style.cssText='padding:5px 14px;border-radius:20px;border:1.5px solid '+(active?'#1a1a2e':'#e2e8f0')+';background:'+(active?'#1a1a2e':'#fff')+';color:'+(active?'#fff':'#6b7280')+';font-size:11px;font-weight:'+(active?'700':'500')+';cursor:pointer;white-space:nowrap;flex-shrink:0;font-family:inherit;';
    btn.textContent=c;
    btn.addEventListener('click',function(){S.catF=c;S.srchQ='';S.gridPage=0;redraw();});
    catBar.appendChild(btn);
  });

  // â”€â”€ GRID â”€â”€
  var grid=D.createElement('div');
  grid.id='hpgrid';
  // 4-6 products per row: minmax(150px,1fr) with max 6 cols
  grid.style.cssText='flex:1;overflow-y:auto;padding:12px 16px;display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;align-content:start;max-width:100%;';
  renderGrid(grid,filtered);

  // Infinite scroll â€” load more when user scrolls to bottom
  grid.addEventListener('scroll',function(){
    if(grid.scrollHeight-grid.scrollTop-grid.clientHeight<200){
      var f2=getFilteredProducts();
      if(S.gridPage*GRID_PAGE < f2.length){
        S.gridPage++;
        appendGrid(grid,f2.slice(0,S.gridPage*GRID_PAGE));
      }
    }
  });

  // Loading state
  if(S.loadP&&!S.products.length){
    grid.innerHTML='';
    var ldg=D.createElement('div');
    ldg.style.cssText='grid-column:1/-1;display:flex;align-items:center;justify-content:center;padding:60px;gap:10px;color:#9ca3af;font-size:13px;';
    var sp=D.createElement('div');
    sp.style.cssText='width:18px;height:18px;border:2px solid #e2e8f0;border-top-color:#4ade80;border-radius:50%;animation:spin .7s linear infinite;flex-shrink:0;';
    ldg.appendChild(sp);
    ldg.appendChild(D.createTextNode(' Loading products...'));
    grid.appendChild(ldg);
  }

  // Panel wrapper
  var panel=D.createElement('div');
  panel.style.cssText='flex:1;display:flex;flex-direction:column;overflow:hidden;background:#f8fafc;min-width:0;';
  panel.appendChild(hdr);
  panel.appendChild(srchWrap);
  if(quickBar)panel.appendChild(quickBar);
  panel.appendChild(catBar);
  panel.appendChild(grid);
  return panel;
}

// â”€â”€ QUICK PINS BAR â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function buildQuickBar(){
  // Always show quick bar; if no pins yet show placeholder prompt
  var bar=D.createElement('div');
  bar.style.cssText='display:flex;gap:6px;padding:6px 16px 0;overflow-x:auto;scrollbar-width:none;flex-shrink:0;align-items:center;';
  
  var label=D.createElement('div');
  label.style.cssText='font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.5px;white-space:nowrap;flex-shrink:0;';
  label.textContent='Quick:';
  bar.appendChild(label);

  if(!S.quickPins.length){
    var hint=D.createElement('div');
    hint.style.cssText='font-size:11px;color:#c4c4c4;font-style:italic;';
    hint.textContent='Long-press a product to pin it here';
    bar.appendChild(hint);
    return bar;
  }

  S.quickPins.forEach(function(pid){
    var prod=S.products.find(function(p){return p.id===pid;});
    if(!prod)return;
    var btn=D.createElement('button');
    btn.style.cssText='padding:5px 12px;border-radius:8px;border:1.5px solid #4ade80;background:#f0fdf4;color:#15803d;font-size:11px;font-weight:700;cursor:pointer;white-space:nowrap;flex-shrink:0;font-family:inherit;position:relative;';
    btn.textContent=prod.name.length>18?prod.name.slice(0,17)+'â€¦':prod.name;
    btn.title=prod.name+' â€” '+fmt(prod.price)+'\nRight-click to unpin';
    btn.addEventListener('click',function(){clickProd(prod);});
    btn.addEventListener('contextmenu',function(e){e.preventDefault();S.quickPins=S.quickPins.filter(function(x){return x!==pid;});try{localStorage.setItem('hpos_quickpins',JSON.stringify(S.quickPins));}catch(err){}var qb=D.getElementById('hpos-quickbar');if(qb)qb.replaceWith(buildQuickBar()||D.createElement('div'));else redraw();toast('Unpinned','info');});
    bar.appendChild(btn);
  });
  bar.id='hpos-quickbar';
  return bar;
}

// â”€â”€ CUSTOM ITEM MODAL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function showCustomItemModal(){
  var vals={name:'',price:'',qty:'1'};
  var body=el('div',{cls:'hform'},[
    el('p',{cls:'hform-section'},['Add a custom product not in your catalog']),
    ff('Item Name / Description','text',vals,'name'),
    frow([ff('Price (N$)','number',vals,'price'),ff('Quantity','number',vals,'qty')]),
    el('button',{cls:'hbtn hbtn-primary hbtn-full',style:{marginTop:'12px'},onClick:function(){
      var name=(vals.name||'').trim();
      var price=parseFloat(vals.price)||0;
      var qty=Math.max(1,parseInt(vals.qty)||1);
      if(!name){toast('Enter item name','err');return;}
      if(!price){toast('Enter a price','err');return;}
      // Build a fake product and add it
      var fakeId='custom-'+Date.now();
      for(var i=0;i<qty;i++){
        addToCart({id:fakeId,name:name,price:price,type:'simple',categories:[],manage_stock:false,image:''},null);
      }
      closeModal();
      toast('Custom item added','ok');
    }},['+ Add to Cart']),
  ]);
  openModal('Custom Item',body,'sm');
}

// â”€â”€ GRID RENDER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function renderGrid(grid,items){
  grid.innerHTML='';
  S.gridPage=S.gridPage||1;
  var visible=items.slice(0,Math.max(GRID_PAGE,S.gridPage*GRID_PAGE));
  appendGrid(grid,visible,items.length);
}

function appendGrid(grid,visible,total){
  grid.innerHTML='';
  if(!visible.length){
    var emp=D.createElement('div');
    emp.style.cssText='grid-column:1/-1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:70px;color:#9ca3af;gap:10px;font-size:14px;';
    emp.appendChild(D.createTextNode('No products found'));
    grid.appendChild(emp);
    return;
  }
  visible.forEach(function(p){
    grid.appendChild(buildCard(p));
  });
  // Show Load More button when more products remain
  if(total!==undefined&&total>visible.length){
    var more=D.createElement('button');
    more.id='hpgrid-more';
    more.style.cssText='grid-column:1/-1;padding:10px 24px;margin:8px auto;border:1.5px solid #e2e8f0;border-radius:20px;background:#fff;color:#6b7280;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .15s;display:block;';
    more.textContent='Load more (showing '+visible.length+' of '+total+')';
    more.addEventListener('mouseenter',function(){this.style.borderColor='#4ade80';this.style.color='#111';});
    more.addEventListener('mouseleave',function(){this.style.borderColor='#e2e8f0';this.style.color='#6b7280';});
    more.addEventListener('click',function(){
      S.gridPage++;
      var f=getFilteredProducts();
      appendGrid(grid,f.slice(0,S.gridPage*GRID_PAGE),f.length);
      // Scroll the new button into view
      var nb=D.getElementById('hpgrid-more');
      if(nb)nb.scrollIntoView({behavior:'smooth',block:'center'});
    });
    grid.appendChild(more);
  }
}

function buildCard(p){
  var isVar=p.type==='variable'&&p.variations&&p.variations.length;
  var isPinned=S.quickPins.includes(p.id);

  // Out-of-stock check for simple products
  var isOOS=false;
  if(!isVar&&p.manage_stock&&p.stock_qty!=null&&p.stock_qty<=0)isOOS=true;
  // For variable products: OOS only if ALL variations are OOS
  if(isVar&&p.variations&&p.variations.length){
    var allOOS=p.variations.every(function(v){return v.manage_stock&&v.stock_qty!=null&&v.stock_qty<=0;});
    if(allOOS)isOOS=true;
  }

  var card=D.createElement('div');
  card.style.cssText='background:#fff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;position:relative;transition:box-shadow 0.2s,transform 0.15s;display:flex;flex-direction:column;'+(isOOS?'cursor:not-allowed;opacity:0.6;':'cursor:pointer;');

  if(!isOOS){
    card.addEventListener('mouseenter',function(){this.style.boxShadow='0 6px 20px rgba(0,0,0,.13)';this.style.transform='translateY(-2px)';});
    card.addEventListener('mouseleave',function(){this.style.boxShadow='none';this.style.transform='none';});
    // Long-press to pin
    var pressTimer=null;
    card.addEventListener('mousedown',function(){pressTimer=setTimeout(function(){togglePin(p.id);toast(isPinned?'Unpinned':'Pinned to Quick Access','info');},700);});
    card.addEventListener('mouseup',function(){clearTimeout(pressTimer);});
    card.addEventListener('mouseleave',function(){clearTimeout(pressTimer);});
    card.addEventListener('touchstart',function(){pressTimer=setTimeout(function(){togglePin(p.id);toast(isPinned?'Unpinned':'Pinned to Quick Access','info');},700);},{passive:true});
    card.addEventListener('touchend',function(){clearTimeout(pressTimer);});
  }

  // Image â€” exact same as old working version
  var imgWrap=D.createElement('div');
  imgWrap.style.cssText='width:100%;aspect-ratio:1/1;background:#f8f9fa;display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0;';
  var hasImg=p.image&&p.image.indexOf('woocommerce-placeholder')===-1&&p.image.indexOf('placeholder')===-1;
  if(hasImg){
    var img=D.createElement('img');
    img.src=p.image;img.alt=p.name;img.loading='lazy';
    img.style.cssText='width:100%;height:100%;object-fit:contain;display:block;';
    imgWrap.appendChild(img);
  } else {
    var ph=D.createElement('div');
    ph.style.cssText='font-size:36px;color:#d1d5db;';
    ph.innerHTML=iconSvg('box',36);
    imgWrap.appendChild(ph);
  }
  card.appendChild(imgWrap);

  // Body
  var body=D.createElement('div');
  body.style.cssText='padding:9px 11px 12px;border-top:1px solid #f1f5f9;display:flex;flex-direction:column;gap:3px;flex:1;';

  var name=D.createElement('div');
  name.style.cssText='font-size:12px;font-weight:600;line-height:1.3;color:#111827;';
  name.textContent=p.name;
  body.appendChild(name);

  if(isVar){
    var vb=D.createElement('div');
    vb.style.cssText='font-size:9px;color:#2563eb;background:#eff6ff;display:inline-block;padding:1px 6px;border-radius:4px;font-weight:700;width:fit-content;';
    vb.textContent=p.variations.length+' variants';
    body.appendChild(vb);
  }

  var price=D.createElement('div');
  price.style.cssText='font-size:13px;font-weight:700;color:#111827;margin-top:1px;';
  price.textContent=fmt(p.price);
  body.appendChild(price);

  if(isOOS){
    var oosTag=D.createElement('div');
    oosTag.style.cssText='font-size:9px;color:#dc2626;font-weight:700;background:#fee2e2;padding:2px 6px;border-radius:4px;display:inline-block;width:fit-content;';
    oosTag.textContent='Out of Stock';
    body.appendChild(oosTag);
  } else if(isVar&&p.variations&&p.variations.length){
    var inStockCount=p.variations.filter(function(v){
      if(typeof v.in_stock==='boolean')return v.in_stock;
      return v.manage_stock?(v.stock_qty>0):(v.stock_status==='instock');
    }).length;
    var stk=D.createElement('div');
    stk.style.cssText='font-size:9px;color:#16a34a;font-weight:600;';
    stk.textContent=inStockCount+' of '+p.variations.length+' variants in stock';
    body.appendChild(stk);
  } else if(p.manage_stock&&p.stock_qty!=null){
    var stk=D.createElement('div');
    var isLow=p.stock_qty<=5&&p.stock_qty>0;
    stk.style.cssText='font-size:9px;color:'+(isLow?'#d97706':'#16a34a')+';font-weight:600;';
    stk.textContent=isLow?'âš  '+p.stock_qty+' left':p.stock_qty+' in stock';
    body.appendChild(stk);
  }

  card.appendChild(body);

  // Pin indicator
  if(isPinned&&!isOOS){
    var pin=D.createElement('div');
    pin.style.cssText='position:absolute;top:6px;left:6px;font-size:11px;background:rgba(74,222,128,.9);border-radius:4px;padding:1px 5px;color:#fff;font-weight:700;';
    pin.textContent='â­';
    card.appendChild(pin);
  }

  if(isOOS){
    // OOS overlay banner
    var oosBanner=D.createElement('div');
    oosBanner.style.cssText='position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-10deg);background:rgba(220,38,38,.85);color:#fff;font-size:11px;font-weight:800;padding:4px 10px;border-radius:6px;white-space:nowrap;pointer-events:none;';
    oosBanner.textContent='OUT OF STOCK';
    card.appendChild(oosBanner);
  } else {
    // + add button (only for in-stock)
    var addbtn=D.createElement('div');
    addbtn.style.cssText='position:absolute;top:8px;right:8px;width:26px;height:26px;border-radius:50%;background:#1a1a2e;color:#fff;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700;opacity:0;transition:opacity .15s;box-shadow:0 2px 8px rgba(0,0,0,.2);pointer-events:none;';
    addbtn.textContent='+';
    card.appendChild(addbtn);
    card.addEventListener('mouseenter',function(){addbtn.style.opacity='1';});
    card.addEventListener('mouseleave',function(){addbtn.style.opacity='0';});
    card.addEventListener('click',function(){clickProd(p);});
  }

  return card;
}

function togglePin(pid){
  if(S.quickPins.includes(pid)){
    S.quickPins=S.quickPins.filter(function(x){return x!==pid;});
  } else {
    if(S.quickPins.length>=12){S.quickPins.shift();}
    S.quickPins.push(pid);
  }
  try{localStorage.setItem('hpos_quickpins',JSON.stringify(S.quickPins));}catch(e){}
  // Rebuild quick bar in place if visible
  var qb=D.getElementById('hpos-quickbar');
  var newBar=buildQuickBar();
  if(qb&&newBar){qb.replaceWith(newBar);}
}

function updateGrid(grid){
  if(!grid)return;
  var filtered=getFilteredProducts();
  S.gridPage=S.gridPage||1;
  renderGrid(grid,filtered);
}

function clickProd(p){
  if(p.type==='variable'&&p.variations&&p.variations.length)showVarModal(p);
  else addToCart(p,null);
}

function addToCart(prod,variation){
  var id=variation?variation.id:prod.id;
  var price=variation?variation.price:prod.price;
  var regularPrice=variation?(variation.regular_price||variation.price):(prod.regular_price||prod.price);
  var img=variation?(variation.image||prod.image):prod.image;
  var varLabel=variation&&variation.attributes?Object.values(variation.attributes).join(' / '):'';
  var cid=prod.id+'-'+id;
  var ex=S.cart.find(function(i){return i.cid===cid;});
  if(ex){S.cart=S.cart.map(function(i){return i.cid===cid?Object.assign({},i,{qty:i.qty+1}):i;});}
  else S.cart=S.cart.concat([{cid,productId:prod.id,variationId:variation?variation.id:null,attributes:variation?variation.attributes:null,name:prod.name,varLabel,price,regularPrice,img,qty:1}]);
  closeModal();
  var cartEl=D.getElementById('hcart');
  if(cartEl)updateCartEl(cartEl);
  else redraw();
  // Refresh WC-calculated prices (picks up storewide sales + bulk discount rules)
  schedPriceRefresh();
}

// â”€â”€ CART PANEL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function cartPanel(){
  var wrap=el('div',{cls:'hcart',id:'hcart'},[]);
  updateCartEl(wrap);
  return wrap;
}

function updateCartEl(wrap){
  wrap.innerHTML='';
  var sub=S.cart.reduce(function(s,i){return s+i.price*i.qty;},0);
  var sc=S.shipMethod?(parseFloat(S.shipMethod.cost)||0):0;
  var da=0;
  if(S.discount){var dv=parseFloat(S.discount)||0;da=S.discType==='%'?sub*dv/100:Math.min(dv,sub);}
  // Coupon discount on top of manual discount
  if(S.couponData){
    var cd=S.couponData;
    var ca=parseFloat(cd.amount)||0;
    var cda=cd.type==='percent'?(sub-da)*ca/100:Math.min(ca,sub-da);
    da+=cda;
  }
  da=Math.min(da,sub);
  // Prices are VAT-inclusive â€” extract the VAT portion, don't add extra
  var taxableAmt=(sub-da);
  var tax=taxableAmt*15/115;   // VAT already inside the price
  var total=taxableAmt+sc;     // total = VAT-inclusive price + shipping only

  // â”€â”€ FIXED TOP: header + customer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  var topFixed=D.createElement('div');
  topFixed.style.cssText='flex-shrink:0;';

  // Header
  topFixed.appendChild(el('div',{cls:'hcart-head'},[
    el('div',{cls:'hcart-title'},['Current Sale']),
    el('div',{cls:'hcart-ref'},[S.orderRef]),
  ]));

  // Customer row
  var custRow=el('div',{cls:'hcart-cust',onClick:function(){showCustomerModal();}},[ 
    el('div',{cls:'hcart-cust-ico',html:iconSvg('user',18)}),
    el('div',{cls:'hcart-cust-info'},[
      el('div',{cls:'hcart-cust-name'},[S.customer?S.customer.name:'Add customer']),
      S.customer?el('div',{cls:'hcart-cust-sub'},[S.customer.email||S.customer.phone||((S.customer.loyalty_points||0)+' pts')]):null,
    ]),
    S.customer?el('button',{cls:'hcart-cust-addr',onClick:function(e){e.stopPropagation();showAddrModal();}},['Address']):null,
  ]);
  topFixed.appendChild(custRow);

  // Customer detail card
  if(S.customer){
    var cc=el('div',{cls:'hcust-card'},[]);
    if(S.customer.email)cc.appendChild(el('div',{cls:'hcust-card-row'},[el('b',{},'Email'),S.customer.email]));
    if(S.customer.phone)cc.appendChild(el('div',{cls:'hcust-card-row'},[el('b',{},'Phone'),S.customer.phone]));
    var city=(S.billing&&S.billing.city)||(S.customer.billing&&S.customer.billing.city);
    var state=(S.billing&&S.billing.state)||(S.customer.billing&&S.customer.billing.state);
    if(city){
      var rname=NAM_REGIONS.find(function(r){return r.code===state;});
      cc.appendChild(el('div',{cls:'hcust-card-row'},[el('b',{},'City'),city+(rname?', '+rname.name:state?' '+state:'')])  );
    }
    cc.appendChild(el('button',{cls:'hbtn hbtn-xs',onClick:function(){S.customer=null;S.billing={};S.shipping={};var c=D.getElementById('hcart');if(c)updateCartEl(c);else redraw();}},['Remove']));
    topFixed.appendChild(cc);
  }

  wrap.appendChild(topFixed);

  // â”€â”€ SCROLLABLE CART ITEMS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  var itemsEl=el('div',{cls:'hcart-items'},[]);
  // flex:1 + overflow-y:auto + min-height:0 handled in CSS
  if(!S.cart.length){
    itemsEl.appendChild(el('div',{cls:'hcart-empty'},[
      el('div',{style:{fontSize:'36px'},html:iconSvg('box',36)}),
      el('p',{},'Cart is empty'),
      el('small',{},'Click a product to add'),
    ]));
  } else {
    S.cart.forEach(function(item){
      var row=el('div',{cls:'hcart-item'},[
        el('div',{cls:'hcart-item-img'},[
          item.img&&item.img.indexOf('placeholder')===-1
            ?el('img',{src:item.img,alt:'',loading:'lazy'})
            :el('span',{html:iconSvg('box',16)}),
        ]),
        el('div',{cls:'hcart-item-info'},[
          el('div',{cls:'hcart-item-name'},[item.name]),
          item.varLabel?el('div',{cls:'hcart-item-var'},[item.varLabel]):null,
          // Show sale indicator if current price differs from regular_price
          el('div',{cls:'hcart-item-price'},
            (item.regularPrice&&item.price<item.regularPrice-0.01)
              ?[el('span',{style:{textDecoration:'line-through',color:'#9ca3af',fontSize:'10px',marginRight:'5px'}},[fmt(item.regularPrice)]),
                el('span',{style:{color:'#16a34a',fontWeight:'700'}},[fmt(item.price)])]
              :[fmt(item.price)]
          ),
        ]),
        el('div',{cls:'hcart-item-qty'},[
          el('button',{cls:'hqbtn',onClick:function(e){e.stopPropagation();chgQty(item.cid,-1);}},['âˆ’']),
          el('span',{cls:'hqnum'},[String(item.qty)]),
          el('button',{cls:'hqbtn',onClick:function(e){e.stopPropagation();chgQty(item.cid,1);}},['+']),
        ]),
        el('div',{cls:'hcart-item-total'},[fmt(item.price*item.qty)]),
        el('button',{cls:'hdelb',onClick:function(e){e.stopPropagation();S.cart=S.cart.filter(function(i){return i.cid!==item.cid;});var c=D.getElementById('hcart');if(c)updateCartEl(c);else redraw();}},['âœ•']),
      ]);
      itemsEl.appendChild(row);
    });
  }
  wrap.appendChild(itemsEl);

  // â”€â”€ FIXED FOOTER: totals + payment + charge button â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  var foot=el('div',{cls:'hcart-foot'},[]);

  // Shipping
  foot.appendChild(el('div',{cls:'hship-row',onClick:function(){showShipModal();}},[ 
    el('span',{cls:'hship-label'},[S.shipMethod?S.shipMethod.title:'Select shipping...']),
    el('span',{cls:'hship-cost'},[S.shipMethod?fmt(sc):'â€”']),
  ]));

  // Discount
  foot.appendChild(el('div',{cls:'hdisc-row'},[
    el('input',{cls:'hdisc-inp',type:'number',min:'0',placeholder:'Discount',value:S.discount,onInput:function(e){S.discount=e.target.value;var c=D.getElementById('hcart');if(c)updateCartEl(c);else redraw();}}),
    el('button',{cls:'hdisc-btn'+(S.discType==='%'?' active':''),onClick:function(){S.discType='%';var c=D.getElementById('hcart');if(c)updateCartEl(c);else redraw();}},['%']),
    el('button',{cls:'hdisc-btn'+(S.discType!=='%'?' active':''),onClick:function(){S.discType=CFG.currency||'N$';var c=D.getElementById('hcart');if(c)updateCartEl(c);else redraw();}},[ CFG.currency||'N$']),
  ]));

  // Coupon
  foot.appendChild(el('div',{cls:'hdisc-row'},[
    el('input',{cls:'hdisc-inp',type:'text',placeholder:'Coupon code...' ,value:S.coupon,
      onInput:function(e){S.coupon=e.target.value;S.couponData=null;},
      onKeydown:function(e){e.stopPropagation();if(e.key==='Enter')applyCoupon();},
    }),
    S.couponData
      ?el('button',{cls:'hdisc-btn active',onClick:function(){S.coupon='';S.couponData=null;var c=D.getElementById('hcart');if(c)updateCartEl(c);else redraw();}},['âœ•'])
      :el('button',{cls:'hdisc-btn',onClick:function(){applyCoupon();}},['Apply']),
  ]));
  if(S.couponData){
    var cd=S.couponData;
    var cdesc=cd.type==='percent'?cd.amount+'% off':'N$ '+cd.amount+' off';
    foot.appendChild(el('div',{cls:'hship-prev',style:{color:'#16a34a',fontSize:'11px'}},['Coupon: '+cd.code+' ('+cdesc+')']));
  }


  // Totals
  foot.appendChild(el('div',{cls:'htotals'},[
    trow('Subtotal',fmt(sub)),
    da>0?trow('Discount','âˆ’'+fmt(da),'warn'):null,
    trow('VAT (15% incl.)',fmt(tax)),
    sc>0?trow('Delivery',fmt(sc)):null,
    el('div',{cls:'htotal-grand'},[
      el('span',{},'TOTAL'),
      el('span',{cls:'htotal-amt'},[fmt(total)]),
    ]),
  ]));

  // Payment tabs
  foot.appendChild(el('div',{cls:'hpay-section'},[
    el('div',{cls:'hpay-label'},['Payment']),
    el('div',{cls:'hpay-grid'},PAYS.map(function(m){
      return el('button',{cls:'hpay-btn'+(S.payMethod===m.id?' active':''),onClick:function(){S.payMethod=m.id;var c=D.getElementById('hcart');if(c)updateCartEl(c);else redraw();}},[ 
        el('span',{cls:'hpay-icon',html:iconSvg(m.e,18)}),
        el('span',{cls:'hpay-name'},[m.label]),
      ]);
    })),
    // Split payment toggle
    el('label',{cls:'hsplit-toggle'},[
      el('input',{type:'checkbox',checked:S.splitOn,onChange:function(e){S.splitOn=e.target.checked;var c=D.getElementById('hcart');if(c)updateCartEl(c);else redraw();}}),
      ' Split Payment',
    ]),
    S.splitOn?el('div',{cls:'hsplit-box'},[
      el('div',{cls:'hsplit-row'},[
        el('select',{cls:'hsel',onChange:function(e){S.splitCashM=e.target.value;}},
          PAYS.map(function(m){
            return el('option',{value:m.id,selected:m.id===S.splitCashM},[m.label]);
          })
        ),
        el('input',{cls:'hdisc-inp',type:'number',placeholder:'0.00',value:S.splitCash,onInput:function(e){S.splitCash=e.target.value;var c=D.getElementById('hcart');if(c)updateCartEl(c);else redraw();}}),
      ]),
      el('div',{cls:'hsplit-row'},[
        el('select',{cls:'hsel',onChange:function(e){S.splitOtherM=e.target.value;}},
          PAYS.map(function(m){
            return el('option',{value:m.id,selected:m.id===S.splitOtherM},[m.label]);
          })
        ),
        el('input',{cls:'hdisc-inp',type:'number',placeholder:'0.00',value:S.splitOther,onInput:function(e){S.splitOther=e.target.value;var c=D.getElementById('hcart');if(c)updateCartEl(c);else redraw();}}),
      ]),
      el('div',{cls:'hsplit-sum'+(((parseFloat(S.splitCash)||0)+(parseFloat(S.splitOther)||0))>=total?' ok':'')},[
        'Collected: '+fmt((parseFloat(S.splitCash)||0)+(parseFloat(S.splitOther)||0))+' / Due: '+fmt(total)
      ]),
    ]):null,
  ]));

  // Note
  foot.appendChild(el('div',{cls:'hnote-row'},[
    el('input',{cls:'hnote-inp',type:'text',placeholder:'Order note...',value:S.note,
      onInput:function(e){S.note=e.target.value;},
      onKeydown:function(e){e.stopPropagation();},
    }),
  ]));

  // Status
  foot.appendChild(el('div',{cls:'hstatus-row'},[
    el('label',{cls:'hstatus-label'},['Status']),
    el('select',{cls:'hsel hsel-full',onChange:function(e){S.orderStatus=e.target.value;}},
      (S.orderStatuses.length?S.orderStatuses:[{key:'processing',label:'Processing'}]).map(function(s){
        return el('option',{value:s.key,selected:s.key===S.orderStatus},[s.label]);
      })
    ),
  ]));

  // Action buttons
  foot.appendChild(el('div',{cls:'hactions'},[
    el('button',{cls:'hbtn hbtn-hold',onClick:holdOrder},['Hold']),
    el('button',{cls:'hbtn hbtn-charge'+(S.cart.length===0?' disabled':''),disabled:S.cart.length===0,onClick:S.cart.length>0?function(){showPayModal(total);}:null},[
      S.cart.length>0?'Charge '+fmt(total):'Charge',
    ]),
  ]));

  wrap.appendChild(foot);
}

function trow(l,v,cls){return el('div',{cls:'htrow'+(cls?' htrow-'+cls:'')},[el('span',{},[l]),el('span',{cls:'htval'},[v])]);}
function chgQty(cid,d){
  S.cart=S.cart.map(function(i){return i.cid===cid?Object.assign({},i,{qty:Math.max(0,i.qty+d)}):i;}).filter(function(i){return i.qty>0;});
  var c=D.getElementById('hcart');if(c)updateCartEl(c);else redraw();
  schedPriceRefresh();
}

// â”€â”€ WC PRICE SYNC â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Debounced: waits 400ms after the last cart change before calling the API.
// This avoids hammering the server while the user is rapidly adding items.
var _priceRefreshTimer=null;
function schedPriceRefresh(){
  if(_priceRefreshTimer)clearTimeout(_priceRefreshTimer);
  _priceRefreshTimer=setTimeout(refreshCartPrices,400);
}

function refreshCartPrices(){
  if(!S.cart.length)return;
  var items=S.cart.map(function(i){
    return{id:i.productId,variation_id:i.variationId||0,qty:i.qty};
  });
  api('/price-check',{method:'POST',body:JSON.stringify({items:items})}).then(function(res){
    if(!res||!res.prices)return;
    var updated=false;
    S.cart=S.cart.map(function(i){
      var key=i.productId+'-'+(i.variationId||0);
      var newPrice=res.prices[key];
      var regularPrice=res.prices[key+'_regular']||null; // set only when bulk discount applied
      if(newPrice===undefined)return i;
      var priceChanged=Math.abs(newPrice-(i.price||0))>0.005;
      var regChanged=regularPrice&&Math.abs(regularPrice-(i.regularPrice||0))>0.005;
      if(priceChanged||regChanged){
        updated=true;
        var patch={price:newPrice};
        // Store the regular (pre-discount) price so the cart can show strikethrough
        if(regularPrice)patch.regularPrice=regularPrice;
        else if(newPrice===(i.regularPrice||0))patch.regularPrice=null; // discount gone
        return Object.assign({},i,patch);
      }
      return i;
    });
    if(updated){
      var c=D.getElementById('hcart');
      if(c)updateCartEl(c);
    }
  }).catch(function(){
    // Price check failed silently â€” cart keeps current prices
  });
}
function holdOrder(){
  if(!S.cart.length){toast('Cart is empty','err');return;}
  S.held=S.held.concat([{id:'h'+Date.now(),cart:S.cart.slice(),customer:S.customer,billing:Object.assign({},S.billing),shipping:Object.assign({},S.shipping),shipMethod:S.shipMethod,discount:S.discount,discType:S.discType,note:S.note,ref:S.orderRef,time:new Date().toISOString()}]);
  S.cart=[];S.customer=null;S.billing={};S.shipping={};S.discount='';S.note='';S.splitOn=false;S.splitCashM='cash';S.splitCash='';S.splitOther='';
  S.orderRef='POS-'+(1000+Math.floor(Math.random()*9000));
  toast('Order held','info');
  var c=D.getElementById('hcart');if(c)updateCartEl(c);else redraw();
}

// â”€â”€ VARIATION MODAL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function showVarModal(prod){
  var body=el('div',{cls:'hvar-list'},prod.variations.map(function(v){
    var isVarOOS = typeof v.in_stock === 'boolean'
      ? !v.in_stock
      : (v.manage_stock ? (v.stock_qty !== null && v.stock_qty <= 0) : v.stock_status === 'outofstock');
    var attrs=Object.entries(v.attributes||{}).map(function(e){return el('span',{cls:'hchip'},[e[1]]);});
    var row=el('div',{cls:'hvar-row',style:isVarOOS?{opacity:'0.5',cursor:'not-allowed',background:'#f9fafb'}:{}},[
      el('div',{cls:'hvar-img'},[
        v.image&&v.image.indexOf('placeholder')===-1?el('img',{src:v.image,alt:'',loading:'lazy'}):el('span',{html:iconSvg('box',16)})
      ]),
      el('div',{cls:'hvar-info'},[
        el('div',{cls:'hvar-attrs'},attrs.length?attrs:[el('span',{},[v.sku||'Variant'])]),
        el('div',{cls:'hvar-price'},[fmt(v.price)]),
        el('div',{cls:'hvar-stock',style:{color:isVarOOS?'#dc2626':''}},[
          isVarOOS?'Out of stock':(v.manage_stock?(v.stock_qty+' in stock'):(v.stock_status==='instock'?'In stock':''))
        ]),
      ]),
      isVarOOS
        ?el('div',{cls:'hvar-add',style:{background:'#e5e7eb',color:'#9ca3af',cursor:'not-allowed'}},['âœ•'])
        :el('div',{cls:'hvar-add'},['Add']),
    ]);
    if(!isVarOOS)row.addEventListener('click',function(){addToCart(prod,v);});
    return row;
  }));
  openModal('Choose Variant â€” '+prod.name,body,'md');
}

// â”€â”€ CUSTOMER MODAL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function showCustomerModal(){
  var tab='search',customers=[],srchStr='';
  var wrap=el('div',{});
  var tabsEl=el('div',{cls:'htabs'},[
    el('button',{cls:'htab active',id:'htab-search',onClick:function(){tab='search';switchTab();}},['Search']),
    el('button',{cls:'htab',id:'htab-walkin',onClick:function(){tab='walkin';switchTab();}},['Walk-in']),
    el('button',{cls:'htab',id:'htab-new',onClick:function(){tab='new';switchTab();}},['+ New Customer']),
  ]);
  var bodyEl=el('div',{cls:'hmodal-tabcontent'},[]);
  wrap.appendChild(tabsEl);
  wrap.appendChild(bodyEl);

  function switchTab(){
    D.getElementById('htab-search').className='htab'+(tab==='search'?' active':'');
    D.getElementById('htab-walkin').className='htab'+(tab==='walkin'?' active':'');
    D.getElementById('htab-new').className='htab'+(tab==='new'?' active':'');
    buildTabContent();
  }

  function buildTabContent(){
    bodyEl.innerHTML='';
    if(tab==='search')buildSearch();
    else if(tab==='walkin')buildWalkin();
    else buildNew();
  }

  function buildSearch(){
    var listEl=el('div',{cls:'hcust-list'},[el('div',{cls:'hloading'},['Loading...'])]);
    var si=el('input',{cls:'hinp',type:'text',placeholder:'Search name, email, phone...'});
    si.value=srchStr;
    si.addEventListener('keydown',function(e){e.stopPropagation();});
    si.addEventListener('input',function(){
      srchStr=si.value;
      var q=srchStr.toLowerCase();
      listEl.innerHTML='';
      renderCustList(listEl,customers.filter(function(c){return !q||(c.name||'').toLowerCase().includes(q)||(c.email||'').toLowerCase().includes(q)||(c.phone||'').includes(q);}));
    });
    bodyEl.appendChild(si);
    bodyEl.appendChild(listEl);
    api('/customers').then(function(d){
      customers=Array.isArray(d)?d:[];
      listEl.innerHTML='';
      renderCustList(listEl,customers);
    }).catch(function(e){listEl.textContent='Error: '+e.message;});
  }

  function renderCustList(listEl,arr){
    listEl.innerHTML='';
    if(!arr.length){listEl.textContent='No customers found';return;}
    arr.forEach(function(c){
      var row=el('div',{cls:'hcust-row'},[
        el('div',{cls:'hcust-av'},[ini(c.name)]),
        el('div',{cls:'hcust-info'},[
          el('div',{cls:'hcust-name'},[c.name]),
          el('div',{cls:'hcust-email'},[c.email+(c.phone?' Â· '+c.phone:'')]),
        ]),
        el('div',{cls:'hcust-pts'},['â­ '+(c.loyalty_points||0)]),
      ]);
      row.addEventListener('click',function(){selectCust(c);});
      listEl.appendChild(row);
    });
  }

  // â”€â”€ WALK-IN: name only, no WC account created â”€â”€
  function buildWalkin(){
    var vals={first_name:'HO',last_name:'Customer',phone:'Walk-in-Customer'};
    bodyEl.appendChild(el('div',{cls:'hwalkin-box'},[
      el('p',{cls:'hwalkin-desc'},['Quick walk-in customer. Default is "HO Customer" â€” only edit if actual details are provided.']),
      frow([ff('First Name','text',vals,'first_name'),ff('Last Name','text',vals,'last_name')]),
      ff('Phone','tel',vals,'phone'),
      el('button',{cls:'hbtn hbtn-primary hbtn-full',style:{marginTop:'12px'},onClick:function(){
        var fn=vals.first_name||'HO';
        var ln=vals.last_name||'Customer';
        var ph=vals.phone||'Walk-in-Customer';
        var name=(fn+' '+ln).trim();
        selectCust({id:0,name:name,email:'',phone:ph,
          billing:{first_name:fn,last_name:ln,phone:ph},
          shipping:{},loyalty_points:0,walkin:true});
        toast('Walk-in customer added','ok');
      }},['Save & Continue']),
    ]));
  }

  function buildNew(){
    var vals={email:'',billing_first_name:'',billing_last_name:'',billing_phone:'',billing_company:'',billing_address_1:'',billing_address_2:'',billing_city:'',billing_state:'KH',billing_postcode:'',billing_country:'NA'};
    var shipPrev=el('div',{style:{fontSize:'11px',color:'var(--tx3)',padding:'4px 0 8px'}},['Khomas: Delivery - '+fmt(40)]);
    var saveBtn=el('button',{cls:'hbtn hbtn-primary hbtn-full',style:{marginTop:'10px'}},['Create Customer']);

    saveBtn.addEventListener('click',function(){
      if(!vals.billing_first_name&&!vals.email){toast('Enter at least a name or email','err');return;}
      if(!vals.email){vals.email='pos.'+(Date.now())+'@hambelela.customer';}
      saveBtn.disabled=true; saveBtn.textContent='Savingâ€¦';
      api('/customers',{method:'POST',body:JSON.stringify(vals)}).then(function(c){
        if(c&&c.id){
          selectCust(c);
          setTimeout(function(){toast('Customer saved: '+c.name,'ok');},200);
        } else {
          saveBtn.disabled=false; saveBtn.textContent='âœ“ Create Customer';
          toast('Save failed: '+(c&&c.error?c.error:'No response from server'),'err');
        }
      }).catch(function(e){
        saveBtn.disabled=false; saveBtn.textContent='âœ“ Create Customer';
        toast('Error: '+e.message,'err');
      });
    });

    // Two-column compact layout so button is always visible without scrolling
    bodyEl.appendChild(el('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px 14px'}},[
      // Left col
      el('div',{},[
        el('p',{cls:'hform-section',style:{marginBottom:'6px'}},['Contact']),
        frow([ff('First Name','text',vals,'billing_first_name'),ff('Last Name','text',vals,'billing_last_name')]),
        ff('Email (optional)','email',vals,'email'),
        frow([ff('Phone','tel',vals,'billing_phone'),ff('Company','text',vals,'billing_company')]),
      ]),
      // Right col
      el('div',{},[
        el('p',{cls:'hform-section',style:{marginBottom:'6px'}},['Address']),
        ff('Address Line 1','text',vals,'billing_address_1'),
        frow([ff('City','text',vals,'billing_city'),ff('Postcode','text',vals,'billing_postcode')]),
        frow([regSel(vals,'billing_state',function(r){shipPrev.textContent=r.name+': '+r.ship+' - '+fmt(r.cost);applyRegionShip(r);}),staticField('Country','Namibia')]),
        shipPrev,
      ]),
    ]));
    bodyEl.appendChild(saveBtn);
  }

  buildTabContent();
  openModal('Customer',wrap,'lg');
}

function selectCust(c){
  S.customer=c;
  S.billing=Object.assign({},c.billing||{});
  S.shipping=Object.assign({},c.shipping||{});
  var state=(c.billing&&c.billing.state)||'';
  if(state){var r=NAM_REGIONS.find(function(x){return x.code===state;});if(r)applyRegionShip(r);}
  closeModal();
  var cart=D.getElementById('hcart');if(cart)updateCartEl(cart);else redraw();
  toast('Customer: '+c.name,'info');
}

function applyRegionShip(r){
  if(!r)return;
  var m=S.shipOptions.find(function(s){return s.title.toLowerCase().includes(r.ship.toLowerCase());});
  S.shipMethod=m||{zone_id:-99,zone_name:'Custom',method_id:'custom',method_type:'custom',title:r.ship,cost:r.cost};
}

// â”€â”€ ADDRESS MODAL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function showAddrModal(){
  var billing=Object.assign({},S.billing);
  var shipping=Object.assign({},S.shipping);
  var useDiff=S.useDiffShip;
  var wrap=el('div',{});
  function rebuild(){
    wrap.innerHTML='';
    wrap.appendChild(el('p',{cls:'hform-section'},['Billing']));
    wrap.appendChild(addrBlock(billing,true));
    var diffLabel=el('label',{cls:'hdiff-lbl'},[el('input',{type:'checkbox',checked:useDiff,onChange:function(e){useDiff=e.target.checked;rebuild();}}), ' Different shipping address']);
    wrap.appendChild(diffLabel);
    if(useDiff){wrap.appendChild(el('p',{cls:'hform-section',style:{marginTop:'10px'}},['Shipping']));wrap.appendChild(addrBlock(shipping,false));}
    wrap.appendChild(el('button',{cls:'hbtn hbtn-primary hbtn-full',style:{marginTop:'12px'},onClick:function(){
      S.billing=billing;S.shipping=useDiff?shipping:billing;S.useDiffShip=useDiff;
      closeModal();var c=D.getElementById('hcart');if(c)updateCartEl(c);else redraw();toast('Address saved','ok');
    }},['Save Address']));
  }
  rebuild();
  openModal('Edit Address',wrap,'lg');

  function addrBlock(obj,isBilling){
    return el('div',{cls:'hform'},[
      frow([ffObj('First Name',obj,'first_name'),ffObj('Last Name',obj,'last_name')]),
      isBilling?ffObj('Email',obj,'email'):null,
      isBilling?ffObj('Phone',obj,'phone'):null,
      ffObj('Address 1',obj,'address_1'),ffObj('Address 2',obj,'address_2'),
      frow([ffObj('City',obj,'city'),ffObj('Postcode',obj,'postcode')]),
      frow([regSel(obj,'state',function(r){if(isBilling)applyRegionShip(r);}),staticField('Country','Namibia')]),
    ]);
  }
}

// â”€â”€ SHIPPING MODAL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function showShipModal(){
  var body=el('div',{cls:'hship-list'},[]);
  S.shipOptions.forEach(function(s){
    var sel=S.shipMethod&&S.shipMethod.method_id===s.method_id&&S.shipMethod.zone_id===s.zone_id;
    var row=el('div',{cls:'hship-opt'+(sel?' selected':'')},[
      el('div',{cls:'hship-radio'+(sel?' on':'')},[]),
      el('div',{cls:'hship-optinfo'},[
        el('div',{cls:'hship-zone'},[s.zone_name]),
        el('div',{cls:'hship-title'},[s.title]),
      ]),
      el('div',{cls:'hship-optcost'},[fmt(s.cost)]),
    ]);
    row.addEventListener('click',function(){S.shipMethod=s;closeModal();var c=D.getElementById('hcart');if(c)updateCartEl(c);else redraw();});
    body.appendChild(row);
  });
  // Custom override
  var ctitle=el('input',{cls:'hinp',type:'text',placeholder:'Custom label'});
  var ccost=el('input',{cls:'hinp',type:'number',placeholder:'Cost'});
  ctitle.addEventListener('keydown',function(e){e.stopPropagation();});
  ccost.addEventListener('keydown',function(e){e.stopPropagation();});
  body.appendChild(el('div',{cls:'hcustship'},[
    el('div',{cls:'hform-section',style:{marginTop:'10px'}},['Custom Shipping']),
    frow([el('div',{cls:'hfield'},[el('label',{cls:'hlbl'},['Label']),ctitle]),el('div',{cls:'hfield'},[el('label',{cls:'hlbl'},['Cost']),ccost])]),
    el('button',{cls:'hbtn hbtn-sm hbtn-primary',onClick:function(){if(!ctitle.value){toast('Enter label','err');return;}S.shipMethod={zone_id:-99,zone_name:'Custom',method_id:'custom',method_type:'custom',title:ctitle.value,cost:parseFloat(ccost.value)||0};closeModal();var c=D.getElementById('hcart');if(c)updateCartEl(c);else redraw();}},['Apply']),
  ]));
  openModal('Shipping',body,'md');
}

// â”€â”€ PAY MODAL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function showPayModal(total){
  var cashStr='';
  var pm=PAYS.find(function(m){return m.id===S.payMethod;})||{label:S.payMethod,e:'credit-card'};
  var isCash=S.payMethod==='cash'&&!S.splitOn;
  var wrap=el('div',{});

  function rebuild(){
    wrap.innerHTML='';
    wrap.appendChild(el('div',{cls:'hpayamt'},[el('span',{},'Amount Due'),el('strong',{},[fmt(total)])]));
    if(S.splitOn){
      var sc=parseFloat(S.splitCash)||0,so=parseFloat(S.splitOther)||0;
      var pm1=PAYS.find(function(m){return m.id===S.splitCashM;})||{label:S.splitCashM,e:'credit-card'};
      var pm2=PAYS.find(function(m){return m.id===S.splitOtherM;})||{label:S.splitOtherM,e:'credit-card'};
      wrap.appendChild(el('div',{cls:'hsplitinfo'},[
        el('div',{},[pm1.label+': '+fmt(sc)]),
        el('div',{},[pm2.label+': '+fmt(so)]),
        el('div',{cls:(sc+so>=total?'hok':'herr')},'Total: '+fmt(sc+so)),
      ]));
      var ready=sc+so>=total;
      var cb=el('button',{cls:'hbtn hbtn-charge hbtn-full'+(ready?'':' disabled'),disabled:!ready},['Confirm Split']);
      if(ready)cb.addEventListener('click',function(){closeModal();submitOrder(total);});
      wrap.appendChild(cb);
    } else if(isCash){
      var cp=parseFloat(cashStr)||0,ch=cp-total;
      wrap.appendChild(el('input',{cls:'hcashinput',type:'number',step:'0.01',min:'0',inputmode:'decimal',placeholder:'0.00',value:cashStr,onInput:function(e){cashStr=e.target.value.replace(/[^0-9.]/g,'');rebuild();setTimeout(function(){var ci=D.querySelector('.hcashinput');if(ci){ci.focus();ci.setSelectionRange(ci.value.length,ci.value.length);}},0);},onKeydown:function(e){e.stopPropagation();if(e.key==='Enter'&&parseFloat(cashStr)>=total){closeModal();submitOrder(total);}}}));
      if(cp>0)wrap.appendChild(el('div',{cls:'hchange'+(ch>=0?' hok':' herr')},[el('span',{},'Change'),el('strong',{},[ch>=0?fmt(ch):'Insufficient'])]));
      var numpad=el('div',{cls:'hnumpad'},[]);
      ['1','2','3','4','5','6','7','8','9','.','0','âŒ«'].forEach(function(k){
        var b=el('button',{cls:'hnk'+(k==='âŒ«'?' hacc':k==='.'?' hdec':'')},[k]);
        b.addEventListener('click',function(){
          if(k==='âŒ«'){cashStr=cashStr.slice(0,-1);}
          else if(k==='.'){if(!cashStr.includes('.'))cashStr+=k;}  // only one decimal point
          else cashStr+=k;
          rebuild();
        });
        numpad.appendChild(b);
      });
      wrap.appendChild(numpad);
      var cb2=el('button',{cls:'hbtn hbtn-charge hbtn-full'+(cp<total?' disabled':'')},['Confirm Payment']);
      if(cp>=total)cb2.addEventListener('click',function(){closeModal();submitOrder(total);});
      wrap.appendChild(cb2);
    } else {
      wrap.appendChild(el('div',{cls:'hpayicon',html:iconSvg(pm.e,52)}));
      wrap.appendChild(el('p',{cls:'hpaydesc'},[pm.label+' â€” '+fmt(total)+(AUTO.includes(S.payMethod)?' (auto-complete)':'')]));
      var cb3=el('button',{cls:'hbtn hbtn-charge hbtn-full'},['Confirm Payment']);
      cb3.addEventListener('click',function(){closeModal();submitOrder(total);});
      wrap.appendChild(cb3);
    }
  }
  rebuild();
  openModal(pm.label,wrap,'sm');
}

function submitOrder(total){
  var sub=S.cart.reduce(function(s,i){return s+i.price*i.qty;},0);
  var sc=S.shipMethod?(parseFloat(S.shipMethod.cost)||0):0;
  var da=0;
  if(S.discount){var dv=parseFloat(S.discount)||0;da=S.discType==='%'?sub*dv/100:Math.min(dv,sub);}
  if(S.couponData){var cd=S.couponData;var ca=parseFloat(cd.amount)||0;da+=cd.type==='percent'?(sub-da)*ca/100:Math.min(ca,sub-da);}
  da=Math.min(da,sub);
  var auto=AUTO.includes(S.payMethod)&&!S.splitOn; // kept for label display only
  var splitData=S.splitOn?[{method:S.splitCashM,amount:parseFloat(S.splitCash)||0},{method:S.splitOtherM,amount:parseFloat(S.splitOther)||0}]:[];
  var billing=Object.assign({country:'NA'},S.billing);
  var shippingA=S.useDiffShip?Object.assign({country:'NA'},S.shipping):billing;
  var payload={
    items:S.cart.map(function(i){return{id:i.variationId||i.productId,variation_id:i.variationId,attributes:i.attributes,qty:i.qty,price:i.price,name:i.name};}),
    payment_method:S.splitOn?'split':S.payMethod,
    payment_method_title:S.splitOn?'Split Payment':(PAYS.find(function(m){return m.id===S.payMethod;})||{label:S.payMethod}).label,
    discount:da,status:S.orderStatus,  // always use the user's chosen status
    customer_id:S.customer?S.customer.id:0,
    billing_address:billing,shipping_address:shippingA,
    note:S.note,payment_split:splitData,
    coupon_code:S.couponData?S.couponData.code:'',
    shipping:S.shipMethod?{title:S.shipMethod.title,cost:sc,method_id:String(S.shipMethod.method_id),method_type:S.shipMethod.method_type}:null,
  };

  var cartSnap=S.cart.slice();
  var custSnap=S.customer;
  var billSnap=Object.assign({},S.billing);

  function onSuccess(res){
    var saved={cart:cartSnap,total:total,sub:sub,tax:(sub-da)*15/115,sc:sc,da:da,payMethod:payload.payment_method,splitData:splitData,customer:custSnap,billing:billSnap,orderNum:'#'+res.order_id,invoiceNum:res.order_number||res.order_id,time:new Date(),status:res.status,note:S.note,shipMethod:S.shipMethod};
    // Track best sellers
    try{var bs=JSON.parse(localStorage.getItem('hpos_bscount')||'{}');cartSnap.forEach(function(i){bs[i.productId]=(bs[i.productId]||0)+i.qty;});localStorage.setItem('hpos_bscount',JSON.stringify(bs));}catch(e){}
    // Record in cash drawer session
    recordDrawerSale(payload.payment_method, total);
    if(S.splitOn){
      if(parseFloat(S.splitCash))recordDrawerSale(S.splitCashM,parseFloat(S.splitCash));
    }
    // Log activity
    api('/activity-log',{method:'POST',body:JSON.stringify({action:'sale',object_id:res.order_id,details:{total:total,cashier:CASHIER,method:payload.payment_method}})}).catch(function(){});
    S.cart=[];S.customer=null;S.billing={};S.shipping={};S.discount='';S.coupon='';S.couponData=null;S.note='';S.splitOn=false;S.splitCashM='cash';S.splitCash='';S.splitOther='';
    S.orderRef='POS-'+(1000+Math.floor(Math.random()*9000));
    showReceipt(saved);
    toast('Order '+saved.orderNum+' created!','ok');
  }

  if(!S.isOnline){
    // Store offline
    queueOfflineOrder(payload);
    var offSaved={cart:cartSnap,total:total,sub:sub,tax:(sub-da)*15/115,sc:sc,da:da,payMethod:payload.payment_method,splitData:splitData,customer:custSnap,billing:billSnap,orderNum:'#OFFLINE',invoiceNum:'OFFLINE',time:new Date(),status:'pending',note:S.note,shipMethod:S.shipMethod};
    recordDrawerSale(payload.payment_method,total);
    S.cart=[];S.customer=null;S.billing={};S.shipping={};S.discount='';S.coupon='';S.couponData=null;S.note='';S.splitOn=false;S.splitCashM='cash';S.splitCash='';S.splitOther='';
    S.orderRef='POS-'+(1000+Math.floor(Math.random()*9000));
    showReceipt(offSaved);
  } else {
    api('/orders',{method:'POST',body:JSON.stringify(payload)}).then(onSuccess).catch(function(e){toast('Error: '+e.message,'err');});
  }
}

// â”€â”€ RECEIPT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function showReceipt(o){
  var pm=PAYS.find(function(m){return m.id===o.payMethod;})||{label:o.payMethod,e:'credit-card'};
  // date + time for receipt as per spec
  var dateStr=fdt(o.time.toISOString());
  var b=o.billing||{};

  // Live-editable receipt fields
  var editCFG={
    store_name:    CFG.store_name||'Hambelela Organic',
    store_address: CFG.store_address||'',
    store_phone:   CFG.store_phone||'',
    store_email:   CFG.store_email||'',
    vat_number:    CFG.vat_number||'',
    receipt_footer:CFG.receipt_footer||'Thank you for shopping with us!',
  };
  var editMode=false;

  var previewWrap=el('div',{});
  var editWrap=el('div',{style:{display:'none'}});

  function renderPreview(){
    previewWrap.innerHTML='';
    var logoUrl=CFG.logo_url||'';
    previewWrap.appendChild(el('div',{cls:'hreceipt'},[
      el('div',{cls:'hr-hdr'},[
        logoUrl?el('img',{src:logoUrl,cls:'hr-logo',alt:'logo'}):null,
        el('div',{cls:'hr-store'},[editCFG.store_name]),
        editCFG.store_address?el('div',{cls:'hr-sub'},[editCFG.store_address]):null,
        (editCFG.store_phone||editCFG.store_email)?el('div',{cls:'hr-sub'},[(editCFG.store_phone||'')+((editCFG.store_phone&&editCFG.store_email)?' | ':'')+(editCFG.store_email||'')]):null,
        editCFG.vat_number?el('div',{cls:'hr-sub'},['VAT: '+editCFG.vat_number]):null,
      ]),
      el('hr',{cls:'hr-line'},[]),
      el('div',{cls:'hr-meta'},[
        rrow('RECEIPT:','INV-'+o.invoiceNum),
        rrow('Order #:',o.orderNum),
        rrow('Date:',dateStr),
        rrow('Cashier:',CASHIER),
        rrow('Payment:',o.payMethod==='split'?'Split Payment':pm.label),
        o.customer&&o.customer.name?rrow('Customer:',o.customer.name):null,
        b.address_1?rrow('Address:',b.address_1+(b.city?', '+b.city:'')):null,
      ]),
      el('hr',{cls:'hr-line'},[]),
      el('div',{cls:'hr-items-hdr'},[el('span',{style:{flex:'1'}},'Item'),el('span',{},'Qty'),el('span',{},'Total')]),
    ].concat(o.cart.map(function(i){return el('div',{cls:'hr-item'},[el('span',{style:{flex:'1'}},[i.name+(i.varLabel?' ('+i.varLabel+')':'')]),el('span',{},'Ã—'+i.qty),el('span',{},[fmt(i.price*i.qty)])]);}))
    .concat([
      el('hr',{cls:'hr-line'},[]),
      o.da>0?rrow('Discount:','âˆ’'+fmt(o.da)):null,
      o.sc>0?rrow((o.shipMethod?o.shipMethod.title:'Shipping')+':',fmt(o.sc)):null,
      rrow('Subtotal (incl. VAT):',fmt(o.sub-o.da)),
      rrow('VAT (15% incl.):',fmt(o.tax)),
      el('div',{cls:'hr-total'},[el('span',{},'TOTAL'),el('strong',{},[fmt(o.total)])]),
      el('hr',{cls:'hr-line'},[]),
      el('div',{cls:'hr-footer'},[editCFG.receipt_footer]),
    ])));
  }

  function renderEditor(){
    editWrap.innerHTML='';
    var fields=[
      {k:'store_name',l:'Store Name'},
      {k:'store_address',l:'Store Address'},
      {k:'store_phone',l:'Phone'},
      {k:'store_email',l:'Email'},
      {k:'vat_number',l:'VAT Number'},
      {k:'receipt_footer',l:'Footer Message'},
    ];
    editWrap.appendChild(el('div',{cls:'hreceipt-editor'},[
      el('p',{cls:'hform-section'},['Edit Receipt Details']),
      el('p',{cls:'hr-editor-note'},['Changes here update this receipt. Save to Settings to make permanent.']),
      el('div',{cls:'hform'},fields.map(function(f){
        var inp=el(f.k==='receipt_footer'?'textarea':'input',{cls:'hinp',value:editCFG[f.k]||''});
        if(f.k==='receipt_footer'){inp.textContent=editCFG[f.k]||'';inp.rows=2;}
        inp.addEventListener('input',function(){editCFG[f.k]=inp.value;});
        inp.addEventListener('keydown',function(e){e.stopPropagation();});
        return el('div',{cls:'hfield'},[el('label',{cls:'hlbl'},[f.l]),inp]);
      })),
      el('div',{cls:'hfield'},[
        el('label',{cls:'hlbl'},['Logo URL (paste image URL)']),
        (function(){
          var li=el('input',{cls:'hinp',type:'text',placeholder:'https://...',value:CFG.logo_url||''});
          li.addEventListener('input',function(){CFG.logo_url=li.value;});
          li.addEventListener('keydown',function(e){e.stopPropagation();});
          return li;
        })(),
      ]),
      el('div',{cls:'hr-editor-actions'},[
        el('button',{cls:'hbtn hbtn-primary',onClick:function(){
          Object.assign(CFG,editCFG);
          api('/settings',{method:'POST',body:JSON.stringify(editCFG)}).then(function(){toast('Settings saved!','ok');}).catch(function(){});
          editMode=false;renderPreview();previewWrap.style.display='';editWrap.style.display='none';
          updateToggleBtns();
        }},['ðŸ’¾ Apply & Save to Settings']),
        el('button',{cls:'hbtn',onClick:function(){
          editMode=false;renderPreview();previewWrap.style.display='';editWrap.style.display='none';
          updateToggleBtns();
        }},['â† Back to Receipt']),
      ]),
    ]));
  }

  var toggleBtn=el('button',{cls:'hbtn',onClick:function(){
    editMode=!editMode;
    previewWrap.style.display=editMode?'none':'';
    editWrap.style.display=editMode?'':'none';
    if(editMode)renderEditor();
    updateToggleBtns();
  }},['âœ Edit']);

  function updateToggleBtns(){
    toggleBtn.textContent=editMode?'ðŸ‘ Preview':'âœ Edit';
  }

  renderPreview();

  var body=el('div',{},[
    previewWrap,
    editWrap,
    el('div',{cls:'hr-acts'},[
      toggleBtn,
      // Print width selector
      el('select',{cls:'hinp',style:{width:'100px',padding:'6px 8px',fontSize:'12px'},onChange:function(e){S.printWidth=e.target.value;}},[
        el('option',{value:'80mm',selected:S.printWidth==='80mm'},['80mm']),
        el('option',{value:'58mm',selected:S.printWidth==='58mm'},['58mm']),
        el('option',{value:'a4',  selected:S.printWidth==='a4'},  ['A4']),
      ]),
      el('button',{cls:'hbtn',onClick:function(){printReceipt(o,editCFG,S.printWidth);}},['ðŸ–¨ Print']),
      el('button',{cls:'hbtn hbtn-primary',onClick:function(){closeModal();redraw();}},['âœ… New Sale']),
    ]),
  ]);
  openModal('Receipt â€” INV-'+o.invoiceNum,body,'lg');
}
function rrow(l,v){return el('div',{cls:'hr-row'},[el('span',{cls:'hr-lbl'},[l]),el('span',{},[v])]);}

// â”€â”€ THERMAL / A4 RECEIPT PRINT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function printReceipt(o,cfg,width){
  cfg=cfg||{};
  width=width||S.printWidth||'80mm';
  var isNarrow=width==='58mm';
  var isA4=width==='a4';
  var pw=isA4?'210mm':width;
  var pm=PAYS.find(function(m){return m.id===o.payMethod;})||{label:o.payMethod||'â€”'};
  var dateStr=fdateOnly(o.time?o.time.toISOString():o.date||'');
  var b=o.billing||{};
  var storeName=cfg.store_name||CFG.store_name||'Hambelela Organic';
  var storeAddr=cfg.store_address||CFG.store_address||'';
  var storePhone=cfg.store_phone||CFG.store_phone||'';
  var vatNum=cfg.vat_number||CFG.vat_number||'';
  var footer=cfg.receipt_footer||CFG.receipt_footer||'Thank you!';
  var logoUrl=CFG.logo_url||'';
  var fs=isNarrow?'9px':isA4?'12px':'10px';
  var fsBig=isNarrow?'12px':isA4?'18px':'13px';

  var css=[
    '*{box-sizing:border-box;margin:0;padding:0;}',
    // Century Gothic is the primary font; Futura and Trebuchet MS are close system fallbacks.
    // font-weight:700 throughout ensures ink density for thermal printing.
    '@font-face{font-family:"CenturyGothicFB";src:local("Century Gothic"),local("CenturyGothic"),local("Futura"),local("Trebuchet MS");}',
    'body{font-family:"Century Gothic","CenturyGothic","Futura","Trebuchet MS","Gill Sans",Arial,sans-serif;font-size:'+fs+';width:'+pw+';margin:0 auto;padding:'+(isA4?'30px 40px':'6px 6px')+';color:#000;background:#fff;line-height:1.6;-webkit-print-color-adjust:exact;print-color-adjust:exact;font-weight:700;}',
    'h1{font-size:'+fsBig+';font-weight:800;text-align:center;margin-bottom:2px;color:#000;letter-spacing:0.5px;}',
    '.sub{text-align:center;font-size:'+(isNarrow?'8px':'9px')+';color:#000;margin-bottom:4px;font-weight:700;}',
    '.rule{border:none;border-top:1.5px dashed #000;margin:5px 0;}',
    '.row{display:flex;justify-content:space-between;font-weight:700;color:#000;}',
    '.label{color:#000;font-weight:800;}',
    'table{width:100%;border-collapse:collapse;}',
    'td{padding:'+(isNarrow?'1px 0':'2px 0')+';font-size:'+fs+';color:#000;font-weight:700;}',
    '.r{text-align:right;}',
    '.total-row td{font-weight:800;font-size:'+(isNarrow?'12px':'13px')+';border-top:1.5px solid #000;padding-top:5px;color:#000;}',
    '.footer{text-align:center;margin-top:8px;font-size:'+(isNarrow?'8px':'9px')+';color:#000;font-weight:700;}',
    'img.logo{max-width:'+(isNarrow?'60px':'80px')+';max-height:50px;display:block;margin:0 auto 4px;}',
    '@media print{@page{size:'+pw+' auto;margin:0;}body{margin:0;padding:'+(isA4?'20px 30px':'4px 5px')+';}button{display:none!important;}}',
  ].join('');

  var lines=[];
  lines.push('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Receipt</title><style>'+css+'</style></head><body>');
  if(logoUrl)lines.push('<img class="logo" src="'+esc(logoUrl)+'" alt="logo">');
  lines.push('<h1>'+esc(storeName)+'</h1>');
  if(storeAddr)lines.push('<div class="sub">'+esc(storeAddr)+'</div>');
  if(storePhone)lines.push('<div class="sub">'+esc(storePhone)+'</div>');
  if(vatNum)lines.push('<div class="sub">VAT: '+esc(vatNum)+'</div>');
  lines.push('<hr class="rule">');
  lines.push('<div class="row"><span class="label">RECEIPT:</span><span>INV-'+esc(String(o.invoiceNum||''))+'</span></div>');
  lines.push('<div class="row"><span class="label">Order:</span><span>'+esc(String(o.orderNum||''))+'</span></div>');
  lines.push('<div class="row"><span class="label">Date:</span><span>'+esc(dateStr)+'</span></div>');
  lines.push('<div class="row"><span class="label">Cashier:</span><span>'+esc(o.cashier||CASHIER)+'</span></div>');
  lines.push('<div class="row"><span class="label">Payment:</span><span>'+esc(o.payMethod==='split'?'Split':pm.label)+'</span></div>');
  if(o.customer&&o.customer.name)lines.push('<div class="row"><span class="label">Customer:</span><span>'+esc(o.customer.name)+'</span></div>');
  lines.push('<hr class="rule">');
  lines.push('<table>');
  (o.cart||[]).forEach(function(i){
    lines.push('<tr><td colspan="2">'+esc(i.name+(i.varLabel?' ('+i.varLabel+')':''))+'</td></tr>');
    lines.push('<tr><td class="label">  x'+i.qty+' @ '+fmt(i.price)+'</td><td class="r">'+fmt(i.price*i.qty)+'</td></tr>');
  });
  lines.push('<tr><td colspan="2"><hr class="rule" style="margin:3px 0"></td></tr>');
  if(o.da>0)lines.push('<tr><td>Discount</td><td class="r">-'+fmt(o.da)+'</td></tr>');
  lines.push('<tr><td>Subtotal (incl. VAT)</td><td class="r">'+fmt((o.sub||0)-(o.da||0))+'</td></tr>');
  lines.push('<tr><td>VAT (15% incl.)</td><td class="r">'+fmt(o.tax)+'</td></tr>');
  if(o.sc>0)lines.push('<tr><td>'+(o.shipMethod?o.shipMethod.title:'Delivery')+'</td><td class="r">'+fmt(o.sc)+'</td></tr>');
  lines.push('<tr class="total-row"><td>TOTAL</td><td class="r">'+fmt(o.total)+'</td></tr>');
  lines.push('</table>');
  if(o.note)lines.push('<div class="sub" style="margin-top:6px;font-style:italic">Note: '+esc(o.note)+'</div>');
  lines.push('<hr class="rule">');
  lines.push('<div class="footer">'+esc(footer)+'</div>');
  lines.push('<br><button style="display:block;margin:10px auto;padding:8px 20px;cursor:pointer" onclick="window.print()">ðŸ–¨ Print</button>');
  lines.push('</body></html>');

  var w=window.open('','_blank','width=500,height=700');
  if(!w){toast('Allow popups to print receipts','err');return;}
  w.document.write(lines.join('\n'));
  w.document.close();
  setTimeout(function(){try{w.focus();w.print();}catch(e){}},400);
}
// â”€â”€ HELD ORDERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function heldPage(){
  return el('div',{cls:'hpage'},[
    el('div',{cls:'hpage-head'},[el('h2',{cls:'hpage-title'},['Hold']),el('span',{cls:'hpage-meta'},[S.held.length+' held'])]),
    !S.held.length
      ?el('div',{cls:'hempty2'},['â¸ No held orders. Use "Hold" from the POS.'])
      :el('div',{cls:'hheld-list'},S.held.map(function(h){
          var sub=h.cart.reduce(function(s,i){return s+i.price*i.qty;},0);
          return el('div',{cls:'hheld-card'},[
            el('div',{cls:'hheld-head'},[
              el('span',{cls:'hheld-ref'},[h.ref]),
              el('span',{cls:'hpage-meta'},[new Date(h.time).toLocaleTimeString()]),
              h.customer?el('span',{cls:'hheld-cust'},['ðŸ‘¤ '+h.customer.name]):el('span',{cls:'hpage-meta'},['Guest']),
            ]),
            el('div',{cls:'hheld-items'},h.cart.map(function(i){return el('div',{cls:'hheld-item'},[i.name+(i.varLabel?' ('+i.varLabel+')':'')+' Ã—'+i.qty+' â€” '+fmt(i.price*i.qty)]);})),
            el('div',{cls:'hheld-total'},['Total: '+fmt(sub)]),
            el('div',{cls:'hheld-acts'},[
              el('button',{cls:'hbtn hbtn-primary',onClick:function(){resumeHeld(h);}},['â–¶ Resume']),
              el('button',{cls:'hbtn',onClick:function(){showAddCustToHeld(h);}},['ðŸ‘¤ Add Info']),
              el('button',{cls:'hbtn hbtn-danger',onClick:function(){S.held=S.held.filter(function(x){return x.id!==h.id;});redraw();}},['ðŸ—‘']),
            ]),
          ]);
        })),
  ]);
}
function resumeHeld(h){S.cart=h.cart;S.customer=h.customer;S.billing=h.billing||{};S.shipping=h.shipping||{};S.shipMethod=h.shipMethod;S.discount=h.discount;S.discType=h.discType;S.note=h.note;S.orderRef=h.ref;S.held=S.held.filter(function(x){return x.id!==h.id;});go('pos');}
function showAddCustToHeld(h){
  var vals={billing_first_name:'',billing_last_name:'',email:'',billing_phone:''};
  var body=el('div',{cls:'hform'},[
    el('p',{cls:'hform-section'},['Customer for held order']),
    frow([ff('First Name','text',vals,'billing_first_name'),ff('Last Name','text',vals,'billing_last_name')]),
    ff('Email','email',vals,'email'),ff('Phone','tel',vals,'billing_phone'),
    el('button',{cls:'hbtn hbtn-primary hbtn-full',style:{marginTop:'10px'},onClick:function(){
      var name=((vals.billing_first_name)+' '+(vals.billing_last_name)).trim();
      var idx=S.held.findIndex(function(x){return x.id===h.id;});
      if(idx>=0)S.held[idx]=Object.assign({},S.held[idx],{customer:{name:name,email:vals.email,phone:vals.billing_phone,loyalty_points:0,id:0}});
      closeModal();redraw();toast('Info added','ok');
    }},['Save']),
  ]);
  openModal('Add Customer to Held Order',body,'md');
}

// â”€â”€ ORDERS PAGE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// QUOTES PAGE
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function quotesPage(){
  // Load quotes on first visit
  if(!S.loadQ&&!S.quotes.length&&!S.quotesLoaded){
    S.loadQ=true;
    api('/quotes').then(function(d){
      S.quotes=Array.isArray(d)?d:[];
      S.loadQ=false;S.quotesLoaded=true;
      if(S.page==='quotes')redraw();
    }).catch(function(e){
      S.loadQ=false;S.quotesLoaded=true;
      if(S.page==='quotes')redraw();
      toast('Error loading quotes: '+(e.message||'unknown'),'err');
    });
    return el('div',{cls:'hpage'},[el('div',{cls:'hloading'},[el('div',{cls:'hspinner'}),' Loading quotes...'])]);
  }

  var STATUSES=['all','draft','sent','accepted','declined','expired'];
  var STATUS_COLORS={draft:'#6b7280',sent:'#2563eb',accepted:'#16a34a',declined:'#dc2626',expired:'#f59e0b'};

  // â”€â”€ Filter â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  var filtered=S.quotes.filter(function(q){
    var matchS=S.quoteStatusF==='all'||q.status===S.quoteStatusF;
    var qstr=(S.quoteQ||'').toLowerCase();
    var matchQ=!qstr||(q.quote_number||'').toLowerCase().includes(qstr)||(q.customer_name||'').toLowerCase().includes(qstr);
    return matchS&&matchQ;
  });

  // â”€â”€ Status badge â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function qbadge(status){
    var colors={draft:'background:#f3f4f6;color:#374151',sent:'background:#eff6ff;color:#1d4ed8',accepted:'background:#f0fdf4;color:#15803d',declined:'background:#fff5f5;color:#dc2626',expired:'background:#fffbeb;color:#b45309'};
    var s=el('span',{style:{padding:'2px 8px',borderRadius:'6px',fontSize:'10px',fontWeight:'700',textTransform:'uppercase',letterSpacing:'0.5px'+(colors[status]?';'+colors[status]:'')}},[status||'draft']);
    if(colors[status])s.style.cssText+='padding:2px 8px;border-radius:6px;font-size:10px;font-weight:700;text-transform:uppercase;'+colors[status];
    return s;
  }

  // â”€â”€ New quote modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function showNewQuoteModal(existing){
    var isEdit=!!existing;
    var qVals=isEdit?{
      customer_name:existing.customer_name||'',
      customer_email:existing.customer_email||'',
      customer_phone:existing.customer_phone||'',
      customer_address:existing.customer_address||'',
      items:(existing.items||[]).map(function(i){return{id:i.id,variation_id:i.variation_id||0,name:i.name,price:i.price,qty:i.qty,sku:i.sku||''};}),
      discount:existing.discount||0,
      shipping:existing.shipping||0,
      notes:existing.notes||'',
      valid_days:existing.valid_days||30,
    }:{
      customer_name:S.customer?(S.customer.name||''):'',
      customer_email:S.customer?(S.customer.email||''):'',
      customer_phone:S.customer?(S.customer.phone||''):'',
      customer_address:'',
      items:S.cart.length?S.cart.map(function(i){return{id:i.productId,variation_id:i.variationId||0,name:i.name,price:i.price,qty:i.qty,sku:i.sku||''};}):[],
      discount:0,shipping:0,notes:'',valid_days:30,
    };

    var itemsWrap=D.createElement('div');

    function calcTotals(){
      var sub=qVals.items.reduce(function(s,i){return s+(parseFloat(i.price)||0)*(parseInt(i.qty)||1);},0);
      qVals.subtotal=sub;
      qVals.total=Math.max(0,sub-( parseFloat(qVals.discount)||0)+(parseFloat(qVals.shipping)||0));
      return{sub:sub,total:qVals.total};
    }

    function renderItems(){
      itemsWrap.innerHTML='';
      qVals.items.forEach(function(item,idx){
        var row=D.createElement('div');
        row.style.cssText='display:grid;grid-template-columns:1fr 70px 80px 28px;gap:6px;align-items:center;padding:5px 0;border-bottom:1px solid #f5f5f5;';
        var nameEl=D.createElement('div');nameEl.style.cssText='font-size:12px;font-weight:600;';nameEl.textContent=item.name+(item.sku?' ('+item.sku+')':'');
        var priceInp=D.createElement('input');priceInp.type='number';priceInp.value=item.price||0;priceInp.min='0';priceInp.step='0.01';
        priceInp.style.cssText='border:1px solid #e2e8f0;border-radius:5px;padding:4px;font-size:12px;text-align:right;width:100%;';
        priceInp.addEventListener('keydown',function(e){e.stopPropagation();});
        priceInp.addEventListener('change',function(){item.price=parseFloat(this.value)||0;renderItems();});
        var qtyInp=D.createElement('input');qtyInp.type='number';qtyInp.value=item.qty||1;qtyInp.min='1';
        qtyInp.style.cssText='border:1px solid #e2e8f0;border-radius:5px;padding:4px;font-size:12px;text-align:center;width:100%;';
        qtyInp.addEventListener('keydown',function(e){e.stopPropagation();});
        qtyInp.addEventListener('change',function(){item.qty=Math.max(1,parseInt(this.value)||1);renderItems();});
        var delBtn=D.createElement('button');delBtn.textContent='âœ•';delBtn.style.cssText='border:none;background:none;color:#dc2626;cursor:pointer;font-size:14px;padding:0;width:100%;';
        delBtn.addEventListener('click',function(){qVals.items.splice(idx,1);renderItems();});
        row.appendChild(nameEl);row.appendChild(priceInp);row.appendChild(qtyInp);row.appendChild(delBtn);
        itemsWrap.appendChild(row);
      });
      // Running total
      var t=calcTotals();
      var totEl=D.createElement('div');totEl.style.cssText='text-align:right;font-size:13px;font-weight:700;padding-top:8px;border-top:2px solid #e2e8f0;margin-top:4px;';
      totEl.textContent='Total: '+fmt(t.total);
      itemsWrap.appendChild(totEl);
    }

    // Product search for adding items (includes out of stock)
    var srchInp=D.createElement('input');srchInp.className='hinp';srchInp.placeholder='ðŸ” Search products to add (incl. out of stock)â€¦';
    srchInp.style.cssText='width:100%;font-size:12px;margin-bottom:6px;';
    var srchResults=D.createElement('div');srchResults.style.cssText='max-height:150px;overflow-y:auto;border:1px solid #e2e8f0;border-radius:8px;background:#fff;display:none;';
    var srchTimer=null;
    srchInp.addEventListener('keydown',function(e){e.stopPropagation();});
    srchInp.addEventListener('input',function(){
      clearTimeout(srchTimer);var q=this.value.trim().toLowerCase();
      if(!q){srchResults.style.display='none';return;}
      srchTimer=setTimeout(function(){
        // Search all products including out-of-stock
        var matches=S.products.filter(function(p){return p.name.toLowerCase().includes(q)||(p.sku||'').toLowerCase().includes(q);}).slice(0,10);
        srchResults.innerHTML='';
        if(!matches.length){srchResults.style.display='none';return;}
        matches.forEach(function(p){
          var entries=[];
          if(p.type==='variable'&&p.variations&&p.variations.length){
            p.variations.forEach(function(v){
              var vLabel=Object.values(v.attributes||{}).join(' / ');
              var inStock=v.manage_stock?(v.stock_qty>0):true;
              entries.push({id:p.id,variation_id:v.id,name:p.name+(vLabel?' â€“ '+vLabel:''),price:v.price,sku:v.sku||p.sku||'',inStock:inStock});
            });
          } else {
            var inStock=p.manage_stock?(p.stock_qty>0):true;
            entries.push({id:p.id,variation_id:0,name:p.name,price:p.price,sku:p.sku||'',inStock:inStock});
          }
          entries.forEach(function(entry){
            var r=D.createElement('div');
            r.style.cssText='display:flex;align-items:center;justify-content:space-between;padding:7px 12px;cursor:pointer;border-bottom:1px solid #f5f5f5;font-size:12px;';
            r.addEventListener('mouseenter',function(){this.style.background='#f0fdf4';});
            r.addEventListener('mouseleave',function(){this.style.background='';});
            var nm=D.createElement('span');nm.textContent=entry.name;
            var right=D.createElement('div');right.style.cssText='display:flex;align-items:center;gap:8px;';
            if(!entry.inStock){var oos=D.createElement('span');oos.textContent='OOS';oos.style.cssText='font-size:9px;background:#fee2e2;color:#dc2626;padding:1px 5px;border-radius:4px;font-weight:700;';right.appendChild(oos);}
            var pr=D.createElement('span');pr.textContent=fmt(entry.price);pr.style.cssText='font-weight:600;color:#6b7280;';right.appendChild(pr);
            r.appendChild(nm);r.appendChild(right);
            r.addEventListener('click',function(){
              var existing=qVals.items.find(function(i){return i.id===entry.id&&i.variation_id===entry.variation_id;});
              if(existing){existing.qty++;}
              else{qVals.items.push({id:entry.id,variation_id:entry.variation_id,name:entry.name,price:parseFloat(entry.price)||0,qty:1,sku:entry.sku});}
              srchInp.value='';srchResults.style.display='none';renderItems();
            });
            srchResults.appendChild(r);
          });
        });
        srchResults.style.display='block';
      },200);
    });

    var discInp=el('input',{cls:'hinp',type:'number',min:'0',step:'0.01',value:String(qVals.discount||0),placeholder:'Discount amount'});
    discInp.addEventListener('keydown',function(e){e.stopPropagation();});
    discInp.addEventListener('change',function(){qVals.discount=parseFloat(this.value)||0;renderItems();});
    var shipInp=el('input',{cls:'hinp',type:'number',min:'0',step:'0.01',value:String(qVals.shipping||0),placeholder:'Shipping/Delivery'});
    shipInp.addEventListener('keydown',function(e){e.stopPropagation();});
    shipInp.addEventListener('change',function(){qVals.shipping=parseFloat(this.value)||0;renderItems();});
    var validInp=el('input',{cls:'hinp',type:'number',min:'1',value:String(qVals.valid_days||30)});
    validInp.addEventListener('keydown',function(e){e.stopPropagation();});
    validInp.addEventListener('change',function(){qVals.valid_days=parseInt(this.value)||30;});
    var notesInp=D.createElement('textarea');notesInp.className='hinp';notesInp.rows=3;notesInp.placeholder='Quote notes, terms, special conditionsâ€¦';
    notesInp.value=qVals.notes||'';
    notesInp.style.cssText='width:100%;resize:vertical;font-family:inherit;';
    notesInp.addEventListener('keydown',function(e){e.stopPropagation();});
    notesInp.addEventListener('input',function(){qVals.notes=this.value;});

    // Customer fields
    var cnameInp=el('input',{cls:'hinp',value:qVals.customer_name,placeholder:'Customer name'});cnameInp.addEventListener('keydown',function(e){e.stopPropagation();});cnameInp.addEventListener('input',function(){qVals.customer_name=this.value;});
    var cemailInp=el('input',{cls:'hinp',type:'email',value:qVals.customer_email,placeholder:'Email'});cemailInp.addEventListener('keydown',function(e){e.stopPropagation();});cemailInp.addEventListener('input',function(){qVals.customer_email=this.value;});
    var cphoneInp=el('input',{cls:'hinp',value:qVals.customer_phone,placeholder:'Phone'});cphoneInp.addEventListener('keydown',function(e){e.stopPropagation();});cphoneInp.addEventListener('input',function(){qVals.customer_phone=this.value;});
    var caddrInp=el('input',{cls:'hinp',value:qVals.customer_address,placeholder:'Address (optional)'});caddrInp.addEventListener('keydown',function(e){e.stopPropagation();});caddrInp.addEventListener('input',function(){qVals.customer_address=this.value;});

    var saveBtn=el('button',{cls:'hbtn hbtn-primary',style:{marginTop:'10px'}},[isEdit?'ðŸ’¾ Save Changes':'ðŸ’¾ Save Quote']);
    saveBtn.addEventListener('click',function(){
      if(!qVals.customer_name){toast('Customer name is required','err');return;}
      if(!qVals.items.length){toast('Add at least one item','err');return;}
      calcTotals();
      saveBtn.disabled=true;saveBtn.textContent='Savingâ€¦';
      var url=isEdit?'/quotes/'+existing.id:'/quotes';
      var method=isEdit?'PUT':'POST';
      api(url,{method:method,body:JSON.stringify(qVals)}).then(function(q){
        if(isEdit){
          var idx=S.quotes.findIndex(function(x){return x.id===existing.id;});
          if(idx!==-1)S.quotes[idx]=q;
          closeModal();
          toast('Quote '+q.quote_number+' updated','ok');
        } else {
          S.quotes.unshift(q);
          closeModal();
          toast('Quote '+q.quote_number+' created','ok');
        }
        redraw();
      }).catch(function(e){saveBtn.disabled=false;saveBtn.textContent=isEdit?'ðŸ’¾ Save Changes':'ðŸ’¾ Save Quote';toast('Error: '+e.message,'err');});
    });

    renderItems();

    var body=el('div',{style:{display:'flex',flexDirection:'column',gap:'12px'}},[
      el('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}},[
        el('div',{},[el('label',{cls:'hlbl'},['Customer Name *']),cnameInp]),
        el('div',{},[el('label',{cls:'hlbl'},['Email']),cemailInp]),
        el('div',{},[el('label',{cls:'hlbl'},['Phone']),cphoneInp]),
        el('div',{},[el('label',{cls:'hlbl'},['Address']),caddrInp]),
      ]),
      el('p',{cls:'hform-section'},['Items']),
      el('div',{},[srchInp,srchResults]),
      itemsWrap,
      el('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'8px'}},[
        el('div',{},[el('label',{cls:'hlbl'},['Discount (N$)']),discInp]),
        el('div',{},[el('label',{cls:'hlbl'},['Shipping (N$)']),shipInp]),
        el('div',{},[el('label',{cls:'hlbl'},['Valid for (days)']),validInp]),
      ]),
      el('div',{},[el('label',{cls:'hlbl'},['Notes / Terms']),notesInp]),
      saveBtn,
    ]);
    openModal(isEdit?('âœŽ Edit Quote '+existing.quote_number):'ðŸ“ New Quotation',body,'lg');
  }

  // â”€â”€ View quote modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function showViewQuoteModal(q){
    var statusSel=D.createElement('select');statusSel.className='hsel';
    ['draft','sent','accepted','declined','expired'].forEach(function(s){
      var o=D.createElement('option');o.value=s;o.textContent=s.charAt(0).toUpperCase()+s.slice(1);if(s===q.status)o.selected=true;
      statusSel.appendChild(o);
    });
    statusSel.addEventListener('change',function(){
      api('/quotes/'+q.id,{method:'PUT',body:JSON.stringify({status:this.value})}).then(function(updated){
        var idx=S.quotes.findIndex(function(x){return x.id===q.id;});
        if(idx!==-1)S.quotes[idx]=updated;
        q.status=updated.status;
        toast('Status updated','ok');
      });
    });

    var convertBtn=null;
    if(q.status!=='accepted'&&!q.order_id){
      convertBtn=el('button',{cls:'hbtn hbtn-primary',style:{marginLeft:'8px'}},['âœ“ Convert to Order']);
      convertBtn.addEventListener('click',function(){showConvertModal(q);});
    }

    var printBtn=el('button',{cls:'hbtn'},['ðŸ–¨ Print Quote']);
    printBtn.addEventListener('click',function(){printQuote(q);});

    var editBtn=null;
    if(!q.order_id){
      editBtn=el('button',{cls:'hbtn',style:{background:'#fef3c7',borderColor:'#f59e0b',color:'#92400e'}},['âœŽ Edit Quote']);
      editBtn.addEventListener('click',function(){
        closeModal();
        showNewQuoteModal(q);
      });
    }

    var deleteBtn=null;
    if(!q.order_id){
      deleteBtn=el('button',{cls:'hbtn',style:{color:'#dc2626',borderColor:'#dc2626',marginLeft:'auto'}},['ðŸ—‘ Delete']);
      deleteBtn.addEventListener('click',function(){
        if(!confirm('Delete quote '+q.quote_number+'? This cannot be undone.'))return;
        api('/quotes/'+q.id,{method:'DELETE'}).then(function(){
          S.quotes=S.quotes.filter(function(x){return x.id!==q.id;});
          closeModal();toast('Quote deleted','ok');redraw();
        }).catch(function(e){toast('Error: '+e.message,'err');});
      });
    }

    var itemsTable=el('table',{cls:'htbl'},[
      el('thead',{},[el('tr',{},[th('Product'),th('SKU'),th('Price'),th('Qty'),th('Total')])]),
      el('tbody',{},(q.items||[]).map(function(i){
        return el('tr',{},[td(i.name),td(i.sku||'â€”'),td(fmt(i.price||0)),td(String(i.qty||1)),td(el('strong',{},[fmt((i.price||0)*(i.qty||1))]))]);
      })),
    ]);

    var sub=(q.items||[]).reduce(function(s,i){return s+(i.price||0)*(i.qty||1);},0);
    var orderLink=q.order_id?el('div',{style:{marginTop:'8px',padding:'10px 12px',background:'#f0fdf4',borderRadius:'8px',fontSize:'12px',color:'#15803d',fontWeight:'600'}},
      ['âœ“ Converted to Order #'+q.order_id]):null;

    var expiresDate=q.expires_at?'Expires: '+q.expires_at:'';

    var body=el('div',{style:{display:'flex',flexDirection:'column',gap:'12px'}},[
      el('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',padding:'10px',background:'#f8fafc',borderRadius:'10px',border:'1px solid #e2e8f0'}},[
        el('div',{},[el('div',{style:{fontSize:'11px',color:'#6b7280'}},['Customer']),el('div',{style:{fontWeight:'700'}},[ q.customer_name||'â€”'])]),
        el('div',{},[el('div',{style:{fontSize:'11px',color:'#6b7280'}},['Phone']),el('div',{},[q.customer_phone||'â€”'])]),
        el('div',{},[el('div',{style:{fontSize:'11px',color:'#6b7280'}},['Email']),el('div',{},[q.customer_email||'â€”'])]),
        el('div',{},[el('div',{style:{fontSize:'11px',color:'#6b7280'}},['Created / Validity']),el('div',{style:{fontSize:'11px'}},[ (q.created_at||'').slice(0,10)+' / '+q.valid_days+' days â€” '+expiresDate])]),
      ]),
      el('div',{cls:'htable-wrap'},[itemsTable]),
      el('div',{style:{display:'flex',justifyContent:'flex-end',flexDirection:'column',gap:'4px',fontSize:'13px',padding:'0 4px'}},[
        el('div',{style:{display:'flex',justifyContent:'space-between'}},['Subtotal',el('span',{},[fmt(sub)])]),
        q.discount>0?el('div',{style:{display:'flex',justifyContent:'space-between',color:'#16a34a'}},['Discount',el('span',{},['- '+fmt(q.discount)])]):null,
        q.shipping>0?el('div',{style:{display:'flex',justifyContent:'space-between'}},['Shipping',el('span',{},[fmt(q.shipping)])]):null,
        el('div',{style:{display:'flex',justifyContent:'space-between',fontWeight:'800',fontSize:'15px',borderTop:'2px solid #e2e8f0',paddingTop:'6px'}},['TOTAL',el('span',{},[fmt(q.total)])]),
      ]),
      q.notes?el('div',{style:{background:'#f8fafc',borderRadius:'8px',padding:'10px',fontSize:'12px',color:'#374151'}},[el('b',{},[' Notes: ']),q.notes]):null,
      orderLink,
      el('div',{style:{display:'flex',gap:'8px',flexWrap:'wrap',marginTop:'4px'}},[
        el('div',{},[el('label',{cls:'hlbl',style:{marginRight:'6px'}},['Status: ']),statusSel]),
        printBtn,
        editBtn,
        convertBtn,
        deleteBtn,
      ]),
    ]);
    openModal('ðŸ“ Quote '+q.quote_number,body,'lg');
  }

  // â”€â”€ Convert to order modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function showConvertModal(q){
    var cVals={payment_method:'cash',payment_method_title:'Cash',status:'processing'};
    var paySel=D.createElement('select');paySel.className='hsel hsel-full';
    PAYS.forEach(function(m){var o=D.createElement('option');o.value=m.id;o.textContent=m.e+' '+m.label;paySel.appendChild(o);});
    paySel.addEventListener('change',function(){cVals.payment_method=this.value;cVals.payment_method_title=(PAYS.find(function(m){return m.id===this.value;},this)||{label:this.value}).label;});
    var statusSel=D.createElement('select');statusSel.className='hsel hsel-full';
    [{k:'processing',l:'Processing'},{k:'completed',l:'Completed'},{k:'on-hold',l:'On Hold'}].forEach(function(s){var o=D.createElement('option');o.value=s.k;o.textContent=s.l;if(s.k===cVals.status)o.selected=true;statusSel.appendChild(o);});
    statusSel.addEventListener('change',function(){cVals.status=this.value;});
    var confirmBtn=el('button',{cls:'hbtn hbtn-primary hbtn-full',style:{marginTop:'12px'}},['âœ“ Confirm â€” Create Order & Invoice']);
    confirmBtn.addEventListener('click',function(){
      confirmBtn.disabled=true;confirmBtn.textContent='Creating orderâ€¦';
      api('/quotes/'+q.id+'/convert',{method:'POST',body:JSON.stringify(cVals)}).then(function(r){
        if(r.success){
          var idx=S.quotes.findIndex(function(x){return x.id===q.id;});
          if(idx!==-1)S.quotes[idx]=r.quote;
          closeModal();
          toast('Order #'+r.order_number+' created from '+q.quote_number,'ok');
          setTimeout(function(){
            // Show print option
            var receipt=r.quote;
            if(confirm('Order #'+r.order_number+' created for N$ '+fmt(r.total)+'. Print receipt / invoice?')){
              api('/orders/'+r.order_id).then(function(ord){if(ord)printInvoice(ord);}).catch(function(){});
            }
          },300);
          redraw();
        } else {confirmBtn.disabled=false;confirmBtn.textContent='âœ“ Confirm â€” Create Order';toast(r.error||'Conversion failed','err');}
      }).catch(function(e){confirmBtn.disabled=false;confirmBtn.textContent='âœ“ Confirm';toast('Error: '+e.message,'err');});
    });
    var body=el('div',{style:{display:'flex',flexDirection:'column',gap:'12px'}},[
      el('div',{style:{background:'#fffbeb',border:'1px solid #fde68a',borderRadius:'8px',padding:'12px',fontSize:'12px'}},[
        'âš  Converting this quote will create a real WooCommerce order with a unique order number and invoice. Stock levels will be reduced. This action cannot be undone.',
      ]),
      el('div',{style:{background:'#f8fafc',borderRadius:'10px',padding:'12px',border:'1px solid #e2e8f0'}},[
        el('div',{style:{display:'flex',justifyContent:'space-between',marginBottom:'6px',fontSize:'13px'}},[el('span',{},[q.quote_number+' â€” '+q.customer_name]),el('strong',{},[fmt(q.total)])]),
        el('div',{style:{fontSize:'11px',color:'#9ca3af'}},[(q.items||[]).length+' items']),
      ]),
      el('label',{cls:'hlbl'},['Payment Method']),paySel,
      el('label',{cls:'hlbl'},['Order Status']),statusSel,
      confirmBtn,
    ]);
    openModal('Convert Quote to Order',body,'md');
  }

  // â”€â”€ Print quote â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function printQuote(q){
    var w=window.open('','_blank','width=750,height=950');
    if(!w){toast('Allow popups to print','err');return;}
    var sub=(q.items||[]).reduce(function(s,i){return s+(i.price||0)*(i.qty||1);},0);
    var storeName=CFG.store_name||'Hambelela Organic';
    var storeAddr=CFG.store_address||'';
    var storePhone=CFG.store_phone||'';
    var storeEmail=CFG.store_email||'';
    var vatNum=CFG.vat_number||'';
    w.document.write('<!DOCTYPE html><html><head><title>Quote '+q.quote_number+'</title><style>');
    w.document.write('*{box-sizing:border-box;margin:0;padding:0;}');
    w.document.write('body{font-family:"Century Gothic","Futura","Trebuchet MS",Arial,sans-serif;font-size:12px;color:#111;padding:32px 40px;line-height:1.6;}');
    w.document.write('.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;padding-bottom:16px;border-bottom:2px solid #111;}');
    w.document.write('.logo-name{font-size:22px;font-weight:800;letter-spacing:-0.5px;}');
    w.document.write('.quote-title{font-size:28px;font-weight:800;color:#4ade80;text-align:right;}');
    w.document.write('.quote-num{font-size:14px;font-weight:700;text-align:right;}');
    w.document.write('.section{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:24px;}');
    w.document.write('.section-label{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#6b7280;margin-bottom:6px;}');
    w.document.write('table{width:100%;border-collapse:collapse;margin-bottom:20px;}');
    w.document.write('th{background:#111;color:#fff;padding:8px 10px;text-align:left;font-size:11px;font-weight:700;}');
    w.document.write('td{padding:8px 10px;border-bottom:1px solid #e5e7eb;font-size:12px;}');
    w.document.write('tr:nth-child(even) td{background:#f9fafb;}');
    w.document.write('.totals{margin-left:auto;width:260px;}');
    w.document.write('.trow{display:flex;justify-content:space-between;padding:4px 0;font-size:12px;}');
    w.document.write('.trow.total{font-weight:800;font-size:15px;border-top:2px solid #111;padding-top:8px;margin-top:4px;}');
    w.document.write('.status-badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:10px;font-weight:700;text-transform:uppercase;background:#f0fdf4;color:#15803d;border:1px solid #86efac;}');
    w.document.write('.footer{margin-top:28px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:11px;color:#6b7280;text-align:center;}');
    w.document.write('.validity{background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:10px 14px;font-size:11px;color:#92400e;margin-bottom:20px;}');
    w.document.write('@media print{button{display:none}@page{margin:0;}body{padding:20px 28px;}}');
    w.document.write('</style></head><body>');
    w.document.write('<div class="header"><div><div class="logo-name">'+storeName+'</div><div style="font-size:11px;color:#6b7280;margin-top:4px;">'+storeAddr+'</div><div style="font-size:11px;color:#6b7280;">'+storePhone+'&nbsp;&nbsp;'+storeEmail+'</div>'+(vatNum?'<div style="font-size:11px;color:#6b7280;">VAT: '+vatNum+'</div>':'')+'</div><div><div class="quote-title">QUOTATION</div><div class="quote-num">'+q.quote_number+'</div><span class="status-badge">'+q.status+'</span></div></div>');
    w.document.write('<div class="section"><div><div class="section-label">Quote For</div><div style="font-weight:700;font-size:13px;">'+( q.customer_name||'â€”')+'</div><div>'+( q.customer_email||'')+'</div><div>'+( q.customer_phone||'')+'</div><div>'+( q.customer_address||'')+'</div></div><div><div class="section-label">Details</div><div><b>Date:</b> '+(q.created_at||'').slice(0,10)+'</div><div><b>Valid until:</b> '+q.expires_at+'</div><div><b>Prepared by:</b> '+( q.cashier_name||'')+'</div></div></div>');
    w.document.write('<div class="validity">â± This quote is valid for '+q.valid_days+' days from the date of issue. Please confirm by: <b>'+q.expires_at+'</b>.</div>');
    w.document.write('<table><tr><th>Product</th><th>SKU</th><th style="text-align:right">Unit Price</th><th style="text-align:center">Qty</th><th style="text-align:right">Total</th></tr>');
    (q.items||[]).forEach(function(i){
      var lineTotal=(i.price||0)*(i.qty||1);
      w.document.write('<tr><td>'+i.name+'</td><td style="color:#9ca3af">'+( i.sku||'â€”')+'</td><td style="text-align:right">N$ '+(i.price||0).toFixed(2)+'</td><td style="text-align:center">'+( i.qty||1)+'</td><td style="text-align:right;font-weight:700">N$ '+lineTotal.toFixed(2)+'</td></tr>');
    });
    w.document.write('</table>');
    w.document.write('<div class="totals">');
    w.document.write('<div class="trow"><span>Subtotal</span><span>N$ '+sub.toFixed(2)+'</span></div>');
    if(q.discount>0)w.document.write('<div class="trow" style="color:#16a34a"><span>Discount</span><span>- N$ '+q.discount.toFixed(2)+'</span></div>');
    if(q.shipping>0)w.document.write('<div class="trow"><span>Shipping / Delivery</span><span>N$ '+q.shipping.toFixed(2)+'</span></div>');
    w.document.write('<div class="trow total"><span>TOTAL</span><span>N$ '+q.total.toFixed(2)+'</span></div>');
    w.document.write('</div>');
    if(q.notes)w.document.write('<div style="margin-top:20px;padding:12px;background:#f8fafc;border-radius:8px;font-size:12px;"><b>Notes / Terms:</b> '+q.notes+'</div>');
    w.document.write('<div class="footer">'+storeName+' &nbsp;|&nbsp; '+storeAddr+' &nbsp;|&nbsp; '+storePhone+' &nbsp;|&nbsp; Thank you for your interest!</div>');
    w.document.write('<br><div style="text-align:center"><button onclick="window.print()" style="padding:10px 24px;background:#111;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:13px;">ðŸ–¨ Print / Save PDF</button></div>');
    w.document.write('</body></html>');
    w.document.close();
  }

  // â”€â”€ Main quotes list â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  var srchEl=D.createElement('input');
  srchEl.className='hinp';srchEl.placeholder='ðŸ” Search quote # or customerâ€¦';srchEl.value=S.quoteQ||'';
  srchEl.style.cssText='flex:1;font-size:13px;';
  srchEl.addEventListener('keydown',function(e){e.stopPropagation();});
  srchEl.addEventListener('input',function(){
    S.quoteQ=this.value;
    var tbody=D.getElementById('hquotes-tbody');
    if(tbody)renderQuoteRows(tbody);
  });

  var statusFilterEl=D.createElement('select');statusFilterEl.className='hsel';
  STATUSES.forEach(function(s){var o=D.createElement('option');o.value=s;o.textContent=s==='all'?'All Statuses':s.charAt(0).toUpperCase()+s.slice(1);if(s===S.quoteStatusF)o.selected=true;statusFilterEl.appendChild(o);});
  statusFilterEl.addEventListener('change',function(){S.quoteStatusF=this.value;var tbody=D.getElementById('hquotes-tbody');if(tbody)renderQuoteRows(tbody);});

  var newBtn=el('button',{cls:'hbtn hbtn-primary',onClick:function(){showNewQuoteModal();}},['+ New Quote']);
  var refreshBtn=el('button',{cls:'hbtn',onClick:function(){S.quotes=[];S.quotesLoaded=false;S.loadQ=false;redraw();}},['â†»']);

  function renderQuoteRows(tbody){
    tbody.innerHTML='';
    var q2=(S.quoteQ||'').toLowerCase();
    var rows=S.quotes.filter(function(q){
      var matchS=S.quoteStatusF==='all'||q.status===S.quoteStatusF;
      var matchQ=!q2||(q.quote_number||'').toLowerCase().includes(q2)||(q.customer_name||'').toLowerCase().includes(q2);
      return matchS&&matchQ;
    });
    if(!rows.length){
      var empty=D.createElement('tr');var etd=D.createElement('td');etd.colSpan=8;etd.style.cssText='text-align:center;padding:40px;color:#9ca3af;';
      etd.textContent='No quotes found.';empty.appendChild(etd);tbody.appendChild(empty);return;
    }
    rows.forEach(function(q){
      var isExpired=q.status!=='accepted'&&q.status!=='declined'&&q.expires_at&&new Date(q.expires_at)<new Date();
      var row=el('tr',{style:{cursor:'pointer',background:isExpired?'#fffbeb':''}},[ ]);
      row.addEventListener('click',function(){showViewQuoteModal(q);});
      [
        el('td',{},[el('strong',{},[q.quote_number])]),
        td((q.created_at||'').slice(0,10)),
        td(q.customer_name||'â€”'),
        td(q.customer_phone||'â€”'),
        td(String((q.items||[]).length)+' items'),
        td(el('strong',{},[fmt(q.total)])),
        el('td',{},[qbadge(isExpired&&q.status==='sent'?'expired':q.status)]),
        el('td',{onClick:function(e){e.stopPropagation();}},[ 
          q.order_id?el('span',{style:{fontSize:'11px',color:'#16a34a',fontWeight:'700'}},['Order #'+q.order_id]):
          q.status!=='accepted'?el('button',{cls:'hbtn hbtn-sm hbtn-primary',onClick:function(e){e.stopPropagation();showConvertModal(q);}},['â†’ Convert']):
          el('span',{style:{fontSize:'11px',color:'#9ca3af'}},['Converted']),
        ]),
      ].forEach(function(c){row.appendChild(c instanceof HTMLElement?c:(function(){var t=D.createElement('td');t.textContent=String(c);return t;})());});
      tbody.appendChild(row);
    });
  }

  var tbody=D.createElement('tbody');tbody.id='hquotes-tbody';
  renderQuoteRows(tbody);

  return el('div',{cls:'hpage'},[
    el('div',{cls:'hpage-head'},[
      el('h2',{cls:'hpage-title'},['ðŸ“ Quotations']),
      el('div',{style:{display:'flex',gap:'8px',flexWrap:'wrap',alignItems:'center'}},[srchEl,statusFilterEl,newBtn,refreshBtn]),
    ]),
    // Summary strip
    el('div',{cls:'hsumcards'},[
      scard('Total Quotes',String(S.quotes.length),'all time'),
      scard('Draft',String(S.quotes.filter(function(q){return q.status==='draft';}).length),'awaiting send'),
      scard('Sent',String(S.quotes.filter(function(q){return q.status==='sent';}).length),'awaiting response'),
      scard('Accepted',String(S.quotes.filter(function(q){return q.status==='accepted';}).length),'converted'),
    ]),
    el('div',{cls:'hrep-card',style:{margin:'14px 20px 0'}},[
      el('div',{cls:'htable-wrap'},[
        el('table',{cls:'htbl'},[
          el('thead',{},[el('tr',{},[th('Quote #'),th('Date'),th('Customer'),th('Phone'),th('Items'),th('Total'),th('Status'),th('')])]),
          tbody,
        ]),
      ]),
    ]),
  ]);
}

function ordersPage(){
  if(S.loadO)return el('div',{cls:'hloading'},['â³ Loading...']);

  // â”€â”€ PAYMENT METHOD FILTER DROPDOWN â”€â”€
  var PAY_METHODS=['','Cash','Card/Swipe','EFT','FNB eWallet','EasyWallet','Blue Wallet','Nedbank','NetBank Wallet','Pay2Cell','PayToday'];
  var payFilter=D.createElement('select');
  payFilter.style.cssText='padding:7px 12px;border:1.5px solid #e2e8f0;border-radius:8px;background:#f8fafc;font-size:12px;color:#374151;font-family:inherit;cursor:pointer;outline:none;';
  PAY_METHODS.forEach(function(m){
    var o=D.createElement('option');
    o.value=m; o.textContent=m||'All Payments';
    if(S.ordPayF===m)o.selected=true;
    payFilter.appendChild(o);
  });
  payFilter.addEventListener('change',function(){
    S.ordPayF=this.value;
    var tbody=D.getElementById('horders-tbody');
    if(tbody)renderOrdersRows(tbody,S.ordQ,S.ordPayF);
  });

  // â”€â”€ SEARCH BAR â”€â”€
  var srchInput=D.createElement('input');
  srchInput.type='text';
  srchInput.placeholder='Search by order #, name, phone, email or product...';
  srchInput.value=S.ordQ||'';
  srchInput.style.cssText='flex:1;padding:9px 14px;border:1.5px solid #e2e8f0;border-radius:10px;background:#f8fafc;font-size:13px;color:#111;outline:none;font-family:inherit;box-sizing:border-box;transition:border-color .15s;';
  srchInput.addEventListener('focus',function(){this.style.borderColor='#4ade80';});
  srchInput.addEventListener('blur',function(){this.style.borderColor='#e2e8f0';});
  srchInput.addEventListener('keydown',function(e){e.stopPropagation();});
  srchInput.addEventListener('input',function(){
    S.ordQ=this.value;
    var tbody=D.getElementById('horders-tbody');
    if(tbody)renderOrdersRows(tbody,S.ordQ,S.ordPayF);
  });
  var srchWrap=D.createElement('div');
  srchWrap.style.cssText='padding:10px 20px 0;display:flex;gap:8px;align-items:center;';
  srchWrap.appendChild(srchInput);
  srchWrap.appendChild(payFilter);

  // Active filter badge
  var filterBadge=D.createElement('div');
  filterBadge.style.cssText='padding:0 20px;margin-top:5px;font-size:11px;color:#6b7280;';
  filterBadge.textContent=S.ordPayF?'Filtering by: '+S.ordPayF+' â€” click "All Payments" to clear':'';

  var tableWrap=el('div',{cls:'htable-wrap',id:'horders-table'},[
    el('table',{cls:'htbl'},[
      el('thead',{},[el('tr',{},[
        th('Order'),th('Invoice'),th('Date'),th('Mobile'),
        th('Payment'),th('Total'),th('Status'),
        th('View'),th('Invoice'),th('Receipt'),th('Payment'),th('âœ“'),
      ])]),
      el('tbody',{id:'horders-tbody'},[]),
    ]),
  ]);

  var page=el('div',{cls:'hpage'},[
    el('div',{cls:'hpage-head'},[
      el('h2',{cls:'hpage-title'},['Orders']),
      el('button',{cls:'hbtn',onClick:function(){S.ordQ='';S.ordPayF='';fetchOrders();}},['â†» Refresh']),
    ]),
  ]);
  page.appendChild(srchWrap);
  page.appendChild(filterBadge);
  page.appendChild(tableWrap);

  setTimeout(function(){
    var tbody=D.getElementById('horders-tbody');
    if(tbody)renderOrdersRows(tbody,S.ordQ,S.ordPayF);
  },0);

  return page;
}

function renderOrdersRows(tbody,q,payF){
  tbody.innerHTML='';
  q=(q||'').toLowerCase().trim();
  var filtered=S.orders.filter(function(o){
    var b=o.billing||{};
    var name=((b.first_name||'')+' '+(b.last_name||'')).toLowerCase();
    var phone=(b.phone||'').replace(/\s+/g,'').toLowerCase();
    var email=(b.email||'').toLowerCase();
    var num=String(o.number||'');
    var items=(o.items||[]).map(function(i){return(i.name||'').toLowerCase();}).join(' ');
    var qc=q.replace(/\s+/g,'');
    var matchSearch=!q||(num.includes(q)||name.includes(q)||phone.includes(qc)||email.includes(q)||items.includes(q));
    var matchPay=payMatches(o,payF);
    return matchSearch&&matchPay;
  });

  if(!filtered.length){
    var empty=D.createElement('tr');
    var emptyTd=D.createElement('td');
    emptyTd.colSpan=12;
    emptyTd.style.cssText='text-align:center;padding:40px;color:#999;';
    var msg=q?'No orders match "'+q+'"':'No orders found';
    if(payF)msg+=' with payment method "'+payF+'"';
    emptyTd.textContent=msg;
    empty.appendChild(emptyTd);
    tbody.appendChild(empty);
    return;
  }

  filtered.forEach(function(o){
    var b=o.billing||{};
    var custName=b.first_name?(b.first_name+' '+b.last_name).trim():'HO Customer';
    // Mobile: show actual number or "Walk-in-Customer" fallback
    var mobile=(b.phone&&b.phone.trim()&&b.phone!=='Walk-in'&&b.phone!=='Walk-in-Customer')?b.phone:'Walk-in-Customer';
    var isCompleted=o.status==='completed';

    var row=el('tr',{},[
      // Col 1: Order # + customer name
      td(el('div',{style:{display:'grid',gridTemplateColumns:'1fr auto',gap:'6px',alignItems:'center'}},[
        el('div',{},[
          el('strong',{},['#'+o.number]),
          el('div',{style:{fontSize:'11px',color:'#6b7280',marginTop:'1px'}},[custName]),
        ]),
        el('button',{cls:'hiconbtn',title:'Copy for Monday',onClick:function(e){e.stopPropagation();copyOrderLine(o);},html:iconSvg('file',15)}),
      ])),
      // Col 2: Invoice
      td(el('span',{cls:'htag'},'INV-'+o.number)),
      // Col 3: Date
      td(fdt(o.date)),
      // Col 4: Mobile
      td(el('span',{style:{fontSize:'12px',color:mobile==='Walk-in-Customer'?'#9ca3af':'#111'}},[mobile])),
      // Col 5: Payment
      td(o.payment_title||o.payment_method||'â€”'),
      // Col 6: Total
      td(el('strong',{},[fmt(o.total)])),
      // Col 7: Status
      td(sbadge(o.status)),
      // Col 8: View (opens full detail + edit modal)
      td(el('button',{cls:'hbtn hbtn-sm',onClick:function(){showOrderDetail(o);}},['View'])),
      // Col 9: Invoice
      td(el('button',{cls:'hbtn hbtn-sm hbtn-primary',title:'Invoice',onClick:function(){printInvoice(o);},html:iconSvg('file',15)})),
      // Col 10: Receipt
      td(el('button',{cls:'hbtn hbtn-sm',title:'Receipt',onClick:function(){reprintReceipt(o);},html:iconSvg('printer',15)})),
      // Col 11: Edit Payment
      td(el('button',{cls:'hbtn hbtn-sm',onClick:function(){showEditPaymentModal(o);}},['âœŽ'])),
      // Col 12: Completion tick â€” only show if not already completed
      td(isCompleted
        ? el('span',{style:{color:'#16a34a',fontSize:'16px',fontWeight:'700'}},['âœ“'])
        : el('button',{
            cls:'hbtn hbtn-sm',
            style:{background:'#f0fdf4',borderColor:'#16a34a',color:'#16a34a',fontWeight:'700',fontSize:'14px'},
            title:'Mark as Completed',
            onClick:function(){
              api('/orders/'+o.id,{method:'PUT',body:JSON.stringify({status:'completed'})}).then(function(r){
                if(r.success){
                  o.status='completed';
                  var tbody2=D.getElementById('horders-tbody');
                  if(tbody2)renderOrdersRows(tbody2,S.ordQ,S.ordPayF);
                  toast('Order #'+o.number+' completed','ok');
                }
              }).catch(function(e){toast('Error: '+e.message,'err');});
            }
          },['âœ“'])
      ),
    ]);
    tbody.appendChild(row);
  });
}
function showOrderDetail(o){
  var b=o.billing||{};
  var body=el('div',{},[
    el('div',{cls:'hdetail-grid'},[
      el('div',{},[el('p',{cls:'hform-section'},['Order Info']),rrow('Order:','#'+o.number),rrow('Invoice:','INV-'+o.number),rrow('Date:',fdt(o.date)),rrow('Status:',o.status),rrow('Payment:',o.payment_title||o.payment_method),rrow('Cashier:',o.cashier||'â€”')]),
      el('div',{},[el('p',{cls:'hform-section'},['Billing']),b.first_name?rrow('',(b.first_name+' '+b.last_name).trim()):null,b.address_1?rrow('',b.address_1):null,b.city?rrow('',b.city+(b.state?', '+b.state:'')):null,b.phone?rrow('ðŸ“ž',b.phone):null,b.email?rrow('ðŸ“§',b.email):null]),
    ]),
    el('div',{cls:'htable-wrap',style:{marginTop:'12px'}},[
      el('table',{cls:'htbl'},[
        el('thead',{},[el('tr',{},[th('Product'),th('Qty'),th('Price'),th('Total')])]),
        el('tbody',{},(o.items||[]).map(function(i){return el('tr',{},[td(i.name),td(i.qty),td(fmt(i.price)),td(fmt(i.total))]);})),
      ]),
    ]),
    el('div',{cls:'hdetail-totals'},[
      o.shipping_total>0?rrow('Shipping:',fmt(o.shipping_total)):null,
      rrow('VAT incl. (15%):',fmt(o.total_tax)),
      el('div',{cls:'htotal-grand',style:{marginTop:'8px'}},[el('span',{},'TOTAL'),el('span',{cls:'htotal-amt'},[fmt(o.total)])]),
    ]),
    el('div',{cls:'hr-acts',style:{marginTop:'12px'}},[
      el('button',{cls:'hbtn hbtn-primary',onClick:function(){printInvoice(o);}},['Download Tax Invoice']),
      el('button',{cls:'hbtn',onClick:function(){reprintReceipt(o);}},['Print Receipt (80mm)']),
      el('button',{cls:'hbtn',onClick:function(){closeModal();showEditPaymentModal(o);}},['Edit Payment']),
      el('button',{cls:'hbtn',onClick:function(){copyOrderLine(o);}},['Copy Monday']),
      el('button',{cls:'hbtn',onClick:function(){closeModal();showEditOrderModal(o);}},['Edit Order']),
    ]),
  ]);
  openModal('Order #'+o.number,body,'lg');
}

// â”€â”€ EDIT PAYMENT METHOD (inline, no WC redirect) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function showEditPaymentModal(o){
  var sel=el('select',{cls:'hsel hsel-full'});
  PAYS.forEach(function(m){
    var opt=D.createElement('option');
    opt.value=m.id; opt.textContent=m.label;
    if(m.id===o.payment_method||m.label===(o.payment_title||''))opt.selected=true;
    sel.appendChild(opt);
  });
  var noteInp=el('input',{cls:'hinp',style:{width:'100%',marginTop:'10px'},placeholder:'Add note (optional, e.g. EFT reference)'});
  var body=el('div',{},[
    el('p',{style:{fontSize:'12px',color:'#6b7280',marginBottom:'10px'}},['Order #'+o.number+' â€” current: '+(o.payment_title||o.payment_method||'â€”')]),
    el('label',{cls:'hlbl'},['New Payment Method']),
    sel,
    noteInp,
    el('button',{cls:'hbtn hbtn-primary hbtn-full',style:{marginTop:'14px'},onClick:function(){
      var newMethod=sel.value;
      var newLabel=(PAYS.find(function(m){return m.id===newMethod;})||{label:newMethod}).label;
      var payload={payment_method:newMethod,payment_method_title:newLabel};
      if(noteInp.value.trim())payload.note='Payment method updated to '+newLabel+(noteInp.value?' â€“ '+noteInp.value.trim():'');
      api('/orders/'+o.id,{method:'PUT',body:JSON.stringify(payload)}).then(function(r){
        if(r.success){
          // Update local order object so UI reflects change immediately
          o.payment_method=newMethod; o.payment_title=newLabel;
          closeModal();
          toast('Payment updated to '+newLabel,'ok');
          // Refresh orders list
          var tbody=D.getElementById('horders-tbody');
          if(tbody)renderOrdersRows(tbody,S.ordQ,S.ordPayF);
        } else {toast(r.error||'Update failed','err');}
      }).catch(function(e){toast('Error: '+e.message,'err');});
    }},['âœ“ Save Payment Method']),
  ]);
  openModal('âœŽ Edit Payment â€” #'+o.number,body,'sm');
}

// â”€â”€ FULL ORDER EDIT MODAL (all fields, no WC redirect) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function showEditOrderModal(o){
  var b=o.billing||{};
  var sa=o.shipping_address||{};
  // Editable values â€” pre-populated from existing order
  var vals={
    status:          o.status||'processing',
    payment_method:  o.payment_method||'cash',
    payment_method_title: o.payment_title||'Cash',
    first_name:      b.first_name||'',
    last_name:       b.last_name||'',
    phone:           b.phone||'',
    address_1:       b.address_1||'',
    address_2:       b.address_2||'',
    city:            b.city||'',
    state:           b.state||'KH',
    postcode:        b.postcode||'',
    ship_title:      (o.shipping&&o.shipping[0])?o.shipping[0].title:'',
    ship_cost:       parseFloat(o.shipping_total||0)||((o.shipping&&o.shipping[0])?parseFloat(o.shipping[0].total||o.shipping[0].cost||0):0),
    coupon:          '',
    note:            '',
  };

  function inp(lbl,key,type){
    var i=el('input',{cls:'hinp',type:type||'text',value:vals[key]||''});
    i.addEventListener('input',function(){vals[key]=this.value;});
    i.addEventListener('keydown',function(e){e.stopPropagation();});
    return el('div',{cls:'hfield'},[el('label',{cls:'hlbl'},[lbl]),i]);
  }

  // Payment method selector
  var paySelEl=el('select',{cls:'hsel hsel-full'});
  PAYS.forEach(function(m){
    var opt=D.createElement('option');
    opt.value=m.id; opt.textContent=m.label;
    if(m.id===vals.payment_method)opt.selected=true;
    paySelEl.appendChild(opt);
  });
  paySelEl.addEventListener('change',function(){
    vals.payment_method=this.value;
    vals.payment_method_title=(PAYS.find(function(m){return m.id===this.value;},this)||{label:this.value}).label;
  });

  // Status selector
  var statusSelEl=el('select',{cls:'hsel hsel-full'});
  (S.orderStatuses.length?S.orderStatuses:[
    {key:'processing',label:'Processing'},{key:'completed',label:'Completed'},
    {key:'on-hold',label:'On Hold'},{key:'cancelled',label:'Cancelled'},
    {key:'pending',label:'Pending'},
  ]).forEach(function(s){
    statusSelEl.appendChild(el('option',{value:s.key,selected:s.key===vals.status},[s.label]));
  });
  statusSelEl.addEventListener('change',function(){vals.status=this.value;});

  // Shipping method selector (from loaded ship options + current)
  var shipOpts=S.shipOptions.length?S.shipOptions:[];
  var shipSelEl=el('select',{cls:'hsel hsel-full'});
  var blankOpt=D.createElement('option'); blankOpt.value=''; blankOpt.textContent='â€” No change â€”'; shipSelEl.appendChild(blankOpt);
  shipOpts.forEach(function(s){
    var opt=D.createElement('option');
    opt.value=s.title; opt.textContent=s.title+(s.cost?' ('+fmt(s.cost)+')':''); opt.dataset.cost=s.cost||0;
    if(s.title===vals.ship_title)opt.selected=true;
    shipSelEl.appendChild(opt);
  });
  shipSelEl.addEventListener('change',function(){vals.ship_title=this.value;var opt=this.options[this.selectedIndex];vals.ship_cost=opt&&opt.dataset?parseFloat(opt.dataset.cost||vals.ship_cost||0):vals.ship_cost;if(vals._renderEditItems)vals._renderEditItems();});

  var body=el('div',{},[
    // â”€â”€ Row 1: Status + Payment â”€â”€
    el('div',{cls:'hdetail-grid',style:{marginBottom:'12px'}},[
      el('div',{},[
        el('p',{cls:'hform-section'},['Order Status & Payment']),
        el('label',{cls:'hlbl'},['Status']),
        statusSelEl,
        el('div',{style:{marginTop:'10px'}},[
          el('label',{cls:'hlbl'},['Payment Method']),
          paySelEl,
        ]),
      ]),
      el('div',{},[
        el('p',{cls:'hform-section'},['Items on Order']),
        (function(){
          // Mutable items list â€” tracks edits before saving
          var editItems=(o.items||[]).map(function(i){
            return {id:i.product_id||0, variation_id:i.variation_id||0,
                    name:i.name, qty:i.qty, price:i.price, line_total:i.total};
          });

          var itemsWrap=D.createElement('div');

          function renderItems(){
            itemsWrap.innerHTML='';
            if(!editItems.length){
              var empty=D.createElement('div');
              empty.style.cssText='padding:12px;text-align:center;color:#9ca3af;font-size:12px;';
              empty.textContent='No items on this order.';
              itemsWrap.appendChild(empty);
            } else editItems.forEach(function(item,idx){
              var row=D.createElement('div');
              row.style.cssText='display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid #f0f0f0;';

              var nameEl=D.createElement('div');
              nameEl.style.cssText='flex:1;font-size:12px;font-weight:500;color:#111;';
              nameEl.textContent=item.name;

              var priceEl=D.createElement('div');
              priceEl.style.cssText='font-size:11px;color:#6b7280;min-width:60px;text-align:right;';
              priceEl.textContent=fmt(item.price*item.qty);

              // Qty controls
              var qtyWrap=D.createElement('div');
              qtyWrap.style.cssText='display:flex;align-items:center;gap:4px;';

              var minusBtn=D.createElement('button');
              minusBtn.textContent='âˆ’';
              minusBtn.style.cssText='width:24px;height:24px;border-radius:6px;border:1.5px solid #e2e8f0;background:#f8fafc;cursor:pointer;font-size:14px;font-weight:600;display:flex;align-items:center;justify-content:center;';
              minusBtn.onclick=function(){
                if(item.qty>1){item.qty--;item.line_total=item.price*item.qty;vals._itemsModified=true;renderItems();}
              };

              var qtyNum=D.createElement('span');
              qtyNum.style.cssText='font-size:12px;font-weight:700;min-width:20px;text-align:center;';
              qtyNum.textContent=String(item.qty);

              var plusBtn=D.createElement('button');
              plusBtn.textContent='+';
              plusBtn.style.cssText=minusBtn.style.cssText;
              plusBtn.onclick=function(){item.qty++;item.line_total=item.price*item.qty;vals._itemsModified=true;renderItems();};

              qtyWrap.appendChild(minusBtn);
              qtyWrap.appendChild(qtyNum);
              qtyWrap.appendChild(plusBtn);

              // Remove button
              var removeBtn=D.createElement('button');
              removeBtn.textContent='âœ•';
              removeBtn.style.cssText='width:22px;height:22px;border-radius:4px;border:none;background:transparent;color:#dc2626;cursor:pointer;font-size:13px;font-weight:700;';
              removeBtn.onclick=function(){editItems.splice(idx,1);vals._itemsModified=true;renderItems();};

              row.appendChild(nameEl);
              row.appendChild(priceEl);
              row.appendChild(qtyWrap);
              row.appendChild(removeBtn);
              itemsWrap.appendChild(row);
            });

            // Running totals update immediately as items, quantities or delivery change.
            var itemTotal=editItems.reduce(function(s,i){return s+i.price*i.qty;},0);
            var vat=itemTotal*15/115;
            var delivery=parseFloat(vals.ship_cost||0)||0;
            var grand=itemTotal+delivery;
            var totalsBox=D.createElement('div');
            totalsBox.className='hedit-totals';
            totalsBox.appendChild(trow('Subtotal',fmt(itemTotal)));
            totalsBox.appendChild(trow('VAT (15% incl.)',fmt(vat)));
            if(delivery>0)totalsBox.appendChild(trow('Delivery',fmt(delivery)));
            totalsBox.appendChild(el('div',{cls:'htotal-grand',style:{marginTop:'6px'}},[el('span',{},'TOTAL'),el('span',{cls:'htotal-amt'},[fmt(grand)])]));
            itemsWrap.appendChild(totalsBox);
          }
          renderItems();

          // â”€â”€ Add product search â”€â”€
          var addSection=D.createElement('div');
          addSection.style.cssText='margin-top:10px;';

          var addLabel=D.createElement('div');
          addLabel.style.cssText='font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#6b7280;margin-bottom:5px;';
          addLabel.textContent='Add Products';

          var srchInp=D.createElement('input');
          srchInp.className='hinp';
          srchInp.placeholder='Search products to add...';
          srchInp.style.cssText='width:100%;';

          var srchResults=D.createElement('div');
          srchResults.style.cssText='max-height:140px;overflow-y:auto;border:1px solid #e2e8f0;border-radius:8px;background:#fff;margin-top:4px;display:none;';

          var srchTimer=null;
          srchInp.addEventListener('keydown',function(e){e.stopPropagation();});
          srchInp.addEventListener('input',function(){
            clearTimeout(srchTimer);
            var q=this.value.trim().toLowerCase();
            if(!q){srchResults.style.display='none';srchResults.innerHTML='';return;}
            srchTimer=setTimeout(function(){
              var matches=S.products.filter(function(p){
                return p.name.toLowerCase().includes(q)||(p.sku||'').toLowerCase().includes(q);
              }).slice(0,8);
              srchResults.innerHTML='';
              if(!matches.length){
                var none=D.createElement('div');
                none.style.cssText='padding:10px;font-size:12px;color:#9ca3af;text-align:center;';
                none.textContent='No products found';
                srchResults.appendChild(none);
              } else {
                matches.forEach(function(p){
                  // For variable products show each variation
                  var entries=[];
                  if(p.type==='variable'&&p.variations&&p.variations.length){
                    p.variations.forEach(function(v){
                      var vLabel=Object.values(v.attributes||{}).join(' / ');
                      entries.push({id:p.id,variation_id:v.id,name:p.name+(vLabel?' â€“ '+vLabel:''),price:v.price});
                    });
                  } else {
                    entries.push({id:p.id,variation_id:0,name:p.name,price:p.price});
                  }
                  entries.forEach(function(entry){
                    var row=D.createElement('div');
                    row.style.cssText='display:flex;align-items:center;justify-content:space-between;padding:8px 12px;cursor:pointer;border-bottom:1px solid #f5f5f5;font-size:12px;';
                    row.onmouseenter=function(){this.style.background='#f0fdf4';};
                    row.onmouseleave=function(){this.style.background='';};
                    var nm=D.createElement('span'); nm.textContent=entry.name;
                    var pr=D.createElement('span');
                    pr.style.cssText='color:#6b7280;font-weight:600;margin-left:8px;white-space:nowrap;';
                    pr.textContent=fmt(entry.price);
                    row.appendChild(nm); row.appendChild(pr);
                    row.onclick=function(){
                      var existing=editItems.find(function(i){
                        return i.id===entry.id&&i.variation_id===entry.variation_id;
                      });
                      if(existing){existing.qty++;existing.line_total=existing.price*existing.qty;}
                      else{editItems.push({id:entry.id,variation_id:entry.variation_id,
                        name:entry.name,qty:1,price:entry.price,line_total:entry.price});}
                      vals._itemsModified=true;
                      srchInp.value='';
                      srchResults.style.display='none';
                      srchResults.innerHTML='';
                      renderItems();
                    };
                    srchResults.appendChild(row);
                  });
                });
              }
              srchResults.style.display='block';
            },200);
          });

          addSection.appendChild(addLabel);
          addSection.appendChild(srchInp);
          addSection.appendChild(srchResults);

          // Store editItems reference AND a flag that's only set true when user makes changes
          vals._editItems=editItems;
          vals._renderEditItems=renderItems;
          vals._itemsModified=false; // only true if user adds/removes/changes qty

          var wrap=D.createElement('div');
          wrap.appendChild(itemsWrap);
          wrap.appendChild(addSection);
          return wrap;
        })(),
      ]),
    ]),

    // â”€â”€ Row 2: Customer details â”€â”€
    el('p',{cls:'hform-section'},['Customer Details']),
    el('div',{cls:'hdetail-grid',style:{marginBottom:'12px'}},[
      el('div',{},[
        frow([inp('First Name','first_name'),inp('Last Name','last_name')]),
        inp('Mobile Number','phone','tel'),
      ]),
      el('div',{},[
        inp('Address Line 1','address_1'),
        inp('Address Line 2','address_2'),
        frow([inp('City','city'),inp('Postcode','postcode')]),
      ]),
    ]),

    // â”€â”€ Row 3: Shipping method + Coupon + Note â”€â”€
    el('p',{cls:'hform-section'},['Shipping, Coupon & Notes']),
    el('div',{cls:'hdetail-grid',style:{marginBottom:'14px'}},[
      el('div',{},[
        el('label',{cls:'hlbl'},['Shipping Method']),
        shipSelEl,
        el('div',{style:{marginTop:'10px'}},[
          inp('Coupon Code (optional)','coupon'),
        ]),
      ]),
      el('div',{},[
        el('label',{cls:'hlbl'},['Internal Note (optional)']),
        (function(){
          var ta=D.createElement('textarea');
          ta.className='hinp'; ta.rows=4;
          ta.style.cssText='width:100%;resize:vertical;font-family:inherit;';
          ta.placeholder='Add a note to this orderâ€¦';
          ta.addEventListener('input',function(){vals.note=this.value;});
          ta.addEventListener('keydown',function(e){e.stopPropagation();});
          return ta;
        })(),
      ]),
    ]),

    // â”€â”€ Actions â”€â”€
    el('div',{style:{display:'flex',gap:'8px',flexWrap:'wrap'}},[
      el('button',{cls:'hbtn hbtn-primary',onClick:function(){saveOrderEdits(o,vals);}},['Save All Changes']),
      el('button',{cls:'hbtn',onClick:closeModal},['Cancel']),
    ]),
  ]);
  openModal('Edit Order #'+o.number,body,'lg');
}

function saveOrderEdits(o,vals){
  var payload={
    status:               vals.status,
    payment_method:       vals.payment_method,
    payment_method_title: vals.payment_method_title,
    billing_address:{
      first_name: vals.first_name,
      last_name:  vals.last_name,
      phone:      vals.phone||'Walk-in-Customer',
      address_1:  vals.address_1,
      address_2:  vals.address_2,
      city:       vals.city,
      state:      vals.state,
      postcode:   vals.postcode,
      country:    'NA',
    },
  };
  if(vals.ship_title){ payload.shipping_title=vals.ship_title; payload.shipping_cost=parseFloat(vals.ship_cost||0)||0; }
  if(vals.coupon)       payload.coupon_code=vals.coupon;
  if(vals.note)         payload.note=vals.note;
  // Always send the edited lines so WooCommerce totals are rebuilt from current values.
  if(vals._editItems){
    payload.items=vals._editItems.map(function(i){
      return {id:i.variation_id||i.id, product_id:i.id, variation_id:i.variation_id||0,
              qty:i.qty, price:i.price, name:i.name};
    });
  }

  api('/orders/'+o.id,{method:'PUT',body:JSON.stringify(payload)}).then(function(r){
    if(r.success){
      o.status=vals.status;
      o.payment_method=vals.payment_method;
      o.payment_title=vals.payment_method_title;
      if(!o.billing) o.billing={};
      o.billing.first_name=vals.first_name;
      o.billing.last_name=vals.last_name;
      o.billing.phone=vals.phone||'Walk-in-Customer';
      o.billing.address_1=vals.address_1;
      o.billing.city=vals.city;
      // Update local items from edit
      if(vals._editItems){
        o.items=vals._editItems.map(function(i){
          return {name:i.name,qty:i.qty,price:i.price,total:i.price*i.qty,
                  product_id:i.id,variation_id:i.variation_id};
        });
        if(r.total) o.total=r.total;
      }
      closeModal();
      toast('Order #'+o.number+' saved','ok');
      var tbody=D.getElementById('horders-tbody');
      if(tbody)renderOrdersRows(tbody,S.ordQ,S.ordPayF);
    } else {toast(r.error||'Save failed','err');}
  }).catch(function(e){toast('Error: '+e.message,'err');});
}
function printInvoice(o){
  var b=o.billing||{};
  var sh=o.shipping_address||b;
  var dateStr=fdateOnly(o.date);
  var logoUrl=CFG.logo_url||'';
  var pmLabel=(o.payment_title||o.payment_method||'').toUpperCase();

  function addrLines(a){
    var out=[];
    var nm=((a.first_name||'')+' '+(a.last_name||'')).trim();
    if(nm)out.push(nm);
    if(a.company)out.push(a.company);
    if(a.address_1)out.push(a.address_1);
    if(a.address_2)out.push(a.address_2);
    if(a.city)out.push(a.city);
    if(a.state)out.push(a.state);
    if(a.postcode)out.push(a.postcode);
    if(a.phone)out.push(a.phone);
    if(a.email&&a.email.indexOf('pos.local')===-1)out.push(a.email);
    return out.map(function(l){return esc(l);}).join('<br>');
  }

  var itemSubtotal=0;
  var totalQty=0;
  (o.items||[]).forEach(function(i){itemSubtotal+=parseFloat(i.total)||0;totalQty+=parseInt(i.qty)||0;});

  var css=[
    '*{box-sizing:border-box;margin:0;padding:0;}',
    'body{font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#111;background:#fff;padding:50px 60px;line-height:1.5;}',
    '.page{max-width:680px;margin:0 auto;}',
    '.hdr{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;}',
    '.logo{max-height:80px;max-width:200px;display:block;margin-bottom:4px;}',
    '.logo-txt{font-size:16px;font-weight:700;letter-spacing:1px;text-transform:uppercase;}',
    '.logo-dec{font-size:9px;color:#888;letter-spacing:3px;}',
    '.inv-ttl{font-size:20px;font-weight:700;letter-spacing:3px;text-transform:uppercase;}',
    '.rule{border:none;border-top:1.5px solid #111;margin:14px 0;}',
    '.rule-light{border:none;border-top:1px solid #ccc;margin:10px 0;}',
    '.addrs{display:flex;gap:0;margin:18px 0 20px;}',
    '.addr{flex:1;padding-right:20px;}',
    '.addr-lbl{font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;}',
    '.addr-val{font-size:11px;font-style:italic;line-height:1.75;color:#333;}',
    '.meta{width:100%;border-collapse:collapse;margin:14px 0;}',
    '.meta td{padding:7px 4px;border-bottom:1px solid #ddd;font-size:11.5px;}',
    '.meta td:first-child{font-weight:700;width:160px;}',
    'table.items{width:100%;border-collapse:collapse;margin-top:4px;}',
    'table.items th{font-size:11px;font-weight:700;text-align:left;padding:8px 8px 8px 0;border-bottom:1.5px solid #111;}',
    'table.items th.r,table.items td.r{text-align:right;}',
    'table.items td{font-size:11px;padding:9px 8px 9px 0;border-bottom:1px solid #e0e0e0;vertical-align:top;}',
    'table.items .var{font-size:10px;color:#555;font-style:italic;}',
    'table.items .sku{font-size:10px;color:#888;}',
    'table.items tfoot td{padding-top:10px;font-weight:700;border-top:1.5px solid #111;border-bottom:none;}',
    'table.items tfoot tr.ship td{font-weight:400;border-top:none;}',
    'table.items tfoot tr.grand td{font-size:13px;border-top:1.5px solid #111;padding-top:8px;}',
    'table.items tfoot tr.grand .vat{font-size:10px;font-weight:400;color:#666;}',
    '.footer{margin-top:36px;text-align:center;font-size:10.5px;color:#555;border-top:1px solid #ccc;padding-top:16px;line-height:1.8;}',
    '@media print{body{padding:20px 30px;}}'
  ].join('\n');

  var html='<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Tax Invoice '+o.number+'</title><style>'+css+'</style></head><body><div class="page">';

  // Header
  html+='<div class="hdr">';
  if(logoUrl){
    html+='<div><img class="logo" src="'+esc(logoUrl)+'" alt="logo"></div>';
  } else {
    html+='<div><div class="logo-txt">'+esc(CFG.store_name||'HAMBELELA ORGANIC')+'</div>';
    html+='<div class="logo-dec">âœ¦ NATURAL &amp; ORGANIC âœ¦</div></div>';
  }
  html+='<div class="inv-ttl">Tax Invoice</div></div>';

  html+='<hr class="rule">';

  // Address columns
  html+='<div class="addrs">';
  html+='<div class="addr"><div class="addr-lbl">Billing Address</div><div class="addr-val">'+addrLines(b)+'</div></div>';
  html+='<div class="addr"><div class="addr-lbl">Shipping Address</div><div class="addr-val">'+addrLines(sh)+'</div></div>';
  html+='</div>';

  html+='<hr class="rule">';

  // Meta info
  html+='<table class="meta">';
  html+='<tr><td>Order Number</td><td>'+esc(String(o.number))+'</td></tr>';
  html+='<tr><td>Order Date</td><td>'+esc(dateStr)+'</td></tr>';
  html+='<tr><td>Payment Method</td><td>'+esc(pmLabel)+'</td></tr>';
  if(CFG.vat_number)html+='<tr><td>VAT Number</td><td>'+esc(CFG.vat_number)+'</td></tr>';
  html+='</table>';

  html+='<hr class="rule-light">';

  // Line items
  html+='<table class="items"><thead><tr>';
  html+='<th style="width:42%">Product</th><th>Price</th><th>Quantity</th><th class="r">Total</th>';
  html+='</tr></thead><tbody>';
  (o.items||[]).forEach(function(i){
    html+='<tr><td>'+esc(i.name);
    if(i.name.indexOf('grams')>-1||i.name.indexOf('ml')>-1){/* already in name */}
    html+='<br><span class="sku">SKU: '+(i.sku||'â€”')+'</span></td>';
    html+='<td>'+fmt(i.price)+'</td>';
    html+='<td>'+i.qty+'</td>';
    html+='<td class="r">'+fmt(i.total)+'</td>';
    html+='</tr>';
  });
  html+='</tbody>';
  html+='<tfoot>';
  // Subtotal
  html+='<tr><td colspan="3">Subtotal</td><td class="r">'+fmt(itemSubtotal)+'</td></tr>';
  // Shipping
  if(o.shipping_total>0){
    var shipTitle=(o.shipping&&o.shipping[0]&&o.shipping[0].title)||'Shipping';
    html+='<tr class="ship"><td colspan="3">Shipping</td><td class="r">'+fmt(o.shipping_total)+' via '+esc(shipTitle)+'</td></tr>';
  }
  // Discount
  if(o.discount_total>0){
    html+='<tr class="ship"><td colspan="3">Discount</td><td class="r">âˆ’'+fmt(o.discount_total)+'</td></tr>';
  }
  // Grand total
  html+='<tr class="grand"><td colspan="2">Total</td><td>'+totalQty+'</td>';
  html+='<td class="r">'+fmt(o.total)+'<br><span class="vat">(includes '+fmt(o.total_tax)+' VAT)</span></td></tr>';
  html+='</tfoot></table>';

  // Footer
  var footerText=CFG.receipt_footer||'Thank you for your business!';
  html+='<div class="footer">';
  html+=esc(footerText.toUpperCase())+'<br>';
  if(CFG.store_phone)html+='Tel: '+esc(CFG.store_phone)+'<br>';
  if(CFG.store_email&&CFG.store_email.indexOf('pos.local')===-1)html+='email: '+esc(CFG.store_email)+'<br>';
  if(CFG.store_address)html+=esc(CFG.store_address);
  html+='</div>';

  html+='</div></body></html>';

  var w=window.open('','_blank','width=820,height=960');
  if(!w){toast('Popup blocked â€” please allow popups for this site','err');return;}
  w.document.open();w.document.write(html);w.document.close();
  setTimeout(function(){w.print();},500);
}

// â”€â”€ REPRINT RECEIPT FROM WC ORDER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Converts a WooCommerce order object (from orders page) into the
// same receipt format used by the POS, then calls printReceipt.
function reprintReceipt(o){
  var b=o.billing||{};
  var pm=PAYS.find(function(m){return m.id===o.payment_method;})||{label:o.payment_title||o.payment_method||'â€”'};
  var sc=o.shipping_total||0;

  // Reconstruct cart from WC line items
  // WC stores ex-VAT totals; convert back to incl for display
  var cart=(o.items||[]).map(function(i){
    // i.price from fmt_order is get_item_total (ex-VAT per unit)
    // add VAT back for display: price_incl = ex * 1.15
    var unitIncl=Math.round(i.price*1.15*100)/100;
    return {
      name:i.name,
      varLabel:'',
      price:unitIncl,
      qty:i.qty,
      img:'',
      productId:i.product_id,
    };
  });

  // Reconstruct totals from WC order data
  var sub=cart.reduce(function(s,i){return s+i.price*i.qty;},0);
  var tax=o.total_tax||0;
  var da=o.discount_total>0?Math.round(o.discount_total*1.15*100)/100:0; // incl-VAT discount
  var total=o.total;

  // Ship method object for receipt display
  var shipMethod=null;
  if(sc>0&&o.shipping&&o.shipping.length){
    shipMethod={title:o.shipping[0].title,cost:sc};
  } else if(sc>0){
    shipMethod={title:'Delivery',cost:sc};
  }

  var receiptObj={
    cart:cart,
    sub:sub,
    tax:tax,
    da:da,
    sc:sc,
    total:total,
    payMethod:o.payment_method||'cash',
    customer:b.first_name?{name:(b.first_name+' '+b.last_name).trim(),email:b.email,phone:b.phone}:null,
    billing:b,
    shipMethod:shipMethod,
    orderNum:'#'+o.number,
    invoiceNum:o.number,
    time:o.date?new Date(o.date):new Date(),
    note:o.note||'',
    cashier:o.cashier||CASHIER,
  };

  printReceipt(receiptObj, {}, S.printWidth||'80mm');
}

// â”€â”€ INVENTORY â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function invPage(){
  if(S.loadI)return el('div',{cls:'hloading'},['â³ Loading...']);
  var items=S.inv.filter(function(i){var q=S.invQ.toLowerCase();return !q||i.name.toLowerCase().includes(q)||(i.sku||'').toLowerCase().includes(q);});
  var tq=0,low=0;
  items.forEach(function(i){tq+=i.stock_qty||0;if(i.stock_qty>0&&i.stock_qty<=5)low++;});

  var tabBar=el('div',{cls:'htabs',style:{padding:'0 20px',borderBottom:'1.5px solid var(--bd)'}},[
    el('button',{cls:'htab'+(S.invTab==='stock'?' active':''),onClick:function(){S.invTab='stock';redraw();}},['ðŸ“¦ Stock']),
    el('button',{cls:'htab'+(S.invTab==='log'?' active':''),onClick:function(){
      S.invTab='log';
      if(!S.invLogData.length&&!S.loadInvLog){
        S.loadInvLog=true;
        api('/inventory-log').then(function(d){S.invLogData=Array.isArray(d)?d:[];S.loadInvLog=false;redraw();}).catch(function(){S.loadInvLog=false;redraw();});
      }
      redraw();
    }},['ðŸ“‹ Change Log']),
  ]);

  if(S.invTab==='log'){
    var logContent;
    if(S.loadInvLog){
      logContent=el('div',{cls:'hloading'},[el('div',{cls:'hspinner'},[]),' Loading...']);
    } else if(!S.invLogData.length){
      logContent=el('div',{cls:'hempty2'},['No inventory changes recorded yet. Changes are logged when you manually adjust stock.']);
    } else {
      logContent=el('div',{cls:'htable-wrap'},[
        el('table',{cls:'htbl'},[
          el('thead',{},[el('tr',{},[th('Date'),th('Product'),th('Old Qty'),th('New Qty'),th('Change'),th('By'),th('Notes')])]),
          el('tbody',{},S.invLogData.map(function(row){
            var change=(parseInt(row.new_qty)||0)-(parseInt(row.old_qty)||0);
            return el('tr',{},[
              td(fdt(row.created_at)),
              td(row.product_name||'â€”'),
              td(String(row.old_qty||0)),
              td(String(row.new_qty||0)),
              td(el('span',{style:{color:change>=0?'#16a34a':'#dc2626',fontWeight:'700'}},[change>=0?'+'+change:String(change)])),
              td(row.cashier_name||'â€”'),
              td(row.notes||'â€”'),
            ]);
          })),
        ]),
      ]);
    }
    return el('div',{cls:'hpage',style:{overflow:'hidden',display:'flex',flexDirection:'column'}},[
      el('div',{cls:'hpage-head'},[el('h2',{cls:'hpage-title'},['Inventory'])]),
      tabBar,
      el('div',{style:{flex:'1',overflowY:'auto',padding:'14px 20px'}},[logContent]),
    ]);
  }

  return el('div',{cls:'hpage'},[
    el('div',{cls:'hpage-head'},[
      el('h2',{cls:'hpage-title'},['Inventory']),
      el('div',{cls:'hpage-acts'},[
        el('button',{cls:'hbtn',onClick:function(){S.inv=[];fetchInv();}},['â†» Sync WooCommerce']),
      ]),
    ]),
    tabBar,
    // Staff-visible summary â€” units and low stock only, no financial values
    el('div',{cls:'hsumcards'},[
      scard('Total SKUs',String(items.length),'products tracked'),
      scard('Total Units',tq.toLocaleString(),'in stock'),
      scard('Low Stock',String(low),'â‰¤5 units',low>0?'warn':''),
    ]),
    low>0?el('div',{style:{margin:'8px 20px 0',padding:'10px 14px',background:'#fffbeb',border:'1.5px solid #f59e0b',borderRadius:'8px',fontSize:'12px',color:'#92400e',fontWeight:'600'}},['âš  '+low+' product(s) are low on stock (5 or fewer units remaining). Check and restock soon.']):null,
    el('div',{cls:'hinv-srch'},[
      (function(){
        var inp=el('input',{cls:'hinp',type:'text',placeholder:'ðŸ” Search products...',value:S.invQ});
        inp.addEventListener('keydown',function(e){e.stopPropagation();});
        inp.addEventListener('input',function(){
          S.invQ=this.value;
          // Update the table body in-place â€” do NOT call redraw() which destroys this input
          var tbody=D.getElementById('hinv-tbody');
          if(tbody){
            var q=S.invQ.toLowerCase();
            var filtered=S.inv.filter(function(i){return !q||i.name.toLowerCase().includes(q)||(i.sku||'').toLowerCase().includes(q);});
            tbody.innerHTML='';
            filtered.forEach(function(i){tbody.appendChild(buildInvRow(i));});
          }
        });
        return inp;
      })(),
    ]),
    el('div',{cls:'htable-wrap'},[
      el('table',{cls:'htbl'},[
        el('thead',{},[el('tr',{},[th('Product'),th('Variant'),th('SKU'),th('Price'),th('Qty'),th('Status'),th('Set Qty')])]),
        el('tbody',{id:'hinv-tbody'},items.map(buildInvRow)),
      ]),
    ]),
  ]);
}

function buildInvRow(i){
  var qi=el('input',{type:'number',cls:'hqinp',value:String(i.stock_qty||0)});
  var ni=el('input',{type:'text',cls:'hqinp',style:{width:'80px',marginLeft:'4px'},placeholder:'Note...'});
  qi.addEventListener('keydown',function(e){e.stopPropagation();});
  ni.addEventListener('keydown',function(e){e.stopPropagation();});
  qi.addEventListener('blur',function(e){
    var nq=parseInt(e.target.value,10);
    if(!isNaN(nq)&&nq!==i.stock_qty){
      api('/inventory/'+i.id,{method:'PUT',body:JSON.stringify({qty:nq,notes:ni.value||''})}).then(function(){
        i.stock_qty=nq;i.stock_value=(i.cost||0)*nq;i.retail_value=(i.price||0)*nq;
        S.invLogData=[];
        toast('Stock updated','ok');
      }).catch(function(e){toast(e.message,'err');});
    }
  });
  return el('tr',{},[
    td(i.name),
    td(i.attributes||'â€”'),
    td(el('code',{style:{fontSize:'11px'}},[i.sku||'â€”'])),
    td(fmt(i.price)),
    td(el('b',{},[i.stock_qty==null?'âˆž':String(i.stock_qty)])),
    td(i.stock_qty==null?badge('grey','â€”'):i.stock_qty<=0?badge('red','Out'):i.stock_qty<=5?badge('yellow','Low'):badge('green','OK')),
    el('td',{style:{display:'flex',gap:'4px',alignItems:'center'}},[qi,ni]),
  ]);
}

// â”€â”€ REPORTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
var SENSITIVE_TABS=['inventory','vat','delivery','profit','monthly'];
function isSensitive(tab){return SENSITIVE_TABS.indexOf(tab)!==-1;}

function repPinGate(onSuccess){
  // Show PIN entry modal for sensitive reports
  var pinVal='';
  var dots=el('div',{style:{display:'flex',gap:'10px',justifyContent:'center',margin:'18px 0'}});
  function renderDots(){dots.innerHTML='';for(var i=0;i<4;i++){var d=D.createElement('div');d.style.cssText='width:14px;height:14px;border-radius:50%;border:2px solid #6b7280;background:'+(i<pinVal.length?'#1a1a2e':'transparent');dots.appendChild(d);}}
  renderDots();
  var errMsg=el('div',{style:{color:'#dc2626',fontSize:'12px',textAlign:'center',minHeight:'18px'}});
  var numpad=el('div',{style:{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px',maxWidth:'220px',margin:'0 auto'}});
  function addDigit(d){if(pinVal.length>=4)return;pinVal+=d;renderDots();if(pinVal.length===4)check();}
  function check(){
    var stored=CFG.reports_pin||'';
    if(!stored){
      // No reports PIN configured â€” prompt to set one in Settings
      closeModal();
      toast('No Reports PIN set. Please add one in Settings â†’ Reports PIN.','err');
      return;
    }
    if(pinVal===stored){S.repPinAuth=true;closeModal();onSuccess();}
    else{errMsg.textContent='Incorrect PIN';pinVal='';renderDots();setTimeout(function(){errMsg.textContent='';},2000);}
  }
  [1,2,3,4,5,6,7,8,9,'',0,'âŒ«'].forEach(function(k){
    var btn=D.createElement('button');
    btn.style.cssText='padding:14px;border:1px solid #e2e8f0;border-radius:8px;font-size:16px;font-weight:600;background:#fff;cursor:pointer;';
    btn.textContent=String(k);
    if(k==='')btn.style.visibility='hidden';
    if(k==='âŒ«'){btn.onclick=function(){pinVal=pinVal.slice(0,-1);renderDots();};}
    else if(k!=='')btn.onclick=function(){addDigit(this.textContent);};
    numpad.appendChild(btn);
  });
  var body=el('div',{},[
    el('p',{style:{textAlign:'center',color:'#6b7280',fontSize:'13px',marginBottom:'8px'}},['This section contains confidential information. Enter your 4-digit PIN to continue.']),
    dots,errMsg,numpad,
  ]);
  openModal('ðŸ”’ Restricted Access',body,'sm');
}

function reportsPage(){
  if(S.loadR)return el('div',{cls:'hloading'},[el('div',{cls:'hspinner'},[]),' Loading reports...']);
  if(!S.reports&&!S.loadR){fetchReports('today');return el('div',{cls:'hloading'},[el('div',{cls:'hspinner'},[]),' Loading...']);}

  // Period controls (hidden on non-period tabs)
  var periodTabs=['summary','products','refunds','delivery','vat','profit','monthly'];
  var showPeriod=periodTabs.indexOf(S.repTab)!==-1;

  return el('div',{cls:'hpage',style:{overflow:'hidden',display:'flex',flexDirection:'column'}},[
    el('div',{cls:'hpage-head'},[
      el('h2',{cls:'hpage-title'},['Reports & Analytics']),
      showPeriod?el('div',{cls:'hpage-acts'},
        ['today','week','month','year'].map(function(p){
          return el('button',{cls:'hbtn'+(S.rpP===p&&!S.rpFrom?' hbtn-primary':''),onClick:function(){S.rpFrom='';S.rpTo='';fetchReports(p);}},
            [p.charAt(0).toUpperCase()+p.slice(1)]);
        }).concat([
          el('input',{type:'date',cls:'hinp',style:{width:'130px'},value:S.rpFrom,onChange:function(e){S.rpFrom=e.target.value;}}),
          el('input',{type:'date',cls:'hinp',style:{width:'130px'},value:S.rpTo,onChange:function(e){S.rpTo=e.target.value;}}),
          el('button',{cls:'hbtn hbtn-primary',onClick:function(){fetchReports(S.rpP);}},['Apply']),
        ])
      ):null,
    ]),
    // Report tabs
    el('div',{cls:'htabs',style:{padding:'0 20px',borderBottom:'1.5px solid var(--bd)'}},[
      el('button',{cls:'htab'+(S.repTab==='summary'?' active':''),onClick:function(){S.repTab='summary';redraw();}},['ðŸ“Š Summary']),
      el('button',{cls:'htab'+(S.repTab==='products'?' active':''),onClick:function(){S.repTab='products';redraw();}},['ðŸ† Products']),
      el('button',{cls:'htab'+(S.repTab==='refunds'?' active':''),onClick:function(){S.repTab='refunds';redraw();}},['â†© Refunds']),
      el('button',{cls:'htab'+(S.repTab==='delivery'?' active':''),onClick:function(){
        if(!S.repPinAuth){repPinGate(function(){S.repTab='delivery';redraw();});}
        else{S.repTab='delivery';redraw();}
      }},['ðŸšš Delivery ðŸ”’']),
      el('button',{cls:'htab'+(S.repTab==='vat'?' active':''),onClick:function(){
        if(!S.repPinAuth){repPinGate(function(){S.repTab='vat';redraw();});}
        else{S.repTab='vat';redraw();}
      }},['ðŸ§¾ VAT ðŸ”’']),
      el('button',{cls:'htab'+(S.repTab==='profit'?' active':''),onClick:function(){
        if(!S.repPinAuth){repPinGate(function(){S.repTab='profit';redraw();});}
        else{S.repTab='profit';redraw();}
      }},['ðŸ’° Profit ðŸ”’']),
      el('button',{cls:'htab'+(S.repTab==='monthly'?' active':''),onClick:function(){
        if(!S.repPinAuth){repPinGate(function(){S.repTab='monthly';redraw();});}
        else{S.repTab='monthly';redraw();}
      }},['ðŸ“… Monthly ðŸ”’']),
      el('button',{cls:'htab'+(S.repTab==='inventory'?' active':''),onClick:function(){
        if(!S.repPinAuth){repPinGate(function(){S.repTab='inventory';if(!S.inv.length)fetchInv();redraw();});}
        else{S.repTab='inventory';if(!S.inv.length)fetchInv();redraw();}
      }},['ðŸ“¦ Inventory ðŸ”’']),
    ]),
    el('div',{style:{flex:'1',overflowY:'auto',padding:'16px 20px'}},[
      S.reports&&S.reports.error
        ?el('div',{cls:'hempty2'},['âš  Could not load: '+S.reports.error])
        :(!S.reports?el('div',{cls:'hempty2'},['Loading...']):
          S.repTab==='products'?buildProductsReport():
          S.repTab==='refunds'?buildRefundsReport():
          S.repTab==='delivery'?buildDeliveryReport():
          S.repTab==='vat'?buildVATReport():
          S.repTab==='profit'?buildProfitReport():
          S.repTab==='monthly'?buildMonthlyReport():
          S.repTab==='inventory'?buildInventoryReport():
          buildReports()),
      // Lock button for sensitive tabs
      isSensitive(S.repTab)&&S.repPinAuth?el('div',{style:{marginTop:'18px',borderTop:'1px solid #e5e7eb',paddingTop:'14px'}},[
        el('button',{cls:'hbtn',style:{color:'#dc2626',borderColor:'#dc2626'},onClick:function(){S.repPinAuth=false;S.repTab='summary';redraw();}},['ðŸ”’ Lock Sensitive Reports']),
      ]):null,
    ]),
  ]);
}
function buildReports(){
  var d=S.reports;
  if(!d)return el('div',{cls:'hempty2'},['No data yet.']);
  var t=d.totals||{count:0,sales:0,tax:0,discount:0};

  // Payment breakdown â€” total by method id using PAYS labels
  function methodTotal(ids){
    return (d.by_method||[]).filter(function(r){
      var m=(r.method||'').toLowerCase();
      return ids.some(function(id){return m===id||m.includes(id);});
    }).reduce(function(s,r){return s+(r.total||0);},0);
  }
  var cashTotal   = methodTotal(['cash']);
  var cardTotal   = methodTotal(['swipe','card','stripe','card/swipe']);
  var eftTotal    = methodTotal(['eft']);
  var netbankTotal= methodTotal(['netbank','netbank wallet']);
  var otherTotal  = (t.sales||0)-cashTotal-cardTotal-eftTotal-netbankTotal;

  // â”€â”€ PAYMENT DRILL-DOWN â”€â”€
  function drillDown(methodLabel){
    S.payDrill=(S.payDrill===methodLabel)?null:methodLabel; // toggle
    var el2=D.getElementById('hpay-drill');
    if(el2)el2.parentNode.replaceChild(buildPayDrill(),el2);
  }

  function buildPayDrill(){
    var wrap=D.createElement('div');
    wrap.id='hpay-drill';
    if(!S.payDrill){wrap.style.display='none';return wrap;}
    // Use payMatches so Card/Swipe, NetBank Wallet etc. all resolve correctly
    var orders=(S.orders||[]).filter(function(o){
      return payMatches(o, S.payDrill);
    });
    // Also filter from reports period if possible
    wrap.style.cssText='margin-top:12px;';
    var total=orders.reduce(function(s,o){return s+(parseFloat(o.total)||0);},0);
    wrap.appendChild(el('div',{cls:'hrep-card'},[
      el('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px'}},[
        el('h3',{cls:'hrep-title'},['ðŸ’³ '+S.payDrill+' Orders']),
        el('div',{style:{display:'flex',gap:'8px',alignItems:'center'}},[
          el('span',{style:{fontSize:'12px',color:'#6b7280'}},[(orders.length)+' orders Â· Total: '+fmt(total)]),
          el('button',{cls:'hbtn hbtn-sm',onClick:function(){
            S.ordPayF=S.payDrill;S.payDrill=null;go('orders');
          }},['ðŸ” Filter in Orders']),
          el('button',{cls:'hbtn hbtn-sm',onClick:function(){S.payDrill=null;var e2=D.getElementById('hpay-drill');if(e2)e2.style.display='none';}},['âœ• Close']),
        ]),
      ]),
      orders.length?el('table',{cls:'htbl'},[
        el('thead',{},[el('tr',{},[th('Order'),th('Customer'),th('Amount'),th('Date'),th('')])]),
        el('tbody',{},orders.slice(0,50).map(function(o){
          var b=o.billing||{};
          var name=(b.first_name?(b.first_name+' '+b.last_name).trim():'Walk-in customer');
          return el('tr',{},[
            td(el('strong',{},['#'+o.number])),
            td(name),
            td(el('strong',{},[fmt(o.total)])),
            td(fdateOnly(o.date)),
            td(el('button',{cls:'hbtn hbtn-sm',onClick:function(){showOrderDetail(o);}},['View'])),
          ]);
        })),
        el('tfoot',{},[el('tr',{style:{fontWeight:'700',background:'#f0fdf4'}},[
          td('TOTAL ('+orders.length+' orders)'),td(''),td(el('strong',{style:{color:'#16a34a'}},[fmt(total)])),td(''),td(''),
        ])]),
      ]):el('div',{style:{padding:'20px',textAlign:'center',color:'#9ca3af',fontSize:'13px'}},['No orders found for "'+S.payDrill+'" in loaded orders. Use "Filter in Orders" to search across all orders.']),
    ]));
    return wrap;
  }

  // Clickable payment card builder
  function pcard(label,total,method){
    var active=S.payDrill===method;
    var wrap=D.createElement('div');
    wrap.style.cssText='background:'+(active?'#f0fdf4':'#fff')+';border:1.5px solid '+(active?'#16a34a':'#e2e8f0')+';border-radius:10px;padding:14px 16px;cursor:pointer;transition:all .15s;';
    wrap.innerHTML='<div style="font-size:11px;font-weight:600;color:#6b7280;margin-bottom:6px;">'+label+'</div><div style="font-size:20px;font-weight:700;color:#111;">'+fmt(total)+'</div><div style="font-size:10px;color:'+(active?'#16a34a':'#9ca3af')+';">'+(active?'â–² Click to hide orders':'â–¼ Click to see orders')+'</div>';
    wrap.addEventListener('click',function(){drillDown(method);});
    return wrap;
  }

  return el('div',{},[
    // Row 1 â€” totals
    el('div',{cls:'hsumcards'},[
      scard('Total Sales',   fmt(t.sales||0),  (t.count||0)+' orders'),
      scard('Tax Collected', fmt(t.tax||0),    '15% VAT included'),
      scard('Discounts',     fmt(t.discount||0),''),
      scard('Avg Order',     fmt(t.count>0?(t.sales/t.count):0),'per transaction'),
    ]),
    // Row 2 â€” clickable payment cards (use PAYS method id as drill key)
    el('div',{style:{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'8px',marginTop:'8px'}},[
      pcard('ðŸ’µ Cash',         cashTotal,    'cash'),
      pcard('ðŸ’³ Card/Swipe',   cardTotal,    'swipe'),
      pcard('ðŸ¦ EFT',          eftTotal,     'eft'),
      pcard('ðŸ› NetBank Wallet',netbankTotal,'netbank'),
      (function(){var w=D.createElement('div');w.style.cssText='background:#fff;border:1.5px solid #e2e8f0;border-radius:10px;padding:12px 14px;';w.innerHTML='<div style="font-size:10px;font-weight:600;color:#6b7280;margin-bottom:5px;">â†© Refunds</div><div style="font-size:18px;font-weight:700;color:'+(t.refunds>0?'#dc2626':'#111')+';">'+fmt(t.refunds||0)+'</div>';return w;})(),
    ]),
    // Drill-down panel (shown when a payment card is clicked)
    buildPayDrill(),
    // Action bar + export
    el('div',{style:{padding:'10px 0 0',display:'flex',gap:'8px',alignItems:'center',flexWrap:'wrap'}},[
      el('button',{cls:'hbtn hbtn-primary',onClick:function(){showDailySummary();}},['ðŸ“‹ Daily Sales Summary']),
      exportBar(
        function(){var rows=(d.daily||[]).map(function(day){return[day.date,day.count||0,fmt(day.total||0)];});dlCSV('sales-summary-'+S.rpP+'.csv',['Date','Orders','Total'],rows);},
        function(){var rows=(d.daily||[]).map(function(day){return[day.date,day.count||0,day.total||0];});dlExcel('sales-summary-'+S.rpP+'.xls',['Date','Orders','Total'],rows);},
        function(){var rows=(d.daily||[]).map(function(day){return[day.date,day.count||0,fmt(day.total||0)];});dlPDF('Sales Summary â€” '+S.rpP,['Date','Orders','Total'],rows);}
      ),
    ]),
    (t.count===0)
      ?el('div',{style:{padding:'24px',textAlign:'center',color:'#9ca3af',fontSize:'13px'}},['No orders found for this period. Try a different date range.'])
      :el('div',{cls:'hrep-grid',style:{marginTop:'10px'}},[
          rpCard('By Payment Method', d.by_method||[],  ['Method','Orders','Total'],  function(r){return[r.method, r.count, fmt(r.total)];}),
          rpCard('By Cashier',        d.by_cashier||[], ['Cashier','Orders','Total'], function(r){return[r.cashier,r.count, fmt(r.total)];}),
          rpCard('By Status',         d.by_status||[],  ['Status','Orders','Total'],  function(r){return[r.status, r.count, fmt(r.total)];}),
          el('div',{cls:'hrep-card'},[
            el('h3',{cls:'hrep-title'},['Daily Sales (last 14 days)']),
            el('div',{cls:'hbarchart'},barChart(d.daily||[])),
          ]),
        ]),
  ]);
}

function buildProductsReport(){
  var d=S.reports;
  var prods=d.top_products||[];
  if(!prods.length)return el('div',{style:{padding:'30px',textAlign:'center',color:'#9ca3af',fontSize:'13px'}},['No product sales data for this period.']);
  var prodHeaders=['#','Product','Units Sold','Revenue'];
  var prodRows=prods.map(function(p,i){return[i+1,p.name,p.qty||0,fmt(p.total)];});
  return el('div',{},[
    el('div',{cls:'hsumcards'},[
      scard('Products Sold', String(prods.length), 'unique SKUs'),
      scard('Top Product', prods[0]?prods[0].name.substring(0,20)+'â€¦':'â€”', prods[0]?fmt(prods[0].total):''),
      scard('Total Units', String(prods.reduce(function(s,p){return s+(p.qty||0);},0)), ''),
      scard('Avg Revenue', fmt(prods.length>0?prods.reduce(function(s,p){return s+(p.total||0);},0)/prods.length:0), 'per product'),
    ]),
    exportBar(
      function(){dlCSV('products-'+S.rpP+'.csv',prodHeaders,prodRows);},
      function(){dlExcel('products-'+S.rpP+'.xls',prodHeaders,prods.map(function(p,i){return[i+1,p.name,p.qty||0,p.total||0];}));},
      function(){dlPDF('Product Sales â€” '+S.rpP,prodHeaders,prodRows);}
    ),
    el('div',{style:{padding:'14px 20px'}},[
      el('div',{cls:'hrep-card'},[
        el('h3',{cls:'hrep-title'},['Revenue per Product']),
        el('table',{cls:'htbl'},[
          el('thead',{},[el('tr',{},[th('#'),th('Product'),th('Units Sold'),th('Revenue'),th('% of Total')])]),
          el('tbody',{},(function(){
            var totalRev=prods.reduce(function(s,p){return s+(p.total||0);},0);
            return prods.map(function(p,idx){
              var pct=totalRev>0?((p.total/totalRev)*100).toFixed(1):'0';
              return el('tr',{},[
                td(String(idx+1)),
                td(p.name),
                td(String(p.qty||0)),
                td(el('strong',{},[fmt(p.total)])),
                td(el('div',{style:{display:'flex',alignItems:'center',gap:'7px'}},[
                  el('div',{style:{flex:'1',background:'#e5e7eb',borderRadius:'4px',height:'6px',overflow:'hidden'}},[
                    el('div',{style:{width:pct+'%',background:'#4ade80',height:'100%',borderRadius:'4px'}},[]),
                  ]),
                  el('span',{style:{fontSize:'11px',color:'#6b7280',minWidth:'35px'}},[pct+'%']),
                ])),
              ]);
            });
          })()),
        ]),
      ]),
    ]),
  ]);
}

function buildRefundsReport(){
  var d=S.reports;
  var t=d.totals||{};
  var refundTotal=t.refunds||0;
  var netSales=(t.sales||0)-refundTotal;
  return el('div',{},[
    el('div',{cls:'hsumcards'},[
      scard('Gross Sales',  fmt(t.sales||0),  (t.count||0)+' orders'),
      scard('Refunds',      fmt(refundTotal), 'issued this period', refundTotal>0?'warn':''),
      scard('Net Sales',    fmt(netSales),    'after refunds'),
      scard('Refund Rate',  t.sales>0?((refundTotal/t.sales)*100).toFixed(1)+'%':'0%', ''),
    ]),
    el('div',{style:{padding:'14px 20px'}},[
      el('div',{cls:'hrep-card'},[
        el('h3',{cls:'hrep-title'},['Refund Details']),
        el('p',{style:{fontSize:'12px',color:'#6b7280',marginBottom:'10px'}},['Detailed refund records are available in the Refunds section. Total refunds for this period: '+fmt(refundTotal)+'.']),
        el('button',{cls:'hbtn hbtn-primary',onClick:function(){go('refunds');}},['â†© Go to Refunds']),
      ]),
    ]),
  ]);
}

// â”€â”€ EXPORT HELPERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function dlCSV(filename,headers,rows){
  var lines=[headers.join(',')].concat(rows.map(function(r){return r.map(function(c){return typeof c==='string'?'"'+c.replace(/"/g,'""')+'"':c;}).join(',');}));
  var a=D.createElement('a');a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(lines.join('\n'));a.download=filename;a.click();toast('CSV downloaded','ok');
}

function dlExcel(filename,headers,rows){
  // Simple Excel-compatible TSV wrapped in XML for proper .xls open
  var xml='<?xml version="1.0"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Report"><Table>';
  function row2xml(cells){return '<Row>'+cells.map(function(c){return '<Cell><Data ss:Type="'+(typeof c==='number'?'Number':'String')+'">'+String(c).replace(/&/g,'&amp;').replace(/</g,'&lt;')+'</Data></Cell>';}).join('')+'</Row>';}
  xml+=row2xml(headers)+rows.map(row2xml).join('')+'</Table></Worksheet></Workbook>';
  var a=D.createElement('a');a.href='data:application/vnd.ms-excel;charset=utf-8,'+encodeURIComponent(xml);a.download=filename;a.click();toast('Excel downloaded','ok');
}

function dlPDF(title,headers,rows){
  var w=window.open('','_blank','width=900,height=700');
  if(!w){toast('Allow popups to export PDF','err');return;}
  var trs=rows.map(function(r){return '<tr>'+r.map(function(c){return '<td>'+esc(String(c))+'</td>';}).join('')+'</tr>';}).join('');
  w.document.write('<!DOCTYPE html><html><head><title>'+esc(title)+'</title><style>body{font-family:Arial,sans-serif;padding:30px;font-size:12px}h2{margin-bottom:14px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:7px 10px;text-align:left}th{background:#f3f4f6;font-weight:700}tfoot td{font-weight:700;background:#f9fafb}@media print{button{display:none}}</style></head><body>');
  w.document.write('<h2>'+esc(title)+'</h2><p style="color:#666;font-size:11px">Generated: '+new Date().toLocaleString()+'</p>');
  w.document.write('<table><thead><tr>'+headers.map(function(h){return '<th>'+esc(h)+'</th>';}).join('')+'</tr></thead><tbody>'+trs+'</tbody></table>');
  w.document.write('<br><button onclick="window.print()" style="padding:8px 16px;background:#1a1a2e;color:#fff;border:none;border-radius:6px;cursor:pointer">ðŸ–¨ Print / Save as PDF</button>');
  w.document.write('</body></html>');w.document.close();
}

function exportBar(onCSV,onExcel,onPDF){
  return el('div',{style:{display:'flex',gap:'6px',margin:'12px 0 4px'}},[
    el('button',{cls:'hbtn hbtn-sm',onClick:onCSV},['â¬‡ CSV']),
    el('button',{cls:'hbtn hbtn-sm',onClick:onExcel},['â¬‡ Excel']),
    el('button',{cls:'hbtn hbtn-sm',onClick:onPDF},['ðŸ–¨ PDF']),
  ]);
}

// â”€â”€ DELIVERY REPORT (PIN-protected) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function buildDeliveryReport(){
  var d=S.reports;
  var t=d.totals||{};

  if(!S.delivF) S.delivF={q:'',type:'All'};
  var F=S.delivF;

  // â”€â”€ Build delivery type breakdown from loaded orders â”€â”€
  var typeMap={};
  var noShipCount=0;
  (S.orders||[]).forEach(function(o){
    var ship=o.shipping||[];
    if(!ship.length||(o.shipping_total||0)===0){noShipCount++;return;}
    ship.forEach(function(s){
      var title=s.title||'Delivery';
      if(!typeMap[title])typeMap[title]={orders:0,total:0};
      typeMap[title].orders++;
      typeMap[title].total+=parseFloat(s.cost)||0;
    });
  });
  var typeRows=Object.keys(typeMap).map(function(k){return{type:k,orders:typeMap[k].orders,total:typeMap[k].total};});
  typeRows.sort(function(a,b){return b.total-a.total;});
  var allTypes=['All'].concat(Object.keys(typeMap).sort());

  var shipTotal=d.shipping_total||0;
  var shipOrders=d.shipping_orders||0;
  var courierCount=0;
  typeRows.forEach(function(r){if(/courier/i.test(r.type))courierCount+=r.orders;});

  // â”€â”€ Filtered orders list â”€â”€
  var shipOrds=(S.orders||[]).filter(function(o){
    if((o.shipping_total||0)<=0)return false;
    var b=o.billing||{};
    var name=((b.first_name||'')+' '+(b.last_name||'')).toLowerCase();
    var matchQ=!F.q||name.includes(F.q.toLowerCase())||String(o.number).includes(F.q);
    var shipTitle=(o.shipping&&o.shipping[0])?o.shipping[0].title:'Delivery';
    var matchType=F.type==='All'||shipTitle===F.type;
    return matchQ&&matchType;
  });

  // â”€â”€ Filter controls â”€â”€
  function mkSel(opts,val,onChange){
    var s=D.createElement('select');s.className='hsel';s.style.cssText='font-size:12px;padding:5px 8px;';
    opts.forEach(function(o){var opt=D.createElement('option');opt.value=o;opt.textContent=o;if(o===val)opt.selected=true;s.appendChild(opt);});
    s.addEventListener('change',function(){onChange(this.value);});return s;
  }
  var srchInp=D.createElement('input');srchInp.className='hinp';srchInp.placeholder='ðŸ” Search customer or order #â€¦';
  srchInp.value=F.q;srchInp.style.cssText='flex:1;font-size:12px;';
  srchInp.addEventListener('keydown',function(e){e.stopPropagation();});
  srchInp.addEventListener('input',function(){F.q=this.value;S.delivF=F;var w=D.getElementById('hdeliv-wrap');if(w){w.innerHTML='';w.appendChild(buildDeliveryReport());}});
  var typeSel=mkSel(allTypes,F.type,function(v){F.type=v;S.delivF=F;var w=D.getElementById('hdeliv-wrap');if(w){w.innerHTML='';w.appendChild(buildDeliveryReport());}});
  var filterBar=el('div',{style:{display:'flex',gap:'8px',flexWrap:'wrap',alignItems:'center',padding:'10px',background:'#f8fafc',borderRadius:'10px',border:'1px solid #e2e8f0',marginBottom:'12px'}},[
    srchInp,typeSel,
    el('span',{style:{fontSize:'11px',color:'#9ca3af'}},[shipOrds.length+' orders']),
  ]);

  var expHeaders=['Delivery Type','Orders','Total Cost'];
  var expRows=typeRows.map(function(r){return[r.type,r.orders,fmt(r.total)];});
  var expRowsNum=typeRows.map(function(r){return[r.type,r.orders,r.total.toFixed(2)];});

  return el('div',{id:'hdeliv-wrap'},[
    el('div',{cls:'hsumcards'},[
      scard('Total Delivery Fees',fmt(shipTotal),'collected this period'),
      scard('Orders with Delivery',String(shipOrders),'shipped orders'),
      scard('Avg Delivery Fee',shipOrders>0?fmt(shipTotal/shipOrders):'N$ 0.00','per order'),
      courierCount>0?scard('Courier Orders',String(courierCount),'this period'):
        scard('Walk-in / No Shipping',String(noShipCount),'no delivery charge'),
    ]),

    el('div',{cls:'hrep-card',style:{marginTop:'14px'}},[
      el('h3',{cls:'hrep-title'},['ðŸšš Delivery Type Breakdown']),
      typeRows.length?el('div',{},[
        el('table',{cls:'htbl'},[
          el('thead',{},[el('tr',{},[th('Delivery Type'),th('Orders'),th('Total Cost'),th('Avg per Order')])]),
          el('tbody',{},typeRows.map(function(r){
            var avg=r.orders>0?r.total/r.orders:0;
            return el('tr',{},[td(el('strong',{},[r.type])),td(String(r.orders)),td(fmt(r.total)),td(fmt(avg))]);
          })),
          el('tfoot',{},[el('tr',{style:{fontWeight:'700',background:'#f9fafb'}},[
            td('TOTAL'),td(String(shipOrders)),td(el('strong',{},[fmt(shipTotal)])),td(shipOrders>0?fmt(shipTotal/shipOrders):'â€”'),
          ])]),
        ]),
        exportBar(
          function(){dlCSV('delivery-types-'+S.rpP+'.csv',expHeaders,expRows);},
          function(){dlExcel('delivery-types-'+S.rpP+'.xls',expHeaders,expRowsNum);},
          function(){dlPDF('Delivery Type Breakdown â€” '+S.rpP,expHeaders,expRows);}
        ),
      ]):el('div',{style:{padding:'20px',textAlign:'center',color:'#9ca3af',fontSize:'13px'}},
        ['No delivery data in loaded orders.']),
    ]),

    el('div',{cls:'hrep-card',style:{marginTop:'14px'}},[
      el('h3',{cls:'hrep-title'},['ðŸ“… Delivery Orders by Day']),
      el('div',{cls:'hbarchart'},barChart(d.daily||[])),
    ]),

    el('div',{cls:'hrep-card',style:{marginTop:'14px'}},[
      el('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px'}},[
        el('h3',{cls:'hrep-title',style:{marginBottom:'0'}},['ðŸ“‹ Delivery Orders'+(F.type!=='All'?' â€” '+F.type:'')]),
      ]),
      filterBar,
      shipOrds.length?el('table',{cls:'htbl'},[
        el('thead',{},[el('tr',{},[th('Order'),th('Customer'),th('Mobile'),th('Delivery Type'),th('Cost'),th('Status'),th('Date')])]),
        el('tbody',{},shipOrds.map(function(o){
          var b=o.billing||{};
          var shipTitle=(o.shipping&&o.shipping[0])?o.shipping[0].title:'Delivery';
          return el('tr',{},[
            td(el('strong',{},['#'+o.number])),
            td(b.first_name?(b.first_name+' '+b.last_name).trim():'Walk-in'),
            td(b.phone||'â€”'),
            td(shipTitle),
            td(fmt(o.shipping_total||0)),
            td(sbadge(o.status)),
            td(fdateOnly(o.date)),
          ]);
        })),
      ]):el('p',{style:{fontSize:'12px',color:'#9ca3af',padding:'10px 0'}},['No matching delivery orders.']),
    ]),
  ]);
}

// â”€â”€ VAT REPORT (PIN-protected) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function buildVATReport(){
  var d=S.reports;
  var t=d.totals||{};

  // â”€â”€ Core formula: VAT on product sales only (exclude shipping) â”€â”€
  var shipping      = t.shipping_total||d.shipping_total||0;
  var gross         = t.sales||0;
  var vatableSales  = Math.round((gross - shipping)*100)/100;
  var vatCollected  = Math.round(vatableSales*15/115*100)/100;
  var exVAT         = Math.round((vatableSales - vatCollected)*100)/100;
  var refundAmt     = t.refunds||0;
  var refundVAT     = Math.round(refundAmt*15/115*100)/100;
  var netVAT        = Math.round((vatCollected - refundVAT)*100)/100;
  var orders        = t.count||0;
  var daily         = d.daily||[];
  var byMethod      = d.by_method||[];
  var prods         = d.top_products||[];
  var refundRows    = d.refund_rows||[];

  // Period label
  var periodLabel = d.from&&d.to ? d.from.slice(0,10)+' â€“ '+d.to.slice(0,10) : (S.rpP||'today');

  // â”€â”€ 1. VAT PERIOD SUMMARY â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  var summaryHeaders=['Metric','Amount'];
  var summaryRows=[
    ['Period',periodLabel],
    ['Total Orders',String(orders)],
    ['Total Invoice Sales (Incl. VAT)',fmt(gross)],
    ['Shipping / Delivery Amount',fmt(shipping)],
    ['VATable Sales (Sales âˆ’ Shipping)',fmt(vatableSales)],
    ['VAT Amount (15/115 of VATable)',fmt(vatCollected)],
    ['Sales Excluding VAT',fmt(exVAT)],
    ['Refunds Issued',fmt(refundAmt)],
    ['VAT on Refunds',fmt(refundVAT)],
    ['Net VAT Payable',fmt(netVAT)],
  ];

  // â”€â”€ 2. PAYMENT METHOD BREAKDOWN â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  var pmHeaders=['Payment Method','Orders','Total (Incl. VAT)','VAT Portion'];
  var pmRows=byMethod.map(function(r){
    var vat=Math.round((r.total||0)*15/115*100)/100;
    return[r.method,r.count,fmt(r.total),fmt(vat)];
  });
  var pmRowsNum=byMethod.map(function(r){
    return[r.method,r.count,(r.total||0).toFixed(2),(Math.round((r.total||0)*15/115*100)/100).toFixed(2)];
  });

  // â”€â”€ 3. PRODUCT VAT REPORT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  var prodVATHeaders=['Product','Qty Sold','Total Sales (Incl.)','VAT Portion'];
  var prodVATRows=prods.map(function(p){
    var vat=Math.round((p.total||0)*15/115*100)/100;
    return[p.name,p.qty||0,fmt(p.total||0),fmt(vat)];
  });
  var prodVATRowsNum=prods.map(function(p){
    return[p.name,p.qty||0,(p.total||0).toFixed(2),(Math.round((p.total||0)*15/115*100)/100).toFixed(2)];
  });

  // â”€â”€ 4. REFUND VAT REPORT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  var refHeaders=['Date','Order Ref','Refund Amount','VAT Portion (15%)','Reason'];
  var refRows=refundRows.map(function(r){
    return[r.date,r.order_ref,fmt(r.amount||0),fmt(r.vat||0),r.reason||'â€”'];
  });
  var refRowsNum=refundRows.map(function(r){
    return[r.date,r.order_ref,(r.amount||0).toFixed(2),(r.vat||0).toFixed(2),r.reason||'â€”'];
  });

  return el('div',{},[

    // â”€â”€ SECTION 1: Period Summary â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    el('div',{cls:'hrep-card'},[
      el('h3',{cls:'hrep-title'},['ðŸ§¾ VAT Period Summary â€” '+periodLabel]),
      el('div',{cls:'hsumcards',style:{marginBottom:'12px'}},[
        scard('Total Invoice Sales',fmt(gross),orders+' orders'),
        scard('Shipping Excluded',fmt(shipping),'not subject to VAT'),
        scard('VATable Sales',fmt(vatableSales),'products only'),
        scard('VAT Collected (15%)',fmt(vatCollected),'on product sales'),
        scard('Sales Ex-VAT',fmt(exVAT),'ex-VAT revenue'),
        scard('Net VAT Payable',fmt(netVAT),refundAmt>0?'after '+fmt(refundVAT)+' refund VAT':'no refunds',netVAT>0?'':''),
      ]),
      el('table',{cls:'htbl'},[
        el('thead',{},[el('tr',{},summaryHeaders.map(th))]),
        el('tbody',{},summaryRows.map(function(r){
          var isTotal=r[0]==='Net VAT Payable';
          return el('tr',{style:isTotal?{fontWeight:'700',background:'#f0fdf4',borderTop:'2px solid #16a34a'}:{}},[
            td(el('span',{style:isTotal?{fontWeight:'700'}:{}},[r[0]])),
            td(el('span',{style:isTotal?{fontWeight:'700',color:'#16a34a'}:{}},[r[1]])),
          ]);
        })),
      ]),
      exportBar(
        function(){dlCSV('vat-summary-'+S.rpP+'.csv',summaryHeaders,summaryRows);},
        function(){dlExcel('vat-summary-'+S.rpP+'.xls',summaryHeaders,summaryRows);},
        function(){dlPDF('VAT Period Summary â€” '+periodLabel,summaryHeaders,summaryRows);}
      ),
    ]),

    // â”€â”€ SECTION 2: Daily Breakdown â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    el('div',{cls:'hrep-card',style:{marginTop:'14px'}},[
      el('h3',{cls:'hrep-title'},['ðŸ“… Daily VAT Breakdown']),
      daily.length?el('table',{cls:'htbl'},[
        el('thead',{},[el('tr',{},['Date','Orders','Total Sales','Shipping','VATable Sales','Ex-VAT','VAT (15%)'].map(th))]),
        el('tbody',{},daily.map(function(day){
          var ship=day.shipping||0;
          var vatable=Math.round(((day.total||0)-ship)*100)/100;
          var vat=Math.round(vatable*15/115*100)/100;
          var ex=Math.round((vatable-vat)*100)/100;
          return el('tr',{},[
            td(day.date),td(String(day.count||0)),td(fmt(day.total||0)),
            td(fmt(ship)),td(fmt(vatable)),td(fmt(ex)),
            td(el('strong',{},[fmt(vat)])),
          ]);
        })),
        el('tfoot',{},[el('tr',{style:{fontWeight:'700',background:'#f9fafb'}},[
          td('TOTAL'),td(String(orders)),td(fmt(gross)),td(fmt(shipping)),
          td(fmt(vatableSales)),td(fmt(exVAT)),
          td(el('strong',{style:{color:'#16a34a'}},[fmt(vatCollected)]))
        ])]),
      ]):el('p',{cls:'hpage-meta'},['No daily data available.']),
      exportBar(
        function(){var rows=daily.map(function(d){var ship=d.shipping||0;var vt=Math.round(((d.total||0)-ship)*100)/100;var v=Math.round(vt*15/115*100)/100;return[d.date,d.count||0,fmt(d.total||0),fmt(ship),fmt(vt),fmt(vt-v),fmt(v)];});dlCSV('vat-daily-'+S.rpP+'.csv',['Date','Orders','Total Sales','Shipping','VATable Sales','Ex-VAT','VAT'],rows);},
        function(){var rows=daily.map(function(d){var ship=d.shipping||0;var vt=Math.round(((d.total||0)-ship)*100)/100;var v=Math.round(vt*15/115*100)/100;return[d.date,d.count||0,(d.total||0).toFixed(2),ship.toFixed(2),vt.toFixed(2),(vt-v).toFixed(2),v.toFixed(2)];});dlExcel('vat-daily-'+S.rpP+'.xls',['Date','Orders','Total Sales','Shipping','VATable Sales','Ex-VAT','VAT'],rows);},
        function(){var rows=daily.map(function(d){var ship=d.shipping||0;var vt=Math.round(((d.total||0)-ship)*100)/100;var v=Math.round(vt*15/115*100)/100;return[d.date,d.count||0,fmt(d.total||0),fmt(ship),fmt(vt),fmt(vt-v),fmt(v)];});dlPDF('Daily VAT Breakdown â€” '+periodLabel,['Date','Orders','Total Sales','Shipping','VATable Sales','Ex-VAT','VAT'],rows);}
      ),
    ]),

    // â”€â”€ SECTION 3: Payment Method Breakdown â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    el('div',{cls:'hrep-card',style:{marginTop:'14px'}},[
      el('h3',{cls:'hrep-title'},['ðŸ’³ VAT by Payment Method']),
      byMethod.length?el('table',{cls:'htbl'},[
        el('thead',{},[el('tr',{},pmHeaders.map(th))]),
        el('tbody',{},byMethod.map(function(r){
          var vat=Math.round((r.total||0)*15/115*100)/100;
          return el('tr',{},[td(r.method),td(String(r.count)),td(fmt(r.total)),td(el('strong',{},[fmt(vat)]))]);
        })),
        el('tfoot',{},[el('tr',{style:{fontWeight:'700',background:'#f9fafb'}},[
          td('TOTAL'),td(String(orders)),td(fmt(gross)),td(el('strong',{style:{color:'#16a34a'}},[fmt(vatCollected)]))
        ])]),
      ]):el('p',{cls:'hpage-meta'},['No payment data.']),
      exportBar(
        function(){dlCSV('vat-by-method-'+S.rpP+'.csv',pmHeaders,pmRows);},
        function(){dlExcel('vat-by-method-'+S.rpP+'.xls',pmHeaders,pmRowsNum);},
        function(){dlPDF('VAT by Payment Method â€” '+periodLabel,pmHeaders,pmRows);}
      ),
    ]),

    // â”€â”€ SECTION 4: Product VAT Report â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    el('div',{cls:'hrep-card',style:{marginTop:'14px'}},[
      el('h3',{cls:'hrep-title'},['ðŸ· Product VAT Report']),
      prods.length?el('table',{cls:'htbl'},[
        el('thead',{},[el('tr',{},prodVATHeaders.map(th))]),
        el('tbody',{},prods.map(function(p){
          var vat=Math.round((p.total||0)*15/115*100)/100;
          return el('tr',{},[td(p.name),td(String(p.qty||0)),td(fmt(p.total||0)),td(el('strong',{},[fmt(vat)]))]);
        })),
        el('tfoot',{},[el('tr',{style:{fontWeight:'700',background:'#f9fafb'}},[
          td('TOTAL'),
          td(String(prods.reduce(function(s,p){return s+(p.qty||0);},0))),
          td(fmt(prods.reduce(function(s,p){return s+(p.total||0);},0))),
          td(el('strong',{style:{color:'#16a34a'}},[fmt(prods.reduce(function(s,p){return s+Math.round((p.total||0)*15/115*100)/100;},0))])),
        ])]),
      ]):el('p',{cls:'hpage-meta'},['No product sales data for this period.']),
      exportBar(
        function(){dlCSV('vat-products-'+S.rpP+'.csv',prodVATHeaders,prodVATRows);},
        function(){dlExcel('vat-products-'+S.rpP+'.xls',prodVATHeaders,prodVATRowsNum);},
        function(){dlPDF('Product VAT Report â€” '+periodLabel,prodVATHeaders,prodVATRows);}
      ),
    ]),

    // â”€â”€ SECTION 5: Refund VAT Report â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    el('div',{cls:'hrep-card',style:{marginTop:'14px'}},[
      el('h3',{cls:'hrep-title'},['â†© Refund VAT Report']),
      refundRows.length?el('div',{},[
        el('div',{cls:'hsumcards',style:{marginBottom:'10px'}},[
          scard('Total Refunded',fmt(refundAmt),'this period',refundAmt>0?'warn':''),
          scard('VAT on Refunds',fmt(refundVAT),'deductible',refundVAT>0?'warn':''),
          scard('Net VAT Impact',fmt(netVAT),'VAT payable after refunds'),
        ]),
        el('table',{cls:'htbl'},[
          el('thead',{},[el('tr',{},refHeaders.map(th))]),
          el('tbody',{},refundRows.map(function(r){
            return el('tr',{},[td(r.date),td(r.order_ref),td(fmt(r.amount||0)),td(el('strong',{style:{color:'#dc2626'}},['-'+fmt(r.vat||0)])),td(r.reason||'â€”')]);
          })),
          el('tfoot',{},[el('tr',{style:{fontWeight:'700',background:'#fff5f5'}},[
            td('TOTAL'),td(''),td(fmt(refundAmt)),td(el('strong',{style:{color:'#dc2626'}},['-'+fmt(refundVAT)])),td(''),
          ])]),
        ]),
      ]):el('p',{cls:'hpage-meta'},['No refunds recorded for this period.']),
      refundRows.length?exportBar(
        function(){dlCSV('vat-refunds-'+S.rpP+'.csv',refHeaders,refRowsNum);},
        function(){dlExcel('vat-refunds-'+S.rpP+'.xls',refHeaders,refRowsNum);},
        function(){dlPDF('Refund VAT Report â€” '+periodLabel,refHeaders,refRows);}
      ):null,
    ]),

  ]);
}

// â”€â”€ PROFIT REPORT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function buildProfitReport(){
  var d=S.reports;
  if(!d)return el('div',{cls:'hempty2'},['No data.']);
  var t=d.totals||{};
  var prods=d.top_products||[];
  var periodLabel=d.from&&d.to?d.from.slice(0,10)+' â€“ '+d.to.slice(0,10):(S.rpP||'today');

  // Match products with inventory cost data
  var costMap={};
  (S.inv||[]).forEach(function(i){costMap[i.name]=costMap[i.name]||i.cost||0;});

  var rows=prods.map(function(p){
    var cost=costMap[p.name]||0;
    var salesVal=p.total||0;
    var costVal=cost*(p.qty||0);
    var profit=salesVal-costVal;
    var pct=salesVal>0?Math.round(profit/salesVal*100):0;
    return{name:p.name,qty:p.qty||0,salesVal:salesVal,costVal:costVal,profit:profit,pct:pct};
  });
  rows.sort(function(a,b){return b.profit-a.profit;});

  var totSales=rows.reduce(function(s,r){return s+r.salesVal;},0);
  var totCost=rows.reduce(function(s,r){return s+r.costVal;},0);
  var totProfit=totSales-totCost;
  var totPct=totSales>0?Math.round(totProfit/totSales*100):0;

  var headers=['Product','Qty Sold','Sales Value','Cost Value','Profit','Profit %'];
  var expRows=rows.map(function(r){return[r.name,r.qty,r.salesVal.toFixed(2),r.costVal.toFixed(2),r.profit.toFixed(2),r.pct+'%'];});

  return el('div',{},[
    el('div',{cls:'hsumcards'},[
      scard('Total Sales',fmt(totSales),periodLabel),
      scard('Cost of Goods',fmt(totCost),'estimated from inventory costs'),
      scard('Gross Profit',fmt(totProfit),totPct+'% margin',totProfit>0?'ok':'warn'),
    ]),
    el('p',{style:{fontSize:'11px',color:'#9ca3af',margin:'4px 0 10px'}},['Note: Cost values are estimates based on current inventory cost prices. Ensure costs are up to date in the Inventory report.']),
    el('div',{cls:'hrep-card'},[
      el('h3',{cls:'hrep-title'},['ðŸ’° Profit by Product â€” '+periodLabel]),
      rows.length?el('div',{},[
        el('table',{cls:'htbl'},[
          el('thead',{},[el('tr',{},headers.map(th))]),
          el('tbody',{},rows.map(function(r){
            var profColor=r.profit>0?'#16a34a':r.profit<0?'#dc2626':'#6b7280';
            return el('tr',{},[
              td(r.name),td(String(r.qty)),td(fmt(r.salesVal)),td(fmt(r.costVal)),
              td(el('strong',{style:{color:profColor}},[fmt(r.profit)])),
              td(el('span',{style:{color:profColor,fontWeight:'600'}},[r.pct+'%'])),
            ]);
          })),
          el('tfoot',{},[el('tr',{style:{fontWeight:'700',background:'#f9fafb'}},[
            td('TOTAL'),td(''),td(fmt(totSales)),td(fmt(totCost)),
            td(el('strong',{style:{color:totProfit>0?'#16a34a':'#dc2626'}},[fmt(totProfit)])),
            td(el('strong',{style:{color:totProfit>0?'#16a34a':'#dc2626'}},[totPct+'%'])),
          ])]),
        ]),
        exportBar(
          function(){dlCSV('profit-report-'+S.rpP+'.csv',headers,expRows);},
          function(){dlExcel('profit-report-'+S.rpP+'.xls',headers,expRows);},
          function(){dlPDF('Profit Report â€” '+periodLabel,headers,expRows);}
        ),
      ]):el('p',{cls:'hpage-meta'},['No product sales data. Ensure inventory costs are set.']),
    ]),
  ]);
}

// â”€â”€ MONTHLY BUSINESS SUMMARY â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function buildMonthlyReport(){
  var d=S.reports;
  if(!d)return el('div',{cls:'hempty2'},['No data.']);
  var t=d.totals||{};
  var periodLabel=d.from&&d.to?d.from.slice(0,10)+' â€“ '+d.to.slice(0,10):(S.rpP||'today');

  var totalSales   = t.sales||0;
  var shipping     = d.shipping_total||0;
  var vatableSales = Math.round((totalSales-shipping)*100)/100;
  var vatAmount    = Math.round(vatableSales*15/115*100)/100;
  var exVAT        = Math.round((vatableSales-vatAmount)*100)/100;
  var refunds      = t.refunds||0;
  var netSales     = totalSales-refunds;
  var orders       = t.count||0;

  // COGS from inventory
  var prods=d.top_products||[];
  var costMap={};
  (S.inv||[]).forEach(function(i){costMap[i.name]=costMap[i.name]||i.cost||0;});
  var cogs=prods.reduce(function(s,p){return s+(costMap[p.name]||0)*(p.qty||0);},0);
  var grossProfit=netSales-shipping-cogs;

  // Stock value from inventory
  var stockCostVal=(S.inv||[]).reduce(function(s,i){return s+(i.stock_value||0);},0);
  var stockRetailVal=(S.inv||[]).reduce(function(s,i){return s+(i.retail_value||0);},0);

  // Payment breakdown
  var cashMethods=['cash'];
  var cardMethods=['card','swipe','card_swipe'];
  var eftMethods=['eft','bacs'];
  function pmTotal(ids){return (d.by_method||[]).filter(function(r){return ids.some(function(id){return(r.method||'').toLowerCase().includes(id);});}).reduce(function(s,r){return s+(r.total||0);},0);}
  var cashSales=pmTotal(cashMethods);
  var cardSales=pmTotal(cardMethods);
  var eftSales=pmTotal(eftMethods);
  var otherSales=totalSales-cashSales-cardSales-eftSales;

  var summaryData=[
    {label:'SALES',isHeader:true},
    {label:'Total Invoice Sales',val:fmt(totalSales),note:orders+' orders'},
    {label:'Cash Sales',val:fmt(cashSales)},
    {label:'Card / Swipe Sales',val:fmt(cardSales)},
    {label:'EFT Sales',val:fmt(eftSales)},
    {label:'Other / Wallet Sales',val:fmt(otherSales)},
    {label:'Delivery Fees',val:fmt(shipping)},
    {label:'Refunds Issued',val:'-'+fmt(refunds)},
    {label:'Net Sales',val:fmt(netSales),isTotal:true},
    {label:''},
    {label:'VAT',isHeader:true},
    {label:'VATable Sales (excl. shipping)',val:fmt(vatableSales)},
    {label:'VAT Amount (15%)',val:fmt(vatAmount)},
    {label:'Sales Excl. VAT',val:fmt(exVAT)},
    {label:''},
    {label:'PROFIT (ESTIMATED)',isHeader:true},
    {label:'Net Sales',val:fmt(netSales)},
    {label:'Shipping Deducted',val:'-'+fmt(shipping)},
    {label:'Cost of Goods Sold (est.)',val:'-'+fmt(cogs)},
    {label:'Gross Profit (est.)',val:fmt(grossProfit),isTotal:true,profitColor:grossProfit>0?'#16a34a':'#dc2626'},
    {label:''},
    {label:'INVENTORY',isHeader:true},
    {label:'Stock Cost Value',val:fmt(stockCostVal)},
    {label:'Stock Retail Value',val:fmt(stockRetailVal)},
    {label:'Potential Margin',val:fmt(stockRetailVal-stockCostVal)},
  ];

  var expHeaders=['Metric','Value','Note'];
  var expRows=summaryData.filter(function(r){return r.val;}).map(function(r){return[r.label,r.val,r.note||''];});

  return el('div',{},[
    el('div',{cls:'hsumcards'},[
      scard('Net Sales',fmt(netSales),orders+' orders'),
      scard('VAT Payable',fmt(vatAmount),'on product sales'),
      scard('Gross Profit (est.)',fmt(grossProfit),grossProfit>0?Math.round(grossProfit/netSales*100)+'% margin':'',grossProfit>0?'ok':'warn'),
      scard('Stock Value',fmt(stockCostVal),'at cost price'),
    ]),
    el('div',{cls:'hrep-card',style:{marginTop:'14px'}},[
      el('h3',{cls:'hrep-title'},['ðŸ“… Monthly Business Summary â€” '+periodLabel]),
      el('p',{style:{fontSize:'11px',color:'#9ca3af',marginBottom:'10px'}},['Profit figures are estimates based on current inventory cost prices.']),
      el('table',{cls:'htbl'},[
        el('thead',{},[el('tr',{},[th('Metric'),th('Amount'),th('Notes')])]),
        el('tbody',{},summaryData.map(function(r){
          if(!r.label)return el('tr',{},[td(''),td(''),td('')]);
          if(r.isHeader)return el('tr',{style:{background:'#f0f9ff'}},[
            el('td',{colSpan:'3',style:{fontWeight:'800',fontSize:'11px',letterSpacing:'1px',textTransform:'uppercase',color:'#2563eb',padding:'8px 12px'}},[r.label]),
          ]);
          return el('tr',{style:r.isTotal?{fontWeight:'700',background:'#f9fafb',borderTop:'2px solid #e2e8f0'}:{}},[
            td(r.label),
            td(el('span',{style:r.profitColor?{color:r.profitColor,fontWeight:'700'}:r.isTotal?{fontWeight:'700'}:{}},[r.val||''])),
            td(el('span',{style:{fontSize:'11px',color:'#9ca3af'}},[r.note||''])),
          ]);
        })),
      ]),
      exportBar(
        function(){dlCSV('monthly-summary-'+S.rpP+'.csv',expHeaders,expRows);},
        function(){dlExcel('monthly-summary-'+S.rpP+'.xls',expHeaders,expRows);},
        function(){dlPDF('Monthly Business Summary â€” '+periodLabel,expHeaders,expRows);}
      ),
    ]),
  ]);
}

// â”€â”€ INVENTORY REPORT (PIN-protected) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function buildInventoryReport(){
  if(S.loadI)return el('div',{cls:'hloading'},[el('div',{cls:'hspinner'},[]),' Loading inventory...']);
  if(!S.inv.length){fetchInv();return el('div',{cls:'hloading'},[el('div',{cls:'hspinner'},[]),' Loading...']);}

  // â”€â”€ Filter / sort state (persisted on S so it survives re-renders) â”€â”€
  if(!S.invF) S.invF={q:'',cat:'All',sort:'name',dir:'asc',view:'all'};
  var F=S.invF;

  // â”€â”€ Collect unique categories â”€â”€
  var catSet={};
  S.inv.forEach(function(i){
    (i.categories||'').split(',').forEach(function(c){
      var t=c.trim();if(t)catSet[t]=true;
    });
  });
  var cats=['All'].concat(Object.keys(catSet).sort());

  // â”€â”€ Apply filters â”€â”€
  var items=S.inv.filter(function(i){
    var matchQ=!F.q||i.name.toLowerCase().includes(F.q.toLowerCase())||(i.sku||'').toLowerCase().includes(F.q.toLowerCase());
    var matchCat=F.cat==='All'||(i.categories||'').toLowerCase().includes(F.cat.toLowerCase());
    var matchView=F.view==='all'||(F.view==='low'&&i.stock_qty>0&&i.stock_qty<=5)||(F.view==='oos'&&i.stock_qty<=0);
    return matchQ&&matchCat&&matchView;
  });

  // â”€â”€ Sort â”€â”€
  items=items.slice().sort(function(a,b){
    var av,bv;
    if(F.sort==='name'){av=(a.name||'').toLowerCase();bv=(b.name||'').toLowerCase();}
    else if(F.sort==='qty'){av=a.stock_qty||0;bv=b.stock_qty||0;}
    else if(F.sort==='retail'){av=a.retail_value||0;bv=b.retail_value||0;}
    else if(F.sort==='profit'){av=(a.price||0)-(a.cost||0);bv=(b.price||0)-(b.cost||0);}
    else if(F.sort==='cost_val'){av=a.stock_value||0;bv=b.stock_value||0;}
    else{av=a[F.sort]||0;bv=b[F.sort]||0;}
    if(av<bv)return F.dir==='asc'?-1:1;
    if(av>bv)return F.dir==='asc'?1:-1;
    return 0;
  });

  // â”€â”€ Summary totals â”€â”€
  var tc=0,tr=0,tq=0,tp=0,low=0,oos=0;
  items.forEach(function(i){
    tc+=i.stock_value||0;tr+=i.retail_value||0;tq+=i.stock_qty||0;
    tp+=(i.price||0)-(i.cost||0);
    if(i.stock_qty>0&&i.stock_qty<=5)low++;
    if(i.stock_qty<=0)oos++;
  });

  // â”€â”€ Sort header helper â”€â”€
  function sortTh(label,key){
    var active=F.sort===key;
    var arrow=active?(F.dir==='asc'?' â†‘':' â†“'):'';
    var h=D.createElement('th');
    h.style.cssText='cursor:pointer;user-select:none;white-space:nowrap;'+(active?'color:#2563eb;':'');
    h.textContent=label+arrow;
    h.addEventListener('click',function(){
      if(F.sort===key){F.dir=F.dir==='asc'?'desc':'asc';}
      else{F.sort=key;F.dir='asc';}
      S.invF=F;
      var wrap=D.getElementById('hinv-wrap');
      if(wrap){wrap.innerHTML='';wrap.appendChild(buildInventoryReport());}
    });
    return h;
  }

  // â”€â”€ Editable cost cell â”€â”€
  function costCell(i){
    var cell=D.createElement('td');
    var inp=D.createElement('input');
    inp.type='number';inp.min='0';inp.step='0.01';
    inp.value=(i.cost||0).toFixed(2);
    inp.style.cssText='width:70px;border:1px solid #e2e8f0;border-radius:5px;padding:3px 5px;font-size:12px;font-family:inherit;text-align:right;';
    inp.addEventListener('keydown',function(e){e.stopPropagation();});
    inp.addEventListener('change',function(){
      var newCost=parseFloat(this.value)||0;
      var oldCost=i.cost;
      i.cost=newCost;
      i.stock_value=newCost*(i.stock_qty||0);
      // Update profit cell in same row
      var row=cell.parentElement;
      if(row){
        var profitCell=row.querySelector('[data-profit]');
        if(profitCell)profitCell.textContent=fmt((i.price||0)-newCost);
        var costValCell=row.querySelector('[data-costval]');
        if(costValCell)costValCell.textContent=fmt(i.stock_value);
      }
      // Save to server
      api('/inventory-cost/'+i.id,{method:'PUT',body:JSON.stringify({cost:newCost})}).then(function(r){
        if(r.success){toast('Cost updated','ok');}
        else{i.cost=oldCost;inp.value=oldCost.toFixed(2);toast('Save failed','err');}
      }).catch(function(e){i.cost=oldCost;inp.value=oldCost.toFixed(2);toast('Error: '+e.message,'err');});
    });
    cell.appendChild(inp);
    return cell;
  }

  // â”€â”€ Build table row â”€â”€
  function buildRow(i){
    var profit=(i.price||0)-(i.cost||0);
    var profitColor=profit>0?'#16a34a':profit<0?'#dc2626':'#6b7280';
    var rowStyle=i.stock_qty<=0?{background:'#fff5f5'}:i.stock_qty<=5?{background:'#fffbeb'}:{};
    var row=el('tr',{style:rowStyle},[
      td(el('div',{},[
        el('div',{style:{fontWeight:'600',fontSize:'12px'}},[i.name]),
        i.categories?el('div',{style:{fontSize:'10px',color:'#9ca3af',marginTop:'1px'}},[i.categories]):null,
      ])),
      td(i.attributes||'â€”'),
      td(el('code',{style:{fontSize:'11px'}},[i.sku||'â€”'])),
      td(fmt(i.price)),
    ]);
    row.appendChild(costCell(i));
    var qtyTd=el('td',{},[el('b',{style:{color:i.stock_qty<=0?'#dc2626':i.stock_qty<=5?'#d97706':'#16a34a'}},[i.stock_qty==null?'âˆž':String(i.stock_qty)])]);
    row.appendChild(qtyTd);
    var cvTd=D.createElement('td');cvTd.setAttribute('data-costval','1');cvTd.textContent=fmt(i.stock_value||0);row.appendChild(cvTd);
    var rvTd=el('td',{},[fmt(i.retail_value||0)]);row.appendChild(rvTd);
    var prTd=D.createElement('td');prTd.setAttribute('data-profit','1');
    prTd.style.cssText='font-weight:700;color:'+profitColor+';';
    prTd.textContent=fmt(profit);
    row.appendChild(prTd);
    return row;
  }

  // â”€â”€ Export data â”€â”€
  var headers=['Product','Category','Variant','SKU','Price','Cost','Qty','Cost Value','Retail Value','Profit'];
  var rows=items.map(function(i){return[i.name,i.categories||'',i.attributes||'â€”',i.sku||'â€”',i.price||0,i.cost||0,i.stock_qty||0,(i.stock_value||0).toFixed(2),(i.retail_value||0).toFixed(2),((i.price||0)-(i.cost||0)).toFixed(2)];});

  // â”€â”€ Control bar â”€â”€
  function mkSel(opts,val,onChange){
    var s=D.createElement('select');
    s.className='hsel';s.style.cssText='font-size:12px;padding:5px 8px;min-width:120px;';
    opts.forEach(function(o){
      var opt=D.createElement('option');opt.value=o.v;opt.textContent=o.l;if(o.v===val)opt.selected=true;
      s.appendChild(opt);
    });
    s.addEventListener('change',function(){onChange(this.value);});
    return s;
  }

  var searchInp=D.createElement('input');
  searchInp.className='hinp';searchInp.placeholder='ðŸ” Search product or SKUâ€¦';
  searchInp.value=F.q;searchInp.style.cssText='flex:1;min-width:160px;font-size:12px;';
  searchInp.addEventListener('keydown',function(e){e.stopPropagation();});
  var searchTimer=null;
  searchInp.addEventListener('input',function(){
    clearTimeout(searchTimer);var v=this.value;
    searchTimer=setTimeout(function(){F.q=v;S.invF=F;var wrap=D.getElementById('hinv-wrap');if(wrap){wrap.innerHTML='';wrap.appendChild(buildInventoryReport());}},250);
  });

  var catSel=mkSel(cats.map(function(c){return{v:c,l:c};}),F.cat,function(v){F.cat=v;S.invF=F;var wrap=D.getElementById('hinv-wrap');if(wrap){wrap.innerHTML='';wrap.appendChild(buildInventoryReport());}});

  var sortSel=mkSel([
    {v:'name',l:'Sort: Name'},{v:'qty',l:'Sort: Qty â†‘'},{v:'retail',l:'Sort: Retail Value'},{v:'profit',l:'Sort: Profit'},{v:'cost_val',l:'Sort: Cost Value'},
  ],F.sort,function(v){F.sort=v;F.dir='asc';S.invF=F;var wrap=D.getElementById('hinv-wrap');if(wrap){wrap.innerHTML='';wrap.appendChild(buildInventoryReport());}});

  var dirBtn=el('button',{cls:'hbtn',style:{fontSize:'12px',padding:'5px 10px'},onClick:function(){
    F.dir=F.dir==='asc'?'desc':'asc';S.invF=F;var wrap=D.getElementById('hinv-wrap');if(wrap){wrap.innerHTML='';wrap.appendChild(buildInventoryReport());}
  }},[F.dir==='asc'?'â†‘ Asc':'â†“ Desc']);

  var viewSel=mkSel([{v:'all',l:'All Stock'},{v:'low',l:'âš  Low Stock (â‰¤5)'},{v:'oos',l:'ðŸš« Out of Stock'}],F.view,function(v){F.view=v;S.invF=F;var wrap=D.getElementById('hinv-wrap');if(wrap){wrap.innerHTML='';wrap.appendChild(buildInventoryReport());}});

  var refreshBtn=el('button',{cls:'hbtn',style:{fontSize:'12px'},onClick:function(){
    S.inv=[];S.invF=null;fetchInv();
    var wrap=D.getElementById('hinv-wrap');if(wrap){wrap.innerHTML='';wrap.appendChild(el('div',{cls:'hloading'},[el('div',{cls:'hspinner'},[]),' Refreshing...']));}
  }},['â†» Refresh']);

  var controlBar=el('div',{style:{display:'flex',flexWrap:'wrap',gap:'8px',alignItems:'center',marginBottom:'12px',padding:'10px',background:'#f8fafc',borderRadius:'10px',border:'1px solid #e2e8f0'}},[
    searchInp,catSel,sortSel,dirBtn,viewSel,refreshBtn,
  ]);

  // â”€â”€ Main table â”€â”€
  var thead=D.createElement('thead');
  var hrow=D.createElement('tr');
  [['Product/Category','name'],['Variant',''],['SKU',''],['Price',''],['Cost',''],['Qty','qty'],['Cost Value','cost_val'],['Retail Value','retail'],['Profit','profit']].forEach(function(h){
    if(h[1])hrow.appendChild(sortTh(h[0],h[1]));
    else{var t=D.createElement('th');t.textContent=h[0];hrow.appendChild(t);}
  });
  thead.appendChild(hrow);

  var tbody=D.createElement('tbody');
  items.forEach(function(i){tbody.appendChild(buildRow(i));});

  var tfoot=D.createElement('tfoot');
  var frow=D.createElement('tr');frow.style.cssText='font-weight:700;background:#f9fafb;';
  ['TOTAL','','','','',String(tq),fmt(tc),fmt(tr),fmt(tp)].forEach(function(v,idx){
    var t=D.createElement('td');t.textContent=v;
    if(idx===8){t.style.color=tp>0?'#16a34a':tp<0?'#dc2626':'inherit';}
    frow.appendChild(t);
  });
  tfoot.appendChild(frow);

  var table=D.createElement('table');table.className='htbl';
  table.appendChild(thead);table.appendChild(tbody);table.appendChild(tfoot);

  var resultInfo=el('div',{style:{fontSize:'11px',color:'#6b7280',marginBottom:'6px'}},[
    'Showing '+items.length+' of '+S.inv.length+' SKUs'+(F.cat!=='All'?' in '+F.cat:'')+(F.q?' matching "'+F.q+'"':''),
  ]);

  return el('div',{id:'hinv-wrap'},[
    el('div',{cls:'hsumcards'},[
      scard('SKUs Shown',String(items.length),'of '+S.inv.length+' total'),
      scard('Total Units',tq.toLocaleString(),'in stock'),
      scard('Cost Value',fmt(tc),'total cost'),
      scard('Retail Value',fmt(tr),'at selling price'),
      scard('Gross Profit',fmt(tp),(tr>0?((tr-tc)/tr*100).toFixed(0)+'% margin':''),tp>0?'ok':'warn'),
      scard('Low Stock',String(low),'â‰¤5 units',low>0?'warn':''),
    ]),
    exportBar(
      function(){dlCSV('inventory-'+new Date().toISOString().slice(0,10)+'.csv',headers,rows);},
      function(){dlExcel('inventory-'+new Date().toISOString().slice(0,10)+'.xls',headers,rows);},
      function(){dlPDF('Inventory Report â€” '+new Date().toLocaleDateString(),headers,rows);}
    ),
    el('div',{cls:'hrep-card'},[
      el('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px'}},[
        el('h3',{cls:'hrep-title',style:{marginBottom:'0'}},['Inventory'+(F.view==='low'?' â€” Low Stock':F.view==='oos'?' â€” Out of Stock':'')]),
      ]),
      controlBar,
      resultInfo,
      el('div',{cls:'htable-wrap'},[table]),
    ]),
  ]);
}

function showDailySummary(){
  var dateVal=new Date().toISOString().slice(0,10);
  var contentEl=el('div',{});
  function load(){
    contentEl.innerHTML='';
    contentEl.appendChild(el('div',{cls:'hloading'},[el('div',{cls:'hspinner'},[]),' Loading...']));
    api('/daily-summary?date='+encodeURIComponent(dateVal)).then(function(d){
      contentEl.innerHTML='';
      var cur=CFG.currency||'N$';
      function fv(n){return cur+' '+Number(n||0).toFixed(2);}
      var diff=d.refunds>0?' (after '+fv(d.refunds)+' refunds)':'';
      contentEl.appendChild(el('div',{},[
        el('div',{cls:'hsumcards'},[
          scard('Revenue',    fv(d.revenue), d.orders+' orders'+diff),
          scard('Cash',       fv(d.cash),    ''),
          scard('Card',       fv(d.card),    ''),
          scard('EFT',        fv(d.eft),     ''),
        ]),
        d.top_products&&d.top_products.length?el('div',{cls:'hrep-card',style:{marginTop:'14px'}},[
          el('h3',{cls:'hrep-title'},['Top Products Today']),
          el('table',{cls:'htbl'},[
            el('thead',{},[el('tr',{},[th('Product'),th('Units'),th('Revenue')])]),
            el('tbody',{},d.top_products.map(function(r){return el('tr',{},[td(r.name),td(String(r.qty)),td(fv(r.total))]);})),
          ]),
        ]):el('p',{style:{padding:'14px',color:'#9ca3af',fontSize:'13px'}},['No sales today yet.']),
        el('div',{cls:'hr-acts',style:{marginTop:'14px'}},[
          el('button',{cls:'hbtn hbtn-primary',onClick:function(){
            var w=window.open('','_blank','width=700,height=900');
            if(!w){toast('Allow popups to print','err');return;}
            var rows=d.top_products&&d.top_products.length?d.top_products.map(function(r){return '<tr><td>'+esc(r.name)+'</td><td>'+r.qty+'</td><td>'+fv(r.total)+'</td></tr>';}).join(''):'<tr><td colspan="3" style="text-align:center;color:#999">No sales</td></tr>';
            w.document.write('<!DOCTYPE html><html><head><title>Daily Summary '+esc(dateVal)+'</title><style>body{font-family:Arial,sans-serif;padding:30px;font-size:13px;}h2{margin-bottom:10px;}table{width:100%;border-collapse:collapse;margin-top:14px;}th,td{border:1px solid #ddd;padding:8px;text-align:left;}th{background:#f5f5f5;font-weight:700;}@media print{button{display:none}}</style></head><body>');
            w.document.write('<h2>Daily Sales Summary â€” '+esc(dateVal)+'</h2>');
            w.document.write('<table><tr><th>Metric</th><th>Amount</th></tr>');
            w.document.write('<tr><td>Total Revenue</td><td>'+fv(d.revenue)+'</td></tr>');
            w.document.write('<tr><td>Orders</td><td>'+d.orders+'</td></tr>');
            w.document.write('<tr><td>Cash Sales</td><td>'+fv(d.cash)+'</td></tr>');
            w.document.write('<tr><td>Card Sales</td><td>'+fv(d.card)+'</td></tr>');
            w.document.write('<tr><td>EFT Sales</td><td>'+fv(d.eft)+'</td></tr>');
            w.document.write('<tr><td>Other/Wallets</td><td>'+fv(d.other)+'</td></tr>');
            w.document.write('<tr><td>Refunds</td><td>'+fv(d.refunds)+'</td></tr>');
            w.document.write('</table>');
            w.document.write('<h3 style="margin-top:20px">Top Selling Products</h3><table><tr><th>Product</th><th>Units</th><th>Revenue</th></tr>'+rows+'</table>');
            w.document.write('<br><button onclick="window.print()">ðŸ–¨ Print</button>');
            w.document.write('</body></html>');
            w.document.close();
          }},['ðŸ–¨ Print Summary']),
        ]),
      ]));
    }).catch(function(e){contentEl.innerHTML='';contentEl.appendChild(el('p',{style:{color:'#dc2626',padding:'14px'}},['Error: '+e.message]));});
  }

  var datePicker=el('input',{type:'date',cls:'hinp',value:dateVal,style:{width:'160px'}});
  datePicker.addEventListener('change',function(){dateVal=datePicker.value;load();});
  datePicker.addEventListener('keydown',function(e){e.stopPropagation();});

  var body=el('div',{},[
    el('div',{style:{display:'flex',gap:'8px',alignItems:'center',marginBottom:'14px'}},[
      el('label',{cls:'hlbl',style:{margin:0}},['Date:']),
      datePicker,
      el('button',{cls:'hbtn',onClick:function(){load();}},['Load']),
    ]),
    contentEl,
  ]);
  load();
  openModal('ðŸ“‹ Daily Sales Summary',body,'lg');
}
function rpCard(t,rows,hdrs,cells){return el('div',{cls:'hrep-card'},[el('h3',{cls:'hrep-title'},[t]),!rows.length?el('p',{cls:'hpage-meta'},['No data']):el('table',{cls:'htbl'},[el('thead',{},[el('tr',{},hdrs.map(th))]),el('tbody',{},rows.map(function(r){return el('tr',{},cells(r).map(td));}))])]);}
function barChart(daily){if(!daily.length)return[el('p',{cls:'hpage-meta'},['No data'])];var mx=Math.max.apply(null,daily.map(function(d){return d.total||0;}));return daily.slice(-14).map(function(d){var pct=mx>0?Math.round((d.total/mx)*100):0;return el('div',{cls:'hbar'},[el('div',{cls:'hbarbg'},[el('div',{cls:'hbarfill',style:{height:pct+'%'}},[])]),el('div',{cls:'hbarlbl'},[d.date?d.date.slice(5):''])]);}  );}

// â”€â”€ SETTINGS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// BUDGET & SALES TRACKER
// Financial year: March â†’ February
// All figures ex-VAT, currency N$
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

var BUDGET_MONTHS=['Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb'];
var BUDGET_FY_START=new Date().getMonth()>=2?new Date().getFullYear():new Date().getFullYear()-1; // Mar=2

function budgetPage(){
  var pin=CFG.budget_pin||'';

  // â”€â”€ PIN gate â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if(!S.budgetAuth){
    var now=Date.now();
    var locked=S.budgetLockUntil>now;
    var remaining=locked?Math.ceil((S.budgetLockUntil-now)/1000):0;

    var entered='';
    var errEl=el('div',{style:{color:'#dc2626',fontSize:'12px',minHeight:'18px',textAlign:'center',marginTop:'6px'}},[]);
    var dotsEl=el('div',{style:{display:'flex',gap:'10px',justifyContent:'center',margin:'18px 0'}},[]);

    function updateDots(){
      dotsEl.innerHTML='';
      for(var i=0;i<6;i++){
        var d=D.createElement('div');
        d.style.cssText='width:14px;height:14px;border-radius:50%;border:2px solid #cbd5e1;background:'+(i<entered.length?'#1a1a2e':'transparent')+';transition:background .15s;';
        dotsEl.appendChild(d);
      }
    }
    updateDots();

    function tryPin(){
      if(!pin){// No PIN set â€” auto-authenticate
        S.budgetAuth=true;redraw();return;
      }
      if(entered===String(pin)){
        S.budgetAuth=true;S.budgetAttempts=0;
        loadBudgetData();
        redraw();
      } else {
        S.budgetAttempts=(S.budgetAttempts||0)+1;
        entered='';updateDots();
        if(S.budgetAttempts>=3){
          S.budgetLockUntil=Date.now()+300000; // 5 min
          errEl.textContent='Too many attempts. Locked for 5 minutes.';
          setTimeout(function(){if(S.page==='budget')redraw();},1000);
        } else {
          errEl.textContent='Incorrect PIN. '+(3-S.budgetAttempts)+' attempts remaining.';
        }
      }
    }

    var keypad=el('div',{style:{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px',maxWidth:'220px',margin:'0 auto'}},
      [1,2,3,4,5,6,7,8,9,'',0,'âŒ«'].map(function(k){
        if(k===''){var e=D.createElement('div');return e;}
        var b=el('button',{style:{padding:'14px',fontSize:'18px',fontWeight:'600',borderRadius:'10px',border:'1.5px solid #e2e8f0',background:'#fff',cursor:'pointer',fontFamily:'inherit'}},
          [String(k)]);
        b.addEventListener('click',function(){
          if(locked)return;
          if(k==='âŒ«'){entered=entered.slice(0,-1);}
          else if(entered.length<6){entered+=String(k);}
          updateDots();
          if(entered.length>=4&&entered.length===String(pin).length)setTimeout(tryPin,120);
        });
        return b;
      })
    );

    var lockMsg=locked?el('div',{style:{color:'#dc2626',textAlign:'center',padding:'12px',fontSize:'13px'}},['ðŸ”’ Locked. Try again in '+remaining+'s.']):null;

    return el('div',{cls:'hpage',style:{display:'flex',alignItems:'center',justifyContent:'center'}},[
      el('div',{style:{background:'#fff',borderRadius:'16px',padding:'32px 28px',boxShadow:'0 8px 32px rgba(0,0,0,.12)',minWidth:'280px',textAlign:'center'}},[
        el('div',{style:{fontSize:'32px',marginBottom:'8px'}},['ðŸ’¼']),
        el('h2',{style:{fontSize:'18px',fontWeight:'700',marginBottom:'4px'}},['Budget & Sales Tracker']),
        el('p',{style:{fontSize:'12px',color:'#9ca3af',marginBottom:'16px'}},['Enter your owner PIN to access']),
        dotsEl,
        locked?lockMsg:keypad,
        errEl,
        !pin?el('p',{style:{fontSize:'11px',color:'#9ca3af',marginTop:'12px'}},['No PIN set. Go to Settings â†’ Budget PIN to add one.']):null,
      ]),
    ]);
  }

  // â”€â”€ Load data if needed â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if(!S.budgetLoaded){loadBudgetData();return el('div',{cls:'hpage'},[el('div',{cls:'hloading'},[el('div',{cls:'hspinner'}),' Loading budget...'])]);}

  var BD=S.budget; // budget data object

  // â”€â”€ Default budget data structure â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function defaultBudget(){
    var z12=function(){return [0,0,0,0,0,0,0,0,0,0,0,0];};
    return {
      fy: BUDGET_FY_START,
      cos_rate: 46,
      revenue:  {budget:z12(), lastYear:z12()},
      expenses: [
        {name:'Rent',         budget:z12(), lastYear:z12()},
        {name:'Utilities',    budget:z12(), lastYear:z12()},
        {name:'Packaging',    budget:z12(), lastYear:z12()},
        {name:'Advertising',  budget:z12(), lastYear:z12()},
        {name:'Subscriptions',budget:z12(), lastYear:z12()},
        {name:'Other',        budget:z12(), lastYear:z12()},
      ],
      ownerDraw:   z12(),
      staffWages:  {budget:z12(), lastYear:z12()},
      newHire:     {title:'Marketing',salary:0,startMonth:0},
      dailySales:  {},
      dailyOverride:{},
    };
  }
  if(!BD||!BD.revenue) BD=S.budget=defaultBudget();

  // â”€â”€ Actual sales per month from POS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  var actuals=new Array(12).fill(0);
  var salesData=S.budgetSalesData;
  if(salesData&&salesData.months){
    salesData.months.forEach(function(m,i){actuals[i]=m.total||0;});
  }

  // â”€â”€ Current month index in FY (0=Mar â€¦ 11=Feb) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  var now=new Date();
  var curYear=now.getFullYear();
  var curMon=now.getMonth(); // 0=Jan
  var fyMonths=[2,3,4,5,6,7,8,9,10,11,0,1]; // calendar month indices for Marâ€“Feb
  var curFYIdx=fyMonths.indexOf(curMon);
  if(curFYIdx===-1)curFYIdx=0;

  // â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function fmtN(n){return 'N$ '+(Math.round(n)||0).toLocaleString();}
  function sum(arr){return (arr||[]).reduce(function(a,b){return a+(parseFloat(b)||0);},0);}
  function pct(a,b){return b?Math.round(a/b*100):0;}

  function numInp(val,onchange,width){
    var i=D.createElement('input');
    i.type='number';i.min='0';i.step='1';i.value=Math.round(val||0);
    i.style.cssText='width:'+(width||72)+'px;border:1px solid #e2e8f0;border-radius:6px;padding:4px 6px;font-size:12px;font-family:inherit;text-align:right;';
    i.addEventListener('keydown',function(e){e.stopPropagation();});
    i.addEventListener('change',function(){onchange(parseFloat(this.value)||0);saveBudget();});
    return i;
  }

  function saveBudget(){
    api('/budget',{method:'POST',body:JSON.stringify(S.budget)}).catch(function(){});
  }

  // â”€â”€ Progress bar for current month â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function buildProgressBar(){
    var monthBudget=BD.revenue.budget[curFYIdx]||0;
    if(!monthBudget)return null;

    // Get daily sales for current month
    var calMonth=fyMonths[curFYIdx];
    var calYear=calMonth<=1?curYear:curYear; // Jan/Feb are next calendar year if FY started last year
    if(calMonth<=1&&curMon>=2)calYear=BUDGET_FY_START+1;
    var ym=sprintf2('%04d-%02d',BD.fy||BUDGET_FY_START,(calMonth===0?12:calMonth===1?13:calMonth));
    // Use actual POS data if loaded
    var dailyData={};
    if(salesData&&salesData.months&&salesData.months[curFYIdx]){
      dailyData=salesData.months[curFYIdx].daily||{};
    }
    // Apply manual overrides
    var overrides=BD.dailyOverride||{};
    Object.keys(overrides).forEach(function(d){dailyData[d]=overrides[d];});

    var daysInMonth=new Date(curYear,calMonth+1,0).getDate();
    var todayDay=now.getDate();
    var salesSoFar=Object.keys(dailyData).reduce(function(s,k){return s+(dailyData[k]||0);},0);
    var daysElapsed=Math.max(1,todayDay);
    var daysLeft=daysInMonth-daysElapsed;
    var dailyAvgActual=salesSoFar/daysElapsed;
    var projectedFull=dailyAvgActual*daysInMonth;
    var dailyNeeded=daysLeft>0?(monthBudget-salesSoFar)/daysLeft:0;
    var prog=monthBudget>0?Math.min(100,salesSoFar/monthBudget*100):0;
    var onTrack=projectedFull>=monthBudget*0.95;
    var behind10=projectedFull<monthBudget*0.90;
    var behind20=projectedFull<monthBudget*0.80;
    var barColor=behind20?'#dc2626':behind10?'#f59e0b':onTrack?'#16a34a':'#2563eb';

    return el('div',{style:{background:'#fff',border:'1px solid #e2e8f0',borderRadius:'12px',padding:'14px 16px',marginBottom:'16px'}},[
      el('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}},[
        el('div',{style:{fontWeight:'700',fontSize:'13px'}},['ðŸ“Š '+BUDGET_MONTHS[curFYIdx]+' Progress']),
        el('div',{style:{fontSize:'12px',color:'#6b7280'}},[ fmtN(salesSoFar)+' of '+fmtN(monthBudget)+' ('+Math.round(prog)+'%)']),
      ]),
      el('div',{style:{background:'#f1f5f9',borderRadius:'8px',height:'12px',overflow:'hidden',marginBottom:'10px'}},[
        el('div',{style:{width:prog+'%',background:barColor,height:'100%',borderRadius:'8px',transition:'width .5s'}},[]),
      ]),
      el('div',{style:{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',gap:'8px'}},[
        el('div',{style:{fontSize:'11px',color:'#6b7280'}},[el('b',{},[fmtN(salesSoFar)]),' sales to date']),
        el('div',{style:{fontSize:'11px',color:'#6b7280'}},[el('b',{},[fmtN(projectedFull)]),' projected full month']),
        el('div',{style:{fontSize:'11px',color:'#6b7280'}},[el('b',{},[fmtN(dailyAvgActual)]),' daily avg actual']),
        el('div',{style:{fontSize:'11px',color:dailyNeeded>dailyAvgActual*1.2?'#dc2626':'#16a34a'}},[el('b',{},[fmtN(dailyNeeded)]),' daily avg needed']),
        el('div',{style:{fontSize:'11px',color:'#6b7280'}},[el('b',{},[String(daysLeft)]),' days remaining']),
      ]),
    ]);
  }

  function sprintf2(fmt,a,b){return fmt.replace('%04d',('0000'+a).slice(-4)).replace('%02d',('00'+b).slice(-2));}

  // â”€â”€ TAB 1: Revenue & Gross Profit â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function buildRevenue(){
    var rev=BD.revenue;
    var cosRate=(BD.cos_rate||46)/100;

    // Slider
    var sliderVal=0;
    var previewRow=new Array(12).fill(0).map(function(_,i){return rev.budget[i]||0;});

    var sliderEl=D.createElement('input');
    sliderEl.type='range';sliderEl.min='-30';sliderEl.max='50';sliderEl.value='0';
    sliderEl.style.cssText='width:200px;accent-color:#2563eb;';
    var sliderLabel=el('span',{style:{fontSize:'13px',fontWeight:'700',color:'#2563eb',minWidth:'50px',display:'inline-block'}},['0%']);

    sliderEl.addEventListener('input',function(){
      sliderVal=parseInt(this.value);
      sliderLabel.textContent=(sliderVal>0?'+':'')+sliderVal+'%';
    });

    var applyBtn=el('button',{cls:'hbtn hbtn-primary',style:{fontSize:'12px'}},['Apply Growth']);
    applyBtn.addEventListener('click',function(){
      var mult=1+sliderVal/100;
      rev.budget=rev.budget.map(function(v){return Math.round((v||0)*mult);});
      saveBudget();
      rebuildTable();
    });

    var loadActualsBtn=el('button',{cls:'hbtn',style:{fontSize:'12px'}},['â†“ Load Last Year Actuals']);
    loadActualsBtn.addEventListener('click',function(){
      loadActualsBtn.textContent='Loadingâ€¦';loadActualsBtn.disabled=true;
      // Load previous FY
      var prevFY=(BD.fy||BUDGET_FY_START)-1;
      api('/budget-sales?fy='+prevFY).then(function(d){
        if(d.months){d.months.forEach(function(m,i){rev.lastYear[i]=m.total||0;});}
        saveBudget();rebuildTable();
        loadActualsBtn.textContent='â†“ Load Last Year Actuals';loadActualsBtn.disabled=false;
        toast('Last year actuals loaded','ok');
      }).catch(function(){loadActualsBtn.textContent='â†“ Load Last Year Actuals';loadActualsBtn.disabled=false;toast('Load failed','err');});
    });

    var tableWrap=D.createElement('div');

    function rebuildTable(){
      tableWrap.innerHTML='';
      var totalBudget=sum(rev.budget);
      var totalLY=sum(rev.lastYear);

      var thead=D.createElement('thead');
      var hr=D.createElement('tr');
      ['Month','Last Year (Actual)','Budget (editable)','COS @ '+BD.cos_rate+'%','Gross Profit','Margin %'].forEach(function(h){
        var t=D.createElement('th');t.textContent=h;hr.appendChild(t);
      });
      thead.appendChild(hr);

      var tbody=D.createElement('tbody');
      BUDGET_MONTHS.forEach(function(m,i){
        var budget=rev.budget[i]||0;
        var ly=rev.lastYear[i]||0;
        var cos=Math.round(budget*cosRate);
        var gp=budget-cos;
        var margin=budget>0?Math.round(gp/budget*100):0;
        var marginColor=margin<38?'#dc2626':margin<44?'#f59e0b':'#16a34a';
        var isCurrent=i===curFYIdx;

        var row=D.createElement('tr');
        if(isCurrent)row.style.background='#f0f9ff';

        var mTd=D.createElement('td');mTd.style.fontWeight=isCurrent?'700':'400';
        mTd.textContent=m+(isCurrent?' â†':'');row.appendChild(mTd);

        var lyTd=D.createElement('td');lyTd.textContent=fmtN(ly);lyTd.style.color='#6b7280';row.appendChild(lyTd);

        var budTd=D.createElement('td');
        var inp=numInp(budget,function(v){rev.budget[i]=v;rebuildTable();},90);
        budTd.appendChild(inp);row.appendChild(budTd);

        var cosTd=D.createElement('td');cosTd.textContent=fmtN(cos);cosTd.style.color='#dc2626';row.appendChild(cosTd);
        var gpTd=D.createElement('td');gpTd.textContent=fmtN(gp);gpTd.style.fontWeight='600';row.appendChild(gpTd);
        var mrgTd=D.createElement('td');mrgTd.textContent=margin+'%';mrgTd.style.cssText='font-weight:700;color:'+marginColor+';';row.appendChild(mrgTd);
        tbody.appendChild(row);
      });

      var tfoot=D.createElement('tfoot');
      var fr=D.createElement('tr');fr.style.cssText='font-weight:700;background:#f9fafb;';
      var totalCOS=Math.round(totalBudget*cosRate);
      var totalGP=totalBudget-totalCOS;
      var totalMargin=totalBudget>0?Math.round(totalGP/totalBudget*100):0;
      var mColor=totalMargin<38?'#dc2626':totalMargin<44?'#f59e0b':'#16a34a';
      [['TOTAL',''],['',fmtN(totalLY)],[fmtN(totalBudget)],[fmtN(totalCOS)],[fmtN(totalGP)],[totalMargin+'%']].forEach(function(pair,ci){
        var t=D.createElement('td');t.textContent=pair[0]!==undefined?pair[0]:pair;
        if(ci===0){t.textContent='TOTAL';t.appendChild(D.createElement('span'));}
        if(ci===1)t.textContent=fmtN(totalLY);
        if(ci===2)t.textContent=fmtN(totalBudget);
        if(ci===3){t.textContent=fmtN(totalCOS);t.style.color='#dc2626';}
        if(ci===4)t.textContent=fmtN(totalGP);
        if(ci===5){t.textContent=totalMargin+'%';t.style.color=mColor;}
        fr.appendChild(t);
      });
      tfoot.appendChild(fr);

      var tbl=D.createElement('table');tbl.className='htbl';
      tbl.appendChild(thead);tbl.appendChild(tbody);tbl.appendChild(tfoot);
      tableWrap.appendChild(tbl);

      // COS rate editor
      var cosDiv=D.createElement('div');
      cosDiv.style.cssText='margin-top:10px;font-size:12px;color:#6b7280;display:flex;align-items:center;gap:8px;';
      cosDiv.appendChild(D.createTextNode('COS rate: '));
      var cosInp=D.createElement('input');cosInp.type='number';cosInp.min='0';cosInp.max='100';cosInp.value=BD.cos_rate||46;
      cosInp.style.cssText='width:55px;border:1px solid #e2e8f0;border-radius:5px;padding:3px 6px;font-size:12px;';
      cosInp.addEventListener('keydown',function(e){e.stopPropagation();});
      cosInp.addEventListener('change',function(){BD.cos_rate=parseFloat(this.value)||46;saveBudget();rebuildTable();});
      cosDiv.appendChild(cosInp);
      cosDiv.appendChild(D.createTextNode('% â€” edit to match your actual cost of sales ratio'));
      tableWrap.appendChild(cosDiv);
    }
    rebuildTable();

    return el('div',{},[
      el('div',{style:{display:'flex',gap:'10px',alignItems:'center',flexWrap:'wrap',padding:'10px',background:'#f8fafc',borderRadius:'10px',border:'1px solid #e2e8f0',marginBottom:'14px'}},[
        el('span',{style:{fontSize:'12px',fontWeight:'600',color:'#374151'}},['Growth slider: ']),
        sliderEl, sliderLabel, applyBtn, loadActualsBtn,
      ]),
      el('div',{cls:'htable-wrap'},[tableWrap]),
    ]);
  }

  // â”€â”€ TAB 2: Expenses â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function buildExpenses(){
    var totalRevBudget=sum(BD.revenue.budget);
    var advCap=Math.round(totalRevBudget*0.05);

    var wrap=D.createElement('div');

    function rebuild(){
      wrap.innerHTML='';

      var addRow=el('div',{style:{display:'flex',gap:'8px',alignItems:'center',marginBottom:'10px',flexWrap:'wrap'}},[]);
      var nameInp=D.createElement('input');nameInp.className='hinp';nameInp.placeholder='Expense nameâ€¦';
      nameInp.style.cssText='flex:1;min-width:140px;font-size:12px;';
      nameInp.addEventListener('keydown',function(e){e.stopPropagation();});
      var addBtn=el('button',{cls:'hbtn',style:{fontSize:'12px'}},['+ Add Expense']);
      addBtn.addEventListener('click',function(){
        var nm=nameInp.value.trim();if(!nm)return;
        BD.expenses.push({name:nm,budget:new Array(12).fill(0),lastYear:new Array(12).fill(0)});
        nameInp.value='';saveBudget();rebuild();
      });
      addRow.appendChild(nameInp);addRow.appendChild(addBtn);
      wrap.appendChild(addRow);

      var thead=D.createElement('thead');var hr=D.createElement('tr');
      ['Expense','Last Year Total','Annual Budget','Monthly Avg','vs Last Year','% of Revenue'].forEach(function(h){var t=D.createElement('th');t.textContent=h;hr.appendChild(t);});
      thead.appendChild(hr);

      var tbody=D.createElement('tbody');
      var grandLY=0,grandBudget=0;

      BD.expenses.forEach(function(exp,ei){
        var lyTotal=sum(exp.lastYear);
        var budTotal=sum(exp.budget);
        var diff=budTotal-lyTotal;
        var diffColor=diff>0?'#dc2626':'#16a34a';
        var revPct=totalRevBudget>0?Math.round(budTotal/totalRevBudget*100):0;
        var avgMo=Math.round(budTotal/12);
        grandLY+=lyTotal;grandBudget+=budTotal;

        var row=D.createElement('tr');

        // Expense name (editable)
        var nameTd=D.createElement('td');
        var nameEl=D.createElement('input');nameEl.type='text';nameEl.value=exp.name;
        nameEl.style.cssText='border:none;background:transparent;font-weight:600;font-size:12px;width:130px;font-family:inherit;';
        nameEl.addEventListener('keydown',function(e){e.stopPropagation();});
        nameEl.addEventListener('change',function(){exp.name=this.value;saveBudget();});
        var delBtn=D.createElement('button');delBtn.textContent='âœ•';delBtn.style.cssText='border:none;background:none;color:#dc2626;cursor:pointer;font-size:11px;margin-left:4px;';
        delBtn.addEventListener('click',function(){BD.expenses.splice(ei,1);saveBudget();rebuild();});
        nameTd.appendChild(nameEl);nameTd.appendChild(delBtn);
        row.appendChild(nameTd);

        var lyTd=D.createElement('td');lyTd.textContent=fmtN(lyTotal);lyTd.style.color='#6b7280';row.appendChild(lyTd);

        // Budget â€” click to expand monthly inputs
        var budTd=D.createElement('td');
        var budSpan=D.createElement('span');budSpan.textContent=fmtN(budTotal);budSpan.style.cssText='font-weight:600;cursor:pointer;text-decoration:underline dotted;';
        budSpan.title='Click to edit monthly breakdown';
        var monthlyDiv=D.createElement('div');monthlyDiv.style.display='none';
        monthlyDiv.style.cssText='display:none;grid-template-columns:repeat(6,1fr);gap:4px;margin-top:6px;';
        BUDGET_MONTHS.forEach(function(m,mi){
          var mWrap=D.createElement('div');mWrap.style.cssText='display:flex;flex-direction:column;align-items:center;gap:2px;';
          var mLbl=D.createElement('span');mLbl.textContent=m;mLbl.style.cssText='font-size:9px;color:#9ca3af;';
          var mInp=numInp(exp.budget[mi],function(v){exp.budget[mi]=v;budSpan.textContent=fmtN(sum(exp.budget));saveBudget();},52);
          mWrap.appendChild(mLbl);mWrap.appendChild(mInp);monthlyDiv.appendChild(mWrap);
        });
        var expanded=false;
        budSpan.addEventListener('click',function(){expanded=!expanded;monthlyDiv.style.display=expanded?'grid':'none';});
        budTd.appendChild(budSpan);budTd.appendChild(monthlyDiv);row.appendChild(budTd);

        var avgTd=D.createElement('td');avgTd.textContent=fmtN(avgMo);row.appendChild(avgTd);

        var diffTd=D.createElement('td');diffTd.textContent=(diff>0?'+':'')+fmtN(diff);diffTd.style.color=diffColor;diffTd.style.fontWeight='600';row.appendChild(diffTd);
        var pctTd=D.createElement('td');pctTd.textContent=revPct+'%';row.appendChild(pctTd);

        tbody.appendChild(row);
      });

      var tfoot=D.createElement('tfoot');var fr=D.createElement('tr');fr.style.cssText='font-weight:700;background:#f9fafb;';
      var totalDiff=grandBudget-grandLY;
      [['TOTAL'],fmtN(grandLY),fmtN(grandBudget),'â€”',(totalDiff>0?'+':'')+fmtN(totalDiff),totalRevBudget>0?Math.round(grandBudget/totalRevBudget*100)+'%':'â€”'].forEach(function(v,ci){
        var t=D.createElement('td');t.textContent=ci===0?'TOTAL':v;
        if(ci===4)t.style.color=totalDiff>0?'#dc2626':'#16a34a';
        fr.appendChild(t);
      });
      tfoot.appendChild(fr);

      var tbl=D.createElement('table');tbl.className='htbl';
      tbl.appendChild(thead);tbl.appendChild(tbody);tbl.appendChild(tfoot);
      wrap.appendChild(el('div',{cls:'htable-wrap'},[tbl]));

      // Advertising note
      wrap.appendChild(el('div',{style:{marginTop:'10px',padding:'10px 14px',background:'#eff6ff',borderRadius:'8px',fontSize:'12px',color:'#1d4ed8',border:'1px solid #bfdbfe'}},
        ['ðŸ’¡ Recommended advertising cap: '+fmtN(advCap)+' (5% of budgeted revenue = '+fmtN(totalRevBudget)+')']));
    }
    rebuild();
    return wrap;
  }

  // â”€â”€ TAB 3: Salaries â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function buildSalaries(){
    var gpRate=1-(BD.cos_rate||46)/100;
    var totalRevBudget=sum(BD.revenue.budget);

    var wrap=D.createElement('div');

    function rebuild(){
      wrap.innerHTML='';

      // Section 1: Owner Draw
      var odSection=el('div',{style:{marginBottom:'18px'}},[
        el('h4',{style:{fontWeight:'700',fontSize:'13px',marginBottom:'8px',borderBottom:'1.5px solid #e2e8f0',paddingBottom:'6px'}},['ðŸ‘¤ Owner Draw']),
      ]);
      var odTotal=sum(BD.ownerDraw);
      var odTable=D.createElement('table');odTable.className='htbl';
      var odHead=D.createElement('thead');var ohr=D.createElement('tr');
      BUDGET_MONTHS.concat(['Annual Total']).forEach(function(m){var t=D.createElement('th');t.textContent=m;ohr.appendChild(t);});
      odHead.appendChild(ohr);odTable.appendChild(odHead);
      var odBody=D.createElement('tbody');var odr=D.createElement('tr');
      var runTotal=0;
      BUDGET_MONTHS.forEach(function(m,i){
        var td2=D.createElement('td');
        td2.appendChild(numInp(BD.ownerDraw[i],function(v){BD.ownerDraw[i]=v;rebuild();},68));
        odr.appendChild(td2);
      });
      var runTd=D.createElement('td');runTd.textContent=fmtN(odTotal);runTd.style.fontWeight='700';odr.appendChild(runTd);
      odBody.appendChild(odr);odTable.appendChild(odBody);
      odSection.appendChild(el('div',{cls:'htable-wrap'},[odTable]));
      wrap.appendChild(odSection);

      // Section 2: Staff Wages
      var swSection=el('div',{style:{marginBottom:'18px'}},[
        el('h4',{style:{fontWeight:'700',fontSize:'13px',marginBottom:'8px',borderBottom:'1.5px solid #e2e8f0',paddingBottom:'6px'}},['ðŸ‘¥ Staff Wages']),
      ]);
      var swLY=sum(BD.staffWages.lastYear);var swBudget=sum(BD.staffWages.budget);
      var swDiff=swBudget-swLY;
      var swTable=D.createElement('table');swTable.className='htbl';
      var swHead=D.createElement('thead');var swhr=D.createElement('tr');
      ['','Jan LY','Feb LY','Mar LY'].concat(BUDGET_MONTHS.map(function(m){return m+' Budget';})).concat(['LY Total','Budget Total','Change']).forEach(function(h){
        var t=D.createElement('th');t.textContent=h;swhr.appendChild(t);
      });
      // Simplified: just show annual LY, monthly budget inputs, totals
      swHead.innerHTML='';var r2=D.createElement('tr');
      ['Wages (Last Year Total)','Wages (Budget)'].forEach(function(h){var t=D.createElement('th');t.textContent=h;r2.appendChild(t);});
      BUDGET_MONTHS.forEach(function(m){var t=D.createElement('th');t.textContent=m;r2.appendChild(t);});
      ['Total','vs LY'].forEach(function(h){var t=D.createElement('th');t.textContent=h;r2.appendChild(t);});
      swHead.appendChild(r2);swTable.appendChild(swHead);
      var swBody=D.createElement('tbody');
      // Last year row
      var lyRow=D.createElement('tr');var lyLbl=D.createElement('td');lyLbl.textContent='Last Year';lyLbl.style.fontWeight='600';lyRow.appendChild(lyLbl);
      var lyTtl=D.createElement('td');lyTtl.textContent=fmtN(swLY);lyTtl.style.color='#6b7280';lyRow.appendChild(lyTtl);
      BUDGET_MONTHS.forEach(function(m,i){var t=D.createElement('td');t.textContent=fmtN(BD.staffWages.lastYear[i]||0);t.style.color='#9ca3af';t.style.fontSize='11px';lyRow.appendChild(t);});
      var lyT=D.createElement('td');lyT.textContent=fmtN(swLY);lyRow.appendChild(lyT);
      var lyC=D.createElement('td');lyC.textContent='â€”';lyRow.appendChild(lyC);
      swBody.appendChild(lyRow);
      // Budget row
      var budRow=D.createElement('tr');var budLbl=D.createElement('td');budLbl.textContent='Budget';budLbl.style.fontWeight='600';budRow.appendChild(budLbl);
      var budLYRef=D.createElement('td');budLYRef.textContent=fmtN(swLY);budLYRef.style.color='#6b7280';budRow.appendChild(budLYRef);
      BUDGET_MONTHS.forEach(function(m,i){
        var td3=D.createElement('td');
        td3.appendChild(numInp(BD.staffWages.budget[i],function(v){BD.staffWages.budget[i]=v;rebuild();},68));
        budRow.appendChild(td3);
      });
      var budTtl=D.createElement('td');budTtl.textContent=fmtN(swBudget);budTtl.style.fontWeight='700';budRow.appendChild(budTtl);
      var chgTd=D.createElement('td');chgTd.textContent=(swDiff>0?'+':'')+fmtN(swDiff);chgTd.style.cssText='font-weight:700;color:'+(swDiff>0?'#dc2626':'#16a34a')+';';budRow.appendChild(chgTd);
      swBody.appendChild(budRow);
      swTable.appendChild(swBody);
      swSection.appendChild(el('div',{cls:'htable-wrap'},[swTable]));
      wrap.appendChild(swSection);

      // Section 3: New Hire
      var nhSection=el('div',{style:{marginBottom:'18px'}},[
        el('h4',{style:{fontWeight:'700',fontSize:'13px',marginBottom:'8px',borderBottom:'1.5px solid #e2e8f0',paddingBottom:'6px'}},['ðŸ†• New Hire (Marketing / Other)']),
      ]);
      var nh=BD.newHire;
      var nhControls=el('div',{style:{display:'flex',gap:'12px',flexWrap:'wrap',alignItems:'center',marginBottom:'10px',fontSize:'12px'}},[]);
      var titleInp=D.createElement('input');titleInp.className='hinp';titleInp.value=nh.title||'';titleInp.placeholder='Position titleâ€¦';
      titleInp.style.cssText='width:160px;font-size:12px;';
      titleInp.addEventListener('keydown',function(e){e.stopPropagation();});
      titleInp.addEventListener('change',function(){nh.title=this.value;saveBudget();});
      nhControls.appendChild(el('label',{style:{fontSize:'12px',color:'#6b7280'}},['Position: ']));
      nhControls.appendChild(titleInp);

      var salInp=D.createElement('input');salInp.type='number';salInp.min='0';salInp.value=nh.salary||0;
      salInp.style.cssText='width:90px;border:1px solid #e2e8f0;border-radius:6px;padding:4px 6px;font-size:12px;';
      salInp.addEventListener('keydown',function(e){e.stopPropagation();});
      salInp.addEventListener('change',function(){nh.salary=parseFloat(this.value)||0;saveBudget();rebuild();});
      nhControls.appendChild(el('label',{style:{fontSize:'12px',color:'#6b7280'}},['Salary/month: N$ ']));
      nhControls.appendChild(salInp);

      var startSel=D.createElement('select');startSel.className='hsel';startSel.style.cssText='font-size:12px;';
      BUDGET_MONTHS.forEach(function(m,i){var o=D.createElement('option');o.value=i;o.textContent=m;if(i===nh.startMonth)o.selected=true;startSel.appendChild(o);});
      startSel.addEventListener('change',function(){nh.startMonth=parseInt(this.value);saveBudget();rebuild();});
      nhControls.appendChild(el('label',{style:{fontSize:'12px',color:'#6b7280'}},['Starts: ']));
      nhControls.appendChild(startSel);
      nhSection.appendChild(nhControls);

      if(nh.salary>0){
        var nhTable=D.createElement('table');nhTable.className='htbl';
        var nhHead=D.createElement('thead');var nhr=D.createElement('tr');
        ['Month','Salary Cost','Break-even Revenue Needed','Budget Revenue','Surplus vs Break-even'].forEach(function(h){var t=D.createElement('th');t.textContent=h;nhr.appendChild(t);});
        nhHead.appendChild(nhr);nhTable.appendChild(nhHead);
        var nhBody=D.createElement('tbody');
        var nhAnnual=0;
        BUDGET_MONTHS.forEach(function(m,i){
          if(i<nh.startMonth)return;
          nhAnnual+=nh.salary;
          var breakEven=gpRate>0?Math.round(nh.salary/gpRate):0;
          var budRev=BD.revenue.budget[i]||0;
          var surplus=budRev-breakEven;
          var row=D.createElement('tr');
          [m,fmtN(nh.salary),fmtN(breakEven),fmtN(budRev),(surplus>0?'+':'')+fmtN(surplus)].forEach(function(v,vi){
            var t=D.createElement('td');t.textContent=v;
            if(vi===4)t.style.cssText='font-weight:700;color:'+(surplus>0?'#16a34a':'#dc2626')+';';
            row.appendChild(t);
          });
          nhBody.appendChild(row);
        });
        nhTable.appendChild(nhBody);
        var nhFoot=D.createElement('tfoot');var nhFr=D.createElement('tr');nhFr.style.cssText='font-weight:700;background:#f9fafb;';
        ['Annual Cost',fmtN(nhAnnual),'','',''].forEach(function(v,vi){var t=D.createElement('td');t.textContent=vi===0?'Annual Cost':v;nhFr.appendChild(t);});
        nhFoot.appendChild(nhFr);nhTable.appendChild(nhFoot);
        nhSection.appendChild(el('div',{cls:'htable-wrap'},[nhTable]));
      }
      wrap.appendChild(nhSection);

      // Summary at bottom
      var totalOD=sum(BD.ownerDraw);
      var totalSW=sum(BD.staffWages.budget);
      var nhMonths=Math.max(0,12-(BD.newHire.startMonth||0));
      var totalNH=(BD.newHire.salary||0)*nhMonths;
      var totalSalaries=totalOD+totalSW+totalNH;
      var lyTotalSal=sum(BD.staffWages.lastYear);
      var salChange=totalSalaries-lyTotalSal;
      var salRevPct=totalRevBudget>0?Math.round(totalSalaries/totalRevBudget*100):0;
      wrap.appendChild(el('div',{style:{background:'#f9fafb',borderRadius:'10px',padding:'14px',border:'1px solid #e2e8f0',display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:'10px'}},[
        el('div',{},[el('div',{style:{fontSize:'11px',color:'#6b7280'}},['Owner Draw']),el('div',{style:{fontWeight:'700',fontSize:'14px'}},[fmtN(totalOD)])]),
        el('div',{},[el('div',{style:{fontSize:'11px',color:'#6b7280'}},['Staff Wages']),el('div',{style:{fontWeight:'700',fontSize:'14px'}},[fmtN(totalSW)])]),
        el('div',{},[el('div',{style:{fontSize:'11px',color:'#6b7280'}},['New Hire']),el('div',{style:{fontWeight:'700',fontSize:'14px'}},[fmtN(totalNH)])]),
        el('div',{},[el('div',{style:{fontSize:'11px',color:'#6b7280'}},['Total Salary Bill']),el('div',{style:{fontWeight:'700',fontSize:'16px',color:'#1a1a2e'}},[fmtN(totalSalaries)])]),
        el('div',{},[el('div',{style:{fontSize:'11px',color:'#6b7280'}},['vs Last Year']),el('div',{style:{fontWeight:'700',color:salChange>0?'#dc2626':'#16a34a'}},[( salChange>0?'+':'')+fmtN(salChange)])]),
        el('div',{},[el('div',{style:{fontSize:'11px',color:'#6b7280'}},['% of Revenue']),el('div',{style:{fontWeight:'700'}},[salRevPct+'%'])]),
      ]));
    }
    rebuild();
    return wrap;
  }

  // â”€â”€ TAB 4: Summary â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function buildSummary(){
    var cosRate=(BD.cos_rate||46)/100;
    var totalRevBudget=sum(BD.revenue.budget);
    var totalCOS=Math.round(totalRevBudget*cosRate);
    var totalGP=totalRevBudget-totalCOS;
    var totalExpenses=BD.expenses.reduce(function(s,e){return s+sum(e.budget);},0);
    var totalOD=sum(BD.ownerDraw);
    var totalSW=sum(BD.staffWages.budget);
    var nhMonths=Math.max(0,12-(BD.newHire.startMonth||0));
    var totalNH=(BD.newHire.salary||0)*nhMonths;
    var totalSalaries=totalOD+totalSW+totalNH;
    var totalAllExp=totalExpenses+totalSalaries;
    var netProfit=totalGP-totalAllExp;
    var netMargin=totalRevBudget>0?Math.round(netProfit/totalRevBudget*100):0;
    var ownerReturn=totalOD+Math.max(0,netProfit);

    var npColor=netProfit>0&&netMargin>10?'#16a34a':netProfit>0?'#f59e0b':'#dc2626';
    var npBg=netProfit>0&&netMargin>10?'#f0fdf4':netProfit>0?'#fffbeb':'#fff5f5';

    // KPI cards
    var kpis=el('div',{style:{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:'12px',marginBottom:'16px'}},[
      el('div',{style:{background:'#f0f9ff',borderRadius:'12px',padding:'16px',border:'1px solid #bfdbfe'}},[
        el('div',{style:{fontSize:'11px',color:'#2563eb',fontWeight:'700',marginBottom:'4px'}},['PROJECTED REVENUE']),
        el('div',{style:{fontSize:'20px',fontWeight:'800',color:'#1a1a2e'}},[fmtN(totalRevBudget)]),
      ]),
      el('div',{style:{background:'#f0fdf4',borderRadius:'12px',padding:'16px',border:'1px solid #86efac'}},[
        el('div',{style:{fontSize:'11px',color:'#16a34a',fontWeight:'700',marginBottom:'4px'}},['GROSS PROFIT']),
        el('div',{style:{fontSize:'20px',fontWeight:'800',color:'#1a1a2e'}},[fmtN(totalGP)]),
        el('div',{style:{fontSize:'11px',color:'#6b7280'}},['at '+(100-Math.round(cosRate*100))+'% margin']),
      ]),
      el('div',{style:{background:'#fff5f5',borderRadius:'12px',padding:'16px',border:'1px solid #fca5a5'}},[
        el('div',{style:{fontSize:'11px',color:'#dc2626',fontWeight:'700',marginBottom:'4px'}},['TOTAL EXPENSES']),
        el('div',{style:{fontSize:'20px',fontWeight:'800',color:'#1a1a2e'}},[fmtN(totalAllExp)]),
        el('div',{style:{fontSize:'11px',color:'#6b7280'}},['incl. salaries & owner draw']),
      ]),
      el('div',{style:{background:npBg,borderRadius:'12px',padding:'16px',border:'1px solid #e2e8f0'}},[
        el('div',{style:{fontSize:'11px',color:npColor,fontWeight:'700',marginBottom:'4px'}},['NET PROFIT']),
        el('div',{style:{fontSize:'20px',fontWeight:'800',color:npColor}},[fmtN(netProfit)]),
        el('div',{style:{fontSize:'11px',color:'#6b7280'}},[netMargin+'% net margin']),
      ]),
    ]);

    var ownerNote=el('div',{style:{background:'#eff6ff',border:'1px solid #bfdbfe',borderRadius:'10px',padding:'12px 16px',marginBottom:'16px',fontSize:'13px',color:'#1d4ed8'}},[
      'ðŸ‘¤ Total Owner Return: ',el('strong',{},[fmtN(ownerReturn)]),' (Draw: '+fmtN(totalOD)+(netProfit>0?' + Net Profit: '+fmtN(netProfit):' | Net Profit: '+fmtN(netProfit))+')',
    ]);

    // Month-by-month projection table
    var projTable=D.createElement('table');projTable.className='htbl';
    var projHead=D.createElement('thead');var pr=D.createElement('tr');
    ['Month','Revenue','Gross Profit','Expenses','Net Profit','Margin %',''].forEach(function(h){var t=D.createElement('th');t.textContent=h;pr.appendChild(t);});
    projHead.appendChild(pr);projTable.appendChild(projHead);
    var projBody=D.createElement('tbody');
    BUDGET_MONTHS.forEach(function(m,i){
      var rev=BD.revenue.budget[i]||0;
      var cos=Math.round(rev*cosRate);
      var gp=rev-cos;
      var monthExp=BD.expenses.reduce(function(s,e){return s+( e.budget[i]||0);},0);
      var monthOD=BD.ownerDraw[i]||0;
      var monthSW=BD.staffWages.budget[i]||0;
      var monthNH=i>=(BD.newHire.startMonth||0)?(BD.newHire.salary||0):0;
      var monthTotalExp=monthExp+monthOD+monthSW+monthNH;
      var np=gp-monthTotalExp;
      var mg=rev>0?Math.round(np/rev*100):0;
      var npC=np>0?'#16a34a':'#dc2626';
      var hasNH=i>=(BD.newHire.startMonth||0)&&(BD.newHire.salary||0)>0;
      var isCur=i===curFYIdx;
      var row=D.createElement('tr');if(isCur)row.style.background='#f0f9ff';
      [m+(hasNH?' ðŸ†•':'')+(isCur?' â†':''),fmtN(rev),fmtN(gp),fmtN(monthTotalExp),fmtN(np),mg+'%'].forEach(function(v,vi){
        var t=D.createElement('td');t.textContent=v;
        if(vi===4){t.style.color=npC;t.style.fontWeight='700';}
        if(vi===5){t.style.color=mg>0?'#16a34a':'#dc2626';}
        row.appendChild(t);
      });
      // Actual vs budget indicator
      var actTd=D.createElement('td');
      if(actuals[i]>0&&rev>0){
        var actPct=Math.round(actuals[i]/rev*100);
        var actColor=actPct>=90?'#16a34a':actPct>=70?'#f59e0b':'#dc2626';
        actTd.innerHTML='<span style="font-size:10px;font-weight:700;color:'+actColor+'">Actual: '+actPct+'%</span>';
      }
      row.appendChild(actTd);
      projBody.appendChild(row);
    });
    projTable.appendChild(projBody);
    // Totals footer
    var pf=D.createElement('tfoot');var pfr=D.createElement('tr');pfr.style.cssText='font-weight:700;background:#f9fafb;';
    var npC2=netProfit>0?'#16a34a':'#dc2626';
    [['TOTAL'],fmtN(totalRevBudget),fmtN(totalGP),fmtN(totalAllExp),fmtN(netProfit),netMargin+'%',''].forEach(function(v,vi){
      var t=D.createElement('td');t.textContent=vi===0?'TOTAL':v;
      if(vi===4){t.style.color=npC2;t.style.fontWeight='800';}
      pfr.appendChild(t);
    });
    pf.appendChild(pfr);projTable.appendChild(pf);

    // Simple bar chart: Budget vs Actual for completed months
    var chartData=BUDGET_MONTHS.map(function(m,i){
      return{label:m,budget:BD.revenue.budget[i]||0,actual:actuals[i]||0};
    }).filter(function(d){return d.budget>0||d.actual>0;});
    var maxVal=Math.max.apply(null,chartData.map(function(d){return Math.max(d.budget,d.actual);}));
    var chartEl=el('div',{style:{display:'flex',alignItems:'flex-end',gap:'6px',height:'100px',padding:'8px 0'}},[]);
    chartData.forEach(function(d){
      var grp=el('div',{style:{display:'flex',flexDirection:'column',alignItems:'center',gap:'2px',flex:'1',minWidth:'0'}},[]);
      var bars=el('div',{style:{display:'flex',gap:'2px',alignItems:'flex-end',width:'100%',height:'80px'}},[]);
      var bh=maxVal>0?Math.max(2,Math.round(d.budget/maxVal*76)):0;
      var ah=maxVal>0?Math.max(2,Math.round(d.actual/maxVal*76)):0;
      var bb=el('div',{style:{flex:'1',height:bh+'px',background:'#bfdbfe',borderRadius:'3px 3px 0 0',minHeight:'2px'}},[]); bb.title='Budget: '+fmtN(d.budget);
      var ab=el('div',{style:{flex:'1',height:ah+'px',background:d.actual>=d.budget*0.9?'#4ade80':d.actual>0?'#fb923c':'transparent',borderRadius:'3px 3px 0 0',minHeight:d.actual>0?'2px':'0'}},[]); ab.title='Actual: '+fmtN(d.actual);
      bars.appendChild(bb);bars.appendChild(ab);
      grp.appendChild(bars);
      grp.appendChild(el('div',{style:{fontSize:'9px',color:'#9ca3af',textAlign:'center'}},[d.label]));
      chartEl.appendChild(grp);
    });

    // Export PDF button
    var exportBtn=el('button',{cls:'hbtn hbtn-primary',style:{marginTop:'12px'},onClick:function(){printBudgetSummary(totalRevBudget,totalGP,totalAllExp,netProfit,netMargin,ownerReturn);}},['ðŸ–¨ Export / Print Summary']);

    // PIN change
    var changePinSection=el('div',{style:{marginTop:'20px',padding:'14px',background:'#f8fafc',borderRadius:'10px',border:'1px solid #e2e8f0'}},[
      el('h4',{style:{fontWeight:'700',fontSize:'13px',marginBottom:'10px'}},['ðŸ”‘ Change Budget PIN']),
    ]);
    var newPin1=D.createElement('input');newPin1.type='password';newPin1.placeholder='New PIN (4-6 digits)';newPin1.maxLength=6;newPin1.style.cssText='width:140px;border:1px solid #e2e8f0;border-radius:6px;padding:6px 10px;font-size:13px;margin-right:8px;font-family:inherit;';
    newPin1.addEventListener('keydown',function(e){e.stopPropagation();});
    var newPin2=D.createElement('input');newPin2.type='password';newPin2.placeholder='Confirm PIN';newPin2.maxLength=6;newPin2.style.cssText='width:140px;border:1px solid #e2e8f0;border-radius:6px;padding:6px 10px;font-size:13px;margin-right:8px;font-family:inherit;';
    newPin2.addEventListener('keydown',function(e){e.stopPropagation();});
    var pinSaveBtn=el('button',{cls:'hbtn hbtn-primary',style:{fontSize:'12px'},onClick:function(){
      if(newPin1.value.length<4){toast('PIN must be 4-6 digits','err');return;}
      if(newPin1.value!==newPin2.value){toast('PINs do not match','err');return;}
      api('/settings',{method:'POST',body:JSON.stringify({budget_pin:newPin1.value})}).then(function(r){
        if(r.success){CFG.budget_pin=newPin1.value;toast('Budget PIN updated','ok');newPin1.value='';newPin2.value='';}
        else{toast('Save failed','err');}
      }).catch(function(e){toast('Error: '+e.message,'err');});
    }},['Save New PIN']);
    changePinSection.appendChild(newPin1);
    changePinSection.appendChild(newPin2);
    changePinSection.appendChild(pinSaveBtn);

    return el('div',{},[kpis,ownerNote,
      el('div',{cls:'hrep-card'},[
        el('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px'}},[
          el('h3',{cls:'hrep-title',style:{marginBottom:'0'}},['ðŸ“… Month-by-Month Projection â€” FY '+BD.fy+'/'+(BD.fy+1)]),
          el('div',{style:{fontSize:'11px',color:'#9ca3af',display:'flex',gap:'12px'}},[
            el('span',{style:{display:'flex',alignItems:'center',gap:'4px'}},[el('div',{style:{width:'12px',height:'12px',background:'#bfdbfe',borderRadius:'2px'}},[]),' Budget']),
            el('span',{style:{display:'flex',alignItems:'center',gap:'4px'}},[el('div',{style:{width:'12px',height:'12px',background:'#4ade80',borderRadius:'2px'}},[]),' Actual (on track)']),
          ]),
        ]),
        el('div',{style:{marginBottom:'10px'}},[chartEl]),
        el('div',{cls:'htable-wrap'},[projTable]),
        exportBtn,
      ]),
      changePinSection,
    ]);
  }

  function printBudgetSummary(rev,gp,exp,np,npm,or2){
    var w=window.open('','_blank','width=750,height=900');
    if(!w){toast('Allow popups to print','err');return;}
    var cosRate=(BD.cos_rate||46);
    w.document.write('<!DOCTYPE html><html><head><title>Budget Summary â€” FY '+BD.fy+'/'+(BD.fy+1)+'</title><style>body{font-family:Arial,sans-serif;padding:30px;font-size:12px;color:#111;}h1{font-size:18px;margin-bottom:4px;}table{width:100%;border-collapse:collapse;margin:12px 0;}th,td{border:1px solid #ddd;padding:6px 10px;text-align:left;}th{background:#f5f5f5;font-weight:700;}tr:nth-child(even){background:#fafafa;}.kpi{display:inline-block;padding:10px 16px;margin:4px;border-radius:8px;border:1px solid #ddd;min-width:150px;}.kpi-label{font-size:10px;color:#888;font-weight:700;text-transform:uppercase;}.kpi-val{font-size:18px;font-weight:800;}@media print{button{display:none}}</style></head><body>');
    w.document.write('<h1>Budget & Sales Tracker â€” FY '+BD.fy+'/'+(BD.fy+1)+'</h1>');
    w.document.write('<p style="color:#888;font-size:11px">All figures ex-VAT &nbsp;|&nbsp; Currency: N$ &nbsp;|&nbsp; COS rate: '+cosRate+'%</p>');
    w.document.write('<div style="margin:16px 0">');
    [['Projected Revenue','N$ '+rev.toLocaleString()],['Gross Profit','N$ '+gp.toLocaleString()],['Total Expenses','N$ '+exp.toLocaleString()],['Net Profit','N$ '+np.toLocaleString()+' ('+npm+'%)'],['Owner Return','N$ '+or2.toLocaleString()]].forEach(function(k){
      w.document.write('<div class="kpi"><div class="kpi-label">'+k[0]+'</div><div class="kpi-val">'+k[1]+'</div></div>');
    });
    w.document.write('</div>');
    w.document.write('<h3>Month-by-Month Projection</h3><table><tr><th>Month</th><th>Revenue Budget</th><th>Gross Profit</th><th>Expenses</th><th>Net Profit</th><th>Margin</th><th>Actual Sales</th></tr>');
    var cosRateD=cosRate/100;
    BUDGET_MONTHS.forEach(function(m,i){
      var rv=BD.revenue.budget[i]||0;var cos2=Math.round(rv*cosRateD);var gp2=rv-cos2;
      var mExp=BD.expenses.reduce(function(s,e){return s+(e.budget[i]||0);},0)+(BD.ownerDraw[i]||0)+(BD.staffWages.budget[i]||0)+(i>=(BD.newHire.startMonth||0)?(BD.newHire.salary||0):0);
      var np2=gp2-mExp;var mg=rv>0?Math.round(np2/rv*100):0;
      w.document.write('<tr><td>'+m+'</td><td>N$ '+rv.toLocaleString()+'</td><td>N$ '+gp2.toLocaleString()+'</td><td>N$ '+mExp.toLocaleString()+'</td><td style="color:'+(np2>0?'green':'red')+'">N$ '+np2.toLocaleString()+'</td><td>'+mg+'%</td><td>N$ '+(actuals[i]||0).toLocaleString()+'</td></tr>');
    });
    w.document.write('</table>');
    w.document.write('<br><button onclick="window.print()">ðŸ–¨ Print</button></body></html>');
    w.document.close();
  }

  // â”€â”€ Load budget data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function loadBudgetData(){
    if(S.budgetLoaded)return;
    api('/budget').then(function(d){
      S.budget=d&&d.revenue?d:null;
      S.budgetLoaded=true;
      // Load current FY sales data
      if(!S.budgetSalesLoaded){
        api('/budget-sales?fy='+(d&&d.fy?d.fy:BUDGET_FY_START)).then(function(sd){
          S.budgetSalesData=sd;S.budgetSalesLoaded=true;
          if(S.page==='budget')redraw();
        }).catch(function(){S.budgetSalesLoaded=true;if(S.page==='budget')redraw();});
      }
      if(S.page==='budget')redraw();
    }).catch(function(){S.budgetLoaded=true;if(S.page==='budget')redraw();});
  }

  // â”€â”€ FY selector â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  var fyEl=D.createElement('select');fyEl.className='hsel';fyEl.style.cssText='font-size:12px;';
  var curFY=BD.fy||BUDGET_FY_START;
  for(var fy=curFY-2;fy<=curFY+2;fy++){
    var opt=D.createElement('option');opt.value=fy;opt.textContent='FY '+fy+'/'+(fy+1)+' (Mar '+fy+' â€“ Feb '+(fy+1)+')';if(fy===curFY)opt.selected=true;
    fyEl.appendChild(opt);
  }
  fyEl.addEventListener('change',function(){BD.fy=parseInt(this.value);S.budgetSalesLoaded=false;S.budgetSalesData=null;saveBudget();loadBudgetData();redraw();});

  var lockBtn=el('button',{cls:'hbtn',style:{fontSize:'12px',color:'#dc2626',borderColor:'#dc2626'},onClick:function(){S.budgetAuth=false;redraw();}},['ðŸ”’ Lock']);

  // â”€â”€ Tab content â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  var tabContent=D.createElement('div');
  var progressBar=buildProgressBar();

  function renderTab(){
    tabContent.innerHTML='';
    if(progressBar)tabContent.appendChild(progressBar);
    var content=S.budgetTab==='revenue'?buildRevenue():
                S.budgetTab==='expenses'?buildExpenses():
                S.budgetTab==='salaries'?buildSalaries():
                buildSummary();
    tabContent.appendChild(content);
  }
  renderTab();

  return el('div',{cls:'hpage',style:{overflow:'hidden',display:'flex',flexDirection:'column'}},[
    el('div',{cls:'hpage-head'},[
      el('h2',{cls:'hpage-title'},['ðŸ’¼ Budget & Sales Tracker']),
      el('div',{style:{display:'flex',gap:'8px',alignItems:'center'}},[fyEl,lockBtn]),
    ]),
    el('div',{cls:'htabs',style:{padding:'0 20px',borderBottom:'1.5px solid var(--bd)',flexShrink:'0'}},[
      el('button',{cls:'htab'+(S.budgetTab==='revenue'?' active':''),onClick:function(){S.budgetTab='revenue';renderTab();}},['ðŸ“ˆ Revenue & GP']),
      el('button',{cls:'htab'+(S.budgetTab==='expenses'?' active':''),onClick:function(){S.budgetTab='expenses';renderTab();}},['ðŸ’¸ Expenses']),
      el('button',{cls:'htab'+(S.budgetTab==='salaries'?' active':''),onClick:function(){S.budgetTab='salaries';renderTab();}},['ðŸ‘¥ Salaries']),
      el('button',{cls:'htab'+(S.budgetTab==='summary'?' active':''),onClick:function(){S.budgetTab='summary';renderTab();}},['ðŸ“Š Summary']),
    ]),
    el('div',{style:{flex:'1',overflowY:'auto',padding:'16px 20px'}},[tabContent]),
  ]);
}

function settingsPage(){
  var vals=Object.assign({},CFG);
  return el('div',{cls:'hpage'},[
    el('div',{cls:'hpage-head'},[el('h2',{cls:'hpage-title'},['Settings'])]),
    el('div',{cls:'hpage-body'},[
      el('div',{cls:'hrep-card',style:{maxWidth:'600px'}},[
        el('h3',{cls:'hrep-title'},['Store & Receipt Details']),
        el('div',{cls:'hform'},[
          frow([sf('Store Name',vals,'store_name'),sf('Location',vals,'location')]),
          sf('Store Address',vals,'store_address'),
          frow([sf('Phone',vals,'store_phone'),sf('Email',vals,'store_email')]),
          frow([sf('VAT Number',vals,'vat_number'),sf('Currency Symbol',vals,'currency')]),
          frow([sf('Staff PIN (POS login â€” leave blank to disable)',vals,'staff_pin'),sf('Default Print Width',vals,'print_width_default'?'print_width_default':'print_width_default')]),
          el('div',{cls:'hfield'},[
            el('label',{cls:'hlbl'},['Default Print Width']),
            el('select',{cls:'hinp',onChange:function(e){S.printWidth=e.target.value;try{localStorage.setItem('hpos_printwidth',e.target.value);}catch(err){}}},[
              el('option',{value:'80mm',selected:S.printWidth==='80mm'},['80mm Receipt Printer']),
              el('option',{value:'58mm',selected:S.printWidth==='58mm'},['58mm Thermal Printer']),
              el('option',{value:'a4',  selected:S.printWidth==='a4'},  ['A4 Paper']),
            ]),
          ]),
          el('div',{cls:'hfield'},[
            el('label',{cls:'hlbl'},['Logo URL â€” paste URL to your store logo image']),
            (function(){
              var li=el('input',{cls:'hinp',type:'url',placeholder:'https://yoursite.com/logo.png',value:vals.logo_url||''});
              li.addEventListener('input',function(){vals.logo_url=li.value;});
              li.addEventListener('keydown',function(e){e.stopPropagation();});
              // preview
              var prev=el('div',{cls:'hlogo-prev'},[]);
              function updatePrev(){prev.innerHTML='';if(li.value){var img=el('img',{src:li.value,alt:'logo',style:{maxHeight:'50px',maxWidth:'160px',borderRadius:'4px',marginTop:'6px',border:'1px solid #eee'}});prev.appendChild(img);}}
              li.addEventListener('blur',updatePrev);
              if(vals.logo_url)setTimeout(updatePrev,50);
              return el('div',{},[li,prev]);
            })(),
          ]),
          el('div',{cls:'hfield'},[
            el('label',{cls:'hlbl'},['Receipt Footer Message']),
            (function(){var ta=el('textarea',{cls:'hinp',rows:'3'},[vals.receipt_footer||'']);ta.addEventListener('input',function(){vals.receipt_footer=ta.value;});ta.addEventListener('keydown',function(e){e.stopPropagation();});return ta;})(),
          ]),
          el('button',{cls:'hbtn hbtn-primary hbtn-full',style:{marginTop:'12px'},onClick:function(){
            api('/settings',{method:'POST',body:JSON.stringify(vals)}).then(function(){
              Object.assign(CFG,vals);
              toast('Settings saved!','ok');
            }).catch(function(e){toast(e.message,'err');});
          }},['ðŸ’¾ Save Settings']),
        ]),
        el('hr',{style:{margin:'18px 0',borderColor:'#eee'}},[]),
        el('h3',{cls:'hrep-title'},['Quick Links']),
        el('div',{cls:'hform'},[
          el('a',{cls:'hbtn',href:SITE_URL+'/wp-admin/edit.php?post_type=product',target:'_blank',style:{display:'block',marginBottom:'6px'}},['ðŸ“¦ Products']),
          el('a',{cls:'hbtn',href:SITE_URL+'/wp-admin/users.php',target:'_blank',style:{display:'block',marginBottom:'6px'}},['ðŸ‘¥ Customers']),
          el('a',{cls:'hbtn',href:SITE_URL+'/wp-admin/admin.php?page=wc-settings&tab=shipping',target:'_blank',style:{display:'block',marginBottom:'6px'}},['ðŸšš Shipping Zones']),
          el('a',{cls:'hbtn',href:SITE_URL+'/wp-admin/edit.php?post_type=shop_order',target:'_blank',style:{display:'block'}},['ðŸ“‹ All WC Orders']),
        ]),
      ]),
      // â”€â”€ Reports PIN card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      el('div',{cls:'hrep-card',style:{maxWidth:'600px',marginTop:'18px'}},[
        el('h3',{cls:'hrep-title'},['ðŸ”’ Reports PIN']),
        el('p',{style:{fontSize:'12px',color:'#6b7280',marginBottom:'14px'}},['This PIN protects sensitive report sections (Inventory Values, VAT, Delivery). It is separate from the Staff PIN used to log in to the POS.']),
        el('div',{cls:'hform'},[
          (function(){
            var rpin=el('input',{cls:'hinp',type:'password',placeholder:'Enter 4-digit PIN',value:vals.reports_pin||'',style:{maxWidth:'200px',letterSpacing:'4px',fontSize:'18px',textAlign:'center'}});
            rpin.addEventListener('input',function(){vals.reports_pin=rpin.value.replace(/\D/g,'').slice(0,4);rpin.value=vals.reports_pin;});
            rpin.addEventListener('keydown',function(e){e.stopPropagation();});
            return el('div',{cls:'hfield'},[
              el('label',{cls:'hlbl'},['Reports PIN (4 digits)']),
              rpin,
              el('p',{style:{fontSize:'11px',color:'#9ca3af',marginTop:'4px'}},['Leave blank to disable PIN protection on reports.']),
            ]);
          })(),
          el('button',{cls:'hbtn hbtn-primary',style:{marginTop:'8px'},onClick:function(){
            api('/settings',{method:'POST',body:JSON.stringify({reports_pin:vals.reports_pin||''})}).then(function(){
              CFG.reports_pin=vals.reports_pin||'';
              S.repPinAuth=false;
              toast('Reports PIN saved!','ok');
            }).catch(function(e){toast(e.message,'err');});
          }},['ðŸ’¾ Save Reports PIN']),
          el('div',{style:{marginTop:'16px',borderTop:'1px solid #e2e8f0',paddingTop:'14px'}},[
            (function(){
              var bpin=el('input',{cls:'hinp',type:'password',placeholder:'4â€“6 digit PIN',value:vals.budget_pin||'',style:{maxWidth:'200px',letterSpacing:'4px',fontSize:'18px',textAlign:'center'}});
              bpin.addEventListener('input',function(){vals.budget_pin=bpin.value.replace(/\D/g,'').slice(0,6);bpin.value=vals.budget_pin;});
              bpin.addEventListener('keydown',function(e){e.stopPropagation();});
              return el('div',{cls:'hfield'},[
                el('label',{cls:'hlbl'},['Budget Tracker PIN (4â€“6 digits)']),
                bpin,
                el('p',{style:{fontSize:'11px',color:'#9ca3af',marginTop:'4px'}},['Protects the Budget & Sales Tracker. Leave blank for no PIN.']),
              ]);
            })(),
            el('button',{cls:'hbtn hbtn-primary',style:{marginTop:'8px'},onClick:function(){
              api('/settings',{method:'POST',body:JSON.stringify({budget_pin:vals.budget_pin||''})}).then(function(){
                CFG.budget_pin=vals.budget_pin||'';
                S.budgetAuth=false;
                toast('Budget PIN saved!','ok');
              }).catch(function(e){toast(e.message,'err');});
            }},['ðŸ’¾ Save Budget PIN']),
          ]),
        ]),
      ]),
    ]),
  ]);
}
function sf(label,obj,key){var inp=el('input',{cls:'hinp',type:'text',value:obj[key]||''});inp.addEventListener('input',function(){obj[key]=inp.value;});inp.addEventListener('keydown',function(e){e.stopPropagation();});return el('div',{cls:'hfield'},[el('label',{cls:'hlbl'},[label]),inp]);}

// â”€â”€ MODAL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
var MODAL_EL=null;
function openModal(title,body,size){
  closeModal();
  var ov=el('div',{cls:'hmodal-ov'},[]);
  var m=el('div',{cls:'hmodal hmodal-'+size},[
    el('div',{cls:'hmodal-hdr'},[
      el('span',{cls:'hmodal-title'},[title]),
      el('button',{cls:'hmodal-cls',onClick:closeModal},['âœ•']),
    ]),
    el('div',{cls:'hmodal-body'},[body]),
  ]);
  ov.appendChild(m);
  ov.addEventListener('click',function(e){if(e.target===ov)closeModal();});
  D.body.appendChild(ov);
  MODAL_EL=ov;
  setTimeout(function(){var f=m.querySelector('input:not([disabled])');if(f)f.focus();},60);
}
function closeModal(){if(MODAL_EL){MODAL_EL.remove();MODAL_EL=null;}}

// â”€â”€ PIN LOGIN MODAL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function showPinModal(correctPin){
  var entered='';
  var ov=el('div',{cls:'hpin-ov'},[]);
  var errEl=el('div',{cls:'hpin-err'},[]);

  function updateDisplay(){
    var disp=D.getElementById('hpin-disp');
    if(disp)disp.textContent=entered.replace(/./g,'â—');
  }
  function tryPin(){
    if(entered===String(correctPin)){
      S.pinUnlocked=true;
      ov.remove();
      if(S.page==='pos')loadProducts();
    } else {
      errEl.textContent='Incorrect PIN. Try again.';
      entered='';
      updateDisplay();
    }
  }

  var disp=el('div',{cls:'hpin-display',id:'hpin-disp'},[' ']);
  var numpad=el('div',{cls:'hpin-numpad'},[]);
  ['1','2','3','4','5','6','7','8','9','âœ•','0','âœ“'].forEach(function(k){
    var b=el('button',{cls:'hpin-btn'+(k==='âœ“'?' hpin-ok':k==='âœ•'?' hpin-del':'')},[ k]);
    b.addEventListener('click',function(){
      if(k==='âœ“'){tryPin();}
      else if(k==='âœ•'){entered=entered.slice(0,-1);updateDisplay();errEl.textContent='';}
      else{entered+=k;updateDisplay();}
    });
    numpad.appendChild(b);
  });

  var inner=el('div',{cls:'hpin-box'},[
    CFG.logo_url?el('img',{src:CFG.logo_url,cls:'hpin-logo',alt:'logo'}):null,
    el('div',{cls:'hpin-title'},[CFG.store_name||'Hambelela POS']),
    el('div',{cls:'hpin-sub'},['Enter your PIN to continue']),
    disp,
    numpad,
    errEl,
  ]);
  ov.appendChild(inner);
  D.body.appendChild(ov);
  MODAL_EL=null; // don't register as modal so it can't be closed
}

// â”€â”€ SMALL HELPERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function th(t){return el('th',{},[t]);}
function td(v){return el('td',{},[typeof v==='string'||typeof v==='number'?String(v):v]);}
function badge(c,t){return el('span',{cls:'hbadge hbadge-'+c},[t]);}
function sbadge(s){var m={completed:'green',processing:'yellow','on-hold':'blue',cancelled:'red',refunded:'red',pending:'grey'};return badge(m[s]||'grey',s);}
function scard(l,v,sub,cls){return el('div',{cls:'hscard'},[el('div',{cls:'hscard-label'},[l]),el('div',{cls:'hscard-value'+(cls?' hsc-'+cls:'')},[v]),sub?el('div',{cls:'hscard-sub'},[sub]):null]);}
function exportCSV(items){var rows=[['Name','Attributes','SKU','Price','Cost','Stock Qty','Stock Value','Retail Value']];items.forEach(function(i){rows.push(['"'+(i.name||'').replace(/"/g,'""')+'"','"'+(i.attributes||'')+'"',i.sku||'',i.price||0,i.cost||0,i.stock_qty||0,(i.stock_value||0).toFixed(2),(i.retail_value||0).toFixed(2)]);});var csv=rows.map(function(r){return r.join(',');}).join('\n');var a=D.createElement('a');a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv);a.download='inventory-'+new Date().toISOString().slice(0,10)+'.csv';a.click();toast('Exported!','ok');}
function frow(children){return el('div',{cls:'hfrow'},children);}
function ff(label,type,obj,key){var inp=el('input',{cls:'hinp',type:type,value:obj[key]||''});inp.addEventListener('input',function(){obj[key]=inp.value;});inp.addEventListener('keydown',function(e){e.stopPropagation();});return el('div',{cls:'hfield'},[el('label',{cls:'hlbl'},[label]),inp]);}
function ffObj(label,obj,key){var inp=el('input',{cls:'hinp',type:'text',value:obj[key]||''});inp.addEventListener('input',function(){obj[key]=inp.value;});inp.addEventListener('keydown',function(e){e.stopPropagation();});return el('div',{cls:'hfield'},[el('label',{cls:'hlbl'},[label]),inp]);}
function staticField(label,value){return el('div',{cls:'hfield'},[el('label',{cls:'hlbl'},[label]),el('input',{cls:'hinp',value:value,disabled:true})]);}
function regSel(obj,key,onChange){
  var sel=el('select',{cls:'hinp'});
  NAM_REGIONS.forEach(function(r){var o=el('option',{value:r.code,selected:r.code===(obj[key]||'KH')},[r.name]);sel.appendChild(o);});
  sel.addEventListener('change',function(){obj[key]=sel.value;var r=NAM_REGIONS.find(function(x){return x.code===sel.value;});if(r&&onChange)onChange(r);});
  return el('div',{cls:'hfield'},[el('label',{cls:'hlbl'},['Region']),sel]);
}

// â”€â”€ COUPON â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function applyCoupon(){
  var code=(S.coupon||'').trim();
  if(!code){toast('Enter a coupon code','err');return;}
  api('/coupon?code='+encodeURIComponent(code)).then(function(d){
    S.couponData=d;
    var c=D.getElementById('hcart');if(c)updateCartEl(c);else redraw();
    toast('Coupon applied: '+d.code,'ok');
  }).catch(function(e){toast('Coupon: '+e.message,'err');});
}

// â”€â”€ BARCODE SCANNER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function handleBarcode(code){
  // Search by SKU or barcode field
  var p=S.products.find(function(p){
    if(p.sku===code)return true;
    // Check variations
    if(p.variations){
      var v=p.variations.find(function(v){return v.sku===code;});
      if(v)return true;
    }
    return false;
  });
  if(!p){
    toast('âš  Product not found: '+code,'err');
    // Show search with barcode
    S.srchQ=code;
    if(S.page==='pos'){var grid=D.getElementById('hpgrid');if(grid)updateGrid(grid);}
    return;
  }
  // Check for matching variation
  if(p.variations){
    var vm=p.variations.find(function(v){return v.sku===code;});
    if(vm){addToCart(p,vm);toast('Added: '+p.name+' ('+code+')','ok');return;}
  }
  if(p.type==='variable'&&p.variations&&p.variations.length>1){
    showVarModal(p);
  } else {
    addToCart(p,null);
    toast('Added: '+p.name,'ok');
  }
}

// â”€â”€ OFFLINE QUEUE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function queueOfflineOrder(payload){
  S.offlineQueue.push({payload:payload,time:new Date().toISOString()});
  try{localStorage.setItem('hpos_offline',JSON.stringify(S.offlineQueue));}catch(e){}
  toast('Order saved offline ('+S.offlineQueue.length+' queued)','info');
}

function syncOfflineQueue(){
  if(!S.offlineQueue.length||!S.isOnline)return;
  var q=S.offlineQueue.slice();
  S.offlineQueue=[];
  try{localStorage.removeItem('hpos_offline');}catch(e){}
  var done=0,fail=0;
  function next(){
    if(!q.length){
      toast('Synced '+(done)+' offline orders'+(fail?' ('+fail+' failed)':''),'ok');
      redraw();return;
    }
    var item=q.shift();
    api('/orders',{method:'POST',body:JSON.stringify(item.payload)}).then(function(){
      done++;next();
    }).catch(function(){
      fail++;S.offlineQueue.push(item);
      try{localStorage.setItem('hpos_offline',JSON.stringify(S.offlineQueue));}catch(e){}
      next();
    });
  }
  next();
}

// â”€â”€ CASH DRAWER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function drawerPage(){
  return el('div',{cls:'hpage',style:{overflow:'hidden',display:'flex',flexDirection:'column'}},[
    el('div',{cls:'hpage-head'},[el('h2',{cls:'hpage-title'},['ðŸ’° Cash Drawer'])]),
    el('div',{style:{flex:'1',overflowY:'auto',padding:'16px 20px'}},[
      S.cashSession?openDrawerView():closedDrawerView(),
    ]),
  ]);
}

function closedDrawerView(){
  var openAmt='';
  var wrap=el('div',{style:{maxWidth:'480px'}},[
    el('div',{cls:'hrep-card'},[
      el('h3',{cls:'hrep-title'},['Open Register']),
      el('p',{style:{fontSize:'13px',color:'#6b7280',marginBottom:'14px'}},['Enter your opening cash balance to start the session.']),
      el('div',{cls:'hfield'},[
        el('label',{cls:'hlbl'},['Opening Cash Balance (N$)']),
        (function(){var i=el('input',{cls:'hinp',type:'number',placeholder:'0.00',min:'0'});i.addEventListener('input',function(){openAmt=i.value;});i.addEventListener('keydown',function(e){e.stopPropagation();});return i;})(),
      ]),
      el('button',{cls:'hbtn hbtn-primary',style:{marginTop:'12px'},onClick:function(){
        var amt=parseFloat(openAmt)||0;
        S.cashSession={open:amt,cashier:CASHIER,openTime:new Date().toISOString(),sales:[],deposits:[],withdrawals:[]};
        toast('Register opened with '+fmt(amt),'ok');redraw();
      }},['âœ… Open Register']),
    ]),
  ]);
  // Show summary of recent sessions if stored
  var sessions=[];
  try{sessions=JSON.parse(localStorage.getItem('hpos_sessions')||'[]');}catch(e){}
  if(sessions.length){
    var hist=el('div',{cls:'hrep-card',style:{marginTop:'14px'}},[
      el('h3',{cls:'hrep-title'},['Recent Sessions']),
      el('table',{cls:'htbl'},[
        el('thead',{},[el('tr',{},[th('Date'),th('Cashier'),th('Opening'),th('Closing'),th('Cash Sales'),th('Diff')])]),
        el('tbody',{},sessions.slice(-10).reverse().map(function(s){
          var diff=(parseFloat(s.closing)||0)-(parseFloat(s.expected)||0);
          return el('tr',{},[
            td(fdateOnly(s.openTime)),td(s.cashier||'â€”'),td(fmt(s.open||0)),
            td(fmt(s.closing||0)),td(fmt(s.cashSales||0)),
            td(el('span',{style:{color:Math.abs(diff)>1?'#dc2626':'#16a34a',fontWeight:'600'}},[diff>=0?'+'+fmt(diff):fmt(diff)])),
          ]);
        })),
      ]),
    ]);
    wrap.appendChild(hist);
  }
  return wrap;
}

function openDrawerView(){
  var sess=S.cashSession;
  var cashSales=sess.sales.filter(function(s){return s.method==='cash';}).reduce(function(t,s){return t+(parseFloat(s.amount)||0);},0);
  var expected=(parseFloat(sess.open)||0)+cashSales;
  var closeAmt='';var closeReason='';
  return el('div',{style:{maxWidth:'560px'}},[
    // Session info
    el('div',{cls:'hsumcards',style:{marginBottom:'14px'}},[
      scard('Opening Balance',fmt(sess.open),''),
      scard('Cash Sales',fmt(cashSales),sess.sales.length+' transactions'),
      scard('Expected Closing',fmt(expected),''),
    ]),
    el('div',{cls:'hrep-card'},[
      el('h3',{cls:'hrep-title'},['Session: Opened '+fdateOnly(sess.openTime)+' by '+sess.cashier]),
      el('p',{style:{fontSize:'12px',color:'#6b7280',marginBottom:'14px'}},['Session is open. Count cash and close when done.']),
      el('div',{cls:'hfrow'},[
        el('div',{cls:'hfield'},[
          el('label',{cls:'hlbl'},['Actual Closing Cash (N$)']),
          (function(){var i=el('input',{cls:'hinp',type:'number',placeholder:'0.00',min:'0'});i.addEventListener('input',function(){closeAmt=i.value;});i.addEventListener('keydown',function(e){e.stopPropagation();});return i;})(),
        ]),
        el('div',{cls:'hfield'},[
          el('label',{cls:'hlbl'},['Notes']),
          (function(){var i=el('input',{cls:'hinp',type:'text',placeholder:'Optional notes...'});i.addEventListener('input',function(){closeReason=i.value;});i.addEventListener('keydown',function(e){e.stopPropagation();});return i;})(),
        ]),
      ]),
      el('button',{cls:'hbtn hbtn-danger',style:{marginTop:'12px'},onClick:function(){
        var actual=parseFloat(closeAmt)||0;
        var diff=actual-expected;
        var closed=Object.assign({},sess,{closing:actual,expected:expected,diff:diff,notes:closeReason,closeTime:new Date().toISOString(),cashSales:cashSales});
        // Save to history
        try{var hist=JSON.parse(localStorage.getItem('hpos_sessions')||'[]');hist.push(closed);localStorage.setItem('hpos_sessions',JSON.stringify(hist.slice(-50)));}catch(e){}
        S.cashSession=null;
        toast('Register closed. Difference: '+(diff>=0?'+':'')+fmt(diff),(Math.abs(diff)>10?'err':'ok'));
        redraw();
      }},['ðŸ”’ Close Register']),
    ]),
    // Transaction log
    sess.sales.length?el('div',{cls:'hrep-card',style:{marginTop:'14px'}},[
      el('h3',{cls:'hrep-title'},['Today\'s Transactions']),
      el('table',{cls:'htbl'},[
        el('thead',{},[el('tr',{},[th('Time'),th('Method'),th('Amount')])]),
        el('tbody',{},sess.sales.map(function(s){
          return el('tr',{},[td(new Date(s.time).toLocaleTimeString()),td(s.method),td(fmt(s.amount))]);
        }).reverse()),
      ]),
    ]):null,
  ]);
}

// â”€â”€ REFUNDS PAGE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function refundsPage(){
  return el('div',{cls:'hpage',style:{overflow:'hidden',display:'flex',flexDirection:'column'}},[
    el('div',{cls:'hpage-head'},[
      el('h2',{cls:'hpage-title'},['â†© Refunds & Returns']),
      el('div',{cls:'hpage-acts'},[
        el('button',{cls:'hbtn',onClick:function(){fetchOrders();toast('Orders refreshed','ok');}},['â†» Refresh']),
      ]),
    ]),
    el('div',{style:{flex:'1',overflowY:'auto',padding:'16px 20px'}},[
      el('p',{style:{fontSize:'13px',color:'#6b7280',marginBottom:'14px'}},['Search an order below to issue a refund and restock items.']),
      refundsSearchPanel(),
    ]),
  ]);
}

function refundsSearchPanel(){
  var srch='';
  var results=el('div',{});
  var wrap=el('div',{cls:'hrep-card',style:{maxWidth:'700px'}},[
    el('h3',{cls:'hrep-title'},['Search Order']),
    el('div',{cls:'hfrow'},[
      (function(){
        var i=el('input',{cls:'hinp',type:'text',placeholder:'Order # or customer name...'});
        i.addEventListener('keydown',function(e){e.stopPropagation();if(e.key==='Enter')doSearch();});
        i.addEventListener('input',function(){srch=i.value;});
        return i;
      })(),
      el('button',{cls:'hbtn hbtn-primary',onClick:function(){doSearch();}},['Search']),
    ]),
    results,
  ]);
  function doSearch(){
    if(!srch.trim())return;
    results.innerHTML='';
    results.appendChild(el('div',{cls:'hloading'},[el('div',{cls:'hspinner'},[]),' Searching...']));
    var allOrders=S.orders;
    var q=srch.trim().toLowerCase();
    var found=allOrders.filter(function(o){
      return String(o.number).includes(q)||(o.billing&&(o.billing.first_name+' '+o.billing.last_name).toLowerCase().includes(q));
    });
    // Also fetch if orders not loaded yet
    if(!allOrders.length){
      api('/orders?per_page=200').then(function(d){
        S.orders=Array.isArray(d)?d:[];
        var f=S.orders.filter(function(o){return String(o.number).includes(q)||(o.billing&&(o.billing.first_name+' '+o.billing.last_name).toLowerCase().includes(q));});
        showRefundResults(results,f);
      }).catch(function(e){results.textContent='Error: '+e.message;});
    } else {
      showRefundResults(results,found);
    }
  }
  return wrap;
}

function showRefundResults(container,orders){
  container.innerHTML='';
  if(!orders.length){container.appendChild(el('p',{style:{color:'#9ca3af',padding:'14px',textAlign:'center'}},['No orders found.']));return;}
  orders.slice(0,20).forEach(function(o){
    var b=o.billing||{};
    var row=el('div',{cls:'hcust-row',style:{cursor:'pointer'}},[
      el('div',{cls:'hcust-av',style:{background:'#fee2e2',color:'#dc2626'}},['â†©']),
      el('div',{cls:'hcust-info'},[
        el('div',{cls:'hcust-name'},['Order #'+o.number+' â€” '+(b.first_name?b.first_name+' '+b.last_name:'Guest')]),
        el('div',{cls:'hcust-email'},[fdateOnly(o.date)+' Â· '+fmt(o.total)+' Â· '+o.status]),
      ]),
      el('div',{},[sbadge(o.status)]),
    ]);
    row.addEventListener('click',function(){showRefundModal(o);});
    container.appendChild(row);
  });
}

function showRefundModal(order){
  var selected={};  // itemId â†’ qty to refund
  var reason='';
  var restockAll=true;
  var items=order.items||[];

  function buildBody(){
    var b=order.billing||{};
    return el('div',{},[
      el('div',{cls:'hdetail-grid',style:{marginBottom:'14px'}},[
        el('div',{},[rrow('Order:','#'+order.number),rrow('Date:',fdateOnly(order.date)),rrow('Status:',order.status),rrow('Total:',fmt(order.total))]),
        el('div',{},[b.first_name?rrow('Customer:',(b.first_name+' '+b.last_name).trim()):null,b.phone?rrow('Phone:',b.phone):null,b.email&&b.email.indexOf('pos.local')===-1?rrow('Email:',b.email):null]),
      ]),
      el('p',{cls:'hform-section'},['Select items to refund:']),
      el('div',{cls:'htable-wrap'},[
        el('table',{cls:'htbl'},[
          el('thead',{},[el('tr',{},[th('Item'),th('Ordered'),th('Price'),th('Refund Qty')])]),
          el('tbody',{},items.map(function(item){
            if(!selected[item.id])selected[item.id]=0;
            var qInput=el('input',{cls:'hinp',type:'number',min:'0',max:String(item.qty),value:'0',style:{width:'70px'}});
            qInput.addEventListener('input',function(){selected[item.id]=Math.min(parseInt(qInput.value)||0,item.qty);});
            qInput.addEventListener('keydown',function(e){e.stopPropagation();});
            return el('tr',{},[td(item.name),td(String(item.qty)),td(fmt(item.price)),td(qInput)]);
          })),
        ]),
      ]),
      el('div',{cls:'hfield',style:{marginTop:'12px'}},[
        el('label',{cls:'hlbl'},['Refund Reason']),
        (function(){var i=el('input',{cls:'hinp',type:'text',placeholder:'Customer return, defective, etc.'});i.addEventListener('input',function(){reason=i.value;});i.addEventListener('keydown',function(e){e.stopPropagation();});return i;})(),
      ]),
      el('label',{cls:'hdiff-lbl',style:{marginTop:'8px'}},[
        el('input',{type:'checkbox',checked:true,onChange:function(e){restockAll=e.target.checked;}}),
        ' Restock items automatically',
      ]),
      el('div',{cls:'hr-acts',style:{marginTop:'14px'}},[
        el('button',{cls:'hbtn hbtn-danger',onClick:function(){
          var refItems=items.filter(function(i){return (selected[i.id]||0)>0;});
          if(!refItems.length){toast('Select at least one item to refund','err');return;}
          var refTotal=refItems.reduce(function(s,i){return s+(selected[i.id]||0)*i.price;},0);
          var payload={order_id:order.id,items:refItems.map(function(i){return{id:i.id,qty:selected[i.id],price:i.price,name:i.name};}),reason:reason,restock:restockAll,total:refTotal};
          api('/refund',{method:'POST',body:JSON.stringify(payload)}).then(function(res){
            closeModal();
            toast('Refund of '+fmt(refTotal)+' issued','ok');
            // Refresh orders
            fetchOrders();
          }).catch(function(e){toast('Refund error: '+e.message,'err');});
        }},['â†© Issue Refund']),
        el('button',{cls:'hbtn',onClick:closeModal},['Cancel']),
      ]),
    ]);
  }
  openModal('Refund Order #'+order.number,buildBody(),'lg');
}

// â”€â”€ HOOK: track cash sales in drawer session â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function recordDrawerSale(method,amount){
  if(S.cashSession&&method==='cash'){
    S.cashSession.sales.push({method:method,amount:amount,time:new Date().toISOString()});
  }
}

// â”€â”€ CSS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function injectCSS(){
  if(D.getElementById('hpos-css'))return;
  var s=D.createElement('style');
  s.id='hpos-css';
  s.textContent=`
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
:root{
  --g1:#1a1a2e;--g2:#16213e;--g3:#0f3460;
  --acc:#4ade80;--acc2:#22c55e;--accd:#15803d;
  --bg:#f0f2f5;--sur:#fff;--sur2:#f8fafb;--sur3:#f0f2f5;
  --bd:#e5e7eb;--bd2:#d1d5db;
  --tx:#111827;--tx2:#374151;--tx3:#6b7280;--tx4:#9ca3af;
  --red:#ef4444;--redl:#fef2f2;--yel:#f59e0b;--yell:#fffbeb;
  --blu:#3b82f6;--blul:#eff6ff;--grn:#22c55e;--grnl:#f0fdf4;
  --sh:0 1px 3px rgba(0,0,0,.1),0 1px 2px rgba(0,0,0,.06);
  --sh2:0 4px 6px rgba(0,0,0,.07),0 2px 4px rgba(0,0,0,.06);
  --shlg:0 10px 25px rgba(0,0,0,.12),0 4px 6px rgba(0,0,0,.05);
  --r:12px;--rsm:8px;--rxs:6px;
}
body,#hpos-root{font-family:'Inter',sans-serif;font-size:14px;background:var(--bg);color:var(--tx);height:100%;}
#hpos-root{display:block;}
.hicon,.hpay-icon,.hsbnav-icon{display:inline-flex;align-items:center;justify-content:center;}
.hicon-svg{display:block;stroke:currentColor;}
.hiconbtn{width:28px;height:28px;border-radius:8px;border:1px solid var(--bd);background:var(--sur2);color:var(--tx3);display:inline-flex;align-items:center;justify-content:center;cursor:pointer;transition:all .16s ease;}
.hiconbtn:hover{background:#fff;border-color:var(--tx2);color:var(--tx);}

/* â”€â”€ APP SHELL â”€â”€ */
.happ{display:flex;height:100vh;width:100vw;overflow:hidden;background:var(--g1);}

/* â”€â”€ SIDEBAR â”€â”€ */
.hsb{width:220px;flex-shrink:0;background:#111827;display:flex;flex-direction:column;padding:0;}
.hsblogo{display:flex;align-items:center;gap:10px;padding:18px 16px 14px;border-bottom:1px solid rgba(255,255,255,.08);}
.hsblogoico{width:36px;height:36px;border-radius:10px;background:var(--acc);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:16px;color:#fff;flex-shrink:0;}
.hsblogoname{font-size:13px;font-weight:700;color:#fff;line-height:1.2;}
.hsbnav{flex:1;padding:10px 10px;display:flex;flex-direction:column;gap:2px;}
.hsbnav-item{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:var(--rsm);background:transparent;border:none;cursor:pointer;color:rgba(255,255,255,.55);font-family:'Inter',sans-serif;font-size:13px;font-weight:500;text-align:left;transition:all .15s;width:100%;}
.hsbnav-item:hover{background:rgba(255,255,255,.07);color:rgba(255,255,255,.9);}
.hsbnav-item.active{background:var(--acc);color:#fff;box-shadow:0 2px 8px rgba(74,222,128,.3);}
.hsbnav-item.active:hover{background:var(--acc2);}
.hsbnav-icon{font-size:16px;flex-shrink:0;width:20px;text-align:center;}
.hsbnav-label{font-size:12px;font-weight:500;}
.hsbfoot{padding:12px 10px;border-top:1px solid rgba(255,255,255,.08);}
.hsbcashier{display:flex;align-items:center;gap:9px;padding:8px 10px;border-radius:var(--rsm);background:rgba(255,255,255,.06);}
.hsbcav{width:32px;height:32px;border-radius:50%;background:var(--acc);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff;flex-shrink:0;}
.hsbcname{font-size:12px;font-weight:600;color:#fff;}
.hsbcloc{font-size:10px;color:rgba(255,255,255,.45);}

/* â”€â”€ CONTENT â”€â”€ */
.hcontent{flex:1;overflow:hidden;display:flex;flex-direction:column;background:#f7f8fa;}

/* â•â• POS LAYOUT â•â• */
.hpos{display:flex;flex:1;overflow:hidden;gap:0;}

/* â”€â”€ PRODUCT PANEL â”€â”€ */
.hpanel{flex:1;display:flex;flex-direction:column;overflow:hidden;background:var(--bg);}
.hpanelhead{display:flex;align-items:center;justify-content:space-between;padding:14px 18px 10px;background:var(--sur);border-bottom:1px solid var(--bd);}
.hpaneltitle{font-size:18px;font-weight:700;}
.hpanelmeta{font-size:12px;color:var(--tx3);}
.hsrchwrap{padding:10px 18px 0;}
.hsrch{width:100%;padding:9px 14px;border:1.5px solid var(--bd);border-radius:var(--r);background:var(--sur2);font-size:13px;color:var(--tx);outline:none;font-family:'Inter',sans-serif;transition:border-color .15s;}
.hsrch:focus{border-color:var(--acc);}
.hcatbar{display:flex;gap:6px;padding:10px 18px 0;overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch;flex-shrink:0;}
.hcatbar::-webkit-scrollbar{display:none;}
.hcatbtn{padding:6px 16px;border-radius:20px;border:1.5px solid var(--bd);background:var(--sur);color:var(--tx3);font-size:12px;font-weight:500;cursor:pointer;white-space:nowrap;transition:all .15s;font-family:'Inter',sans-serif;flex-shrink:0;}
.hcatbtn:hover{border-color:var(--g1);color:var(--g1);}
.hcatbtn.active{background:var(--g1);border-color:var(--g1);color:#fff;font-weight:700;}

/* â”€â”€ PRODUCT GRID â€” spacious cards matching image 3 */
.hpgrid{flex:1;overflow-y:auto;padding:16px 20px;display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:16px;align-content:start;}
.hpgrid::-webkit-scrollbar{width:4px;}
.hpgrid::-webkit-scrollbar-thumb{background:var(--bd2);border-radius:4px;}
.hpcard{background:#fff;border:1px solid #e0e0e0;border-radius:10px;cursor:pointer;transition:box-shadow .2s,transform .15s;overflow:hidden;position:relative;animation:fadeIn .2s ease both;}
@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
.hpcard:hover{box-shadow:0 4px 18px rgba(0,0,0,.12);transform:translateY(-2px);}
/* Square image â€” white bg, full product visible like image 3 */
.hpcard-img{width:100%;aspect-ratio:1/1;background:#fff;display:flex;align-items:center;justify-content:center;overflow:hidden;border-radius:10px 10px 0 0;}
.hpos-card-img{position:relative;display:block;width:100%;overflow:hidden;flex-shrink:0;}
/* Force square on all product card image wrappers in POS grid */
#hpgrid .hpos-img-wrap{width:100%;aspect-ratio:1/1;background:#f8f9fa;display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0;}
#hpgrid .hpos-img-wrap img{width:100%;height:100%;object-fit:contain;display:block;}
.hpos-card-img::before{content:'';display:block;padding-top:100%;}
.hpos-card-img img{position:absolute;top:0;left:0;width:100%;height:100%;object-fit:contain;}
.hpos-card-img>div{position:absolute;top:0;left:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;}
.hpcard-img img{width:100%;height:100%;object-fit:contain;transition:transform .3s;}
.hpcard:hover .hpcard-img img{transform:scale(1.04);}
.hpcard-ph{font-size:36px;color:#ddd;}
.hpcard-body{padding:11px 13px 14px;border-top:1px solid #f0f0f0;}
.hpcard-name{font-size:13px;font-weight:600;line-height:1.35;color:#111;margin-bottom:5px;}
.hpcard-var{font-size:10px;color:#2563eb;background:#eff6ff;display:inline-block;padding:2px 7px;border-radius:4px;margin-bottom:5px;font-weight:600;}
.hpcard-price{font-size:14px;font-weight:700;color:#111;}
.hpcard-stock{font-size:10px;color:#16a34a;margin-top:2px;}
.hpcard-stock.hlow{color:#d97706;}
.hpcard-stock.hout{color:#dc2626;}
.hpcard-add{position:absolute;top:9px;right:9px;width:28px;height:28px;border-radius:50%;background:#1a1a2e;color:#fff;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;opacity:0;transition:opacity .15s;box-shadow:0 2px 8px rgba(0,0,0,.2);}
.hpcard:hover .hpcard-add{opacity:1;}
.hempty{grid-column:1/-1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:70px;color:#9ca3af;gap:10px;font-size:14px;}
.hempty2{display:flex;align-items:center;justify-content:center;flex:1;color:#6b7280;font-size:14px;padding:40px;}

/* â”€â”€ CART â”€â”€ */
.hcart{width:390px;flex-shrink:0;display:flex;flex-direction:column;overflow:hidden;background:var(--sur);border-left:1px solid var(--bd);box-shadow:-8px 0 24px rgba(17,24,39,.06);}
.hcart-head{padding:13px 15px;border-bottom:1px solid var(--bd);display:flex;align-items:center;justify-content:space-between;flex-shrink:0;background:var(--g1);}
.hcart-title{font-size:14px;font-weight:700;color:#fff;}
.hcart-ref{font-size:11px;font-weight:600;color:rgba(255,255,255,.5);background:rgba(255,255,255,.1);padding:3px 9px;border-radius:20px;}
.hcart-cust{padding:9px 14px;display:flex;align-items:center;gap:8px;cursor:pointer;background:var(--sur2);border-bottom:1px solid var(--bd);transition:background .15s;flex-shrink:0;}
.hcart-cust:hover{background:#f0fdf4;}
.hcart-cust-ico{font-size:16px;flex-shrink:0;}
.hcart-cust-info{flex:1;}
.hcart-cust-name{font-size:12px;font-weight:600;color:var(--tx);}
.hcart-cust-sub{font-size:10px;color:var(--tx3);}
.hcart-cust-addr{background:var(--blul);color:var(--blu);border:none;border-radius:4px;padding:2px 7px;font-size:10px;font-weight:600;cursor:pointer;}
.hcust-card{padding:6px 14px;border-bottom:1px solid var(--bd);background:#f9fafb;flex-shrink:0;}
.hcust-card-row{font-size:11px;color:var(--tx2);margin-bottom:2px;display:flex;align-items:center;gap:4px;}
.hcust-card-row b{flex-shrink:0;}
.hcart-items{flex:1;overflow-y:auto;min-height:140px;padding:8px 10px;display:flex;flex-direction:column;gap:5px;}
.hcart-items::-webkit-scrollbar{width:3px;}
.hcart-items::-webkit-scrollbar-thumb{background:var(--bd);border-radius:3px;}
.hcart-items::-webkit-scrollbar-track{background:transparent;}
.hcart-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:6px;color:var(--tx4);}
.hcart-empty p{font-size:13px;font-weight:600;}.hcart-empty small{font-size:11px;}
.hcart-item{background:var(--sur2);border:1.5px solid var(--bd);border-radius:var(--rsm);padding:7px 9px;display:flex;align-items:center;gap:7px;animation:slideIn .15s ease;}
@keyframes slideIn{from{opacity:0;transform:translateX(5px)}to{opacity:1;transform:translateX(0)}}
.hcart-item-img{width:34px;height:34px;border-radius:6px;overflow:hidden;background:var(--sur3);flex-shrink:0;display:flex;align-items:center;justify-content:center;}
.hcart-item-img img{width:100%;height:100%;object-fit:cover;}
.hcart-item-info{flex:1;min-width:0;}
.hcart-item-name{font-size:11px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.hcart-item-var{font-size:10px;color:var(--tx3);}
.hcart-item-price{font-size:10px;color:var(--tx3);}
.hcart-item-qty{display:flex;align-items:center;gap:4px;}
.hqbtn{width:22px;height:22px;border-radius:6px;background:var(--sur);border:1.5px solid var(--bd);color:var(--tx2);cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;transition:all .1s;}
.hqbtn:hover{background:var(--acc);border-color:var(--acc);color:#fff;}
.hqnum{font-size:12px;font-weight:700;width:18px;text-align:center;}
.hcart-item-total{font-size:11px;font-weight:700;min-width:50px;text-align:right;}
.hdelb{width:18px;height:18px;border-radius:4px;background:transparent;border:none;color:var(--tx4);cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center;transition:color .1s;flex-shrink:0;}
.hdelb:hover{color:var(--red);}

/* â”€â”€ CART FOOTER â”€â”€ */
.hcart-foot{flex-shrink:0;overflow-y:auto;max-height:60vh;border-top:1px solid var(--bd);position:sticky;bottom:0;background:var(--sur);box-shadow:0 -8px 22px rgba(17,24,39,.06);z-index:2;}
.hcart-foot::-webkit-scrollbar{width:3px;}
.hcart-foot::-webkit-scrollbar-thumb{background:var(--bd);border-radius:3px;}
.hcart-foot::-webkit-scrollbar-track{background:transparent;}
.hship-row{padding:7px 13px;display:flex;align-items:center;justify-content:space-between;cursor:pointer;background:var(--sur2);border-bottom:1px solid var(--bd);transition:background .15s;}
.hship-row:hover{background:#f0fdf4;}
.hship-label{font-size:11px;color:var(--tx3);}
.hship-cost{font-size:11px;font-weight:700;}
.hdisc-row{padding:6px 13px;border-bottom:1px solid var(--bd);display:flex;gap:5px;}
.hdisc-inp{flex:1;padding:5px 8px;border:1.5px solid var(--bd);border-radius:var(--rxs);background:var(--sur2);font-size:12px;color:var(--tx);outline:none;font-family:'Inter',sans-serif;transition:border-color .15s;}
.hdisc-inp:focus{border-color:var(--acc);}
.hdisc-btn{padding:5px 9px;background:var(--sur2);border:1.5px solid var(--bd);border-radius:var(--rxs);font-size:11px;color:var(--tx2);cursor:pointer;transition:all .15s;font-family:'Inter',sans-serif;}
.hdisc-btn.active{background:#f0fdf4;border-color:var(--acc);color:var(--accd);}
.htotals{padding:8px 13px;border-bottom:1px solid var(--bd);}
.htrow{display:flex;justify-content:space-between;margin-bottom:3px;font-size:11px;color:var(--tx3);}
.htrow-warn{color:var(--yel);}
.htval{font-weight:600;color:var(--tx2);}
.htotal-grand{display:flex;justify-content:space-between;align-items:center;border-top:1.5px solid var(--bd);padding-top:7px;margin-top:5px;}
.htotal-grand>span:first-child{font-size:13px;font-weight:700;}
.htotal-amt{font-size:18px;font-weight:800;color:var(--g1);}
/* Payment */
.hpay-section{padding:7px 13px;border-bottom:1px solid var(--bd);}
.hpay-label{font-size:10px;font-weight:700;color:var(--tx3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:5px;}
.hpay-grid{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:6px;}
.hpay-btn{flex:1;min-width:55px;padding:5px 4px;background:var(--sur2);border:1.5px solid var(--bd);border-radius:var(--rxs);font-size:8px;font-weight:600;color:var(--tx3);cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:2px;transition:all .15s;font-family:'Inter',sans-serif;}
.hpay-btn:hover{border-color:var(--acc);color:var(--accd);}
.hpay-btn.active{background:var(--g1);border-color:var(--g1);color:#fff;box-shadow:0 2px 6px rgba(26,26,46,.3);}
.hpay-icon{font-size:14px;min-height:18px;}
.hpay-name{font-size:8px;}
/* Split payment */
.hsplit-toggle{font-size:11px;color:var(--tx2);cursor:pointer;display:flex;align-items:center;gap:6px;font-weight:500;}
.hsplit-box{background:var(--sur2);border:1.5px solid var(--bd);border-radius:var(--rsm);padding:8px;margin-top:6px;display:flex;flex-direction:column;gap:5px;}
.hsplit-row{display:flex;align-items:center;gap:6px;}
.hsplit-sum{font-size:11px;color:var(--tx3);text-align:center;padding:4px;}
.hsplit-sum.ok{color:var(--grn);font-weight:600;}
.hnote-row{padding:6px 13px;border-bottom:1px solid var(--bd);}
.hnote-inp{width:100%;padding:5px 8px;border:1.5px solid var(--bd);border-radius:var(--rxs);background:var(--sur2);font-size:11px;color:var(--tx);outline:none;font-family:'Inter',sans-serif;}
.hnote-inp:focus{border-color:var(--bd2);}
.hstatus-row{padding:6px 13px;border-bottom:1px solid var(--bd);display:flex;align-items:center;gap:8px;}
.hstatus-label{font-size:10px;font-weight:700;color:var(--tx3);text-transform:uppercase;white-space:nowrap;}
.hsel{padding:4px 7px;border:1.5px solid var(--bd);border-radius:var(--rxs);background:var(--sur2);font-size:12px;color:var(--tx2);cursor:pointer;outline:none;font-family:'Inter',sans-serif;}
.hsel-full{flex:1;}
.hactions{padding:9px 13px 13px;display:flex;gap:6px;position:sticky;bottom:0;background:var(--sur);z-index:3;box-shadow:0 -6px 16px rgba(17,24,39,.05);}
.hbtn-hold{flex:0 0 auto;padding:10px 14px;background:transparent;border:1.5px solid var(--bd);border-radius:var(--rsm);color:var(--tx3);font-size:12px;font-weight:600;cursor:pointer;transition:all .15s;font-family:'Inter',sans-serif;}
.hbtn-hold:hover{border-color:var(--yel);color:var(--yel);}
.hbtn-charge{flex:1;padding:12px;background:var(--g1);border:none;border-radius:var(--r);color:#fff;font-family:'Inter',sans-serif;font-size:13px;font-weight:700;cursor:pointer;transition:all .2s;}
.hbtn-charge:hover:not(.disabled){background:#0f3460;box-shadow:0 4px 14px rgba(15,52,96,.4);transform:translateY(-1px);}
.hbtn-charge.disabled{background:var(--sur3);color:var(--tx4);cursor:not-allowed;}
.hcashinput{width:100%;padding:13px 14px;border:1.5px solid var(--bd);border-radius:var(--r);background:var(--sur2);font-size:24px;font-weight:800;color:var(--g1);text-align:center;outline:none;font-family:'Inter',sans-serif;margin:12px 0 8px;transition:border-color .15s,box-shadow .15s;}
.hcashinput:focus{border-color:var(--g1);box-shadow:0 0 0 3px rgba(17,24,39,.08);}
.hedit-totals{margin-top:8px;padding:10px;background:var(--sur2);border:1px solid var(--bd);border-radius:var(--rsm);}

/* â”€â”€ MODALS â”€â”€ */
.hmodal-ov{position:fixed;inset:0;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;z-index:99999;backdrop-filter:blur(4px);padding:16px;}
.hmodal{background:var(--sur);border-radius:16px;box-shadow:var(--shlg);max-height:calc(100vh - 32px);overflow:hidden;display:flex;flex-direction:column;width:100%;}
.hmodal-sm{max-width:420px;}.hmodal-md{max-width:560px;}.hmodal-lg{max-width:720px;}
.hmodal::-webkit-scrollbar{width:4px;}
.hmodal::-webkit-scrollbar-thumb{background:var(--bd);border-radius:4px;}
.hmodal-hdr{padding:14px 18px;border-bottom:1px solid var(--bd);display:flex;align-items:center;justify-content:space-between;flex-shrink:0;background:var(--sur);z-index:1;}
.hmodal-title{font-size:15px;font-weight:700;}
.hmodal-cls{width:28px;height:28px;border-radius:7px;background:var(--sur2);border:none;color:var(--tx3);cursor:pointer;font-size:15px;display:flex;align-items:center;justify-content:center;transition:all .15s;}
.hmodal-cls:hover{background:var(--redl);color:var(--red);}
.hmodal-body{padding:16px 18px;overflow-y:auto;flex:1;min-height:0;}
.hmodal-tabcontent{margin-top:10px;}

/* â”€â”€ TABS â”€â”€ */
.htabs{display:flex;gap:5px;border-bottom:1.5px solid var(--bd);padding-bottom:8px;}
.htab{padding:6px 14px;border-radius:var(--rsm) var(--rsm) 0 0;border:1.5px solid transparent;background:transparent;color:var(--tx3);font-size:13px;font-weight:500;cursor:pointer;transition:all .15s;font-family:'Inter',sans-serif;}
.htab.active{background:var(--g1);color:#fff;border-color:var(--g1);}

/* â”€â”€ FORMS â”€â”€ */
.hform{display:flex;flex-direction:column;gap:0;}
.hfrow{display:flex;gap:10px;}
.hfrow>.hfield{flex:1;}
.hfield{margin-bottom:10px;flex:1;}
.hlbl{display:block;font-size:10px;font-weight:700;color:var(--tx3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:3px;}
.hinp{width:100%;padding:7px 10px;border:1.5px solid var(--bd);border-radius:var(--rsm);background:var(--sur2);font-size:13px;color:var(--tx);outline:none;font-family:'Inter',sans-serif;transition:border-color .15s;}
.hinp:focus{border-color:var(--acc);}
.hinp:disabled{opacity:.6;cursor:not-allowed;}
textarea.hinp{resize:vertical;min-height:60px;}
.hform-section{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--tx3);border-bottom:1px solid var(--bd);padding-bottom:5px;margin-bottom:10px;}
.hdiff-lbl{display:flex;align-items:center;gap:7px;font-size:12px;font-weight:500;color:var(--tx2);cursor:pointer;margin-bottom:8px;}
.hship-prev{background:var(--grnl);border:1.5px solid var(--grn);border-radius:var(--rsm);padding:7px 10px;font-size:12px;color:var(--accd);font-weight:600;margin-top:4px;}

/* â”€â”€ CUSTOMER LIST â”€â”€ */
.hcust-list{display:flex;flex-direction:column;gap:5px;max-height:260px;overflow-y:auto;margin-top:8px;}
.hcust-list::-webkit-scrollbar{width:3px;}
.hcust-list::-webkit-scrollbar-thumb{background:var(--bd);border-radius:3px;}
.hcust-row{display:flex;align-items:center;gap:9px;padding:9px 11px;border-radius:var(--rsm);border:1.5px solid var(--bd);cursor:pointer;background:var(--sur2);transition:all .15s;}
.hcust-row:hover{border-color:var(--acc);background:var(--grnl);}
.hcust-av{width:36px;height:36px;border-radius:50%;background:var(--g1);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff;flex-shrink:0;}
.hcust-info{flex:1;}.hcust-name{font-size:13px;font-weight:600;}.hcust-email{font-size:11px;color:var(--tx3);}
.hcust-pts{font-size:12px;font-weight:700;color:var(--yel);}

/* â”€â”€ SHIPPING MODAL â”€â”€ */
.hship-list{display:flex;flex-direction:column;gap:6px;}
.hship-opt{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:var(--rsm);border:1.5px solid var(--bd);cursor:pointer;background:var(--sur2);transition:all .15s;}
.hship-opt:hover,.hship-opt.selected{border-color:var(--acc);background:var(--grnl);}
.hship-radio{width:16px;height:16px;border-radius:50%;border:2px solid var(--bd2);flex-shrink:0;}
.hship-radio.on{border-color:var(--acc);background:var(--acc);box-shadow:inset 0 0 0 3px #fff;}
.hship-optinfo{flex:1;}.hship-zone{font-size:9px;color:var(--tx3);font-weight:700;text-transform:uppercase;}.hship-title{font-size:13px;font-weight:600;}
.hship-optcost{font-size:14px;font-weight:700;}
.hcustship{border-top:1px dashed var(--bd);margin-top:12px;padding-top:12px;}

/* â”€â”€ PAYMENT MODAL â”€â”€ */
.hpayamt{background:var(--sur2);border:1.5px solid var(--bd);border-radius:var(--rsm);padding:12px 15px;display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;font-size:14px;color:var(--tx3);}
.hpayamt strong{font-size:22px;font-weight:800;color:var(--g1);}
.hsplitinfo{background:var(--sur2);border:1.5px solid var(--bd);border-radius:var(--rsm);padding:10px;margin-bottom:10px;font-size:12px;display:flex;flex-direction:column;gap:4px;}
.hcashdisplay{background:var(--g1);border-radius:var(--rsm);padding:14px;text-align:right;font-size:26px;font-weight:800;color:#fff;margin-bottom:6px;}
.hchange{background:var(--grnl);border:1.5px solid var(--grn);border-radius:var(--rsm);padding:7px 12px;display:flex;justify-content:space-between;margin-bottom:8px;}
.hchange span{font-size:12px;font-weight:600;}.hchange strong{font-size:16px;font-weight:800;}
.hchange.herr{background:var(--redl);border-color:var(--red);}
.hchange.herr span,.hchange.herr strong{color:var(--red);}
.hchange.hok span,.hchange.hok strong{color:var(--grn);}
.hnumpad{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:10px;}
.hnk{padding:14px;background:var(--sur2);border:1.5px solid var(--bd);border-radius:var(--rsm);font-size:18px;font-weight:700;cursor:pointer;text-align:center;transition:all .1s;color:var(--tx);font-family:'Inter',sans-serif;}
.hnk:hover{background:var(--sur3);}
.hnk:active{transform:scale(.93);}
.hnk.hacc{background:var(--g1);border-color:var(--g1);color:#fff;}
.hpayicon{text-align:center;font-size:52px;margin-bottom:10px;}
.hpaydesc{text-align:center;color:var(--tx3);font-size:13px;margin-bottom:14px;}
.hok{color:var(--grn);font-weight:700;}.herr{color:var(--red);font-weight:700;}

/* â”€â”€ RECEIPT â”€â”€ */
.hreceipt{background:#fff;color:#222;font-size:12px;line-height:1.65;padding:20px;border-radius:var(--r);margin-bottom:10px;border:1px solid var(--bd);}
.hr-hdr{text-align:center;margin-bottom:10px;}
.hr-store{font-size:18px;font-weight:800;}
.hr-sub{font-size:10px;color:#666;}
.hr-line{border:none;border-top:1px dashed #ccc;margin:8px 0;}
.hr-meta{font-size:11px;}.hr-row{display:flex;justify-content:space-between;margin-bottom:2px;}
.hr-lbl{color:#888;min-width:110px;font-weight:600;}
.hr-items-hdr{display:flex;font-size:10px;font-weight:700;text-transform:uppercase;color:#888;margin-bottom:4px;}
.hr-item{display:flex;align-items:center;margin-bottom:2px;font-size:11px;}
.hr-total{display:flex;justify-content:space-between;font-size:14px;border-top:1px solid #ccc;padding-top:6px;margin-top:5px;}
.hr-total strong{font-weight:800;}
.hr-footer{text-align:center;color:#888;font-size:11px;margin-top:10px;}
.hr-acts{display:flex;gap:8px;}

/* â”€â”€ VAR MODAL â”€â”€ */
.hvar-list{display:flex;flex-direction:column;gap:7px;max-height:50vh;overflow-y:auto;}
.hvar-row{display:flex;align-items:center;gap:10px;padding:9px 11px;border-radius:var(--rsm);border:1.5px solid var(--bd);cursor:pointer;background:var(--sur2);transition:all .15s;}
.hvar-row:hover{border-color:var(--acc);background:var(--grnl);}
.hvar-img{width:46px;height:46px;border-radius:7px;overflow:hidden;background:var(--sur3);flex-shrink:0;display:flex;align-items:center;justify-content:center;}
.hvar-img img{width:100%;height:100%;object-fit:contain;padding:3px;}
.hvar-info{flex:1;}.hvar-attrs{display:flex;flex-wrap:wrap;gap:3px;margin-bottom:3px;}
.hchip{background:var(--grnl);color:var(--accd);font-size:10px;font-weight:600;padding:2px 7px;border-radius:4px;}
.hvar-price{font-size:14px;font-weight:700;}.hvar-stock{font-size:10px;color:var(--tx3);}
.hvar-add{background:var(--acc);color:#fff;border:none;border-radius:var(--rsm);padding:7px 14px;font-size:12px;font-weight:600;cursor:pointer;flex-shrink:0;}

/* â”€â”€ PAGES â”€â”€ */
.hpage{flex:1;display:flex;flex-direction:column;overflow:hidden;}
.hpage-head{padding:13px 20px;background:var(--sur);border-bottom:1px solid var(--bd);display:flex;align-items:center;justify-content:space-between;flex-shrink:0;}
.hpage-title{font-size:18px;font-weight:700;}
.hpage-meta{font-size:12px;color:var(--tx3);}
.hpage-acts{display:flex;gap:6px;align-items:center;flex-wrap:wrap;}
.hpage-body{flex:1;overflow-y:auto;padding:16px 20px;}
.htable-wrap{flex:1;overflow-y:auto;padding:14px 18px;}
.htable-wrap::-webkit-scrollbar{width:4px;}
.htable-wrap::-webkit-scrollbar-thumb{background:var(--bd);border-radius:4px;}
table.htbl{width:100%;border-collapse:collapse;}
.htbl th{background:var(--sur2);padding:8px 11px;text-align:left;font-size:10px;font-weight:700;color:var(--tx3);text-transform:uppercase;letter-spacing:.5px;border-bottom:2px solid var(--bd);}
.htbl td{padding:8px 11px;border-bottom:1px solid var(--bd);font-size:12px;color:var(--tx2);vertical-align:middle;}
.htbl tr:hover td{background:var(--sur2);}
.htbl-acts{display:flex;gap:4px;}
.htag{background:var(--blul);color:var(--blu);font-size:10px;font-weight:700;padding:2px 7px;border-radius:4px;}

/* â”€â”€ SUMMARY CARDS â”€â”€ */
.hsumcards{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;padding:14px 20px 0;}
.hscard{background:var(--sur);border:1.5px solid var(--bd);border-radius:var(--r);padding:14px;transition:box-shadow .15s;}
.hscard:hover{box-shadow:var(--sh2);}
.hscard-label{font-size:10px;font-weight:700;color:var(--tx3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:5px;}
.hscard-value{font-size:20px;font-weight:800;color:var(--g1);}
.hscard-value.hsc-warn{color:var(--yel);}
.hscard-sub{font-size:10px;color:var(--tx3);margin-top:2px;}

/* â”€â”€ HELD â”€â”€ */
.hheld-list{display:flex;flex-direction:column;gap:10px;padding:14px 20px;overflow-y:auto;}
.hheld-card{background:var(--sur);border:1.5px solid var(--bd);border-radius:var(--r);padding:14px;}
.hheld-head{display:flex;align-items:center;gap:10px;margin-bottom:8px;flex-wrap:wrap;}
.hheld-ref{font-size:14px;font-weight:800;color:var(--g1);}
.hheld-cust{font-size:12px;color:var(--tx2);background:var(--grnl);padding:2px 8px;border-radius:4px;font-weight:600;}
.hheld-items{margin-bottom:7px;}
.hheld-item{font-size:12px;color:var(--tx2);margin-bottom:2px;}
.hheld-total{font-size:13px;font-weight:700;margin-bottom:8px;}
.hheld-acts{display:flex;gap:7px;}

/* â”€â”€ REPORTS â”€â”€ */
.hrep-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:14px 20px;}
.hrep-card{background:var(--sur);border:1.5px solid var(--bd);border-radius:var(--r);padding:15px;}
.hrep-title{font-size:13px;font-weight:700;margin-bottom:10px;}
.hbarchart{display:flex;gap:6px;align-items:flex-end;height:110px;overflow-x:auto;padding-top:6px;}
.hbar{display:flex;flex-direction:column;align-items:center;gap:2px;min-width:28px;}
.hbarbg{flex:1;width:22px;background:var(--sur3);border-radius:4px;display:flex;align-items:flex-end;overflow:hidden;}
.hbarfill{width:100%;background:var(--acc);border-radius:4px;min-height:2px;transition:height .4s;}
.hbarlbl{font-size:8px;color:var(--tx3);}

/* â”€â”€ INVENTORY â”€â”€ */
.hinv-srch{padding:12px 20px 0;}
.hqinp{width:65px;padding:4px 7px;border:1.5px solid var(--bd);border-radius:5px;background:var(--sur2);font-size:12px;color:var(--tx);outline:none;font-family:'Inter',sans-serif;}
.hqinp:focus{border-color:var(--acc);}

/* â”€â”€ DATE PICKER â”€â”€ */
.hdate-inp{padding:6px 10px;border:1.5px solid var(--bd);border-radius:var(--rsm);background:var(--sur2);font-size:12px;color:var(--tx);outline:none;}
.hdate-inp:focus{border-color:var(--acc);}

/* â”€â”€ DETAIL â”€â”€ */
.hdetail-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
.hdetail-totals{text-align:right;margin-top:10px;}

/* â”€â”€ BADGES â”€â”€ */
.hbadge{display:inline-block;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700;}
.hbadge-green{background:var(--grnl);color:var(--accd);}
.hbadge-yellow{background:var(--yell);color:#92400e;}
.hbadge-red{background:var(--redl);color:var(--red);}
.hbadge-blue{background:var(--blul);color:var(--blu);}
.hbadge-grey{background:var(--sur3);color:var(--tx3);}

/* â”€â”€ BUTTONS â”€â”€ */
.hbtn{padding:7px 13px;border-radius:var(--rsm);border:1.5px solid var(--bd);background:var(--sur2);color:var(--tx2);font-size:12px;font-weight:600;cursor:pointer;transition:all .15s;display:inline-flex;align-items:center;gap:5px;font-family:'Inter',sans-serif;text-decoration:none;}
.hbtn:hover{border-color:var(--acc);color:var(--accd);}
.hbtn-primary{background:var(--g1);border-color:var(--g1);color:#fff;}
.hbtn-primary:hover{background:#0f3460;border-color:#0f3460;color:#fff;}
.hbtn-danger{background:var(--redl);border-color:var(--red);color:var(--red);}
.hbtn-danger:hover{background:var(--red);color:#fff;}
.hbtn-sm{padding:4px 9px;font-size:11px;}
.hbtn-xs{padding:2px 7px;font-size:10px;}
.hbtn-full{width:100%;justify-content:center;}

/* â”€â”€ LOADING â”€â”€ */
.hloading{display:flex;align-items:center;justify-content:center;height:200px;gap:10px;color:var(--tx3);font-size:14px;}
.hspinner{width:18px;height:18px;border:2px solid var(--bd);border-top-color:var(--acc);border-radius:50%;animation:spin .7s linear infinite;}
@keyframes spin{to{transform:rotate(360deg)}}

/* â”€â”€ TOAST â”€â”€ */
.htoast{position:fixed;bottom:22px;left:50%;transform:translateX(-50%);padding:10px 18px;border-radius:10px;font-size:13px;font-weight:600;box-shadow:var(--shlg);z-index:999999;font-family:'Inter',sans-serif;transition:opacity .4s,transform .4s;white-space:nowrap;}
.htoast.hout{opacity:0;transform:translateX(-50%) translateY(8px);}
.ht-ok{background:#1a1a2e;color:#4ade80;}
.ht-err{background:var(--red);color:#fff;}
.ht-info{background:var(--g1);color:#fff;}

/* â”€â”€ WALK-IN CUSTOMER â”€â”€ */
.hwalkin-box{padding:4px 0;}
.hwalkin-desc{font-size:12px;color:var(--tx3);background:var(--blul);border:1px solid var(--blu);border-radius:var(--rsm);padding:9px 12px;margin-bottom:14px;line-height:1.5;}

/* â”€â”€ PIN LOGIN â”€â”€ */
.hpin-ov{position:fixed;inset:0;background:linear-gradient(135deg,#1a1a2e 0%,#0f3460 100%);display:flex;align-items:center;justify-content:center;z-index:9999999;}
.hpin-box{background:rgba(255,255,255,.05);border:1.5px solid rgba(255,255,255,.12);border-radius:20px;padding:32px 36px;text-align:center;min-width:320px;backdrop-filter:blur(12px);}
.hpin-logo{max-height:60px;max-width:180px;display:block;margin:0 auto 14px;border-radius:8px;}
.hpin-title{font-size:20px;font-weight:800;color:#fff;margin-bottom:4px;}
.hpin-sub{font-size:12px;color:rgba(255,255,255,.5);margin-bottom:20px;}
.hpin-display{font-size:28px;letter-spacing:12px;font-weight:700;color:#4ade80;background:rgba(0,0,0,.3);border-radius:10px;padding:10px 20px;min-height:54px;margin-bottom:16px;font-family:monospace;}
.hpin-numpad{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin-bottom:12px;}
.hpin-btn{padding:14px;border-radius:12px;background:rgba(255,255,255,.09);border:1.5px solid rgba(255,255,255,.12);color:#fff;font-size:18px;font-weight:700;cursor:pointer;transition:all .15s;font-family:'Inter',sans-serif;}
.hpin-btn:hover{background:rgba(255,255,255,.16);}
.hpin-ok{background:var(--acc)!important;border-color:var(--acc)!important;color:#fff!important;}
.hpin-ok:hover{background:var(--acc2)!important;}
.hpin-del{background:rgba(239,68,68,.15)!important;border-color:rgba(239,68,68,.3)!important;color:#f87171!important;}
.hpin-err{font-size:12px;color:#f87171;min-height:18px;font-weight:600;}

/* â”€â”€ RECEIPT EDITOR â”€â”€ */
.hreceipt-editor{padding:0;}
.hr-editor-note{font-size:11px;color:var(--tx3);background:var(--yell);border:1px solid var(--yel);border-radius:var(--rsm);padding:8px 11px;margin-bottom:12px;}
.hr-editor-actions{display:flex;gap:8px;margin-top:12px;}
.hr-logo{max-height:60px;max-width:180px;display:block;margin:0 auto 8px;}

/* â”€â”€ LOGO PREVIEW â”€â”€ */
.hlogo-prev{min-height:0;}

/* â”€â”€ OFFLINE BANNER â”€â”€ */
.hoffline-banner{background:#fef3c7;color:#92400e;font-size:11px;font-weight:600;padding:6px 12px;text-align:center;border-bottom:1px solid #fcd34d;}

@media print{
  /* Default print: hide POS chrome, show receipt */
  .hmodal-ov{position:static;background:none;}
  .hsb,.hpanelhead,.hr-acts,.hbtn,#wpadminbar{display:none!important;}
  .hreceipt{box-shadow:none;border:none;page-break-inside:avoid;}
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   MOBILE RESPONSIVE  (â‰¤ 768px)
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
@media (max-width:768px){

  /* â”€â”€ Root stays flex row but content gets bottom padding for nav â”€â”€ */
  .happ{position:relative;}

  /* â”€â”€ Content area: pad bottom so nav doesn't overlap â”€â”€ */
  .hcontent{padding-bottom:52px !important;}

  /* â”€â”€ Sidebar: fixed bottom navigation bar â”€â”€ */
  .hsb{
    position:fixed !important;
    bottom:0 !important;
    left:0 !important;
    right:0 !important;
    width:100% !important;
    height:52px !important;
    flex-direction:row !important;
    padding:0 !important;
    overflow:hidden !important;
    border-top:1px solid rgba(255,255,255,.15) !important;
    z-index:9999 !important;
    box-shadow:0 -2px 12px rgba(0,0,0,.3) !important;
  }

  /* Hide logo, offline banner, cashier footer */
  .hsblogo,.hoffline-banner,.hsbfoot{display:none !important;}

  /* Nav: full width horizontal scrollable strip */
  .hsbnav{
    flex-direction:row !important;
    flex:1 !important;
    padding:0 !important;
    gap:0 !important;
    overflow-x:auto !important;
    overflow-y:hidden !important;
    scrollbar-width:none !important;
    -ms-overflow-style:none !important;
    align-items:stretch !important;
    height:52px !important;
  }
  .hsbnav::-webkit-scrollbar{display:none !important;}

  /* Each nav item */
  .hsbnav-item{
    flex-direction:column !important;
    gap:1px !important;
    padding:4px 8px !important;
    border-radius:0 !important;
    min-width:50px !important;
    flex:1 !important;
    justify-content:center !important;
    align-items:center !important;
    width:auto !important;
    height:52px !important;
    color:rgba(255,255,255,.6) !important;
  }
  .hsbnav-icon{font-size:18px !important;width:auto !important;line-height:1 !important;}
  .hsbnav-label{font-size:8px !important;font-weight:600 !important;line-height:1.2 !important;text-align:center !important;margin-top:1px !important;}
  .hsbnav-item.active{background:rgba(255,255,255,.15) !important;color:#fff !important;}
  .hsbnav-item:hover{background:rgba(255,255,255,.1) !important;}

  /* â”€â”€ POS terminal: products above, cart below â”€â”€ */
  .hpos{flex-direction:column !important;}
  .hpos > div:first-child{flex:1 !important;min-height:0 !important;overflow:hidden !important;}
  .hcart{
    width:100% !important;
    height:44vh !important;
    max-height:44vh !important;
    flex-shrink:0 !important;
    border-left:none !important;
    border-top:2px solid var(--bd) !important;
    box-shadow:0 -4px 16px rgba(0,0,0,.1) !important;
  }
  .hcart-items{min-height:60px !important;}

  /* â”€â”€ Product grid â”€â”€ */
  #hpgrid{
    grid-template-columns:repeat(auto-fill,minmax(110px,1fr)) !important;
    gap:7px !important;
    padding:8px !important;
  }

  /* â”€â”€ Page headers â”€â”€ */
  .hpage-head{padding:8px 12px !important;flex-wrap:wrap !important;gap:5px !important;}
  .hpage-title{font-size:14px !important;}
  .hpage-acts .hbtn{font-size:11px !important;padding:5px 8px !important;}

  /* â”€â”€ Summary cards: 2 per row â”€â”€ */
  .hsumcards{
    grid-template-columns:repeat(2,1fr) !important;
    padding:8px 10px 0 !important;
    gap:7px !important;
  }

  /* â”€â”€ Tables: horizontal scroll â”€â”€ */
  .htable-wrap{overflow-x:auto !important;padding:6px 8px !important;}
  .htbl{min-width:500px !important;}
  .htbl th,.htbl td{padding:5px 7px !important;font-size:11px !important;}

  /* â”€â”€ Modals: slide up from bottom â”€â”€ */
  .hmodal-ov{padding:0 !important;align-items:flex-end !important;}
  .hmodal,.hmodal-sm,.hmodal-md,.hmodal-lg{
    border-radius:16px 16px 0 0 !important;
    max-height:90vh !important;
    max-width:100% !important;
    width:100% !important;
  }
  .hmodal-body{padding:12px 14px !important;}

  /* â”€â”€ Detail grids: single column â”€â”€ */
  .hdetail-grid{grid-template-columns:1fr !important;}

  /* â”€â”€ Prevent iOS zoom on input focus â”€â”€ */
  .hinp,input,select,textarea{font-size:16px !important;}

  /* â”€â”€ Tabs: horizontal scroll â”€â”€ */
  .htabs{
    overflow-x:auto !important;
    flex-wrap:nowrap !important;
    padding:0 8px 6px !important;
    gap:3px !important;
    scrollbar-width:none !important;
  }
  .htabs::-webkit-scrollbar{display:none !important;}
  .htab{font-size:11px !important;padding:5px 10px !important;white-space:nowrap !important;}

  /* â”€â”€ Forms â”€â”€ */
  .hfrow{flex-direction:column !important;gap:6px !important;}
  .hfield{width:100% !important;}

  /* â”€â”€ Buttons â”€â”€ */
  .hbtn-sm{font-size:10px !important;padding:4px 7px !important;}
  .htbl-acts,.hr-acts{flex-wrap:wrap !important;gap:4px !important;}

  /* â”€â”€ Report cards â”€â”€ */
  .hrep-card{padding:10px !important;}
}

/* â”€â”€ CATALOGUE PRINT: only fires when body has .hpos-cat-print â”€â”€ */
@media print{
  body.hpos-cat-print *{visibility:hidden;}
  body.hpos-cat-print #cat-output,
  body.hpos-cat-print #cat-output *{visibility:visible;}
  body.hpos-cat-print #cat-output{
    position:fixed;top:0;left:0;width:100%;
    overflow:visible;background:#fff;
  }
  body.hpos-cat-print #cat-output .catalogue{
    width:100%!important;
    box-shadow:none!important;
    margin:0!important;
  }
  body.hpos-cat-print #cat-output .gen-sidebar,
  body.hpos-cat-print #cat-output .gen-preview .preview-label{display:none!important;}
  @page{ size:A4 portrait; margin:0; }
}
`;
  D.head.appendChild(s);
}

// â”€â”€ CATALOGUE CSS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function injectCatalogueCSS(){
  // No Google Fonts - use system serif/sans that work reliably in WP admin
  var s=D.createElement('style');
  s.id='hpos-cat-css';
  s.textContent=`
/* â”€â”€ ALL CATALOGUE STYLES scoped to #cat-output to beat WP admin CSS â”€â”€ */
/* System fonts: Georgia = elegant serif, system-ui = clean sans */

#cat-output *{box-sizing:border-box;}

/* â”€â”€ DOCUMENT ROOT â”€â”€ */
#cat-output .catalogue{
  width:760px;margin:0 auto;background:#fff;
  font-family:system-ui,-apple-system,'Segoe UI',sans-serif;
  font-size:13px;color:#1a1a1a;
  box-shadow:0 16px 60px rgba(0,0,0,.22);
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   COVER â€” LIGHT CREAM
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
#cat-output .cat-cover{
  width:100%;height:980px;
  position:relative;overflow:hidden;
  background:#F2EFEA;
  display:flex;flex-direction:column;
}
#cat-output .cat-cover-bg{
  position:absolute;inset:0;
  background:
    radial-gradient(ellipse 100% 60% at 100% 0%,rgba(107,143,113,.12) 0%,transparent 55%),
    radial-gradient(ellipse 70% 80% at 0% 100%,rgba(196,151,58,.09) 0%,transparent 60%);
}
#cat-output .cat-cover-grid{
  position:absolute;inset:0;opacity:.35;
  background-image:linear-gradient(rgba(0,0,0,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,.06) 1px,transparent 1px);
  background-size:36px 36px;
}
#cat-output .cat-cover-bar{
  position:absolute;top:0;bottom:0;left:0;width:5px;
  background:linear-gradient(180deg,#6B8F71 0%,#C4973A 50%,#6B8F71 100%);
}
/* Right panel */
#cat-output .cat-cover-right{
  position:absolute;right:0;top:0;bottom:0;width:200px;
  background:rgba(255,255,255,.4);
  border-left:1px solid rgba(0,0,0,.08);
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;
}
#cat-output .cat-cover-right-item{
  text-align:center;font-size:8px;letter-spacing:2px;text-transform:uppercase;color:rgba(0,0,0,.3);
}
#cat-output .cat-cover-right-item strong{
  display:block;font-family:Georgia,'Times New Roman',serif;
  font-size:11px;font-weight:400;font-style:italic;
  color:rgba(0,0,0,.55);letter-spacing:0;text-transform:none;margin-bottom:3px;
}
#cat-output .cat-cover-divider{width:18px;height:1px;background:rgba(0,0,0,.1);}
/* Top pills */
#cat-output .cat-cover-top{
  position:relative;z-index:2;
  display:flex;justify-content:space-between;align-items:center;
  padding:32px 44px 0 56px;
}
#cat-output .cat-cover-pill{
  font-size:8px;font-weight:700;letter-spacing:3px;text-transform:uppercase;
  border:1px solid rgba(0,0,0,.18);color:rgba(0,0,0,.45);
  padding:5px 14px;border-radius:20px;background:rgba(255,255,255,.55);
  font-family:system-ui,sans-serif;
}
#cat-output .cat-cover-pill.ws{border-color:rgba(196,151,58,.55);color:#7a5010;background:rgba(196,151,58,.1);}
/* Body */
#cat-output .cat-cover-body{
  position:relative;z-index:2;flex:1;
  display:flex;flex-direction:column;justify-content:center;
  padding:0 216px 0 56px;
}
#cat-output .cat-cover-logo-ring{
  width:72px;height:72px;border-radius:14px;
  border:1px solid rgba(0,0,0,.12);background:rgba(255,255,255,.7);
  display:flex;align-items:center;justify-content:center;
  margin-bottom:30px;overflow:hidden;
}
#cat-output .cat-cover-logo-ring img{width:100%;height:100%;object-fit:contain;}
#cat-output .cat-cover-logo-ph{
  font-size:20px;font-weight:800;color:rgba(0,0,0,.28);
  font-family:Georgia,serif;letter-spacing:-1px;
}
#cat-output .cat-cover-eyebrow{
  font-size:9px;font-weight:700;letter-spacing:4px;text-transform:uppercase;
  color:#6B8F71;margin-bottom:12px;font-family:system-ui,sans-serif;
}
#cat-output .cat-cover-h1{
  font-family:Georgia,'Times New Roman',serif;
  font-size:58px;font-weight:700;
  color:#111;line-height:1.0;letter-spacing:-1.5px;margin-bottom:5px;
}
#cat-output .cat-cover-h1 em{font-style:italic;color:#C4973A;}
#cat-output .cat-cover-h2{
  font-family:Georgia,serif;font-size:21px;font-weight:400;font-style:italic;
  color:rgba(0,0,0,.38);margin-bottom:24px;
}
#cat-output .cat-cover-rule{
  width:44px;height:2px;margin-bottom:20px;
  background:linear-gradient(90deg,#6B8F71,#C4973A);border-radius:1px;
}
#cat-output .cat-cover-tagline{
  font-family:Georgia,serif;font-style:italic;font-size:16px;
  color:rgba(0,0,0,.45);margin-bottom:20px;
}
#cat-output .cat-cover-ws-box{
  display:inline-block;border-left:3px solid #C4973A;
  padding:10px 18px;background:rgba(196,151,58,.08);border-radius:0 8px 8px 0;
  font-size:11px;color:rgba(0,0,0,.6);line-height:1.8;
}
#cat-output .cat-cover-ws-box strong{color:#7a5010;}
#cat-output .cat-cover-vat-note{font-size:11px;font-style:italic;color:rgba(0,0,0,.38);}
/* Cover footer */
#cat-output .cat-cover-foot{
  position:relative;z-index:2;
  display:flex;justify-content:space-between;align-items:flex-end;
  padding:0 48px 30px 56px;
}
#cat-output .cat-cover-foot-left{font-size:10px;color:rgba(0,0,0,.42);line-height:1.9;}
#cat-output .cat-cover-foot-left strong{color:rgba(0,0,0,.7);font-weight:600;}
#cat-output .cat-cover-foot-web{font-family:Georgia,serif;font-style:italic;font-size:13px;color:#6B8F71;}

/* â•â• WS BANNER â•â• */
#cat-output .cat-ws-banner{
  background:#fffbeb;border-top:3px solid #C4973A;
  padding:11px 36px;display:flex;align-items:center;
}
#cat-output .cat-ws-term{
  display:flex;align-items:center;gap:7px;
  font-size:9px;font-weight:700;color:#78350f;letter-spacing:.5px;text-transform:uppercase;padding-right:18px;
}
#cat-output .cat-ws-term-dot{width:4px;height:4px;border-radius:50%;background:#C4973A;flex-shrink:0;}
#cat-output .cat-ws-sep{width:1px;height:22px;background:#fde68a;margin-right:18px;flex-shrink:0;}

/* â•â• SECTION â•â• */
#cat-output .cat-section{break-inside:auto;page-break-inside:auto;}
#cat-output .cat-sec-header{display:flex;align-items:center;padding:22px 36px 0;}
#cat-output .cat-sec-accent{
  width:4px;border-radius:2px;
  background:linear-gradient(180deg,#6B8F71,#A8C4AC);
  margin-right:14px;align-self:stretch;min-height:32px;
}
#cat-output .cat-sec-accent.ws{background:linear-gradient(180deg,#C4973A,#E5C878);}
#cat-output .cat-sec-name{
  font-family:Georgia,serif;font-size:24px;font-weight:700;
  color:#111;letter-spacing:-.3px;flex:1;
}
#cat-output .cat-sec-count{
  font-size:8px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;
  color:#9ca3af;border:1px solid #e5e7eb;padding:3px 10px;border-radius:10px;
}
#cat-output .cat-sec-rule{
  height:1px;background:linear-gradient(90deg,#e5e7eb,transparent);
  margin:10px 36px 0;
}

/* â•â• 3-COL PRODUCT GRID â•â• */
#cat-output .cat-grid{
  display:grid;grid-template-columns:repeat(3,1fr);
  gap:0;border-top:1px solid #f0f0f0;margin:14px 0 0;
}
#cat-output .cat-card{
  display:flex;flex-direction:column;
  border-right:1px solid #f0f0f0;border-bottom:1px solid #f0f0f0;
  background:#fff;position:relative;
  break-inside:avoid;page-break-inside:avoid;
}
#cat-output .cat-card:nth-child(3n){border-right:none;}
/* Accent line top of card */
#cat-output .cat-card-catline{height:3px;background:linear-gradient(90deg,#6B8F71,rgba(107,143,113,0));}
#cat-output .cat-card-catline.ws{background:linear-gradient(90deg,#C4973A,rgba(196,151,58,0));}
/* Image square */
#cat-output .cat-card-img{
  aspect-ratio:1/1;overflow:hidden;
  position:relative;background:#f5f5f5;
  display:flex;align-items:center;justify-content:center;
}
#cat-output .cat-card-img img{width:100%;height:100%;object-fit:cover;display:block;}
#cat-output .cat-card-img-ph{
  width:100%;height:100%;
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;
  background:linear-gradient(135deg,#f6f7f6,#eff1ef);
}
#cat-output .cat-card-img-ph-icon{
  width:38px;height:38px;border-radius:8px;background:#e4e8e4;
  display:flex;align-items:center;justify-content:center;
  font-size:11px;font-weight:700;color:#999;font-family:system-ui,sans-serif;
}
#cat-output .cat-card-img-ph-txt{font-size:8px;letter-spacing:1.5px;text-transform:uppercase;color:#c4ccc4;font-weight:600;}
/* Stock badges */
#cat-output .cat-stock{
  position:absolute;top:8px;left:8px;
  font-size:7px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;padding:3px 8px;border-radius:4px;
}
#cat-output .cat-stock-in{background:rgba(34,197,94,.12);color:#166534;border:1px solid rgba(34,197,94,.22);}
#cat-output .cat-stock-low{background:rgba(245,158,11,.12);color:#92400e;border:1px solid rgba(245,158,11,.22);}
#cat-output .cat-stock-out{background:rgba(239,68,68,.09);color:#b91c1c;border:1px solid rgba(239,68,68,.2);}
#cat-output .cat-moq{
  position:absolute;top:8px;right:8px;
  background:rgba(15,26,19,.72);color:rgba(255,255,255,.9);
  font-size:7px;font-weight:700;padding:3px 8px;border-radius:4px;
}
/* Card body */
#cat-output .cat-card-body{padding:12px 14px 14px;flex:1;display:flex;flex-direction:column;}
#cat-output .cat-card-name{
  font-family:Georgia,serif;font-size:13px;font-weight:700;
  color:#111;line-height:1.25;margin-bottom:4px;
}
#cat-output .cat-card-desc{
  font-size:10px;color:#6b7280;line-height:1.5;flex:1;margin-bottom:8px;
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;
}
#cat-output .cat-suggest{
  font-size:9px;font-weight:600;color:#4A6B50;
  background:#f0fdf4;border-radius:4px;padding:3px 8px;margin-bottom:8px;
  border:1px solid #dcfce7;
}
#cat-output .cat-suggest.ws{color:#92400e;background:#fffbeb;border-color:#fef3c7;}

/* â”€â”€ Simple product price â”€â”€ */
#cat-output .cat-price-row{
  display:flex;border-top:1px solid #f0f0f0;padding-top:9px;margin-top:auto;
}
#cat-output .cat-price{
  font-family:Georgia,serif;font-size:18px;font-weight:700;color:#111;line-height:1;
}
#cat-output .cat-price.ws{color:#C4973A;}
#cat-output .cat-price-note{font-size:8px;font-weight:600;letter-spacing:.8px;text-transform:uppercase;color:#9ca3af;margin-top:2px;}
#cat-output .cat-price-exvat{font-size:8px;color:#b0b7c0;margin-top:1px;}
#cat-output .cat-sku{font-size:8px;color:#d1d5db;margin-top:3px;}

/* â”€â”€ Variation price table â”€â”€ */
#cat-output .cat-var-table{margin-top:auto;border-top:1px solid #f0f0f0;padding-top:6px;}
#cat-output .cat-vr{
  display:flex;justify-content:space-between;align-items:center;
  padding:4px 0;border-bottom:1px solid #fafafa;
}
#cat-output .cat-vr:last-child{border-bottom:none;}
#cat-output .cat-vr-oos{opacity:.4;}
#cat-output .cat-vr-name{font-size:10px;font-weight:600;color:#374151;}
#cat-output .cat-vr-price-wrap{text-align:right;}
#cat-output .cat-vr-price{font-family:Georgia,serif;font-size:13px;font-weight:700;color:#111;line-height:1;}
#cat-output .cat-vr-price.ws{color:#C4973A;}
#cat-output .cat-vr-exvat{font-size:8px;color:#b0b7c0;margin-top:1px;}

/* â•â• PAGE FOOTER â•â• */
#cat-output .cat-page-foot{
  display:flex;align-items:center;justify-content:space-between;
  padding:10px 36px 12px;border-top:1px solid #f0f0f0;background:#fafafa;
}
#cat-output .cat-foot-brand{display:flex;align-items:center;gap:9px;}
#cat-output .cat-foot-logo{width:20px;height:20px;object-fit:contain;border-radius:3px;}
#cat-output .cat-foot-logo-ph{
  width:20px;height:20px;border-radius:4px;background:#e4e8e4;
  display:inline-flex;align-items:center;justify-content:center;
  font-size:8px;font-weight:700;color:#999;font-family:Georgia,serif;
}
#cat-output .cat-foot-info{font-size:9px;color:#9ca3af;line-height:1.7;}
#cat-output .cat-foot-info strong{color:#374151;font-weight:600;font-size:9px;}
#cat-output .cat-foot-tag{font-family:Georgia,serif;font-style:italic;font-size:10px;color:#c4ccc4;}
#cat-output .cat-foot-pg{font-size:9px;font-weight:600;color:#d1d5db;text-align:right;}
#cat-output .cat-foot-pg span{color:#9ca3af;}

/* â•â• WHATSAPP PHONE â•â• */
#cat-output .cat-wa-phone{width:380px;margin:0 auto;background:#ECE5DD;border-radius:22px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.22);}
#cat-output .cat-wa-bar{background:#111;height:28px;display:flex;align-items:center;justify-content:center;}
#cat-output .cat-wa-notch{width:80px;height:4px;border-radius:3px;background:rgba(255,255,255,.2);}
#cat-output .cat-wa-scroll{max-height:78vh;overflow-y:auto;background:#ECE5DD;}
#cat-output .cat-wa-head{background:#075E54;padding:12px 16px;display:flex;align-items:center;gap:11px;position:sticky;top:0;z-index:10;}
#cat-output .cat-wa-head-logo{width:38px;height:38px;border-radius:50%;background:#128C7E;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:rgba(255,255,255,.7);font-family:Georgia,serif;overflow:hidden;flex-shrink:0;}
#cat-output .cat-wa-head-logo img{width:100%;height:100%;object-fit:cover;}
#cat-output .cat-wa-head-name{font-size:14px;font-weight:600;color:#fff;}
#cat-output .cat-wa-head-sub{font-size:9px;color:rgba(255,255,255,.55);margin-top:1px;}
#cat-output .cat-wa-vat{background:#fff;padding:7px 14px;font-size:10px;font-weight:600;text-align:center;border-bottom:1px solid #e5e7eb;}
#cat-output .cat-wa-btns{display:flex;gap:7px;padding:9px 11px;background:#f9fafb;border-bottom:1px solid #e5e7eb;}
#cat-output .cat-wa-btn-share{flex:1;background:#25D366;color:#fff;border:none;border-radius:7px;padding:9px;font-size:10px;font-weight:700;cursor:pointer;}
#cat-output .cat-wa-btn-pdf{background:#075E54;color:#fff;border:none;border-radius:7px;padding:9px 12px;font-size:10px;font-weight:700;cursor:pointer;}
#cat-output .cat-wa-order{margin:9px 11px;border-radius:9px;overflow:hidden;border:1px solid #e5e7eb;display:none;background:#fff;}
#cat-output .cat-wa-order.show{display:block;}
#cat-output .cat-wa-order-hd{background:#f3f4f6;padding:8px 13px;font-size:9px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#374151;border-bottom:1px solid #e5e7eb;}
#cat-output .cat-wa-order-line{display:flex;justify-content:space-between;padding:6px 13px;font-size:11px;border-bottom:1px solid #f9fafb;color:#374151;}
#cat-output .cat-wa-order-total{background:#111;color:#fff;padding:8px 13px;display:flex;justify-content:space-between;font-size:11px;font-weight:700;}
#cat-output .cat-wa-cat{padding:9px 13px 5px;margin-top:5px;font-family:Georgia,serif;font-size:14px;font-weight:700;color:#111;border-bottom:1px solid rgba(0,0,0,.06);}
#cat-output .cat-wa-grid{display:grid;grid-template-columns:1fr 1fr;gap:1px;background:#e5e7eb;}
#cat-output .cat-wa-card{background:#fff;display:flex;flex-direction:column;}
#cat-output .cat-wa-card-img{aspect-ratio:1;overflow:hidden;background:#f5f5f5;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:#ccc;}
#cat-output .cat-wa-card-img img{width:100%;height:100%;object-fit:cover;}
#cat-output .cat-wa-card-body{padding:8px 9px 10px;}
#cat-output .cat-wa-card-name{font-family:Georgia,serif;font-size:11px;font-weight:700;color:#111;line-height:1.3;margin-bottom:2px;}
#cat-output .cat-wa-card-price{font-size:13px;font-weight:700;color:#111;margin-bottom:1px;}
#cat-output .cat-wa-card-price.ws{color:#C4973A;}
#cat-output .cat-wa-card-vat{font-size:7px;color:#9ca3af;margin-bottom:4px;}
#cat-output .cat-wa-suggest{font-size:8px;font-weight:700;color:#4A6B50;margin-bottom:5px;}
#cat-output .cat-wa-qty-row{display:flex;align-items:center;gap:4px;margin-top:5px;}
#cat-output .cat-wa-q-btn{width:24px;height:24px;border-radius:50%;border:1px solid #e5e7eb;background:#fff;cursor:pointer;font-size:15px;font-weight:600;color:#111;display:flex;align-items:center;justify-content:center;line-height:1;}
#cat-output .cat-wa-q-val{font-size:11px;font-weight:700;min-width:16px;text-align:center;}
#cat-output .cat-wa-q-add{flex:1;background:#075E54;color:#fff;border:none;border-radius:4px;padding:4px 5px;font-size:8px;font-weight:700;cursor:pointer;}
#cat-output .cat-wa-q-add.ws{background:#C4973A;}
#cat-output .cat-wa-oos{font-size:9px;font-weight:700;color:#dc2626;margin-top:5px;}
#cat-output .cat-wa-send{display:flex;align-items:center;justify-content:center;gap:7px;background:#25D366;color:#fff;border:none;border-radius:9px;margin:11px;padding:12px;width:calc(100% - 22px);font-size:11px;font-weight:700;cursor:pointer;}
#cat-output .cat-wa-foot{padding:9px 13px 16px;text-align:center;font-size:8px;color:#9ca3af;line-height:1.8;}

/* â•â• PRINT â•â• */
@media print{
  @page{size:A4 portrait;margin:0;}
  .catalogue{width:210mm!important;box-shadow:none!important;margin:0!important;}
  .cat-cover{height:297mm!important;page-break-after:always!important;break-after:page!important;}
  .cat-section{page-break-inside:auto;break-inside:auto;}
  .cat-grid{page-break-inside:auto;break-inside:auto;}
  .cat-card{break-inside:avoid;page-break-inside:avoid;}
  .cat-page-foot{break-inside:avoid;}
  .cat-sec-header{break-after:avoid;}
}
`;
  D.head.appendChild(s);
}

// â”€â”€ CATALOGUE PAGE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function catPage(){
  // Inject catalogue CSS once
  if(!D.getElementById('hpos-cat-css')) injectCatalogueCSS();
  // Initialise catalogue data on first visit
  setTimeout(function(){ if(typeof initCataloguePage==='function') initCataloguePage(); },50);
  var isWS = typeof CAT!=='undefined' && CAT.type==='wholesale';
  return el('div',{cls:'hpage'},[
    el('div',{style:{display:'flex',height:'100%',overflow:'hidden'}},[
      // Sidebar
      el('div',{style:{width:'270px',minWidth:'270px',background:'#2A2A2A',color:'#fff',display:'flex',flexDirection:'column',overflowY:'auto'}},[
        el('div',{style:{padding:'20px',borderBottom:'1px solid rgba(255,255,255,.08)'}},[
          el('div',{style:{fontFamily:"'Cormorant Garamond',serif",fontSize:'17px'}},[CFG.store_name||'Hambelela Organic']),
          el('div',{style:{fontSize:'9px',letterSpacing:'2px',textTransform:'uppercase',opacity:'.4',marginTop:'3px'}},[CFG.location||'Natural Â· Organic Â· Pure']),
          el('div',{style:{display:'inline-block',background:'#6B8F71',color:'#fff',fontSize:'9px',fontWeight:'700',letterSpacing:'1.5px',textTransform:'uppercase',padding:'3px 10px',borderRadius:'4px',marginTop:'10px'}},['ðŸ“° Catalogue Generator']),
        ]),
        // Mode
        el('div',{style:{padding:'16px 18px 0'}},[
          el('div',{style:{fontSize:'9px',fontWeight:'700',letterSpacing:'2.5px',textTransform:'uppercase',color:'rgba(255,255,255,.35)',marginBottom:'7px'}},['View Mode']),
          el('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',background:'rgba(255,255,255,.05)',borderRadius:'6px',overflow:'hidden',marginBottom:'10px'}},[
            el('button',{id:'cat-tab-preview',style:{padding:'8px',fontSize:'9px',fontWeight:'700',letterSpacing:'1px',textTransform:'uppercase',border:'none',cursor:'pointer',background:'rgba(255,255,255,.12)',color:'#fff'},onClick:function(){catSetMode('preview');}},['ðŸ“„ Print']),
            el('button',{id:'cat-tab-whatsapp',style:{padding:'8px',fontSize:'9px',fontWeight:'700',letterSpacing:'1px',textTransform:'uppercase',border:'none',cursor:'pointer',background:'transparent',color:'rgba(255,255,255,.4)'},onClick:function(){catSetMode('whatsapp');}},['ðŸ“± WhatsApp']),
          ]),
        ]),
        // Type
        el('div',{style:{padding:'0 18px 0',borderTop:'1px solid rgba(255,255,255,.07)',marginTop:'14px',paddingTop:'16px'}},[
          el('div',{style:{fontSize:'9px',fontWeight:'700',letterSpacing:'2.5px',textTransform:'uppercase',color:'rgba(255,255,255,.35)',marginBottom:'7px'}},['Catalogue Type']),
          el('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',borderRadius:'6px',overflow:'hidden',border:'1px solid rgba(255,255,255,.12)',marginBottom:'8px'}},[
            el('button',{style:{padding:'8px',fontSize:'10px',fontWeight:'700',border:'none',cursor:'pointer',background:(!isWS?'#6B8F71':'rgba(255,255,255,.04)'),color:(!isWS?'#fff':'rgba(255,255,255,.45)')},onClick:function(){if(typeof CAT!=='undefined')CAT.type='retail';catPage();catRender&&catRender();}},['ðŸ›’ Retail']),
            el('button',{style:{padding:'8px',fontSize:'10px',fontWeight:'700',border:'none',cursor:'pointer',background:(isWS?'#C4973A':'rgba(255,255,255,.04)'),color:(isWS?'#fff':'rgba(255,255,255,.45)')},onClick:function(){if(typeof CAT!=='undefined')CAT.type='wholesale';catPage();catRender&&catRender();}},['ðŸª Wholesale']),
          ]),
          el('div',{style:{fontSize:'9px',color:'rgba(255,255,255,.3)',lineHeight:'1.4',marginBottom:'14px'}},['Retail: prices include VAT. Wholesale: prices exclude VAT.']),
        ]),
        // Details
        el('div',{style:{padding:'0 18px 0',borderTop:'1px solid rgba(255,255,255,.07)',marginTop:'0',paddingTop:'16px'}},[
          el('div',{style:{fontSize:'9px',fontWeight:'700',letterSpacing:'2.5px',textTransform:'uppercase',color:'rgba(255,255,255,.35)',marginBottom:'7px'}},['Catalogue Details']),
          (function(){var inp=el('input',{id:'cat-inp-title',style:{width:'100%',background:'rgba(255,255,255,.07)',border:'1px solid rgba(255,255,255,.12)',borderRadius:'6px',color:'#fff',padding:'8px 11px',fontFamily:'DM Sans,sans-serif',fontSize:'12px',outline:'none',marginBottom:'7px'},placeholder:'Catalogue title'});inp.value='Product Catalogue';inp.addEventListener('input',function(){if(typeof catInputChange==='function')catInputChange();});inp.addEventListener('keydown',function(e){e.stopPropagation();});return inp;})(),
          (function(){var inp=el('input',{id:'cat-inp-tagline',style:{width:'100%',background:'rgba(255,255,255,.07)',border:'1px solid rgba(255,255,255,.12)',borderRadius:'6px',color:'#fff',padding:'8px 11px',fontFamily:'DM Sans,sans-serif',fontSize:'12px',outline:'none',marginBottom:'7px'},placeholder:'Tagline'});inp.value='Natural \u00B7 Organic \u00B7 Pure';inp.addEventListener('input',function(){if(typeof catInputChange==='function')catInputChange();});inp.addEventListener('keydown',function(e){e.stopPropagation();});return inp;})(),
          (function(){var inp=el('input',{id:'cat-inp-year',style:{width:'100px',background:'rgba(255,255,255,.07)',border:'1px solid rgba(255,255,255,.12)',borderRadius:'6px',color:'#fff',padding:'8px 11px',fontFamily:'DM Sans,sans-serif',fontSize:'12px',outline:'none',marginBottom:'7px'},placeholder:'Year'});inp.value=new Date().getFullYear().toString();inp.addEventListener('input',function(){if(typeof catInputChange==='function')catInputChange();});inp.addEventListener('keydown',function(e){e.stopPropagation();});return inp;})(),
        ]),
        // Category filter
        el('div',{style:{padding:'0 18px 0',borderTop:'1px solid rgba(255,255,255,.07)',marginTop:'14px',paddingTop:'16px'}},[
          el('div',{style:{fontSize:'9px',fontWeight:'700',letterSpacing:'2.5px',textTransform:'uppercase',color:'rgba(255,255,255,.35)',marginBottom:'7px'}},['Filter Categories']),
          el('div',{id:'cat-filter-chips',style:{display:'flex',flexWrap:'wrap',gap:'5px'}},[]),
        ]),
        // Actions
        el('div',{style:{padding:'16px 18px 20px',marginTop:'auto',display:'flex',flexDirection:'column',gap:'7px'}},[
          el('button',{cls:'hbtn hbtn-primary',style:{fontSize:'10px',letterSpacing:'1.5px'},onClick:function(){if(typeof catDoPrint==='function')catDoPrint();}},['ðŸ–¨ Print / Save as PDF']),
          el('button',{cls:'hbtn',style:{background:'#25D366',color:'#fff',border:'none',fontSize:'10px',letterSpacing:'1.5px'},onClick:function(){if(typeof catWAShare==='function')catWAShare();}},['ðŸ“² Share on WhatsApp']),
          el('button',{cls:'hbtn',style:{background:'rgba(255,255,255,.07)',border:'1px solid rgba(255,255,255,.12)',color:'rgba(255,255,255,.6)',fontSize:'9px'},onClick:function(){if(typeof initCataloguePage==='function'){if(typeof CAT!=='undefined')CAT.loaded=false;initCataloguePage();}}},['â†» Reload from WooCommerce']),
        ]),
      ]),
      // Preview
      el('div',{style:{flex:'1',overflowY:'auto',background:'#DDD9D1',padding:'28px'}},[
        el('div',{id:'cat-preview-label',style:{fontSize:'9px',fontWeight:'700',letterSpacing:'3px',textTransform:'uppercase',color:'#999',textAlign:'center',marginBottom:'18px'}},['CATALOGUE PREVIEW â€” A4 FORMAT']),
        el('div',{id:'cat-output',style:{}},[
          el('div',{style:{textAlign:'center',padding:'60px 20px',color:'#999',fontSize:'13px'}},['Loading catalogue from WooCommerceâ€¦']),
        ]),
      ]),
    ]),
  ]);
}

// â”€â”€ WHOLESALE ADMIN PAGE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function wsAdminPage(){
  var state = S._wsAdmin || {tab:'applications', customers:null, loading:false};
  S._wsAdmin = state;

  if(!state.customers && !state.loading){
    state.loading = true;
    api('/wholesale/customers').then(function(d){
      state.customers = Array.isArray(d)?d:[];
      state.loading   = false;
      redraw();
    }).catch(function(){ state.loading=false; redraw(); });
  }

  var tabs = [
    {k:'applications', label:'ðŸ“‹ Applications'},
    {k:'approved',     label:'âœ… Approved'},
    {k:'links',        label:'ðŸ”— Portal Links'},
  ];

  var customers = state.customers || [];
  var pending  = customers.filter(function(c){return c.status==='pending';});
  var approved = customers.filter(function(c){return c.status==='approved';});
  var rejected = customers.filter(function(c){return c.status==='rejected';});

  function approveApp(id){
    api('/wholesale/approve',{method:'POST',body:JSON.stringify({id:id})}).then(function(r){
      if(r.success){toast('Account approved and email sent','ok');state.customers=null;redraw();}
      else toast(r.error||'Error','err');
    });
  }
  function rejectApp(id){
    if(!confirm('Reject this application?')) return;
    api('/wholesale/reject',{method:'POST',body:JSON.stringify({id:id})}).then(function(r){
      if(r.success){toast('Application rejected','ok');state.customers=null;redraw();}
    });
  }

  var tabContent;
  if(state.loading){
    tabContent = el('div',{cls:'hloading'},[el('div',{cls:'hspinner'},[]),' Loadingâ€¦']);
  } else if(state.tab==='applications'){
    tabContent = pending.length ? el('div',{},[
      el('table',{cls:'htbl'},[
        el('thead',{},[el('tr',{},['Business','Contact','Email','Phone','City','Type','Date','Actions'].map(th))]),
        el('tbody',{},pending.map(function(c){
          return el('tr',{},[
            td(el('strong',{},[c.business_name])),
            td(c.contact_person),td(c.email),td(c.phone),td(c.city),td(c.business_type),
            td(c.created_at?c.created_at.slice(0,10):''),
            td(el('div',{style:{display:'flex',gap:'6px'}},[
              el('button',{cls:'hbtn hbtn-primary',style:{fontSize:'10px',padding:'5px 12px'},onClick:function(){approveApp(c.id);}},['âœ“ Approve']),
              el('button',{cls:'hbtn',style:{fontSize:'10px',padding:'5px 12px',color:'#dc2626',borderColor:'#dc2626'},onClick:function(){rejectApp(c.id);}},['âœ• Reject']),
            ])),
          ]);
        })),
      ]),
    ]) : el('div',{cls:'hempty2'},['No pending applications.']);
  } else if(state.tab==='approved'){
    tabContent = approved.length ? el('table',{cls:'htbl'},[
      el('thead',{},[el('tr',{},['Business','Contact','Email','Phone','Type','Approved'].map(th))]),
      el('tbody',{},approved.map(function(c){
        return el('tr',{},[
          td(el('strong',{},[c.business_name])),
          td(c.contact_person),td(c.email),td(c.phone),td(c.business_type),
          td(c.approved_at?c.approved_at.slice(0,10):''),
        ]);
      })),
    ]) : el('div',{cls:'hempty2'},['No approved accounts yet.']);
  } else if(state.tab==='links'){
    var siteUrl = SITE_URL||'';
    var links = [
      {label:'Register Page',   url:siteUrl+'/wholesale-register'},
      {label:'Login Page',      url:siteUrl+'/wholesale-login'},
      {label:'Dashboard',       url:siteUrl+'/wholesale-dashboard'},
      {label:'Catalogue',       url:siteUrl+'/wholesale-catalogue'},
      {label:'My Orders',       url:siteUrl+'/wholesale-orders'},
      {label:'My Invoices',     url:siteUrl+'/wholesale-invoices'},
    ];
    tabContent = el('div',{},[
      el('p',{style:{fontSize:'12px',color:'#6b7280',marginBottom:'16px'}},['Share the Register link with new wholesale customers. All pages are automatically created on your website.']),
      el('div',{style:{display:'flex',flexDirection:'column',gap:'10px'}},links.map(function(l){
        return el('div',{style:{display:'flex',alignItems:'center',gap:'12px',background:'#f9fafb',border:'1px solid #e5e7eb',borderRadius:'7px',padding:'12px 16px'}},[
          el('div',{style:{fontWeight:'600',fontSize:'12px',minWidth:'140px'}},[l.label]),
          el('code',{style:{flex:'1',fontSize:'11px',color:'#6b7280',background:'#fff',border:'1px solid #e5e7eb',borderRadius:'4px',padding:'4px 8px'}},[l.url]),
          el('a',{cls:'hbtn',href:l.url,target:'_blank',style:{fontSize:'10px',padding:'5px 12px'}},['Open â†’']),
        ]);
      })),
    ]);
  }

  return el('div',{cls:'hpage',style:{padding:'28px',overflowY:'auto'}},[
    el('div',{style:{maxWidth:'900px'}},[
      el('div',{style:{marginBottom:'24px'}},[
        el('h2',{style:{fontFamily:"'Cormorant Garamond',serif",fontSize:'26px',fontWeight:'400',color:'#1a1a1a',letterSpacing:'-.3px'}},['ðŸª Wholesale Portal Admin']),
        el('p',{style:{fontSize:'12px',color:'#6b7280',marginTop:'4px'}},['Manage wholesale applications, approved accounts and portal links.']),
      ]),
      // Summary cards
      el('div',{cls:'hsumcards',style:{marginBottom:'24px'}},[
        scard('Pending Applications',String(pending.length),'awaiting review'),
        scard('Approved Accounts',String(approved.length),'active wholesale buyers'),
        scard('Rejected',String(rejected.length),'applications declined'),
      ]),
      // Tabs
      el('div',{style:{display:'flex',gap:'4px',borderBottom:'2px solid #e5e7eb',marginBottom:'20px'}},
        tabs.map(function(t){
          var active = state.tab===t.k;
          return el('button',{
            style:{padding:'9px 18px',fontSize:'11px',fontWeight:'700',letterSpacing:'.5px',
                   border:'none',cursor:'pointer',borderRadius:'6px 6px 0 0',
                   background:active?'#fff':'transparent',
                   color:active?'#2a2a2a':'#9ca3af',
                   borderBottom:active?'2px solid #6B8F71':'2px solid transparent',
                   marginBottom:'-2px'},
            onClick:function(){state.tab=t.k;redraw();}
          },[t.label+(t.k==='applications'&&pending.length?' ('+pending.length+')':'')]);
        })
      ),
      tabContent,
    ]),
  ]);
}

// â”€â”€ WHOLESALE PRODUCTS PAGE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function wsProductsPage(){
  // Admin-only guard
  var isAdmin = true; // PHP already restricts menu to manage_options; double-check via CFG if needed

  var ws = S._wsProds || {products:[], loading:false, loaded:false, saving:{}, bulk:{mode:'',val:'',applying:false}, q:''};
  S._wsProds = ws;

  if(!ws.loaded && !ws.loading){
    ws.loading = true;
    apiForce('/catalogue/products').then(function(d){
      ws.products = Array.isArray(d) ? d : [];
      ws.products.forEach(function(p){
        p._wsEdit   = p.wholesale_price  != null ? String(p.wholesale_price)  : '';
        p._moqEdit  = p.moq              != null ? String(p.moq)              : '';
        p._sqEdit   = p.suggested_qty    != null ? String(p.suggested_qty)    : '';
      });
      ws.loaded  = true;
      ws.loading = false;
      var count = ws.products.length;
      toast('âœ“ '+count+' products loaded from WooCommerce','ok');
      redraw();
    }).catch(function(e){ ws.loading=false; toast('Reload failed: '+(e.message||'unknown error'),'err'); redraw(); });
  }

  function saveRow(p){
    ws.saving[p.id] = true; redraw();
    api('/catalogue/products/'+p.id+'/wholesale',{method:'POST',body:JSON.stringify({
      wholesale_price: p._wsEdit  === '' ? null : parseFloat(p._wsEdit),
      moq:             p._moqEdit === '' ? null : parseInt(p._moqEdit),
      suggested_qty:   p._sqEdit  === '' ? null : parseInt(p._sqEdit),
    })}).then(function(r){
      ws.saving[p.id] = false;
      if(r.success){ p.wholesale_price=r.wholesale_price; p.moq=r.moq; p.suggested_qty=r.suggested_qty; }
      else toast(r.error||'Save failed','err');
      redraw();
    }).catch(function(){ ws.saving[p.id]=false; toast('Save failed','err'); redraw(); });
  }

  function applyBulk(){
    if(!ws.bulk.val||isNaN(parseFloat(ws.bulk.val))){ toast('Enter a valid number','err'); return; }
    ws.bulk.applying = true;
    var v = parseFloat(ws.bulk.val);
    ws.products.forEach(function(p){
      var retail_exvat = (p.regular_price || p.price) / 1.15;
      var current = p.wholesale_price || (retail_exvat * 0.60);
      var newPrice;
      if(ws.bulk.mode==='pct_up')   newPrice = Math.round(current * (1 + v/100) * 100)/100;
      else if(ws.bulk.mode==='pct_dn') newPrice = Math.round(current * (1 - v/100) * 100)/100;
      else if(ws.bulk.mode==='margin') newPrice = Math.round(retail_exvat * (v/100) * 100)/100;
      else if(ws.bulk.mode==='fixed')  newPrice = Math.round(current + v, 100)/100;
      if(newPrice && newPrice > 0){ p._wsEdit = String(newPrice); p.wholesale_price = newPrice; }
    });
    // Save all at once
    var saves = ws.products.map(function(p){
      return api('/catalogue/products/'+p.id+'/wholesale',{method:'POST',body:JSON.stringify({
        wholesale_price: p.wholesale_price,
        moq: p.moq,
        suggested_qty: p.suggested_qty,
      })});
    });
    Promise.all(saves).then(function(){
      ws.bulk.applying = false;
      ws.bulk.val = '';
      toast('Bulk update applied to '+ws.products.length+' products','ok');
      redraw();
    }).catch(function(){ ws.bulk.applying=false; toast('Bulk save failed','err'); redraw(); });
  }

  var filtered = ws.products.filter(function(p){
    if(!ws.q) return true;
    return (p.name+' '+(p.sku||'')+' '+(p.category||'')).toLowerCase().indexOf(ws.q.toLowerCase())>-1;
  });

  var stockDot = function(p){
    if(!p.stock_qty||p.stock_qty<=0||p.stock_status==='outofstock') return el('span',{cls:'hbadge',style:{background:'var(--redl)',color:'var(--red)',fontSize:'9px'}},['Out of Stock']);
    if(p.stock_qty<=5) return el('span',{cls:'hbadge',style:{background:'var(--yell)',color:'var(--yel)',fontSize:'9px'}},['Low: '+p.stock_qty]);
    return el('span',{cls:'hbadge',style:{background:'var(--grnl)',color:'var(--grn)',fontSize:'9px'}},[''+p.stock_qty]);
  };

  var bulkModes = [
    {k:'pct_up',   label:'Increase by %'},
    {k:'pct_dn',   label:'Decrease by %'},
    {k:'margin',   label:'Set margin % of retail ex-VAT'},
    {k:'fixed',    label:'Add fixed amount (N$)'},
  ];

  return el('div',{cls:'hpage',style:{display:'flex',flexDirection:'column',overflow:'hidden'}},[
    // Toolbar
    el('div',{cls:'hpageheader',style:{flexShrink:0,borderBottom:'1px solid var(--bd)',padding:'14px 20px',background:'var(--sur)',display:'flex',alignItems:'center',gap:'14px',flexWrap:'wrap'}},[
      el('div',{style:{flex:'1'}},[
        el('div',{style:{fontSize:'16px',fontWeight:'700',color:'var(--tx)'}},['ðŸ“¦ Wholesale Products']),
        el('div',{style:{fontSize:'11px',color:'var(--tx3)',marginTop:'2px'}},['Edit wholesale prices, MOQ and suggested quantities. Changes update the catalogue and portal instantly.']),
      ]),
      // Search
      (function(){
        var inp = el('input',{cls:'hsinp',style:{width:'200px'},placeholder:'Search productsâ€¦'});
        inp.value = ws.q||'';
        inp.addEventListener('input',function(){ ws.q=this.value; redraw(); });
        inp.addEventListener('keydown',function(e){e.stopPropagation();});
        return inp;
      })(),
      el('button',{cls:'hbtn',style:{fontSize:'11px',opacity:ws.loading?.5:1},
        disabled:ws.loading,
        onClick:function(){
          if(ws.loading)return;
          // Full reset â€” wipe everything so fresh data comes in
          S._wsProds={products:[],loading:false,loaded:false,saving:{},bulk:{mode:'',val:'',applying:false},q:ws.q};
          S.products=[]; S.cats=['All']; S.gridPage=0;
          loadProducts(true);  // force-reload POS product grid with cache-busting
          redraw();            // triggers wsProductsPage to re-fetch catalogue/products below
        }
      },[ws.loading?'â³ Syncingâ€¦':'â†» Reload from WooCommerce']),
    ]),

    // Bulk edit bar
    el('div',{style:{flexShrink:0,background:'#fffbeb',borderBottom:'1px solid #fcd34d',padding:'10px 20px',display:'flex',alignItems:'center',gap:'10px',flexWrap:'wrap'}},[
      el('span',{style:{fontSize:'11px',fontWeight:'700',color:'#92400e',letterSpacing:'.5px',textTransform:'uppercase'}},['âš¡ Bulk Edit']),
      (function(){
        var sel = el('select',{style:{fontSize:'11px',padding:'5px 8px',border:'1px solid #fcd34d',borderRadius:'5px',background:'#fff',cursor:'pointer'}});
        sel.innerHTML = '<option value="">â€” Select action â€”</option>';
        bulkModes.forEach(function(m){ sel.innerHTML += '<option value="'+m.k+'">'+m.label+'</option>'; });
        sel.value = ws.bulk.mode||'';
        sel.addEventListener('change',function(){ ws.bulk.mode=this.value; redraw(); });
        return sel;
      })(),
      (function(){
        var inp = el('input',{style:{width:'90px',fontSize:'11px',padding:'5px 9px',border:'1px solid #fcd34d',borderRadius:'5px'},placeholder:'Value'});
        inp.value = ws.bulk.val||'';
        inp.addEventListener('input',function(){ ws.bulk.val=this.value; });
        inp.addEventListener('keydown',function(e){e.stopPropagation();});
        return inp;
      })(),
      el('button',{cls:'hbtn hbtn-primary',style:{fontSize:'11px',opacity:ws.bulk.applying?.6:1},onClick:function(){
        if(!ws.bulk.mode){ toast('Select an action first','err'); return; }
        if(confirm('Apply "'+ws.bulk.mode+'" to all '+(filtered.length)+' products? This will save immediately.')) applyBulk();
      }},['Apply to All']),
      el('span',{style:{fontSize:'10px',color:'#b45309'}},['Applies to all products (or filtered results if searching)']),
    ]),

    // Table
    el('div',{style:{flex:'1',overflowY:'auto',padding:'0'}},[
      ws.loading ? el('div',{cls:'hloading',style:{padding:'40px'}},[ el('div',{cls:'hspinner'},[]),' Loading productsâ€¦']) :
      !filtered.length ? el('div',{cls:'hempty2',style:{padding:'40px'}},['No products found.']) :
      el('table',{cls:'htbl',style:{width:'100%'}},[
        el('thead',{},[
          el('tr',{},[
            el('th',{style:{width:'50px'}},['']),           // image
            el('th',{style:{minWidth:'160px'}},['Product']),
            el('th',{style:{width:'90px'}},['SKU']),
            el('th',{style:{width:'110px',textAlign:'right'}},['Retail Price']),
            el('th',{style:{width:'130px',textAlign:'right'}},['Wholesale Price âœŽ']),
            el('th',{style:{width:'80px',textAlign:'center'}},['MOQ']),
            el('th',{style:{width:'90px',textAlign:'center'}},['Suggest Qty']),
            el('th',{style:{width:'80px',textAlign:'center'}},['Stock']),
            el('th',{style:{width:'70px',textAlign:'center'}},['Save']),
          ]),
        ]),
        el('tbody',{},filtered.map(function(p){
          var isSaving = !!ws.saving[p.id];
          var defWS = Math.round(((p.regular_price||p.price)/1.15)*0.60*100)/100;

          function numInp(val, setter, placeholder){
            var inp = el('input',{
              style:{width:'100%',padding:'5px 7px',border:'1px solid var(--bd)',borderRadius:'5px',fontSize:'12px',textAlign:'right',background:'var(--sur)'},
              placeholder: placeholder
            });
            inp.value = val;
            inp.addEventListener('input',function(){ setter(this.value); });
            inp.addEventListener('keydown',function(e){
              e.stopPropagation();
              if(e.key==='Enter') saveRow(p);
            });
            return inp;
          }

          return el('tr',{style:{opacity:isSaving?.6:1}},[
            // Image
            td(p.image
              ? el('img',{style:{width:'38px',height:'38px',objectFit:'cover',borderRadius:'5px',display:'block'},'src':p.image})
              : el('div',{style:{width:'38px',height:'38px',borderRadius:'5px',background:'var(--sur3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px'}},['ðŸŒ¿'])
            ),
            // Name + cat
            td(el('div',{},[
              el('div',{style:{fontWeight:'600',fontSize:'12px',color:'var(--tx)',lineHeight:'1.3'}},[p.name]),
              el('div',{style:{fontSize:'10px',color:'var(--tx3)',marginTop:'2px'}},[p.category||'']),
            ])),
            td(el('div',{style:{fontSize:'10px',color:'var(--tx3)',fontFamily:'monospace'}},[p.sku||'â€”'])),
            // Retail â€” show regular_price as the base; if a sale is active show sale price in green
            (function(){
              var regPrice = p.regular_price || p.price;
              var salePrice = p.price;
              var onSale = regPrice > salePrice + 0.01;
              var exvat_reg = Math.round(regPrice/1.15*100)/100;
              return td(el('div',{style:{textAlign:'right'}},[
                onSale
                  ? el('div',{style:{fontSize:'10px',color:'#9ca3af',textDecoration:'line-through'}},[CFG.currency+' '+regPrice.toFixed(2)])
                  : null,
                el('div',{style:{fontWeight:'600',fontSize:'12px',color:onSale?'#16a34a':'var(--tx)'}},[CFG.currency+' '+salePrice.toFixed(2)+(onSale?' ðŸ·':'')]),
                el('div',{style:{fontSize:'9px',color:'var(--tx4)'}},[CFG.currency+' '+exvat_reg.toFixed(2)+' ex-VAT']),
              ]));
            })(),
            // Wholesale price (editable)
            td(el('div',{style:{position:'relative'}},[
              numInp(p._wsEdit, function(v){ p._wsEdit=v; }, String(defWS)),
              p._wsEdit==='' ? el('div',{style:{fontSize:'9px',color:'var(--tx4)',marginTop:'2px',textAlign:'right'}},['Default: '+CFG.currency+' '+defWS]) : null,
            ])),
            // MOQ
            el('td',{style:{textAlign:'center',padding:'8px'}},[
              numInp(p._moqEdit, function(v){ p._moqEdit=v; }, 'â€”'),
            ]),
            // Suggested qty
            el('td',{style:{textAlign:'center',padding:'8px'}},[
              numInp(p._sqEdit, function(v){ p._sqEdit=v; }, 'â€”'),
            ]),
            // Stock
            el('td',{style:{textAlign:'center',padding:'8px'}},[stockDot(p)]),
            // Save button
            el('td',{style:{textAlign:'center',padding:'8px'}},[
              el('button',{
                cls:'hbtn hbtn-primary',
                style:{fontSize:'10px',padding:'5px 10px',opacity:isSaving?.5:1},
                onClick:function(){ if(!isSaving) saveRow(p); }
              },[isSaving?'â€¦':'Save']),
            ]),
          ]);
        })),
      ]),
    ]),
  ]);
}


// â”€â”€ BOOT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',boot);
else boot();
})();
