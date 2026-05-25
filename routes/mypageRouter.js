const express = require('express');
const router = express.Router();

const mypageController = require('../controllers/mypageController');
const { authenticateJWT } = require('../middleware/authMiddleware');

router.get('/api', authenticateJWT, mypageController.getMyPage);

module.exports = router;