const express = require('express');
const router = express.Router();

const barangController = require('../controllers/barangController');

// READ
router.get('/', barangController.index);

// CREATE
router.get('/tambah', barangController.create);
router.post('/tambah', barangController.store);

// UPDATE
router.get('/:id/edit', barangController.edit);
router.post('/:id/edit', barangController.update);

// DELETE
router.post('/:id/hapus', barangController.destroy);

module.exports = router;
