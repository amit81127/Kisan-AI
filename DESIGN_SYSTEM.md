# KisanRakshak UI Design System — "Lush Agro Glass" Theme

> **Theme Identity:** Modern Organic & High-Tech Agriculture ("Lush Agro Glass")  
> **Inspired by:** Deep Forest Emerald, Vibrant Leaf Green, Warm Harvest Earth, and Frosted Glassmorphism.  
> **Optimized for:** Outdoor high-contrast sunlight readability, farmer accessibility, and mobile-first PWA responsiveness.

---

## 1. Master Color Palette & Hex Tokens

```
  DEEP FOREST             VIBRANT LEAF            SAGE CANVAS             WHITE CARDS             HARVEST ACCENT
  #132B1E                 #58A447                 #F4F7F4                 #FFFFFF                 #E58B23
 ┌──────────────────────┐┌──────────────────────┐┌──────────────────────┐┌──────────────────────┐┌──────────────────────┐
 │                      ││                      ││                      ││                      ││                      │
 │ Hero & Dark Glass    ││ CTA Buttons & Tabs   ││ App Background       ││ Content Surfaces     ││ Warnings & Crops     │
 │                      ││                      ││                      ││                      ││                      │
 └──────────────────────┘└──────────────────────┘└──────────────────────┘└──────────────────────┘└──────────────────────┘
```

### 1.1 Core Brand Colors

| Token Name | Hex Code | RGB | Tailwind Class | Primary Usage |
|---|:---:|:---:|---|---|
| **Deep Pine / Forest** | `#132B1E` | `19, 43, 30` | `bg-[#132B1E]` | Hero weather card, floating bottom navigation, dark modals |
| **Forest Mid-Tone** | `#1C3B2B` | `28, 59, 43` | `bg-[#1C3B2B]` | Secondary dark cards, metric grid containers |
| **Vibrant Leaf Green** | `#58A447` | `88, 164, 71` | `bg-[#58A447]` | Primary action buttons ("Get Started", "Analyze"), active filter pills |
| **Bright Lime Glow** | `#6ECB5A` | `110, 203, 90` | `bg-[#6ECB5A]` | Center floating "+" button, scan trigger icon, active status dots |
| **Sage Canvas (Light)** | `#F4F7F4` | `244, 247, 244`| `bg-[#F4F7F4]` | Main app background (soft on eyes outdoors, prevents screen glare) |
| **Card White** | `#FFFFFF` | `255, 255, 255`| `bg-white` | News/advisory cards, symptom accordions, photo upload containers |

### 1.2 Glassmorphism & Translucent Overlays

| Token Name | Value | Tailwind Combination | Usage |
|---|---|---|---|
| **Dark Glass (Hero/Nav)** | `rgba(19, 43, 30, 0.88)` | `bg-[#132B1E]/90 backdrop-blur-md border border-white/10` | Floating bottom navigation bar, floating metrics overlay |
| **Field Overlay Glass** | `rgba(28, 59, 43, 0.75)` | `bg-[#1C3B2B]/75 backdrop-blur-lg border border-white/15` | Metric cards over camera/map feed (Water depth, soil quality) |
| **Light Glass (Subtle)** | `rgba(255, 255, 255, 0.85)` | `bg-white/85 backdrop-blur-md border border-black/5` | Floating search/filter controls on light screens |

### 1.3 Semantic & Agricultural Status Accents

| State | Hex Code | Purpose | Example Component |
|---|:---:|---|---|
| **Harvest Amber** | `#E58B23` | Moderate pest risk, warning, carrot/vegetable tags | `Pest Risk: 10%`, crop tags |
| **Alert Coral** | `#E5533D` | Critical disease alert, banned chemical warning | "Severe Blight Detected", "Do not spray" |
| **Moisture Sky Blue** | `#3D9BE5` | Rainfall, humidity, irrigation status | `Humidity: 85%`, `Water Depth: 35%` |
| **Healthy Growth** | `#58A447` | Confirmed healthy, verified official source | `Plant Health: 92%`, "ICAR Verified" badge |

---

## 2. Complete Tailwind CSS Configuration (`tailwind.config.ts`)

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        agro: {
          forest: {
            DEFAULT: "#132B1E",
            dark: "#0D1E15",
            light: "#1C3B2B",
            muted: "#2A4D3B",
          },
          leaf: {
            DEFAULT: "#58A447",
            hover: "#4C923D",
            bright: "#6ECB5A",
            light: "#EAF5E8",
          },
          canvas: {
            DEFAULT: "#F4F7F4",
            card: "#FFFFFF",
            border: "#E2EAE1",
          },
          accent: {
            amber: "#E58B23",
            blue: "#3D9BE5",
            coral: "#E5533D",
          },
        },
      },
      borderRadius: {
        "3xl": "1.5rem",   // 24px - standard card corners
        "4xl": "2rem",     // 32px - hero containers and modals
        "pill": "9999px",  // pill buttons and bottom bar
      },
      boxShadow: {
        "glass-dark": "0 8px 32px 0 rgba(10, 25, 17, 0.37)",
        "glass-light": "0 8px 30px 0 rgba(40, 70, 50, 0.08)",
        "cta-glow": "0 10px 25px -5px rgba(88, 164, 71, 0.4)",
      },
    },
  },
  plugins: [],
};

export default config;
```

---

## 3. Component Design Implementations

### 3.1 Hero Weather & Farm Card (Dark Pine Glass)
```tsx
export function WeatherHeroCard({ temp = 24, location = "Lucknow, Uttar Pradesh", humidity = 85, rain = 8, wind = 13 }) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-[#132B1E] p-6 text-white shadow-xl">
      {/* Subtle background glow */}
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#58A447]/20 blur-3xl pointer-events-none" />

      {/* Location & Status Header */}
      <div className="flex items-center justify-between text-xs text-white/80">
        <div className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 backdrop-blur-sm">
          <span>📍</span>
          <span className="font-medium tracking-wide">{location}</span>
        </div>
        <span className="text-white/60">Clean / Sunny</span>
      </div>

      {/* Temperature Display */}
      <div className="my-5 flex items-baseline gap-2">
        <span className="text-5xl font-bold tracking-tight text-white">{temp}°</span>
        <span className="text-2xl font-light text-white/70">C</span>
      </div>

      {/* Metric Micro-Grid */}
      <div className="grid grid-cols-3 gap-2 border-t border-white/10 pt-4 text-xs">
        <div>
          <p className="text-white/60">Humidity</p>
          <p className="text-sm font-semibold text-white mt-0.5">{humidity}%</p>
        </div>
        <div>
          <p className="text-white/60">Precipitation</p>
          <p className="text-sm font-semibold text-white mt-0.5">{rain} mm</p>
        </div>
        <div>
          <p className="text-white/60">Wind Speed</p>
          <p className="text-sm font-semibold text-white mt-0.5">{wind} km/h</p>
        </div>
      </div>
    </div>
  );
}
```

### 3.2 Floating Bottom Navigation Bar (Frosted Glass)
```tsx
export function FloatingNavBar({ activeTab = "scan", onTabChange }: { activeTab: string; onTabChange: (tab: string) => void }) {
  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-6 rounded-full bg-[#132B1E]/90 px-6 py-3 shadow-glass-dark backdrop-blur-lg border border-white/10">
      <button 
        onClick={() => onTabChange("home")}
        className={`flex flex-col items-center gap-1 text-[11px] ${activeTab === "home" ? "text-[#6ECB5A] font-semibold" : "text-white/60 hover:text-white"}`}
      >
        <span>🏠</span>
        <span>Home</span>
      </button>

      <button 
        onClick={() => onTabChange("fields")}
        className={`flex flex-col items-center gap-1 text-[11px] ${activeTab === "fields" ? "text-[#6ECB5A] font-semibold" : "text-white/60 hover:text-white"}`}
      >
        <span>🌱</span>
        <span>Fields</span>
      </button>

      {/* Center Scan / Add Action Button */}
      <button 
        onClick={() => onTabChange("scan")}
        className="relative -top-2 flex h-13 w-13 items-center justify-center rounded-full bg-[#6ECB5A] text-[#132B1E] shadow-cta-glow transition-transform active:scale-95"
      >
        <span className="text-2xl font-bold">+</span>
      </button>

      <button 
        onClick={() => onTabChange("reports")}
        className={`flex flex-col items-center gap-1 text-[11px] ${activeTab === "reports" ? "text-[#6ECB5A] font-semibold" : "text-white/60 hover:text-white"}`}
      >
        <span>📄</span>
        <span>Reports</span>
      </button>

      <button 
        onClick={() => onTabChange("profile")}
        className={`flex flex-col items-center gap-1 text-[11px] ${activeTab === "profile" ? "text-[#6ECB5A] font-semibold" : "text-white/60 hover:text-white"}`}
      >
        <span>👤</span>
        <span>Profile</span>
      </button>
    </nav>
  );
}
```

### 3.3 Metric Cards Over Camera / Field View (2x2 Grid)
```tsx
export function FieldMetricsGrid({ water = "35%", health = "56%", soil = "75%", pestRisk = "10%" }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Water Depth */}
      <div className="rounded-2xl bg-[#132B1E]/80 p-4 text-white backdrop-blur-md border border-white/10">
        <div className="flex items-center justify-between text-xs text-white/70">
          <span>Water Depth</span>
          <span className="text-[#3D9BE5]">💧</span>
        </div>
        <p className="mt-2 text-2xl font-bold text-white">{water}</p>
      </div>

      {/* Plant Health */}
      <div className="rounded-2xl bg-[#132B1E]/80 p-4 text-white backdrop-blur-md border border-white/10">
        <div className="flex items-center justify-between text-xs text-white/70">
          <span>Plant Health</span>
          <span className="text-[#58A447]">🌿</span>
        </div>
        <p className="mt-2 text-2xl font-bold text-white">{health}</p>
      </div>

      {/* Soil Quality */}
      <div className="rounded-2xl bg-[#132B1E]/80 p-4 text-white backdrop-blur-md border border-white/10">
        <div className="flex items-center justify-between text-xs text-white/70">
          <span>Soil Quality</span>
          <span className="text-amber-300">🌱</span>
        </div>
        <p className="mt-2 text-2xl font-bold text-white">{soil}</p>
      </div>

      {/* Pest Risk */}
      <div className="rounded-2xl bg-[#132B1E]/80 p-4 text-white backdrop-blur-md border border-white/10">
        <div className="flex items-center justify-between text-xs text-white/70">
          <span>Pest Risk</span>
          <span className="text-[#E58B23]">⚠️</span>
        </div>
        <p className="mt-2 text-2xl font-bold text-[#E58B23]">{pestRisk}</p>
      </div>
    </div>
  );
}
```

### 3.4 Primary CTA Button ("Get Started / Analyze My Crop")
```tsx
export function PrimaryAgroButton({ label = "Analyze My Crop", onClick }: { label?: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group flex w-full items-center justify-between rounded-full bg-[#58A447] py-4 pl-7 pr-3 text-white shadow-cta-glow transition-all hover:bg-[#4C923D] active:scale-[0.98]"
    >
      <span className="text-base font-semibold tracking-wide">{label}</span>
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#132B1E] text-white transition-transform group-hover:translate-x-1">
        <span className="text-lg">➔</span>
      </div>
    </button>
  );
}
```

---

## 4. Typography Guidelines

- **Font Family:** `Inter` or `Plus Jakarta Sans` (excellent readability across Indian numeral digits and Hindi/regional script rendering).
- **Scale:**
  - Screen Titles: `text-2xl font-bold text-[#132B1E]`
  - Hero Numbers: `text-5xl font-bold tracking-tight text-white`
  - Body Text: `text-sm text-neutral-600 leading-relaxed`
  - Micro-Labels: `text-xs uppercase tracking-wider text-white/60 font-medium`
