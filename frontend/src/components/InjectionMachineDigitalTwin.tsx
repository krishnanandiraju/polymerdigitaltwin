import { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Environment } from '@react-three/drei';
import * as THREE from 'three';

/**
 * MACHINE GEOMETRY  ─  everything lives on a single horizontal axis.
 *
 *  X-axis  ◄──────────────────────────────────────────────────────►
 *
 *  Injection Unit           Mould Zone          Clamping Unit
 *  x = -7 … -2.0           x = -2.0 … 0.6      x = 0.6 … 4.5
 *
 *  [Motor | Barrel+Screw | Nozzle]  Fixed Platen | Mould | Moving Platen  Toggle | Rear Platen
 *
 *  Rules applied throughout:
 *  • CylinderGeometry default axis = Y  →  rotation [0,0,π/2] to align with X
 *  • TorusGeometry encircling the X-axis barrel → rotation [π/2, 0, 0]
 *  • BoxGeometry platens are naturally YZ-plane slabs – no rotation needed
 */

// ─── Temperature → hex colour ──────────────────────────────────────────────
const tCol = (t: number, lo: number, hi: number) => {
    const n = Math.max(0, Math.min(1, (t - lo) / (hi - lo)));
    if (n < 0.20) return '#3b82f6';
    if (n < 0.40) return '#10b981';
    if (n < 0.60) return '#fbbf24';
    if (n < 0.80) return '#f97316';
    return '#ef4444';
};

// ─── Types ─────────────────────────────────────────────────────────────────
interface Vis {
    base: boolean;
    barrel: boolean;
    heaterBands: boolean;
    hopper: boolean;
    mould: boolean;
    clampUnit: boolean;
    coolingLines: boolean;
    hmi: boolean;
}

interface CavInfo { id: number; rr: number; wt: number; st: 'ok' | 'warn' | 'crit' }

// ─── Physically-Based Material props ────────────────────────────────────────
// Colors and PBR values matched to real industrial components:
const M = {
    // Electropolished 316L stainless — barrel, flanges, hopper
    steel:   { color: '#cfd1d3', metalness: 0.97 as number, roughness: 0.09 as number },
    // Dark painted cast-iron — machine base, gearbox housings
    dkSteel: { color: '#1c2228', metalness: 0.42 as number, roughness: 0.74 as number },
    // Mirror-polished chrome steel — tie bars, couplings, screw coupling
    chrome:  { color: '#e8eaec', metalness: 0.99 as number, roughness: 0.03 as number },
    // Beryllium-copper / brass — nozzle, hot-runner manifold
    brass:   { color: '#a07830', metalness: 0.88 as number, roughness: 0.16 as number },
    // Safety yellow RAL 1021 powder coat — clamping cylinder
    yellow:  { color: '#c8941a', metalness: 0.55 as number, roughness: 0.42 as number },
    // Gunmetal / dark cast iron — toggles, brackets, minor hardware
    dkGray:  { color: '#222830', metalness: 0.58 as number, roughness: 0.55 as number },
};

// ─── The 3-D machine scene ─────────────────────────────────────────────────
function MachineModel({ vis, selCav, onCav }: {
    vis: Vis; selCav: number | null; onCav: (id: number) => void
}) {
    const screwRef    = useRef<THREE.Mesh>(null);
    const [phase, setPhase]     = useState(0);          // 0..1 injection cycle
    const [open,  setOpen]      = useState(false);      // mould open flag
    const [zT,    setZT]        = useState([220, 235, 250, 265, 275]);   // heater zone temps
    const [mT,    setMT]        = useState(35);         // mould temp

    // ── Fixed cavity performance data ──────────────────────────────────────
    const cavs = useMemo<CavInfo[]>(() => {
        const bad = new Set([17, 23, 44]);
        return Array.from({ length: 48 }, (_, i) => {
            const id = i + 1;
            const rr = bad.has(id) ? 5 + Math.random() * 5 : Math.random() * 2.5;
            return { id, rr, wt: +(23.5 + (Math.random() - 0.5) * 0.3).toFixed(2),
                     st: rr > 5 ? 'crit' : rr > 2.5 ? 'warn' : 'ok' };
        });
    }, []);

    // ── Animation tick ──────────────────────────────────────────────────────
    useEffect(() => {
        const id = setInterval(() => {
            const t = Date.now() / 1000;
            setPhase(p => { const n = (p + 0.004) % 1; setOpen(n > 0.82); return n; });
            setZT([220, 235, 250, 265, 275].map((b, i) => b + Math.sin(t + i) * 3));
            setMT(35 + Math.sin(t * 0.4) * 2.5);
        }, 80);
        return () => clearInterval(id);
    }, []);

    useFrame(() => { if (screwRef.current) screwRef.current.rotation.x += 0.04; });

    // ── Derived positions ──────────────────────────────────────────────────
    //   Moving platen: closed x=0.3, open x=2.3
    const mpX  = open ? 2.3 : 0.3;
    //   Moving mould half face (left side of moving platen)
    const mmX  = mpX - 0.34;
    //   Screw advances 0.4 m during first 25 % of cycle, then retracts
    const sFwd = phase < 0.25 ? (phase / 0.25) * 0.4
               : phase < 0.50 ? 0.4
               : 0;

    return (
        <group>

            {/* ══════════════════════════════════════════
                MACHINE BASE — long foundation slab
                ══════════════════════════════════════════ */}
            {vis.base && (
                <group>
                    {/* Main plinth  length 12, centred at x=-1.5, y=-1.45 */}
                    <mesh position={[-1.5, -1.45, 0]} receiveShadow castShadow>
                        <boxGeometry args={[12.0, 0.28, 2.8]} />
                        <meshStandardMaterial {...M.dkSteel} />
                    </mesh>
                    {/* Four legs under base */}
                    {([ [-6.5,-1.4], [-6.5,1.4], [3.5,-1.4], [3.5,1.4] ] as [number,number][]).map(([x,z],i)=>(
                        <mesh key={i} position={[x,-2.05,z]} castShadow>
                            <boxGeometry args={[0.22,1.2,0.22]} />
                            <meshStandardMaterial {...M.dkSteel} />
                        </mesh>
                    ))}
                </group>
            )}

            {/* ══════════════════════════════════════════
                INJECTION UNIT
                Machine axis = X
                All horizontal cylinders: rotation [0,0,π/2]
                ══════════════════════════════════════════ */}
            {vis.barrel && (
                <group>
                    {/* Drive motor & gearbox — box at far left (dark industrial housing) */}
                    <mesh position={[-7.3, 0, 0]} castShadow>
                        <boxGeometry args={[1.0, 0.95, 0.95]} />
                        <meshStandardMaterial color="#1a2535" metalness={0.50} roughness={0.62} />
                    </mesh>
                    {/* Motor shaft coupling */}
                    <mesh position={[-6.75, 0, 0]} rotation={[0,0,Math.PI/2]}>
                        <cylinderGeometry args={[0.10, 0.10, 0.55, 20]} />
                        <meshStandardMaterial {...M.chrome} />
                    </mesh>

                    {/* ─── BARREL  (axis = X, length 4.6, radius 0.23)
                         Cylinder default axis is Y → rotation [0,0,π/2]
                         Centred at x = -4.7 ─────────────────────────────── */}
                    <mesh position={[-4.7, 0, 0]} rotation={[0,0,Math.PI/2]} castShadow receiveShadow>
                        <cylinderGeometry args={[0.23, 0.23, 4.6, 48]} />
                        <meshStandardMaterial {...M.steel} envMapIntensity={1.5} />
                    </mesh>

                    {/* Barrel end flange (thicker ring at nozzle end x=-2.4) */}
                    <mesh position={[-2.4, 0, 0]} rotation={[0,0,Math.PI/2]}>
                        <cylinderGeometry args={[0.32, 0.32, 0.14, 32]} />
                        <meshStandardMaterial {...M.dkSteel} />
                    </mesh>

                    {/* ─── RECIPROCATING SCREW (inside barrel, same axis)
                         Advances +sFwd along X during injection ──────────── */}
                    <mesh ref={screwRef}
                          position={[-4.6 + sFwd, 0, 0]}
                          rotation={[0,0,Math.PI/2]}>
                        <cylinderGeometry args={[0.14, 0.14, 4.1, 16]} />
                        <meshStandardMaterial color="#7c6f5a" metalness={0.7} roughness={0.4} />
                    </mesh>

                    {/* ─── NOZZLE (tapers toward +X, at x=-2.1)
                         ConeGeometry tip points +Y by default.
                         rotation [0,0,−π/2] redirects the tip to +X ─────── */}
                    <mesh position={[-2.0, 0, 0]} rotation={[0,0,-Math.PI/2]} castShadow>
                        <coneGeometry args={[0.23, 0.50, 32]} />
                        <meshStandardMaterial {...M.brass}
                            emissive="#c9a961" emissiveIntensity={0.28} />
                    </mesh>
                </group>
            )}

            {/* ══════════════════════════════════════════
                HEATER BANDS — 5 zones around the barrel
                Torus default lies in XY plane.
                To form a ring encircling X-axis: rotation [π/2,0,0]
                ══════════════════════════════════════════ */}
            {vis.heaterBands && zT.map((temp, i) => {
                const xPos = -6.6 + i * 0.90;   // spread evenly along barrel
                const col  = tCol(temp, 200, 290);
                const glow = temp > 250 ? 0.70 : 0.32;
                return (
                    <group key={i} position={[xPos, 0, 0]}>
                        {/* Main heater band ring */}
                        <mesh rotation={[Math.PI/2, 0, 0]}>
                            <torusGeometry args={[0.255, 0.030, 16, 80]} />
                            <meshStandardMaterial color={col} metalness={0.4} roughness={0.3}
                                emissive={col} emissiveIntensity={glow} />
                        </mesh>
                        {/* Thin edge rails (two narrow rings per band) */}
                        {[0.16,-0.16].map((dz,j)=>(
                            <mesh key={j} position={[0,0,dz]} rotation={[Math.PI/2, 0, 0]}>
                                <torusGeometry args={[0.255, 0.010, 8, 80]} />
                                <meshStandardMaterial {...M.dkGray} />
                            </mesh>
                        ))}
                        {/* Temperature tag */}
                        <Html position={[0, 0.46, 0]} center>
                            <div style={{
                                background:'rgba(15,23,42,0.92)', border:`1px solid ${col}`,
                                color:col, fontSize:10, fontWeight:700,
                                padding:'2px 7px', borderRadius:4, whiteSpace:'nowrap',
                            }}>Z{i+1} {temp.toFixed(0)}°C</div>
                        </Html>
                    </group>
                );
            })}

            {/* ══════════════════════════════════════════
                HOPPER — sits vertically above barrel feed-throat
                CylinderGeometry default axis = Y, so NO rotation needed.
                ══════════════════════════════════════════ */}
            {vis.hopper && (
                <group position={[-5.6, 0, 0]}>
                    {/* Feed throat — short vertical cylinder from barrel top */}
                    <mesh position={[0, 0.42, 0]} castShadow>
                        <cylinderGeometry args={[0.155, 0.155, 0.64, 24]} />
                        <meshStandardMaterial {...M.dkSteel} />
                    </mesh>
                    {/* Hopper body — wider at top (inverted cone shape) */}
                    <mesh position={[0, 1.55, 0]} castShadow>
                        <cylinderGeometry args={[0.68, 0.155, 1.85, 32]} />
                        <meshStandardMaterial {...M.steel} envMapIntensity={1.2} />
                    </mesh>
                    {/* Top rim ring */}
                    <mesh position={[0, 2.5, 0]}>
                        <torusGeometry args={[0.70, 0.036, 12, 64]} />
                        <meshStandardMaterial {...M.dkSteel} />
                    </mesh>
                    {/* Fill-level indicator band */}
                    <mesh position={[0, 1.45, 0]}>
                        <torusGeometry args={[0.685, 0.020, 8, 64]} />
                        <meshStandardMaterial color="#fbbf24" metalness={0.2} roughness={0.7} />
                    </mesh>
                    <Html position={[0,2.76,0]} center>
                        <div style={{background:'rgba(15,23,42,0.9)',border:'1px solid #60a5fa',
                            color:'#93c5fd',fontSize:10,fontWeight:600,padding:'2px 7px',borderRadius:4}}>
                            Hopper 78%
                        </div>
                    </Html>
                </group>
            )}

            {/* ══════════════════════════════════════════
                FIXED PLATEN  x = -1.75
                Vertical steel slab (YZ plane) — no rotation.
                ══════════════════════════════════════════ */}
            {vis.clampUnit && (
                <mesh position={[-1.75, 0, 0]} castShadow receiveShadow>
                    <boxGeometry args={[0.30, 2.90, 2.65]} />
                    <meshStandardMaterial {...M.dkSteel} />
                </mesh>
            )}

            {/* ══════════════════════════════════════════
                FOUR TIE BARS  — horizontal cylinders along X
                CylinderGeometry axis = Y → rotation [0,0,π/2]
                Corner positions in YZ: (±1.12, ±0.96)
                ══════════════════════════════════════════ */}
            {vis.clampUnit && (
                ([ [1.12,0.96],[1.12,-0.96],[-1.12,0.96],[-1.12,-0.96] ] as [number,number][])
                .map(([y,z],i)=>(
                    <group key={i}>
                        {/* Tie bar shaft — spans from x=-2.05 to x=4.35 (length 6.4) centred at x=1.15 */}
                        <mesh position={[1.15, y, z]} rotation={[0,0,Math.PI/2]} castShadow>
                            <cylinderGeometry args={[0.098, 0.098, 6.4, 24]} />
                            <meshStandardMaterial {...M.chrome} />
                        </mesh>
                        {/* End nuts */}
                        {([-2.05, 4.35] as number[]).map((xOff,j)=>(
                            <mesh key={j} position={[xOff, y, z]} rotation={[0,0,Math.PI/2]}>
                                <cylinderGeometry args={[0.17, 0.17, 0.20, 12]} />
                                <meshStandardMaterial {...M.dkGray} />
                            </mesh>
                        ))}
                    </group>
                ))
            )}

            {/* ══════════════════════════════════════════
                MOULD (both halves + 48 cavities)
                Fixed half at x=-1.44, moving half slides with moving platen.
                ══════════════════════════════════════════ */}
            {vis.mould && (
                <group>
                    {/* Fixed mould half */}
                    <mesh position={[-1.44, 0, 0]} castShadow receiveShadow>
                        <boxGeometry args={[0.34, 2.0, 1.90]} />
                        <meshStandardMaterial
                            color={tCol(mT,28,55)} metalness={0.96} roughness={0.06}
                            envMapIntensity={2.2} />
                    </mesh>

                    {/* Hot-runner manifold (behind fixed half) */}
                    <mesh position={[-1.65, 0, 0]}>
                        <boxGeometry args={[0.16, 1.55, 1.52]} />
                        <meshStandardMaterial {...M.brass} emissive="#c9a961" emissiveIntensity={0.38}/>
                    </mesh>

                    {/* Moving mould half (follows moving platen) */}
                    <mesh position={[mmX, 0, 0]} castShadow receiveShadow>
                        <boxGeometry args={[0.34, 2.0, 1.90]} />
                        <meshStandardMaterial
                            color={tCol(mT,28,55)} metalness={0.96} roughness={0.06}
                            envMapIntensity={2.2} />
                    </mesh>

                    {/* ── 48 Cavities on the fixed-half parting face
                         8 cols (Z-axis) × 6 rows (Y-axis)
                         Each cavity is a short cylinder pointing along X
                         rotation [0,0,π/2] ─────────────────────────────── */}
                    {Array.from({length:48},(_,k)=>{
                        const row = Math.floor(k/8), col = k%8;
                        const y   = (row - 2.5) * 0.29;
                        const z   = (col - 3.5) * 0.225;
                        const c   = cavs[k];
                        const sel = selCav === c.id;
                        const clr = c.st==='crit'?'#ef4444': c.st==='warn'?'#f59e0b':'#10b981';
                        return (
                            <group key={k} position={[-1.26, y, z]}>
                                <mesh
                                    rotation={[0,0,Math.PI/2]}
                                    onClick={e=>{e.stopPropagation(); onCav(c.id);}}
                                    onPointerOver={e=>{e.stopPropagation();(e.object as THREE.Mesh).scale.setScalar(1.35);}}
                                    onPointerOut={e=>{(e.object as THREE.Mesh).scale.setScalar(1);}}
                                >
                                    <cylinderGeometry args={[0.040, 0.032, 0.28, 16]} />
                                    <meshStandardMaterial
                                        color={sel?'#fbbf24':clr} metalness={0.6} roughness={0.3}
                                        emissive={sel?'#f59e0b':clr} emissiveIntensity={sel?1.0:0.22}
                                    />
                                </mesh>
                                {sel && (
                                    <Html position={[0.32,0.18,0]} center>
                                        <div style={{background:'rgba(15,23,42,0.97)',border:'1px solid #fbbf24',
                                            color:'#fff',fontSize:10,padding:'4px 9px',borderRadius:5,minWidth:105}}>
                                            <b style={{color:'#fbbf24'}}>Cavity {c.id}</b><br/>
                                            Reject: <span style={{color:c.st==='crit'?'#f87171':'#fbbf24'}}>{c.rr.toFixed(1)}%</span><br/>
                                            Weight: {c.wt} g
                                        </div>
                                    </Html>
                                )}
                            </group>
                        );
                    })}
                </group>
            )}

            {/* ══════════════════════════════════════════
                MOVING PLATEN — slides along X
                ══════════════════════════════════════════ */}
            {vis.clampUnit && (
                <mesh position={[mpX, 0, 0]} castShadow receiveShadow>
                    <boxGeometry args={[0.30, 2.90, 2.65]} />
                    <meshStandardMaterial {...M.dkSteel} />
                </mesh>
            )}

            {/* ══════════════════════════════════════════
                REAR PLATEN + CLAMPING CYLINDER + TOGGLE
                ══════════════════════════════════════════ */}
            {vis.clampUnit && (
                <group>
                    {/* Rear (tail) platen x=4.25 */}
                    <mesh position={[4.25, 0, 0]} castShadow>
                        <boxGeometry args={[0.30, 2.90, 2.65]} />
                        <meshStandardMaterial {...M.dkSteel} />
                    </mesh>

                    {/* Main clamping hydraulic cylinder barrel — axis = X
                        CylinderGeometry → rotation [0,0,π/2]
                        Centred at x=2.75, radius 0.40, length 3.0 */}
                    <mesh position={[2.75, 0, 0]} rotation={[0,0,Math.PI/2]} castShadow>
                        <cylinderGeometry args={[0.40, 0.40, 3.0, 32]} />
                        <meshStandardMaterial {...M.yellow} />
                    </mesh>

                    {/* Piston rod (chrome) — shorter section connecting cylinder to moving platen */}
                    <mesh position={[(mpX + 1.24) / 2, 0, 0]} rotation={[0,0,Math.PI/2]}>
                        <cylinderGeometry args={[0.190, 0.190, Math.abs(1.24 - mpX) + 0.1, 24]} />
                        <meshStandardMaterial {...M.chrome} />
                    </mesh>

                    {/* Toggle links — two angled bars either side of centreline */}
                    {([0.55,-0.55] as number[]).map((y,i)=>(
                        <mesh key={i}
                              position={[mpX + 1.1, y * 0.62, 0]}
                              rotation={[0, 0, Math.PI/6 * (i===0?1:-1)]}>
                            <boxGeometry args={[1.55, 0.12, 0.12]} />
                            <meshStandardMaterial {...M.dkGray} />
                        </mesh>
                    ))}

                    {/* Ejector cylinder (small, behind moving platen) */}
                    <mesh position={[mpX + 0.26, 0, 0]} rotation={[0,0,Math.PI/2]}>
                        <cylinderGeometry args={[0.10, 0.10, 0.36, 16]} />
                        <meshStandardMaterial color="#94a3b8" metalness={0.7} roughness={0.3} />
                    </mesh>
                </group>
            )}

            {/* ══════════════════════════════════════════
                COOLING WATER LINES (inside mould zone)
                Horizontal pipes along X → rotation [0,0,π/2]
                ══════════════════════════════════════════ */}
            {vis.coolingLines && (
                <group>
                    {([ [0.72,0.82],[0.72,-0.82],[-0.72,0.82],[-0.72,-0.82] ] as [number,number][]).map(([y,z],i)=>(
                        <mesh key={i} position={[-1.1, y, z]} rotation={[0,0,Math.PI/2]}>
                            <cylinderGeometry args={[0.052, 0.052, 0.60, 20]} />
                            <meshStandardMaterial color="#3b82f6" metalness={0.4} roughness={0.3}
                                emissive="#60a5fa" emissiveIntensity={0.45} transparent opacity={0.82} />
                        </mesh>
                    ))}
                </group>
            )}

            {/* ══════════════════════════════════════════
                CONTROL CABINET / HMI
                ══════════════════════════════════════════ */}
            {vis.hmi && (
                <group position={[2.5, 0, -2.1]}>
                    <mesh castShadow>
                        <boxGeometry args={[1.0, 1.85, 0.52]} />
                        <meshStandardMaterial color="#1e293b" metalness={0.45} roughness={0.6} />
                    </mesh>
                    {/* HMI touchscreen */}
                    <mesh position={[0, 0.3, 0.27]}>
                        <boxGeometry args={[0.62, 0.46, 0.02]} />
                        <meshStandardMaterial color="#0f172a" emissive="#0ea5e9"
                            emissiveIntensity={0.45} roughness={0.1} />
                    </mesh>
                    {/* Status bar */}
                    <mesh position={[0, 0.98, 0.27]}>
                        <boxGeometry args={[0.82, 0.06, 0.02]} />
                        <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.7}/>
                    </mesh>
                    <Html position={[0, 1.35, 0]} center>
                        <div style={{background:'rgba(15,23,42,0.9)',border:'1px solid #60a5fa',
                            color:'#93c5fd',fontSize:10,padding:'2px 7px',borderRadius:4}}>
                            HMI Control
                        </div>
                    </Html>
                </group>
            )}

            {/* Machine name label */}
            <Html position={[-1.5, 2.8, 0]} center>
                <div style={{background:'rgba(15,23,42,0.92)',border:'1px solid #f97316',
                    padding:'4px 14px',borderRadius:6,color:'#ff6b35',fontWeight:700,
                    fontSize:13,letterSpacing:'0.06em',whiteSpace:'nowrap'}}>
                    INJECTION MOULDING MACHINE — LINE 1
                </div>
            </Html>
        </group>
    );
}

// ─── Exported page component ─────────────────────────────────────────────────
export default function InjectionMachineDigitalTwin() {
    const [vis, setVis] = useState<Vis>({
        base: true, barrel: true, heaterBands: true, hopper: true,
        mould: true, clampUnit: true, coolingLines: true, hmi: true,
    });
    const [selCav, setSelCav] = useState<number | null>(null);
    const tog = (k: keyof Vis) => setVis(p => ({ ...p, [k]: !p[k] }));

    const entries: [keyof Vis, string][] = [
        ['base',        'Machine Base + Legs'],
        ['barrel',      'Barrel + Screw + Nozzle'],
        ['heaterBands', 'Heater Bands (5 Zones)'],
        ['hopper',      'Material Hopper'],
        ['mould',       'Mould + 48 Cavities'],
        ['clampUnit',   'Clamping Unit + Tie Bars'],
        ['coolingLines','Cooling Water Lines'],
        ['hmi',         'Control Cabinet (HMI)'],
    ];

    return (
        <div className="flex-1 w-full min-h-0 bg-gradient-to-b from-dark-900 to-dark-800 rounded-xl overflow-hidden flex flex-col">

            {/* Header — fixed height, in normal flow */}
            <div className="flex-shrink-0 bg-dark-900/90 backdrop-blur-sm border-b border-gray-700 px-5 py-3 z-10">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            ⚡ Injection Moulding Machine — Digital Twin
                        </h2>
                        <p className="text-xs text-gray-400 mt-0.5">
                            Drag to rotate · Scroll to zoom · Click a cavity to inspect
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-sm text-green-400 font-semibold">RUNNING</span>
                    </div>
                </div>
            </div>

            {/* Canvas area — flex-1 so it fills exactly the space between header and footer */}
            <div className="relative flex-1 min-h-0">

                {/* Component visibility panel — absolute inside canvas area */}
                <div className="absolute top-3 left-3 z-10 bg-dark-900/96 backdrop-blur-sm border border-gray-700 rounded-lg p-3 w-58">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                        Show / Hide
                    </p>
                    <div className="space-y-1.5">
                        {entries.map(([k,label])=>(
                            <label key={k} className="flex items-center gap-2 cursor-pointer group">
                                <input type="checkbox" checked={vis[k]} onChange={()=>tog(k)}
                                    className="w-3.5 h-3.5 rounded accent-orange-500 cursor-pointer" />
                                <span className="text-[11px] text-gray-300 group-hover:text-white leading-tight">{label}</span>
                            </label>
                        ))}
                    </div>
                    <div className="mt-3 pt-2 border-t border-gray-700 space-y-1">
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Cavity Legend</p>
                        {[['#10b981','< 2.5 % ✓'], ['#f59e0b','2.5 – 5 % ⚠'], ['#ef4444','> 5 % ✗ Critical']].map(([c,l])=>(
                            <div key={l} className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{background:c}}/>
                                <span className="text-[10px] text-gray-400">{l}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 3-D canvas — fills the canvas area div exactly */}
                <Canvas
                    shadows
                    style={{width:'100%',height:'100%',background:'linear-gradient(180deg,#060b12,#0b1420)'}}
                    camera={{position:[0, 3, 11], fov:55}}
                    onCreated={({ gl }) => {
                        gl.toneMapping = THREE.ACESFilmicToneMapping;
                        gl.toneMappingExposure = 1.15;
                    }}
                >
                    {/* Photorealistic industrial lighting rig */}
                    <ambientLight intensity={0.15} color="#c8d8ee" />
                    {/* Key light — strong overhead from front-right */}
                    <spotLight position={[6,14,9]} angle={0.28} penumbra={0.85} intensity={3.8}
                        castShadow color="#fff4e8" shadow-mapSize={[2048,2048]} />
                    {/* Soft fill from opposite-left */}
                    <spotLight position={[-9,11,-7]} angle={0.42} penumbra={1} intensity={2.6}
                        castShadow color="#f0f5ff" />
                    {/* Rim / back light for metallic edge definition */}
                    <pointLight position={[0,0,-10]} intensity={2.0} color="#e8f0ff" />
                    {/* Warm heater/process glow */}
                    <pointLight position={[-4,1.5,3]} intensity={0.85} color="#ff7a40" />
                    {/* Under-fill — prevents pure-black shadows */}
                    <pointLight position={[0,-1,5]} intensity={0.45} color="#aac0d8" />
                    {/* Studio environment gives clean neutral chrome reflections */}
                    <Environment preset="studio" background={false} />

                    <OrbitControls enablePan enableZoom enableRotate
                        minDistance={4} maxDistance={24}
                        maxPolarAngle={Math.PI/2}
                        target={[-1.5, 0, 0]} />

                    <MachineModel vis={vis} selCav={selCav} onCav={setSelCav} />

                    {/* Factory floor — dark polished epoxy */}
                    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-2.05,0]} receiveShadow>
                        <planeGeometry args={[42,28]} />
                        <meshStandardMaterial color="#0e1318" metalness={0.28} roughness={0.62} />
                    </mesh>
                </Canvas>
            </div>

            {/* KPI bar — fixed height, in normal flow below the canvas */}
            <div className="flex-shrink-0 bg-dark-900/92 backdrop-blur-sm border-t border-gray-700 px-4 py-3 z-10">
                <div className="grid grid-cols-5 gap-3">
                    {[
                        {l:'Cycle Time',      v:'28.4 s',  s:'Target 30 s',       c:'text-green-400'},
                        {l:'Reject Rate',     v:'2.8 %',   s:'↑ +0.3% vs avg',    c:'text-yellow-400'},
                        {l:'Shots Today',     v:'15,420',  s:'48-cavity mould',   c:'text-blue-400'},
                        {l:'Problem Cavities',v:'#17 #23 #44',s:'> 5 % reject',  c:'text-red-400'},
                        {l:'OEE',             v:'94.2 %',  s:'140 hrs runtime',   c:'text-green-400'},
                    ].map(({l,v,s,c})=>(
                        <div key={l} className="bg-dark-800/50 rounded-lg px-3 py-2 border border-gray-700">
                            <div className="text-[10px] text-gray-400 mb-0.5">{l}</div>
                            <div className={`text-base font-bold ${c}`}>{v}</div>
                            <div className="text-[10px] text-gray-500 mt-0.5">{s}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
