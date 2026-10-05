const express = require('express');
const cors = require('cors');
const app = express();

// Configuración avanzada de CORS para permitir todo desde cualquier frontend
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

let conductores = [
    {
        id: 1,
        nombre: "Amaury Cuellar Rebolledo Lopez",
        vehiculo: "Yamaha FZ - Negra",
        placa: "MNO-123",
        telefonoWhatsapp: "573108364837",
        lat: 3.5158,
        lng: -76.4891
    }
];

function calcularDistancia(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

app.post('/api/buscar-conductor', (req, res) => {
    const { tipoServicio, origenTexto, latPasajero, lngPasajero, destino, detalle, telefono } = req.body;

    let conductorSeleccionado = conductores[0];
    let distanciaStr = "Dirección manual";
    let tiempoEstimado = "10 mins";

    const usoGps = (latPasajero !== null && lngPasajero !== null && !isNaN(latPasajero));

    if (usoGps) {
        let menorDistancia = Infinity;
        conductores.forEach(conductor => {
            const distancia = calcularDistancia(latPasajero, lngPasajero, conductor.lat, conductor.lng);
            if (distancia < menorDistancia) {
                menorDistancia = distancia;
                conductorSeleccionado = conductor;
            }
        });
        distanciaStr = menorDistancia.toFixed(2) + " km";
        tiempoEstimado = Math.max(3, Math.round(menorDistancia * 4)) + " mins";
    }

    let lineaRecogida = "";
    if (usoGps) {
        const linkMaps = `https://maps.google.com/?q=${latPasajero},${lngPasajero}`;
        lineaRecogida = `📍 Recogida (GPS): ${origenTexto}\n🗺️ Ver en Google Maps: ${linkMaps}`;
    } else {
        const direccionBusqueda = encodeURIComponent(`${origenTexto}, Yumbo, Colombia`);
        const linkMaps = `https://www.google.com/maps/search/?api=1&query=${direccionBusqueda}`;
        lineaRecogida = `📍 Recogida (Manual): ${origenTexto}\n🗺 Buscar en Google Maps: ${linkMaps}`;
    }

    let textoMensaje = "";
    if (tipoServicio === 'domicilio') {
        textoMensaje = `Hola ${conductorSeleccionado.nombre}, necesito un servicio de domicilio/mandado.\n${lineaRecogida}\n🏁 Entrega: ${destino}\n📦 Detalle: ${detalle}\n📱 Mi Teléfono: ${telefono}`;
    } else {
        textoMensaje = `Hola ${conductorSeleccionado.nombre}, necesito un servicio de Moto-Taxi.\n${lineaRecogida}\n🏁 Destino: ${destino}\n💬 Nota: ${detalle}\n📱 Mi Teléfono: ${telefono}`;
    }

    const whatsappUrl = `https://wa.me/${conductorSeleccionado.telefonoWhatsapp}?text=${encodeURIComponent(textoMensaje)}`;

    res.json({
        success: true,
        conductor: {
            nombre: conductorSeleccionado.nombre,
            vehiculo: conductorSeleccionado.vehiculo,
            placa: conductorSeleccionado.placa,
            tiempo: tiempoEstimado,
            distanciaKm: distanciaStr
        },
        whatsappUrl: whatsappUrl
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
