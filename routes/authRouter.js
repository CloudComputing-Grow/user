const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const { authenticateJWT } = require('../middleware/authMiddleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);

router.delete('/delete-account', authenticateJWT, authController.deleteAccount);

router.post('/refresh', authController.refreshToken);

router.patch('/change-email', authenticateJWT, authController.changeEmail);
router.patch('/change-password', authenticateJWT, authController.changePassword);

module.exports = router;