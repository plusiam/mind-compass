/* 마음여행 길잡이 · 수업 슬라이드(교사용) 링크 모음
 * 링크를 바꿀 때는 이 파일의 S 목록만 고치면 홈 「선생님 안내」에 반영된다.
 * 구글 드라이브 공개용 사본: 링크가 있는 모든 사용자 = 뷰어, 뷰어 다운로드·복사·인쇄 끔.
 * /present 로 열어 바로 슬라이드쇼(클릭 애니메이션 재생). 차시 페이지·QR 모음에는 넣지 않는다(학생 화면).
 */
(function(){
  'use strict';
  var S = [[1,"마음 여행, 함께 출발","1l8oM5u04xiJhDwlEJR6ttmDnyN2e04vp"],[2,"다양한 삶! 나의 가치!","1bekw6gYSo8BHvYr-94wwlLrQ0dmGeXdf"],[3,"약점도 괜찮아, 모두 다 꽃이야!","1pJFdLxXUq6iC3nZTZq21KpnL3EcTSt8E"],[4,"내가 나라서 참 좋아!","18k8hTkPfSEOV317mxA3ISxv7s6hXb7mq"],[5,"감정이 커질 때","1owOcpxDIxRYtUXcQZiFtvxHCbmhxhuiQ"],[6,"멈추고 생각하고 행동하기","1uuJcog5AXJqCdWtKK6h-BqX744d2tNAV"],[7,"나만의 스트레스 대처법","1NLVCcMOZLUMC0VwZKypWRi-vwugp-jZo"],[8,"마음이 통하는 대화","151nZ0_C97h_7uipIr6ZiyE2NNNitc1SE"],[9,"갈등을 기회로","1HEyExv2FAFJzE3jG5VyDh4tvO8uJxjCU"],[10,"함께 푸는 우리 문제","1uwuXx4ZHkNzE-p_jK0-vG0dzxPwNdCFM"],[11,"너와 나의 다름","1nlK6LTrz_SbBAX1gBwVf5SLX9Rh--LPZ"],[12,"우리는 연결되어 있어","1SK0bXlqntp4mbwxnMEXzcdWjoCFIwjuz"],[13,"함께 지키는 약속","1kVOnZmWT7X-i2rwn7hFOH8fowevaI19u"],[14,"마음 신호에 닻 내리기","1XuKypZOe0c3TCDdTfH5m890ajQ5sVHgU"],[15,"다시 튀어 오르는 힘","1-kAZqM4JZS1XJa1pgjBqua-_1TlvwWyD"],[16,"도움을 청하는 용기","11EGf1ZReAQ3gYjqoQ5UQ4s6OFMrRs1RZ"],[17,"마음 여행을 돌아보며","1qUdGE6MtFH1SGDm2NhivOF8Ay2ZPRrxo"]];
  var G = [["마음여행 출발",[1]],["자기인식·관리",[2,3,4,5,6,7]],["소통·협력",[8,9,10]],["책임",[11,12,13]],["마음돌봄",[14,15,16]],["마음여행 되돌아보기",[17]]];
  var box = document.getElementById('slide-list');
  if(!box) return;
  var byNo = {}; S.forEach(function(x){ byNo[x[0]] = x; });
  G.forEach(function(g){
    var row = document.createElement('div'); row.className = 'sl-row';
    var h = document.createElement('span'); h.className = 'sl-area'; h.textContent = g[0]; row.appendChild(h);
    var ul = document.createElement('div'); ul.className = 'sl-links';
    g[1].forEach(function(n){
      var x = byNo[n]; if(!x || !x[2]) return;
      var a = document.createElement('a');
      a.href = 'https://docs.google.com/presentation/d/' + x[2] + '/present';
      a.target = '_blank'; a.rel = 'noopener';
      a.textContent = n + '차시 ' + x[1] + ' ↗';
      a.setAttribute('aria-label', n + '차시 ' + x[1] + ' 수업 슬라이드, 새 창');
      ul.appendChild(a);
    });
    row.appendChild(ul); box.appendChild(row);
  });
})();
