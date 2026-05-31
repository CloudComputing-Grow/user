const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const { authenticateJWT } = require('../middleware/authMiddleware');

router.post('/auth/signup', authController.register);
router.post('/auth/login', authController.login);
router.post('/user/logout', authController.logout);

router.delete('/user/delete-account', authenticateJWT, authController.deleteAccount);

router.post('/auth/refresh', authController.refreshToken);

router.patch('/user/change-email', authenticateJWT, authController.changeEmail);
router.patch('/user/change-password', authenticateJWT, authController.changePassword);

module.exports = router;