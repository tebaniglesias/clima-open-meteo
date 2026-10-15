// URLs de la API de Open-Meteo (no requieren API key)
const URL_GEOCODING = "https://geocoding-api.open-meteo.com/v1/search";
const URL_CLIMA = "https://api.open-meteo.com/v1/forecast";

// Códigos de clima WMO que devuelve Open-Meteo -> descripción e ícono
const CODIGOS_CLIMA = {
    0: { descripcion: "Despejado", icono: "☀️" },
    1: { descripcion: "Mayormente despejado", icono: "🌤️" },
    2: { descripcion: "Parcialmente nublado", icono: "⛅" },
    3: { descripcion: "Nublado", icono: "☁️" },
    45: { descripcion: "Niebla", icono: "🌫️" },
    48: { descripcion: "Niebla con escarcha", icono: "🌫️" },
    51: { descripcion: "Llovizna leve", icono: "🌦️" },
    53: { descripcion: "Llovizna", icono: "🌦️" },
    55: { descripcion: "Llovizna intensa", icono: "🌦️" },
    56: { descripcion: "Llovizna helada", icono: "🌧️" },
    57: { descripcion: "Llovizna helada intensa", icono: "🌧️" },
    61: { descripcion: "Lluvia leve", icono: "🌧️" },
    63: { descripcion: "Lluvia", icono: "🌧️" },
    65: { descripcion: "Lluvia intensa", icono: "🌧️" },
    66: { descripcion: "Lluvia helada", icono: "🌧️" },
    67: { descripcion: "Lluvia helada intensa", icono: "🌧️" },
    71: { descripcion: "Nevada leve", icono: "🌨️" },
    73: { descripcion: "Nevada", icono: "🌨️" },
    75: { descripcion: "Nevada intensa", icono: "❄️" },
    77: { descripcion: "Granizo fino", icono: "🌨️" },
    80: { descripcion: "Chaparrones leves", icono: "🌦️" },
    81: { descripcion: "Chaparrones", icono: "🌧️" },
    82: { descripcion: "Chaparrones fuertes", icono: "⛈️" },
    85: { descripcion: "Chaparrones de nieve", icono: "🌨️" },
    86: { descripcion: "Chaparrones de nieve fuertes", icono: "❄️" },
    95: { descripcion: "Tormenta", icono: "⛈️" },
    96: { descripcion: "Tormenta con granizo", icono: "⛈️" },
    99: { descripcion: "Tormenta con granizo fuerte", icono: "⛈️" },
};

// Elementos del HTML
const formulario = document.getElementById("form-busqueda");
const inputCiudad = document.getElementById("input-ciudad");
const mensaje = document.getElementById("mensaje");
const tarjetaActual = document.getElementById("clima-actual");
const tarjetaPronostico = document.getElementById("tarjeta-pronostico");
const listaPronostico = document.getElementById("pronostico");

formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault(); // evita que la página se recargue

    const nombreCiudad = inputCiudad.value.trim();
    if (nombreCiudad === "") return;

    mostrarMensaje("Buscando...");
    ocultarTarjetas();

    try {
        const ciudad = await buscarCiudad(nombreCiudad);
        if (!ciudad) {
            mostrarMensaje(`No se encontró la ciudad "${nombreCiudad}"`);
            return;
        }

        const clima = await obtenerClima(ciudad.latitude, ciudad.longitude);
        mostrarClimaActual(ciudad, clima.current);
        mostrarPronostico(clima.daily);
        mostrarMensaje("");
    } catch (error) {
        console.error(error);
        mostrarMensaje("Ocurrió un error al consultar el clima. Intentá de nuevo.");
    }
});

// Paso 1: convertir el nombre de la ciudad en coordenadas (latitud y longitud)
async function buscarCiudad(nombre) {
    const url = `${URL_GEOCODING}?name=${encodeURIComponent(nombre)}&count=1&language=es&format=json`;
    const respuesta = await fetch(url);
    if (!respuesta.ok) throw new Error("Error en la API de geocoding");

    const datos = await respuesta.json();
    // Si no hay coincidencias, la API no devuelve "results"
    return datos.results ? datos.results[0] : null;
}

// Paso 2: pedir el clima actual y el pronóstico para esas coordenadas
async function obtenerClima(latitud, longitud) {
    const parametros = new URLSearchParams({
        latitude: latitud,
        longitude: longitud,
        current: "temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code",
        daily: "weather_code,temperature_2m_max,temperature_2m_min",
        timezone: "auto",
        forecast_days: 6,
    });

    const respuesta = await fetch(`${URL_CLIMA}?${parametros}`);
    if (!respuesta.ok) throw new Error("Error en la API de clima");

    return await respuesta.json();
}

function mostrarClimaActual(ciudad, actual) {
    const clima = traducirCodigo(actual.weather_code);

    document.getElementById("ciudad").textContent = ciudad.name;
    // admin1 es la provincia/estado (puede no venir)
    document.getElementById("pais").textContent = [ciudad.admin1, ciudad.country]
        .filter(Boolean)
        .join(", ");
    document.getElementById("icono").textContent = clima.icono;
    document.getElementById("temperatura").textContent = `${Math.round(actual.temperature_2m)}°`;
    document.getElementById("descripcion").textContent = clima.descripcion;
    document.getElementById("sensacion").textContent = `${Math.round(actual.apparent_temperature)}°`;
    document.getElementById("humedad").textContent = `${actual.relative_humidity_2m}%`;
    document.getElementById("viento").textContent = `${Math.round(actual.wind_speed_10m)} km/h`;

    tarjetaActual.hidden = false;
}

function mostrarPronostico(diario) {
    listaPronostico.innerHTML = "";

    // El índice 0 es hoy, así que mostramos desde el 1 (los próximos 5 días)
    for (let i = 1; i < diario.time.length; i++) {
        const clima = traducirCodigo(diario.weather_code[i]);
        // Se agrega "T00:00" para que la fecha se tome en hora local y no en UTC
        const fecha = new Date(`${diario.time[i]}T00:00`);
        const nombreDia = fecha.toLocaleDateString("es-AR", { weekday: "long" });
        const maxima = Math.round(diario.temperature_2m_max[i]);
        const minima = Math.round(diario.temperature_2m_min[i]);

        const item = document.createElement("li");
        item.className = "dia";
        item.innerHTML = `
            <span class="dia-nombre">${nombreDia}</span>
            <span class="dia-icono" title="${clima.descripcion}">${clima.icono}</span>
            <span class="dia-temps">${maxima}° / ${minima}°</span>
        `;
        listaPronostico.appendChild(item);
    }

    tarjetaPronostico.hidden = false;
}

function traducirCodigo(codigo) {
    return CODIGOS_CLIMA[codigo] || { descripcion: "Desconocido", icono: "❔" };
}

function mostrarMensaje(texto) {
    mensaje.textContent = texto;
}

function ocultarTarjetas() {
    tarjetaActual.hidden = true;
    tarjetaPronostico.hidden = true;
}
