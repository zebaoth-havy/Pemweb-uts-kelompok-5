
const express = require('express');
const path = require('path');
require('dotenv').config();

const { testConnection } = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;
const masukRoutes = require('./routes/masukRoutes');
// EJS configuration
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Barang routes
const barangRoutes = require('./routes/barangRoutes');
app.use('/barang', barangRoutes);

// Barang Masuk routes
const masukRoutes = require('./routes/masukRoutes');
app.use('/barang-masuk', masukRoutes);

// Dashboard
app.get('/', async (req, res) => {
    res.render('dashboard', {
        title: 'Dashboard StockFlow'
    });
});

// Integrasi modul anggota lain
// Aktifkan setelah file routes tersedia.

// app.use('/supplier', require('./routes/supplierRoutes'));
// app.use('/barang-keluar', require('./routes/keluarRoutes'));

// 404 handler
app.use((req, res) => {
    res.status(404).send('Halaman tidak ditemukan.');
});

// Server
async function startServer() {
    try {
        await testConnection();

        app.listen(PORT, () => {
            console.log(`StockFlow berjalan di http://localhost:${PORT}`);
        });

    } catch (error) {
        console.error('Server gagal dijalankan:', error.message);
        process.exit(1);
    }
}

startServer();
