# The Intelligence Interface — 3D Developer Portfolio

A futuristic, GPU-accelerated spatial portfolio interface built for **Hector Morales** (Software Engineer & Frontend Developer). Designed to feel like entering a living neural network and digital intelligence matrix rather than a conventional portfolio template.

---

## 🌟 Visual & Experiential Architecture

- **Deep Space Atmosphere**: Midnight-blue background (`#02040a`) with atmospheric exponential fog, restrained cyan (`#00f0ff`) and electric-blue (`#38bdf8`) lighting.
- **3D Neural Network**: Over 60 spatial synaptic nodes with dynamic line connections and continuous data packet pulses streaming between the core and sector clusters.
- **Holographic Digital Twin Core**: Modular floating gimbal with counter-rotating luminous energy bands, glowing corner brackets, and dynamic avatar presentation modes (Hologram, Silhouette, Matrix).
- **Cinematic Opening & Focal Lock**: "Meet Hector" trigger with smooth camera glide, activation audio flare, and focus lock.
- **Spatial Sector Navigation**: 4 interactive 3D navigation nodes in space (**About**, **Projects**, **Experience**, **Contact**) paired with high-tech HUD telemetry panels.
- **Procedural Web Audio**: Real-time synthesized cybernetic sound effects (subtle clicks, camera warp sweeps, intro chimes) using the Web Audio API with zero external media files.
- **Accessible & Performance-Minded**: Full keyboard shortcuts (`0-4`, `Esc`, `M`), `prefers-reduced-motion` compliance, and a Canvas 2D fallback for devices without WebGL.

---

## 🏗️ Project Structure

```
HectorAdan.github.io/
├── .github/workflows/
│   └── deploy.yml              # Automated GitHub Pages CI/CD workflow
├── dist/                       # Production static bundle for GitHub Pages
├── public/                     # Static assets
├── src/
│   ├── components/
│   │   ├── canvas/
│   │   │   ├── Scene.tsx            # R3F Canvas, lighting, fog & scene graph
│   │   │   ├── HoloAvatar.tsx       # Central holographic digital twin component
│   │   │   ├── NeuralNetwork.tsx    # 3D synaptic nodes & traveling pulse packets
│   │   │   ├── SectorBeacons.tsx    # Interactive 3D navigation beacons
│   │   │   ├── ParticleField.tsx    # GPU-accelerated quantum neural dust
│   │   │   └── CameraController.tsx # Smooth camera lerp transitions & parallax
│   │   ├── ui/
│   │   │   ├── HeaderHUD.tsx         # Top futuristic HUD bar & audio toggle
│   │   │   ├── HeroOverlay.tsx       # Opening landing screen & "Meet Hector" CTA
│   │   │   ├── SectorDetailPanel.tsx # High-tech telemetry detail drawer
│   │   │   └── WebGLFallback.tsx     # Canvas 2D fallback when WebGL is absent
│   │   └── common/
│   │       └── SystemMetrics.tsx     # Coordinate ticker & system clock
│   ├── data/
│   │   └── portfolioData.ts     # Authentic resume, projects, bio & sector coords
│   ├── types/
│   │   └── portfolio.ts        # TypeScript data contracts & sector interfaces
│   ├── utils/
│   │   ├── soundEffects.ts     # Procedural Web Audio API sound synthesizer
│   │   └── webglDetect.ts      # WebGL & WebGL2 feature detection
│   ├── App.tsx                 # Main application state orchestrator
│   ├── index.css               # Core design tokens, typography, and styling
│   └── main.tsx                # React 19 entry point
├── index.html                  # Root HTML with SEO metadata & neural SVG favicon
├── package.json                # Dependencies: React 19, Three.js, R3F, Drei, Lucide
├── tsconfig.json               # TypeScript compiler configuration
└── vite.config.ts              # Vite configuration (port 5188, base: './' for GH Pages)
```

---

## 🚀 Running Locally

### Prerequisites
- Node.js 18+ (tested on Node v20)
- npm 9+

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Dev Server
```bash
npm run dev
```
Open **[http://localhost:5188](http://localhost:5188)** in your browser.

### 3. Production Build
```bash
npm run build
```
Generates an optimized static build in `./dist`.

---

## 🔄 How to Replace the Avatar (Future Phases)

The avatar component is intentionally architected in [`src/components/canvas/HoloAvatar.tsx`](file:///Users/woliam/Documents/personal%20projects/HectorAdan.github.io/src/components/canvas/HoloAvatar.tsx) for zero-friction replacement:

### Option A: Using a Talking Avatar Video (`.mp4` / `.webm`)
1. Place your prerecorded talking video in `public/avatar_talking.mp4`.
2. In [`HoloAvatar.tsx`](file:///Users/woliam/Documents/personal%20projects/HectorAdan.github.io/src/components/canvas/HoloAvatar.tsx), pass the `videoSrc` prop:
```tsx
<HoloAvatar
  videoSrc="./avatar_talking.mp4"
  // ...other props
/>
```
The video texture will automatically stream onto the central holographic portal plane.

### Option B: Using a 3D Model (`.glb` / `.gltf`)
1. Place your 3D model in `public/models/hector_avatar.glb`.
2. Use React Three Fiber's `useGLTF`:
```tsx
import { useGLTF } from '@react-three/drei';

function ModelAvatar() {
  const { scene } = useGLTF('./models/hector_avatar.glb');
  return <primitive object={scene} scale={1.2} position={[0, -0.8, 0]} />;
}
```
3. Swap inside the central group in [`HoloAvatar.tsx`](file:///Users/woliam/Documents/personal%20projects/HectorAdan.github.io/src/components/canvas/HoloAvatar.tsx).

---

## 🌐 Deploying to GitHub Pages

Since this repository is named `HectorAdan.github.io`, it is configured as a user/organization site.

### Automated Deployment (GitHub Actions - Recommended)
A workflow has been configured at [`.github/workflows/deploy.yml`](file:///Users/woliam/Documents/personal%20projects/HectorAdan.github.io/.github/workflows/deploy.yml).
1. Go to your repository settings on GitHub: `Settings` → `Pages`.
2. Under **Build and deployment** > **Source**, select **GitHub Actions**.
3. Push your changes to the `main` branch:
```bash
git add .
git commit -m "Deploy The Intelligence Interface 3D Portfolio"
git push origin main
```
GitHub Actions will automatically run `npm run build` and publish the site.

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
| --- | --- |
| `0` | Return to Central Core / Avatar |
| `1` | Open About Sector |
| `2` | Open Projects Sector |
| `3` | Open Experience Sector |
| `4` | Open Contact Sector |
| `Esc` | Close Sector Panel & return to Core |
| `M` | Toggle Procedural Audio |

---

## 📄 License & Credits
Designed and engineered for **Hector Adan Morales Lugo**.
Built with React, Three.js, React Three Fiber, and TypeScript.