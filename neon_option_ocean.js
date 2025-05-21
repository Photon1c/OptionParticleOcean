// Neon Option Ocean Visualizer (Three.js version, browser global style, local three.js)
// This file assumes THREE, THREE.OrbitControls, and dat.GUI are loaded via <script> tags in the HTML
// No import/export/module syntax is used.

let scene, camera, renderer, controls, gui;
let spheres = [];
let params = {
  metric: 'Ask', // Dropdown for Y axis
  showCalls: true,
  showPuts: true,
  glow: 1.0,
  waveSpeed: 1.0,
  particleAlpha: 0.7,
  color1: '#00ffff',
  color2: '#ff50b4',
};
let optionData = [];
let expirations = [];
let strikes = [];
let metricOptions = ['Ask','Ask.1','IV','IV.1','Volume','Volume.1','Delta','Delta.1','Gamma','Gamma.1'];
let header = [];
let tooltipDiv;
let uploadInput;
let hoverInfo = null;
let moveState = {
  forward: false, back: false, left: false, right: false,
  up: false, down: false, lookLeft: false, lookRight: false,
  speedBoost: false
};
let moveSpeed = 1.5;
let lookSpeed = 0.025;
let titleDiv;
let instructionsDiv;
let instructionsHintDiv;
let instructionsVisible = false;

init();

function init() {
  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x101428);

  // Camera
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 80, 180);

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  document.body.appendChild(renderer.domElement);

  // Orbit Controls
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 40;
  controls.maxDistance = 600;

  // Lights
  const ambient = new THREE.AmbientLight(0xffffff, 0.2);
  scene.add(ambient);
  const point = new THREE.PointLight(0xffffff, 1, 0, 2);
  point.position.set(0, 200, 200);
  scene.add(point);

  // GUI
  gui = new dat.GUI();
  gui.add(params, 'metric', metricOptions).name('Y Axis Metric').onChange(addNeonSpheresGrid);
  gui.add(params, 'showCalls').name('Show Calls').onChange(addNeonSpheresGrid);
  gui.add(params, 'showPuts').name('Show Puts').onChange(addNeonSpheresGrid);
  gui.add(params, 'glow', 0.1, 3.0).name('Glow').onChange(updateSphereMaterials);
  gui.add(params, 'waveSpeed', 0.1, 3.0).name('Wave Speed');
  gui.add(params, 'particleAlpha', 0.1, 1.0).name('Particle Alpha').onChange(updateSphereMaterials);
  gui.addColor(params, 'color1').name('Color 1').onChange(updateSphereMaterials);
  gui.addColor(params, 'color2').name('Color 2').onChange(updateSphereMaterials);
  gui.close();

  // Tooltip div
  tooltipDiv = document.createElement('div');
  tooltipDiv.style.position = 'fixed';
  tooltipDiv.style.pointerEvents = 'none';
  tooltipDiv.style.background = 'rgba(20,20,40,0.95)';
  tooltipDiv.style.color = '#fff';
  tooltipDiv.style.padding = '10px 16px';
  tooltipDiv.style.borderRadius = '8px';
  tooltipDiv.style.fontSize = '15px';
  tooltipDiv.style.zIndex = 100;
  tooltipDiv.style.display = 'none';
  tooltipDiv.style.boxShadow = '0 2px 12px #0008';
  document.body.appendChild(tooltipDiv);

  // Upload button
  uploadInput = document.createElement('input');
  uploadInput.type = 'file';
  uploadInput.accept = '.csv';
  uploadInput.style.position = 'fixed';
  uploadInput.style.left = '20px';
  uploadInput.style.top = '20px';
  uploadInput.style.zIndex = 101;
  uploadInput.style.background = '#222';
  uploadInput.style.color = '#fff';
  uploadInput.style.padding = '6px 10px';
  uploadInput.style.borderRadius = '6px';
  uploadInput.style.fontSize = '15px';
  uploadInput.style.opacity = 0.95;
  uploadInput.title = 'Upload CSV';
  document.body.appendChild(uploadInput);
  uploadInput.addEventListener('change', e => {
    if (uploadInput.files && uploadInput.files[0]) {
      const reader = new FileReader();
      reader.onload = evt => {
        parseCSVText(evt.target.result);
      };
      reader.readAsText(uploadInput.files[0]);
    }
  });

  // Mouse move for hover
  window.addEventListener('mousemove', onMouseMove, false);

  // Load CSV and build grid
  loadCSV('spy_quotedata.csv');

  // Resize
  window.addEventListener('resize', onWindowResize, false);

  window.addEventListener('keydown', onKeyDown, false);
  window.addEventListener('keyup', onKeyUp, false);

  // Title div
  titleDiv = document.createElement('div');
  titleDiv.innerText = 'Option Particle Ocean';
  titleDiv.style.position = 'fixed';
  titleDiv.style.top = '24px';
  titleDiv.style.right = '32px';
  titleDiv.style.fontSize = '2.1em';
  titleDiv.style.fontWeight = 'bold';
  titleDiv.style.color = '#0ff';
  titleDiv.style.textShadow = '0 2px 16px #000, 0 0 8px #0ff8';
  titleDiv.style.background = 'rgba(10,20,40,0.85)';
  titleDiv.style.padding = '10px 28px';
  titleDiv.style.borderRadius = '12px';
  titleDiv.style.zIndex = 200;
  titleDiv.style.transition = 'opacity 1s';
  document.body.appendChild(titleDiv);
  setTimeout(() => { titleDiv.style.opacity = 0; }, 15000);

  // Instructions hint
  instructionsHintDiv = document.createElement('div');
  instructionsHintDiv.innerText = 'Press H for instructions';
  instructionsHintDiv.style.position = 'fixed';
  instructionsHintDiv.style.top = '18px';
  instructionsHintDiv.style.left = '50%';
  instructionsHintDiv.style.transform = 'translateX(-50%)';
  instructionsHintDiv.style.fontSize = '1.1em';
  instructionsHintDiv.style.color = '#fff';
  instructionsHintDiv.style.background = 'rgba(10,20,40,0.85)';
  instructionsHintDiv.style.padding = '4px 18px';
  instructionsHintDiv.style.borderRadius = '8px';
  instructionsHintDiv.style.zIndex = 201;
  instructionsHintDiv.style.opacity = 0.92;
  instructionsHintDiv.style.pointerEvents = 'none';
  document.body.appendChild(instructionsHintDiv);

  // Instructions modal (hidden by default)
  instructionsDiv = document.createElement('div');
  instructionsDiv.style.position = 'fixed';
  instructionsDiv.style.top = '50%';
  instructionsDiv.style.left = '50%';
  instructionsDiv.style.transform = 'translate(-50%, -50%)';
  instructionsDiv.style.width = 'clamp(300px, 70vw, 800px)'; // Responsive width
  instructionsDiv.style.height = 'clamp(400px, 80vh, 650px)'; // Responsive height
  instructionsDiv.style.background = 'rgba(15, 25, 50, 0.98)';
  instructionsDiv.style.color = '#fff';
  instructionsDiv.style.padding = '25px'; // Uniform padding
  instructionsDiv.style.borderRadius = '12px';
  instructionsDiv.style.boxShadow = '0 10px 40px rgba(0,0,0,0.5)';
  instructionsDiv.style.zIndex = 9999;
  instructionsDiv.style.display = 'none';
  instructionsDiv.style.overflowY = 'auto';
  instructionsDiv.style.textAlign = 'center';
  instructionsDiv.style.lineHeight = '1.6';
  instructionsDiv.innerHTML = '<div style="font-size:1.8em; margin-bottom:20px; color: #00ffff; text-shadow: 0 0 8px #00ffffaa;">📘 Option Particle Ocean Instructions</div><div id="instructions-content" style="font-size: 0.95em;">Loading...</div><div style="margin-top:25px;font-size:1em;">Press <b>H</b> or <b>Esc</b> to close</div>';
  document.body.appendChild(instructionsDiv);

  animate();
}

function parseCSVText(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  header = lines[2].split(',').map(h => h.trim());
  optionData = [];
  for (let i = 3; i < lines.length; i++) {
    const arr = lines[i].split(',');
    if (arr.length < 22) continue;
    const exp = arr[0].trim();
    const strike = parseFloat(arr[11]);
    let call = {
      type: 'call', expiration: exp, strike: strike,
      Ask: parseFloat(arr[5]), IV: parseFloat(arr[7]), Volume: parseFloat(arr[6]), Delta: parseFloat(arr[8]), Gamma: parseFloat(arr[9]),
    };
    let put = {
      type: 'put', expiration: exp, strike: strike,
      'Ask.1': parseFloat(arr[16]), 'IV.1': parseFloat(arr[18]), 'Volume.1': parseFloat(arr[17]), 'Delta.1': parseFloat(arr[19]), 'Gamma.1': parseFloat(arr[20]),
    };
    optionData.push(call); optionData.push(put);
  }
  expirations = Array.from(new Set(optionData.map(r => r.expiration))).sort();
  strikes = Array.from(new Set(optionData.map(r => r.strike))).sort((a,b) => a-b);
  addNeonSpheresGrid();
}

function loadCSV(url) {
  fetch(url)
    .then(res => res.text())
    .then(text => parseCSVText(text));
}

function addNeonSpheresGrid() {
  // Remove old spheres
  for (let s of spheres) scene.remove(s);
  spheres = [];
  if (!optionData.length) return;
  // Build a grid: X = expiration, Z = strike
  const gridW = expirations.length;
  const gridH = strikes.length;
  const cellX = 14, cellZ = 6;
  // Find min/max for Y axis metric
  let minY = Infinity, maxY = -Infinity;
  for (let o of optionData) {
    if ((o.type === 'call' && !params.showCalls) || (o.type === 'put' && !params.showPuts)) continue;
    let y = o[params.metric] ?? o[params.metric.replace('.1','')];
    if (typeof y === 'number' && !isNaN(y)) {
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
  }
  // Place spheres
  for (let xi = 0; xi < gridW; xi++) {
    for (let zi = 0; zi < gridH; zi++) {
      const exp = expirations[xi];
      const strike = strikes[zi];
      // Find call or put for this (exp, strike)
      let o = optionData.find(r => r.expiration === exp && r.strike === strike && ((params.metric.endsWith('.1') && r.type==='put') || (!params.metric.endsWith('.1') && r.type==='call')));
      if (!o) continue;
      let y = o[params.metric] ?? o[params.metric.replace('.1','')];
      if (typeof y !== 'number' || isNaN(y)) continue;
      // Map Y to -60..120
      let yNorm = (maxY > minY) ? (y - minY) / (maxY - minY) : 0.5;
      let yPos = -60 + yNorm * 180;
      // Color by Y value
      const color = new THREE.Color(params.color1).lerp(new THREE.Color(params.color2), yNorm);
      const mat = new THREE.MeshStandardMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: params.glow,
        transparent: true,
        opacity: params.particleAlpha,
        metalness: 0.7,
        roughness: 0.2
      });
      const sphere = new THREE.Mesh(new THREE.SphereGeometry(2.5, 20, 14), mat);
      sphere.position.set((xi - gridW/2) * cellX, yPos, (zi - gridH/2) * cellZ);
      sphere.userData = { baseX: (xi - gridW/2) * cellX, baseY: yPos, baseZ: (zi - gridH/2) * cellZ, gridX: xi, gridY: zi, color: color };
      scene.add(sphere);
      spheres.push(sphere);
    }
  }
}

function updateSphereMaterials() {
  for (let s of spheres) {
    const yNorm = (s.position.y + 60) / 180;
    const color = new THREE.Color(params.color1).lerp(new THREE.Color(params.color2), yNorm);
    s.material.color.copy(color);
    s.material.emissive.copy(color);
    s.material.emissiveIntensity = params.glow;
    s.material.transparent = true;
    s.material.opacity = params.particleAlpha;
    s.material.needsUpdate = true;
  }
}

function animate() {
  requestAnimationFrame(animate);
  updateCameraControls();
  // Animate spheres for breathing/wave effect
  const t = performance.now() * 0.001 * params.waveSpeed;
  for (let i = 0; i < spheres.length; i++) {
    const s = spheres[i];
    const { baseX, baseY, baseZ, gridX, gridY, color } = s.userData;
    // Breathing/wave effect: animate y position and glow
    const wave = Math.sin(t + gridX * 0.5 + gridY * 0.3) * 4;
    s.position.y = baseY + wave;
    // Animate emissiveIntensity for neon pulse
    s.material.emissiveIntensity = params.glow * (1.0 + 0.3 * Math.sin(t * 1.5 + gridX + gridY));
    // Optionally animate color for more life
    const lerpT = 0.5 + 0.5 * Math.sin(t * 0.7 + gridY);
    s.material.color.copy(new THREE.Color(params.color1).lerp(new THREE.Color(params.color2), lerpT));
    s.material.emissive.copy(s.material.color);
    s.material.opacity = params.particleAlpha;
    s.material.needsUpdate = true;
  }
  controls.update();
  renderer.render(scene, camera);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function onMouseMove(e) {
  if (!spheres.length) return;
  // Project mouse to 3D
  let mouse = new THREE.Vector2(
    (e.clientX / window.innerWidth) * 2 - 1,
    -(e.clientY / window.innerHeight) * 2 + 1
  );
  let raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);
  let intersects = raycaster.intersectObjects(spheres);
  if (intersects.length > 0) {
    let s = intersects[0].object;
    let { gridX, gridY } = s.userData;
    let exp = expirations[gridX];
    let strike = strikes[gridY];
    let yVal = s.position.y;
    let metric = params.metric;
    let o = optionData.find(r => r.expiration === exp && r.strike === strike && ((metric.endsWith('.1') && r.type==='put') || (!metric.endsWith('.1') && r.type==='call')));
    let yRaw = o ? (o[metric] ?? o[metric.replace('.1','')]) : '';
    tooltipDiv.innerHTML = `<b>Expiration:</b> ${exp}<br><b>Strike:</b> ${strike}<br><b>${metric}:</b> ${yRaw}`;
    tooltipDiv.style.display = 'block';
    tooltipDiv.style.left = (e.clientX + 18) + 'px';
    tooltipDiv.style.top = (e.clientY - 10) + 'px';
  } else {
    tooltipDiv.style.display = 'none';
  }
}

function onKeyDown(e) {
  if (instructionsVisible && (e.code === 'KeyH' || e.code === 'Escape')) {
    hideInstructions();
    e.preventDefault();
    return;
  }
  if (!instructionsVisible && e.code === 'KeyH') {
    showInstructions();
    e.preventDefault();
    return;
  }
  switch (e.code) {
    case 'KeyW': moveState.forward = true; break;
    case 'KeyS': moveState.back = true; break;
    case 'KeyA': moveState.left = true; break;
    case 'KeyD': moveState.right = true; break;
    case 'ArrowUp': moveState.up = true; break;
    case 'ArrowDown': moveState.down = true; break;
    case 'ArrowLeft': moveState.lookLeft = true; break;
    case 'ArrowRight': moveState.lookRight = true; break;
    case 'KeyQ': moveState.lookLeft = true; break;
    case 'KeyE': moveState.lookRight = true; break;
    case 'ShiftLeft': case 'ShiftRight': moveState.speedBoost = true; break;
  }
}
function onKeyUp(e) {
  switch (e.code) {
    case 'KeyW': moveState.forward = false; break;
    case 'KeyS': moveState.back = false; break;
    case 'KeyA': moveState.left = false; break;
    case 'KeyD': moveState.right = false; break;
    case 'ArrowUp': moveState.up = false; break;
    case 'ArrowDown': moveState.down = false; break;
    case 'ArrowLeft': moveState.lookLeft = false; break;
    case 'ArrowRight': moveState.lookRight = false; break;
    case 'KeyQ': moveState.lookLeft = false; break;
    case 'KeyE': moveState.lookRight = false; break;
    case 'ShiftLeft': case 'ShiftRight': moveState.speedBoost = false; break;
  }
}

function updateCameraControls() {
  let speed = moveSpeed * (moveState.speedBoost ? 5 : 1);
  let look = lookSpeed * (moveState.speedBoost ? 2 : 1);
  // Move
  let dir = new THREE.Vector3();
  camera.getWorldDirection(dir);
  dir.y = 0; dir.normalize();
  let right = new THREE.Vector3().crossVectors(dir, camera.up).normalize();
  if (moveState.forward) camera.position.addScaledVector(dir, speed);
  if (moveState.back) camera.position.addScaledVector(dir, -speed);
  if (moveState.left) camera.position.addScaledVector(right, -speed);
  if (moveState.right) camera.position.addScaledVector(right, speed);
  if (moveState.up) camera.position.y += speed;
  if (moveState.down) camera.position.y -= speed;
  // Look
  if (moveState.lookLeft) controls.rotateLeft(look);
  if (moveState.lookRight) controls.rotateLeft(-look);
}

function showInstructions() {
  instructionsVisible = true;
  instructionsDiv.style.display = 'block';
  // Load instructions.js content
  fetch('instructions.js').then(r => r.text()).then(txt => {
    document.getElementById('instructions-content').innerHTML = '<pre style="text-align:left;max-width:95%;margin:0 auto;font-size:1em;line-height:1.6;background:rgba(0,0,0,0.2);padding:15px 20px;border-radius:8px;white-space:pre-wrap;word-break:break-word;">' + txt.replace(/</g,'&lt;').replace(/>/g,'&gt;') + '</pre>';
  });
}
function hideInstructions() {
  instructionsVisible = false;
  instructionsDiv.style.display = 'none';
}

// TODO: Add CSV parsing and data-driven rendering
// Use PapaParse or fetch API to load CSV, then call addNeonSpheresGrid() with real data 