const express = require('express');
const router = express.Router();
const { verifyToken, restrictTo } = require('../middlewares/auth.middleware');
const { getSettings, updateSettings } = require('../controllers/settings.controller');

// Anyone needs to be able to read settings to know if they can register
// or if they can trigger certain components on the client-side.
router.get('/', getSettings);

// Only administrators are allowed to update the global settings
router.put('/', verifyToken, restrictTo('Admin'), updateSettings);

module.exports = router;
