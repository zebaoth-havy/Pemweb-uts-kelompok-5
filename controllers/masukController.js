
const Masuk = require('../models/masukModel');

// Validasi input transaksi
const validateInput = (data) => {
    const barang_id = Number(data.barang_id);
    const jumlah = Number(data.jumlah);
    const tanggal = data.tanggal;
    const keterangan = (data.keterangan || '').trim();

    if (!Number.isInteger(barang_id) || barang_id <= 0) {
        return { error: 'Silakan pilih barang yang valid.' };
    }

    if (!Number.isInteger(jumlah) || jumlah <= 0) {
        return { error: 'Jumlah barang harus berupa angka positif.' };
    }

    if (!tanggal || !/^\d{4}-\d{2}-\d{2}$/.test(tanggal)) {
        return { error: 'Tanggal transaksi tidak valid.' };
    }

    const date = new Date(`${tanggal}T00:00:00Z`);

    if (
        Number.isNaN(date.getTime()) ||
        date.toISOString().slice(0, 10) !== tanggal
    ) {
        return { error: 'Tanggal transaksi tidak valid.' };
    }

    if (keterangan.length > 255) {
        return { error: 'Keterangan maksimal 255 karakter.' };
    }

    return {
        data: {
            barang_id,
            jumlah,
            tanggal,
            keterangan
        }
    };
};

// READ: Menampilkan seluruh transaksi
exports.index = async (req, res) => {
    try {
        const transaksi = await Masuk.getAll();

        res.render('barang-masuk/index', {
            transaksi,
            success: req.query.success || null,
            error: req.query.error || null
        });

    } catch (error) {
        console.error(error);
        res.status(500).send('Gagal mengambil data barang masuk.');
    }
};

// CREATE: Menampilkan form tambah
exports.createForm = async (req, res) => {
    try {
        const barang = await Masuk.getBarang();

        res.render('barang-masuk/form', {
            title: 'Tambah Barang Masuk',
            action: '/barang-masuk/tambah',
            barang,
            data: {},
            error: req.query.error || null
        });

    } catch (error) {
        console.error(error);
        res.status(500).send('Gagal membuka form.');
    }
};

// CREATE: Menyimpan transaksi baru
exports.store = async (req, res) => {
    const validation = validateInput(req.body);

    if (validation.error) {
        return res.redirect(
            `/barang-masuk/tambah?error=${encodeURIComponent(validation.error)}`
        );
    }

    try {
        await Masuk.create(validation.data);

        res.redirect(
            '/barang-masuk?success=' +
            encodeURIComponent('Transaksi berhasil ditambahkan.')
        );

    } catch (error) {
        console.error(error);

        res.redirect(
            '/barang-masuk/tambah?error=' +
            encodeURIComponent(error.message)
        );
    }
};

// EDIT: Menampilkan form edit
exports.editForm = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.redirect('/barang-masuk');
        }

        const data = await Masuk.getById(id);

        if (!data) {
            return res.redirect(
                '/barang-masuk?error=' +
                encodeURIComponent('Transaksi tidak ditemukan.')
            );
        }

        const barang = await Masuk.getBarang();

        res.render('barang-masuk/form', {
            title: 'Edit Barang Masuk',
            action: `/barang-masuk/${id}/edit`,
            barang,
            data,
            error: req.query.error || null
        });

    } catch (error) {
        console.error(error);
        res.status(500).send('Gagal membuka data transaksi.');
    }
};

// UPDATE: Memperbarui transaksi
exports.update = async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.redirect('/barang-masuk');
    }

    const validation = validateInput(req.body);

    if (validation.error) {
        return res.redirect(
            `/barang-masuk/${id}/edit?error=` +
            encodeURIComponent(validation.error)
        );
    }

    try {
        await Masuk.update(id, validation.data);

        res.redirect(
            '/barang-masuk?success=' +
            encodeURIComponent('Transaksi berhasil diperbarui.')
        );

    } catch (error) {
        console.error(error);

        res.redirect(
            `/barang-masuk/${id}/edit?error=` +
            encodeURIComponent(error.message)
        );
    }
};

// DELETE: Menghapus transaksi
exports.destroy = async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.redirect('/barang-masuk');
    }

    try {
        await Masuk.deleteData(id);

        res.redirect(
            '/barang-masuk?success=' +
            encodeURIComponent('Transaksi berhasil dihapus.')
        );

    } catch (error) {
        console.error(error);

        res.redirect(
            '/barang-masuk?error=' +
            encodeURIComponent(error.message)
        );
    }
};
