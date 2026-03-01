import { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Html, Environment } from '@react-three/drei';
import * as THREE from 'three';

// 3D Dryer Model Component
function DryerModel() {
    const groupRef = useRef<THREE.Group>(null);
    const [temperature, setTemperature] = useState(170);
    const [pressure, setPressure] = useState(2.5);
    const [humidity, setHumidity] = useState(15);

    // Create geometries once using useMemo to avoid recreating on every render
    const cylinderGeometry = useMemo(() => new THREE.CylinderGeometry(1, 1, 3, 32), []);
    const coneGeometry = useMemo(() => new THREE.ConeGeometry(1, 0.5, 32), []);
    const torusGeometry = useMemo(() => new THREE.TorusGeometry(1.1, 0.05, 16, 100), []);

    // Simulate real-time data updates
    useEffect(() => {
        const interval = setInterval(() => {
            setTemperature(170 + (Math.random() - 0.5) * 5);
            setPressure(2.5 + (Math.random() - 0.5) * 0.3);
            setHumidity(Math.max(0, Math.min(100, 15 + (Math.random() - 0.5) * 5)));
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    // Rotate the model slowly
    useFrame((state) => {
        if (groupRef.current) {
            groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
        }
    });

    return (
        <group ref={groupRef} position={[0, 0, 0]}>
            {/* Main Dryer Body — 316L electro-polished stainless steel */}
            <mesh position={[0, 0, 0]} castShadow receiveShadow>
                <primitive object={cylinderGeometry} />
                <meshStandardMaterial
                    color="#d2d4d6"
                    metalness={0.97}
                    roughness={0.07}
                    envMapIntensity={2.4}
                />
            </mesh>

            {/* Top Cone — spun aluminium transition head */}
            <mesh position={[0, 1.75, 0]} castShadow receiveShadow>
                <primitive object={coneGeometry} />
                <meshStandardMaterial
                    color="#cacccf"
                    metalness={0.95}
                    roughness={0.10}
                    envMapIntensity={2.0}
                />
            </mesh>

            {/* Bottom Cone (Hopper) — spun aluminium outlet */}
            <mesh position={[0, -1.75, 0]} rotation={[Math.PI, 0, 0]} castShadow receiveShadow>
                <primitive object={coneGeometry} />
                <meshStandardMaterial
                    color="#cacccf"
                    metalness={0.95}
                    roughness={0.10}
                    envMapIntensity={2.0}
                />
            </mesh>

            {/* Heating Elements — nichrome wire with radiant heat glow */}
            {[-0.8, 0, 0.8].map((y, i) => (
                <mesh key={i} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
                    <primitive object={torusGeometry} />
                    <meshStandardMaterial
                        color="#b03a00"
                        metalness={0.12}
                        roughness={0.60}
                        emissive="#ff5500"
                        emissiveIntensity={2.6}
                    />
                </mesh>
            ))}

            {/* Control Panel - Industrial Dark Gray */}
            <mesh position={[1.3, 0, 0]} castShadow receiveShadow>
                <boxGeometry args={[0.3, 1.5, 0.5]} />
                <meshStandardMaterial
                    color="#2d3748"
                    metalness={0.4}
                    roughness={0.6}
                />
            </mesh>

            {/* Viewing Window - Glass with realistic transparency */}
            <mesh position={[0, 0.5, 1.05]}>
                <circleGeometry args={[0.3, 32]} />
                <meshPhysicalMaterial
                    color="#ffffff"
                    metalness={0.1}
                    roughness={0.05}
                    transparent
                    opacity={0.4}
                    transmission={0.9}
                    thickness={0.1}
                />
            </mesh>

            {/* Insulation Bands - Yellow/Orange Safety Stripes */}
            {[-1.2, 1.2].map((y, i) => (
                <mesh key={`band-${i}`} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
                    <torusGeometry args={[1.05, 0.03, 16, 100]} />
                    <meshStandardMaterial
                        color="#fbbf24"
                        metalness={0.2}
                        roughness={0.7}
                    />
                </mesh>
            ))}

            {/* Support Legs */}
            {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((angle, i) => (
                <mesh
                    key={`leg-${i}`}
                    position={[Math.cos(angle) * 0.9, -2.3, Math.sin(angle) * 0.9]}
                    castShadow
                >
                    <cylinderGeometry args={[0.05, 0.08, 0.6, 16]} />
                    <meshStandardMaterial
                        color="#4a5568"
                        metalness={0.85}
                        roughness={0.25}
                    />
                </mesh>
            ))}

            {/* Sensor Labels */}
            <Html position={[0, 2.5, 0]} center>
                <div className="bg-dark-900/90 backdrop-blur-sm rounded-lg px-3 py-2 border border-orange-500/50 shadow-lg">
                    <div className="text-xs font-bold text-orange-400">RESIN DRYER</div>
                    <div className="text-xs text-gray-400">Model: RD-3000</div>
                </div>
            </Html>

            {/* Temperature Indicator */}
            <Html position={[1.5, 0.8, 0]} center>
                <div className="bg-red-900/90 backdrop-blur-sm rounded px-2 py-1 border border-red-500/50">
                    <div className="text-xs text-red-300">
                        {temperature.toFixed(1)}°C
                    </div>
                </div>
            </Html>

            {/* Pressure Indicator */}
            <Html position={[1.5, 0, 0]} center>
                <div className="bg-blue-900/90 backdrop-blur-sm rounded px-2 py-1 border border-blue-500/50">
                    <div className="text-xs text-blue-300">
                        {pressure.toFixed(1)} bar
                    </div>
                </div>
            </Html>

            {/* Humidity Indicator */}
            <Html position={[1.5, -0.8, 0]} center>
                <div className="bg-green-900/90 backdrop-blur-sm rounded px-2 py-1 border border-green-500/50">
                    <div className="text-xs text-green-300">
                        {humidity.toFixed(0)}% RH
                    </div>
                </div>
            </Html>
        </group>
    );
}

// Main Digital Twin Component
function DryerDigitalTwin() {
    return (
        <div className="flex-1 w-full min-h-0 bg-gradient-to-b from-dark-900 to-dark-800 rounded-xl overflow-hidden flex flex-col">
            {/* Title Header — in-flow, fixed height */}
            <div className="flex-shrink-0 bg-dark-900/80 backdrop-blur-sm border-b border-gray-700 p-4 z-10">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center">
                            <span className="text-3xl mr-3">🔥</span>
                            Resin Dryer - Digital Twin
                        </h2>
                        <p className="text-sm text-gray-400 mt-1">Real-time 3D visualization with live sensor data</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm text-green-400 font-semibold">OPERATIONAL</span>
                    </div>
                </div>
            </div>

            {/* Canvas area — fills remaining space */}
            <div className="relative flex-1 min-h-0">
                {/* Controls hint */}
                <div className="absolute top-3 right-3 z-10 bg-dark-900/70 backdrop-blur-sm rounded-lg p-3 border border-gray-700 text-xs text-gray-400">
                    <div className="font-semibold text-white mb-1">Controls</div>
                    <div>🖱️ Drag: Rotate</div>
                    <div>🖱️ Right drag: Pan</div>
                    <div>🖱️ Scroll: Zoom</div>
                </div>

                {/* 3D Canvas */}
                <Canvas
                    shadows
                    className="w-full h-full"
                    style={{ background: 'linear-gradient(to bottom, #050b12, #0c1520)' }}
                    onCreated={({ gl }) => {
                        gl.toneMapping = THREE.ACESFilmicToneMapping;
                        gl.toneMappingExposure = 1.15;
                    }}
                >
                    {/* Photorealistic industrial lighting rig */}
                    <ambientLight intensity={0.14} color="#c8d8ee" />

                    {/* Key light — strong from top-front-right */}
                    <spotLight
                        position={[8, 14, 8]}
                        angle={0.26}
                        penumbra={0.85}
                        intensity={4.5}
                        castShadow
                        color="#fff3e0"
                        shadow-mapSize-width={2048}
                        shadow-mapSize-height={2048}
                        shadow-bias={-0.0001}
                    />

                    {/* Soft fill — opposite-left side */}
                    <pointLight position={[-7, 6, -6]} intensity={2.0} color="#ddeeff" />

                    {/* Rim / back light — metallic edge definition */}
                    <pointLight position={[0, 4, -12]} intensity={2.4} color="#e8f0ff" />

                    {/* Industrial overhead spot */}
                    <spotLight
                        position={[-8, 12, 4]}
                        angle={0.36}
                        penumbra={1}
                        intensity={2.4}
                        color="#fffbef"
                        castShadow
                    />

                    {/* Warm heat glow from nichrome rings */}
                    <pointLight position={[0.5, 0, 1.5]} intensity={1.2} color="#ff6010" />

                    {/* Under-fill to avoid pure-black shadows */}
                    <pointLight position={[0, -4, 3]} intensity={0.4} color="#aac0d8" />

                    {/* Studio environment — clean neutral reflections on stainless */}
                    <Environment preset="studio" background={false} />

                    {/* Camera */}
                    <PerspectiveCamera makeDefault position={[4, 2, 4]} fov={50} />

                    {/* Controls */}
                    <OrbitControls
                        enablePan={true}
                        enableZoom={true}
                        enableRotate={true}
                        minDistance={3}
                        maxDistance={15}
                        maxPolarAngle={Math.PI / 2}
                    />

                    {/* 3D Model */}
                    <DryerModel />

                    {/* Industrial Floor — dark polished epoxy */}
                    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3, 0]} receiveShadow>
                        <planeGeometry args={[24, 24]} />
                        <meshStandardMaterial
                            color="#0c1118"
                            metalness={0.30}
                            roughness={0.60}
                        />
                    </mesh>
                </Canvas>
            </div>

            {/* Bottom Status Panel — in-flow, fixed height */}
            <div className="flex-shrink-0 bg-dark-900/90 backdrop-blur-sm border-t border-gray-700 p-4 z-10">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-dark-800/50 rounded-lg p-3 border border-gray-700">
                        <div className="text-xs text-gray-400 mb-1">Operating Time</div>
                        <div className="text-lg font-bold text-white">142.5 hrs</div>
                        <div className="text-xs text-green-400 mt-1">↑ Continuous</div>
                    </div>
                    <div className="bg-dark-800/50 rounded-lg p-3 border border-gray-700">
                        <div className="text-xs text-gray-400 mb-1">Dew Point</div>
                        <div className="text-lg font-bold text-primary-400">-40°C</div>
                        <div className="text-xs text-gray-400 mt-1">Target: -40°C</div>
                    </div>
                    <div className="bg-dark-800/50 rounded-lg p-3 border border-gray-700">
                        <div className="text-xs text-gray-400 mb-1">Material Flow</div>
                        <div className="text-lg font-bold text-yellow-400">45 kg/h</div>
                        <div className="text-xs text-gray-400 mt-1">PET Resin</div>
                    </div>
                    <div className="bg-dark-800/50 rounded-lg p-3 border border-gray-700">
                        <div className="text-xs text-gray-400 mb-1">Efficiency</div>
                        <div className="text-lg font-bold text-green-400">98%</div>
                        <div className="text-xs text-gray-400 mt-1">Energy optimal</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DryerDigitalTwin;
