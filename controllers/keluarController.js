const Keluar = require('../models/keluarModel');

const validateInput = (data) => {
    const barang_id = Number(data.barang_id);
    const jumlah = Number(data.jumlah);
    const tanggal = data.tanggal;
    const tujuan = (data.tujuan || '').trim();

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

    if (!tujuan) {
        return { error: 'Tujuan barang wajib diisi.' };
    }

    return {
        data: { barang_id, jumlah, tanggal, tujuan }
    };
};

// READ
exports.index = async (req, res) => {
    try {
        const transaksi = await Keluar.getAll();

        res.render('barang-keluar/index', {
            transaksi,
            success: req.query.success || null,
            error: req.query.error || null
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Gagal mengambil data barang keluar.');
    }
};

// FORM TAMBAH
exports.createForm = async (req, res) => {
    try {
        const barang = await Keluar.getBarang();

        res.render('barang-keluar/form', {
            title: 'Tambah Barang Keluar',
            transaksi: {},
            barang,
            errors: []
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Gagal membuka form barang keluar.');
    }
};

// SIMPAN
exports.store = async (req, res) => {
    try {
        const validation = validateInput(req.body);

        if (validation.error) {
            return res.redirect(
                '/barang-keluar/tambah?error=' +
                encodeURIComponent(validation.error)
            );
        }

        await Keluar.create(validation.data);

        res.redirect('/barang-keluar?success=' +
            encodeURIComponent('Barang keluar berhasil ditambahkan.'));
    } catch (error) {
        console.error(error);

        res.redirect('/barang-keluar?error=' +
            encodeURIComponent(error.message));
    }
};

// FORM EDIT
exports.editForm = async (req, res) => {
    try {
        const transaksi = await Keluar.getById(req.params.id);

        if (!transaksi) {
            return res.status(404).send('Data barang keluar tidak ditemukan.');
        }

        const barang = await Keluar.getBarang();

        res.render('barang-keluar/form', {
            title: 'Edit Barang Keluar',
            transaksi,
            barang,
            errors: []
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Gagal membuka data barang keluar.');
    }
};

// UPDATE
exports.update = async (req, res) => {
    try {
        const validation = validateInput(req.body);

        if (validation.error) {
            return res.redirect(
                `/barang-keluar/${req.params.id}/edit?error=` +
                encodeURIComponent(validation.error)
            );
        }

        await Keluar.update(req.params.id, validation.data);

        res.redirect('/barang-keluar?success=' +
            encodeURIComponent('Data barang keluar berhasil diperbarui.'));
    } catch (error) {
        console.error(error);

        res.redirect('/barang-keluar?error=' +
            encodeURIComponent(error.message));
    }
};

// DELETE
exports.destroy = async (req, res) => {
    try {
        await Keluar.deleteData(req.params.id);

        res.redirect('/barang-keluar?success=' +
            encodeURIComponent('Data barang keluar berhasil dihapus.'));
    } catch (error) {
        console.error(error);

        res.redirect('/barang-keluar?error=' +
            encodeURIComponent(error.message));
    }
};
