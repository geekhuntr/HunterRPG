/* Interactive viewer: orbit (mouse drag / one-finger), zoom (wheel / pinch), pan (right-drag / two-finger), reset, camera presets,
   articulation, part highlighting. Rendering is on demand to keep phones cool. */
(function (root) {
  const T = root.THREE, ST3D = root.ST3D;
  class Viewer {
    constructor(host, opts = {}) {
      this.host = host; this.opts = opts;
      this.renderer = new T.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: !!opts.preserve });
      this.renderer.setPixelRatio(Math.min(root.devicePixelRatio || 1, 2));
      this.renderer.outputEncoding = T.sRGBEncoding; this.renderer.toneMapping = T.ACESFilmicToneMapping; this.renderer.toneMappingExposure = 0.95;
      host.appendChild(this.renderer.domElement); this.canvas = this.renderer.domElement; this.canvas.style.touchAction = 'none'; this.canvas.style.display = 'block'; this.canvas.setAttribute('role', 'img');
      this.scene = new T.Scene(); this.scene.environment = ST3D.kit.makeEnv(this.renderer);
      const key = new T.DirectionalLight(0xffffff, 0.45); key.position.set(10, 20, 25); this.scene.add(key); this.scene.add(new T.HemisphereLight(0xffffff, 0x8794a0, 0.2));
      this.camera = new T.PerspectiveCamera(32, 1, 0.1, 200);
      this.controls = new T.OrbitControls(this.camera, this.canvas);
      Object.assign(this.controls, { enableDamping: true, dampingFactor: 0.12, minDistance: 2.2, maxDistance: 60, zoomSpeed: 1.1, rotateSpeed: 0.9 });
      this.controls.addEventListener('change', () => this.dirty());
      this.model = null; this.def = null; this.open = 0; this.tween = null; this._dirty = true;
      this.ro = new ResizeObserver(() => this.resize()); this.ro.observe(host);
      this.resize(); this.loop = this.loop.bind(this); requestAnimationFrame(this.loop);
    }
    dirty() { this._dirty = true; }
    destroy() { this.dead = true; try { this.ro.disconnect(); this.controls.dispose(); this.renderer.dispose(); this.renderer.forceContextLoss(); this.canvas.remove(); } catch (e) { /* ignore */ } }
    resize() {
      const w = Math.max(10, this.host.clientWidth), h = Math.max(10, this.host.clientHeight);
      this.renderer.setSize(w, h, false); this.canvas.style.width = '100%'; this.canvas.style.height = '100%';
      this.camera.aspect = w / h; this.camera.updateProjectionMatrix(); this.dirty();
    }
    load(id) {
      if (this.model) this.scene.remove(this.model.group);
      const def = ST3D.models[id]; this.def = def; this.model = def.build(); this.scene.add(this.model.group);
      this.canvas.setAttribute('aria-label', 'Interactive 3D model. Drag to rotate, scroll or pinch to zoom.');
      this.setOpen(0); this.highlight(null); this.view('front', true);
    }
    setOpen(k) { this.open = k; if (this.model && this.model.setOpen) this.model.setOpen(k); this.dirty(); }
    view(name, instant) {
      const v = this.def.views[name]; if (!v) return;
      const pos = new T.Vector3(...v.pos), tgt = new T.Vector3(...v.tgt), off = pos.clone().sub(tgt);
      // overview presets: back the camera off until the whole instrument fits this viewport's width (portrait phones)
      if (off.length() > 14 && this.model) {
        const half = Math.tan(T.MathUtils.degToRad(this.camera.fov / 2)), need = (this.model.size / 2) / (half * Math.min(1, this.camera.aspect)) * 1.08;
        if (need > off.length()) off.setLength(need);
      }
      this.goto(tgt.clone().add(off), tgt, instant);
    }
    goto(pos, tgt, instant) {
      if (instant) { this.camera.position.copy(pos); this.controls.target.copy(tgt); this.camera.lookAt(tgt); this.controls.update(); this.dirty(); return; }
      this.tween = { t0: performance.now(), d: 650, p0: this.camera.position.clone(), p1: pos, g0: this.controls.target.clone(), g1: tgt };
    }
    reset() { this.setOpen(0); this.highlight(null); this.view('front'); }
    highlight(part) {
      this.part = part;
      this.model && this.model.group.traverse(o => { if (o.isMesh) { const on = part && o.userData.part === part; o.material.emissive.setHex(on ? 0x0a7a96 : 0x000000); o.material.emissiveIntensity = on ? 0.9 : 0; } });
      this.dirty();
    }
    loop(now) {
      if (this.dead) return;
      requestAnimationFrame(this.loop);
      if (this.tween) {
        const k = Math.min(1, (now - this.tween.t0) / this.tween.d), e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
        this.camera.position.lerpVectors(this.tween.p0, this.tween.p1, e); this.controls.target.lerpVectors(this.tween.g0, this.tween.g1, e); this.camera.lookAt(this.controls.target);
        if (k >= 1) this.tween = null; this._dirty = true;
      }
      if (this.controls.update() || this._dirty) { this._dirty = false; this.renderer.render(this.scene, this.camera); }
    }
    // test hook: drive the same OrbitControls API used by pointer input
    rotateBy(dx, dy) { const o = this.camera.position.clone().sub(this.controls.target), s = new T.Spherical().setFromVector3(o); s.theta -= dx; s.phi = Math.min(3.1, Math.max(0.05, s.phi - dy)); o.setFromSpherical(s); this.camera.position.copy(this.controls.target).add(o); this.camera.lookAt(this.controls.target); this.dirty(); }
    distance() { return this.camera.position.distanceTo(this.controls.target); }
  }
  ST3D.Viewer = Viewer;
})(window);
