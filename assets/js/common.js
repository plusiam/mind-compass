/* 마음여행 길잡이 공통 기능
   - 학생이 쓴 내용은 이 기기의 브라우저(localStorage)에만 저장하고 어디로도 보내지 않는다.
   - 저장 키: mc:v1:<활동 이름>
*/
(function(){
  'use strict';
  var PREFIX = 'mc:v1:';

  function load(key){
    try{ return JSON.parse(localStorage.getItem(PREFIX+key)) || {}; }catch(e){ return {}; }
  }
  function save(key, data){
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
    toastTimer = setTimeout(function(){ toastEl.classList.remove('show'); }, 1800);
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
    function restore(){ undo(); document.body.classList.remove('capturing'); if(extraClass) document.body.classList.remove(extraClass); }
    document.body.classList.add('capturing');
    if(extraClass) document.body.classList.add(extraClass);
    window.html2canvas(el, {backgroundColor:'#ffffff', scale:2, useCORS:false, scrollX:0, scrollY:-window.scrollY}).then(function(canvas){
      restore();
      var a = document.createElement('a');
      a.download = filename + '.png';
      a.href = canvas.toDataURL('image/png');
      document.body.appendChild(a); a.click(); a.remove();
      toast(doneMsg || '그림 파일로 저장했어요');
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
  window.addEventListener('beforeprint', function(){ if(!printUndo) printUndo = swapInputs(document.body); });
  window.addEventListener('afterprint', function(){
    if(printUndo){ printUndo(); printUndo = null; }
    document.body.classList.remove('print-solo');
    var solo = document.getElementById('solo-print'); if(solo) solo.remove();
  });

  /* 한 부분만 인쇄·PDF(예: 선생님께 드리는 쪽지): 글자로 바꾼 복사본만 따로 두고 나머지는 숨긴다 */
  function printOnly(el){
    var old = document.getElementById('solo-print'); if(old) old.remove();
    var undo = swapInputs(el);
    var copy = el.cloneNode(true);
    undo();
    copy.removeAttribute('id');
    Array.prototype.forEach.call(copy.querySelectorAll('input, textarea, select'), function(x){ x.remove(); });
    var box = document.createElement('div'); box.id = 'solo-print'; box.appendChild(copy);
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
    initParts();
  });

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

  window.MC = { load:load, save:save, remove:remove, toast:toast, markSaved:markSaved, saveImage:saveImage, confirmClear:confirmClear, swapInputs:swapInputs, currentPart:currentPart, chipList:chipList, bindAdder:bindAdder, printOnly:printOnly };
})();
