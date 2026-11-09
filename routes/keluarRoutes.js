
const express = require("express");

// Membuat Router Express untuk modul Barang Keluar
const router = express.Router();

// Menghubungkan Routes dengan Controller Barang Keluar
const keluarController = require("../controllers/keluarController");

// READ - Menampilkan daftar transaksi barang keluar
router.get("/", keluarController.index);

// CREATE - Menampilkan formulir tambah barang keluar
router.get("/tambah", keluarController.formTambah);

// CREATE - Menyimpan transaksi baru menggunakan POST
router.post("/tambah", keluarController.tambah);

// UPDATE - Menampilkan formulir edit berdasarkan ID
router.get("/:id/edit", keluarController.formEdit);

// UPDATE - Menyimpan perubahan transaksi menggunakan POST
router.post("/:id/edit", keluarController.update);

// DELETE - Menghapus transaksi berdasarkan ID menggunakan POST
router.post("/:id/hapus", keluarController.hapus);

// Mengekspor Router agar dapat digunakan di app.js
module.exports = router;
