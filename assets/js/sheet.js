/* 마음여행 길잡이 · 원고 활동지 그리기(2~13차시)
   window.SHEET = { key, file, parts:[{id, label, sub, title, subtitle, blocks:[...]}] }
   블록 종류: q(물음) · box(▶ 칸) · fields(칸 묶음) · table(표) · lines(①②③ 줄) · story(글)
             checks(☐ 점검) · sentence(빈칸 문장) · list(안내 목록) · kv(왼쪽 이름 표) · note(작은 글)
             board(모둠판 그림) · wifi(감정 와이파이 그림) · market(당근마켓 칸) · grid(판매자 칸)
   학생이 쓴 내용은 이 기기에만 저장(MC.save). 빈 학습지(?blank=1)에서는 불러오지도 저장하지도 않음. */
(function(){
  'use strict';
  var S = window.SHEET; if(!S) return;
  /* blankOnly: 화면에 쓰지 않고 빈 학습지 인쇄만(예: 3차시 익명 활동, 12차시 모둠판) */
  var ONLY = !!S.blankOnly;
  if(ONLY) document.documentElement.setAttribute('data-blank-only', '');
  var st = ONLY ? {} : MC.load(S.key);
  function persist(){ if(ONLY) return; if(MC.save(S.key, st)) MC.markSaved(); }
  function el(tag, cls, text){ var e = document.createElement(tag); if(cls) e.className = cls; if(text != null) e.textContent = text; return e; }
  function input(k, rows, label, ph){
    var f;
    if(rows && rows > 1){ f = document.createElement('textarea'); f.rows = rows; f.style.minHeight = (rows * 1.6 + 0.8) + 'em'; }
    else { f = document.createElement('input'); f.type = 'text'; }
    f.className = 'field'; f.setAttribute('data-k', k); if(label) f.setAttribute('aria-label', label); if(ph) f.placeholder = ph;
    if(ONLY){ f.readOnly = true; f.tabIndex = -1; }
    f.value = st[k] || '';
    f.addEventListener('input', function(){ st[k] = f.value; persist(); });
    return f;
  }
  function tog(k, text){
    var b = el('button', 'tog chk'); b.type = 'button';
    var on = !!st[k]; b.setAttribute('aria-pressed', on);
    b.innerHTML = '<span class="bx" aria-hidden="true">' + (on ? '✓' : '') + '</span>'; b.appendChild(document.createTextNode(text));
    b.addEventListener('click', function(){ st[k] = !st[k]; b.setAttribute('aria-pressed', !!st[k]); b.querySelector('.bx').textContent = st[k] ? '✓' : ''; persist(); });
    return b;
  }

  var R = {
    q: function(b){ var h = el('h2'); if(b.n) h.innerHTML = '<span class="num">' + b.n + '</span>'; h.appendChild(document.createTextNode(b.text)); return h; },
    ans: function(b){
      if(b.count && b.count > 1){ var d = el('div', 'ws-ans'); for(var i = 0; i < b.count; i++) d.appendChild(input(b.k + '.' + i, b.rows || 1, (b.label || '답') + ' ' + (i + 1))); return d; }
      return input(b.k, b.rows || 1, b.label || '답');
    },
    row2: function(b){ var d = el('div', 'ws-row2'); d.appendChild(R[b.left.t](b.left)); d.appendChild(R[b.right.t](b.right)); return d; },
    pic: function(b){ var d = el('div', 'ws-pic'); d.appendChild(el('span', '', b.label || '그림')); return d; },
    markstory: function(b){
      /* 문장을 누를 때마다: 밑줄(단정한 말) → 물결선(참여 기회를 막은 행동) → 없음 */
      var d = el('div', 'story mark-story');
      if(b.title) d.appendChild(el('p', 'story-title', b.title));
      var leg = el('p', 'note screen-only', '문장을 누를 때마다 밑줄 → 물결선 → 지우기 순서로 바뀌어요.'); d.appendChild(leg);
      var p = el('p');
      b.sents.forEach(function(s, i){
        var k = b.k + '.' + i, sp = el('span', 'ms', s);
        if(!ONLY){ sp.setAttribute('role', 'button'); sp.tabIndex = 0; }
        var paint = function(){ sp.classList.toggle('u', st[k] === 1); sp.classList.toggle('w', st[k] === 2); };
        var cyc = function(){ if(ONLY) return; st[k] = ((st[k] || 0) + 1) % 3; paint(); persist(); };
        sp.addEventListener('click', cyc); sp.addEventListener('keydown', function(e){ if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); cyc(); } });
        paint(); p.appendChild(sp); p.appendChild(document.createTextNode(' '));
        if(b.breakAfter && b.breakAfter.indexOf(i) > -1){ d.appendChild(p); p = el('p'); }
      });
      d.appendChild(p);
      return d;
    },
    note: function(b){ return el('p', 'note', b.text); },
    story: function(b){
      var d = el('div', 'story');
      if(b.title) d.appendChild(el('p', 'story-title', b.title));
      (b.paras || [b.text]).forEach(function(t){ d.appendChild(el('p', '', t)); });
      return d;
    },
    box: function(b){
      var d = el('div', 'ws-box');
      d.appendChild(el('p', 'ws-lab', '▶ ' + b.label));
      d.appendChild(input(b.k, b.rows || 3, b.label));
      return d;
    },
    fields: function(b){
      var d = el('div', 'ws-box');
      b.items.forEach(function(it){
        if(it.rows && it.rows > 1){ d.appendChild(el('p', 'ws-lab', '▶ ' + it.label)); d.appendChild(input(it.k, it.rows, it.label)); }
        else { var r = el('div', 'ws-inline'); r.appendChild(el('span', 'ws-lab', '▶ ' + it.label)); r.appendChild(input(it.k, 1, it.label)); d.appendChild(r); }
      });
      return d;
    },
    lines: function(b){
      var d = el('div', 'ws-box ws-lines');
      b.items.forEach(function(m, i){ var r = el('div', 'ws-inline'); r.appendChild(el('span', 'ws-no', m)); r.appendChild(input(b.k + '.' + i, b.rows || 1, m)); d.appendChild(r); });
      return d;
    },
    table: function(b){
      var w = el('div', 'ws-tw'), t = el('table', 'ws-table'); w.appendChild(t);
      if(b.caption){ var cap = el('caption', '', b.caption); t.appendChild(cap); }
      var thead = el('thead'), hr = el('tr');
      if(b.rows) hr.appendChild(el('th', 'corner', b.corner || ''));
      b.cols.forEach(function(c){ hr.appendChild(el('th', '', c)); });
      thead.appendChild(hr); t.appendChild(thead);
      var tb = el('tbody');
      var rows = b.rows || (b.count ? Array.apply(null, Array(b.count)).map(function(){ return ''; }) : ['']);
      rows.forEach(function(rl, ri){
        var tr = el('tr');
        if(b.rows) tr.appendChild(el('th', 'rl', rl));
        b.cols.forEach(function(c, ci){ var td = el('td'); td.appendChild(input(b.k + '.' + ri + '.' + ci, b.cellRows || 2, (rl ? rl + ' ' : '') + c)); tr.appendChild(td); });
        tb.appendChild(tr);
      });
      t.appendChild(tb);
      return w;
    },
    kv: function(b){
      var t = el('table', 'ws-table ws-kv');
      b.rows.forEach(function(r, i){ var tr = el('tr'); tr.appendChild(el('th', 'rl', r[0])); var td = el('td'); td.appendChild(input(b.k + '.' + i, r[1] || 2, r[0])); tr.appendChild(td); t.appendChild(tr); });
      return t;
    },
    checks: function(b){
      var d = el('div', 'ws-checks' + (b.inline ? ' inline' : ''));
      if(b.title) d.appendChild(el('p', 'ws-lab', b.title));
      b.items.forEach(function(t, i){ d.appendChild(tog(b.k + '.' + i, t)); });
      return d;
    },
    list: function(b){ var u = el('ul', 'ws-list'); b.items.forEach(function(t){ u.appendChild(el('li', '', t)); }); return u; },
    sentence: function(b){
      var p = el('p', 'sentence');
      b.parts.forEach(function(x, i){
        if(typeof x === 'string') p.appendChild(document.createTextNode(x));
        else { var f = input(b.k + '.' + i, 1, x.label || '빈칸'); f.className = ''; f.style.width = x.w || '9em'; p.appendChild(f); }
      });
      return p;
    },
    label: function(b){ var d = el('div', 'ws-inline'); d.appendChild(el('span', 'ws-lab', b.label)); d.appendChild(input(b.k, 1, b.label)); return d; },
    board: function(b){
      var d = el('div', 'board-wrap');
      var img = el('img', 'board'); img.src = b.src; img.alt = b.alt; img.loading = 'lazy'; d.appendChild(img);
      if(b.note) d.appendChild(el('p', 'board-note', b.note));
      return d;
    },
    wifi: function(b){
      var d = el('div', 'ws-box wifi');
      d.innerHTML = '<svg viewBox="0 0 400 360" class="wifi-svg" role="img" aria-label="감정 와이파이 1~4단계 그림"><g fill="none" stroke="#1e2a33" stroke-width="22">' +
        '<path d="M20 268 A92 92 0 0 1 112 360"/><path d="M20 176 A184 184 0 0 1 204 360"/><path d="M20 84 A276 276 0 0 1 296 360"/></g>' +
        '<circle cx="34" cy="346" r="22" fill="#1e2a33"/>' +
        '<g font-size="20" font-weight="700" fill="#55606b"><text x="70" y="330">1</text><text x="150" y="300">2</text><text x="240" y="250">3</text><text x="330" y="190">4</text></g></svg>';
      var g = el('div', 'wifi-in');
      ['1단계','2단계','3단계','4단계'].forEach(function(s, i){ var r = el('div', 'ws-inline'); r.appendChild(el('span', 'ws-no', s)); r.appendChild(input(b.k + '.' + i, 2, s + ' 감정의 크기와 신호')); g.appendChild(r); });
      d.appendChild(g);
      return d;
    },
    market: function(b){
      var d = el('div', 'market');
      var h = el('p', 'market-h'); h.appendChild(document.createTextNode('( ')); var nm = input(b.k + '.n', 1, '이름'); nm.className = ''; nm.style.width = '7em'; h.appendChild(nm); h.appendChild(document.createTextNode(' )의 당근마켓')); d.appendChild(h);
      [0, 1].forEach(function(i){
        var c = el('div', 'market-c');
        var l = el('div', 'market-l');
        l.appendChild(el('b', '', '나의 능력(장점)')); l.appendChild(input(b.k + '.a' + i, 2, '나의 능력(장점) ' + (i + 1)));
        l.appendChild(el('b', '', '이 능력이 있으면')); l.appendChild(input(b.k + '.b' + i, 2, '이 능력이 있으면 ' + (i + 1)));
        l.appendChild(el('b', 'r', '할 수 있습니다.'));
        c.appendChild(l);
        var pic = el('div', 'market-pic'); pic.appendChild(el('span', '', '간단한 그림 (시간이 되는 친구들만!)')); c.appendChild(pic);
        d.appendChild(c);
      });
      return d;
    },
    grid: function(b){
      var d = el('div', 'market');
      var h = el('p', 'market-h'); h.appendChild(document.createTextNode('( ')); var nm = input(b.k + '.n', 1, '이름'); nm.className = ''; nm.style.width = '7em'; h.appendChild(nm); h.appendChild(document.createTextNode(' )의 당근마켓')); d.appendChild(h);
      var g = el('div', 'buy-grid');
      for(var i = 0; i < 12; i++){
        var c = el('div', 'buy-c');
        var r1 = el('div', 'ws-inline'); r1.appendChild(el('b', '', '판매자:')); r1.appendChild(input(b.k + '.s' + i, 1, '판매자 ' + (i + 1))); c.appendChild(r1);
        c.appendChild(el('b', '', '구매내역')); c.appendChild(input(b.k + '.p' + i, 2, '구매내역 ' + (i + 1)));
        g.appendChild(c);
      }
      d.appendChild(g);
      return d;
    }
  };

  /* 화면 만들기 */
  var root = document.getElementById('parts-root');
  if(ONLY && S.onlyNote){ var on = el('p', 'only-note', S.onlyNote); root.appendChild(on); }
  S.parts.forEach(function(p, pi){
    var sec = el('section', 'part'); sec.id = p.id; sec.setAttribute('role', 'tabpanel');
    if(p.paper) sec.setAttribute('data-paper', p.paper);
    if(p.board) sec.classList.add('board-part');
    if(pi > 0) sec.hidden = true;
    var head = el('div', 'ws-head');
    var tb = el('div', 'ws-title'); tb.appendChild(el('b', '', p.title)); if(p.subtitle) tb.appendChild(el('span', '', p.subtitle));
    head.appendChild(tb);
    var info = el('div', 'ws-info print-only'); info.innerHTML = '<span>초등학교</span><span>학년 &nbsp; &nbsp; &nbsp; 반</span><span>이름:</span>';
    if(!p.board) head.appendChild(info);
    sec.appendChild(el('h2', 'part-title print-only', p.label));
    if(!p.board) sec.appendChild(head);
    if(p.lead) sec.appendChild(el('p', 'note', p.lead));
    var cur = null;
    p.blocks.forEach(function(b){
      if(b.t === 'q'){ cur = el('section', 'step'); cur.appendChild(R.q(b)); sec.appendChild(cur); return; }
      var node = R[b.t](b);
      (cur || sec).appendChild(node);
    });
    sec.appendChild(el('p', 'credit print-only', '『마음여행』 ' + S.lesson + '차시 연계 웹학습지 · 마음여행 길잡이 plusiam.github.io/mind-compass/' + S.lesson + '/' + (pi ? '#' + p.id : '')));
    root.appendChild(sec);
  });
  /* 활동지 나눠 보기 단추 */
  var tabs = document.getElementById('parts-tabs');
  if(S.parts.length > 1){
    S.parts.forEach(function(p, i){
      var b = el('button'); b.type = 'button'; b.setAttribute('role', 'tab'); b.setAttribute('data-part', p.id);
      b.innerHTML = '<span class="pn">' + (i + 1) + '</span><span></span>';
      b.lastChild.appendChild(document.createTextNode(p.label)); var sm = el('small', '', p.sub || ''); b.lastChild.appendChild(sm);
      tabs.appendChild(b);
    });
  } else tabs.remove();

  /* 아래 단추 */
  document.getElementById('btn-print').addEventListener('click', function(){ MC.printMenu(); });
  document.getElementById('btn-img').addEventListener('click', function(){
    var p = MC.currentPart() || document.querySelector('.part');
    MC.saveImage(document.querySelector('.sheet'), S.lesson + '차시_' + (p ? p.id : 'sheet'));
  });
  document.getElementById('btn-clear').addEventListener('click', function(){ MC.confirmClear(S.key, function(){ location.reload(); }); });
  var nm = document.getElementById('name'); if(nm){ nm.value = st.name || ''; nm.addEventListener('input', function(){ st.name = nm.value; persist(); }); }
})();
