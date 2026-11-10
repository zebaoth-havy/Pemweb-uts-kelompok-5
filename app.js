
const express = require('express');
const path = require('path');
require('dotenv').config();

const { db, testConnection } = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

// EJS configuration
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ==============================
// ROUTES
// ==============================

// Barang
const barangRoutes = require('./routes/barangRoutes');
app.use('/barang', barangRoutes);

// Barang Masuk
const masukRoutes = require('./routes/masukRoutes');
app.use('/barang-masuk', masukRoutes);

// Supplier
const supplierRoutes = require('./routes/supplierRoutes');
app.use('/supplier', supplierRoutes);

// Barang Keluar
const keluarRoutes = require('./routes/keluarRoutes');
app.use('/barang-keluar', keluarRoutes);

// ==============================
// DASHBOARD
// ==============================

app.get('/', async (req, res) => {
    try {
        const [barang] = await db.query(
            'SELECT COUNT(*) AS total FROM barang'
        );

        const [supplier] = await db.query(
            'SELECT COUNT(*) AS total FROM suppliers'
        );

        const [masuk] = await db.query(
            'SELECT COALESCE(SUM(jumlah), 0) AS total FROM barang_masuk'
        );

        const [keluar] = await db.query(
            'SELECT COALESCE(SUM(jumlah), 0) AS total FROM barang_keluar'
        );

        res.render('dashboard', {
            title: 'Dashboard StockFlow',
            totalBarang: barang[0].total,
            totalSupplier: supplier[0].total,
            totalMasuk: masuk[0].total,
            totalKeluar: keluar[0].total
        });

    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).send(
            'Gagal memuat dashboard: ' + error.message
        );
    }
});

// ==============================
// 404 HANDLER
// ==============================

app.use((req, res) => {
    res.status(404).send('Halaman tidak ditemukan.');
});

// ==============================
// SERVER
// ==============================

async function startServer() {
    try {
        await testConnection();

        app.listen(PORT, () => {
            console.log(
                `StockFlow berjalan di http://localhost:${PORT}`
            );
        });

    } catch (error) {
        console.error(
            'Server gagal dijalankan:',
            error.message
        );

        process.exit(1);
    }
}

startServer();
