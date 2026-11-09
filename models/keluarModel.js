
const pool = require("../config/db");

// READ - Mengambil seluruh transaksi barang keluar
exports.getAll = async () => {
  // JOIN digunakan untuk mengambil nama barang
  // berdasarkan relasi barang_id
  const sql = `
    SELECT
      bk.id,
      bk.barang_id,
      b.nama AS nama_barang,
      DATE_FORMAT(bk.tanggal, '%Y-%m-%d') AS tanggal,
      bk.jumlah,
      bk.tujuan
    FROM barang_keluar bk
    JOIN barang b ON bk.barang_id = b.id
    ORDER BY bk.id DESC
  `;

  // Menjalankan query SELECT
  const [rows] = await pool.execute(sql);

  // Mengembalikan hasil query ke Controller
  return rows;
};

// READ - Mengambil daftar barang untuk dropdown
exports.getBarang = async () => {
  const sql = `
    SELECT id, nama, stok
    FROM barang
    ORDER BY nama ASC
  `;

  const [rows] = await pool.execute(sql);

  return rows;
};

// READ - Mengambil satu transaksi berdasarkan ID
exports.getById = async (id) => {
  // Placeholder ? digunakan untuk keamanan query
  const sql = `
    SELECT
      id,
      barang_id,
      DATE_FORMAT(tanggal, '%Y-%m-%d') AS tanggal,
      jumlah,
      tujuan
    FROM barang_keluar
    WHERE id = ?
  `;

  const [rows] = await pool.execute(sql, [id]);

  // Mengembalikan satu transaksi atau null
  return rows[0] || null;
};

// CREATE - Menambahkan transaksi barang keluar
exports.create = async (data) => {
  // Mengambil satu koneksi dari connection pool
  const connection = await pool.getConnection();

  try {
    // Memulai transaksi database
    await connection.beginTransaction();

    // Mengurangi stok hanya jika jumlah mencukupi
    const [stokResult] = await connection.execute(
      `UPDATE barang
       SET stok = stok - ?
       WHERE id = ? AND stok >= ?`,
      [data.jumlah, data.barang_id, data.jumlah]
    );

    // Jika tidak ada baris berubah, transaksi ditolak
    if (stokResult.affectedRows === 0) {
      throw new Error("Barang tidak ada atau stok tidak cukup");
    }

    // Menyimpan riwayat barang keluar
    const sql = `
      INSERT INTO barang_keluar
      (barang_id, tanggal, jumlah, tujuan)
      VALUES (?, ?, ?, ?)
    `;

    await connection.execute(sql, [
      data.barang_id,
      data.tanggal,
      data.jumlah,
      data.tujuan
    ]);

    // Menyimpan semua perubahan secara permanen
    await connection.commit();

  } catch (error) {
    // Membatalkan semua perubahan jika terjadi error
    await connection.rollback();
    throw error;

  } finally {
    // Mengembalikan koneksi ke pool
    connection.release();
  }
};

// UPDATE - Mengubah transaksi barang keluar
exports.update = async (id, data) => {
  const connection = await pool.getConnection();

  try {
    // Memulai transaksi database
    await connection.beginTransaction();

    // Mengunci transaksi lama selama proses update
    const [rows] = await connection.execute(
      `SELECT barang_id, jumlah
       FROM barang_keluar
       WHERE id = ?
       FOR UPDATE`,
      [id]
    );

    // Memastikan transaksi ditemukan
    if (rows.length === 0) {
      throw new Error("Transaksi tidak ditemukan");
    }

    const lama = rows[0];

    // Mengembalikan stok dari transaksi lama
    await connection.execute(
      `UPDATE barang
       SET stok = stok + ?
       WHERE id = ?`,
      [lama.jumlah, lama.barang_id]
    );

    // Mengurangi stok sesuai data transaksi baru
    const [stokResult] = await connection.execute(
      `UPDATE barang
       SET stok = stok - ?
       WHERE id = ? AND stok >= ?`,
      [data.jumlah, data.barang_id, data.jumlah]
    );

    // Menolak perubahan jika stok tidak mencukupi
    if (stokResult.affectedRows === 0) {
      throw new Error("Stok tidak mencukupi");
    }

    // Memperbarui data transaksi
    const sql = `
      UPDATE barang_keluar
      SET barang_id = ?,
          tanggal = ?,
          jumlah = ?,
          tujuan = ?
      WHERE id = ?
    `;

    await connection.execute(sql, [
      data.barang_id,
      data.tanggal,
      data.jumlah,
      data.tujuan,
      id
    ]);

    // Menyimpan seluruh perubahan
    await connection.commit();

  } catch (error) {
    // Mengembalikan database ke kondisi sebelum update
    await connection.rollback();
    throw error;

  } finally {
    // Melepaskan koneksi ke pool
    connection.release();
  }
};

// DELETE - Menghapus transaksi barang keluar
exports.delete = async (id) => {
  const connection = await pool.getConnection();

  try {
    // Memulai transaksi database
    await connection.beginTransaction();

    // Mengambil dan mengunci transaksi yang akan dihapus
    const [rows] = await connection.execute(
      `SELECT barang_id, jumlah
       FROM barang_keluar
       WHERE id = ?
       FOR UPDATE`,
      [id]
    );

    // Memeriksa apakah transaksi ditemukan
    if (rows.length === 0) {
      throw new Error("Transaksi tidak ditemukan");
    }

    const transaksi = rows[0];

    // Mengembalikan stok barang
    await connection.execute(
      `UPDATE barang
       SET stok = stok + ?
       WHERE id = ?`,
      [transaksi.jumlah, transaksi.barang_id]
    );

    // Menghapus riwayat transaksi berdasarkan ID
    await connection.execute(
      `DELETE FROM barang_keluar
       WHERE id = ?`,
      [id]
    );

    // Menyimpan perubahan
    await connection.commit();

  } catch (error) {
    // Membatalkan perubahan jika ada kesalahan
    await connection.rollback();
    throw error;

  } finally {
    // Mengembalikan koneksi ke pool
    connection.release();
  }
};
