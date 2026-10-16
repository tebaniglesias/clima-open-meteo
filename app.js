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
const tarjetaRopa = document.getElementById("tarjeta-ropa");
const ropaEstado = document.getElementById("ropa-estado");
const ropaMotivo = document.getElementById("ropa-motivo");
const tarjetaHoras = document.getElementById("tarjeta-horas");
const listaHoras = document.getElementById("lista-horas");
const tarjetaPronostico = document.getElementById("tarjeta-pronostico");
const listaPronostico = document.getElementById("pronostico");

// Cantidad de horas que se muestran en el detalle por hora
const HORAS_A_MOSTRAR = 12;

formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();

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
        mostrarRecomendacionRopa(clima.current);

        mostrarHoras(clima.hourly);

        mostrarPronostico(clima.daily);
        mostrarMensaje("");
    } catch (error) {
        console.error(error);
        mostrarMensaje("Ocurrió un error al consultar el clima. Intentá de nuevo.");
    }
});

async function buscarCiudad(nombre) {
    const url = `${URL_GEOCODING}?name=${encodeURIComponent(nombre)}&count=1&language=es&format=json`;
    const respuesta = await fetch(url);
    if (!respuesta.ok) throw new Error("Error en la API de geocoding");

    const datos = await respuesta.json();
    return datos.results ? datos.results[0] : null;
}

async function obtenerClima(latitud, longitud) {
    const parametros = new URLSearchParams({
        latitude: latitud,
        longitude: longitud,
        current: "temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,is_day",
        daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max",
        hourly: "temperature_2m,precipitation_probability,weather_code,is_day",
        timezone: "auto",
        forecast_days: 6,
        // Las horas empiezan desde la hora actual de la ciudad consultada
        forecast_hours: HORAS_A_MOSTRAR,
    });

    const respuesta = await fetch(`${URL_CLIMA}?${parametros}`);
    if (!respuesta.ok) throw new Error("Error en la API de clima");

    return await respuesta.json();
}

function mostrarClimaActual(ciudad, actual) {
    const clima = traducirCodigo(actual.weather_code);

    document.getElementById("ciudad").textContent = ciudad.name;
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

// Lógica de recomendación para colgar la ropa
function evaluarSecadoRopa(actual) {
    const humedad = actual.relative_humidity_2m;
    const viento = actual.wind_speed_10m;
    const codigoClima = actual.weather_code;

    // Códigos de lluvia, llovizna, nieve o tormenta (>= 51)
    const hayPrecipitacion = codigoClima >= 51;

    if (hayPrecipitacion) {
        return {
            clase: "malo",
            estado: "No recomendado 🌧️",
            motivo: "Hay precipitaciones en curso o inminentes. Secá la ropa adentro.",
        };
    }

    // is_day vale 1 de día y 0 de noche
    if (actual.is_day === 0) {
        return {
            clase: "moderado",
            estado: "Es de noche 🌙",
            motivo: "Sin sol la ropa casi no se seca y junta humedad. Esperá a mañana o revisá el pronóstico de abajo.",
        };
    }

    if (humedad >= 80) {
        return {
            clase: "malo",
            estado: "No recomendado ❌",
            motivo: `La humedad es muy alta (${humedad}%). El secado será casi nulo y la ropa puede quedar con feo olor.`,
        };
    }

    if (humedad >= 70) {
        if (viento >= 15) {
            return {
                clase: "moderado",
                estado: "Favorable con reparos ⚠️",
                motivo: `Humedad alta (${humedad}%), pero el viento (${Math.round(viento)} km/h) ayuda al secado. Ideal solo para prendas finas.`,
            };
        }
        return {
            clase: "malo",
            estado: "Poco favorable ⏳",
            motivo: `Humedad de ${humedad}% y poco viento. Las prendas gruesas tardarán demasiado en secar.`,
        };
    }

    // Humedad menor al 70%
    if (viento >= 10) {
        return {
            clase: "optimo",
            estado: "¡Momento ideal! 🧺✨",
            motivo: `Baja humedad (${humedad}%) y buena brisa (${Math.round(viento)} km/h). La ropa se secará rápido.`,
        };
    }

    return {
        clase: "optimo",
        estado: "Condiciones buenas 👍",
        motivo: `Humedad favorable (${humedad}%). Con el correr de las horas secará bien.`,
    };
}

function mostrarRecomendacionRopa(actual) {
    const recomendacion = evaluarSecadoRopa(actual);

    tarjetaRopa.className = `tarjeta tarjeta-ropa ${recomendacion.clase}`;
    ropaEstado.textContent = recomendacion.estado;
    ropaMotivo.textContent = recomendacion.motivo;

    tarjetaRopa.hidden = false;
}

// ---------- Detalle por hora ----------

// La API devuelve un arreglo por cada dato (hourly.time, hourly.temperature_2m, ...)
// y el elemento i de cada arreglo corresponde a la misma hora.
function mostrarHoras(hourly) {
    listaHoras.innerHTML = "";

    for (let i = 0; i < hourly.time.length; i++) {
        const codigo = hourly.weather_code[i];
        const clima = traducirCodigo(codigo);
        // De noche, el sol se reemplaza por la luna
        const icono = hourly.is_day[i] === 0 && codigo <= 1 ? "🌙" : clima.icono;
        // La primera hora que devuelve la API es la actual
        const etiqueta = i === 0 ? "Ahora" : `${obtenerHora(hourly.time[i])} hs`;
        const temperatura = Math.round(hourly.temperature_2m[i]);
        const probLluvia = hourly.precipitation_probability[i] ?? 0;

        const item = document.createElement("li");
        item.className = "hora";
        item.title = clima.descripcion;
        item.innerHTML = `
            <span class="hora-etiqueta">${etiqueta}</span>
            <span class="hora-icono">${icono}</span>
            <span class="hora-temp">${temperatura}°</span>
            <span class="hora-lluvia">💧 ${probLluvia}%</span>
        `;
        listaHoras.appendChild(item);
    }

    tarjetaHoras.hidden = false;
}

// "2026-10-16T14:00" -> 14
function obtenerHora(fechaHora) {
    return Number(fechaHora.slice(11, 13));
}

function mostrarPronostico(diario) {
    listaPronostico.innerHTML = "";

    for (let i = 1; i < diario.time.length; i++) {
        const clima = traducirCodigo(diario.weather_code[i]);
        const fecha = new Date(`${diario.time[i]}T00:00`);
        const nombreDia = fecha.toLocaleDateString("es-AR", { weekday: "long" });
        const maxima = Math.round(diario.temperature_2m_max[i]);
        const minima = Math.round(diario.temperature_2m_min[i]);

        // Evaluación de ropa para ese día
        const probLluvia = diario.precipitation_probability_max ? diario.precipitation_probability_max[i] : 0;
        const vientoMax = diario.wind_speed_10m_max ? diario.wind_speed_10m_max[i] : 0;
        const ropaDia = evaluarDiaSecado(diario.weather_code[i], probLluvia, vientoMax);

        const item = document.createElement("li");
        item.className = "dia";
        item.innerHTML = `
            <span class="dia-nombre">${nombreDia}</span>
            <span class="dia-icono" title="${clima.descripcion}">${clima.icono}</span>
            <span class="dia-ropa" title="${ropaDia.texto}">${ropaDia.icono}</span>
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
    tarjetaRopa.hidden = true;
    tarjetaHoras.hidden = true;
    tarjetaPronostico.hidden = true;
}

// Evalúa el día completo para el pronóstico extendido
function evaluarDiaSecado(codigoClima, probLluvia, vientoMax) {
    // Si hay lluvia prevista o el código es de mal tiempo
    if (codigoClima >= 51 || probLluvia > 35) {
        return { icono: "❌", texto: "No colgar: riesgo de lluvia" };
    }

    // Días despejados o con poco sol pero buen viento
    if (codigoClima <= 2) { // 0, 1, 2 son despejado / algo nublado
        return { icono: "🧺✨", texto: "Ideal para colgar: sol y buen tiempo" };
    }

    if (vientoMax >= 15) {
        return { icono: "🧺", texto: "Aceptable: nublado pero con viento" };
    }

    return { icono: "⚠️", texto: "Regular: nublado y poco viento (secado lento)" };
}