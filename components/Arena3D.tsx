'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Renderer, Camera, Transform, Program, Mesh, Plane, Cylinder, Color, Orbit } from 'ogl';
import { Box, Group, Stack, Text, Flex, Avatar, Title } from '@mantine/core';
import { motion } from 'framer-motion';

const vertex = `#version 300 es
in vec3 position;
in vec2 uv;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
out vec2 vUv;

void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentGrid = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;

void main() {
    float gridCount = 8.0;
    vec2 grid = abs(fract(vUv * gridCount - 0.5) - 0.5) / fwidth(vUv * gridCount);
    float line = min(grid.x, grid.y);
    float mask = 1.0 - smoothstep(0.0, 0.05, line);
    
    vec3 color = mix(vec3(0.05), vec3(0.6, 0.1, 0.1), mask); // Ruby Red lines
    fragColor = vec4(color, 1.0);
}
`;

const fragmentSolid = `#version 300 es
precision highp float;
uniform vec3 uColor;
out vec4 fragColor;

void main() {
    fragColor = vec4(uColor, 1.0);
}
`;

const TeamHUD = ({ teamName, align = 'left', color = 'rubyRed' }: { teamName: string, align?: 'left' | 'right', color?: string }) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [stats, _] = useState({ hp: 85, mp: 60, energy: 40, shield: 20 });
    
    return (
        <Group align="flex-start" gap="md" style={{ flexDirection: align === 'right' ? 'row-reverse' : 'row' }}>
            <Box style={{ textAlign: align }}>
                <Title order={5} c="white" mb={4} style={{ letterSpacing: '2px', textShadow: '0 0 10px rgba(0,0,0,0.8)' }}>{teamName}</Title>
                <Avatar 
                    size="xl" 
                    radius="100%" 
                    src={null} 
                    style={{ 
                        border: `3px solid var(--mantine-color-${color}-8)`, 
                        boxShadow: '0 0 20px rgba(0,0,0,0.8)',
                        backgroundColor: '#111'
                    }} 
                />
            </Box>
            
            <Stack gap={6} mt={28} w={160}>
                {[
                    { key: 'hp', c: '#ef4444', label: 'HP' },
                    { key: 'mp', c: '#3b82f6', label: 'MP' },
                    { key: 'energy', c: '#fbbf24', label: 'NRG' },
                    { key: 'shield', c: '#94a3b8', label: 'SHD' }
                ].map((bar) => (
                    <Box key={bar.key} h={10} style={{ backgroundColor: 'rgba(0,0,0,0.8)', borderRadius: 2, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <motion.div 
                            initial={{ width: '0%' }}
                            animate={{ width: `${(stats as any)[bar.key]}%` }}
                            transition={{ type: 'spring', damping: 20, stiffness: 80 }}
                            style={{ height: '100%', backgroundColor: bar.c, boxShadow: `0 0 10px ${bar.c}44` }}
                        />
                    </Box>
                ))}
            </Stack>
        </Group>
    );
};

export const Arena3D: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;
        const container = containerRef.current;

        const renderer = new Renderer({
            webgl: 2,
            alpha: true,
            antialias: true,
            dpr: Math.min(window.devicePixelRatio || 1, 2)
        });

        const gl = renderer.gl;
        container.appendChild(gl.canvas);

        const camera = new Camera(gl, { fov: 45 });
        camera.position.set(0, 6, 12); // Position for wide horizontal view
        camera.lookAt([0, 1, 0]); // Look slightly up

        const controls = new Orbit(camera, { element: gl.canvas });
        controls.target.set(0, 1, 0); // "Levante um pouco a arena"
        
        // RESTRICÕES DE CÂMERA
        // Trava a rotação horizontal (azimuth)
        controls.minAzimuthAngle = 0;
        controls.maxAzimuthAngle = 0;
        
        // Permite rotação vertical (polar) mas limita para não atravessar o chão
        controls.minPolarAngle = Math.PI / 4; 
        controls.maxPolarAngle = Math.PI / 2.1;

        const scene = new Transform();

        // 1. Plane (Ground)
        const planeGeometry = new Plane(gl, { width: 14, height: 14 });
        const planeProgram = new Program(gl, { vertex, fragment: fragmentGrid, cullFace: null });
        const ground = new Mesh(gl, { geometry: planeGeometry, program: planeProgram });
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = 0;
        ground.setParent(scene);

        // 2. 4 Cylinders
        const cylinderGeometry = new Cylinder(gl, { radiusTop: 0.4, radiusBottom: 0.4, height: 1.2, radialSegments: 16 });
        const createCylinder = (x: number, z: number, color: Color) => {
            const program = new Program(gl, { vertex, fragment: fragmentSolid, uniforms: { uColor: { value: color } } });
            const mesh = new Mesh(gl, { geometry: cylinderGeometry, program });
            mesh.position.set(x, 0.6, z);
            mesh.setParent(scene);
            return mesh;
        };

        createCylinder(-4, -2, new Color('#991b1b'));
        createCylinder(-4, 2, new Color('#991b1b'));
        createCylinder(4, -2, new Color('#3B82F6'));
        createCylinder(4, 2, new Color('#3B82F6'));

        const resize = () => {
            const width = container.clientWidth;
            const height = container.clientHeight;
            renderer.setSize(width, height);
            camera.perspective({ aspect: width / height });
        };

        window.addEventListener('resize', resize);
        resize();

        let raf: number;
        const update = () => {
            raf = requestAnimationFrame(update);
            controls.update();
            renderer.render({ scene, camera });
        };
        raf = requestAnimationFrame(update);

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(raf);
            try {
                container.removeChild(gl.canvas);
            } catch (e) {}
        };
    }, []);

    return (
        <Box style={{ width: '100%', height: '100%', position: 'relative' }}>
            {/* Canvas Container */}
            <Box ref={containerRef} style={{ width: '100%', height: '100%' }} />

            {/* HUD Overlay */}
            <Box style={{ position: 'absolute', inset: 0, zIndex: 10, pointerEvents: 'none', padding: '30px' }}>
                <Group justify="space-between" align="flex-start">
                    <TeamHUD teamName="TIME A" align="left" color="rubyRed" />
                    <TeamHUD teamName="TIME B" align="right" color="blue" />
                </Group>

                {/* Action Bar (Bartender4 Style) */}
                <Box style={{ position: 'absolute', bottom: '30px', left: '50%', transform: 'translateX(-50%)', pointerEvents: 'auto' }}>
                    <Flex gap={8}>
                        {Array.from({ length: 12 }).map((_, i) => (
                            <Box 
                                key={i} 
                                w={48} 
                                h={48} 
                                style={{ 
                                    backgroundColor: 'rgba(5,5,5,0.85)', 
                                    border: '1px solid rgba(255,255,255,0.2)', 
                                    borderRadius: '2px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 4px 15px rgba(0,0,0,0.6)',
                                    position: 'relative'
                                }}
                                className="action-slot"
                            >
                                <Text size="10px" fw={900} style={{ position: 'absolute', top: 2, left: 4, color: 'rgba(255,255,255,0.4)' }}>{i + 1}</Text>
                            </Box>
                        ))}
                    </Flex>
                </Box>
            </Box>

            <style dangerouslySetInnerHTML={{ __html: `
                .action-slot { transition: all 0.15s ease; filter: grayscale(0.5); }
                .action-slot:hover { 
                    border-color: #fff !important; 
                    transform: translateY(-4px) scale(1.1); 
                    filter: grayscale(0);
                    background-color: rgba(20,20,20,0.9) !important;
                    box-shadow: 0 0 20px rgba(255,255,255,0.2) !important;
                }
            `}} />
        </Box>
    );
};

export default Arena3D;
