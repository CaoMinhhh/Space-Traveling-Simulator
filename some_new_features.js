import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js/+esm";
import { EffectComposer } from "https://cdn.jsdelivr.net/npm/three@0.161.0/examples/jsm/postprocessing/EffectComposer.js/+esm";
import { RenderPass } from "https://cdn.jsdelivr.net/npm/three@0.161.0/examples/jsm/postprocessing/RenderPass.js/+esm";
import { UnrealBloomPass } from "https://cdn.jsdelivr.net/npm/three@0.161.0/examples/jsm/postprocessing/UnrealBloomPass.js/+esm";

// --- 1. ASSETS ---
const textureLoader = new THREE.TextureLoader();

const galaxyTexture = textureLoader.load('https://upload.wikimedia.org/wikipedia/commons/6/60/ESO_-_Milky_Way.jpg', (tex) => {
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
});

const rockTexture = textureLoader.load('https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/FullMoon2010.jpg/1077px-FullMoon2010.jpg');
const rockNormal = textureLoader.load('https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Metal013_8K_Displacement.png/960px-Metal013_8K_Displacement.png'); 
const shipTexture = textureLoader.load('https://upload.wikimedia.org/wikipedia/commons/0/0e/Metal006_PREVIEW.jpg');

function createSmokeTexture() {
    const canvas = document.createElement('canvas'); canvas.width = 128; canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.4, 'rgba(255, 255, 255, 0.3)');
    grad.addColorStop(0.8, 'rgba(255, 255, 255, 0)'); 
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(canvas);
}

function createStarTexture() {
    const canvas = document.createElement('canvas'); canvas.width = 32; canvas.height = 32;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.3, 'rgba(255, 255, 255, 0.5)'); 
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, 32, 32);
    return new THREE.CanvasTexture(canvas);
}

const dustTexture = createStarTexture();

// [FEATURE: NEBULA COLOR CYCLING]
const nebulaColors = [
    new THREE.Color(0x0000ff), // Xanh dương đậm
    new THREE.Color(0x800080), // Tím
    new THREE.Color(0xff00ff), // Hồng tím
    new THREE.Color(0xff4500), // Cam đỏ
    new THREE.Color(0x00ffff)  // Xanh lơ
];
const cycleDuration = 20000; // 20 giây một vòng đổi màu

// --- 2. SETUP SCENE ---
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x000000, 0.0005); 

const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 4000);
camera.position.z = 5; camera.position.y = 2;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);    
renderer.shadowMap.enabled = true;
renderer.outputColorSpace = THREE.SRGBColorSpace; 
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.75; 
renderer.autoClear = false;
document.body.appendChild(renderer.domElement);

// --- 3. POST-PROCESSING (BLOOM) ---
const renderScene = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
bloomPass.strength = 0.6; 
bloomPass.radius = 0.5;
bloomPass.threshold = 0.6; 
const composer = new EffectComposer(renderer);
composer.addPass(renderScene);
composer.addPass(bloomPass);

// --- 4. BACKGROUND LAYERS ---
const galaxyGeo = new THREE.SphereGeometry(2000, 64, 64);
const galaxyMat = new THREE.MeshBasicMaterial({ 
    map: galaxyTexture, side: THREE.BackSide, color: 0x999999, fog: false 
});
const galaxyMesh = new THREE.Mesh(galaxyGeo, galaxyMat);
scene.add(galaxyMesh);

// Background Dust
const bgCloudGeo = new THREE.PlaneGeometry(600, 600); 
const bgCloudMat = new THREE.MeshLambertMaterial({ 
    map: createSmokeTexture(), transparent: true, opacity: 0.1, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, color: 0xcc6633 
});
const bgClouds = [];
for(let p=0; p<20; p++) {
    const cloud = new THREE.Mesh(bgCloudGeo, bgCloudMat);
    cloud.position.set((Math.random()-0.5)*3000, (Math.random()-0.5)*1000, (Math.random()-0.5)*1500 - 1000);
    cloud.rotation.z = Math.random()*Math.PI*2;
    const s = 1 + Math.random(); cloud.scale.set(s,s,s);
    scene.add(cloud); bgClouds.push(cloud);
}

// Starfield
const starCount = 10000;
const starGeo = new THREE.BufferGeometry();
const starPos = new Float32Array(starCount * 3);
const starColors = new Float32Array(starCount * 3);
const colorPalette = [new THREE.Color(0xaaccff), new THREE.Color(0xffffff), new THREE.Color(0xffddbb)]; 
for(let i=0; i<starCount; i++) {
    starPos[i*3] = (Math.random()-0.5) * 2000; starPos[i*3+1] = (Math.random()-0.5) * 2000; starPos[i*3+2] = (Math.random()-0.5) * 3000;
    const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
    const brightness = 1 + Math.random(); 
    starColors[i*3] = color.r * brightness; starColors[i*3+1] = color.g * brightness; starColors[i*3+2] = color.b * brightness;
}
starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
const starMat = new THREE.PointsMaterial({ size: 2, map: createStarTexture(), transparent: true, vertexColors: true, blending: THREE.AdditiveBlending, depthWrite: false });
scene.add(new THREE.Points(starGeo, starMat));

// Foreground Nebula
const fgCloudGeo = new THREE.PlaneGeometry(60, 60);
const fgCloudMat = new THREE.MeshLambertMaterial({ map: createSmokeTexture(), transparent: true, opacity: 0.1, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
const fgClouds = [];
for(let p=0; p<15; p++) {
    const cloud = new THREE.Mesh(fgCloudGeo, fgCloudMat);
    cloud.position.set((Math.random()-0.5)*150, (Math.random()-0.5)*80, -Math.random()*600 - 100);
    cloud.rotation.z = Math.random()*Math.PI*2;
    // Clone vật liệu để mỗi đám mây có thể nhận màu khác nhau (nếu cần) hoặc đổi màu đồng bộ
    cloud.material = fgCloudMat.clone(); 
    scene.add(cloud); fgClouds.push(cloud);
}

// Warp Streaks
const streakCount = 5000;
const streakGeo = new THREE.BufferGeometry();
const streakPos = new Float32Array(streakCount * 6);
const streakColors = new Float32Array(streakCount * 6);

for(let i=0; i<streakCount; i++) {
    const x = (Math.random()-0.5) * 800; const y = (Math.random()-0.5) * 800; const z = (Math.random()-0.5) * 2000;
    streakPos[i*6] = x; streakPos[i*6+1] = y; streakPos[i*6+2] = z; streakPos[i*6+3] = x; streakPos[i*6+4] = y; streakPos[i*6+5] = z;
    
    const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
    streakColors[i*6] = color.r; streakColors[i*6+1] = color.g; streakColors[i*6+2] = color.b;
    streakColors[i*6+3] = color.r; streakColors[i*6+4] = color.g; streakColors[i*6+5] = color.b;
}

streakGeo.setAttribute('position', new THREE.BufferAttribute(streakPos, 3));
streakGeo.setAttribute('color', new THREE.BufferAttribute(streakColors, 3));

const streakMat = new THREE.LineBasicMaterial({ 
    vertexColors: true, 
    transparent: true, 
    opacity: 0, 
    blending: THREE.AdditiveBlending 
});
const warpStreaks = new THREE.LineSegments(streakGeo, streakMat);
scene.add(warpStreaks);

// --- 5. SPACESHIP ---
const shipGroup = new THREE.Group();
const shipMat = new THREE.MeshStandardMaterial({ map: shipTexture, roughness: 0.4, metalness: 0.8, color: 0xdddddd });

const body = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.6, 2, 16), shipMat); 
body.rotation.x = -Math.PI / 2; 
shipGroup.add(body);

const nose = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1, 16), shipMat); 
nose.rotation.x = -Math.PI / 2; 
nose.position.z = -1.5; // Mũi tàu hướng về trước
shipGroup.add(nose);

const engineGeo = new THREE.CylinderGeometry(0.2, 0.3, 0.5, 12);
const engL = new THREE.Mesh(engineGeo, shipMat); 
engL.rotation.x = -Math.PI/2; 
engL.position.set(-0.5, 0, 1.0); 
shipGroup.add(engL);

const engR = new THREE.Mesh(engineGeo, shipMat); 
engR.rotation.x = -Math.PI/2; 
engR.position.set(0.5, 0, 1.0); 
shipGroup.add(engR);

const headLight = new THREE.SpotLight(0xffffff, 50); 
headLight.angle = Math.PI/8; headLight.penumbra = 0.3; headLight.distance = 120; headLight.castShadow = true;
shipGroup.add(headLight); headLight.position.set(0, 0.5, -0.5); headLight.target.position.set(0, 2, -10); shipGroup.add(headLight.target);

const engineLight = new THREE.PointLight(0x00ffff, 10, 10); 
engineLight.position.set(0, 0, 1.5); 
shipGroup.add(engineLight);

shipGroup.position.y = -1.5; 
scene.add(shipGroup);

// --- SPACE DUST ---
const dustCount = 2000;
const dustGeo = new THREE.BufferGeometry();
const dustPos = new Float32Array(dustCount * 3);
for(let i=0; i<dustCount; i++) {
    dustPos[i*3] = (Math.random()-0.5) * 400; 
    dustPos[i*3+1] = (Math.random()-0.5) * 400; 
    dustPos[i*3+2] = (Math.random()-0.5) * 400; 
}
dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
const dustMat = new THREE.PointsMaterial({
    color: 0xaaaaaa, size: 0.5, map: dustTexture, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false
});
const spaceDust = new THREE.Points(dustGeo, dustMat);
scene.add(spaceDust);

// --- 6. ASTEROIDS ---
const asteroids = [];
const asteroidCount = 5; 
// Sử dụng IcosahedronGeometry để đảm bảo hiệu năng và không bị lỗi bóng
const asteroidGeo = new THREE.IcosahedronGeometry(3, 4); 
const posAttr = asteroidGeo.attributes.position;
for (let i = 0; i < posAttr.count; i++) {
    const v = new THREE.Vector3().fromBufferAttribute(posAttr, i);
    const distortion = Math.sin(v.x * 0.8) + Math.cos(v.y * 0.9) + Math.sin(v.z * 0.7);
    v.normalize().multiplyScalar(3 + distortion * 0.5);
    posAttr.setXYZ(i, v.x, v.y, v.z);
}
asteroidGeo.computeVertexNormals();

const asteroidMat = new THREE.MeshStandardMaterial({
    map: rockTexture, normalMap: rockNormal, normalScale: new THREE.Vector2(1, 1), 
    // [SAFETY] Tắt DisplacementMap để tránh tearing
    displacementMap: null, 
    color: 0xaaaaaa, roughness: 0.7, metalness: 0.1 
});

function createAsteroid(initialZ) {
    const asteroid = new THREE.Mesh(asteroidGeo, asteroidMat);
    asteroid.castShadow = true; asteroid.receiveShadow = true;
    resetAsteroidPosition(asteroid, initialZ);
    scene.add(asteroid); asteroids.push(asteroid);
}
function resetAsteroidPosition(asteroid, zPos = -500) {
    asteroid.position.z = zPos;
    asteroid.position.x = (Math.random() - 0.5) * 80; 
    asteroid.position.y = (Math.random() - 0.5) * 40;
    const scale = 0.8 + Math.random() * 1.0; 
    asteroid.scale.set(scale, scale, scale);
    asteroid.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI);
}
for(let i = 0; i < asteroidCount; i++) createAsteroid(-200 - i * 200);

// --- 7. LIGHTS ---
const hemiLight = new THREE.HemisphereLight(0x0f0e1d, 0x111111, 2); 
scene.add(hemiLight);

const ambientLight = new THREE.AmbientLight(0x404040, 2); 
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xffaa88, 3); 
sunLight.position.set(10, 5, 5); 
sunLight.castShadow = true; 
scene.add(sunLight);

let normalSpeed = 0.1; let warpSpeed = 30;
let currentSpeed = normalSpeed; let targetSpeed = normalSpeed;
const speedValUI = document.getElementById('speed-val');
const speedBarUI = document.getElementById('speed-bar');

document.addEventListener('mousedown', () => { targetSpeed = warpSpeed; });
document.addEventListener('mouseup', () => { targetSpeed = normalSpeed; });
window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
});

// --- 8. ANIMATION LOOP ---
function animate() {
    requestAnimationFrame(animate);
    
    // --- NEBULA COLOR LOGIC ---
    const time = Date.now();
    const numColors = nebulaColors.length;
    let progress = (time % cycleDuration) / cycleDuration * numColors;
    let colorIndex1 = Math.floor(progress);
    let colorIndex2 = (colorIndex1 + 1) % numColors;
    let factor = progress - colorIndex1;

    let interpolatedColor = new THREE.Color();
    interpolatedColor.lerpColors(nebulaColors[colorIndex1], nebulaColors[colorIndex2], factor);

    currentSpeed += (targetSpeed - currentSpeed) * 0.04;

    if(speedValUI) speedValUI.innerText = (currentSpeed * 10).toFixed(1);
    if(speedBarUI) {
        const barPercent = Math.min((currentSpeed / warpSpeed) * 100, 100);
        speedBarUI.style.width = barPercent + '%';
        speedBarUI.style.backgroundColor = currentSpeed > 5 ? '#ff3300' : '#00ffcc';
    }
    
    const shake = currentSpeed > 5 ? (currentSpeed/warpSpeed)*0.15 : 0.01;
    shipGroup.rotation.z = Math.sin(Date.now()*0.005)*shake;
    shipGroup.position.x = Math.sin(Date.now()*0.01)*shake*0.3;
    engineLight.intensity = 5 + (currentSpeed/warpSpeed) * 30; 

    galaxyMesh.rotation.y += 0.0001;
    bgClouds.forEach(cloud => cloud.rotation.z += 0.0001);
    fgClouds.forEach(cloud => {
        // Áp dụng màu mới
        cloud.material.color.copy(interpolatedColor);

        cloud.position.z += currentSpeed * 0.8; cloud.rotation.z += 0.002;
        if(cloud.position.z > 50) { cloud.position.z = -500; cloud.position.x = (Math.random()-0.5)*150; cloud.position.y = (Math.random()-0.5)*80; }
    });

    const sPos = starGeo.attributes.position.array;
    for(let i=0; i<starCount; i++) {
        sPos[i*3+2] += currentSpeed; 
        if(sPos[i*3+2] > 200) { sPos[i*3+2] = -2000; sPos[i*3] = (Math.random()-0.5) * 1500; sPos[i*3+1] = (Math.random()-0.5) * 1500; }
    }
    starGeo.attributes.position.needsUpdate = true;

    // Dust Logic
    const dPos = dustGeo.attributes.position.array;
    for(let i=0; i<dustCount; i++) {
        dPos[i*3+2] += currentSpeed * 1.5; 
        if(dPos[i*3+2] > 200) {
            dPos[i*3+2] = -200; 
            dPos[i*3] = (Math.random()-0.5) * 400; dPos[i*3+1] = (Math.random()-0.5) * 400;
        }
    }
    dustGeo.attributes.position.needsUpdate = true;

    const warpRatio = (currentSpeed - normalSpeed) / (warpSpeed - normalSpeed);
    streakMat.opacity = warpRatio * 0.8; 
    const stPos = streakGeo.attributes.position.array;
    for(let i=0; i<streakCount; i++) {
        stPos[i*6+2] += currentSpeed * 2; stPos[i*6+5] += currentSpeed * 2; 
        if(stPos[i*6+2] > 200) {
            const z = -1500 - Math.random() * 1000; const x = (Math.random()-0.5) * 800; const y = (Math.random()-0.5) * 800;
            stPos[i*6] = x; stPos[i*6+1] = y; stPos[i*6+2] = z; stPos[i*6+3] = x; stPos[i*6+4] = y; stPos[i*6+5] = z;
        }
        stPos[i*6+5] = stPos[i*6+2] - currentSpeed * 2;
    }
    streakGeo.attributes.position.needsUpdate = true;

    // Asteroids Logic
    asteroids.forEach(asteroid => {
        asteroid.position.z += currentSpeed * 0.5;
        asteroid.rotation.x += 0.005; asteroid.rotation.y += 0.01;
        if (asteroid.position.z > 100) resetAsteroidPosition(asteroid, -500);
    });

    composer.render();
}
animate();