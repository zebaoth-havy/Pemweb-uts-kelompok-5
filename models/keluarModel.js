
const { db } = require('../config/db');

const Keluar = {
    // Mengambil semua data barang keluar
    async getAll() {
        const [rows] = await db.query(`
            SELECT 
                bk.*,
                b.nama AS nama_barang,
                b.kode AS kode_barang,
                b.satuan
            FROM barang_keluar bk
            JOIN barang b ON bk.barang_id = b.id
            ORDER BY bk.id DESC
        `);

        return rows;
    },

    // Mengambil daftar barang untuk dropdown
    async getBarang() {
        const [rows] = await db.query(`
            SELECT id, kode, nama, stok, satuan
            FROM barang
            ORDER BY nama ASC
        `);

        return rows;
    },

    // Menambahkan transaksi barang keluar dan mengurangi stok
    async create(data) {
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            const [rows] = await connection.query(
                `SELECT stok FROM barang WHERE id = ? FOR UPDATE`,
                [data.barang_id]
            );

            if (rows.length === 0) {
                throw new Error('Barang tidak ditemukan.');
            }

            if (Number(rows[0].stok) < Number(data.jumlah)) {
                throw new Error('Stok barang tidak mencukupi.');
            }

            await connection.query(
                `INSERT INTO barang_keluar
                (barang_id, tanggal, jumlah, tujuan)
                VALUES (?, ?, ?, ?)`,
                [
                    data.barang_id,
                    data.tanggal,
                    data.jumlah,
                    data.tujuan
                ]
            );

            await connection.query(
                `UPDATE barang SET stok = stok - ? WHERE id = ?`,
                [data.jumlah, data.barang_id]
            );

            await connection.commit();
            return true;

        } catch (error) {
            await connection.rollback();
            throw error;

        } finally {
            connection.release();
        }
    },

    // Mengambil transaksi berdasarkan ID
    async getById(id) {
        const [rows] = await db.query(
            `SELECT * FROM barang_keluar WHERE id = ?`,
            [id]
        );

        return rows[0];
    },

    // Mengubah transaksi dan menyesuaikan stok
    async update(id, data) {
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            const [oldRows] = await connection.query(
                `SELECT * FROM barang_keluar WHERE id = ? FOR UPDATE`,
                [id]
            );

            if (oldRows.length === 0) {
                throw new Error('Data barang keluar tidak ditemukan.');
            }

            const oldData = oldRows[0];

            // Kembalikan stok dari transaksi lama
            await connection.query(
                `UPDATE barang SET stok = stok + ? WHERE id = ?`,
                [oldData.jumlah, oldData.barang_id]
            );

            // Periksa stok barang yang akan digunakan
            const [barangRows] = await connection.query(
                `SELECT stok FROM barang WHERE id = ? FOR UPDATE`,
                [data.barang_id]
            );

            if (barangRows.length === 0) {
                throw new Error('Barang tidak ditemukan.');
            }

            if (Number(barangRows[0].stok) < Number(data.jumlah)) {
                throw new Error('Stok barang tidak mencukupi.');
            }

            await connection.query(
                `UPDATE barang_keluar
                SET barang_id = ?, tanggal = ?, jumlah = ?, tujuan = ?
                WHERE id = ?`,
                [
                    data.barang_id,
                    data.tanggal,
                    data.jumlah,
                    data.tujuan,
                    id
                ]
            );

            await connection.query(
                `UPDATE barang SET stok = stok - ? WHERE id = ?`,
                [data.jumlah, data.barang_id]
            );

            await connection.commit();
            return true;

        } catch (error) {
            await connection.rollback();
            throw error;

        } finally {
            connection.release();
        }
    },

    // Menghapus transaksi dan mengembalikan stok
    async deleteData(id) {
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            const [rows] = await connection.query(
                `SELECT * FROM barang_keluar WHERE id = ? FOR UPDATE`,
                [id]
            );

            if (rows.length === 0) {
                throw new Error('Data barang keluar tidak ditemukan.');
            }

            const data = rows[0];

            await connection.query(
                `UPDATE barang SET stok = stok + ? WHERE id = ?`,
                [data.jumlah, data.barang_id]
            );

            await connection.query(
                `DELETE FROM barang_keluar WHERE id = ?`,
                [id]
            );

            await connection.commit();
            return true;

        } catch (error) {
            await connection.rollback();
            throw error;

        } finally {
            connection.release();
        }
    }
};

module.exports = Keluar;
