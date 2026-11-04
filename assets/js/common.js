/* 마음여행 길잡이 공통 기능
   - 학생이 쓴 내용은 이 기기의 브라우저(localStorage)에만 저장하고 어디로도 보내지 않는다.
   - 저장 키: mc:v1:<활동 이름>
*/
(function(){
  'use strict';
  var PREFIX = 'mc:v1:';
  /* 빈 학습지(손글씨용) 화면: 주소에 ?blank=1 이 있으면 저장된 기록을 불러오지도, 저장하지도 않는다 */
  var BLANK = /[?&]blank=1/.test(location.search) || window.MC_BLANK === true;
  if(BLANK) document.documentElement.classList.add('blank');

  function load(key){
    if(BLANK) return {};
    try{ return JSON.parse(localStorage.getItem(PREFIX+key)) || {}; }catch(e){ return {}; }
  }
  function save(key, data){
    if(BLANK) return false;
    try{ localStorage.setItem(PREFIX+key, JSON.stringify(data)); return true; }catch(e){ return false; }
  }
  function remove(key){
    try{ localStorage.removeItem(PREFIX+key); }catch(e){}
  }

  var toastEl, toastTimer;
  function toast(msg){
    if(!toastEl){
      toastEl = document.createElement('div');
      toastEl.className = 'toast';
      toastEl.setAttribute('role','status');
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function(){ toastEl.classList.remove('show'); }, msg.length > 30 ? 4500 : 1800);
  }

  function markSaved(){
    var el = document.getElementById('saved');
    if(!el) return;
    var d = new Date();
    el.textContent = '이 기기에 저장됨 · ' + String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0');
  }

  /* 이미지 저장: html2canvas 로컬 사본 사용 */
  function saveImage(el, filename, extraClass, doneMsg){
    if(typeof window.html2canvas !== 'function'){ toast('그림 저장을 준비하지 못했어요. 인쇄·PDF를 써 주세요.'); return; }
    var undo = swapInputs(el);
    /* 맨 아래 한 줄: 무슨 활동인지(주소·QR·제작자 없이) */
    var lab = null, n = parseInt(document.documentElement.getAttribute('data-path') || '', 10), h1 = document.querySelector('.top h1');
    if(n && h1 && !extraClass){ lab = document.createElement('p'); lab.className = 'cap-label'; lab.textContent = '『마음여행』 ' + n + '차시 · ' + h1.textContent.trim(); el.appendChild(lab); }
    function restore(){ undo(); if(lab) lab.remove(); document.body.classList.remove('capturing', 'cap-noname'); if(extraClass) document.body.classList.remove(extraClass); }
    /* 학생이 이름 칸에 쓴 이름은 그림에 넣고(패들렛에서 누가 썼는지 알게), 비어 있으면 이름 줄을 뺀다 */
    var nmEl = document.getElementById('name'); if(!nmEl || !nmEl.value.trim()) document.body.classList.add('cap-noname');
    document.body.classList.add('capturing');
    if(extraClass) document.body.classList.add(extraClass);
    /* 가로 약 1080px(패들렛·휴대폰에서 보기 좋은 크기), iPad 캔버스 한도 안으로 */
    var w = el.getBoundingClientRect().width || 800, hh = el.scrollHeight || 1000;
    var sc = Math.min(2, 1080 / w); if(w * hh * sc * sc > 16e6) sc = Math.sqrt(16e6 / (w * hh));
    window.html2canvas(el, {backgroundColor:'#ffffff', scale:sc, useCORS:false, scrollX:0, scrollY:-window.scrollY}).then(function(canvas){
      restore();
      function done(href, revoke){
        var a = document.createElement('a');
        a.download = filename + '.png';
        a.href = href;
        document.body.appendChild(a); a.click(); a.remove();
        if(revoke) setTimeout(function(){ URL.revokeObjectURL(href); }, 60000);
        toast(doneMsg || '그림으로 저장했어요. 패들렛에 올리기 전에 친구 이름이나 비밀이 없는지 한 번 더 봐요.');
      }
      if(canvas.toBlob && window.URL && URL.createObjectURL){
        canvas.toBlob(function(b){ if(b) done(URL.createObjectURL(b), true); else done(canvas.toDataURL('image/png'), false); }, 'image/png');
      } else done(canvas.toDataURL('image/png'), false);
    }).catch(function(){
      restore();
      toast('그림 저장이 되지 않았어요. 인쇄·PDF를 써 주세요.');
    });
  }

  /* 입력칸은 그림·인쇄에서 잘리거나 어긋나기 쉬우므로 잠시 글자(span)로 바꾼다. 되돌리는 함수를 돌려준다. */
  function swapInputs(root){
    var swaps = [];
    Array.prototype.forEach.call(root.querySelectorAll('input[type="text"], textarea'), function(inp){
      var sp = document.createElement('span');
      // 입력칸의 다른 class(예: grow, why)는 그대로 넘겨 자리 크기를 유지한다
      var extra = (inp.className || '').split(/\s+/).filter(function(c){ return c && c !== 'field'; }).join(' ');
      sp.className = 'cap-text' + (inp.classList.contains('field') ? ' cap-field' : '') + (extra ? ' ' + extra : '');
      sp.textContent = inp.value || '\u00a0';
      inp.style.display = 'none';
      inp.parentNode.insertBefore(sp, inp);
      swaps.push([inp, sp]);
    });
    return function(){ swaps.forEach(function(p){ p[1].remove(); p[0].style.display = ''; }); };
  }
  var printUndo = null;
  window.addEventListener('beforeprint', function(){ if(!printUndo && !BLANK) printUndo = swapInputs(document.body); });
  window.addEventListener('afterprint', function(){
    if(printUndo){ printUndo(); printUndo = null; }
    document.body.classList.remove('print-solo');
    var solo = document.getElementById('solo-print'); if(solo) solo.remove();
  });

  /* 용지: A4 세로(기본) / A3 세로(1.41배 크게) / A3 가로·A4 가로(모둠판). 인쇄 직전에 @page를 넣고 인쇄 뒤 지운다 */
  var PAPERS = {
    A4P:{t:'A4 세로', css:'@page{size:A4 portrait;margin:12mm}'},
    A3P:{t:'A3 세로 (크게)', css:'@page{size:A3 portrait;margin:14mm} @media print{body{zoom:1.414}}'},
    A3L:{t:'A3 가로 (모둠판)', css:'@page{size:A3 landscape;margin:8mm}'},
    A4L:{t:'A4 가로 (모둠판을 A4에)', css:'@page{size:A4 landscape;margin:6mm}'}
  };
  function setPaper(doc, key){
    var old = doc.getElementById('mc-paper'); if(old) old.remove();
    if(!key || key === 'A4P') return;
    var s = doc.createElement('style'); s.id = 'mc-paper'; s.textContent = PAPERS[key].css; doc.head.appendChild(s);
    doc.documentElement.setAttribute('data-paper', key);
  }
  function clearPaper(doc){ var old = doc.getElementById('mc-paper'); if(old) old.remove(); doc.documentElement.removeAttribute('data-paper'); }
  window.addEventListener('afterprint', function(){ if(!BLANK) clearPaper(document); });

  /* 인쇄 고르기 창: 무엇을(빈 학습지 / 쓴 내용) · 용지 · 미리 만든 PDF */
  var pmBox;
  function printMenu(){
    var part = currentPart();
    var isBoard = !!(part && part.getAttribute('data-paper') === 'A3L');
    var pdf = document.documentElement.getAttribute('data-pdf');
    if(!pmBox){
      pmBox = document.createElement('div'); pmBox.className = 'qr-modal pm'; pmBox.setAttribute('role', 'dialog'); pmBox.setAttribute('aria-modal', 'true'); pmBox.setAttribute('aria-label', '인쇄·PDF');
      pmBox.innerHTML = '<div class="qr-box pm-box"><b class="qr-t">🖨️ 인쇄·PDF</b>' +
        '<fieldset><legend>무엇을 뽑을까요?</legend><label><input type="radio" name="pm-what" value="blank"> 빈 학습지 <small>손글씨용 · 수업 전 복사</small></label><label><input type="radio" name="pm-what" value="filled"> 쓴 내용 그대로 <small>보관·제출용</small></label></fieldset>' +
        '<fieldset><legend>용지</legend><div class="pm-papers"></div></fieldset>' +
        '<p class="pm-note">인쇄 창의 「대상」에서 「PDF로 저장」을 고르면 PDF 파일이 돼요. A3 프린터가 없으면 인쇄 창에서 용지를 A4로, 배율을 「용지에 맞춤」으로 바꾸세요(글자가 작아져요).</p>' +
        '<p class="pm-pdf"></p>' +
        '<div class="qr-acts"><button type="button" class="btn primary" data-a="go">인쇄하기</button><button type="button" class="btn" data-a="close">닫기</button></div></div>';
      document.body.appendChild(pmBox);
      pmBox.addEventListener('click', function(e){
        var a = e.target.getAttribute && e.target.getAttribute('data-a');
        if(e.target === pmBox || a === 'close') pmBox.classList.remove('open');
        else if(a === 'go'){
          var what = (pmBox.querySelector('input[name="pm-what"]:checked') || {}).value || 'filled';
          var paper = (pmBox.querySelector('input[name="pm-paper"]:checked') || {}).value || 'A4P';
          pmBox.classList.remove('open');
          doPrint(what, paper);
        }
      });
      document.addEventListener('keydown', function(e){ if(e.key === 'Escape' && pmBox.classList.contains('open')) pmBox.classList.remove('open'); });
    }
    var papers = isBoard ? ['A3L','A4L'] : ['A4P','A3P'];
    pmBox.querySelector('.pm-papers').innerHTML = papers.map(function(k, i){ return '<label><input type="radio" name="pm-paper" value="' + k + '"' + (i === 0 ? ' checked' : '') + '> ' + PAPERS[k].t + '</label>'; }).join('');
    var onlyBlank = document.documentElement.hasAttribute('data-blank-only') || isBoard;
    var radios = pmBox.querySelectorAll('input[name="pm-what"]');
    radios[0].checked = onlyBlank || BLANK; radios[1].checked = !(onlyBlank || BLANK); radios[1].disabled = onlyBlank;
    radios[1].parentNode.style.display = onlyBlank ? 'none' : '';
    var pp = pmBox.querySelector('.pm-pdf');
    pp.innerHTML = pdf ? '📄 미리 만든 빈 학습지 PDF: <a href="' + pdf + '" target="_blank" rel="noopener">내려받기</a> <small>(아이패드·크롬북처럼 용지 설정이 안 맞을 때)</small>' : '';
    pmBox.classList.add('open');
    pmBox.querySelector('[data-a="go"]').focus();
  }
  function doPrint(what, paper){
    if(what === 'blank' && !BLANK){
      // 같은 화면을 빈 학습지로 숨긴 틀에 열어 그 틀만 인쇄한다(쓴 내용은 그대로 남음)
      var old = document.getElementById('mc-blank-frame'); if(old) old.remove();
      var f = document.createElement('iframe'); f.id = 'mc-blank-frame'; f.setAttribute('aria-hidden', 'true');
      f.style.cssText = 'position:fixed;right:0;bottom:0;width:900px;height:1200px;border:0;opacity:0;pointer-events:none;z-index:-1';
      f.src = location.pathname + '?blank=1' + location.hash;
      f.addEventListener('load', function(){
        try{
          var w = f.contentWindow, d = f.contentDocument;
          setTimeout(function(){ setPaper(d, paper); w.focus(); w.print(); }, 300);
        }catch(e){ toast('빈 학습지를 열지 못했어요. 미리 만든 PDF를 써 주세요.'); }
      });
      document.body.appendChild(f);
      return;
    }
    setPaper(document, paper);
    window.print();
  }

  /* QR: 공개 주소를 학생 기기로 열게 한다. 외부 서비스 없이 qrcode.js(로컬)로 그린다 */
  var BASE = 'https://maeum-edu.vercel.app/';
  function pageUrl(){
    // 어느 주소(plusiam.github.io 등)에서 열어도 QR·인쇄 주소는 maeum-edu.vercel.app 하나로 맞춘다
    return BASE + (document.documentElement.getAttribute('data-path') || '') + (location.hash || '');
  }
  function qrSvg(text){
    if(typeof window.qrcode !== 'function') return '';
    var q = window.qrcode(0, 'M'); q.addData(text); q.make();
    return q.createSvgTag({cellSize:8, margin:2, scalable:true, alt:'QR 코드: ' + text});
  }
  /* 인쇄 꼬리말: 모든 활동지 인쇄물(빈 학습지·쓴 내용)에 같은 문구와 그 차시 웹학습지로 가는 QR을 넣는다.
     비공개·종이 전용 활동지(1차시 출발 카드, 3차시 익명, 12차시 모둠판, 14차시 쪽지가 있는 출구 카드, 16차시 도움망)는 QR 없이 글자만 */
  var NO_QR = {'1':['part-2'], '3':'*', '12':'*', '14':['part-2'], '16':['part-1']};
  function printFooters(){
    var path = document.documentElement.getAttribute('data-path') || '';
    var n = parseInt(path, 10); if(!n) return;
    var parts = document.querySelectorAll('.part');
    var firstId = parts.length ? parts[0].id : '';
    var rule = NO_QR[String(n)];
    Array.prototype.forEach.call(document.querySelectorAll('p.credit.print-only'), function(c){
      var part = c.closest('.part');
      var pid = part ? part.id : '';
      var url = BASE + path + (pid && pid !== firstId ? '#' + pid : '');
      var text = '『마음여행』 ' + n + '차시 연계 웹 학습지 · ' + url.replace(/^https:\/\//, '');
      var noQr = rule === '*' || (rule && rule.indexOf(pid) >= 0) || typeof window.qrcode !== 'function';
      c.classList.add('pf');
      c.innerHTML = '';
      var t = document.createElement('span'); t.className = 'pf-t'; t.textContent = text; c.appendChild(t);
      if(!noQr){ var q = document.createElement('span'); q.className = 'pf-qr'; q.setAttribute('aria-hidden', 'true'); q.innerHTML = qrSvg(url); c.appendChild(q); }
    });
  }

  var qrBox;
  function showQr(url, title){
    if(typeof window.qrcode !== 'function'){ toast('QR을 준비하지 못했어요.'); return; }
    url = url || pageUrl(); title = title || document.title.split(' | ')[0];
    if(!qrBox){
      qrBox = document.createElement('div'); qrBox.className = 'qr-modal'; qrBox.setAttribute('role', 'dialog'); qrBox.setAttribute('aria-modal', 'true'); qrBox.setAttribute('aria-label', 'QR 코드');
      qrBox.innerHTML = '<div class="qr-box"><b class="qr-t"></b><div class="qr-svg"></div><p class="qr-u"></p><p class="qr-h">태블릿·크롬북 카메라로 찍으면 이 화면이 열려요.</p><div class="qr-acts"><button type="button" class="btn" data-a="big">크게 보기</button><button type="button" class="btn" data-a="copy">주소 복사</button><button type="button" class="btn primary" data-a="close">닫기</button></div></div>';
      document.body.appendChild(qrBox);
      qrBox.addEventListener('click', function(e){
        var a = e.target.getAttribute && e.target.getAttribute('data-a');
        if(e.target === qrBox || a === 'close') hideQr();
        else if(a === 'big') qrBox.classList.toggle('big');
        else if(a === 'copy'){ var u = qrBox.getAttribute('data-url'); if(navigator.clipboard) navigator.clipboard.writeText(u).then(function(){ toast('주소를 복사했어요'); }, function(){ toast(u); }); else toast(u); }
      });
      document.addEventListener('keydown', function(e){ if(e.key === 'Escape' && qrBox.classList.contains('open')) hideQr(); });
    }
    qrBox.setAttribute('data-url', url);
    qrBox.querySelector('.qr-t').textContent = title;
    qrBox.querySelector('.qr-svg').innerHTML = qrSvg(url);
    qrBox.querySelector('.qr-u').textContent = url.replace(/^https:\/\//, '');
    qrBox.classList.remove('big'); qrBox.classList.add('open'); document.documentElement.classList.add('modal-open');
    qrBox.querySelector('[data-a="close"]').focus();
  }
  function hideQr(){ if(qrBox) qrBox.classList.remove('open'); document.documentElement.classList.remove('modal-open'); }

  /* 한 부분만 인쇄·PDF(예: 선생님께 드리는 쪽지): 글자로 바꾼 복사본만 따로 두고 나머지는 숨긴다 */
  function printOnly(el, wide){
    var old = document.getElementById('solo-print'); if(old) old.remove();
    var undo = swapInputs(el);
    var copy = el.cloneNode(true);
    undo();
    copy.removeAttribute('id');
    Array.prototype.forEach.call(copy.querySelectorAll('input, textarea, select'), function(x){ x.remove(); });
    var box = document.createElement('div'); box.id = 'solo-print'; if(wide) box.className = 'wide'; box.appendChild(copy);
    document.body.appendChild(box);
    document.body.classList.add('print-solo');
    window.print();
  }

  function confirmClear(key, after){
    if(window.confirm('이 기기에 남은 내 기록을 모두 지울까요?\n지운 뒤에는 되돌릴 수 없어요.')){
      remove(key);
      if(after) after();
      toast('내 기록을 지웠어요');
    }
  }

  /* 글자 크기: 보통 → 크게(125%) → 더 크게(150%). 전자칠판에서 쓴다. 기기마다 기억(학생 기록 아님) */
  var SIZES = ['', 'fs-125', 'fs-150'], SIZE_LABEL = ['가 보통', '가 크게', '가 더 크게'];
  function getSize(){ try{ return Math.max(0, SIZES.indexOf(localStorage.getItem('mc:ui:size') || '')); }catch(e){ return 0; } }
  function applySize(i){
    SIZES.forEach(function(c){ if(c) document.documentElement.classList.remove(c); });
    if(SIZES[i]) document.documentElement.classList.add(SIZES[i]);
    var b = document.getElementById('btn-size'); if(b){ b.textContent = '🔍 ' + SIZE_LABEL[i]; b.setAttribute('aria-label', '글자 크기 바꾸기, 지금 ' + SIZE_LABEL[i]); }
  }
  applySize(getSize());

  /* 화면 키보드가 올라오는 터치 기기에서 입력 중에는 아래 단추 줄을 숨긴다 */
  var coarse = window.matchMedia && window.matchMedia('(pointer:coarse)').matches;
  document.addEventListener('focusin', function(e){ if(coarse && e.target.matches('input[type="text"],textarea')) document.body.classList.add('typing'); });
  document.addEventListener('focusout', function(){ setTimeout(function(){ var a = document.activeElement; if(!a || !a.matches('input[type="text"],textarea')) document.body.classList.remove('typing'); }, 50); });

  document.addEventListener('DOMContentLoaded', function(){
    if(BLANK){ var sv = document.getElementById('saved'); if(sv) sv.textContent = '빈 학습지 화면 · 쓴 내용은 저장되지 않아요'; }
    var acts = document.querySelector('.bar .acts');
    if(acts && !document.getElementById('btn-size')){
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'btn'; b.id = 'btn-size';
      b.addEventListener('click', function(){
        var i = (getSize() + 1) % SIZES.length;
        try{ localStorage.setItem('mc:ui:size', SIZES[i]); }catch(e){}
        applySize(i);
      });
      acts.insertBefore(b, acts.firstChild);
      applySize(getSize());
    }
    if(acts && !document.getElementById('btn-qr') && typeof window.qrcode === 'function'){
      var q = document.createElement('button');
      q.type = 'button'; q.className = 'btn'; q.id = 'btn-qr'; q.textContent = '📱 QR';
      q.setAttribute('aria-label', '이 화면 QR 코드 보기');
      q.addEventListener('click', function(){ showQr(); });
      acts.insertBefore(q, acts.firstChild);
    }
    initParts();
    printFooters();
    a11y();
    shortLabels();
  });

  /* 화면낭독기: 문항 번호(원)와 본문이 붙어 읽히지 않게, 활동지 단추는 이름과 설명을 나눠 읽게 */
  function a11y(){
    Array.prototype.forEach.call(document.querySelectorAll('h2 > .num, h3 > .num'), function(s){
      var h = s.parentNode; s.setAttribute('aria-hidden', 'true');
      if(h.hasAttribute('aria-label') || h.querySelector('input,textarea,button,select')) return;
      var c = h.cloneNode(true); var x = c.querySelector('.num'); if(x) x.remove();
      h.setAttribute('aria-label', '문항 ' + s.textContent.trim() + '. ' + c.textContent.trim());
    });
    Array.prototype.forEach.call(document.querySelectorAll('.parts button'), function(b){
      var pn = b.querySelector('.pn'); if(pn) pn.setAttribute('aria-hidden', 'true');
      var c = b.cloneNode(true); var y = c.querySelector('.pn'); if(y) y.remove();
      Array.prototype.forEach.call(c.querySelectorAll('small'), function(sm){ sm.insertBefore(document.createTextNode(', '), sm.firstChild); });
      var t = c.textContent.replace(/\s+/g, ' ').trim(); if(t) b.setAttribute('aria-label', t);
    });
  }
  /* 휴대폰처럼 좁은 화면에서 아래 단추 이름을 짧게(화면 전용) */
  function shortLabels(){
    [['btn-img', '🖼️', '그림으로 저장', '그림 저장'], ['btn-clear', '🧹', '내 기록 지우기', '기록 지우기']].forEach(function(x){
      var b = document.getElementById(x[0]); if(!b || b.textContent.indexOf(x[2]) < 0) return;
      b.textContent = x[1] + ' ';
      var l = document.createElement('span'); l.className = 'lbl-l'; l.textContent = x[2]; b.appendChild(l);
      var s = document.createElement('span'); s.className = 'lbl-s'; s.textContent = x[3]; b.appendChild(s);
      b.setAttribute('aria-label', x[2]);
    });
  }

  /* 활동지 1·2 나눠 보기: .parts 단추(data-part) ↔ .part(id). 주소 #part-2 로 바로 열 수 있음 */
  function initParts(){
    var tabs = document.querySelectorAll('.parts [data-part]');
    if(!tabs.length) return;
    function show(id, push){
      Array.prototype.forEach.call(tabs, function(t){
        var on = t.getAttribute('data-part') === id;
        t.setAttribute('aria-selected', on);
        var p = document.getElementById(t.getAttribute('data-part')); if(p) p.hidden = !on;
      });
      if(push){ try{ history.replaceState(null, '', '#' + id); }catch(e){} }
    }
    Array.prototype.forEach.call(tabs, function(t){
      t.addEventListener('click', function(){ show(t.getAttribute('data-part'), true); window.scrollTo(0, 0); });
    });
    var h = location.hash.slice(1);
    var first = tabs[0].getAttribute('data-part');
    show(document.getElementById(h) && document.querySelector('.parts [data-part="' + h + '"]') ? h : first, false);
  }
  /* 지금 보이는 활동지(나눠 보기가 있으면 그 부분) */
  function currentPart(){ return document.querySelector('.part:not([hidden])'); }

  /* 여러 개 적는 목록(칩): list는 배열, onChange는 저장 */
  function chipList(ul, list, onChange){
    ul.innerHTML = '';
    list.forEach(function(v, i){
      var li = document.createElement('li');
      li.appendChild(document.createTextNode(v));
      var x = document.createElement('button');
      x.type = 'button'; x.textContent = '✕'; x.setAttribute('aria-label', v + ' 빼기');
      x.addEventListener('click', function(){ list.splice(i, 1); onChange(); chipList(ul, list, onChange); });
      li.appendChild(x); ul.appendChild(li);
    });
  }
  function bindAdder(box, list, ul, onChange){
    var inp = box.querySelector('input'), btn = box.querySelector('button');
    function add(){ var v = inp.value.trim(); if(!v) return; list.push(v); inp.value = ''; onChange(); chipList(ul, list, onChange); inp.focus(); }
    btn.addEventListener('click', add);
    inp.addEventListener('keydown', function(e){ if(e.key === 'Enter'){ e.preventDefault(); add(); } });
  }

  window.MC = { load:load, save:save, remove:remove, toast:toast, markSaved:markSaved, saveImage:saveImage, confirmClear:confirmClear, swapInputs:swapInputs, currentPart:currentPart, chipList:chipList, bindAdder:bindAdder, printOnly:printOnly, showQr:showQr, qrSvg:qrSvg, pageUrl:pageUrl, BASE:BASE, printMenu:printMenu, doPrint:doPrint, setPaper:setPaper, BLANK:BLANK };
})();
