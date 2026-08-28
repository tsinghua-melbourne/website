(() => {
  'use strict';
  const canvas=document.querySelector('#scene'),ctx=canvas.getContext('2d',{alpha:false});
  const title=document.querySelector('#title'),status=document.querySelector('#status'),progressBar=document.querySelector('#progressBar'),percent=document.querySelector('#percent');
  const logo=document.querySelector('#qrSource');
  const baseBadge=new Image();baseBadge.src='assets/tree-base-logo.png';
  const QR=[
    '1111111001000100001110100011101111111','1000001010100111101111100110101000001','1011101001000111100101101000101011101','1011101000110010100011000011001011101','1011101001100000110001111111101011101','1000001010010010010000101010101000001','1111111010101010101010101010101111111','0000000010111001111101011000000000000','0000111100111100001110111011101100010','1111110010111011001100111111011011000','0010111100110111010101101111010010010','1001100000110100011110011011110100111','1011111011101001110110010001001000001','0110010110001001110011110011110010100','0001111110100001001110111111010001100','1100100101001110111011010011000100110','0111001000000010110001011001011001100','1101100011110110100111000011110010100','1001111110101011001000011001110010100','1011000011011001010100011000000110101','0111011110110100010001110101011000100','0011000100011110010010110011001011110','1010101001100100000100110011011000000','0111000010111011011101110010010101101','1101101010100111110001111001101011100','1001110010100001110110100111010011110','0011011010000111001111100011011011000','0010000010001110111000101011011000101','1101111001111000111010111000111111110','0000000011000100001000110010100011010','1111111011011111110111011010101011100','1000001011011001111001100010100010100','1011101010100010010010101010111111100','1011101001001111000110001111101011100','1011101001010111011001010011111101010','1000001001001110001110000011010001110','1111111001011011110110011000011100111'
  ].map(r=>[...r].map(Number));
  const N=QR.length,C=(N-1)/2,reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
  let w=0,h=0,dpr=1,progress=0,targetProgress=0,externalProgress=null,raf=0,time=0,lastPercent=-1,timeBase=0,pausedAt=0;
  const clamp=v=>Math.max(0,Math.min(1,v)),smooth=v=>v*v*(3-2*v),ease=v=>1-Math.pow(1-v,3);
  const rand=n=>{const x=Math.sin(n*127.17+31.7)*43758.5453;return x-Math.floor(x)};
  const hex=(a,b,p)=>{const A=a.match(/\w\w/g).map(x=>parseInt(x,16)),B=b.match(/\w\w/g).map(x=>parseInt(x,16));return '#'+A.map((v,i)=>Math.round(v+(B[i]-v)*p).toString(16).padStart(2,'0')).join('')};
  const sceneSize=()=>w<=620?Math.min(370,h*.53,w*.82):Math.min(430,h*.61,w*.70);

  function resize(){dpr=Math.min(devicePixelRatio||1,2);w=innerWidth;h=innerHeight;canvas.width=w*dpr;canvas.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0)}
  addEventListener('resize',resize);resize();
  addEventListener('message',event=>{if(event.data&&event.data.type==='tuaam-qr-tree-progress'){const value=Number(event.data.progress);if(Number.isFinite(value))externalProgress=clamp(value)}});

  const leaves=[];let li=0;
  for(let row=0;row<N;row++)for(let col=0;col<N;col++)if(QR[row][col]){
    const id=li++,u=rand(id*11+2),a=id*2.399963+rand(id*3)*.22,r=Math.sqrt(u)*(13.8-u*2.2);
    leaves.push({id,row,col,fx:col-C,fy:row-C,tx:Math.cos(a)*r,ty:Math.sin(a)*r,tz:14+(1-u)*27+rand(id*7+5)*9,delay:rand(id*13+9)*.22});
  }
  const grasses=Array.from({length:440},(_,id)=>{const corner=id%4,sx=corner%2?1:-1,sy=corner>1?1:-1;return{id,x:sx*(C-.7-rand(id*7)*6.8),y:sy*(C-.7-rand(id*17)*6.8),height:3+rand(id*5)*5.4,delay:rand(id*23)*.22,color:id%8===0?'#ff4f9a':id%5===0?'#a6ef42':id%3===0?'#3bd45b':'#62e36c'}});

  function geometry(p){
    const tilt=smooth(clamp((p-.035)/.22)),tree=smooth(clamp((p-.1)/.45)),grass=smooth(clamp((p-.18)/.34));
    return{tilt,tree,grass};
  }
  function project(x,y,z,tilt){
    const qrSize=sceneSize(),flatScale=qrSize/45,isoScale=Math.min(w/720,h/690,1.08);
    const flatX=w/2+x*flatScale,flatY=h*.44+y*flatScale;
    const isoX=w/2+(x-y)*7.15*isoScale,isoY=Math.min(h*.53,375)+(x+y)*3.58*isoScale-z*4.55*isoScale;
    return[flatX+(isoX-flatX)*tilt,flatY+(isoY-flatY)*tilt];
  }
  function poly(points,color,alpha=1){ctx.globalAlpha=alpha;ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(...points[0]);points.slice(1).forEach(p=>ctx.lineTo(...p));ctx.closePath();ctx.fill()}
  function tile(x,y,z,color,alpha,tilt,size=.94,depth=0){
    const s=size/2,p=[project(x-s,y-s,z,tilt),project(x+s,y-s,z,tilt),project(x+s,y+s,z,tilt),project(x-s,y+s,z,tilt)];
    if(depth&&tilt>.08){const d=depth;const p2=[project(x+s,y+s,z-d,tilt),project(x-s,y+s,z-d,tilt)];poly([p[3],p[2],p2[0],p2[1]],hex(color,'#2b0a3d',.35),alpha*.78)}
    poly(p,color,alpha);
  }
  function branch(x1,y1,z1,x2,y2,z2,width,alpha,tilt,color='#65402f'){const a=project(x1,y1,z1,tilt),b=project(x2,y2,z2,tilt);ctx.globalAlpha=alpha;ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.stroke()}
  function drawGrass(g,amount,tilt){const local=smooth(clamp((amount-g.delay)/(1-g.delay))),a=project(g.x,g.y,0,tilt),wind=Math.sin(time*1.7+g.id)*.22,b=project(g.x+wind,g.y,g.height*local,tilt);ctx.globalAlpha=.96*local;ctx.strokeStyle=g.color;ctx.lineWidth=1+rand(g.id)*.75;ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.stroke();if(g.id%11===0&&local>.48)bauhinia(g.x+wind,g.y,g.height*local,g.id%22?'#8f6998':'#a17aaa',local,tilt,g.id+5000,.47)}
  function drawBadge(tilt){if(!baseBadge.complete)return;const o=project(0,0,.16,tilt),ex=project(1,0,.16,tilt),ey=project(0,1,.16,tilt),units=10.4+tilt*1.4;ctx.save();ctx.globalAlpha=1;ctx.shadowColor='rgba(43,10,61,.18)';ctx.shadowBlur=9*tilt;ctx.translate(o[0],o[1]);ctx.transform(ex[0]-o[0],ex[1]-o[1],ey[0]-o[0],ey[1]-o[1],0,0);ctx.scale(units/baseBadge.width,units/baseBadge.height);ctx.drawImage(baseBadge,-baseBadge.width/2,-baseBadge.height/2);ctx.restore()}
  function bauhinia(x,y,z,color,alpha,tilt,id,scale=1){const p=project(x,y,z,tilt),s=(5.3+rand(id*5)*3.2)*scale,rot=Math.sin(id*2.31)*1.2+Math.sin(time*.7+id)*.08;ctx.save();ctx.translate(p[0],p[1]);ctx.rotate(rot);ctx.globalAlpha=alpha;ctx.fillStyle=color;ctx.strokeStyle=hex(color,'#ffffff',.38);ctx.lineWidth=.55;ctx.beginPath();ctx.moveTo(0,s*.62);ctx.bezierCurveTo(-s*.35,s*.38,-s*1.18,s*.05,-s*1.03,-s*.67);ctx.bezierCurveTo(-s*.93,-s*1.18,-s*.27,-s*1.2,-s*.06,-s*.35);ctx.bezierCurveTo(0,-s*.2,0,-s*.2,s*.06,-s*.35);ctx.bezierCurveTo(s*.27,-s*1.2,s*.93,-s*1.18,s*1.03,-s*.67);ctx.bezierCurveTo(s*1.18,s*.05,s*.35,s*.38,0,s*.62);ctx.closePath();ctx.fill();ctx.stroke();ctx.globalAlpha=alpha*.4;ctx.strokeStyle='#d4af6a';ctx.lineWidth=.45;ctx.beginPath();ctx.moveTo(0,s*.5);ctx.lineTo(-s*.06,-s*.34);ctx.moveTo(0,s*.12);ctx.lineTo(-s*.67,-s*.56);ctx.moveTo(0,s*.12);ctx.lineTo(s*.67,-s*.56);ctx.stroke();ctx.restore()}
  function drawTrunk(g){
    if(g.tree<=0)return;const height=41*g.tree;
    for(let i=0;i<17;i++){const z=i*2.45*g.tree,x=Math.sin(i*.68)*.42*g.tree,y=Math.cos(i*.61)*.28*g.tree,nx=Math.sin((i+1)*.68)*.42*g.tree,ny=Math.cos((i+1)*.61)*.28*g.tree,nz=Math.min(height,(i+1)*2.65*g.tree),outer=17-i*.65;branch(x,y,z,nx,ny,nz,outer,.98,g.tilt,'#503126');branch(x,y,z,nx,ny,nz,outer*.56,.92,g.tilt,i%3?'#76513a':'#8b6244')}
    for(let i=0;i<13;i++){const z=(9+i*2.18)*g.tree,a=i*2.399,r=(8.8-i*.22)*g.tree,mid=.58,ex=Math.cos(a)*r,ey=Math.sin(a)*r,ez=(z/g.tree+8.2-i*.16)*g.tree,mx=ex*mid,my=ey*mid,mz=z+(ez-z)*mid,wid=6.2-i*.18;branch(0,0,z,mx,my,mz,wid,.95,g.tilt,'#5a382a');branch(mx,my,mz,ex,ey,ez,wid*.62,.88,g.tilt,'#76513a');for(const side of [-1,1]){const ca=a+side*(.48+rand(i*9)*.22),cr=r*(.38+rand(i*4)*.13),sx=mx,sy=my,sz=mz,tx=mx+Math.cos(ca)*cr,ty=my+Math.sin(ca)*cr,tz=mz+(3.1+rand(i*8)*2.3)*g.tree;branch(sx,sy,sz,tx,ty,tz,wid*.38,.78,g.tilt,'#82583e')}}
  }
  function drawFrontTrunk(g){if(g.tree<.72)return;const a=smooth(clamp((g.tree-.72)/.28));for(let i=0;i<6;i++){const angle=i*Math.PI/3+.25;branch(0,0,5.8,Math.cos(angle)*2.7,Math.sin(angle)*2.7,.35,7.2,a*.9,g.tilt,i%2?'#5a382a':'#684331')}branch(.15,-.1,.7,.3,-.1,13,13.5,a*.96,g.tilt,'#503126');branch(.3,-.1,13,-4.8,-.7,22,5.2,a*.9,g.tilt,'#684331');branch(.3,-.1,14,5,.5,24,5.1,a*.9,g.tilt,'#684331')}
  function leafProgress(l,p){return smooth(clamp((p-.11-l.delay)/(.61-l.delay)))}

  function updateNarrative(){
    const maxScroll=Math.max(1,document.documentElement.scrollHeight-innerHeight);targetProgress=externalProgress===null?clamp(scrollY/maxScroll):externalProgress;progress=reduced?targetProgress:progress+(targetProgress-progress)*.115;
    const qrFade=smooth(clamp(progress/.115));logo.style.opacity=String(1-qrFade);logo.style.transform=`translate(-50%,-50%) scale(${1-progress*.07})`;
    const pc=Math.round(targetProgress*100);if(pc!==lastPercent){lastPercent=pc;percent.textContent=pc+'%';progressBar.style.transform=`scaleX(${targetProgress})`;if(pc<8){title.textContent='A transparent QR waiting to bloom';status.textContent='Scroll down to transform every purple module.'}else if(pc<70){title.textContent='QR blocks are becoming the tree';status.textContent='Scroll controls the platform, trunk, grass, and canopy.'}else{title.textContent='The TUAAM purple spring tree';status.textContent='Scroll back up to reconstruct the QR code.'}}
  }

  function render(now){
    time=(now-timeBase)/1000;updateNarrative();
    const bg='#ffffff';ctx.globalAlpha=1;ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
    const g=geometry(progress),baseA=bg,baseB=hex(bg,'#2b0a3d',.035),platformAlpha=smooth(clamp((progress-.025)/.2)),canvasModules=smooth(clamp((progress-.025)/.085));

    // The pale platform remains as the QR modules leave it.
    if(platformAlpha>0)for(let row=0;row<N;row++)for(let col=0;col<N;col++)tile(col-C,row-C,0,(row+col)%3?baseA:baseB,platformAlpha,g.tilt,.99,g.tilt*.34);
    // A translucent copy of the QR remains embedded in the ground as its shadow.
    if(platformAlpha>0)for(let row=0;row<N;row++)for(let col=0;col<N;col++)if(QR[row][col])tile(col-C,row-C,.02,'#743481',platformAlpha*(.14+.12*g.tilt),g.tilt,.86,0);
    if(g.tilt>.08)for(const grass of grasses)drawGrass(grass,g.grass,g.tilt);
    drawBadge(g.tilt);
    if(g.tilt>.08)drawTrunk(g);

    // Every dark QR module has one fixed destination in the blossom canopy.
    const moving=leaves.map(l=>{
      const q=leafProgress(l,progress),arc=Math.sin(Math.PI*q)*10,flutter=Math.sin(time*1.8+l.id)*.16*q;
      const x=l.fx+(l.tx-l.fx)*ease(q)+flutter,y=l.fy+(l.ty-l.fy)*ease(q),z=l.tz*ease(q)+arc;
      return{...l,q,x,y,z,sy:project(x,y,z,g.tilt)[1]};
    }).sort((a,b)=>a.sy-b.sy);
    for(const l of moving){const purple=l.id%8===0?'#743481':l.id%5===0?'#660874':'#2b0a3d',soft=l.id%8===0?'#a17aaa':l.id%5===0?'#8f6998':'#76527f',leafMix=smooth(clamp((l.q-.4)/.38));if(leafMix<1&&canvasModules>0)tile(l.x,l.y,l.z,purple,.97*(1-leafMix)*canvasModules,g.tilt,.98,.38*l.q);if(leafMix>0)bauhinia(l.x,l.y,l.z,soft,.9*leafMix,g.tilt,l.id)}
    drawFrontTrunk(g);

    // Loose spring petals continue after the fixed transformation settles.
    if(progress>.55)for(let i=0;i<34;i++){const life=(time*.075+rand(i*19))%1,x=(rand(i*7)-.5)*31+Math.sin(time+i)*1.5,y=(rand(i*11)-.5)*26,z=43-life*44;bauhinia(x,y,z,i%5?'#a17aaa':'#8f6998',(1-life)*.34,g.tilt,i+900)}
    ctx.globalAlpha=1;raf=requestAnimationFrame(render);
  }

  document.addEventListener('visibilitychange',()=>{if(document.hidden){pausedAt=performance.now();cancelAnimationFrame(raf)}else if(pausedAt){timeBase+=performance.now()-pausedAt;pausedAt=0;raf=requestAnimationFrame(render)}});
  raf=requestAnimationFrame(render);
})();
