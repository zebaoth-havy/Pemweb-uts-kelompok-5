const express = require('express');
const router = express.Router();

const supplierController = require('../controllers/supplierController');
router.get('/', supplierController.index);

router.get('/tambah', supplierController.createForm);
router.post('/tambah', supplierController.store);

router.get('/:id/edit', supplierController.editForm);
router.post('/:id/edit', supplierController.update);

router.post('/:id/delete', supplierController.destroy);

module.exports = router;
