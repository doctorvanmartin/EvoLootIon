# Guía de Desarrollo, Pruebas y Despliegue — EvoLootIon

Este documento detalla todos los procedimientos necesarios para instalar, ejecutar en desarrollo, probar en ordenadores y móviles, compilar para producción y desplegar **EvoLootIon** en distintos entornos de servidor.

---

## 1. Requisitos Previos

* **Node.js:** versión `18.x` o superior (recomendado `20 LTS` o `22 LTS`).
* **Gestor de paquetes:** `npm` (incluido con Node.js).
* **Navegador moderno:** Chrome, Firefox, Edge o Safari con soporte para HTML5 Canvas 2D y ES2022.

---

## 2. Instalación y Ejecución en Local

### 2.1. Instalar dependencias

Desde la raíz del proyecto:

```bash
npm install
```

### 2.2. Iniciar el servidor de desarrollo (Hot Module Replacement)

```bash
npm run dev
```

Vite levantará un servidor local (por defecto en `http://localhost:5173`). Cualquier cambio en los archivos de `src/` o `index.html` recargará la aplicación instantáneamente.

### 2.3. Probar en un teléfono móvil o tablet en tu red Wi-Fi

Para probar el diseño responsive y los gestos táctiles (*pan* con un dedo y *pinch-to-zoom* con dos dedos) desde un móvil conectado a la misma red local:

```bash
npx vite --host
```

La terminal mostrará una dirección `Network` similar a `http://192.168.1.XX:5173/`. Ábrela directamente en el navegador del móvil.

---

## 3. Compilación y Verificación de Código

### 3.1. Comprobación de tipos (TypeScript)

Para verificar únicamente que no existen errores de tipos sin generar archivos de salida:

```bash
npx tsc --noEmit
```

### 3.2. Compilar para producción

```bash
npm run build
```

Este comando ejecuta `tsc && vite build` y genera la carpeta estática optimizada y minificada en `dist/`.

### 3.3. Previsualizar la versión de producción localmente

Para comprobar cómo se comporta exactamente el paquete compilado antes de subirlo a un servidor:

```bash
npm run preview
```

---

## 4. Guía de Pruebas y Validación

### 4.1. Validación funcional (Checklist de mecánicas)

1. **Diseñador Genético y Previsualización:**
   * Cambia entre *Fotosintética* (Coco), *Saprófita* (Bacilo), *Predadora* (Espirilo) y *Fermentadora* (Diplococo) y verifica que el mini-canvas superior actualiza la forma en vivo.
   * Selecciona locomoción *Sésil* o interacción *Neutral* y comprueba que los controles deslizantes de velocidad o toxina se deshabilitan automáticamente y el coste basal/drag se recalcula.
2. **Simulación y Controles del HUD:**
   * Pulsa **Inocular Placa de Cultivo** para reiniciar con tu cepa.
   * Prueba los botones de velocidad (`1x`, `2x`, `4x`), **Pausar** y **+ Sustrato**.
   * Haz clic o toca sobre cualquier bacteria en movimiento para abrir el **Inspector de Organismo** en la esquina inferior derecha y observar su energía, generación y estado (*Vegetativa*, *Toxina Activa* o *Endospora*).

### 4.2. Validación de rendimiento (Zero-GC y 60 FPS)

1. Pon la velocidad en `4x` y añade sustrato varias veces con **+ Sustrato** hasta superar las 400 bacterias.
2. Verifica en el indicador **FPS** del HUD superior que la tasa se mantiene estable en torno a 60 FPS.
3. Aleja el zoom con la rueda del ratón o pulsa **LOD Auto / LOD Bajo** para comprobar la transición al renderizado simplificado de alto rendimiento.

---

## 5. Despliegue en un Servidor (Producción)

Al compilar con `npm run build`, todo el juego queda empaquetado como archivos estáticos puros (`index.html` y `assets/*.js`) dentro del directorio `dist/`. No requiere backend en Node.js para funcionar en producción.

### Opción A: Servidor Web Propio (Nginx)

1. Compila el proyecto (`npm run build`).
2. Copia el contenido de `dist/` al directorio raíz de tu servidor (por ejemplo, `/var/www/evolootion`):

   ```bash
   scp -r dist/* usuario@tu-servidor:/var/www/evolootion/
   ```

3. Configuración recomendada para Nginx (`/etc/nginx/sites-available/evolootion`):

   ```nginx
   server {
       listen 80;
       server_name tu-dominio.com;
       root /var/www/evolootion;
       index index.html;

       gzip on;
       gzip_types text/plain text/css application/javascript image/svg+xml;

       location / {
           try_files $uri $uri/ /index.html;
       }

       location /assets/ {
           expires 1y;
           add_header Cache-Control "public, immutable";
       }
   }
   ```

### Opción B: Despliegue en Subcarpeta (ej. GitHub Pages)

Si vas a alojar el juego en una subruta como `https://usuario.github.io/EvoLootIon/` en lugar de la raíz del dominio, compila indicando la ruta base:

```bash
npx vite build --base=/EvoLootIon/
```

Después puedes publicar la carpeta `dist/` en la rama `gh-pages`:

```bash
npx gh-pages -d dist
```

### Opción C: Plataformas Cloud Estáticas (Vercel / Netlify / Cloudflare Pages)

Conecta tu repositorio Git a cualquiera de estas plataformas con los siguientes parámetros:

* **Build command:** `npm run build`
* **Output / Publish directory:** `dist`
* **Node.js version:** `20.x`

### Opción D: Contenedor Docker

Si deseas empaquetar el juego en una imagen Docker ligera lista para producción, puedes crear un `Dockerfile` en la raíz con el siguiente contenido:

```dockerfile
# Etapa 1: Construcción
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Etapa 2: Servidor Nginx ligero
FROM nginx:stable-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Para construir y ejecutar el contenedor:

```bash
docker build -t evolootion:latest .
docker run -d -p 8080:80 --name evolootion evolootion:latest
```

La aplicación quedará disponible en `http://localhost:8080`.
