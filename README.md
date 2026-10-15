# Clima con Open-Meteo

Aplicación web estática que muestra el **clima actual** y el **pronóstico de los próximos 5 días** de cualquier ciudad del mundo. Los datos se obtienen en tiempo real de la API gratuita de [Open-Meteo](https://open-meteo.com).

Proyecto realizado para el **Trabajo Práctico N° 1 – Git y Docker**.

## Funcionalidades

- Búsqueda de ciudades por nombre (por ejemplo: "Buenos Aires", "Córdoba", "Madrid").
- Clima actual: temperatura, sensación térmica, humedad, velocidad del viento y estado del cielo.
- Recomendación para **colgar la ropa**: indica si conviene hacerlo en este momento según la lluvia, la humedad, el viento y si es de día o de noche.
- Pronóstico de los próximos 5 días con temperaturas máxima y mínima, y un ícono que indica si ese día conviene colgar la ropa (pasando el mouse se ve el motivo).
- Mensajes de carga y de error (ciudad no encontrada o falla de conexión).
- Diseño adaptable a pantallas de celular.

## Tecnologías

| Tecnología | Uso |
|---|---|
| HTML5 | Estructura de la página |
| CSS3 | Estilos y diseño adaptable |
| JavaScript | Consulta a la API (`fetch`) y armado del resultado en pantalla |
| [Open-Meteo API](https://open-meteo.com) | Datos del clima y búsqueda de ciudades (no requiere API key) |
| [nginx](https://nginx.org) (`nginx:alpine`) | Servidor web dentro del contenedor |
| Docker | Empaquetado y ejecución de la aplicación |
| Git / GitHub | Control de versiones |

## Requisitos

- [Docker](https://www.docker.com/products/docker-desktop/) instalado y en ejecución.
- [Git](https://git-scm.com), solo si se quiere clonar el repositorio.
- Conexión a internet: el navegador consulta la API de Open-Meteo.

## Estructura del proyecto

```
clima-open-meteo/
├── index.html      # Estructura de la página
├── style.css       # Estilos
├── app.js          # Lógica: búsqueda de la ciudad y consulta del clima
├── Dockerfile      # Instrucciones para construir la imagen
├── .dockerignore   # Archivos que se excluyen de la imagen
└── README.md       # Este archivo
```

## Cómo construir y ejecutar con Docker

### Opción 1: desde el repositorio clonado

1. Clonar el repositorio y entrar a la carpeta:

   ```bash
   git clone https://github.com/tebaniglesias/clima-open-meteo.git
   cd clima-open-meteo
   ```

2. Construir la imagen:

   ```bash
   docker build -t clima-open-meteo .
   ```

   - `-t clima-open-meteo` le da un nombre a la imagen.
   - `.` indica el contexto de build, es decir, la carpeta actual, de donde se copian los archivos.

3. Ejecutar el contenedor:

   ```bash
   docker run -d --name clima -p 8080:80 clima-open-meteo
   ```

   - `-d` ejecuta el contenedor en segundo plano.
   - `--name clima` le da un nombre al contenedor.
   - `-p 8080:80` conecta el puerto 8080 de la PC con el puerto 80 del contenedor, donde escucha nginx.

4. Abrir en el navegador: **http://localhost:8080**

### Opción 2: directamente desde GitHub (sin clonar)

Docker puede usar el repositorio de GitHub como contexto de build, así que no hace falta descargar el código:

```bash
docker build -t clima-open-meteo https://github.com/tebaniglesias/clima-open-meteo.git
docker run -d --name clima -p 8080:80 clima-open-meteo
```

Luego abrir **http://localhost:8080**.

### Detener y eliminar el contenedor

```bash
docker stop clima
docker rm clima
```

## Cómo funciona el Dockerfile

```dockerfile
FROM nginx:alpine
COPY index.html style.css app.js /usr/share/nginx/html/
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

1. **`FROM nginx:alpine`**: parte de una imagen con el servidor web nginx sobre Alpine Linux, una distribución muy liviana.
2. **`COPY`**: copia los archivos del sitio a la carpeta que nginx sirve por defecto.
3. **`EXPOSE 80`**: indica que el contenedor escucha en el puerto 80.
4. **`CMD`**: inicia nginx en primer plano para que el contenedor siga en ejecución.

## Cómo funciona la aplicación

1. El usuario escribe el nombre de una ciudad y presiona **Buscar**.
2. Se consulta la **API de geocoding** de Open-Meteo para obtener la latitud y la longitud de la ciudad.
3. Con esas coordenadas se consulta la **API de pronóstico**, que devuelve el clima actual y el de los próximos días.
4. La API indica el estado del cielo con códigos numéricos (estándar WMO). La aplicación los traduce a una descripción y un ícono, por ejemplo `63` → "Lluvia" 🌧️.
5. Con esos datos se arma la recomendación para colgar la ropa:
   - **Ahora:** no se recomienda si llueve, si es de noche o si la humedad es del 80% o más. Entre 70% y 80% depende del viento. Por debajo del 70% las condiciones son buenas, e ideales si además hay viento.
   - **Próximos días:** no se recomienda si se espera lluvia o la probabilidad de lluvia supera el 35%. Es ideal si el día está despejado o algo nublado, aceptable si está nublado pero con viento, y regular si está nublado y sin viento.

## Créditos

Datos del clima provistos por [Open-Meteo](https://open-meteo.com) bajo licencia [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
