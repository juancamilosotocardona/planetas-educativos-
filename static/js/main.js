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
    const canvas = document.createElement('canvas');
    canvas.width = 220;
    canvas.height = 60;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(2, 6, 23, 0.4)';
    ctx.strokeStyle = 'rgba(125, 211, 252, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(8, 8, canvas.width - 16, canvas.height - 16, 16);
    ctx.fill();
    ctx.stroke();
    ctx.font = '700 26px Inter, sans-serif';
    ctx.fillStyle = '#f8fafc';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
        depthTest: false,
      })
    );
    sprite.scale.set(16, 4.2, 1);
    sprite.position.y = 1.8;
    return sprite;
  };

  const createPlanetTexture = (planetKey) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    const drawEarthTexture = () => {
      const ocean = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      ocean.addColorStop(0, '#1c7fd6');
      ocean.addColorStop(0.5, '#2ab0d8');
      ocean.addColorStop(1, '#133f7a');
      ctx.fillStyle = ocean;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < 150; i += 1) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = 18 + Math.random() * 90;
        ctx.beginPath();
        ctx.fillStyle = i % 2 === 0 ? 'rgba(20, 170, 112, 0.78)' : 'rgba(110, 185, 90, 0.72)';
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      for (let i = 0; i < 260; i += 1) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const cloudSize = 12 + Math.random() * 42;
        ctx.beginPath();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.38)';
        ctx.arc(x, y, cloudSize, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const drawJupiterTexture = () => {
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#d9a268');
      gradient.addColorStop(0.25, '#e8c78b');
      gradient.addColorStop(0.5, '#d8925d');
      gradient.addColorStop(0.75, '#c66f43');
      gradient.addColorStop(1, '#8b4d34');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let y = 0; y < canvas.height; y += 30) {
        ctx.fillStyle = y % 60 === 0 ? 'rgba(255, 247, 220, 0.35)' : 'rgba(113, 59, 29, 0.34)';
        ctx.fillRect(0, y, canvas.width, 18);
      }

      ctx.fillStyle = 'rgba(255, 245, 220, 0.7)';
      ctx.beginPath();
      ctx.ellipse(760, 660, 140, 90, -0.6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.32)';
      ctx.beginPath();
      ctx.ellipse(200, 300, 180, 100, 0.8, 0, Math.PI * 2);
      ctx.fill();
    };

    const drawSaturnTexture = () => {
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#f4d69a');
      gradient.addColorStop(0.3, '#e7c582');
      gradient.addColorStop(0.6, '#caa66a');
      gradient.addColorStop(1, '#9d7748');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let y = 0; y < canvas.height; y += 26) {
        ctx.fillStyle = y % 52 === 0 ? 'rgba(255, 245, 220, 0.18)' : 'rgba(120, 78, 30, 0.22)';
        ctx.fillRect(0, y, canvas.width, 15);
      }

      for (let i = 0; i < 140; i += 1) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.fillRect(x, y, Math.random() * 40 + 10, 3);
      }
    };

    const planetMap = {
      tierra: drawEarthTexture,
      jupiter: drawJupiterTexture,
      saturno: drawSaturnTexture,
    };

    if (planetMap[planetKey]) {
      planetMap[planetKey]();
      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      return texture;
    }

    return null;
  };

  const createPlanetMaterial = (planetKey, planetColor) => {
    const texture = createPlanetTexture(planetKey);
    return new THREE.MeshStandardMaterial({
      map: texture,
      color: planetColor,
      emissive: new THREE.Color(planetColor).multiplyScalar(0.18),
      emissiveIntensity: 0.22,
      roughness: 0.9,
      metalness: 0.15,
    });
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

    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(planet.radius, 64, 64),
      createPlanetMaterial(planet.key, planet.color)
    );
    mesh.position.set(planet.distanceScale, 0, 0);
    mesh.rotation.y = Math.random() * Math.PI;
    orbit.add(mesh);
    planetMeshes.push(mesh);

    const label = makeLabelSprite(planet.name);
    label.position.set(0, planet.radius + 5, 0);
    mesh.add(label);
    labelSprites.push(label);

    if (planet.name === 'Saturno') {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(planet.radius * 1.7, planet.radius * 2.45, 64),
        new THREE.MeshStandardMaterial({
          color: 0xe9d9b1,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.8,
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
    planet.mesh.scale.setScalar(1.12);
    renderPlanetInfoPanel(planet);
    controls.target.copy(planet.mesh.getWorldPosition(new THREE.Vector3()));
    camera.position.lerp(planet.mesh.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 18, 32)), 0.18);
  };

  const deselectPlanet = () => {
    if (!selectedPlanet) return;
    selectedPlanet.mesh.material.emissiveIntensity = 0.18;
    selectedPlanet.mesh.scale.setScalar(1);
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
