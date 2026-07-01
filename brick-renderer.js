import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

function displaceVertices(geo, strength = 0.004) {
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
    const height = width / 2;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
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

const MAX_X = Math.PI / 4;
const FRICTION = 0.94;
const MIN_VEL = 0.0001;
const MOMENTUM_SCALE = 0.4;

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

    const camera = new THREE.PerspectiveCamera(18, aspect, 0.1, 50);
    camera.position.set(4.8, 2.2, 7.0);
    camera.lookAt(0, 0, 0);

    const geo = new RoundedBoxGeometry(2.0, 0.6, 1.0, 8, 0.065);
    displaceVertices(geo, 0.004);

    const mat = new THREE.MeshPhysicalMaterial(
        isGold
            ? { color: 0xFFD700, metalness: 0.35, roughness: 0.12, envMapIntensity: 1.5, clearcoat: 0.0 }
            : {
                  color: 0xB0412E,
                  roughness: 0.8,
                  metalness: 0.0,
                  clearcoat: 0.05,
                  clearcoatRoughness: 0.3,
                  envMapIntensity: 0.6,
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

    const key = new THREE.DirectionalLight(0xfff0e6, 1.8);
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

    const fill = new THREE.DirectionalLight(0xffccaa, 0.15);
    fill.position.set(-2.5, 0.8, 2);
    scene.add(fill);

    const rim = new THREE.DirectionalLight(0xeef4ff, 0.3);
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

    return { renderer, scene, camera, mesh, shadowPlane };
}

function initBrick(name, selector, isGold = false) {
    const el = document.querySelector(selector);
    if (!el) return null;

    const { renderer, scene, camera, mesh, shadowPlane } = setupBrickScene(el, isGold);

    const state = window.threeBricks[name] || { rotationX: 0, rotationY: 0, scale: 1 };

    let angleY = 0;
    let angleX = 0;
    let velY = 0;
    let velX = 0;
    let isDragging = false;
    let prevX = 0;
    let prevY = 0;
    let prevAngleY = 0;
    let prevAngleX = 0;
    let lastAngleY = 0;
    let lastAngleX = 0;

    state.update = () => {
        mesh.rotation.x = (state.rotationX * Math.PI / 180) + angleX;
        mesh.rotation.y = (state.rotationY * Math.PI / 180) + angleY;
        mesh.scale.set(state.scale, state.scale, state.scale);
    };

    window.threeBricks[name] = state;

    const dom = renderer.domElement;
    dom.style.pointerEvents = 'auto';
    dom.style.cursor = 'grab';
    dom.style.touchAction = 'none';

    let hoverScale = 1;
    const defaultShadowOpacity = shadowPlane.material.opacity;

    dom.addEventListener('mouseenter', () => {
        hoverScale = 1.03;
        shadowPlane.material.opacity = 0.45;
    });

    dom.addEventListener('mouseleave', () => {
        hoverScale = 1;
        shadowPlane.material.opacity = defaultShadowOpacity;
    });

    dom.addEventListener('mousedown', (e) => {
        isDragging = true;
        prevX = e.clientX;
        prevY = e.clientY;
        prevAngleY = angleY;
        prevAngleX = angleX;
        lastAngleY = angleY;
        lastAngleX = angleX;
        velY = 0;
        velX = 0;
        dom.style.cursor = 'grabbing';
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const dx = e.clientX - prevX;
        const dy = e.clientY - prevY;
        const nextY = prevAngleY + dx * 0.008;
        const nextX = prevAngleX - dy * 0.008;
        velY = (nextY - lastAngleY) * MOMENTUM_SCALE;
        velX = (nextX - lastAngleX) * MOMENTUM_SCALE;
        lastAngleY = nextY;
        lastAngleX = nextX;
        angleY = nextY;
        angleX = Math.max(-MAX_X, Math.min(MAX_X, nextX));
    });

    window.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            dom.style.cursor = 'grab';
        }
    });

    dom.addEventListener('wheel', (e) => e.preventDefault(), { passive: false });

    let touchId = null;
    dom.addEventListener('touchstart', (e) => {
        const t = e.changedTouches[0];
        touchId = t.identifier;
        isDragging = true;
        prevX = t.clientX;
        prevY = t.clientY;
        prevAngleY = angleY;
        prevAngleX = angleX;
        lastAngleY = angleY;
        lastAngleX = angleX;
        velY = 0;
        velX = 0;
    }, { passive: true });

    dom.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        const t = Array.from(e.changedTouches).find(t => t.identifier === touchId);
        if (!t) return;
        const dx = t.clientX - prevX;
        const dy = t.clientY - prevY;
        const nextY = prevAngleY + dx * 0.008;
        const nextX = prevAngleX - dy * 0.008;
        velY = (nextY - lastAngleY) * MOMENTUM_SCALE;
        velX = (nextX - lastAngleX) * MOMENTUM_SCALE;
        lastAngleY = nextY;
        lastAngleX = nextX;
        angleY = nextY;
        angleX = Math.max(-MAX_X, Math.min(MAX_X, nextX));
    }, { passive: true });

    dom.addEventListener('touchend', () => {
        isDragging = false;
        touchId = null;
    }, { passive: true });

    let animId = null;
    function render(now) {
        if (!isDragging) {
            if (Math.abs(velY) > MIN_VEL || Math.abs(velX) > MIN_VEL) {
                angleY += velY;
                velY *= FRICTION;
                angleX += velX;
                velX *= FRICTION;
                angleX = Math.max(-MAX_X, Math.min(MAX_X, angleX));
                if (angleX <= -MAX_X || angleX >= MAX_X) velX = 0;
                if (Math.abs(velY) < MIN_VEL) velY = 0;
                if (Math.abs(velX) < MIN_VEL) velX = 0;
            } else {
                velY = 0;
                velX = 0;
                angleY += 0.003;
            }
        }

        state.update();

        if (name === 'hero') {
            const t = now * 0.00015;
            mesh.rotation.z = Math.sin(t) * 0.003;
            mesh.position.y = Math.sin(t * 0.5 + 0.5) * 0.004;
            const breathe = 1 + Math.sin(t * 0.3) * 0.0015;
            const s = state.scale * breathe * hoverScale;
            mesh.scale.set(s, s, s);
        } else {
            const s = state.scale * hoverScale;
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
    initBrick('showcase', '.showcase-brick-3d');
});
