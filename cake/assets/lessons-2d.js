/* One procedural, original 2D illustration system for all 31 lessons.
   The chapter HTML is the source of truth for captions, amounts and timings. */
(() => {
  "use strict";
  const W=960,H=540, C={paper:"#fff7e9",cream:"#fffdf6",ink:"#49372e",muted:"#77675c",line:"#d9bc9d",rose:"#df9b91",sage:"#93b49b",gold:"#e6ae62",brown:"#a96b43",choc:"#755042",milk:"#fffdf4",blue:"#a4c5d2",orange:"#e78c47"};
  // One entry per source step, in its exact order. Art is illustrative, never a new recipe.
  const boards=[
    ["salted","mix","foam","fold","oven","emulsion","decorate"],
    ["roll","separate","mix","foam","fold","roll","pipe"],
    ["pancake","mix","pour","sieve","pan","press"],
    ["crepe","mix","sieve","rest","pan"],
    ["chocolate","mix","foam","oven","melt","chill"],
    ["cupcake","separate","fold","oven","pipe"],
    ["coconut","cream","mix","shape","oven"],
    ["cookie","cream","mix","divide","oven"],
    ["muffin","mix","pour","divide","oven"],
    ["tart","knead","chill","sieve","tart","oven"],
    ["butter","cream","pour","fold","oven"],
    ["flan","measure","sieve","caramel","steam"],
    ["choux","custard","measure","custard","pipe","fill"],
    ["panna","gelatin","custard","chill","layer"],
    ["flangato","sieve","layer","foam","steam"],
    ["tiramisu","mix","custard","fold","layer"],
    ["sesame","custard","custard"],
    ["mousse","fold","gelatin","foam","layer","chill"],
    ["paparoti","knead","proof","cream","pipe"],
    ["pizza","knead","pan","proof","pizza"],
    ["banana","fruit","mix","oven"],
    ["bananaRound","layer","measure"],
    ["orange","fruit"],
    ["burger","knead","proof","brush","burger"],
    ["floss","shape","brush","emulsion"],
    ["donut","shape","decorate"],
    ["pineapple","custard","fill","brush","rest"],
    ["pinecake","fruit","cream"],
    ["durian","sieve","pan","foldcrepe"],
    ["jelly","gelatin","custard","layer","fruit"],
    ["bao","shape","knead","fill","review"]
  ];
  const chapters=[...document.querySelectorAll("[data-chapter]")];
  const reduce=window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  let active=null;
  const make=(tag,cls,txt)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(txt)e.textContent=txt;return e;};
  const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
  const ease=x=>{x=clamp(x,0,1);return x*x*(3-2*x);};
  const lerp=(a,b,t)=>a+(b-a)*t;
  function rounded(g,x,y,w,h,r,fill,stroke=C.ink,lw=3){
    r=Math.min(r,w/2,h/2);g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();
    if(fill){g.fillStyle=fill;g.fill();}if(stroke){g.strokeStyle=stroke;g.lineWidth=lw;g.stroke();}
  }
  function oval(g,x,y,rx,ry,fill,stroke=C.ink,lw=3){g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);if(fill){g.fillStyle=fill;g.fill();}if(stroke){g.lineWidth=lw;g.strokeStyle=stroke;g.stroke();}}
  function path(g,pts,fill,stroke=C.ink,lw=3,close=true){g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));if(close)g.closePath();if(fill){g.fillStyle=fill;g.fill();}if(stroke){g.strokeStyle=stroke;g.lineWidth=lw;g.stroke();}}
  function line(g,x,y,x2,y2,color=C.ink,w=4){path(g,[[x,y],[x2,y2]],null,color,w,false);}
  function text(g,s,x,y,size=20,color=C.ink,weight=600,align="left"){g.font=weight+" "+size+"px system-ui, sans-serif";g.textBaseline="middle";g.textAlign=align;g.fillStyle=color;g.fillText(s,x,y);}
  function lines(g,s,max,size=21,weight=500){g.font=weight+" "+size+"px system-ui, sans-serif";const out=[];let a="";for(const w of String(s).split(/\s+/)){const n=a?a+" "+w:w;if(a&&g.measureText(n).width>max){out.push(a);a=w;}else a=n;}if(a)out.push(a);return out;}
  function fit(g,s,x,y,w,h,size=25,min=14,weight=600,color=C.ink){let arr;do{arr=lines(g,s,w,size,weight);if(arr.length*size*1.28<=h||size<=min)break;size--;}while(true);const dy=size*1.28;arr.forEach((v,i)=>text(g,v,x,y+(i+.5)*dy,size,color,weight));}
  function spark(g,x,y,r=10){line(g,x-r,y,x+r,y,C.gold,3);line(g,x,y-r,x,y+r,C.gold,3);}
  function arrow(g,x,y,x2,y2){line(g,x,y,x2,y2,C.muted,3);const a=Math.atan2(y2-y,x2-x);path(g,[[x2,y2],[x2-13*Math.cos(a-.55),y2-13*Math.sin(a-.55)],[x2-13*Math.cos(a+.55),y2-13*Math.sin(a+.55)]],C.muted,null);}
  function bowl(g,x,y,r=93,fill=C.gold){g.beginPath();g.moveTo(x-r,y);g.quadraticCurveTo(x-r*.84,y+r*.85,x,y+r*.88);g.quadraticCurveTo(x+r*.84,y+r*.85,x+r,y);g.closePath();g.fillStyle=C.rose;g.fill();g.strokeStyle=C.ink;g.lineWidth=3;g.stroke();oval(g,x,y,r,r*.22,C.cream);oval(g,x,y+1,r*.83,r*.14,fill,null);}
  function whisk(g,x,y,a){g.save();g.translate(x,y);g.rotate(a);rounded(g,-8,-114,16,61,7,C.sage);for(let i=-1;i<=1;i++){g.beginPath();g.ellipse(i*9,-21,12,34,i*.23,0,Math.PI*2);g.strokeStyle=C.ink;g.lineWidth=2.5;g.stroke();}g.restore();}
  function egg(g,x,y,r=23){oval(g,x,y,r*.78,r,C.cream);oval(g,x+2,y+1,r*.39,r*.42,C.gold,null);}
  function cup(g,x,y,fill=C.milk){path(g,[[x-28,y-45],[x+28,y-45],[x+22,y+22],[x-22,y+22]],fill);oval(g,x,y-45,28,8,C.cream);oval(g,x,y-44,23,5,fill,null);}
  function tray(g,x,y,w=190,h=85){rounded(g,x-w/2,y-h/2,w,h,13,C.blue);rounded(g,x-w/2+8,y-h/2+8,w-16,h-16,8,C.cream,C.line,2);}
  function pot(g,x,y,fill=C.gold){rounded(g,x-87,y-12,174,76,18,C.blue);oval(g,x,y-11,86,18,C.cream);oval(g,x,y-11,75,12,fill,null);rounded(g,x+82,y+4,48,16,7,C.sage);}
  function steam(g,x,y,t){for(let i=0;i<3;i++){const d=(t*46+i*18)%45;g.beginPath();g.moveTo(x+(i-1)*30,y-d);g.bezierCurveTo(x+(i-1)*30-12,y-d-10,x+(i-1)*30+12,y-d-18,x+(i-1)*30,y-d-29);g.globalAlpha=1-d/50;g.strokeStyle=C.muted;g.lineWidth=3;g.stroke();g.globalAlpha=1;}}
  function clock(g,x,y,t){oval(g,x,y,36,36,C.cream);line(g,x,y,x,y-22);line(g,x,y,x+20*Math.sin(t*6.28),y-20*Math.cos(t*6.28),C.brown,3);}
  function sieve(g,x,y,t){oval(g,x,y,57,13,C.cream);for(let i=-4;i<=4;i++)line(g,x+i*11,y-8,x+i*11,y+8,C.line,1);line(g,x+56,y,x+103,y,C.ink,7);for(let i=0;i<12;i++){const d=(i*13+t*75)%68;oval(g,x-42+(i*31)%85,y+13+d,2.5,2.5,C.brown,null);}}
  function piping(g,x,y,a=0){g.save();g.translate(x,y);g.rotate(a);path(g,[[-29,-77],[30,-77],[9,-12],[3,5],[-4,5],[-10,-12]],C.cream);line(g,-26,-70,27,-70,C.rose,8);g.restore();}
  function swirl(g,x,y,r,color=C.cream){for(let i=0;i<4;i++)oval(g,x,y-i*r*.22,r*(1-i*.2),r*.27,color);spark(g,x+r+15,y-r,7);}
  function fruit(g,x,y,kind){if(kind==="orange"){oval(g,x,y,36,36,C.orange);oval(g,x,y,27,27,C.gold);for(let i=0;i<8;i++){const a=i*Math.PI/4;line(g,x,y,x+25*Math.cos(a),y+25*Math.sin(a),C.cream,2);}}
    else if(kind==="pineapple"){oval(g,x,y+8,34,42,C.gold);for(let i=-2;i<=2;i++){line(g,x-24,y+i*13,x+24,y+i*13+18,C.brown,2);line(g,x+24,y+i*13,x-24,y+i*13+18,C.brown,2);}path(g,[[x-22,y-28],[x-29,y-61],[x-5,y-43],[x+5,y-72],[x+15,y-42],[x+31,y-61],[x+24,y-28]],C.sage);}
    else if(kind==="durian"){oval(g,x,y,41,33,C.sage);for(let i=0;i<10;i++){const a=i*.628;path(g,[[x+32*Math.cos(a-.1),y+25*Math.sin(a-.1)],[x+48*Math.cos(a),y+39*Math.sin(a)],[x+32*Math.cos(a+.1),y+25*Math.sin(a+.1)]],C.sage);}oval(g,x,y,24,19,C.gold);}
    else{g.beginPath();g.moveTo(x-46,y-14);g.quadraticCurveTo(x+10,y+36,x+47,y-22);g.quadraticCurveTo(x+44,y+51,x-27,y+27);g.closePath();g.fillStyle=C.gold;g.fill();g.strokeStyle=C.ink;g.lineWidth=3;g.stroke();}}
  function pastry(g,kind,x,y,s=1){g.save();g.translate(x,y);g.scale(s,s);oval(g,0,53,123,17,C.cream,C.line,2);
    const dot=(x,y,r=4,col=C.choc)=>oval(g,x,y,r,r,col,null);
    const cake=(base,top)=>{rounded(g,-78,-20,156,65,13,base);oval(g,0,-20,78,19,top);};
    const bread=(x,y,r=42,col=C.gold)=>{g.beginPath();g.moveTo(x-r,y+20);g.quadraticCurveTo(x-r*1.15,y-r,x,y-r);g.quadraticCurveTo(x+r*1.15,y-r,x+r,y+20);g.closePath();g.fillStyle=col;g.fill();g.strokeStyle=C.ink;g.lineWidth=3;g.stroke();};
    if(kind==="salted"){cake("#edc17d",C.gold);for(let i=0;i<6;i++){let a=i*Math.PI/3;oval(g,Math.cos(a)*53,-22+Math.sin(a)*12,15,10,C.orange);}for(let i=0;i<20;i++)line(g,-55+i*6,-15+(i%3)*6,-48+i*6,-22+(i%4)*6,C.brown,2);}
    else if(kind==="roll"){rounded(g,-78,-30,127,76,30,C.sage);oval(g,45,8,39,38,C.gold);g.beginPath();for(let a=0;a<Math.PI*4;a+=.08){const r=2+a*2.3;const xx=45+Math.cos(a)*r,yy=8+Math.sin(a)*r;if(a===0)g.moveTo(xx,yy);else g.lineTo(xx,yy);}g.strokeStyle=C.cream;g.lineWidth=8;g.stroke();}
    else if(kind==="pancake"||kind==="crepe"){for(let i=0;i<4;i++)oval(g,-15,35-i*13,76,19,i%2?C.gold:"#eac58f");rounded(g,-30,-22,28,17,3,C.cream);if(kind==="pancake"){rounded(g,58,0,78,34,14,C.brown);line(g,66,13,125,13,C.gold,5);}}
    else if(kind==="chocolate"){cake(C.choc,"#85513d");for(let i=-3;i<=3;i++)oval(g,i*21,-6,8,19,C.choc,null);swirl(g,0,-33,27,C.cream);}
    else if(kind==="cupcake"||kind==="muffin"){for(let i=-1;i<=1;i++){let x=i*67;path(g,[[x-27,4],[x+27,4],[x+20,45],[x-20,45]],i===0?C.rose:C.sage);oval(g,x,0,32,17,kind==="muffin"?[C.gold,C.choc,C.sage][i+1]:C.gold);if(kind==="cupcake")swirl(g,x,-13,23,i===0?C.rose:C.cream);else for(let j=0;j<4;j++)dot(x-18+j*11,-4+j%2*5);}}
    else if(["cookie","coconut","pineapple"].includes(kind)){for(let i=0;i<3;i++){let xx=-62+i*62;const co=kind==="cookie"&&i===1?C.choc:C.gold;rounded(g,xx-28,-21+(i%2)*8,56,63,kind==="pineapple"?6:25,co);for(let j=0;j<8;j++)dot(xx-17+(j*17)%33,-10+(j*11)%36,kind==="coconut"?2:3,kind==="coconut"?C.cream:C.brown);}}
    else if(kind==="tart"){for(let i=0;i<2;i++){let xx=-47+i*94;oval(g,xx,26,43,22,C.brown);oval(g,xx,12,45,22,C.gold);oval(g,xx,12,33,15,"#f5cf70");}}
    else if(["butter","banana","pinecake"].includes(kind)){rounded(g,-85,-8,140,54,10,C.brown);bread(-18,-2,66,C.gold);rounded(g,45,-15,43,65,10,"#f1cc8d");for(let i=0;i<8;i++)dot(53+(i*11)%29,-4+(i*17)%45,3);if(kind==="pinecake")fruit(g,-57,-30,"pineapple");if(kind==="banana")fruit(g,-64,-27,"banana");}
    else if(["flan","flangato","bananaRound"].includes(kind)){path(g,[[-55,-28],[55,-28],[80,40],[-80,40]],"#edc47f");if(kind==="flangato")rounded(g,-78,18,156,28,7,C.choc);oval(g,0,-29,55,15,C.brown);oval(g,0,40,80,12,null,C.ink,2);if(kind==="bananaRound")for(let i=-2;i<=2;i++)oval(g,i*18,-28,10,7,C.gold);}
    else if(["choux","sesame","paparoti","bao","floss"].includes(kind)){for(let i=-1;i<=1;i++){let xx=i*68;bread(xx,22,31,kind==="bao"?C.cream:kind==="paparoti"?C.brown:C.gold);if(kind==="choux")line(g,xx-24,22,xx+24,22,C.cream,8);if(kind==="sesame")for(let j=0;j<6;j++)dot(xx-17+(j*11)%34,1+(j*7)%19,2,C.cream);if(kind==="bao")for(let j=-2;j<=2;j++)line(g,xx,-6,xx+j*8,12,C.line,2);if(kind==="paparoti")for(let j=0;j<3;j++)oval(g,xx,0,8+j*7,3+j*3,null,C.gold,2);if(kind==="floss")for(let j=0;j<9;j++)line(g,xx-25+j*6,1,xx-18+j*6,-8,C.brown,2);}}
    else if(["panna","tiramisu","mousse","jelly"].includes(kind)){for(let i=0;i<2;i++){let xx=-48+i*96;const cols=kind==="tiramisu"?[C.choc,C.cream,C.brown]:kind==="panna"?[C.cream,C.cream,C.orange]:kind==="mousse"?[C.gold,C.cream,C.orange]:[C.rose,C.gold,C.sage];path(g,[[xx-40,-36],[xx+40,-36],[xx+30,46],[xx-30,46]],cols[0]);for(let j=1;j<3;j++)path(g,[[xx-40+j*3,-36+(2-j)*27],[xx+40-j*3,-36+(2-j)*27],[xx+36-j*2,-9+(2-j)*27],[xx-36+j*2,-9+(2-j)*27]],cols[j],null);oval(g,xx,-36,40,9,cols[2]);if(kind==="mousse"||kind==="jelly")for(let j=0;j<4;j++)dot(xx-19+j*13,-36,3,kind==="mousse"?C.choc:C.rose);}}
    else if(kind==="pizza"){oval(g,0,10,104,49,C.brown);oval(g,0,7,91,39,C.gold);for(let i=0;i<10;i++){let a=i*.89,r=20+i%3*22;oval(g,Math.cos(a)*r,7+Math.sin(a)*r*.4,9,6,i%2?C.rose:C.sage);}}
    else if(kind==="burger"){bread(0,37,77);rounded(g,-76,3,152,15,7,C.choc);rounded(g,-79,-7,158,13,6,C.sage);path(g,[[-70,-7],[65,-7],[28,13]],C.gold);bread(0,-14,77);for(let i=0;i<9;i++)dot(-54+i*13,-26+(i%3)*4,2.5,C.cream);}
    else if(kind==="donut"){for(let i=0;i<2;i++){let xx=-46+i*92;oval(g,xx,8,44,38,C.gold);oval(g,xx,2,42,31,i?C.choc:C.rose);oval(g,xx,4,14,13,C.cream);for(let j=0;j<9;j++){let a=j*.7;line(g,xx+27*Math.cos(a),3+23*Math.sin(a),xx+30*Math.cos(a+.14),3+26*Math.sin(a+.14),j%2?C.cream:C.gold,3);}}}
    else if(kind==="durian"){for(let i=0;i<2;i++){rounded(g,-82+i*85,-28,78,71,12,i?C.gold:C.sage);line(g,-68+i*85,-16,-17+i*85,29,C.cream,3);}}
    else if(kind==="orange"){fruit(g,-40,4,"banana");fruit(g,56,1,"orange");}
    else cake(C.gold,C.cream);
    g.restore();
  }
  const titles={mix:"Trộn nguyên liệu",foam:"Tạo bọt và vân",fold:"Trộn nhẹ bằng phới",oven:"Nướng bánh",emulsion:"Tạo nhũ tương",decorate:"Trang trí",separate:"Chuẩn bị trứng",roll:"Cuộn bánh",pipe:"Bắt bột / kem",pour:"Thêm nguyên liệu",sieve:"Rây hỗn hợp",pan:"Làm chín trên chảo",press:"Tạo hình trong khuôn",rest:"Để nghỉ / nguội",melt:"Hòa tan cách thủy",chill:"Làm lạnh",cream:"Đánh bơ hoặc kem",shape:"Chia và tạo hình",divide:"Chia phần bột",knead:"Nhào bột",tart:"Ép vỏ tart",measure:"Định lượng",caramel:"Chuẩn bị caramel",steam:"Làm chín cách thủy",custard:"Khuấy hỗn hợp",fill:"Thêm nhân",gelatin:"Ngâm và hòa gelatin",layer:"Xếp từng lớp",proof:"Ủ bột",pizza:"Hoàn thiện đế và nhân",fruit:"Chuẩn bị trái cây",brush:"Quét mặt bánh",burger:"Xếp nhân bánh",foldcrepe:"Gấp vỏ bánh",review:"Kiểm tra dữ liệu"};
  function stage(g,mode,kind,p){const t=reduce ? .25 : p,phase=t*Math.PI*2, bob=Math.sin(phase*3)*7;
    g.save();g.translate(287,216);
    oval(g,0,105,188,15,"#ead8c3",null);line(g,-208,113,208,113,C.line,3);
    const mix=(col=C.gold,foamy=false)=>{bowl(g,0,18,91,col);whisk(g,Math.sin(phase*4)*34,5,Math.sin(phase*4)*.32);if(foamy)for(let i=0;i<11;i++){let a=i*2.4;oval(g,Math.cos(a)*60,11+Math.sin(a)*11-Math.abs(Math.sin(phase+i))*9,5+i%3,4,C.cream,C.line,1);}};
    const oven=()=>{rounded(g,-155,-111,310,217,20,C.sage);rounded(g,-136,-60,272,147,13,C.ink);rounded(g,-123,-47,246,121,8,"#f1c5a1",null);for(let i=0;i<3;i++)oval(g,-95+i*40,-86,10,10,C.cream);rounded(g,60,-98,63,25,5,C.cream);text(g,"°C",91,-86,15,C.ink,700,"center");line(g,-114,54,114,54,C.brown,4);pastry(g,kind,0,7,.67+ease(t)*.12);steam(g,0,-17,t);};
    switch(mode){
      case "intro":case "finish":pastry(g,kind,0,8,1.28);spark(g,-137,-70,10);spark(g,140,-45,13);break;
      case "measure":case "ingredients":rounded(g,-144,46,118,49,9,C.sage);rounded(g,-117,60,64,23,4,C.cream);text(g,"g",-85,71,16,C.ink,700,"center");bowl(g,-85,25,54,C.milk);cup(g,70,24);egg(g,141,44);break;
      case "separate":egg(g,-122,-28,33);arrow(g,-83,-26,-38,-4);bowl(g,-26,22,63,C.gold);bowl(g,114,22,62,C.cream);break;
      case "mix":case "cream":case "foam":case "emulsion":mix(mode==="foam"?C.cream:mode==="cream"?"#f4e2b6":C.gold,mode==="foam"||mode==="cream");if(mode==="emulsion"){cup(g,145,-60,C.gold);for(let i=0;i<4;i++)oval(g,100-i*15,-30+((t*90+i*15)%45),4,6,C.gold,null);}break;
      case "fold":bowl(g,14,22,101,C.gold);g.save();g.translate(-105,-43);g.rotate(.45+ease(t)*.38);bowl(g,0,0,47,C.cream);g.restore();path(g,[[-63,-15],[-43,-8],[-17,16],[-34,19]],C.cream,null);g.save();g.translate(37+Math.sin(phase*3)*30,8);g.rotate(-.6+Math.sin(phase*3)*.2);rounded(g,-9,-95,18,88,7,C.sage);rounded(g,-21,-16,42,34,8,C.cream);g.restore();break;
      case "pour":case "sieve":case "gelatin":bowl(g,10,33,85,mode==="gelatin"?C.blue:C.gold);if(mode==="sieve")sieve(g,10,-55,t);else{g.save();g.translate(-99,-48);g.rotate(.65);cup(g,0,0,mode==="gelatin"?C.blue:C.milk);g.restore();for(let i=0;i<5;i++)oval(g,-58+i*11,-22+((i*13+t*90)%50),4,7,C.milk,C.line,1);}break;
      case "oven":oven();break;
      case "steam":case "custard":case "melt":case "caramel":pot(g,-12,28,mode==="melt"?C.choc:mode==="caramel"?C.brown:C.gold);steam(g,-12,10,t);if(mode==="steam")pastry(g,kind,-14,-30,.55);else whisk(g,-12+Math.sin(phase*4)*23,12,Math.sin(phase*4)*.25);break;
      case "pan":case "press":oval(g,-10,50,105,40,C.ink);rounded(g,79,39,78,17,6,C.sage);oval(g,-10,45,88,29,"#d6ab7d");oval(g,-10,38+bob,66,22,C.gold);if(mode==="press")oval(g,-10,12,90,27,null,C.muted,4);break;
      case "rest":case "proof":oval(g,-40,62,102,17,C.cream,C.line);oval(g,-40,43,53+ease(t)*22,27+ease(t)*12,C.gold);clock(g,124,-25,t);break;
      case "chill":rounded(g,-95,-110,190,211,18,C.blue);line(g,-95,-39,95,-39);rounded(g,66,-96,11,41,5,C.cream);rounded(g,66,-17,11,57,5,C.cream);rounded(g,-72,-23,118,91,5,C.cream,C.line);pastry(g,kind,-12,20,.42);for(let i=0;i<3;i++)spark(g,-137+i*13,-55+i*28,7);break;
      case "shape":case "divide":case "knead":case "tart":tray(g,0,41,295,112);if(mode==="knead"){oval(g,0,32,85,39,C.gold);rounded(g,-69+bob,-34,138,23,9,C.rose);line(g,-95+bob,-23,-69+bob,-23,C.ink,8);line(g,69+bob,-23,95+bob,-23,C.ink,8);}else for(let i=0;i<3;i++){const x=-87+i*87;oval(g,x,36+(i===1?bob:0),29,21,C.gold);if(mode==="tart")oval(g,x,33,19,13,C.cream);}break;
      case "pipe":case "fill":case "decorate":case "brush":pastry(g,kind,0,24,.9);if(mode==="brush"){g.save();g.translate(Math.sin(phase*3)*55,-50);g.rotate(.45);rounded(g,-7,-56,14,60,6,C.sage);rounded(g,-18,0,36,21,5,C.gold);g.restore();}else{piping(g,25+Math.sin(phase*2)*46,-45,.22);oval(g,21+Math.sin(phase*2)*46,-33,7,7,C.cream,null);}break;
      case "roll":case "foldcrepe":tray(g,0,30,282,118);rounded(g,-107,0,190,58,7,kind==="roll"?C.sage:C.gold);rounded(g,-70,15,100,18,7,C.cream,null);rounded(g,-100+ease(t)*110,-4,46,65,17,C.gold);arrow(g,-65,-32,95,-32);break;
      case "layer":case "burger":case "pizza":pastry(g,kind,0,25,1.02);for(let i=0;i<3;i++)oval(g,-32+i*30,-45+ease((t+i*.17)%1)*40,8,5,[C.gold,C.rose,C.sage][i],null);break;
      case "fruit":fruit(g,-90,10,kind==="orange"?"banana":kind==="pinecake"||kind==="pineapple"?"pineapple":kind==="durian"?"durian":"banana");fruit(g,17,-5,kind==="orange"?"orange":kind==="pinecake"?"pineapple":"banana");bowl(g,115,42,46,C.gold);break;
      case "review":rounded(g,-77,-87,154,190,13,C.cream);for(let i=0;i<3;i++){oval(g,-49,-45+i*42,10,10,null,C.brown,2);line(g,-25,-45+i*42,48,-45+i*42,C.line,5);}text(g,"?",0,74,32,C.brown,700,"center");break;
      default:mix();
    }g.restore();
  }
  function model(article,i){const title=article.querySelector("h2").textContent.trim(), intro=article.querySelector("header .lead")?.textContent.trim()||"",steps=[...article.querySelectorAll("ol > li")].map(x=>x.textContent.trim());
    const headings=[...article.querySelectorAll("h3")];const after=label=>headings.find(h=>h.textContent.trim()===label)?.nextElementSibling?.textContent.trim()||"";
    const temperature=after("Nhiệt độ, thời gian"),notes=after("Lưu ý và kiểm tra thành phẩm");
    const [kind,...modes]=boards[i];if(modes.length!==steps.length)throw new Error("Storyboard does not match "+article.id);
    const scenes=[{mode:"intro",title:"Bài thực hành",body:intro,d:5}];
    for(const table of article.querySelectorAll("table")){const heading=table.closest(".table-responsive")?.previousElementSibling?.textContent.trim()||"Nguyên liệu";const rows=[...table.querySelectorAll("tbody tr")].map(r=>[r.cells[0].textContent.trim(),r.cells[1].textContent.trim()]);for(let j=0;j<rows.length;j+=4){const page=rows.slice(j,j+4);scenes.push({mode:"ingredients",title:heading,rows:page,body:"Cân theo bảng. Không tự đổi tỷ lệ khi có ghi chú chưa xác nhận.",d:Math.max(7,page.reduce((n,r)=>n+r.join(" ").split(/\s+/).length,0)*.37)});}}
    steps.forEach((body,j)=>scenes.push({mode:modes[j],title:"Bước "+(j+1)+" · "+titles[modes[j]],body,d:Math.max(6,body.split(/\s+/).length*.37+2)}));
    scenes.push({mode:/chưa|không áp dụng/i.test(temperature)?"review":"finish",title:"Nhiệt độ và thời gian",body:temperature,d:Math.max(7,temperature.split(/\s+/).length*.37+2)});
    scenes.push({mode:/chưa|mâu thuẫn|không tự/i.test(notes)?"review":"finish",title:"Ghi chú cuối bài",body:notes,d:Math.max(8,notes.split(/\s+/).length*.37+2)});
    let time=0;for(const s of scenes){s.start=time;time+=s.d;}return{title,kind,scenes,duration:time,index:i+1};
  }
  function render(g,m,time){const sc=m.scenes.find(s=>time<s.start+s.d)||m.scenes.at(-1),p=clamp((time-sc.start)/sc.d,0,1);g.clearRect(0,0,W,H);g.fillStyle=C.paper;g.fillRect(0,0,W,H);g.lineCap="round";g.lineJoin="round";
    text(g,"BẾP NHỎ  /  GIÁO TRÌNH LÀM BÁNH",32,26,15,C.muted,700);text(g,String(m.index).padStart(2,"0")+" / 31",928,26,15,C.muted,700,"right");
    fit(g,m.title,32,43,896,42,30,22,750);line(g,32,91,928,91,C.line,2);
    rounded(g,32,105,510,274,14,C.cream,C.line,2);stage(g,sc.mode,m.kind,p);
    rounded(g,558,105,370,274,14,"#f4e6d4",C.line,2);
    fit(g,sc.title,579,121,328,66,24,17,750);
    line(g,579,190,907,190,C.line,2);
    if(sc.rows){sc.rows.forEach((r,i)=>{const y=198+i*42;fit(g,r[0],579,y,185,40,16,11,550);fit(g,r[1],770,y,137,40,16,10,700);if(i<sc.rows.length-1)line(g,579,y+42,907,y+42,C.line,1);});}
    else{const nr=m.scenes.indexOf(sc)+1;text(g,"PHÂN CẢNH "+nr+" / "+m.scenes.length,579,216,14,C.muted,700);if(sc.mode==="review")fit(g,"Thông tin cần đối chiếu — xem ghi chú của chương.",579,240,320,100,23,17,700);else{fit(g,sc.mode==="intro"?"Theo dõi từng công đoạn và bảng định lượng.":sc.mode==="finish"?"Xem thông số và lưu ý ngay bên dưới.":"Hình minh họa thao tác · đọc phụ đề để thực hành đúng.",579,239,320,106,22,17,500);}}
    rounded(g,32,394,896,113,12,C.ink,null);fit(g,sc.body,54,405,852,91,23,14,500,C.cream);
    rounded(g,32,520,896,5,2,C.line,null);rounded(g,32,520,Math.max(2,896*time/m.duration),5,2,C.brown,null);
    return sc;
  }
  const fmt=t=>{t=Math.max(0,Math.floor(t));return Math.floor(t/60)+":"+String(t%60).padStart(2,"0");};
  function open(article,i,host,button){
    if(active){active.destroy();active=null;}
    const m=model(article,i),panel=make("div","border border-secondary-subtle p-2 p-md-3 bg-body mt-3");
    const canvas=make("canvas","w-100 d-block border");canvas.width=W;canvas.height=H;canvas.setAttribute("role","img");canvas.setAttribute("aria-label","Hoạt họa 2D: "+m.title);panel.append(canvas);
    const ctx=canvas.getContext("2d");if(!ctx){host.querySelector("[data-video-error]").textContent="Trình duyệt không hỗ trợ Canvas.";return;}
    const toolbar=make("div","d-flex flex-wrap align-items-center gap-2 mt-3");
    const btn=(label)=>{const b=make("button","btn btn-sm btn-outline-dark rounded-0",label);b.type="button";toolbar.append(b);return b;};
    const play=btn("Phát"),prev=btn("Cảnh trước"),next=btn("Cảnh sau"),speed=btn("1×"),restart=btn("Xem lại"),exportBtn=btn("Lưu video"),close=btn("Đóng");
    const range=make("input","form-range mt-3");range.type="range";range.min="0";range.max=m.duration;range.step=".1";range.value="0";range.setAttribute("aria-label","Vị trí phát");
    const clockText=make("span","small text-secondary font-monospace");toolbar.append(clockText);
    const transcript=make("p","small border-start border-3 ps-2 mt-2 mb-2");transcript.setAttribute("aria-live","polite");
    const status=make("p","small text-secondary mb-0","Hoạt họa 2D có phụ đề tiếng Việt, không có âm thanh. Có thể lưu video nếu trình duyệt hỗ trợ ghi Canvas.");status.setAttribute("role","status");
    panel.append(toolbar,range,transcript,status);host.querySelector('[data-video-player]').append(panel);button.textContent="Đóng video 2D";button.setAttribute("aria-expanded","true");
    let time=0,running=false,rate=1,raf=0,last=0,current=null,rec=null,stream=null,exporting=false,destroyed=false;
    const controls=[play,prev,next,speed,restart,range,exportBtn];
    function draw(){const sc=render(ctx,m,time);range.value=time;clockText.textContent=fmt(time)+" / "+fmt(m.duration);if(sc!==current){current=sc;transcript.textContent=sc.title+": "+(sc.rows?sc.rows.map(r=>r.join(": ")).join("; ")+". ":"")+sc.body;}}
    function stop(){running=false;cancelAnimationFrame(raf);play.textContent="Phát";last=0;}
    function tick(now){if(!running||destroyed)return;if(last)time=Math.min(m.duration,time+(now-last)/1000*rate);last=now;draw();if(time>=m.duration){stop();if(rec&&rec.state==="recording")rec.stop();return;}raf=requestAnimationFrame(tick);}
    function start(){if(running)return;if(time>=m.duration)time=0;running=true;last=0;play.textContent="Tạm dừng";raf=requestAnimationFrame(tick);}
    function seek(t){time=clamp(t,0,m.duration);last=0;draw();}
    play.onclick=()=>running?stop():start();
    prev.onclick=()=>{const n=m.scenes.indexOf(current);seek(m.scenes[Math.max(0,n-1)].start);};
    next.onclick=()=>{const n=m.scenes.indexOf(current);seek(m.scenes[Math.min(m.scenes.length-1,n+1)].start);};
    speed.onclick=()=>{rate=rate===1?1.5:rate===1.5?2:1;speed.textContent=rate+"×";};
    restart.onclick=()=>{seek(0);start();};range.oninput=()=>seek(Number(range.value));
    const supported=typeof canvas.captureStream==="function"&&typeof MediaRecorder!=="undefined";
    exportBtn.disabled=!supported;
    if(!supported)exportBtn.title="Trình duyệt chưa hỗ trợ xuất video từ Canvas";
    function cleanupRecording(){stream?.getTracks().forEach(t=>t.stop());stream=null;rec=null;exporting=false;controls.forEach(e=>e.disabled=false);exportBtn.disabled=!supported;}
    exportBtn.onclick=()=>{
      if(!supported||exporting)return;
      stop();rate=1;speed.textContent="1×";seek(0);
      try{stream=canvas.captureStream(24);const mime=["video/webm;codecs=vp9","video/webm;codecs=vp8","video/webm","video/mp4"].find(t=>MediaRecorder.isTypeSupported(t));rec=new MediaRecorder(stream,mime?{mimeType:mime,videoBitsPerSecond:1600000}:undefined);const chunks=[];let failed=false;const recorder=rec;
        recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
        recorder.onerror=()=>{failed=true;stop();status.textContent="Không thể ghi video trong trình duyệt này.";if(recorder.state!=="inactive")recorder.stop();else cleanupRecording();};
        recorder.onstop=()=>{const type=recorder.mimeType||chunks[0]?.type||"video/webm";cleanupRecording();if(destroyed||failed)return;if(!chunks.length){status.textContent="Không có dữ liệu video để lưu.";return;}
          const url=URL.createObjectURL(new Blob(chunks,{type})),a=make("a");a.href=url;a.download=article.id+(type.includes("mp4")?".mp4":".webm");document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);status.textContent="Đã tạo tệp video. Kiểm tra thư mục tải xuống của trình duyệt.";
        };
        exporting=true;controls.forEach(e=>e.disabled=true);status.textContent="Đang ghi video ở tốc độ 1×. Giữ thẻ này mở; bấm Đóng để hủy.";recorder.start(1000);start();
      }catch(e){cleanupRecording();status.textContent="Không thể xuất video: trình duyệt chưa hỗ trợ bộ mã hóa phù hợp.";}
    };
    function destroy(){destroyed=true;stop();if(rec&&rec.state!=="inactive")rec.stop();else if(stream)stream.getTracks().forEach(t=>t.stop());panel.remove();button.textContent="Mở video 2D";button.setAttribute("aria-expanded","false");}
    close.onclick=()=>{destroy();active=null;button.focus();};
    active={article,destroy};draw();
  }
  chapters.forEach((article,i)=>{
    const host=article.querySelector("[data-cake-video]");if(!host||!boards[i])return;
    const button=host.querySelector("button");button.disabled=false;
    button.onclick=()=>{if(active?.article===article){active.destroy();active=null;return;}try{host.querySelector("[data-video-error]").textContent="";open(article,i,host,button);}catch(e){host.querySelector("[data-video-error]").textContent="Không thể mở hoạt họa của chương này.";console.error(e);}};
  });
  // Stop playing a hidden chapter when a search/filter changes.
  const observer=new MutationObserver(()=>{if(active?.article.hidden){active.destroy();active=null;}});
  chapters.forEach(a=>observer.observe(a,{attributes:true,attributeFilter:["hidden"]}));
  document.addEventListener("visibilitychange",()=>{if(document.hidden&&active){active.destroy();active=null;}});
})();