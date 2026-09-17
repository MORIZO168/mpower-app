"use client";
import { useEffect, useRef, useState } from "react";
import { centroid, toXY } from "@/lib/solar";
import { sunPosition, sunDir, annualSamples, exposureColor } from "@/lib/sun";

const TZ = 7; // เขตเวลาไทย
const MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
let OID = 1;

export default function Roof3D({ pts, tilt = 15, az = 180, rects = [], center, roofType = "pitched", onShading }) {
  const mountRef = useRef(null);
  const S = useRef({}); // เก็บ three objects
  const [ready, setReady] = useState(false);
  const [month, setMonth] = useState(3);
  const [hour, setHour] = useState(12);
  const [playing, setPlaying] = useState(false);
  const [obstacles, setObstacles] = useState([]);
  const [selId, setSelId] = useState(null);
  const [shade, setShade] = useState(null);
  const [computing, setComputing] = useState(false);
  const [sun, setSun] = useState({ alt: 0, az: 0 });

  const c = center && center.lat ? center : centroid(pts);

  // ---------- init scene ----------
  useEffect(() => {
    let alive = true;
    let raf = 0;
    (async () => {
      const THREE = await import("three");
      if (!alive || !mountRef.current) return;
      const el = mountRef.current;
      const W = el.clientWidth, H = el.clientHeight || 460;

      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(W, H);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      el.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      scene.background = new THREE.Color("#dfe7ef");

      const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 6000);

      // แสงท้องฟ้า + ดวงอาทิตย์
      const hemi = new THREE.HemisphereLight("#eaf2ff", "#4a5568", 0.75);
      scene.add(hemi);
      const sunLight = new THREE.DirectionalLight("#fff6e0", 1.15);
      sunLight.castShadow = true;
      sunLight.shadow.mapSize.set(2048, 2048);
      const sc = sunLight.shadow.camera;
      sc.near = 1; sc.far = 900; sc.left = -80; sc.right = 80; sc.top = 80; sc.bottom = -80;
      scene.add(sunLight);
      scene.add(sunLight.target);
      const sunBall = new THREE.Mesh(new THREE.SphereGeometry(2.2, 16, 16), new THREE.MeshBasicMaterial({ color: "#ffd23f" }));
      scene.add(sunBall);

      // พื้น
      const ground = new THREE.Mesh(
        new THREE.CircleGeometry(400, 48).rotateX(-Math.PI / 2),
        new THREE.MeshStandardMaterial({ color: "#c8d2c0" })
      );
      ground.receiveShadow = true;
      scene.add(ground);
      const grid = new THREE.GridHelper(400, 80, "#aeb8a8", "#bcc6b6");
      grid.position.y = 0.02; scene.add(grid);

      Object.assign(S.current, { THREE, renderer, scene, camera, sunLight, sunBall, panelMesh: null, obGroup: new THREE.Group() });
      scene.add(S.current.obGroup);

      buildRoof();
      // กล้อง orbit (เขียนเอง)
      const cam = { r: 90, theta: Math.PI * 0.25, phi: Math.PI * 0.32, tx: 0, ty: 3, tz: 0 };
      S.current.cam = cam;
      const applyCam = () => {
        const r = cam.r, st = Math.sin(cam.phi), ct = Math.cos(cam.phi);
        camera.position.set(cam.tx + r * st * Math.sin(cam.theta), cam.ty + r * ct, cam.tz + r * st * Math.cos(cam.theta));
        camera.lookAt(cam.tx, cam.ty, cam.tz);
      };
      applyCam();
      S.current.applyCam = applyCam;

      // pointer controls
      let drag = null;
      const dom = renderer.domElement;
      dom.style.touchAction = "none";
      dom.addEventListener("pointerdown", (e) => { drag = { x: e.clientX, y: e.clientY }; dom.setPointerCapture(e.pointerId); });
      dom.addEventListener("pointermove", (e) => {
        if (!drag) return;
        const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag = { x: e.clientX, y: e.clientY };
        cam.theta -= dx * 0.005;
        cam.phi = Math.max(0.08, Math.min(Math.PI / 2 - 0.05, cam.phi - dy * 0.005));
        applyCam();
      });
      dom.addEventListener("pointerup", () => { drag = null; });
      dom.addEventListener("wheel", (e) => { e.preventDefault(); cam.r = Math.max(20, Math.min(400, cam.r * (1 + Math.sign(e.deltaY) * 0.1))); applyCam(); }, { passive: false });

      const onResize = () => {
        const w = el.clientWidth, h = el.clientHeight || 460;
        renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix();
      };
      window.addEventListener("resize", onResize);
      S.current.onResize = onResize;

      const loop = () => {
        raf = requestAnimationFrame(loop);
        if (S.current.playRef) {
          S.current.hourF = (S.current.hourF || 12) + 0.03;
          if (S.current.hourF > 19) S.current.hourF = 6;
          S.current.setHourExt(Math.round(S.current.hourF * 10) / 10);
        }
        renderer.render(scene, camera);
      };
      loop();
      setReady(true);
      updateSun(month, hour);
    })();

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      const s = S.current;
      if (s.onResize) window.removeEventListener("resize", s.onResize);
      if (s.renderer) { s.renderer.dispose(); if (s.renderer.domElement?.parentNode) s.renderer.domElement.parentNode.removeChild(s.renderer.domElement); }
      S.current = {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ให้ loop เรียก setHour ได้
  useEffect(() => { S.current.setHourExt = setHour; S.current.playRef = playing; S.current.hourF = hour; }, [playing]); // eslint-disable-line

  // ---------- สร้างหลังคา + แผง ----------
  function buildRoof() {
    const s = S.current; const THREE = s.THREE; if (!THREE) return;
    const ref = centroid(pts);
    const P = pts.map((p) => toXY(p, ref)); // {x=east,y=north}
    const azr = az * Math.PI / 180, tr = tilt * Math.PI / 180;
    const flat = roofType === "flat";
    const slope = (E, N) => (flat ? 0 : -(E * Math.sin(azr) + N * Math.cos(azr)) * Math.tan(tr));
    const raw = P.map((p) => slope(p.x, p.y));
    const minRaw = Math.min(...raw, 0);
    const base = 2.8 - minRaw;
    const yOf = (E, N) => base + slope(E, N);

    // ศูนย์กลางหลังคา (ตั้ง target กล้อง)
    const cx = P.reduce((a, p) => a + p.x, 0) / P.length;
    const cz = P.reduce((a, p) => a + p.y, 0) / P.length;

    // roof surface (fan)
    const pos = [], idx = [];
    pos.push(cx, yOf(cx, cz), cz);
    P.forEach((p) => pos.push(p.x, yOf(p.x, p.y), p.y));
    for (let i = 0; i < P.length; i++) { const a = 1 + i, b = 1 + ((i + 1) % P.length); idx.push(0, a, b); }
    const rg = new THREE.BufferGeometry();
    rg.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    rg.setIndex(idx); rg.computeVertexNormals();
    const roof = new THREE.Mesh(rg, new THREE.MeshStandardMaterial({ color: flat ? "#c9ccd1" : "#8a5a3b", side: THREE.DoubleSide, roughness: 0.95 }));
    roof.receiveShadow = true; roof.castShadow = true;
    s.scene.add(roof);

    // walls (ผนังลงถึงพื้น)
    const wpos = [];
    for (let i = 0; i < P.length; i++) {
      const a = P[i], b = P[(i + 1) % P.length];
      const ay = yOf(a.x, a.y), by = yOf(b.x, b.y);
      wpos.push(a.x, 0, a.y, b.x, 0, b.y, b.x, by, b.y);
      wpos.push(a.x, 0, a.y, b.x, by, b.y, a.x, ay, a.y);
    }
    const wg = new THREE.BufferGeometry();
    wg.setAttribute("position", new THREE.Float32BufferAttribute(wpos, 3)); wg.computeVertexNormals();
    const walls = new THREE.Mesh(wg, new THREE.MeshStandardMaterial({ color: "#e9eaec", side: THREE.DoubleSide, roughness: 1 }));
    walls.receiveShadow = true; walls.castShadow = true; s.scene.add(walls);

    // ทิศ normal ของแผง (จาก tilt/az)
    const n = new THREE.Vector3(Math.sin(tr) * Math.sin(azr), Math.cos(tr), Math.sin(tr) * Math.cos(azr)).normalize();
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), n);
    s.arrayNormal = [n.x, n.y, n.z];

    // แผง (InstancedMesh)
    const R = rects.map((r) => r.map((cn) => toXY(cn, ref)));
    const count = R.length;
    const centers = [];
    if (count > 0) {
      const geo = new THREE.BoxGeometry(1, 0.06, 1);
      const mat = new THREE.MeshStandardMaterial({ color: "#ffffff", metalness: 0.15, roughness: 0.55 });
      const inst = new THREE.InstancedMesh(geo, mat, count);
      inst.castShadow = false; inst.receiveShadow = true;
      const m4 = new THREE.Matrix4(), sV = new THREE.Vector3(), pV = new THREE.Vector3();
      for (let i = 0; i < count; i++) {
        const r = R[i];
        const ex = (r[0].x + r[1].x + r[2].x + r[3].x) / 4;
        const nz = (r[0].y + r[1].y + r[2].y + r[3].y) / 4;
        const w = Math.hypot(r[1].x - r[0].x, r[1].y - r[0].y);
        const h = Math.hypot(r[2].x - r[1].x, r[2].y - r[1].y);
        const y = flat ? base + 0.35 : yOf(ex, nz) + 0.06;
        sV.set(Math.max(0.3, w) * 0.97, 1, Math.max(0.3, h) * 0.97);
        pV.set(ex, y, nz);
        m4.compose(pV, q, sV); inst.setMatrixAt(i, m4);
        inst.setColorAt(i, new THREE.Color("#1e5bd6"));
        centers.push([ex, y, nz]);
      }
      inst.instanceMatrix.needsUpdate = true;
      s.scene.add(inst);
      s.panelMesh = inst; s.panelCenters = centers;
    }

    s.roofTarget = { x: cx, y: base, z: cz };
    s.roofSpan = Math.max(20, ...P.map((p) => Math.hypot(p.x - cx, p.y - cz))) * 2.4;
  }

  // ---------- ตำแหน่งดวงอาทิตย์ ----------
  function updateSun(mo, hr) {
    const s = S.current; if (!s.sunLight) return;
    const d = new Date(Date.UTC(2025, mo - 1, 15, Math.floor(hr), Math.round((hr % 1) * 60), 0) - TZ * 3600000);
    const p = sunPosition(d, c.lat, c.lng);
    setSun({ alt: p.altitude, az: p.azimuth });
    const above = p.altitude > 0;
    const dir = sunDir(Math.max(p.altitude, -2), p.az || p.azimuth);
    const D = 260;
    const t = s.roofTarget || { x: 0, y: 3, z: 0 };
    s.sunLight.position.set(t.x + dir[0] * D, dir[1] * D, t.z + dir[2] * D);
    s.sunLight.target.position.set(t.x, t.y, t.z);
    s.sunLight.intensity = above ? 1.15 : 0.03;
    s.sunLight.visible = above;
    s.sunBall.position.copy(s.sunLight.position);
    s.sunBall.visible = above;
    if (s.applyCam && !s.centered) { s.cam.tx = t.x; s.cam.ty = t.y; s.cam.tz = t.z; s.cam.r = s.roofSpan || 90; s.applyCam(); s.centered = true; }
  }
  useEffect(() => { if (ready) updateSun(month, hour); }, [month, hour, ready]); // eslint-disable-line

  // ---------- สิ่งกีดขวาง ----------
  useEffect(() => {
    const s = S.current; const THREE = s.THREE; if (!ready || !THREE) return;
    while (s.obGroup.children.length) s.obGroup.remove(s.obGroup.children[0]);
    s.obMeshes = [];
    const t = s.roofTarget || { x: 0, z: 0 };
    obstacles.forEach((o) => {
      const dr = o.dir * Math.PI / 180;
      const ox = t.x + Math.sin(dr) * o.dist, oz = t.z + Math.cos(dr) * o.dist;
      let mesh;
      if (o.type === "tree") {
        const g = new THREE.Group();
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, o.height * 0.4, 8), new THREE.MeshStandardMaterial({ color: "#6b4a2b" }));
        trunk.position.y = o.height * 0.2; trunk.castShadow = true;
        const crown = new THREE.Mesh(new THREE.SphereGeometry(o.size, 12, 12), new THREE.MeshStandardMaterial({ color: o.id === selId ? "#2f9e44" : "#3aa856" }));
        crown.position.y = o.height * 0.4 + o.size * 0.7; crown.castShadow = true;
        g.add(trunk); g.add(crown); g.position.set(ox, 0, oz); mesh = g;
        s.obMeshes.push(crown);
      } else {
        const box = new THREE.Mesh(new THREE.BoxGeometry(o.size * 2, o.height, o.size * 2), new THREE.MeshStandardMaterial({ color: o.id === selId ? "#9aa0a6" : "#b8bcc2" }));
        box.position.set(ox, o.height / 2, oz); box.castShadow = true; box.receiveShadow = true; mesh = box;
        s.obMeshes.push(box);
      }
      s.obGroup.add(mesh);
    });
  }, [obstacles, selId, ready]); // eslint-disable-line

  // ---------- วิเคราะห์เงา (heatmap รายปี) ----------
  async function analyze() {
    const s = S.current; const THREE = s.THREE;
    if (!s.panelMesh || !s.panelCenters?.length) return;
    setComputing(true);
    await new Promise((r) => setTimeout(r, 30));
    const samples = annualSamples(c.lat, c.lng, TZ, 30);
    const n = new THREE.Vector3(...s.arrayNormal);
    const usable = samples.filter((sm) => n.x * sm.dir[0] + n.y * sm.dir[1] + n.z * sm.dir[2] > 0.02);
    const totW = usable.reduce((a, sm) => a + sm.weight, 0) || 1;
    const targets = [...(s.obMeshes || [])];
    const ray = new THREE.Raycaster(); ray.far = 500;
    const o = new THREE.Vector3(), dv = new THREE.Vector3();
    let sumExp = 0;
    const centers = s.panelCenters;
    for (let i = 0; i < centers.length; i++) {
      const [px, py, pz] = centers[i];
      o.set(px + n.x * 0.15, py + n.y * 0.15, pz + n.z * 0.15);
      let open = 0;
      for (const sm of usable) {
        dv.set(sm.dir[0], sm.dir[1], sm.dir[2]);
        ray.set(o, dv);
        let blocked = false;
        if (targets.length) { const hit = ray.intersectObjects(targets, true); if (hit.length && hit[0].distance > 0.2) blocked = true; }
        if (!blocked) open += sm.weight;
      }
      const exp = open / totW;
      sumExp += exp;
      s.panelMesh.setColorAt(i, new THREE.Color(exposureColor(exp)));
    }
    s.panelMesh.instanceColor.needsUpdate = true;
    const factor = sumExp / centers.length;
    setShade({ factor });
    onShading && onShading(factor);
    setComputing(false);
  }

  function resetColors() {
    const s = S.current; const THREE = s.THREE;
    if (!s.panelMesh) return;
    for (let i = 0; i < s.panelCenters.length; i++) s.panelMesh.setColorAt(i, new THREE.Color("#1e5bd6"));
    s.panelMesh.instanceColor.needsUpdate = true; setShade(null); onShading && onShading(1);
  }

  const addOb = (type) => { const o = { id: OID++, type, dist: 12, dir: az, height: type === "tree" ? 8 : 9, size: type === "tree" ? 2.5 : 4 }; setObstacles((a) => [...a, o]); setSelId(o.id); };
  const upd = (k, v) => setObstacles((a) => a.map((o) => (o.id === selId ? { ...o, [k]: v } : o)));
  const del = () => { setObstacles((a) => a.filter((o) => o.id !== selId)); setSelId(null); };
  const sel = obstacles.find((o) => o.id === selId);

  return (
    <div>
      <div className="card overflow-hidden relative">
        <div ref={mountRef} style={{ height: "56vh", minHeight: 360, width: "100%" }} />
        <div className="absolute z-10 left-3 top-3 bg-black/60 text-white text-[12px] px-2.5 py-1 rounded-lg">
          ลากเพื่อหมุน · สกอร์ลซูม · ดวงอาทิตย์ {sun.alt > 0 ? `สูง ${sun.alt.toFixed(0)}° ทิศ ${sun.az.toFixed(0)}°` : "ใต้ขอบฟ้า"}
        </div>
        {shade && (
          <div className="absolute z-10 right-3 top-3 bg-white/95 text-[12px] px-3 py-1.5 rounded-lg font-semibold text-[#1d1d1f]">
            รับแดดเฉลี่ย {(shade.factor * 100).toFixed(0)}% · เสียเงา {((1 - shade.factor) * 100).toFixed(0)}%
          </div>
        )}
      </div>

      {/* ควบคุมดวงอาทิตย์ */}
      <div className="card p-4 mt-3 space-y-3">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[#1d1d1f] text-sm">มุมมองดวงอาทิตย์</span>
          <button onClick={() => setPlaying((p) => !p)} className="ml-auto text-[12px] rounded-lg border border-[#e8e8ed] px-3 py-1 font-medium">
            {playing ? "⏸ หยุด" : "▶ เล่นทั้งวัน"}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex justify-between text-[12px] mb-1"><span className="text-[#6e6e73]">เดือน</span><span className="font-semibold">{MONTHS[month - 1]}</span></div>
            <input type="range" min="1" max="12" value={month} onChange={(e) => setMonth(+e.target.value)} className="w-full accent-[#F5821F]" />
          </div>
          <div>
            <div className="flex justify-between text-[12px] mb-1"><span className="text-[#6e6e73]">เวลา</span><span className="font-semibold">{String(Math.floor(hour)).padStart(2, "0")}:{String(Math.round((hour % 1) * 60)).padStart(2, "0")}</span></div>
            <input type="range" min="6" max="18" step="0.5" value={hour} onChange={(e) => { setPlaying(false); setHour(+e.target.value); }} className="w-full accent-[#F5821F]" />
          </div>
        </div>
      </div>

      {/* สิ่งกีดขวาง + วิเคราะห์ */}
      <div className="card p-4 mt-3 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-[#1d1d1f] text-sm">สิ่งกีดขวาง / เงา</span>
          <button onClick={() => addOb("tree")} className="text-[12px] rounded-lg border border-[#e8e8ed] px-3 py-1 font-medium">＋ ต้นไม้</button>
          <button onClick={() => addOb("building")} className="text-[12px] rounded-lg border border-[#e8e8ed] px-3 py-1 font-medium">＋ อาคารข้างเคียง</button>
          <button onClick={analyze} disabled={computing} className="ml-auto text-[13px] rounded-lg bg-[#F5821F] text-white px-4 py-1.5 font-semibold disabled:opacity-50">
            {computing ? "กำลังวิเคราะห์…" : "วิเคราะห์เงาทั้งปี"}
          </button>
          {shade && <button onClick={resetColors} className="text-[12px] rounded-lg border border-[#e8e8ed] px-3 py-1">ล้างสี</button>}
        </div>

        {obstacles.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {obstacles.map((o) => (
              <button key={o.id} onClick={() => setSelId(o.id)} className={`text-[12px] rounded-lg px-2.5 py-1 border ${o.id === selId ? "border-[#F5821F] text-[#F5821F] font-semibold" : "border-[#e8e8ed] text-[#6e6e73]"}`}>
                {o.type === "tree" ? "🌳" : "🏢"} {o.type === "tree" ? "ต้นไม้" : "อาคาร"}
              </button>
            ))}
          </div>
        )}

        {sel && (
          <div className="grid grid-cols-3 gap-3 bg-[#f7f7f8] rounded-xl p-3">
            <Slider label="ระยะห่าง (ม.)" min={2} max={40} value={sel.dist} onChange={(v) => upd("dist", v)} />
            <Slider label="ทิศ (°)" min={0} max={359} value={sel.dir} onChange={(v) => upd("dir", v)} />
            <Slider label="สูง (ม.)" min={2} max={30} value={sel.height} onChange={(v) => upd("height", v)} />
            <div className="col-span-3 flex justify-end"><button onClick={del} className="text-[12px] text-[#c0392b] font-medium">ลบสิ่งกีดขวางนี้</button></div>
          </div>
        )}

        {shade && (
          <div className="text-[12px] text-[#6e6e73]">
            แผงรับแดดเฉลี่ย <b className="text-[#1d1d1f]">{(shade.factor * 100).toFixed(0)}%</b> ของท้องฟ้าโปร่ง —
            <span className="text-[#F5821F] font-semibold">ส้ม=แดดเต็ม</span> · เหลือง=แดดอ่อน · <span className="text-[#1e5bd6] font-semibold">ฟ้า/น้ำเงิน=มุมอับ</span> · ผลผลิตหลังหักเงาแสดงในการ์ดผลผลิต
          </div>
        )}
        {!ready && <div className="text-[12px] text-[#6e6e73]">กำลังโหลดโมเดล 3 มิติ…</div>}
      </div>
    </div>
  );
}

function Slider({ label, min, max, value, onChange }) {
  return (
    <div>
      <div className="flex justify-between text-[11px] mb-1"><span className="text-[#6e6e73]">{label}</span><span className="font-semibold text-[#1d1d1f]">{Math.round(value)}</span></div>
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(+e.target.value)} className="w-full accent-[#F5821F]" />
    </div>
  );
}
