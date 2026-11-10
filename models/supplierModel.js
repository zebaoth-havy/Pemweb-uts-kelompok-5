
const { db } = require('../config/db');

// Mengambil semua supplier
const getAll = async () => {
    const [rows] = await db.query(
        'SELECT * FROM suppliers ORDER BY id DESC'
    );
    return rows;
};

// Mengambil supplier berdasarkan ID
const getById = async (id) => {
    const [rows] = await db.query(
        'SELECT * FROM suppliers WHERE id = ?',
        [id]
    );
    return rows[0];
};

// Menambahkan supplier
const create = async (data) => {
    const { nama, telepon, email, alamat } = data;

    const [result] = await db.query(
        `INSERT INTO suppliers (nama, telepon, email, alamat)
         VALUES (?, ?, ?, ?)`,
        [nama, telepon, email, alamat]
    );

    return result;
};

// Mengedit supplier
const update = async (id, data) => {
    const { nama, telepon, email, alamat } = data;

    const [result] = await db.query(
        `UPDATE suppliers
         SET nama = ?, telepon = ?, email = ?, alamat = ?
         WHERE id = ?`,
        [nama, telepon, email, alamat, id]
    );

    return result;
};

// Mengecek apakah supplier digunakan oleh barang
const isUsed = async (id) => {
    const [rows] = await db.query(
        'SELECT id FROM barang WHERE supplier_id = ? LIMIT 1',
        [id]
    );

    return rows.length > 0;
};

// Menghapus supplier
const remove = async (id) => {
    const [result] = await db.query(
        'DELETE FROM suppliers WHERE id = ?',
        [id]
    );

    return result;
};

module.exports = {
    getAll,
    getById,
    create,
    update,
    isUsed,
    remove
};
