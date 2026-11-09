
const db = require('../config/db');

// Menampilkan seluruh transaksi barang masuk
const getAll = async () => {
    const [rows] = await db.execute(`
        SELECT
            bm.id,
            bm.barang_id,
            bm.tanggal,
            bm.jumlah,
            bm.keterangan,
            b.kode,
            b.nama AS nama_barang,
            b.satuan
        FROM barang_masuk bm
        JOIN barang b ON bm.barang_id = b.id
        ORDER BY bm.tanggal DESC, bm.id DESC
    `);

    return rows;
};

// Mengambil satu transaksi berdasarkan ID
const getById = async (id) => {
    const [rows] = await db.execute(
        'SELECT * FROM barang_masuk WHERE id = ?',
        [id]
    );

    return rows[0];
};

// Mengambil daftar barang untuk dropdown
const getBarang = async () => {
    const [rows] = await db.execute(`
        SELECT id, kode, nama, satuan, stok
        FROM barang
        ORDER BY nama ASC
    `);

    return rows;
};

// Menambah transaksi barang masuk
const create = async (data) => {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // Mengunci data barang agar tidak bentrok
        const [barang] = await connection.execute(
            'SELECT id FROM barang WHERE id = ? FOR UPDATE',
            [data.barang_id]
        );

        if (barang.length === 0) {
            throw new Error('Barang tidak ditemukan.');
        }

        // Menyimpan transaksi
        const [result] = await connection.execute(
            `INSERT INTO barang_masuk
            (barang_id, tanggal, jumlah, keterangan)
            VALUES (?, ?, ?, ?)`,
            [
                data.barang_id,
                data.tanggal,
                data.jumlah,
                data.keterangan
            ]
        );

        // Menambahkan stok barang
        await connection.execute(
            'UPDATE barang SET stok = stok + ? WHERE id = ?',
            [data.jumlah, data.barang_id]
        );

        await connection.commit();

        return result.insertId;

    } catch (error) {
        await connection.rollback();
        throw error;

    } finally {
        connection.release();
    }
};

// Mengedit transaksi barang masuk
const update = async (id, data) => {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // Mengunci transaksi lama
        const [oldRows] = await connection.execute(
            'SELECT * FROM barang_masuk WHERE id = ? FOR UPDATE',
            [id]
        );

        if (oldRows.length === 0) {
            throw new Error('Transaksi tidak ditemukan.');
        }

        const oldData = oldRows[0];

        // Mengunci barang lama dan barang baru secara berurutan
        const barangIds = [
            ...new Set([
                Number(oldData.barang_id),
                Number(data.barang_id)
            ])
        ].sort((a, b) => a - b);

        for (const barangId of barangIds) {
            const [rows] = await connection.execute(
                'SELECT id FROM barang WHERE id = ? FOR UPDATE',
                [barangId]
            );

            if (rows.length === 0) {
                throw new Error('Barang tidak ditemukan.');
            }
        }

        // Jika barangnya sama, hitung selisih stok
        if (Number(oldData.barang_id) === Number(data.barang_id)) {

            const selisih = Number(data.jumlah) - Number(oldData.jumlah);

            if (selisih < 0) {
                const [rows] = await connection.execute(
                    'SELECT stok FROM barang WHERE id = ?',
                    [data.barang_id]
                );

                if (Number(rows[0].stok) + selisih < 0) {
                    throw new Error(
                        'Stok tidak mencukupi untuk mengubah transaksi.'
                    );
                }
            }

            await connection.execute(
                'UPDATE barang SET stok = stok + ? WHERE id = ?',
                [selisih, data.barang_id]
            );

        } else {

            // Kembalikan pengaruh transaksi lama
            const [oldBarang] = await connection.execute(
                'SELECT stok FROM barang WHERE id = ?',
                [oldData.barang_id]
            );

            if (Number(oldBarang[0].stok) < Number(oldData.jumlah)) {
                throw new Error(
                    'Stok barang lama tidak cukup untuk membatalkan transaksi.'
                );
            }

            await connection.execute(
                'UPDATE barang SET stok = stok - ? WHERE id = ?',
                [oldData.jumlah, oldData.barang_id]
            );

            // Terapkan transaksi baru
            await connection.execute(
                'UPDATE barang SET stok = stok + ? WHERE id = ?',
                [data.jumlah, data.barang_id]
            );
        }

        // Memperbarui data transaksi
        await connection.execute(
            `UPDATE barang_masuk
            SET barang_id = ?, tanggal = ?, jumlah = ?, keterangan = ?
            WHERE id = ?`,
            [
                data.barang_id,
                data.tanggal,
                data.jumlah,
                data.keterangan,
                id
            ]
        );

        await connection.commit();

        return true;

    } catch (error) {
        await connection.rollback();
        throw error;

    } finally {
        connection.release();
    }
};

// Menghapus transaksi barang masuk
const deleteData = async (id) => {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // Mengunci transaksi
        const [rows] = await connection.execute(
            'SELECT * FROM barang_masuk WHERE id = ? FOR UPDATE',
            [id]
        );

        if (rows.length === 0) {
            throw new Error('Transaksi tidak ditemukan.');
        }

        const transaksi = rows[0];

        // Mengunci barang terkait
        const [barang] = await connection.execute(
            'SELECT stok FROM barang WHERE id = ? FOR UPDATE',
            [transaksi.barang_id]
        );

        if (barang.length === 0) {
            throw new Error('Barang tidak ditemukan.');
        }

        // Pastikan stok tidak menjadi negatif
        if (Number(barang[0].stok) < Number(transaksi.jumlah)) {
            throw new Error(
                'Transaksi tidak dapat dihapus karena stok sudah terpakai.'
            );
        }

        // Mengurangi stok sesuai transaksi yang dihapus
        await connection.execute(
            'UPDATE barang SET stok = stok - ? WHERE id = ?',
            [transaksi.jumlah, transaksi.barang_id]
        );

        // Menghapus transaksi
        await connection.execute(
            'DELETE FROM barang_masuk WHERE id = ?',
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
};

module.exports = {
    getAll,
    getById,
    getBarang,
    create,
    update,
    deleteData
};
