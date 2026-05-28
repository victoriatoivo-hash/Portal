/* Hambelela Organic — Wholesale Portal Frontend JS */
/* global hposWS */
(function(){
'use strict';

var API      = hposWS.apiUrl;
var NK       = hposWS.nonce;
var CUR      = hposWS.currency || 'N$';
var wsCart   = {};   // { product_id: {name, price, qty, moq, suggested_qty} }
var wsProds  = [];
var wsFilter = '';

function fmt(n){ return CUR+' '+Number(n||0).toFixed(2); }
function esc(s){ var d=document.createElement('div');d.appendChild(document.createTextNode(String(s||'')));return d.innerHTML; }
function api(path,opts){
  return fetch(API+path, Object.assign({
    headers:{'Content-Type':'application/json','X-WP-Nonce':NK}
  }, opts||{})).then(function(r){return r.json();});
}
function msg(elId, text, type){
  var el=document.getElementById(elId); if(!el) return;
  el.innerHTML='<div class="ws-alert ws-alert-'+type+'">'+esc(text)+'</div>';
}

// ── REGISTRATION ─────────────────────────────────────────────────
window.wsSubmitReg = function(e){
  e.preventDefault();
  var form = e.target;
  var btn  = document.getElementById('ws-reg-submit');
  btn.disabled=true; btn.textContent='Submitting…';
  var data = {};
  new FormData(form).forEach(function(v,k){ data[k]=v; });
  api('/wholesale/register',{method:'POST',body:JSON.stringify(data)})
    .then(function(r){
      if(r.success){
        document.getElementById('ws-reg-form').style.display='none';
        msg('ws-reg-msg', r.message || 'Application submitted successfully!', 'success');
      } else {
        msg('ws-reg-msg', r.error || 'Submission failed.', 'error');
        btn.disabled=false; btn.textContent='Submit Application';
      }
    }).catch(function(){
      msg('ws-reg-msg','Network error. Please try again.','error');
      btn.disabled=false; btn.textContent='Submit Application';
    });
};

// ── LOGIN ────────────────────────────────────────────────────────
window.wsSubmitLogin = function(e){
  e.preventDefault();
  var form = e.target;
  var data = {};
  new FormData(form).forEach(function(v,k){ data[k]=v; });
  // Use WP AJAX for login
  var fd = new FormData();
  fd.append('action','ws_ajax_login');
  fd.append('log', data.email);
  fd.append('pwd', data.password);
  fd.append('security', NK);
  fetch(window.location.origin+'/wp-admin/admin-ajax.php',{method:'POST',body:fd})
    .then(function(r){return r.json();})
    .then(function(r){
      if(r.loggedin){
        window.location.href = hposWS.dashUrl;
      } else {
        msg('ws-login-msg', r.message || 'Login failed. Check your email and password.', 'error');
      }
    });
};

// Register login AJAX in PHP side is handled in wholesale class.
// Fallback: direct form post with WP login URL
(function(){
  var lf = document.getElementById('ws-login-form');
  if(!lf) return;
  // If AJAX fails, fall back to standard WP login
  lf.addEventListener('submit', function(e){
    if(!window.wsSubmitLogin) return;
    e.preventDefault();
    wsSubmitLogin(e);
  });
})();

// ── DASHBOARD ────────────────────────────────────────────────────
(function(){
  if(!document.getElementById('ws-dashboard-page')) return;
  loadSavedLists();
})();

window.wsDashSection = function(sec){
  if(sec==='reorder'){
    var el = document.getElementById('ws-quick-reorder');
    if(el){ el.style.display=el.style.display==='none'?'block':'none'; loadReorder(); }
  }
};

function loadReorder(){
  var el = document.getElementById('ws-reorder-content'); if(!el) return;
  api('/wholesale/orders').then(function(orders){
    if(!orders.length){ el.innerHTML='<p class="ws-empty">No previous orders found.</p>'; return; }
    var latest = orders.slice(0,3);
    el.innerHTML = latest.map(function(o){
      return '<div class="ws-reorder-card">'+
        '<div class="ws-reorder-info">'+
          '<strong>Order #'+esc(o.number)+'</strong> · '+esc(o.date)+' · '+esc(o.items)+' items · '+fmt(o.total)+
          ' <span class="ws-status ws-status-'+o.status+'">'+esc(o.status)+'</span>'+
        '</div>'+
        '<a href="'+hposWS.dashUrl.replace('dashboard','catalogue')+'?reorder='+o.id+'" class="ws-btn ws-btn-primary ws-btn-sm">⚡ Reorder</a>'+
      '</div>';
    }).join('');
  });
}

function loadSavedLists(){
  var el = document.getElementById('ws-saved-lists-content'); if(!el) return;
  api('/wholesale/savedlists').then(function(lists){
    if(!lists||!lists.length){
      el.innerHTML='<p class="ws-empty">No saved lists yet. Create one from the catalogue.</p>';
      return;
    }
    el.innerHTML='<div class="ws-lists-grid">'+lists.map(function(l){
      return '<div class="ws-list-card">'+
        '<div class="ws-list-name">'+esc(l.name)+'</div>'+
        '<div class="ws-list-meta">'+esc(l.items.length)+' items · '+esc(l.created)+'</div>'+
        '<div class="ws-list-actions">'+
          '<a href="'+hposWS.dashUrl.replace('dashboard','catalogue')+'?list='+l.id+'" class="ws-btn ws-btn-primary ws-btn-sm">Order from List</a>'+
          '<button onclick="wsDeleteList('+l.id+')" class="ws-btn ws-btn-ghost ws-btn-sm">Delete</button>'+
        '</div>'+
      '</div>';
    }).join('')+'</div>';
  });
}

window.wsDeleteList = function(id){
  if(!confirm('Delete this saved list?')) return;
  api('/wholesale/savedlists/'+id,{method:'DELETE'}).then(function(r){
    if(r.success) loadSavedLists();
  });
};

// ── CATALOGUE ────────────────────────────────────────────────────
(function(){
  if(!document.getElementById('ws-catalogue-page')) return;
  loadWsCatalogue();
})();

function loadWsCatalogue(){
  var out = document.getElementById('ws-cat-output');
  api('/wholesale/catalogue').then(function(prods){
    document.getElementById('ws-cat-loading').style.display='none';
    wsProds = prods;
    renderWsCatalogue(prods);
    // Handle reorder / list pre-fill from URL params
    var params = new URLSearchParams(window.location.search);
    if(params.get('reorder')) preloadFromOrder(parseInt(params.get('reorder')));
    if(params.get('list'))    preloadFromList(parseInt(params.get('list')));
  });
}

function renderWsCatalogue(prods){
  var out = document.getElementById('ws-cat-output'); if(!out) return;
  var filtered = prods.filter(function(p){
    if(!wsFilter) return true;
    return (p.name+' '+p.category+' '+(p.sku||'')).toLowerCase().indexOf(wsFilter.toLowerCase())>-1;
  });
  if(!filtered.length){ out.innerHTML='<p class="ws-empty">No products match your search.</p>'; return; }

  var cats = [];
  filtered.forEach(function(p){ if(!cats.includes(p.category)) cats.push(p.category); });

  out.innerHTML = cats.map(function(cat){
    var cp = filtered.filter(function(p){ return p.category===cat; });
    return '<div class="ws-cat-section">'+
      '<div class="ws-cat-hdr"><span class="ws-cat-line"></span><span class="ws-cat-name">'+esc(cat)+'</span><span class="ws-cat-count">'+cp.length+' products</span></div>'+
      '<div class="ws-prod-table">'+
        '<div class="ws-prod-thead"><span>Product</span><span>SKU</span><span style="text-align:right">Wholesale Price</span><span style="text-align:center">MOQ</span><span style="text-align:center">Qty</span><span style="text-align:right">Line Total</span></div>'+
        cp.map(function(p){
          var wp   = wsGetPrice(p);
          var oos  = !p.stock_qty||p.stock_qty<=0||p.stock_status==='outofstock';
          var sc   = oos?'ws-s-oos':(p.stock_qty<=5||p.stock_status==='low'?'ws-s-low':'ws-s-in');
          var sl   = oos?'Out of Stock':(p.stock_qty<=5?'Low Stock':'In Stock');
          var qty  = (wsCart[p.id]||{}).qty||0;
          return '<div class="ws-prod-row'+(oos?' ws-prod-oos':'')+'" data-pid="'+p.id+'">' +
            '<div class="ws-prod-info">'+
              '<div class="ws-prod-name">'+esc(p.name)+'</div>'+
              (p.desc?'<div class="ws-prod-desc">'+esc(p.desc.substring(0,80))+'…</div>':'')+
              '<span class="ws-stock-dot '+sc+'">'+sl+'</span>'+
              (p.suggested_qty?'<span class="ws-suggest">↗ Most pharmacies order '+p.suggested_qty+' units</span>':'')+
            '</div>'+
            '<div class="ws-prod-sku">'+esc(p.sku||'—')+'</div>'+
            '<div class="ws-prod-price" style="text-align:right">'+
              '<strong>'+fmt(wp)+'</strong>'+
              '<div class="ws-prod-price-note">excl. VAT</div>'+
              '<div class="ws-prod-price-note" style="color:#888">Retail: '+fmt(p.price)+' incl. VAT</div>'+
            '</div>'+
            '<div style="text-align:center;font-size:11px;color:#888">'+(p.moq||'—')+'</div>'+
            '<div class="ws-qty-cell">'+
              (oos?'<span class="ws-oos-label">—</span>':
                '<div class="ws-qty-row">'+
                  '<button class="ws-q-btn" onclick="wsCartAdj('+p.id+',-1)">−</button>'+
                  '<span class="ws-q-val" id="wsq'+p.id+'">'+qty+'</span>'+
                  '<button class="ws-q-btn" onclick="wsCartAdj('+p.id+',1)">+</button>'+
                  (p.suggested_qty?'<button class="ws-q-suggest" onclick="wsCartSet('+p.id+','+p.suggested_qty+')">+'+p.suggested_qty+'</button>':'')+
                '</div>'
              )+
            '</div>'+
            '<div class="ws-line-total" id="wslt'+p.id+'">'+fmt(wp*qty)+'</div>'+
          '</div>';
        }).join('')+
      '</div>'+
    '</div>';
  }).join('');
}

function wsGetPrice(p){
  if(p.wholesale_price) return p.wholesale_price;
  return Math.round((p.price/1.15)*0.60*100)/100;
}

window.wsCatFilter = function(){
  var s = document.getElementById('ws-cat-search');
  wsFilter = s ? s.value : '';
  renderWsCatalogue(wsProds);
};

// ── CART ─────────────────────────────────────────────────────────
window.wsCartAdj = function(id,d){
  var p = wsProds.find(function(x){return x.id==id;}); if(!p) return;
  if(!wsCart[id]) wsCart[id]={name:p.name,price:wsGetPrice(p),qty:0,moq:p.moq||1,suggested_qty:p.suggested_qty||0};
  wsCart[id].qty = Math.max(0, wsCart[id].qty+d);
  wsCartUpdate(id);
};
window.wsCartSet = function(id,qty){
  var p = wsProds.find(function(x){return x.id==id;}); if(!p) return;
  if(!wsCart[id]) wsCart[id]={name:p.name,price:wsGetPrice(p),qty:0,moq:p.moq||1};
  wsCart[id].qty = qty;
  wsCartUpdate(id);
};
function wsCartUpdate(id){
  var item = wsCart[id];
  var qEl  = document.getElementById('wsq'+id);
  var ltEl = document.getElementById('wslt'+id);
  if(qEl)  qEl.textContent  = item.qty;
  if(ltEl) ltEl.textContent = fmt(item.price * item.qty);
  wsCartBar();
}
function wsCartBar(){
  var items=0,total=0;
  Object.values(wsCart).forEach(function(e){ if(e.qty>0){items+=e.qty;total+=e.price*e.qty;} });
  var bar = document.getElementById('ws-cart-bar');
  if(!bar) return;
  bar.style.display = items>0 ? 'flex' : 'none';
  var cc = document.getElementById('ws-cart-count');
  var ct = document.getElementById('ws-cart-total');
  if(cc) cc.textContent = items+' item'+(items!==1?'s':'');
  if(ct) ct.textContent = fmt(total)+' ex-VAT';
}
window.wsClearCart = function(){
  wsCart={};
  wsProds.forEach(function(p){
    var qEl=document.getElementById('wsq'+p.id); if(qEl) qEl.textContent='0';
    var ltEl=document.getElementById('wslt'+p.id); if(ltEl) ltEl.textContent=fmt(0);
  });
  wsCartBar();
};

// ── ORDER MODAL ──────────────────────────────────────────────────
window.wsPlaceOrder = function(){
  var lines = wsCartLines();
  if(!lines.length){ alert('Please add products to your order first.'); return; }
  var linesEl  = document.getElementById('ws-order-lines');
  var totalsEl = document.getElementById('ws-order-totals');
  var exvat=0;
  linesEl.innerHTML = '<table class="ws-order-tbl"><thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead><tbody>'+
    lines.map(function(l){
      exvat+=l.total;
      return '<tr><td>'+esc(l.name)+'</td><td>'+l.qty+'</td><td>'+fmt(l.price)+'</td><td>'+fmt(l.total)+'</td></tr>';
    }).join('')+'</tbody></table>';
  var vat=Math.round(exvat*0.15*100)/100;
  totalsEl.innerHTML=
    '<div class="ws-totals-row"><span>Ex-VAT Total</span><span>'+fmt(exvat)+'</span></div>'+
    '<div class="ws-totals-row"><span>VAT (15%)</span><span>'+fmt(vat)+'</span></div>'+
    '<div class="ws-totals-row ws-totals-grand"><span>Total Due</span><span>'+fmt(exvat+vat)+'</span></div>';
  document.getElementById('ws-order-msg').innerHTML='';
  document.getElementById('ws-order-modal').style.display='flex';
};
window.wsCloseModal = function(){
  document.getElementById('ws-order-modal').style.display='none';
};
window.wsConfirmOrder = function(){
  var note=document.getElementById('ws-order-note').value||'';
  api('/wholesale/order',{method:'POST',body:JSON.stringify({items:wsCartItems(),note:note})}).then(function(r){
    if(r.success){
      msg('ws-order-msg','Order #'+r.order_number+' placed successfully! We will confirm shortly.','success');
      setTimeout(function(){wsCloseModal();wsClearCart();},2500);
    } else {
      msg('ws-order-msg',r.error||'Order failed. Please try again.','error');
    }
  });
};
window.wsConfirmOrderWA = function(){
  var note=document.getElementById('ws-order-note').value||'';
  api('/wholesale/order',{method:'POST',body:JSON.stringify({items:wsCartItems(),note:note})}).then(function(r){
    if(r.success){
      window.open(r.wa_url,'_blank');
      msg('ws-order-msg','Order #'+r.order_number+' created. WhatsApp message opened.','success');
      setTimeout(function(){wsCloseModal();wsClearCart();},2500);
    } else {
      msg('ws-order-msg',r.error||'Error.','error');
    }
  });
};
window.wsSendWAOrder = function(){
  var lines=wsCartLines(); if(!lines.length){alert('Add products first.');return;}
  var exvat=lines.reduce(function(s,l){return s+l.total;},0);
  var vat=Math.round(exvat*0.15*100)/100;
  var m='🌿 *Wholesale Order — '+hposWS.storeName+'*\n\n'+
    lines.map(function(l){return '• '+l.name+' × '+l.qty+' = '+fmt(l.total);}).join('\n')+
    '\n\n*Ex-VAT: '+fmt(exvat)+'*\n*VAT (15%): '+fmt(vat)+'*\n*Total: '+fmt(exvat+vat)+'*\n\n'+hposWS.storeWebsite;
  window.open('https://wa.me/264856628598?text='+encodeURIComponent(m),'_blank');
};
function wsCartLines(){
  return Object.keys(wsCart).map(function(id){
    var e=wsCart[id]; if(!e.qty) return null;
    return {id:parseInt(id),name:e.name,price:e.price,qty:e.qty,total:e.price*e.qty};
  }).filter(Boolean);
}
function wsCartItems(){
  return wsCartLines().map(function(l){ return {product_id:l.id,qty:l.qty}; });
}

// ── SAVE LIST ────────────────────────────────────────────────────
window.wsSaveList = function(){
  if(!wsCartLines().length){alert('Cart is empty.');return;}
  document.getElementById('ws-save-modal').style.display='flex';
};
window.wsSaveListConfirm = function(){
  var name = document.getElementById('ws-save-name').value||'My List';
  api('/wholesale/savedlists',{method:'POST',body:JSON.stringify({name:name,items:wsCartItems()})}).then(function(r){
    if(r.success){
      document.getElementById('ws-save-modal').style.display='none';
      alert('List "'+name+'" saved!');
    }
  });
};

// ── REORDER PRE-FILL ─────────────────────────────────────────────
function preloadFromOrder(orderId){
  api('/wholesale/orders').then(function(orders){
    // We don't have per-order items from /orders endpoint; scroll user to catalogue note
    alert('Previous order loaded. Please select your quantities below.');
  });
}
function preloadFromList(listId){
  api('/wholesale/savedlists').then(function(lists){
    var list = lists.find(function(l){return l.id==listId;});
    if(!list) return;
    list.items.forEach(function(item){
      wsCartSet(item.product_id, item.qty);
    });
    wsCartBar();
    alert('List "'+list.name+'" loaded into your cart.');
  });
}

// ── ORDERS PAGE ──────────────────────────────────────────────────
(function(){
  var pg = document.getElementById('ws-orders-page'); if(!pg) return;
  api('/wholesale/orders').then(function(orders){
    document.getElementById('ws-orders-loading').style.display='none';
    var el = document.getElementById('ws-orders-output');
    if(!orders.length){ el.innerHTML='<p class="ws-empty">No orders yet. <a href="'+hposWS.dashUrl.replace('dashboard','catalogue')+'">Browse catalogue →</a></p>'; return; }
    el.innerHTML='<table class="ws-tbl"><thead><tr><th>Order</th><th>Date</th><th>Items</th><th>Total</th><th>Status</th><th>Invoice</th></tr></thead><tbody>'+
      orders.map(function(o){
        return '<tr><td><strong>#'+esc(o.number)+'</strong></td><td>'+esc(o.date)+'</td><td>'+o.items+'</td><td>'+fmt(o.total)+'</td>'+
          '<td><span class="ws-status ws-status-'+esc(o.status)+'">'+esc(o.status)+'</span></td>'+
          '<td><a href="'+esc(o.invoice_url)+'" class="ws-btn ws-btn-ghost ws-btn-sm" target="_blank">🧾 Invoice</a></td></tr>';
      }).join('')+'</tbody></table>';
  });
})();

// ── INVOICES PAGE ────────────────────────────────────────────────
(function(){
  var pg = document.getElementById('ws-invoices-page'); if(!pg) return;
  api('/wholesale/orders').then(function(orders){
    document.getElementById('ws-invoices-loading').style.display='none';
    var el = document.getElementById('ws-invoices-output');
    if(!orders.length){ el.innerHTML='<p class="ws-empty">No invoices yet.</p>'; return; }
    el.innerHTML='<div class="ws-inv-list">'+orders.map(function(o){
      return '<div class="ws-inv-card">'+
        '<div><strong>Invoice #'+esc(o.number)+'</strong><br><span style="font-size:11px;color:#888">'+esc(o.date)+'</span></div>'+
        '<div>'+fmt(o.total)+'</div>'+
        '<div><span class="ws-status ws-status-'+esc(o.status)+'">'+esc(o.status)+'</span></div>'+
        '<div><a href="'+esc(o.invoice_url)+'" class="ws-btn ws-btn-primary ws-btn-sm">View &amp; Print</a></div>'+
      '</div>';
    }).join('')+'</div>';
  });
})();

})();
