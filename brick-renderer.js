import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const textureLoader = new THREE.TextureLoader();
const texBase = 'textures/castle_brick_';

let _tex = null;
function getTextures() {
    if (_tex) return _tex;
    _tex = {
        map: textureLoader.load(texBase + 'diff.jpg'),
        normal: textureLoader.load(texBase + 'nor_gl.jpg'),
        roughness: textureLoader.load(texBase + 'rough.jpg'),
        ao: textureLoader.load(texBase + 'ao.jpg'),
    };
    Object.values(_tex).forEach(t => {
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.repeat.set(1, 1);
    });
    _tex.map.colorSpace = THREE.SRGBColorSpace;
    return _tex;
}

function displaceVertices(geo, strength = 0.0035) {
    geo.computeVertexNormals();
    const pos = geo.attributes.position;
    const nor = geo.attributes.normal;
    const v = new THREE.Vector3();
    const n = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i);
        n.fromBufferAttribute(nor, i);
        const s1 = Math.sin(v.x * 23.7) * Math.cos(v.y * 41.3) * Math.sin(v.z * 59.1);
        const s2 = Math.sin(v.x * 67.1 + 1.3) * Math.cos(v.y * 89.7 + 2.7) * Math.sin(v.z * 31.9 + 0.5);
        const s3 = Math.sin(v.x * 12.3) * Math.cos(v.z * 18.7) * Math.sin(v.y * 73.1 + 0.8);
        const noise = s1 * 0.6 + s2 * 0.3 + s3 * 0.1;
        v.addScaledVector(n, noise * strength);
        pos.setXYZ(i, v.x, v.y, v.z);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
}

function buildEnvMap(width = 1024) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = width / 2;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#0a0704';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const key = ctx.createRadialGradient(width * 0.32, height * 0.32, 10, width * 0.32, height * 0.32, width * 0.22);
    key.addColorStop(0, 'rgba(255,240,226,0.96)');
    key.addColorStop(0.12, 'rgba(255,240,226,0.55)');
    key.addColorStop(0.35, 'rgba(255,240,226,0.12)');
    key.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = key;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const fill = ctx.createRadialGradient(width * 0.78, height * 0.42, 10, width * 0.78, height * 0.42, width * 0.12);
    fill.addColorStop(0, 'rgba(235,225,215,0.25)');
    fill.addColorStop(0.5, 'rgba(235,225,215,0.06)');
    fill.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = fill;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const rim = ctx.createRadialGradient(width * 0.5, height * 0.12, 10, width * 0.5, height * 0.12, width * 0.1);
    rim.addColorStop(0, 'rgba(240,235,230,0.22)');
    rim.addColorStop(0.5, 'rgba(240,235,230,0.05)');
    rim.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = rim;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const floor = ctx.createRadialGradient(width * 0.48, height * 0.90, 10, width * 0.48, height * 0.90, width * 0.18);
    floor.addColorStop(0, 'rgba(180,140,90,0.05)');
    floor.addColorStop(0.3, 'rgba(180,140,90,0.02)');
    floor.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = floor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const tex = new THREE.CanvasTexture(canvas);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    return tex;
}

function buildBackground(width = 512) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = width;
    const ctx = canvas.getContext('2d');
    const g = ctx.createRadialGradient(width * 0.48, width * 0.52, 15, width * 0.48, width * 0.52, width * 0.72);
    g.addColorStop(0, '#1a1410');
    g.addColorStop(0.25, '#100c08');
    g.addColorStop(0.6, '#080504');
    g.addColorStop(1, '#010101');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, width);
    const gold = ctx.createRadialGradient(width * 0.38, width * 0.42, 5, width * 0.38, width * 0.42, width * 0.22);
    gold.addColorStop(0, 'rgba(200,170,120,0.025)');
    gold.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gold;
    ctx.fillRect(0, 0, width, width);
    return new THREE.CanvasTexture(canvas);
}

function setupBrickScene(containerEl, isGold = false) {
    const rect = containerEl.getBoundingClientRect();
    const width = rect.width || 300;
    const height = rect.height || 240;
    const aspect = width / height;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.7;
    renderer.domElement.style.display = 'block';
    containerEl.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = buildBackground();

    const camera = new THREE.PerspectiveCamera(18, aspect, 0.1, 50);
    camera.position.set(2.6, 1.1, 3.8);
    camera.lookAt(0, 0, 0);

    const geo = new RoundedBoxGeometry(2.0, 0.6, 1.0, 8, 0.065);
    displaceVertices(geo, 0.0035);

    const tex = !isGold ? getTextures() : null;
    const mat = new THREE.MeshStandardMaterial(
        isGold
            ? { color: 0xFFD700, metalness: 0.35, roughness: 0.12, envMapIntensity: 1.5 }
            : {
                  map: tex.map,
                  normalMap: tex.normal,
                  normalScale: new THREE.Vector2(1.8, 1.8),
                  roughnessMap: tex.roughness,
                  roughness: 0.9,
                  aoMap: tex.ao,
                  aoMapIntensity: 1.0,
                  color: 0xf5e0d0,
                  envMapIntensity: 0.35,
              }
    );

    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);

    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromEquirectangular(buildEnvMap(1024)).texture;
    pmrem.dispose();

    const ambient = new THREE.AmbientLight(0xffffff, 0.06);
    scene.add(ambient);

    const hemi = new THREE.HemisphereLight(0xffeedd, 0x4a2c1a, 0.2);
    scene.add(hemi);

    const key = new THREE.DirectionalLight(0xfff0e6, 1.5);
    key.position.set(3.5, 5, 3);
    key.castShadow = true;
    key.shadow.mapSize.width = 2048;
    key.shadow.mapSize.height = 2048;
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 12;
    key.shadow.camera.left = -3;
    key.shadow.camera.right = 3;
    key.shadow.camera.top = 3;
    key.shadow.camera.bottom = -3;
    key.shadow.bias = -0.0008;
    key.shadow.radius = 8;
    scene.add(key);

    const fill = new THREE.DirectionalLight(0xffccaa, 0.12);
    fill.position.set(-2.5, 0.8, 2);
    scene.add(fill);

    const rim = new THREE.DirectionalLight(0xeef4ff, 0.25);
    rim.position.set(-0.5, 1.8, -4);
    scene.add(rim);

    const back = new THREE.DirectionalLight(0xffeedd, 0.1);
    back.position.set(1.2, 0.5, -4.5);
    scene.add(back);

    const accent = new THREE.DirectionalLight(0xffa050, 0.05);
    accent.position.set(-1.5, -0.8, 2);
    scene.add(accent);

    const planeGeo = new THREE.PlaneGeometry(10, 10);
    const planeMat = new THREE.ShadowMaterial({ opacity: 0.28, color: 0x000000 });
    const shadowPlane = new THREE.Mesh(planeGeo, planeMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -0.38;
    shadowPlane.receiveShadow = true;
    scene.add(shadowPlane);

    return { renderer, scene, camera, mesh };
}

function initBrick(name, selector, isGold = false) {
    const el = document.querySelector(selector);
    if (!el) return null;

    const { renderer, scene, camera, mesh } = setupBrickScene(el, isGold);

    const state = window.threeBricks[name] || { rotationX: 0, rotationY: 0, scale: 1 };
    state.update = () => {
        mesh.rotation.x = state.rotationX * Math.PI / 180;
        mesh.rotation.y = state.rotationY * Math.PI / 180;
        const s = state.scale;
        mesh.scale.set(s, s, s);
    };

    window.threeBricks[name] = state;

    let animId = null;
    function render(now) {
        state.update();
        if (name === 'hero') {
            const t = now * 0.00015;
            mesh.rotation.z = Math.sin(t) * 0.003;
            mesh.position.y = Math.sin(t * 0.5 + 0.5) * 0.004;
            const breathe = 1 + Math.sin(t * 0.3) * 0.0015;
            const s = state.scale * breathe;
            mesh.scale.set(s, s, s);
        }
        renderer.render(scene, camera);
        animId = requestAnimationFrame(render);
    }
    render(performance.now());

    const resizeObserver = new ResizeObserver(() => {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) {
            camera.aspect = r.width / r.height;
            camera.updateProjectionMatrix();
            renderer.setSize(r.width, r.height);
        }
    });
    resizeObserver.observe(el);

    return mesh;
}

document.addEventListener('DOMContentLoaded', () => {
    initBrick('hero', '.hero-brick');
    initBrick('story', '.story-brick');
    initBrick('premium', '.premium-brick-3d', true);
});

// ===== SHOWCASE BRICK — dedicated scene =====
function setupShowcaseBrick() {
    const el = document.querySelector('.showcase-brick-3d');
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const w = rect.width || 280;
    const h = rect.height || 280;
    const aspect = w / h;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.8;
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.pointerEvents = 'auto';
    renderer.domElement.style.cursor = 'grab';
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(16, aspect, 0.1, 50);
    camera.position.set(2.6, 1.1, 3.8);
    camera.lookAt(0, 0, 0);

    // Same geometry + textures as hero brick
    const geo = new RoundedBoxGeometry(2.0, 0.6, 1.0, 8, 0.065);
    displaceVertices(geo, 0.0035);

    // Load the real red brick photo as the color map
    const showcaseTex = textureLoader.load('textures/red-brick.jpg');
    showcaseTex.colorSpace = THREE.SRGBColorSpace;
    showcaseTex.wrapS = showcaseTex.wrapT = THREE.RepeatWrapping;
    showcaseTex.repeat.set(1.2, 0.8);
    showcaseTex.offset.set(0, 0.1);

    // Procedural normal from the old textures if they exist, else just use flat
    const tex = getTextures();
    const mat = new THREE.MeshStandardMaterial({
        map: showcaseTex,
        normalMap: tex.normal,
        normalScale: new THREE.Vector2(1.2, 1.2),
        roughnessMap: tex.roughness,
        roughness: 0.85,
        aoMap: tex.ao,
        aoMapIntensity: 0.6,
        envMapIntensity: 0.5,
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);

    // Environment map
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromEquirectangular(buildEnvMap(1024)).texture;
    pmrem.dispose();

    // Studio lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.15);
    scene.add(ambient);

    const hemi = new THREE.HemisphereLight(0xffeedd, 0x4a2c1a, 0.25);
    scene.add(hemi);

    const key = new THREE.DirectionalLight(0xfff0e6, 1.8);
    key.position.set(3.5, 5, 3);
    scene.add(key);

    const fill = new THREE.DirectionalLight(0xffccaa, 0.3);
    fill.position.set(-2.5, 0.8, 2);
    scene.add(fill);

    const rim = new THREE.DirectionalLight(0xeef4ff, 0.4);
    rim.position.set(-0.5, 1.8, -4);
    scene.add(rim);

    const back = new THREE.DirectionalLight(0xffeedd, 0.15);
    back.position.set(1.2, 0.5, -4.5);
    scene.add(back);

    // Shadow plane
    const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(8, 8),
        new THREE.ShadowMaterial({ opacity: 0.25, color: 0x000000 })
    );
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = -0.38;
    plane.receiveShadow = true;
    scene.add(plane);

    // Auto-rotate state
    let autoAngle = 0;
    let targetY = 0;
    let isDragging = false;
    let prevX = 0;
    let prevRot = 0;
    let velocity = 0;

    // Mouse drag
    renderer.domElement.addEventListener('mousedown', (e) => {
        isDragging = true;
        prevX = e.clientX;
        prevRot = autoAngle;
        velocity = 0;
        renderer.domElement.style.cursor = 'grabbing';
    });
    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const dx = e.clientX - prevX;
        autoAngle = prevRot + dx * 0.008;
    });
    window.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            renderer.domElement.style.cursor = 'grab';
            if (Math.abs(velocity) < 0.001) velocity = 0;
        }
    });

    // Disable wheel zoom
    renderer.domElement.addEventListener('wheel', (e) => e.preventDefault(), { passive: false });

    // Touch support
    let touchId = null;
    renderer.domElement.addEventListener('touchstart', (e) => {
        const t = e.changedTouches[0];
        touchId = t.identifier;
        isDragging = true;
        prevX = t.clientX;
        prevRot = autoAngle;
        velocity = 0;
    }, { passive: true });
    renderer.domElement.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        const t = Array.from(e.changedTouches).find(t => t.identifier === touchId);
        if (!t) return;
        const dx = t.clientX - prevX;
        autoAngle = prevRot + dx * 0.008;
    }, { passive: true });
    renderer.domElement.addEventListener('touchend', (e) => {
        const t = Array.from(e.changedTouches).find(t => t.identifier === touchId);
        if (t) { isDragging = false; touchId = null; }
    }, { passive: true });

    function render(now) {
        if (!isDragging) {
            autoAngle += 0.003;
        }
        mesh.rotation.y = autoAngle;
        renderer.render(scene, camera);
        requestAnimationFrame(render);
    }
    render(performance.now());

    const ro = new ResizeObserver(() => {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) {
            camera.aspect = r.width / r.height;
            camera.updateProjectionMatrix();
            renderer.setSize(r.width, r.height);
        }
    });
    ro.observe(el);
}

setupShowcaseBrick();
