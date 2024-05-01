const express = require('express');
const app = express();
app.use(express.json());

// Base de datos en memoria (Acoplamiento de Datos)
const turnos = [];

// Endpoint monolítico: lógica de negocio, datos y presentación en una sola capa
app.post('/api/turnos', (req, res) => {
    const { cliente, fecha, hora, negocio } = req.body;
    
    // Reglas de negocio rígidas mezcladas con el controlador
    if (!cliente || !fecha || !hora) {
        return res.status(400).send("Faltan datos requeridos");
    }
    
    // Inserción de datos
    const nuevoTurno = { id: turnos.length + 1, cliente, fecha, hora, negocio };
    turnos.push(nuevoTurno);
    
    console.log(`[MONOLITO] Turno reservado para ${cliente} en ${negocio}`);

    // Capa de presentación (HTML) acoplada en la misma función
    res.status(201).send(`
        <html>
            <body>
                <h1>¡Turno Confirmado!</h1>
                <p>Gracias ${cliente}, tu turno en ${negocio} el día ${fecha} a las ${hora} está confirmado.</p>
                <a href="/">Volver</a>
            </body>
        </html>
    `);
});

app.get('/api/turnos', (req, res) => {
    res.json(turnos);
});

// Iniciando el Servidor Monolítico
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Monolito de Untoqueturno corriendo en http://localhost:${PORT}`);
    console.log(`⚠️  ADVERTENCIA: Arquitectura monolítica detectada. Difícil de escalar.`);
});
