const { db } = require('../config/db');

const Barang = {

    // Mengambil seluruh data barang
    getAll: async () => {
        const [rows] = await db.execute(`
            SELECT
                b.id,
                b.kode,
                b.nama,
                b.supplier_id,
                b.satuan,
                b.stok,
                s.nama AS nama_supplier
            FROM barang b
            LEFT JOIN suppliers s
                ON b.supplier_id = s.id
            ORDER BY b.id DESC
        `);

        return rows;
    },

    // Mengambil barang berdasarkan ID
    getById: async (id) => {
        const [rows] = await db.execute(
            'SELECT * FROM barang WHERE id = ?',
            [id]
        );

        return rows[0];
    },

    // Mengambil seluruh supplier untuk dropdown
    getSuppliers: async () => {
        const [rows] = await db.execute(
            'SELECT id, nama FROM suppliers ORDER BY nama ASC'
        );

        return rows;
    },

    // Mengecek apakah kode barang sudah digunakan
    checkKode: async (kode, excludeId = null) => {
        let sql = 'SELECT id FROM barang WHERE kode = ?';
        const params = [kode];

        if (excludeId !== null) {
            sql += ' AND id != ?';
            params.push(excludeId);
        }

        const [rows] = await db.execute(sql, params);

        return rows.length > 0;
    },

    // Menambahkan barang
    create: async (data) => {
        const { kode, nama, supplier_id, satuan, stok } = data;

        const [result] = await db.execute(
            `INSERT INTO barang
            (kode, nama, supplier_id, satuan, stok)
            VALUES (?, ?, ?, ?, ?)`,
            [kode, nama, supplier_id, satuan, stok]
        );

        return result;
    },

    // Memperbarui barang
    update: async (id, data) => {
        const { kode, nama, supplier_id, satuan, stok } = data;

        const [result] = await db.execute(
            `UPDATE barang
            SET kode = ?,
                nama = ?,
                supplier_id = ?,
                satuan = ?,
                stok = ?
            WHERE id = ?`,
            [kode, nama, supplier_id, satuan, stok, id]
        );

        return result;
    },

    // Mengecek apakah barang memiliki riwayat transaksi
    hasTransaction: async (id) => {
        const [rows] = await db.execute(
            `SELECT
                (SELECT COUNT(*) FROM barang_masuk WHERE barang_id = ?) +
                (SELECT COUNT(*) FROM barang_keluar WHERE barang_id = ?)
                AS total`,
            [id, id]
        );

        return rows[0].total > 0;
    },

    // Menghapus barang
    delete: async (id) => {
        const [result] = await db.execute(
            'DELETE FROM barang WHERE id = ?',
            [id]
        );

        return result;
    }

};

module.exports = Barang;
