document.addEventListener('DOMContentLoaded', () => {
  if (typeof THREE === 'undefined' || !THREE.OrbitControls) {
    console.error('Three.js no se pudo cargar. Revisa la conexión o los scripts del proyecto.');
    return;
  }

  const canvasHost = document.getElementById('solar-canvas');
  const entryGate = document.getElementById('entryGate');
  const guestEntryButton = document.getElementById('guestEntryButton');
  const planetInfoPanel = document.getElementById('planetInfoPanel');
  const planetInfoTitle = document.getElementById('planetInfoTitle');
  const planetInfoDescription = document.getElementById('planetInfoDescription');
  const planetInfoMeta = document.getElementById('planetInfoMeta');
  const planetInfoPosts = document.getElementById('planetInfoPosts');
  const reopenAccessButton = document.getElementById('reopenAccessButton');
  const togglePauseButton = document.getElementById('togglePause');
  const toggleLabelsButton = document.getElementById('toggleLabels');
  const toggleOrbitsButton = document.getElementById('toggleOrbits');
  const focusSunButton = document.getElementById('focusSun');
  const speedRange = document.getElementById('speedRange');

  const planetDataScript = document.getElementById('planet-data');
  const backendCategories = planetDataScript ? JSON.parse(planetDataScript.textContent) : [];

  const defaultPlanetCatalog = [
    { key: 'mercurio', name: 'Mercurio', diameter: '4.879 km', distance: '57.9 M km', day: '58.6 días', year: '88 días', temperature: '167°C', composition: 'Metales y silicatos', moons: 0, color: '#a8a7a1', orbitSpeed: 0.06, radius: 2.2, distanceScale: 24 },
    { key: 'venus', name: 'Venus', diameter: '12.104 km', distance: '108.2 M km', day: '243 días', year: '225 días', temperature: '464°C', composition: 'Dióxido de carbono y nitrógeno', moons: 0, color: '#d4b186', orbitSpeed: 0.045, radius: 3.2, distanceScale: 32 },
    { key: 'tierra', name: 'Tierra', diameter: '12.742 km', distance: '149.6 M km', day: '24 h', year: '365 días', temperature: '15°C', composition: 'Nitrógeno, oxígeno, silicio', moons: 1, color: '#3aa9ff', orbitSpeed: 0.038, radius: 3.6, distanceScale: 42 },
    { key: 'marte', name: 'Marte', diameter: '6.779 km', distance: '227.9 M km', day: '24.6 h', year: '687 días', temperature: '-65°C', composition: 'Hierro, oxígeno, silicio', moons: 2, color: '#d66d47', orbitSpeed: 0.032, radius: 2.8, distanceScale: 58 },
    { key: 'jupiter', name: 'Júpiter', diameter: '139.820 km', distance: '778.5 M km', day: '9.9 h', year: '11.9 años', temperature: '-110°C', composition: 'Hidrógeno y helio', moons: 95, color: '#d9a66d', orbitSpeed: 0.02, radius: 7.8, distanceScale: 96 },
    { key: 'saturno', name: 'Saturno', diameter: '116.460 km', distance: '1.43 B km', day: '10.7 h', year: '29.4 años', temperature: '-140°C', composition: 'Hidrógeno, helio, metano', moons: 146, color: '#d3c089', orbitSpeed: 0.015, radius: 6.8, distanceScale: 126 },
    { key: 'urano', name: 'Urano', diameter: '50.724 km', distance: '2.87 B km', day: '17 h', year: '84 años', temperature: '-195°C', composition: 'Hidrógeno, helio y metano', moons: 27, color: '#7fe2ff', orbitSpeed: 0.012, radius: 5.2, distanceScale: 164 },
    { key: 'neptuno', name: 'Neptuno', diameter: '49.244 km', distance: '4.5 B km', day: '16 h', year: '165 años', temperature: '-200°C', composition: 'Hidrógeno, helio, metano', moons: 14, color: '#4e89ff', orbitSpeed: 0.009, radius: 5, distanceScale: 196 },
  ];

  const builtPlanetCatalog = defaultPlanetCatalog.map((planet) => {
    const backendMatch = backendCategories.find((item) => item.slug === planet.key || item.slug === planet.name.toLowerCase());
    return {
      ...planet,
      description: backendMatch?.description || 'Planeta del sistema solar con contenido educativo disponible.',
      posts: backendMatch?.posts || [],
      slug: planet.key,
      accent_color: backendMatch?.accent_color || planet.color,
    };
  });

  const targetPlanetReference = {
    venus: { label: 'Planeta Creación', texture: '/static/images/planeta-creacion.png', aspect: 398 / 335 },
    tierra: { label: 'Planeta Puentes Predeportivos', texture: '/static/images/planeta-puentes.png', aspect: 328 / 307 },
    mercurio: { label: 'Motricidad y coordinación corporal', texture: '/static/images/planeta-logica.png', aspect: 575 / 510 },
  };

  if (!canvasHost) return;

  const isAuthenticated = entryGate ? entryGate.dataset.authenticated === 'true' : false;
  let guestAccessGranted = sessionStorage.getItem('planet-guest-access') === 'true';

  const toggleEntryGate = (show) => {
    if (entryGate) {
      entryGate.hidden = !show;
    }
  };

  if (!isAuthenticated && !guestAccessGranted && entryGate) {
    toggleEntryGate(true);
  } else if (entryGate) {
    toggleEntryGate(false);
  }

  if (reopenAccessButton) {
    reopenAccessButton.addEventListener('click', () => {
      toggleEntryGate(true);
    });
  }

  if (guestEntryButton) {
    guestEntryButton.addEventListener('click', () => {
      guestAccessGranted = true;
      sessionStorage.setItem('planet-guest-access', 'true');
      toggleEntryGate(false);
      if (reopenAccessButton) {
        reopenAccessButton.hidden = false;
      }
    });
  }

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x020817, 0.0026);

  const camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.1, 2000);
  camera.position.set(140, 100, 220);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x020817, 1);
  canvasHost.appendChild(renderer.domElement);

  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.enablePan = true;
  controls.enableRotate = true;
  controls.enableZoom = true;
  controls.enableKeys = true;
  controls.screenSpacePanning = true;
  controls.minDistance = 25;
  controls.maxDistance = 700;
  controls.minPolarAngle = 0;
  controls.maxPolarAngle = Math.PI;
  controls.target.set(0, 0, 0);

  const ambientLight = new THREE.AmbientLight(0x7bb8ff, 0.5);
  scene.add(ambientLight);

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.6);
  keyLight.position.set(140, 90, 130);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0x7dd3fc, 0.8);
  fillLight.position.set(-120, -70, -110);
  scene.add(fillLight);

  const sunLight = new THREE.PointLight(0xffd76a, 2.2, 1000, 2);
  sunLight.position.set(0, 0, 0);
  scene.add(sunLight);

  const sun = new THREE.Mesh(
    new THREE.SphereGeometry(12, 64, 64),
    new THREE.MeshStandardMaterial({
      emissive: 0xffd76a,
      emissiveIntensity: 2.5,
      color: 0xffc857,
      roughness: 0.6,
      metalness: 0.2,
    })
  );
  scene.add(sun);

  const sunGlow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: (() => {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createRadialGradient(128,128,20,128,128,128);
        gradient.addColorStop(0, 'rgba(255,255,255,1)');
        gradient.addColorStop(0.25, 'rgba(255,219,120,1)');
        gradient.addColorStop(0.55, 'rgba(255,162,0,0.8)');
        gradient.addColorStop(1, 'rgba(255,162,0,0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 256, 256);
        return new THREE.CanvasTexture(canvas);
      })(),
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    })
  );
  sunGlow.scale.set(48, 48, 1);
  scene.add(sunGlow);

  const starGeometry = new THREE.BufferGeometry();
  const starPositions = [];
  for (let i = 0; i < 8000; i += 1) {
    const radius = 700 + Math.random() * 900;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);
    starPositions.push(x, y, z);
  }
  starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
  const stars = new THREE.Points(
    starGeometry,
    new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1.8,
      transparent: true,
      opacity: 0.95,
    })
  );
  scene.add(stars);

  const nebulaGroup = new THREE.Group();
  const nebulaColors = [0x3b82f6, 0x7c3aed, 0x22d3ee];
  nebulaColors.forEach((color, index) => {
    const spriteMaterial = new THREE.SpriteMaterial({
      color,
      transparent: true,
      opacity: 0.08,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.position.set(
      (index - 1) * 150,
      80 + index * 25,
      -200 - index * 80
    );
    sprite.scale.set(220, 140, 1);
    nebulaGroup.add(sprite);
  });
  scene.add(nebulaGroup);

  const orbitGroup = new THREE.Group();
  scene.add(orbitGroup);

  const planetMeshes = [];
  const orbitMeshes = [];
  const labelSprites = [];
  const planetMap = new Map();
  let selectedPlanet = null;
  let paused = false;
  let showLabels = true;
  let showOrbits = true;
  let simulationSpeed = 1;

  const makeLabelSprite = (text) => {
    const safeText = String(text || 'Planeta');
    const fontSize = 24;
    const paddingX = 26;
    const paddingY = 16;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.font = `700 ${fontSize}px Inter, sans-serif`;
    const metrics = ctx.measureText(safeText);
    const width = Math.max(220, Math.ceil(metrics.width + paddingX * 2));
    const height = 68;
    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(2, 6, 23, 0.58)';
    ctx.strokeStyle = 'rgba(125, 211, 252, 0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(10, 10, canvas.width - 20, canvas.height - 20, 18);
    ctx.fill();
    ctx.stroke();
    ctx.font = `700 ${fontSize}px Inter, sans-serif`;
    ctx.fillStyle = '#f8fafc';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(safeText, canvas.width / 2, canvas.height / 2 + 2);

    const texture = new THREE.CanvasTexture(canvas);
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
        depthTest: false,
      })
    );
    const scaleX = Math.max(8, width / 24);
    sprite.scale.set(scaleX, 5.2, 1);
    sprite.position.y = 2.8;
    return sprite;
  };

  const drawCreationPlanet = (ctx, width, height) => {
    const base = ctx.createRadialGradient(width * 0.5, height * 0.52, 40, width * 0.5, height * 0.5, width * 0.55);
    base.addColorStop(0, '#e7f7ff');
    base.addColorStop(0.35, '#8ecde8');
    base.addColorStop(0.7, '#7ecad5');
    base.addColorStop(1, '#5ca2b7');
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, Math.min(width, height) * 0.42, 0, Math.PI * 2);
    ctx.clip();

    for (let i = 0; i < 15; i += 1) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      ctx.fillStyle = i % 2 === 0 ? '#e2f3bc' : '#8fd588';
      ctx.beginPath();
      ctx.arc(x, y, 120 + Math.random() * 180, 0, Math.PI * 2);
      ctx.fill();
    }

    for (let i = 0; i < 30; i += 1) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const w = 50 + Math.random() * 120;
      const h = 18 + Math.random() * 36;
      ctx.fillStyle = i % 3 === 0 ? '#f2b61f' : '#f9d44a';
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = '#fff4b5';
      ctx.fillRect(x + 5, y + 4, w - 10, h - 8);
    }

    for (let i = 0; i < 26; i += 1) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = 18 + Math.random() * 32;
      ctx.strokeStyle = '#3d678b';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  };

  const drawSportPlanet = (ctx, width, height) => {
    const base = ctx.createRadialGradient(width * 0.4, height * 0.38, 50, width * 0.5, height * 0.5, width * 0.62);
    base.addColorStop(0, '#e2f398');
    base.addColorStop(0.35, '#a9d956');
    base.addColorStop(0.7, '#5ca64d');
    base.addColorStop(1, '#2d7a49');
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, Math.min(width, height) * 0.42, 0, Math.PI * 2);
    ctx.clip();

    ctx.fillStyle = '#f3f4f0';
    ctx.fillRect(width * 0.2, height * 0.25, width * 0.6, height * 0.5);
    ctx.strokeStyle = '#2f6f3e';
    ctx.lineWidth = 16;
    ctx.strokeRect(width * 0.22, height * 0.27, width * 0.56, height * 0.46);

    ctx.beginPath();
    ctx.moveTo(width * 0.26, height * 0.52);
    ctx.lineTo(width * 0.74, height * 0.52);
    ctx.moveTo(width * 0.5, height * 0.27);
    ctx.lineTo(width * 0.5, height * 0.73);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(width * 0.5, height * 0.52, width * 0.18, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#f45c3d';
    ctx.lineWidth = 24;
    ctx.beginPath();
    ctx.ellipse(width * 0.5, height * 0.52, width * 0.32, height * 0.28, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  };

  const drawPuzzlePlanet = (ctx, width, height) => {
    const base = ctx.createRadialGradient(width * 0.52, height * 0.52, 30, width * 0.5, height * 0.5, width * 0.68);
    base.addColorStop(0, '#d8fbff');
    base.addColorStop(0.22, '#9fe7ef');
    base.addColorStop(0.56, '#5ac0d2');
    base.addColorStop(1, '#2f8db3');
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, Math.min(width, height) * 0.42, 0, Math.PI * 2);
    ctx.clip();

    const pieces = [
      { x: 350, y: 420, w: 250, h: 170, c: '#a2e7e8' },
      { x: 620, y: 340, w: 260, h: 180, c: '#86dce4' },
      { x: 1040, y: 420, w: 240, h: 190, c: '#8ae0e7' },
      { x: 760, y: 760, w: 260, h: 180, c: '#a0dff4' },
      { x: 420, y: 840, w: 220, h: 150, c: '#9ee3ee' },
      { x: 1080, y: 820, w: 240, h: 160, c: '#7bd2e0' },
    ];

    pieces.forEach((piece) => {
      ctx.fillStyle = piece.c;
      ctx.fillRect(piece.x, piece.y, piece.w, piece.h);
      ctx.strokeStyle = 'rgba(12, 82, 110, 0.8)';
      ctx.lineWidth = 18;
      ctx.strokeRect(piece.x, piece.y, piece.w, piece.h);
    });

    ctx.strokeStyle = '#f0a63a';
    ctx.lineWidth = 20;
    ctx.beginPath();
    ctx.moveTo(280, 760);
    ctx.bezierCurveTo(440, 620, 560, 610, 700, 760);
    ctx.moveTo(1360, 760);
    ctx.bezierCurveTo(1190, 620, 1030, 620, 900, 760);
    ctx.stroke();

    for (let i = 0; i < 20; i += 1) {
      const x = 220 + Math.random() * (width - 440);
      const y = 220 + Math.random() * (height - 440);
      ctx.fillStyle = i % 2 === 0 ? '#ffcc66' : '#ff8c66';
      ctx.beginPath();
      ctx.arc(x, y, 18 + Math.random() * 26, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  };

  const createPlanetTexture = (planetKey) => {
    const reference = targetPlanetReference[planetKey];
    if (reference) {
      const texture = new THREE.TextureLoader().load(reference.texture);
      texture.encoding = THREE.sRGBEncoding;
      texture.needsUpdate = true;
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      return texture;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 2048;
    const ctx = canvas.getContext('2d');

    const handlers = {
      mercurio: drawCreationPlanet,
      venus: drawSportPlanet,
      tierra: drawPuzzlePlanet,
    };

    const handler = handlers[planetKey];
    if (!handler) {
      return null;
    }

    handler(ctx, canvas.width, canvas.height);

    const texture = new THREE.CanvasTexture(canvas);
    texture.encoding = THREE.sRGBEncoding;
    texture.needsUpdate = true;
    return texture;
  };

  const createPlanetMaterial = (planetKey, planetColor) => {
    const texture = createPlanetTexture(planetKey);
    return new THREE.MeshStandardMaterial({
      map: texture,
      color: planetColor,
      emissive: new THREE.Color(planetColor).multiplyScalar(0.12),
      emissiveIntensity: 0.18,
      roughness: 0.82,
      metalness: 0.12,
    });
  };

  const createRingTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < 120; i += 1) {
      const alpha = 0.12 + Math.random() * 0.35;
      const x = Math.random() * canvas.width;
      const w = 40 + Math.random() * 180;
      ctx.fillStyle = `rgba(242, 222, 176, ${alpha})`;
      ctx.fillRect(x, 0, w, canvas.height);
    }

    ctx.strokeStyle = 'rgba(232, 214, 175, 0.85)';
    ctx.lineWidth = 4;
    for (let i = 0; i < 18; i += 1) {
      const y = 30 + i * 24;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y + (i % 2 === 0 ? 6 : -6));
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  };

  const buildPlanet = (planet, index) => {
    const orbit = new THREE.Object3D();
    orbit.rotation.x = (index % 2 === 0 ? 0.4 : -0.3) + (planet.name === 'Mercurio' ? 0.2 : 0);
    orbitGroup.add(orbit);

    const orbitCurve = new THREE.EllipseCurve(
      0,
      0,
      planet.distanceScale,
      planet.distanceScale * 0.78,
      0,
      Math.PI * 2,
      false,
      0
    );
    const points = orbitCurve.getPoints(240).map((point) => new THREE.Vector3(point.x, 0, point.y));
    const orbitGeometry = new THREE.BufferGeometry().setFromPoints(points);
    const orbitLine = new THREE.Line(
      orbitGeometry,
      new THREE.LineBasicMaterial({ color: 0x6fa8ff, transparent: true, opacity: 0.28 })
    );
    orbit.add(orbitLine);
    orbitMeshes.push(orbitLine);

    const reference = targetPlanetReference[planet.key];
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(planet.radius, 64, 64),
      createPlanetMaterial(planet.key, planet.color)
    );
    mesh.position.set(planet.distanceScale, 0, 0);
    mesh.rotation.y = Math.random() * Math.PI;
    if (reference) {
      mesh.scale.set(reference.aspect, 1, 1);
    }
    orbit.add(mesh);
    planetMeshes.push(mesh);

    const labelText = reference ? reference.label : planet.name;
    const label = makeLabelSprite(labelText);
    label.position.set(0, planet.radius + 5, 0);
    mesh.add(label);
    labelSprites.push(label);

    if (planet.name === 'Saturno') {
      const ringTexture = createRingTexture();
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(planet.radius * 1.7, planet.radius * 2.7, 128),
        new THREE.MeshStandardMaterial({
          map: ringTexture,
          color: 0xefdfba,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.9,
          roughness: 0.9,
          metalness: 0.08,
        })
      );
      ring.rotation.x = Math.PI / 2.6;
      mesh.add(ring);
    }

    const meta = { ...planet, orbit, mesh, label, rotationPhase: index * (Math.PI / 4) };
    planetMap.set(planet.key, meta);
    return meta;
  };

  const solarPlanets = builtPlanetCatalog.map((planet, index) => buildPlanet(planet, index));
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  const getPlanetMeta = (planetKey) => solarPlanets.find((planet) => planet.key === planetKey);

  const renderPlanetInfoPanel = (planet) => {
    if (!planetInfoPanel || !planetInfoTitle || !planetInfoDescription || !planetInfoMeta || !planetInfoPosts) return;

    const posts = Array.isArray(planet.posts) ? planet.posts : [];
    planetInfoTitle.textContent = planet.name;
    planetInfoDescription.textContent = planet.description;
    planetInfoMeta.innerHTML = `
      <div><strong>Diámetro:</strong> ${planet.diameter}</div>
      <div><strong>Distancia media:</strong> ${planet.distance}</div>
      <div><strong>Día:</strong> ${planet.day}</div>
      <div><strong>Año:</strong> ${planet.year}</div>
      <div><strong>Temperatura:</strong> ${planet.temperature}</div>
      <div><strong>Composición:</strong> ${planet.composition}</div>
      <div><strong>Lunas:</strong> ${planet.moons}</div>
    `;

    if (posts.length === 0) {
      planetInfoPosts.innerHTML = '<div class="planet-empty-state">Aún no hay contenidos publicados para este planeta. El contenido aparecerá aquí cuando un editor lo publique.</div>';
    } else {
      planetInfoPosts.innerHTML = posts.map((post) => {
        const mediaLinks = [];
        if (post.attachment) mediaLinks.push(`<a href="${post.attachment}" target="_blank" rel="noreferrer">PDF/archivo</a>`);
        if (post.video_url) mediaLinks.push(`<a href="${post.video_url}" target="_blank" rel="noreferrer">Video</a>`);
        return `
          <article class="planet-post-card">
            <h4>${post.title}</h4>
            <p>${post.summary || 'Sin resumen disponible.'}</p>
            <div class="planet-post-links">${mediaLinks.join(' • ') || '<span>Solo texto</span>'}</div>
          </article>
        `;
      }).join('');
    }

    planetInfoPanel.hidden = false;
  };

  const hideInfoPanel = () => {
    if (planetInfoPanel) {
      planetInfoPanel.hidden = true;
      planetInfoTitle.textContent = 'Explora el sistema';
      planetInfoDescription.textContent = 'Selecciona un planeta para ver sus contenidos y recursos educativos.';
      planetInfoMeta.innerHTML = '';
      planetInfoPosts.innerHTML = '';
    }
  };

  const selectPlanet = (planetKey) => {
    const planet = getPlanetMeta(planetKey);
    if (!planet) return;
    selectedPlanet = planet;
    planet.mesh.material.emissiveIntensity = 0.7;
    const aspect = targetPlanetReference[planet.key]?.aspect ?? 1;
    planet.mesh.scale.set(aspect * 1.12, 1.12, 1.12);
    renderPlanetInfoPanel(planet);
    controls.target.copy(planet.mesh.getWorldPosition(new THREE.Vector3()));
    camera.position.lerp(planet.mesh.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 18, 32)), 0.18);
  };

  const deselectPlanet = () => {
    if (!selectedPlanet) return;
    selectedPlanet.mesh.material.emissiveIntensity = 0.18;
    const aspect = targetPlanetReference[selectedPlanet.key]?.aspect ?? 1;
    selectedPlanet.mesh.scale.set(aspect, 1, 1);
    selectedPlanet = null;
    hideInfoPanel();
  };

  const focusOnPlanet = (planetKey) => {
    const planet = getPlanetMeta(planetKey);
    if (!planet) return;
    const targetPosition = planet.mesh.getWorldPosition(new THREE.Vector3());
    controls.target.copy(targetPosition);
    camera.position.lerp(targetPosition.clone().add(new THREE.Vector3(0, 20, 34)), 0.18);
  };

  const focusSunView = () => {
    selectedPlanet = null;
    controls.target.set(0, 0, 0);
    camera.position.set(140, 100, 220);
    hideInfoPanel();
  };

  if (togglePauseButton) {
    togglePauseButton.addEventListener('click', () => {
      paused = !paused;
      togglePauseButton.textContent = paused ? 'Reanudar' : 'Pausar';
    });
  }

  if (toggleLabelsButton) {
    toggleLabelsButton.addEventListener('click', () => {
      showLabels = !showLabels;
      labelSprites.forEach((label) => {
        label.visible = showLabels;
      });
      toggleLabelsButton.textContent = showLabels ? 'Etiquetas' : 'Etiquetas off';
    });
  }

  if (toggleOrbitsButton) {
    toggleOrbitsButton.addEventListener('click', () => {
      showOrbits = !showOrbits;
      orbitMeshes.forEach((orbit) => {
        orbit.visible = showOrbits;
      });
      toggleOrbitsButton.textContent = showOrbits ? 'Órbitas' : 'Órbitas off';
    });
  }

  if (focusSunButton) {
    focusSunButton.addEventListener('click', () => {
      focusSunView();
    });
  }

  if (speedRange) {
    speedRange.addEventListener('input', (event) => {
      simulationSpeed = Number(event.target.value);
    });
  }

  renderer.domElement.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    const bounds = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
    pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects(planetMeshes, false);

    if (intersects.length > 0) {
      const hit = intersects[0].object;
      const planetKey = [...planetMap.entries()].find(([, value]) => value.mesh === hit || value.mesh.children.includes(hit))?.[0];
      if (planetKey) {
        selectPlanet(planetKey);
      }
    } else {
      deselectPlanet();
    }
  });

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  const tick = () => {
    requestAnimationFrame(tick);

    if (!paused) {
      const elapsed = performance.now() * 0.001;
      solarPlanets.forEach((planet) => {
        const orbitAngle = elapsed * (planet.orbitSpeed || 1) * 0.9 * simulationSpeed + planet.rotationPhase;
        planet.orbit.rotation.y = orbitAngle;
        planet.mesh.rotation.y += 0.02 * simulationSpeed;
        planet.mesh.rotation.z = Math.sin(elapsed * 1.4 + planet.rotationPhase) * 0.12;
        if (planet.name === 'Saturno') {
          planet.mesh.children.forEach((child) => {
            if (child.geometry && child.geometry.type === 'RingGeometry') {
              child.rotation.z += 0.006 * simulationSpeed;
            }
          });
        }
      });
    }

    sun.rotation.y += 0.002;
    stars.rotation.y += 0.00008;
    controls.update();
    renderer.render(scene, camera);
  };

  tick();
});
