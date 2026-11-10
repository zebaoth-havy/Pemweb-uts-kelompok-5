const { db } = require('../config/db');

const Masuk = {
    // Mengambil semua data barang masuk
    async getAll() {
        const [rows] = await db.query(`
            SELECT 
                bm.*,
                b.nama AS nama_barang,
                b.kode AS kode_barang,
                b.satuan
            FROM barang_masuk bm
            JOIN barang b ON bm.barang_id = b.id
            ORDER BY bm.id DESC
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

    // Menambahkan transaksi barang masuk dan menambah stok
    async create(data) {
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            await connection.query(
                `INSERT INTO barang_masuk
                (barang_id, tanggal, jumlah, keterangan)
                VALUES (?, ?, ?, ?)`,
                [
                    data.barang_id,
                    data.tanggal,
                    data.jumlah,
                    data.keterangan || null
                ]
            );

            await connection.query(
                `UPDATE barang SET stok = stok + ? WHERE id = ?`,
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
            `SELECT * FROM barang_masuk WHERE id = ?`,
            [id]
        );

        return rows[0];
    },

    // Mengubah transaksi dan menyesuaikan stok
    async update(id, data) {
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            const [rows] = await connection.query(
                `SELECT * FROM barang_masuk WHERE id = ? FOR UPDATE`,
                [id]
            );

            if (rows.length === 0) {
                throw new Error('Data barang masuk tidak ditemukan.');
            }

            const oldData = rows[0];

            await connection.query(
                `UPDATE barang SET stok = stok - ? WHERE id = ?`,
                [oldData.jumlah, oldData.barang_id]
            );

            await connection.query(
                `UPDATE barang_masuk
                SET barang_id = ?, tanggal = ?, jumlah = ?, keterangan = ?
                WHERE id = ?`,
                [
                    data.barang_id,
                    data.tanggal,
                    data.jumlah,
                    data.keterangan || null,
                    id
                ]
            );

            await connection.query(
                `UPDATE barang SET stok = stok + ? WHERE id = ?`,
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

    // Menghapus transaksi dan mengurangi kembali stok
    async deleteData(id) {
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            const [rows] = await connection.query(
                `SELECT * FROM barang_masuk WHERE id = ? FOR UPDATE`,
                [id]
            );

            if (rows.length === 0) {
                throw new Error('Data barang masuk tidak ditemukan.');
            }

            const data = rows[0];

            await connection.query(
                `UPDATE barang SET stok = stok - ? WHERE id = ?`,
                [data.jumlah, data.barang_id]
            );

            await connection.query(
                `DELETE FROM barang_masuk WHERE id = ?`,
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

module.exports = Masuk;
