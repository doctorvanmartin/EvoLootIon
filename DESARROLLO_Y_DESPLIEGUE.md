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
2. **Simulación, Poblaciones Rivales y Controles del HUD:**
   * Ajusta el control deslizante **Poblaciones Rivales** (de `0` a `8`, por defecto `3`) o pulsa **Inocular Placa de Cultivo** para reiniciar con nuevas cepas rivales generadas al azar y con nombres taxonómicos procedurales.
   * Observa en la placa el **epicentro de luz** (halo iluminado con contorno discontinuo) que aparece en una ubicación aleatoria y se desplaza suavemente.
   * Prueba el botón rotatorio de velocidad (`1x` → `2x` → `4x`), el botón de pausa (`||` / `▶`), los selectores compactos `− / +` de **Comida / Sustrato** y **Luz**, y el botón de **Centrar Vista** (icono de mirilla).
   * Haz clic o toca sobre cualquier bacteria en movimiento para abrir el **Inspector de Organismo** en la esquina inferior derecha y observar su nombre procedural, energía, generación y estado (*Vegetativa*, *Toxina Activa* o *Endospora*).

### 4.2. Validación de rendimiento (Zero-GC y 60 FPS)

1. Pulsa el botón de velocidad hasta ponerla en `4x` y añade sustrato varias veces con el botón `+` de **Comida / Sustrato** hasta superar las 400 bacterias.
2. Verifica en el indicador **FPS** del HUD superior que la tasa se mantiene estable en torno a 60 FPS.
3. Aleja el zoom con la rueda del ratón o alterna entre **Detalle: Auto**, **Detalle: Bajo** y **Detalle: Alto** para comprobar los modos de renderizado.

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

Para este repositorio, GitHub Pages publicará el sitio en `https://doctorvanmartin.github.io/EvoLootIon/`. Vite configura automáticamente la ruta base a partir del nombre del repositorio durante la compilación de GitHub Actions, por lo que también funciona en un *fork* con otro nombre.

#### Publicación automática con GitHub Actions

El workflow `.github/workflows/deploy-pages.yml` compila el sitio con `npm ci` y `npm run build`, y publica `dist/` cada vez que se actualiza `main`. También se puede iniciar manualmente desde la pestaña **Actions**.

Para habilitarlo en GitHub:

1. Abre **Settings → Pages** en el repositorio.
2. En **Build and deployment → Source**, selecciona **GitHub Actions**.
3. Confirma que las ejecuciones de GitHub Actions estén permitidas en **Settings → Actions → General**.
4. Cuando el workflow termine correctamente, abre la URL que aparece en **Settings → Pages** o en el resumen de la ejecución.

No hace falta publicar `dist/` en una rama ni añadir secretos. Quien haga un *fork* deberá habilitar Pages en su propio repositorio; el workflow calcula automáticamente la ruta base para el nombre de ese repositorio.

### Opción C: Plataformas Cloud Estáticas (Vercel / Netlify / Cloudflare Pages)

Conecta tu repositorio Git a cualquiera de estas plataformas con los siguientes parámetros:

* **Build command:** `npm run build`
* **Output / Publish directory:** `dist`
* **Node.js version:** `20.x`

### Opción D: Contenedor Docker y Despliegue con Traefik (`docker-compose.yml`)

El repositorio incluye un `Dockerfile` multietapa (`node:20-alpine` para compilación + `nginx:stable-alpine` con compresión Gzip y caché de estáticos en el puerto `80`), un `.dockerignore` y un archivo `docker-compose.yml` preconfigurado para integrarse en una infraestructura con **Traefik** como proxy inverso y **Homepage** como panel de servicios.

#### Despliegue mediante Docker Compose (recomendado con Traefik)

El archivo `docker-compose.yml` construye el dominio del servicio componiendo `${EVOLOOTION_HOST_SUBDOMAIN}.${HOST_BASE}` tanto para la regla `Host(...)` de Traefik como para `homepage.href`.

Asegúrate de que la red externa `traefik_proxy` exista en tu host Docker y ejecuta (cargando tu `.env` del directorio superior si aplica):

```bash
docker compose --env-file ../.env up -d --build
```

El servicio `evolootion` se conectará automáticamente a la red `traefik_proxy`, exponiendo el puerto interno `80` a través del router `evolootion` en el dominio `${EVOLOOTION_HOST_SUBDOMAIN}.${HOST_BASE}` (entrypoint `websecure`) y registrando sus metadatos en el grupo `Juegos` del dashboard.

#### Despliegue Automatizado por SSH (`deploy.sh`)

El script `deploy.sh` permite actualizar y relanzar el contenedor en el servidor remoto desde tu máquina local (asumiendo acceso SSH por clave pública sin contraseña, `BatchMode=yes`).

* **Sin valores por defecto:** Si las variables de entorno `EVOLOOTION_REMOTE_USER`, `EVOLOOTION_REMOTE_HOST` o `EVOLOOTION_REMOTE_PATH` no están definidas (ni se pasan por argumentos CLI), el script las solicitará interactivamente por consola.
* **Resolución y persistencia de dominio (`EVOLOOTION_HOST_SUBDOMAIN` y `HOST_BASE`):** El script comprueba por SSH si existe el fichero `${EVOLOOTION_REMOTE_PATH}/../.env` en el servidor remoto y si contiene `EVOLOOTION_HOST_SUBDOMAIN` y `HOST_BASE`. Si el fichero existe pero falta alguna de las dos variables, el script pregunta interactivamente por la(s) que falte(n) y las añade al final de `${EVOLOOTION_REMOTE_PATH}/../.env`. Si el fichero `.env` no existe, pregunta por ambas y las inyecta en la ejecución.
* **Actualización y despliegue:** Se conecta por SSH ejecutando `bash` explícitamente (compatible aunque el servidor tenga `fish` como shell por defecto), sincroniza la rama `main` (`git fetch origin main && git checkout main && git reset --hard origin/main`) y ejecuta `docker compose up -d --build --remove-orphans`.

```bash
# Dar permisos de ejecución la primera vez
chmod +x deploy.sh

# Ejecución interactiva (preguntará por las variables no definidas en el entorno)
./deploy.sh

# Pasando parámetros explícitos por CLI
./deploy.sh --user mi_usuario --host 192.168.1.100 --path /srv/evolootion

# O mediante variables de entorno
EVOLOOTION_REMOTE_USER=mi_usuario EVOLOOTION_REMOTE_HOST=192.168.1.100 EVOLOOTION_REMOTE_PATH=/opt/evolootion npm run deploy
```

#### Ejecución directa con Docker (sin Traefik)

Si deseas construir y ejecutar el contenedor de forma aislada mapeando un puerto local:

```bash
docker build -t evolootion:latest .
docker run -d -p 8080:80 --name evolootion evolootion:latest
```

La aplicación quedará disponible en `http://localhost:8080`.
