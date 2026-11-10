const express = require('express');
const router = express.Router();

const keluarController = require('../controllers/keluarController');

// READ
router.get('/', keluarController.index);

// CREATE
router.get('/tambah', keluarController.createForm);
router.post('/tambah', keluarController.store);

// UPDATE
router.get('/:id/edit', keluarController.editForm);
router.post('/:id/edit', keluarController.update);

// DELETE
router.post('/:id/delete', keluarController.destroy);

module.exports = router;
