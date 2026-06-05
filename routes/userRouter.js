const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');
const { authenticateJWT } = require('../middleware/authMiddleware');

// 유저 정보 조회
router.get('/:userId', userController.getUserInfo);

// 유저 레벨 업데이트
router.patch('/:userId/level', userController.updateUserLevel);

// 유저 닉네임 bulk 조회
router.post('/nicknames', userController.getUserNicknames);

module.exports = router;