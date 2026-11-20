// A separate stage canvas also works when the runner uses its 2D renderer.
function createEncore(stage, soundButton){
  const g=stage.getContext('2d');
  const music=new Audio('encore.mp3');
  music.loop=true;
  let animation=0, session=0;
  function label(){soundButton.textContent=music.paused?'Play music':'Mute music'}
  music.addEventListener('playing',label);
  music.addEventListener('pause',label);
  function play(){music.play().catch(label)}
  soundButton.onclick=()=>music.paused?play():music.pause();
  function rect(x,y,w,h,color){g.fillStyle=color;g.fillRect(x,y,w,h)}
  function oval(x,y,rx,ry,color){
    const light=g.createRadialGradient(x-rx*.28,y-ry*.35,0,x,y,Math.max(rx,ry)*1.15);
    light.addColorStop(0,color);light.addColorStop(.72,color);light.addColorStop(1,'#322036');
    g.fillStyle=light;g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.fill();
  }
  function shape(points,color){
    g.fillStyle=color;g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fill();
  }
  function draw(now){
    const bounds=stage.getBoundingClientRect(),ratio=Math.min(devicePixelRatio||1,2);
    const w=Math.max(1,Math.round(bounds.width*ratio)),h=Math.max(1,Math.round(bounds.height*ratio));
    if(stage.width!==w||stage.height!==h){stage.width=w;stage.height=h}
    const scale=h/240,W=w/scale,t=now/1000,beat=t*Math.PI*5;
    g.setTransform(scale,0,0,scale,0,0);
    rect(0,0,W,240,'#191129');rect(0,170,W,20,'#412749');
    for(let i=0;i<8;i++){
      const x=(i+.5)*W/8,aim=x+80*Math.sin(t*1.3+i);
      const color=['#21d9d5','#ffb746','#fc488c'][i%3];
      g.globalAlpha=.19;shape([[x-4,9],[x+4,9],[aim+44,174],[aim-44,174]],color);g.globalAlpha=1;
      rect(x-7,3,14,8,color);
    }
    for(const side of [-1,1]){
      const x=W/2+side*Math.min(W*.35,170);
      rect(x-20,97,40,74,'#67516e');rect(x-18,99,36,70,'#191726');
      for(const y of [117,149]){oval(x,y,14,14,'#504359');oval(x,y,7,7,'#211d31')}
    }
    g.save();g.translate(W/2,156+3*Math.sin(beat));
    const fur='#ec8b41';
    oval(0,-14,24,34,fur);oval(-13,9,13,7,'#ffe0a4');oval(14,9,13,7,'#ffe0a4');
    shape([[-26,-61],[-22,-100],[-2,-76]],fur);shape([[4,-76],[25,-100],[27,-61]],fur);
    oval(0,-65,29,23,fur);rect(-24,-67,48,7,'#292036');
    for(const x of [-13,12])oval(x,-64,10,7,'#30203f');
    oval(0,-53,4,3,'#9b554d');
    for(const side of [-1,1]){
      shape([[side*23,-88],[side*20,-76],[side*10,-78]],'#dd9990');
      oval(side*7,-51,8,5,'#ffd6a0');
      for(let j=0;j<3;j++)shape([[side*12,-53+j*2],[side*33,-56+j*4],[side*13,-52+j*2]],'#e9b98b');
    }
    g.rotate(-.42);oval(-5,-10,19,15,'#ec3675');oval(7,-10,13,11,'#ec3675');
    rect(6,-14,44,6,'#f8bf78');rect(48,-16,12,9,'#f7dfab');
    for(let j=0;j<10;j++)rect(10+j*3.7,-14,.55,6,'#805344');
    for(let j=0;j<3;j++)oval(50+j*3,-18,1.5,2.4,'#c2bac9');
    rect(-9,-15,2,9,'#30243a');rect(-2,-15,2,9,'#30243a');
    for(let j=0;j<3;j++)rect(-7,-12+j*2,58,.7,'#ffedce');
    oval(26,-13,6,5,fur);oval(-7,-14+5*Math.sin(beat*2),7,5,'#ffd59b');g.restore();
    for(let row=0;row<5;row++){
      const gap=8+row*2.5;
      for(let x=-gap;x<W+gap;x+=gap){
        const phase=x*.32+row*2,y=179+row*12+Math.sin(beat+phase)*(row+1);
        const color=['#8b557f','#77466e','#5a365d','#422947','#271c35'][row];
        oval(x+row*2,y,3+row*.7,4+row*.8,color);
        oval(x+row*2,y+10,5+row,9,color);
        if(Math.cos(phase)>.15)shape([[x,y+12],[x-6-row,y-5-row],[x-3-row,y-6-row],[x+4,y+8]],color);
      }
    }
    animation=requestAnimationFrame(draw);
  }
  return {
    unlock(){// Resume the same media element during the user's start gesture.
      const id=++session;music.volume=0;
      music.play().then(()=>{if(id===session){music.pause();music.currentTime=0}}).catch(()=>{});
    },
    start(){session++;stage.hidden=false;soundButton.hidden=false;music.currentTime=0;music.volume=.75;play();draw(performance.now())},
    stop(){session++;cancelAnimationFrame(animation);music.pause();stage.hidden=true;soundButton.hidden=true}
  };
}
