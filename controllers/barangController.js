const Barang = require('../models/barangModel');

const barangController = {

    // Menampilkan daftar barang
    index: async (req, res) => {
        try {
            const barang = await Barang.getAll();

            res.render('barang/index', {
                title: 'Data Barang',
                barang,
                success: req.query.success,
                error: req.query.error
            });

        } catch (error) {
            console.error(error);
            res.status(500).send('Gagal mengambil data barang.');
        }
    },

    // Menampilkan form tambah barang
    create: async (req, res) => {
        try {
            const suppliers = await Barang.getSuppliers();

            res.render('barang/form', {
                title: 'Tambah Barang',
                barang: null,
                suppliers,
                error: null
            });

        } catch (error) {
            console.error(error);
            res.status(500).send('Gagal membuka form barang.');
        }
    },

    // Menyimpan barang baru
    store: async (req, res) => {
        try {
            const { kode, nama, supplier_id, satuan, stok } = req.body;

            if (!kode || !nama || !supplier_id || !satuan ||
                stok === undefined || stok === '') {
                const suppliers = await Barang.getSuppliers();

                return res.status(400).render('barang/form', {
                    title: 'Tambah Barang',
                    barang: req.body,
                    suppliers,
                    error: 'Semua field wajib diisi.'
                });
            }

            const jumlahStok = Number(stok);

            if (!Number.isSafeInteger(jumlahStok) || jumlahStok < 0) {
                const suppliers = await Barang.getSuppliers();

                return res.status(400).render('barang/form', {
                    title: 'Tambah Barang',
                    barang: req.body,
                    suppliers,
                    error: 'Stok harus berupa bilangan bulat dan tidak negatif.'
                });
            }

            const supplier = await Barang.getSuppliers();
            const supplierValid = supplier.some(
                item => item.id === Number(supplier_id)
            );

            if (!supplierValid) {
                return res.status(400).render('barang/form', {
                    title: 'Tambah Barang',
                    barang: req.body,
                    suppliers: supplier,
                    error: 'Supplier tidak ditemukan.'
                });
            }

            const kodeBersih = kode.trim().toUpperCase();

            if (await Barang.checkKode(kodeBersih)) {
                return res.status(400).render('barang/form', {
                    title: 'Tambah Barang',
                    barang: req.body,
                    suppliers: supplier,
                    error: 'Kode barang sudah digunakan.'
                });
            }

            await Barang.create({
                kode: kodeBersih,
                nama: nama.trim(),
                supplier_id: Number(supplier_id),
                satuan: satuan.trim(),
                stok: jumlahStok
            });

            res.redirect('/barang?success=Barang berhasil ditambahkan');

        } catch (error) {
            console.error(error);
            res.status(500).send('Gagal menyimpan barang.');
        }
    },

    // Menampilkan form edit
    edit: async (req, res) => {
        try {
            const id = Number(req.params.id);

            if (!Number.isSafeInteger(id) || id < 1) {
                return res.status(400).send('ID barang tidak valid.');
            }

            const barang = await Barang.getById(id);

            if (!barang) {
                return res.status(404).send('Barang tidak ditemukan.');
            }

            const suppliers = await Barang.getSuppliers();

            res.render('barang/form', {
                title: 'Edit Barang',
                barang,
                suppliers,
                error: null
            });

        } catch (error) {
            console.error(error);
            res.status(500).send('Gagal membuka data barang.');
        }
    },

    // Memperbarui data barang
    update: async (req, res) => {
        try {
            const id = Number(req.params.id);

            if (!Number.isSafeInteger(id) || id < 1) {
                return res.status(400).send('ID barang tidak valid.');
            }

            const existing = await Barang.getById(id);

            if (!existing) {
                return res.status(404).send('Barang tidak ditemukan.');
            }

            const { kode, nama, supplier_id, satuan, stok } = req.body;

            const suppliers = await Barang.getSuppliers();

            const formError = (message) => {
                return res.status(400).render('barang/form', {
                    title: 'Edit Barang',
                    barang: { ...req.body, id },
                    suppliers,
                    error: message
                });
            };

            if (!kode || !nama || !supplier_id || !satuan ||
                stok === undefined || stok === '') {
                return formError('Semua field wajib diisi.');
            }

            const jumlahStok = Number(stok);

            if (!Number.isSafeInteger(jumlahStok) || jumlahStok < 0) {
                return formError('Stok harus berupa bilangan bulat dan tidak negatif.');
            }

            if (!suppliers.some(item => item.id === Number(supplier_id))) {
                return formError('Supplier tidak ditemukan.');
            }

            const kodeBersih = kode.trim().toUpperCase();

            if (await Barang.checkKode(kodeBersih, id)) {
                return formError('Kode barang sudah digunakan.');
            }

            // Stok awal tidak boleh diubah jika sudah ada transaksi.
            if (Number(existing.stok) !== jumlahStok) {
                const hasTransaction = await Barang.hasTransaction(id);

                if (hasTransaction) {
                    return formError(
                        'Stok tidak dapat diubah langsung karena barang sudah memiliki riwayat transaksi.'
                    );
                }
            }

            await Barang.update(id, {
                kode: kodeBersih,
                nama: nama.trim(),
                supplier_id: Number(supplier_id),
                satuan: satuan.trim(),
                stok: jumlahStok
            });

            res.redirect('/barang?success=Barang berhasil diperbarui');

        } catch (error) {
            console.error(error);
            res.status(500).send('Gagal memperbarui barang.');
        }
    },

    // Menghapus barang
    destroy: async (req, res) => {
        try {
            const id = Number(req.params.id);

            if (!Number.isSafeInteger(id) || id < 1) {
                return res.redirect('/barang?error=ID barang tidak valid');
            }

            const barang = await Barang.getById(id);

            if (!barang) {
                return res.redirect('/barang?error=Barang tidak ditemukan');
            }

            const hasTransaction = await Barang.hasTransaction(id);

            if (hasTransaction) {
                return res.redirect(
                    '/barang?error=Barang memiliki riwayat transaksi dan tidak dapat dihapus'
                );
            }

            await Barang.delete(id);

            res.redirect('/barang?success=Barang berhasil dihapus');

        } catch (error) {
            console.error(error);
            res.redirect('/barang?error=Gagal menghapus barang');
        }
    }

};

module.exports = barangController;
