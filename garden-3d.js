// World units match the runner's collision coordinates.
function createGarden(canvas) {
  const renderer = new THREE.WebGLRenderer({canvas, antialias:true});
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xcce8e6);
  const camera = new THREE.OrthographicCamera();
  const sky = new THREE.HemisphereLight(0xfff4dd, 0x75826b, 0.95);
  const sun = new THREE.DirectionalLight(0xffefd0, 2.0);
  sun.position.set(-100, 200, 100);
  scene.add(sky, sun);
  function group(parent) {
    const item = new THREE.Group();
    parent.add(item);
    return item;
  }
  const materials = new Map();
  function mesh(parent, geometry, color, x, y, z) {
    if (!materials.has(color)) materials.set(color, new THREE.MeshStandardMaterial({color, roughness:.83}));
    const item = new THREE.Mesh(geometry, materials.get(color));
    item.position.set(x,y,z);
    parent.add(item);
    return item;
  }
  const cube = new THREE.BoxGeometry();
  function box(parent,x,y,z,w,h,d,color) {
    const item = mesh(parent,cube,color,x,y,z);
    item.scale.set(w,h,d);
    return item;
  }
  const sphere=new THREE.SphereGeometry(1,24,18);
  function oval(parent,x,y,z,rx,ry,rz,color){
    const item=mesh(parent,sphere,color,x,y,z);
    item.scale.set(rx,ry,rz);
    return item;
  }
  function stroke(parent,points,r,color){
    const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
    return mesh(parent,new THREE.TubeGeometry(curve,12,r,7,false),color,0,0,0);
  }
  // Tileable directional grain for fur, wood, straw, and the trail.
  function grain(item,kind,repeatX=1,repeatY=1){
    const tile=document.createElement('canvas');tile.width=tile.height=128;
    const g=tile.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,128,128);
    let seed=937;
    function random(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}
    for(let i=0;i<1900;i++){
      const x=random()*128,y=random()*128;
      g.strokeStyle='rgba(66,42,30,'+(.05+random()*.26)+')';
      const dx=kind==='fur'?9:kind==='straw'?18:2;
      const dy=kind==='bark'?18:kind==='fur'?4:2;
      g.beginPath();g.moveTo(x,y);g.lineTo(x+dx*random(),y+dy*random());g.stroke();
    }
    const texture=new THREE.CanvasTexture(tile);texture.colorSpace=THREE.SRGBColorSpace;
    texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(repeatX,repeatY);
    item.material=item.material.clone();item.material.map=texture;item.material.bumpMap=texture;
    item.material.bumpScale=kind==='bark'?.8:.25;
    return item.material;
  }
  const ground=box(scene,400,-6,-150,6000,10,1600,0x91b96c);
  const road=box(scene,400,-1,0,6000,2,74,0xc9985e);
  grain(ground,'earth',160,36);grain(road,'earth',180,3);
  const scenery=group(scene);
  const landscapes=Array.from({length:4},()=>group(scenery));
  const leaf=new THREE.IcosahedronGeometry(1,1);
  const peak=new THREE.ConeGeometry(1,1,6);
  for(let i=-2;i<25;i++){
    const x=i*96;
    mesh(landscapes[0],leaf,0xbfa45e,x,0,-250).scale.set(120,55,72);
    for(let j=0;j<3;j++){
      const stalk=box(landscapes[0],x+j*6,9,-51,2,18,2,0xc99848);
      stalk.rotation.z=(j-1)*.2;
    }
    mesh(landscapes[1],new THREE.CylinderGeometry(4,7,49,9),0x785034,x,24,-110);
    mesh(landscapes[1],peak,0x315c45,x,61,-110).scale.set(36,88,36);
    mesh(landscapes[1],peak,0x47815b,x+42,38,-190).scale.set(49,76,49);
    for(let k=0;k<4;k++){
      const angle=k*1.65+i;
      oval(landscapes[1],x+Math.cos(angle)*18,48+k*6,-110+Math.sin(angle)*15,22,19,22,k%2?0x47794b:0x386843);
      oval(landscapes[0],x+k*6,16+k%2*2,-51,1.8,4.2,1.6,0xdcb65f).rotation.z=-.3;
    }
    const summit=72+18*Math.cos(i);
    mesh(landscapes[2],peak,0x85acbd,x,summit/2,-220).scale.set(85,summit,70);
    mesh(landscapes[2],peak,0xe4f6fc,x,summit*.83,-220).scale.set(30,summit*.35,25);
    mesh(landscapes[3],peak,0x623f42,x,38,-210).scale.set(86,76,72);
    box(landscapes[3],x,1,-67,75,2,7,0xff793a).rotation.y=.25;
  }
  const robot=group(scene);
  const preview=new THREE.Sprite(new THREE.SpriteMaterial({
    map:new THREE.TextureLoader().load('robot.png',()=>renderer.render(scene,camera)),transparent:true
  }));
  preview.scale.set(59,59,1);preview.position.y=27;robot.add(preview);
  async function loadRobot(){
    const response=await fetch('robot.bin');
    if(!response.ok)throw new Error('Robot mesh unavailable');
    const data=await response.arrayBuffer();
    const [count,...groups]=new Uint32Array(data,0,4);
    const positions=Float32Array.from(new Int16Array(data,16,count*3),v=>v/100);
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
    geometry.setIndex(new THREE.BufferAttribute(new Uint16Array(data,16+count*6),1));
    geometry.computeVertexNormals();
    let offset=0;
    groups.forEach((size,index)=>{geometry.addGroup(offset,size,index);offset+=size});
    const finishes=[0xc99540,0x737976,0x434644].map(color=>new THREE.MeshStandardMaterial({color,roughness:.68,metalness:.16}));
    robot.add(new THREE.Mesh(geometry,finishes));preview.visible=false;
    renderer.render(scene,camera);
  }
  loadRobot().catch(()=>{preview.visible=true});
  const obstacle=group(scene);
  const [hay,stump,ice,lava]=Array.from({length:4},()=>group(obstacle));
  const models=[hay,stump,ice,lava];
  const bale=mesh(hay,new THREE.CylinderGeometry(15,15,26,40),0xe0ac4e,0,15,0);
  bale.rotation.z=Math.PI/2;grain(bale,'straw',4,2);
  for(const x of [-8,8])mesh(hay,new THREE.TorusGeometry(15.2,.85,8,44),0x966d38,x,15,0).rotation.y=Math.PI/2;
  for(let r=3;r<15;r+=2.4)mesh(hay,new THREE.TorusGeometry(r,.35,6,36),0xc39348,13.2,15,0).rotation.y=Math.PI/2;
  grain(mesh(stump,new THREE.CylinderGeometry(11,15,31,28),0x825333,0,15.5,0),'bark',3,1);
  mesh(stump,new THREE.CylinderGeometry(10.8,11,.8,32),0xd5a16a,0,31.3,0);
  for(let r=2;r<10;r+=2)mesh(stump,new THREE.TorusGeometry(r,.25,5,32),0xa37951,0,31.8,0).rotation.x=Math.PI/2;
  for(let i=0;i<7;i++){const a=i*.898;oval(stump,11*Math.cos(a),4,11*Math.sin(a),5,6,4,0x795036)}
  for(let i=0;i<6;i++){
    const a=i*2.4,h=i===0?32:14+i*2;
    const gem=mesh(ice,new THREE.CylinderGeometry(1,5,h,5),i%2?0xa5e7fa:0x53b6da,Math.sin(a)*8,h/2,Math.cos(a)*6);
    gem.rotation.z=Math.sin(a)*.23;gem.material.roughness=.17;
  }
  mesh(lava,leaf,0xae492b,0,14,0).scale.set(15,17,14);
  for(let i=0;i<18;i++){
    const y=1-2*(i+.5)/18,a=i*2.4,r=Math.sqrt(1-y*y);
    mesh(lava,leaf,i%2?0x463739:0x593e3c,11*r*Math.cos(a),15+y*12,10*r*Math.sin(a)).scale.set(7,6,7);
  }
  stroke(lava,[[-9,21,9],[-4,18,14],[-5,13,15],[1,9,14],[4,5,12]],.8,0xff9b42);
  let activeLevel=-1;
  const shadowGeometry=new THREE.PlaneGeometry(2,2);
  const contact=document.createElement('canvas');contact.width=contact.height=64;
  const pen=contact.getContext('2d'),fade=pen.createRadialGradient(32,32,1,32,32,32);
  fade.addColorStop(0,'rgba(47,29,20,.55)');fade.addColorStop(1,'rgba(47,29,20,0)');
  pen.fillStyle=fade;pen.fillRect(0,0,64,64);
  const shadowMat=new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(contact),transparent:true,depthWrite:false});
  function shadow(){
    const s=mesh(scene,shadowGeometry,0xa17d53,0,.2,0);
    s.material=shadowMat;s.rotation.x=-Math.PI/2;return s;
  }
  const catShadow=shadow(), barrelShadow=shadow();
  barrelShadow.scale.set(17,14,1);
  const blast=group(scene);
  oval(blast,0,0,0,.5,4,4,0x48d9ef);
  oval(blast,0,0,2,.5,1.8,2.6,0xf3ffff);
  return {
    resize(w,h,worldWidth){
      const span=worldWidth*1.08;
      const center=worldWidth/2;
      camera.left=-span/2;camera.right=span/2;
      camera.top=span*h/w/2;camera.bottom=-camera.top;
      camera.near=1;camera.far=4500;
      camera.position.set(center+95,258,540);
      camera.lookAt(center,57,0);camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
      renderer.setSize(w,h,false);
    },
    draw({x,lift,distance,mode,width,beamTime,beamY,level,stage}){
      if(activeLevel!==level){
        activeLevel=level;
        landscapes.forEach((g,i)=>g.visible=i===level);
        models.forEach((g,i)=>g.visible=i===level);
        scene.background.set(stage.sky);
        ground.material.color.set(stage.land);
        road.material.color.set(['#c89e66','#a48461','#c6ddee','#79615c'][level]);
      }
      robot.position.set(60,lift,0);
      robot.rotation.z=lift?.06:(mode==='run'?Math.sin(distance*.16)*.014:0);
      catShadow.position.x=60;catShadow.scale.set(19-lift*.08,9-lift*.04,1);
      obstacle.position.x=x+14;barrelShadow.position.x=x+14;
      scenery.position.x=-(distance%192);
      blast.visible=beamTime>0;
      if(blast.visible){
        blast.position.set((width+84)/2,164-beamY,0);
        blast.scale.x=Math.max(1,width-84);
      }
      renderer.render(scene,camera);
    }
  };
}
