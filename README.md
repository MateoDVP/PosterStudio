# PosterStudio 🎨 300 DPI Prepress Digital Engine

**PosterStudio** es una herramienta web modular de preprensa digital de alta resolución diseñada para generar e imprimir pósters minimalistas de música a **300 DPI reales**, reemplazando los flujos de maquetado manual en Adobe Illustrator o InDesign.

---

## 🚀 Modos de Operación

1. **Automático:**
   - Inserción de enlace de Spotify (`album` o `track`).
   - Extracción de títulos, artistas y tracklist completo.
   - Búsqueda y reemplazo dinámico por la carátula **Ultra-HD de 3000x3000px** original de Apple Music / iTunes.
   - Generación de **Spotify Scannable Code** vectorial a medida.

2. **Manual / Híbrido:**
   - Edición en tiempo real de títulos, canciones, fechas y minutos.
   - Subida de fotografías locales (fotos personales con filtro blanco y negro).
   - Ajuste interactivo de la línea de tiempo (minuto inicial, minuto final, progreso y knob).
   - Controles de diseño: columnas de tracklist, mayúsculas, paleta de color del código y radio de esquinas.

---

## 📐 Formatos Físicos y Matriz de 300 DPI

Fórmula de conversión milimétrica para imprenta:  
$$\text{Píxeles} = \text{round}\left(\frac{\text{Milímetros}}{25.4} \times 300\right)$$

| Formato | Medida Física (mm) | Medida Digital 300 DPI (px) | Aspect-Ratio CSS |
| :--- | :--- | :--- | :--- |
| **A5** | 148 × 210 mm | 1748 × 2480 px | `aspect-[148/210]` |
| **A4** | 210 × 297 mm | 2480 × 3508 px | `aspect-[210/297]` |
| **A3** (Default) | 297 × 420 mm | 3508 × 4960 px | `aspect-[297/420]` |
| **30 × 40 cm** | 300 × 400 mm | 3543 × 4724 px | `aspect-[3/4]` |
| **50 × 70 cm** | 500 × 700 mm | 5906 × 8268 px | `aspect-[5/7]` |

---

## 🏛️ Arquitectura del Sistema

```
poster-generator/
├── app/
│   ├── api/
│   │   ├── album/route.ts           # Extractor de datos (Spotify Web + Embed + iTunes 3000px)
│   │   ├── image-proxy/route.ts     # Proxy CORS para renderizado 300 DPI sin bloqueo de canvas
│   │   └── spotify-code/route.ts    # Proxy y generador vectorial del código escaneable
│   ├── layout.tsx
│   ├── page.tsx                     # Dashboard principal interactivo
│   └── globals.css                  # Estilos de estudio y reglas de impresión
├── components/
│   ├── poster/
│   │   ├── PosterRenderer.tsx       # Contenedor agnóstico de lienzo con aspect-ratios milimétricos
│   │   └── templates/
│   │       ├── AlbumGalleryTemplate.tsx   # Plantilla 1: Estilo galería suizo minimalista
│   │       └── SongPlayerTemplate.tsx     # Plantilla 2: Placa acrílica / reproductor Spotify
│   ├── controls/
│   │   ├── LayoutControls.tsx       # Selectores de plantilla, medidas físicas y fondo
│   │   ├── AlbumControls.tsx        # Edición de tracks, textos, año y color de soundwave
│   │   └── PlayerControls.tsx       # Edición de minutos, slider de progreso y foto personal
│   └── ui/
│       └── UrlInputBar.tsx          # Barra de extracción por link con presets rápidos
├── lib/
│   ├── constants/
│   │   └── printSizes.ts            # Matriz de dimensiones milimétricas y píxeles 300 DPI
│   ├── export/
│   │   ├── exportToPdf.ts           # Generador preprensa jsPDF en milímetros
│   │   └── exportToPng.ts           # Renderizador html-to-image a escala 300 DPI
│   ├── spotify.ts                   # Cliente Spotify API y Scraper Embed
│   └── itunes.ts                    # Extractor de carátulas nativas 3000x3000px
└── types/
    └── poster.ts                    # Interfaces de datos y configuración
```

---

## 🛠️ Instalación y Ejecución

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Iniciar servidor de desarrollo:**
   ```bash
   npm run dev
   ```
   Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

3. **Compilar para producción:**
   ```bash
   npm run build
   npm start
   ```

4. *(Opcional)* **Credenciales de Spotify:**
   El sistema cuenta con un motor de extracción inteligente que funciona **de forma inmediata sin necesidad de claves API**. Si deseas conectar tu propia app de Spotify Developer, copia `.env.example` a `.env.local` y añade:
   ```env
   SPOTIFY_CLIENT_ID=tu_client_id
   SPOTIFY_CLIENT_SECRET=tu_client_secret
   ```
