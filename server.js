const express = require('express');
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors());

// Flota unificada de motorizados (sirven tanto para pasajeros como para domicilios)
let conductores = [
    {
        id: 1,
        nombre: "Amaury Cuellar Rebolledo Lopez",
        vehiculo: "Yamaha FZ - Negra",
        placa: "MNO-123",
        telefonoWhatsapp: "573108364837",
        lat: 3.5158,
        lng: -76.4891
    },
    {
        id: 2,
        nombre: "Esteban Morales",
        vehiculo: "Suzuki Gixxer - Azul",
        placa: "XYZ-789",
        telefonoWhatsapp: "573200000000",
        lat: 3.4516,
        lng: -76.5320
    },
    {
        id: 3,
        nombre: "Felipe Orozco",
        vehiculo: "Honda CB160 - Roja",
        placa: "ABC-456",
        telefonoWhatsapp: "573150000000",
        lat: 3.4372,
        lng: -76.5225
    }
];

function calcularDistancia(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; 
}

app.post('/api/buscar-conductor', (req, res) => {
    const { tipoServicio, origenTexto, latPasajero, lngPasajero, destino, detalle, telefono } = req.body;

    let conductorSeleccionado = null;
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
    } else {
        conductorSeleccionado = conductores[0];
    }

    if (!conductorSeleccionado) {
        return res.json({ success: false });
    }

    // Creamos el enlace de Google Maps para ambos casos (GPS o Texto Manual)
    let lineaRecogida = "";
    if (usoGps) {
        const linkMaps = `https://maps.google.com/?q=${latPasajero},${lngPasajero}`;
        lineaRecogida = `📍 Recogida (GPS): ${origenTexto}\n🗺️ Ver en Google Maps: ${linkMaps}`;
    } else {
        // Truco para buscar la dirección de texto manual directamente en Maps
        const direccionBusqueda = encodeURIComponent(`${origenTexto}, Yumbo, Colombia`);
        const linkMaps = `https://www.google.com/maps/search/?api=1&query=${direccionBusqueda}`;
        lineaRecogida = `📍 Recogida (Manual): ${origenTexto}\n🗺️ Buscar en Google Maps: ${linkMaps}`;
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
    console.log(`Super App corriendo en http://localhost:${PORT}`);
});