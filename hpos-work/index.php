/* Hambelela Organic — Catalogue Generator v3
   Uses window.hposAPI bridge from pos.js boot()              */

var CAT = {
  products:[], settings:{}, loaded:false, loading:false,
  selectedCats:[], mode:'preview', type:'retail',
  title:'Product Catalogue', tagline:'Natural \u00B7 Organic \u00B7 Pure',
  year:new Date().getFullYear().toString(), waCart:{},
};

/* ── API BRIDGE ─────────────────────────────────────────────── */
function catApi(path,opts){
  if(typeof window.hposAPI==='function') return window.hposAPI(path,opts);
  var d=window.hposData||{};
  return fetch((d.apiUrl||'/wp-json/hpos/v1')+path,Object.assign(
    {headers:{'Content-Type':'application/json','X-WP-Nonce':d.nonce||''}},opts||{}
  )).then(function(r){return r.json();});
}
function catCFG(k,fb){
  var c=window.hposCFG;
  if(c&&c[k]!=null) return c[k];
  var d=window.hposData||{};
  var m={currency:d.currency||'N$',store_name:d.storeName||'Hambelela Organic',
         store_phone:d.storePhone||'+264 856628598',logo_url:d.logoUrl||''};
  return m[k]!=null?m[k]:(fb||'');
}

/* ── ENTRY ───────────────────────────────────────────────────── */
function initCataloguePage(){
  if(CAT.loading) return;
  if(!CAT.loaded){
    CAT.loading=true;
    var out=document.getElementById('cat-output');
    if(out) out.innerHTML='<div style="text-align:center;padding:80px 20px;color:#888;font-family:sans-serif;font-size:13px;letter-spacing:.5px">Loading products from WooCommerce\u2026</div>';
    Promise.all([
      catApi('/catalogue/products').then(function(d){CAT.products=Array.isArray(d)?d:[];}),
      catApi('/catalogue/settings').then(function(d){CAT.settings=d||{};catApplySettings();}),
    ]).then(function(){
      CAT.loaded=true; CAT.loading=false;
      catBuildFilter(); catRender();
    }).catch(function(e){
      CAT.loading=false;
      var out=document.getElementById('cat-output');
      if(out) out.innerHTML='<div style="padding:40px;color:#ef4444;font-size:13px;font-family:sans-serif;">\u26a0 Failed to load products: '+(e&&e.message?e.message:'Check WooCommerce is active.')+'</div>';
    });
  } else { catBuildFilter(); catRender(); }
}
function catApplySettings(){
  var s=CAT.settings;
  if(s.store_tagline) CAT.tagline=s.store_tagline;
  function si(id,v){var e=document.getElementById(id);if(e&&!e._usr)e.value=v||'';}
  si('cat-inp-title',CAT.title); si('cat-inp-tagline',CAT.tagline); si('cat-inp-year',CAT.year);
}

/* ── FILTER ──────────────────────────────────────────────────── */
function catBuildFilter(){
  var cats=[];
  CAT.products.forEach(function(p){if(p.category&&!cats.includes(p.category))cats.push(p.category);});
  var wrap=document.getElementById('cat-filter-chips'); if(!wrap) return;
  wrap.innerHTML='';
  function chip(lbl,active,fn){
    var b=document.createElement('button');
    b.style.cssText='font-size:9px;font-weight:600;letter-spacing:.5px;padding:3px 9px;border-radius:3px;border:1px solid '+(active?'#6B8F71':'rgba(255,255,255,.18)')+';color:'+(active?'#fff':'rgba(255,255,255,.5)')+';background:'+(active?'#6B8F71':'transparent')+';cursor:pointer;margin:2px;';
    b.textContent=lbl; b.onclick=fn; return b;
  }
  wrap.appendChild(chip('All',!CAT.selectedCats.length,function(){CAT.selectedCats=[];catBuildFilter();catRender();}));
  cats.forEach(function(c){
    wrap.appendChild(chip(c,CAT.selectedCats.includes(c),function(){
      var i=CAT.selectedCats.indexOf(c);
      if(i>-1)CAT.selectedCats.splice(i,1);else CAT.selectedCats.push(c);
      catBuildFilter();catRender();
    }));
  });
}

/* ── MODE / TYPE ─────────────────────────────────────────────── */
function catSetMode(m){
  CAT.mode=m;
  var tp=document.getElementById('cat-tab-preview'),tw=document.getElementById('cat-tab-whatsapp');
  if(tp){tp.style.background=m==='preview'?'rgba(255,255,255,.12)':'transparent';tp.style.color=m==='preview'?'#fff':'rgba(255,255,255,.4)';}
  if(tw){tw.style.background=m==='whatsapp'?'rgba(255,255,255,.12)':'transparent';tw.style.color=m==='whatsapp'?'#fff':'rgba(255,255,255,.4)';}
  catRender();
}
function catSetType(t){CAT.type=t;catRender();}
function catInputChange(){
  var ti=document.getElementById('cat-inp-title'),ta=document.getElementById('cat-inp-tagline'),yr=document.getElementById('cat-inp-year');
  if(ti){ti._usr=true;CAT.title=ti.value;}
  if(ta){ta._usr=true;CAT.tagline=ta.value;}
  if(yr){yr._usr=true;CAT.year=yr.value;}
  catRender();
}

/* ── MAIN RENDER ─────────────────────────────────────────────── */
function catRender(){
  if(!CAT.loaded){initCataloguePage();return;}
  var prods=CAT.products.filter(function(p){
    return !CAT.selectedCats.length||CAT.selectedCats.includes(p.category);
  });
  if(CAT.mode==='whatsapp') catRenderWA(prods);
  else catRenderPrint(prods);
}

/* ── UTILS ───────────────────────────────────────────────────── */
function C(n){return(CAT.settings.currency||catCFG('currency','N$'))+' '+Number(n||0).toFixed(2);}
function E(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function wsP(p){
  if(p.wholesale_price!=null&&p.wholesale_price!=='') return parseFloat(p.wholesale_price);
  return Math.round((p.price/1.15)*0.60*100)/100;
}
function stCls(p){
  // For variable products, use the stock_status derived from variations (set by PHP)
  if(p.type==='variable'||p.variations&&p.variations.length){
    if(p.stock_status==='instock'||p.has_in_stock_variation) return 'in';
    // Count in-stock variations directly if available
    var anyIn=(p.variations||[]).some(function(v){
      if(typeof v.in_stock==='boolean') return v.in_stock;
      return v.manage_stock?(v.stock_qty>0):(v.stock_status==='instock'||v.stock_status==='onbackorder');
    });
    return anyIn?'in':'out';
  }
  // Simple product
  if(p.stock_status==='outofstock') return 'out';
  if(p.manage_stock&&p.stock_qty!=null&&p.stock_qty<=0) return 'out';
  if(p.stock_qty!=null&&p.stock_qty<=5&&p.stock_qty>0) return 'low';
  return 'in';
}
function stLbl(p){
  var c=stCls(p);
  if(c==='out') return 'Out of Stock';
  if(c==='low') return 'Low Stock';
  return 'In Stock';
}
function catN(){return CAT.settings.store_name||catCFG('store_name','Hambelela Organic');}
function catA(){return CAT.settings.store_address||'Office 1.3, Corner John Muundjua & Julius Nyerere St';}
function catCT(){return CAT.settings.store_city||'Lazarette House, Ausspannplatz, Windhoek, Namibia';}
function catPH(){return CAT.settings.store_phone||catCFG('store_phone','+264 856628598');}
function catW(){return CAT.settings.store_website||'www.hambelelaorganic.com';}
function catLG(){return CAT.settings.logo_url||catCFG('logo_url','');}

/* ═══════════════════════════════════════════════════════════════
   PRINT / A4 CATALOGUE RENDER
═══════════════════════════════════════════════════════════════ */
function catRenderPrint(prods){
  var ws=CAT.type==='wholesale';
  var logo=catLG(); var yr=E(CAT.year);

  /* ── COVER ── */
  var h='<div class="catalogue"><div class="cat-cover">';
  h+='<div class="cat-cover-bg"></div><div class="cat-cover-grid"></div><div class="cat-cover-bar"></div>';

  /* Right decorative panel */
  h+='<div class="cat-cover-right">';
  var rItems=['Raw Ingredients','Plant Butters','Wellness Herbs','DIY Cosmetics','Organic Goodness'];
  rItems.forEach(function(ri,i){
    if(i>0) h+='<div class="cat-cover-divider"></div>';
    h+='<div class="cat-cover-right-item"><strong>'+E(ri)+'</strong>Hambelela Organic</div>';
  });
  h+='</div>';

  /* Top row */
  h+='<div class="cat-cover-top">';
  h+='<div class="cat-cover-pill'+(ws?' ws':'')+'">'+yr+'</div>';
  h+='<div class="cat-cover-pill'+(ws?' ws':'')+'">'+E(ws?'Wholesale Price List':'Retail Catalogue')+'</div>';
  h+='</div>';

  /* Body */
  h+='<div class="cat-cover-body">';
  /* Logo */
  h+='<div class="cat-cover-logo-ring">'+(logo?'<img src="'+E(logo)+'" alt="logo">':'<span class="cat-cover-logo-ph">HO</span>')+'</div>';
  h+='<div class="cat-cover-eyebrow">'+E(catN())+'</div>';

  /* Big headline — split title into two words if possible */
  var words=CAT.title.split(' ');
  var h1line1=words.slice(0,Math.ceil(words.length/2)).join(' ');
  var h1line2=words.slice(Math.ceil(words.length/2)).join(' ');
  h+='<div class="cat-cover-h1">'+E(h1line1)+(h1line2?'<br><em>'+E(h1line2)+'</em>':'')+'</div>';
  h+='<div class="cat-cover-h2">'+E(catN())+'</div>';
  h+='<div class="cat-cover-rule"></div>';
  h+='<div class="cat-cover-tagline">'+E(CAT.tagline)+'</div>';

  if(ws){
    h+='<div class="cat-cover-ws-box"><strong>Wholesale Clients Only</strong><br>All prices exclude VAT &bull; VAT (15%) added on invoice<br>MOQ applies per product line</div>';
  } else {
    h+='<div class="cat-cover-vat-note">All prices include VAT at 15% &bull; '+yr+'</div>';
  }
  h+='</div>'; /* /cover-body */

  /* Cover footer */
  h+='<div class="cat-cover-foot">';
  h+='<div class="cat-cover-foot-left"><strong>'+E(catN())+'</strong><br>'+E(catA())+'<br>'+E(catCT())+'<br>Call / WhatsApp: '+E(catPH())+'</div>';
  h+='<div class="cat-cover-foot-web">'+E(catW())+'</div>';
  h+='</div>';
  h+='</div>'; /* /cat-cover */

  /* ── WS TERMS BANNER ── */
  if(ws){
    h+='<div class="cat-ws-banner">';
    [['Wholesale Price List',''],['Pharmacies &amp; Retailers',''],['Prices Exclude VAT',''],['15% VAT on Invoice','']].forEach(function(t,i){
      if(i>0) h+='<div class="cat-ws-sep"></div>';
      h+='<div class="cat-ws-term"><div class="cat-ws-term-dot"></div>'+t[0]+'</div>';
    });
    h+='</div>';
  }

  /* ── CATEGORIES ── */
  var cats=[];
  prods.forEach(function(p){if(p.category&&!cats.includes(p.category))cats.push(p.category);});
  if(!prods.length) h+='<div style="padding:60px;text-align:center;color:#9ca3af;font-family:sans-serif;">No products. Try clearing category filters.</div>';

  var pageNum=2;
  cats.forEach(function(cat){
    var cp=prods.filter(function(p){return p.category===cat;});
    h+='<div class="cat-section">';

    /* Section header */
    h+='<div class="cat-sec-header">';
    h+='<div class="cat-sec-accent'+(ws?' ws':'')+'"></div>';
    h+='<div class="cat-sec-name">'+E(cat)+'</div>';
    h+='<div class="cat-sec-count">'+cp.length+' Product'+(cp.length!==1?'s':'')+'</div>';
    h+='</div>';
    h+='<div class="cat-sec-rule"></div>';

    /* Product grid */
    h+='<div class="cat-grid">';
    cp.forEach(function(p){
      var price=ws?wsP(p):p.price;
      var sc=stCls(p); var sl=stLbl(p);
      var vars=p.variations||[];

      h+='<div class="cat-card">';
      /* Category accent line */
      h+='<div class="cat-card-catline'+(ws?' ws':'')+'"></div>';
      /* Image */
      h+='<div class="cat-card-img">';
      if(p.image) h+='<img src="'+E(p.image)+'" alt="'+E(p.name)+'" loading="lazy">';
      else h+='<div class="cat-card-img-ph"><div class="cat-card-img-ph-icon" style="width:40px;height:40px;border-radius:8px;background:#e8eceb;display:flex;align-items:center;justify-content:center;font-family:serif;font-size:13px;font-weight:700;color:#9ca3af">IMG</div><div class="cat-card-img-ph-txt">No Image</div></div>';
      /* Stock badge */
      h+='<span class="cat-stock cat-stock-'+E(sc)+'">'+E(sl)+'</span>';
      /* MOQ badge */
      if(ws&&p.moq) h+='<span class="cat-moq">MOQ '+E(String(p.moq))+'</span>';
      h+='</div>'; /* /cat-card-img */

      /* Body */
      h+='<div class="cat-card-body">';
      h+='<div class="cat-card-name">'+E(p.name)+'</div>';
      if(p.desc) h+='<div class="cat-card-desc">'+E(p.desc)+'</div>';

      /* Suggested qty */
      if(p.suggested_qty){
        h+='<div class="cat-suggest'+(ws?' ws':'')+'">Most '+(ws?'pharmacies':'customers')+' order '+E(String(p.suggested_qty))+' units</div>';
      }

      /* Pricing */
      if(vars.length){
        /* Variable product — show a price row per variation */
        h+='<div class="cat-var-table">';
        vars.forEach(function(v){
          var vPrice = ws ? (v.ws_price ? parseFloat(v.ws_price) : wsP(p)) : parseFloat(v.price||0);
          var vExVat = Math.round(vPrice/1.15*100)/100;
          var vSc = (typeof v.in_stock==='boolean')
            ? (v.in_stock?(v.stock_qty!=null&&v.stock_qty<=5?'low':'in'):'out')
            : ((!v.stock_qty||v.stock_qty<=0||v.stock_status==='outofstock')?'out':(v.stock_qty<=5?'low':'in'));
          h+='<div class="cat-vr'+(vSc==='out'?' cat-vr-oos':'')+'">';
          h+='<div class="cat-vr-name">'+E(v.name||'')+'</div>';
          h+='<div class="cat-vr-price-wrap">';
          h+='<div class="cat-vr-price'+(ws?' ws':'')+'">'+C(vPrice)+'</div>';
          if(!ws) h+='<div class="cat-vr-exvat">'+C(vExVat)+' ex-VAT</div>';
          h+='</div>';
          h+='</div>';
        });
        h+='</div>'; /* /cat-var-table */
        if(p.sku) h+='<div class="cat-sku" style="margin-top:6px">SKU: '+E(p.sku)+'</div>';
      } else {
        /* Simple product */
        var exVat = Math.round(price/1.15*100)/100;
        h+='<div class="cat-price-row">';
        h+='<div>';
        h+='<div class="cat-price'+(ws?' ws':'')+'">'+C(price)+'</div>';
        h+='<div class="cat-price-note">'+(ws?'excl. VAT':'incl. VAT 15%')+'</div>';
        if(!ws) h+='<div class="cat-price-exvat">'+C(exVat)+' ex-VAT</div>';
        if(p.sku) h+='<div class="cat-sku">SKU: '+E(p.sku)+'</div>';
        h+='</div>';
        h+='</div>'; /* /price-row */
      }
      h+='</div>'; /* /body */
      h+='</div>'; /* /cat-card */
    });
    h+='</div>'; /* /cat-grid */

    /* Section page footer */
    h+='<div class="cat-page-foot">';
    h+='<div class="cat-foot-brand">';
    if(logo) h+='<img class="cat-foot-logo" src="'+E(logo)+'" alt="">';
    else h+='<span class="cat-foot-logo-ph" style="width:20px;height:20px;border-radius:4px;background:#e8eceb;display:inline-flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:#9ca3af;font-family:serif">HO</span>';
    h+='<div class="cat-foot-info"><strong>'+E(catN())+'</strong><br>'+E(catW())+' &nbsp;&middot;&nbsp; '+E(catPH())+'</div>';
    h+='</div>';
    h+='<div class="cat-foot-tag">'+E(CAT.tagline)+'</div>';
    h+='<div class="cat-foot-pg"><span>Page</span> '+pageNum+'</div>';
    h+='</div>';

    h+='</div>'; /* /cat-section */
    pageNum++;
  });

  h+='</div>'; /* /catalogue */

  var out=document.getElementById('cat-output');
  if(out) out.innerHTML=h;
}

/* ═══════════════════════════════════════════════════════════════
   WHATSAPP MOBILE VIEW
═══════════════════════════════════════════════════════════════ */
function catRenderWA(prods){
  var ws=CAT.type==='wholesale';
  var logo=catLG();
  CAT.waCart={};

  var h='<div class="cat-wa-phone">';
  h+='<div class="cat-wa-bar"><div class="cat-wa-notch"></div></div>';
  h+='<div class="cat-wa-scroll">';

  /* Header */
  h+='<div class="cat-wa-head">';
  h+='<div class="cat-wa-head-logo">'+(logo?'<img src="'+E(logo)+'">':'<span style="font-size:11px;font-weight:800;color:rgba(255,255,255,.7);font-family:serif">HO</span>')+'</div>';
  h+='<div><div class="cat-wa-head-name">'+E(catN())+'</div><div class="cat-wa-head-sub">'+E(CAT.title)+'</div></div>';
  h+='</div>';

  /* VAT note */
  h+='<div class="cat-wa-vat" style="color:'+(ws?'#92400e':'#4A6B50')+';background:'+(ws?'#fffbeb':'#f0fdf4')+'">'+(ws?'Wholesale prices exclude VAT (15% added on invoice)':'All prices include VAT at 15%')+'</div>';

  /* Action buttons */
  h+='<div class="cat-wa-btns"><button class="cat-wa-btn-share" onclick="catWAShare()">\uD83D\uDCF2 Share Catalogue</button><button class="cat-wa-btn-pdf" onclick="catDoPrint()">\u2193 PDF</button></div>';

  /* Order panel */
  h+='<div class="cat-wa-order" id="cat-wa-order"><div class="cat-wa-order-hd">\uD83D\uDED2 Order Request</div><div id="cat-wa-lines"></div><div class="cat-wa-order-total"><span>TOTAL</span><span id="cat-wa-ttl">'+C(0)+'</span></div></div>';

  /* Products by category */
  var cats=[];
  prods.forEach(function(p){if(p.category&&!cats.includes(p.category))cats.push(p.category);});
  cats.forEach(function(cat){
    var cp=prods.filter(function(p){return p.category===cat;});
    h+='<div class="cat-wa-cat">'+E(cat)+'</div>';
    h+='<div class="cat-wa-grid">';
    cp.forEach(function(p){
      var price=ws?wsP(p):p.price;
      var oos=stCls(p)==='out';
      h+='<div class="cat-wa-card"'+(oos?' style="opacity:.55"':'')+'>';
      h+='<div class="cat-wa-card-img">'+(p.image?'<img src="'+E(p.image)+'" alt="'+E(p.name)+'">':'<span style="font-size:10px;font-weight:700;color:#d1d5db;font-family:serif">IMG</span>')+'</div>';
      h+='<div class="cat-wa-card-body">';
      h+='<div class="cat-wa-card-name">'+E(p.name)+'</div>';
      h+='<div class="cat-wa-card-price'+(ws?' ws':'')+'">'+C(price)+'</div>';
      h+='<div class="cat-wa-card-vat">'+(ws?'excl. VAT':'incl. VAT')+'</div>';
      if(p.suggested_qty) h+='<div class="cat-wa-suggest">\u2197 Suggest: '+E(String(p.suggested_qty))+' units</div>';
      if(!oos){
        h+='<div class="cat-wa-qty-row"><button class="cat-wa-q-btn" onclick="catWAAdj('+p.id+',-1,'+price+')">\u2212</button>';
        h+='<span class="cat-wa-q-val" id="cwq'+p.id+'">0</span>';
        h+='<button class="cat-wa-q-btn" onclick="catWAAdj('+p.id+',1,'+price+')">+</button>';
        if(p.suggested_qty) h+='<button class="cat-wa-q-add'+(ws?' ws':'')+'" onclick="catWASet('+p.id+','+p.suggested_qty+','+price+')">+'+E(String(p.suggested_qty))+'</button>';
        else h+='<button class="cat-wa-q-add'+(ws?' ws':'')+'" onclick="catWAAdj('+p.id+',1,'+price+')">Add</button>';
        h+='</div>';
      } else h+='<div class="cat-wa-oos">Out of Stock</div>';
      h+='</div></div>';
    });
    h+='</div>';
  });

  h+='<button class="cat-wa-send" onclick="catWASend()">\uD83D\uDCF2 Send Order via WhatsApp</button>';
  h+='<div class="cat-wa-foot">'+E(catN())+' &middot; '+E(catW())+'<br>'+E(catPH())+' &middot; '+E(catCT())+'</div>';
  h+='</div></div>';

  var out=document.getElementById('cat-output');
  if(out) out.innerHTML=h;
}

/* ── WA CART ─────────────────────────────────────────────────── */
function catWAAdj(id,d,price){
  if(!CAT.waCart[id]) CAT.waCart[id]={qty:0,price:price};
  CAT.waCart[id].qty=Math.max(0,CAT.waCart[id].qty+d);
  var e=document.getElementById('cwq'+id); if(e) e.textContent=CAT.waCart[id].qty;
  catWARefresh();
}
function catWASet(id,qty,price){
  if(!CAT.waCart[id]) CAT.waCart[id]={qty:0,price:price};
  CAT.waCart[id].qty=qty;
  var e=document.getElementById('cwq'+id); if(e) e.textContent=qty;
  catWARefresh();
}
function catWARefresh(){
  var lines=[],total=0;
  Object.keys(CAT.waCart).forEach(function(id){
    var e=CAT.waCart[id]; if(!e.qty) return;
    var p=CAT.products.find(function(x){return x.id==id;}); if(!p) return;
    lines.push({name:p.name,qty:e.qty,price:e.price}); total+=e.qty*e.price;
  });
  var panel=document.getElementById('cat-wa-order'),lEl=document.getElementById('cat-wa-lines'),tEl=document.getElementById('cat-wa-ttl');
  if(!panel) return;
  if(!lines.length){panel.classList.remove('show');return;}
  panel.classList.add('show');
  if(lEl) lEl.innerHTML=lines.map(function(l){return '<div class="cat-wa-order-line"><span>'+E(l.name)+' \u00d7'+l.qty+'</span><span>'+C(l.qty*l.price)+'</span></div>';}).join('');
  if(tEl) tEl.textContent=C(total);
}
function catWASend(){
  var lines=[],total=0;
  Object.keys(CAT.waCart).forEach(function(id){
    var e=CAT.waCart[id]; if(!e.qty) return;
    var p=CAT.products.find(function(x){return x.id==id;}); if(!p) return;
    lines.push('\u2022 '+p.name+' \u00d7'+e.qty+' = '+C(e.qty*e.price)); total+=e.qty*e.price;
  });
  if(!lines.length){alert('Please add products to your order first.');return;}
  var msg='\uD83C\uDF3F *Order \u2014 '+catN()+'*\n\n'+lines.join('\n')+'\n\n*TOTAL: '+C(total)+'*\n\n'+catW();
  window.open('https://wa.me/264856628598?text='+encodeURIComponent(msg),'_blank');
}
function catWAShare(){
  var su=typeof window.hposSiteUrl==='function'?window.hposSiteUrl():(window.hposData&&window.hposData.siteUrl||window.location.origin);
  window.open('https://wa.me/?text='+encodeURIComponent('\uD83C\uDF3F '+catN()+' Product Catalogue\n'+su+'\n\n'+CAT.tagline+'\n'+catW()),'_blank');
}

/* ═══════════════════════════════════════════════════════════════
   PRINT — POPUP WINDOW (prints ALL pages reliably)
═══════════════════════════════════════════════════════════════ */
function catDoPrint(){
  /* Get the full catalogue HTML */
  var out=document.getElementById('cat-output');
  if(!out||!out.innerHTML.trim()){alert('Nothing to print. Please wait for the catalogue to load.');return;}
  var html=out.innerHTML;

  /* Get the catalogue CSS from the injected <style> tag */
  var cssEl=document.getElementById('hpos-cat-css');
  var css=cssEl?cssEl.textContent:'';

  /* Build self-contained print document.
     IMPORTANT: CSS is scoped to #cat-output so we must wrap html in that div. */
  var doc='<!DOCTYPE html><html><head><meta charset="utf-8">'
    +'<title>'+E(catN())+' \u2014 '+E(CAT.title)+'</title>'
    +'<style>'
    +'*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact;print-color-adjust:exact;}'
    +'body{background:#fff;font-family:system-ui,-apple-system,sans-serif;}'
    /* All catalogue styles — already scoped to #cat-output */
    +css
    /* Print overrides — use #cat-output scope to match */
    +'@media print{'
    +'@page{size:A4 portrait;margin:0;}'
    +'body{margin:0;padding:0;background:#fff;}'
    +'#cat-output .catalogue{width:210mm!important;box-shadow:none!important;margin:0!important;}'
    +'#cat-output .cat-cover{height:297mm!important;page-break-after:always!important;break-after:page!important;}'
    +'#cat-output .cat-section{page-break-inside:auto!important;break-inside:auto!important;}'
    +'#cat-output .cat-grid{page-break-inside:auto!important;break-inside:auto!important;}'
    +'#cat-output .cat-card{break-inside:avoid!important;page-break-inside:avoid!important;}'
    +'#cat-output .cat-page-foot{break-inside:avoid!important;page-break-inside:avoid!important;}'
    +'#cat-output .cat-sec-header{break-after:avoid!important;page-break-after:avoid!important;}'
    +'}'
    +'</style></head><body>'
    +'<div id="cat-output">'   /* wrap so #cat-output CSS selectors match */
    +html
    +'</div>'
    +'<script>window.onload=function(){setTimeout(function(){window.print();setTimeout(function(){window.close();},1500);},900);};<\/script>'
    +'</body></html>';

  var pw=window.open('','_blank','width=900,height=700,scrollbars=yes');
  if(!pw){alert('Please allow popups for this site to print the catalogue.');return;}
  pw.document.open();
  pw.document.write(doc);
  pw.document.close();
}
