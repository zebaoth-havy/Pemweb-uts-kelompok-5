
const keluarModel = require("../models/keluarModel");

// Fungsi untuk memeriksa ID dan jumlah bilangan bulat positif
const validAngka = (nilai) => {
  return /^[1-9]\d*$/.test(String(nilai || "")) &&
    Number.isSafeInteger(Number(nilai));
};

// Fungsi untuk memvalidasi input transaksi
const validTransaksi = (data) => {
  return (
    validAngka(data.barang_id) &&
    validAngka(data.jumlah) &&
    typeof data.tanggal === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(data.tanggal) &&
    !Number.isNaN(Date.parse(data.tanggal)) &&
    typeof data.tujuan === "string" &&
    data.tujuan.trim().length > 0 &&
    data.tujuan.trim().length <= 255
  );
};

// READ - Menampilkan seluruh transaksi barang keluar
exports.index = async (req, res) => {
  try {
    // Mengambil daftar transaksi melalui Model
    const transaksi = await keluarModel.getAll();

    // Menampilkan data pada halaman EJS
    return res.render("barang-keluar/index", {
      title: "Data Barang Keluar",
      transaksi: transaksi
    });

  } catch (error) {
    // Mencatat error pada terminal
    console.error(error);

    return res.status(500).send("Gagal mengambil data");
  }
};

// CREATE - Menampilkan halaman tambah transaksi
exports.formTambah = async (req, res) => {
  try {
    // Mengambil daftar barang untuk dropdown
    const barang = await keluarModel.getBarang();

    return res.render("barang-keluar/tambah", {
      title: "Tambah Barang Keluar",
      barang: barang
    });

  } catch (error) {
    console.error(error);
    return res.status(500).send("Gagal menampilkan form");
  }
};

// CREATE - Menyimpan transaksi barang keluar
exports.tambah = async (req, res) => {
  try {
    // Mengambil data dari formulir
    const { barang_id, tanggal, jumlah, tujuan } = req.body;

    // Melakukan validasi input di server
    if (!validTransaksi(req.body)) {
      return res.redirect("/barang-keluar/tambah");
    }

    // Memanggil Model untuk menyimpan transaksi
    // dan mengurangi stok secara atomik
    await keluarModel.create({
      barang_id: Number(barang_id),
      tanggal: tanggal,
      jumlah: Number(jumlah),
      tujuan: tujuan.trim()
    });

    // PRG - Mengalihkan halaman setelah POST
    return res.redirect("/barang-keluar");

  } catch (error) {
    console.error(error);

    // Kembali ke formulir jika transaksi gagal
    return res.redirect("/barang-keluar/tambah");
  }
};

// UPDATE - Menampilkan formulir edit
exports.formEdit = async (req, res) => {
  try {
    // Mengambil ID dari parameter URL
    const id = req.params.id;

    // Memeriksa apakah ID valid
    if (!validAngka(id)) {
      return res.status(400).send("ID tidak valid");
    }

    // Mengambil transaksi berdasarkan ID
    const transaksi = await keluarModel.getById(Number(id));

    // Memeriksa apakah transaksi ditemukan
    if (!transaksi) {
      return res.status(404).send("Transaksi tidak ditemukan");
    }

    // Mengambil daftar barang untuk dropdown
    const barang = await keluarModel.getBarang();

    // Menampilkan formulir dengan data awal terisi
    return res.render("barang-keluar/edit", {
      title: "Edit Barang Keluar",
      transaksi: transaksi,
      barang: barang
    });

  } catch (error) {
    console.error(error);
    return res.status(500).send("Gagal menampilkan form edit");
  }
};

// UPDATE - Menyimpan perubahan transaksi
exports.update = async (req, res) => {
  // Mengambil ID transaksi dari URL
  const id = req.params.id;

  // Memastikan ID valid sebelum digunakan
  if (!validAngka(id)) {
    return res.redirect("/barang-keluar");
  }

  try {
    // Mengambil data terbaru dari formulir
    const { barang_id, tanggal, jumlah, tujuan } = req.body;

    // Memvalidasi data yang dikirim pengguna
    if (!validTransaksi(req.body)) {
      return res.redirect("/barang-keluar");
    }

    // Memperbarui transaksi melalui Model
    // Model bertanggung jawab menyesuaikan stok
    await keluarModel.update(Number(id), {
      barang_id: Number(barang_id),
      tanggal: tanggal,
      jumlah: Number(jumlah),
      tujuan: tujuan.trim()
    });

    // PRG - Kembali ke halaman daftar transaksi
    return res.redirect("/barang-keluar");

  } catch (error) {
    console.error(error);
    return res.redirect("/barang-keluar");
  }
};

// DELETE - Menghapus transaksi barang keluar
exports.hapus = async (req, res) => {
  try {
    // Mengambil ID dari parameter URL
    const id = req.params.id;

    // Memeriksa ID sebelum memanggil Model
    if (!validAngka(id)) {
      return res.redirect("/barang-keluar");
    }

    // Menghapus transaksi dan mengembalikan stok
    await keluarModel.delete(Number(id));

    // PRG - Redirect setelah proses hapus
    return res.redirect("/barang-keluar");

  } catch (error) {
    console.error(error);
    return res.redirect("/barang-keluar");
  }
};
