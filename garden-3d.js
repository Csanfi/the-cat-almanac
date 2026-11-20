// World units match the runner's collision coordinates.
function createGarden(canvas) {
  const renderer = new THREE.WebGLRenderer({canvas, antialias:true});
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xcce8e6);
  const camera = new THREE.OrthographicCamera();
  const sky = new THREE.HemisphereLight(0xfff6d8, 0x80967b, 2.1);
  const sun = new THREE.DirectionalLight(0xffe7bc, 2.5);
  sun.position.set(-100, 200, 100);
  scene.add(sky, sun);
  function group(parent) {
    const item = new THREE.Group();
    parent.add(item);
    return item;
  }
  const materials = new Map();
  function mesh(parent, geometry, color, x, y, z) {
    if (!materials.has(color)) materials.set(color, new THREE.MeshStandardMaterial({color, flatShading:true}));
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
  const ground=box(scene,400,-6,-150,6000,10,1600,0x91b96c);
  const road=box(scene,400,-1,0,6000,2,74,0xc9985e);
  const scenery=group(scene);
  const landscapes=Array.from({length:4},()=>group(scenery));
  const leaf=new THREE.IcosahedronGeometry(1,0);
  const peak=new THREE.ConeGeometry(1,1,6);
  for(let i=-2;i<25;i++){
    const x=i*96;
    mesh(landscapes[0],leaf,0xbfa45e,x,0,-250).scale.set(120,55,72);
    for(let j=0;j<3;j++){
      const stalk=box(landscapes[0],x+j*6,9,-51,2,18,2,0xc99848);
      stalk.rotation.z=(j-1)*.2;
    }
    box(landscapes[1],x,24,-110,10,48,10,0x785034);
    mesh(landscapes[1],peak,0x315c45,x,61,-110).scale.set(36,88,36);
    mesh(landscapes[1],peak,0x47815b,x+42,38,-190).scale.set(49,76,49);
    const summit=72+18*Math.cos(i);
    mesh(landscapes[2],peak,0x85acbd,x,summit/2,-220).scale.set(85,summit,70);
    mesh(landscapes[2],peak,0xe4f6fc,x,summit*.83,-220).scale.set(30,summit*.35,25);
    mesh(landscapes[3],peak,0x623f42,x,38,-210).scale.set(86,76,72);
    box(landscapes[3],x,1,-67,75,2,7,0xff793a).rotation.y=.25;
  }
  const cat=group(scene), fur=0xdc803e, cream=0xffdfaa;
  box(cat,0,16,0,29,16,15,fur);
  box(cat,14,27,0,18,18,19,fur);
  for(const z of [-6,6]){
    const ear=mesh(cat,new THREE.ConeGeometry(5,10,4),fur,12,39,z);
    ear.rotation.y=Math.PI/4;
    box(cat,22,30,z*1.45,3,4,2,0x293d32);
    box(cat,23,24,z*.58,5,5,7,cream);
    for(const x of [-6,3]) box(cat,x,19,z*1.25,3,8,1,0x99582d);
  }
  box(cat,26,26,0,3,3,4,0xaf7466);
  const tail=box(cat,-19,22,0,7,20,7,fur);
  tail.rotation.z=.45;
  const legs=[];
  for(const x of [-9,9]) for(const z of [-5,5]){
    const leg=group(cat);leg.position.set(x,12,z);
    box(leg,0,-5,0,6,10,5,fur);box(leg,1,-10,0,8,4,6,cream);legs.push(leg);
  }
  const obstacle=group(scene);
  const [hay,stump,ice,lava]=Array.from({length:4},()=>group(obstacle));
  const models=[hay,stump,ice,lava];
  box(hay,0,16,0,28,32,27,0xe0ac4e);
  for(const x of [-8,8])box(hay,x,16,0,2,33,28,0x98743b);
  mesh(stump,new THREE.CylinderGeometry(11,15,32,9),0x804f35,0,16,0);
  mesh(stump,new THREE.CylinderGeometry(10,10,1,9),0xc49865,0,32,0);
  mesh(ice,peak,0x74cee8,-3,16,0).scale.set(11,32,13);
  mesh(ice,peak,0xacdfed,7,10,2).scale.set(8,20,9);
  mesh(lava,leaf,0x684143,0,15,0).scale.set(16,18,15);
  box(lava,0,17,12,3,15,2,0xff8539).rotation.z=.35;
  let activeLevel=-1;
  const shadowGeometry=new THREE.CircleGeometry(1,20);
  function shadow(){
    const s=mesh(scene,shadowGeometry,0xa17d53,0,.2,0);
    s.rotation.x=-Math.PI/2;return s;
  }
  const catShadow=shadow(), barrelShadow=shadow();
  barrelShadow.scale.set(17,14,1);
  const blast=group(scene);
  box(blast,0,0,0,1,7,7,0x48d9ef);
  box(blast,0,0,3.4,1,3,2,0xf3ffff);
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
      cat.position.set(60,lift,0);
      legs.forEach((leg,i)=>leg.rotation.z=lift?.35:(mode==='run'?Math.sin(distance*.12+i*Math.PI/2)*.48:0));
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
