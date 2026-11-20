// World units match the runner's collision coordinates.
function createGarden(canvas) {
  const renderer = new THREE.WebGLRenderer({canvas, antialias:true});
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xcce8e6);
  scene.fog = new THREE.FogExp2(0xcce8e6, .0015);
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
  box(scene,400,-6,-150,6000,10,1600,0x91b96c);
  box(scene,400,-1,0,6000,2,74,0xc9985e);
  const scenery = group(scene);
  const leaf = new THREE.IcosahedronGeometry(1,0);
  for(let i=-2;i<24;i++){
    const x=i*96;
    box(scenery,x,11,-55,5,22,5,0xc3ad80);
    box(scenery,x+48,15,-55,96,4,3,0xdaca9b);
    if(i%2===0){
      box(scenery,x,26,-115,11,52,11,0x88633f);
      mesh(scenery,leaf,0x55854f,x,67,-115).scale.set(41,53,35);
      mesh(scenery,leaf,0x77a85b,x+24,53,-113).scale.set(25,34,26);
    }
    mesh(scenery,leaf,0x80a783,x+30,0,-340).scale.set(115,90+20*Math.cos(i),80);
    for(let j=0;j<3;j++) box(scenery,x+j*21,1,21-j*17,4,1,2,0xb68557);
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
  const barrel=group(scene);
  const profile=[[0,0],[11,0],[13,4],[15,15],[14,25],[11,32],[0,32]];
  mesh(barrel,new THREE.LatheGeometry(profile.map(([r,y])=>new THREE.Vector2(r,y)),14),0xad713a,0,0,0);
  for(const [y,r] of [[6,14.3],[25,14.4]]){
    mesh(barrel,new THREE.CylinderGeometry(r,r,3,14),0x535e58,0,y,0);
  }
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
    draw({x,lift,distance,mode,width,beamTime,beamY}){
      cat.position.set(60,lift,0);
      legs.forEach((leg,i)=>leg.rotation.z=lift?.35:(mode==='run'?Math.sin(distance*.12+i*Math.PI/2)*.48:0));
      catShadow.position.x=60;catShadow.scale.set(19-lift*.08,9-lift*.04,1);
      barrel.position.x=x+14;barrelShadow.position.x=x+14;
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
