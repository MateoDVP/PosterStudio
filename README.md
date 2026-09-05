# PosterStudio Engine de Pre-prensa Digital & Pósters Musicales (300 DPI)

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Spotify API](https://img.shields.io/badge/Spotify_API-Official-1DB954?style=flat-square&logo=spotify)](https://developer.spotify.com/)
[![Apple Music](https://img.shields.io/badge/Apple_Music-iTunes_API_3000px-FC3C44?style=flat-square&logo=apple-music)](https://developer.apple.com/)
[![Print Ready](https://img.shields.io/badge/Prepress-300_DPI_Lossless-emerald?style=flat-square)](https://en.wikipedia.org/wiki/Dots_per_inch)

**PosterStudio** es una aplicación web de ingeniería de preprensa digital de alta precisión diseñada para automatizar la maquetación y generación de pósters musicales minimalistas listos para impresión física industrial a **300 DPI reales**, reemplazando procesos manuales y repetitivos en Adobe Illustrator o InDesign.

Conecta en tiempo real la **API Oficial de Spotify** para metadatos y la **API de iTunes / Apple Music** para carátulas de estudio de ultra-alta resolución, aplicando rigurosas fórmulas matemáticas de conversión física a digital.

---

## ⚡ Stack Tecnológico & Integraciones

### 💻 Frontend & Arquitectura
- **Framework:** Next.js 14 (App Router con Server Components y API Route Handlers).
- **Lenguaje:** TypeScript 5 (tipado estricto de extremo a extremo en modelos musicales y configuraciones de impresión).
- **Estilos & UI:** Tailwind CSS con variables dinámicas, animaciones CSS personalizadas y Lucide Icons.
- **Componentes Avanzados:** `ColorPickerPopover` con **React Portals (`createPortal`)** y algoritmo de detección de límites de ventana (*boundary clamping*) para interfaces fluidas sin recortes de *overflow*.

### 🔌 APIs Oficiales & Microservicios
- **Spotify Web API (Oficial):**
  - Autenticación segura mediante **OAuth 2.0 Client Credentials Flow** (`/api/token`).
  - Extracción directa y oficial de álbumes, artistas, duraciones exactas, códigos de barras UPC/ISRC y URIs scannables sin scraping ni métodos no oficiales.
- **iTunes / Apple Music Search API:**
  - Búsqueda por metadatos normalizados y códigos UPC para obtener carátulas maestras de estudio en **3000 × 3000 px** (9 Megapíxeles puros).
- **Proxy Interno de Imágenes (`/api/image-proxy`):**
  - Microservicio con cabeceras `crossOrigin="anonymous"` y gestión de caché sin pérdida, evitando el bloqueo de seguridad CORS (*canvas taint*) en el navegador durante la exportación a 300 DPI.
- **Generador de Spotify Scannable Code (`/api/spotify-code`):**
  - Proxy vectorizado dinámico que adapta los colores de las barras sonoras y el logo oficial según la paleta del diseño.

### 🖨️ Motor de Exportación de Pre-prensa (300 DPI)
- **Cálculo Físico a Digital:**
  $$\text{Píxeles} = \text{round}\left(\frac{\text{Milímetros}}{25.4} \times 300\right)$$
- **Exportación PNG Lossless:** Renderizado milimétrico con `html-to-image` utilizando ratios calculados dinámicamente (`pixelRatio`) e invalidación de caché por consulta (`includeQueryParams: true`).
- **Exportación PDF Pre-prensa:** Generación de documentos PDF en escala **1:1 en milímetros físicos** (`jsPDF`) con compresión desactivada (`compress: false`) para envío directo a plotters y prensas de impresión.

---

## 🚀 Modos de Operación

1. **Extracción Automatizada:**
   - Inserción de enlace o URI de Spotify (`album` o `track`).
   - Consulta autenticada a la API de Spotify para extraer títulos, lista completa numerada de canciones y duración.
   - Enlace automático con Apple Music para ofrecer la carátula Master a 3000 px.
   - Generación instantánea del código interactivo de Spotify.

2. **Personalización & Control de Diseño:**
   - **Selector Dual de Carátula:** Alterna libremente entre la portada original de Spotify (640 px) y el máster de Apple Music (3000 px).
   - **Tipografía y Colores en Vivo:** Selectores popup compactos y campos hexadecimales directos (`#HEX`) para el fondo del papel, títulos, artistas, lista de canciones y código de Spotify.
   - **Fondo de Carátula Difuminado Ambiental:** Capa atmosférica desenfocada con sliders interactivos de opacidad, radio de desenfoque gaussiano y capas de contraste (*dark / light / paper*).
   - **Adaptación Geométrica:** Silueta reactiva en pantalla con guías milimétricas de corte y sangría (margen seguro de 3 mm).

---

## 📐 Formatos Físicos y Matriz de Resolución (300 DPI)

| Formato | Medida Física (mm) | Medida Digital 300 DPI (px) | Ratio Aspecto | Uso Habitual |
| :--- | :--- | :--- | :--- | :--- |
| **A5** | 148 × 210 mm | 1748 × 2480 px | 1:1.41 (ISO) | Portarretratos y placas acrílicas |
| **A4** | 210 × 297 mm | 2480 × 3508 px | 1:1.41 (ISO) | Escritorio y cuadros estándar |
| **A3** *(Default)* | 297 × 420 mm | 3508 × 4960 px | 1:1.41 (ISO) | Póster mediano de pared |
| **30 × 40 cm** | 300 × 400 mm | 3543 × 4724 px | 3:4 (Cuadro) | Marcos estándar para fotografía / IKEA |
| **50 × 70 cm** | 500 × 700 mm | 5906 × 8268 px | 5:7 (Galería) | Póster grande de galería / museo (~49 MP) |

---

## 🏛️ Estructura del Proyecto

```
PosterStudio/
├── app/
│   ├── api/
│   │   ├── album/route.ts           # Extractor oficial vía Spotify Web API + Apple Music 3000px
│   │   ├── image-proxy/route.ts     # Proxy CORS seguro para renderizado 300 DPI
│   │   └── spotify-code/route.ts    # Proxy dinámico para código de barras oficial
│   ├── layout.tsx                   # Layout global con fuentes y metadatos
│   ├── page.tsx                     # Interfaz principal y orquestación de estado
│   └── globals.css                  # Estilos globales y reglas de impresión
├── components/
│   ├── poster/
│   │   ├── PosterRenderer.tsx       # Lienzo reactivo con proporciones físicas exactas
│   │   └── templates/
│   │       ├── AlbumGalleryTemplate.tsx   # Plantilla 1: Galería estilo suizo minimalista
│   │       └── SongPlayerTemplate.tsx     # Plantilla 2: Placa interactiva de canción
│   ├── controls/
│   │   ├── LayoutControls.tsx       # Formato de papel, fondo #HEX y difuminado ambiental
│   │   ├── AlbumControls.tsx        # Selector dual de portada, tracks y colores tipográficos
│   │   └── PlayerControls.tsx       # Controles de reproducción, timeline y subida de foto
│   └── ui/
│       ├── ColorPickerPopover.tsx   # Selector de color flotante con React Portal
│       └── UrlInputBar.tsx          # Barra de extracción bajo demanda
├── lib/
│   ├── constants/
│   │   └── printSizes.ts            # Matriz de dimensiones milimétricas y píxeles 300 DPI
│   ├── export/
│   │   ├── exportToPdf.ts           # Motor de exportación PDF milimétrico 1:1 (jsPDF)
│   │   └── exportToPng.ts           # Motor de renderizado PNG a 300 DPI reales
│   ├── spotify.ts                   # Cliente de autenticación y consumo de Spotify Web API
│   └── itunes.ts                    # Cliente de Apple Music / iTunes para portadas HD
└── types/
    └── poster.ts                    # Definiciones estrictas de TypeScript
```

---

## 🛠️ Instalación y Configuración Local

### 1. Clonar el repositorio
```bash
git clone https://github.com/MateoDVP/PosterStudio.git
cd PosterStudio
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar Credenciales de Spotify (Obligatorio)
La aplicación consume la **API oficial de Spotify** para garantizar máxima fidelidad y estabilidad:
1. Dirígete a [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) e inicia sesión con tu cuenta.
2. Crea una nueva aplicación (App) para obtener tu `Client ID` y `Client Secret`.
3. Crea un archivo `.env.local` en la raíz del proyecto basándote en `.env.example`:
   ```env
   SPOTIFY_CLIENT_ID=tu_client_id_aqui
   SPOTIFY_CLIENT_SECRET=tu_client_secret_aqui
   ```

### 4. Iniciar en modo desarrollo
```bash
npm run dev
```
Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

### 5. Compilar para producción
```bash
npm run build
npm start
```
