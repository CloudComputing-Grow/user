const { User } = require('../models');

// 유저 정보 조회
exports.getUserInfo = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findOne({
            where: {
                user_id: userId
            },
            attributes: [
                'user_id',
                'nickname',
                'email',
                'level'
            ]
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: '사용자를 찾을 수 없습니다.'
            });
        }

        return res.status(200).json({
            user_id: user.user_id,
            nickname: user.nickname,
            level: user.level
        });
    } catch (err) {
        console.error('[유저 정보 조회 오류]', err);

        return res.status(500).json({
            success: false,
            message: '유저 정보 조회 중 오류가 발생했습니다.',
            error: err.message
        });
    }
};

// 유저 레벨 업데이트
exports.updateUserLevel = async (req, res) => {
    try {
        const { userId } = req.params;
        const { level } = req.body;

        if (level === undefined || level === null) {
            return res.status(400).json({
                success: false,
                message: '변경할 level 값이 필요합니다.'
            });
        }

        const parsedLevel = Number(level);

        if (!Number.isInteger(parsedLevel) || parsedLevel < 1) {
            return res.status(400).json({
                success: false,
                message: 'level은 1 이상의 정수여야 합니다.'
            });
        }

        const user = await User.findOne({
            where: {
                user_id: userId
            }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: '사용자를 찾을 수 없습니다.'
            });
        }

        await User.update(
            {
                level: parsedLevel
            },
            {
                where: {
                    user_id: userId
                }
            }
        );
        /*
                return res.status(200).json({
                    success: true,
                    message: '유저 레벨 업데이트 성공',
                    data: {
                        userId: Number(userId),
                        level: parsedLevel
                    }
                });*/
        return res.status(200).json({
            level: parsedLevel
        });
    } catch (err) {
        console.error('[유저 레벨 업데이트 오류]', err);

        return res.status(500).json({
            success: false,
            message: '유저 레벨 업데이트 중 오류가 발생했습니다.',
            error: err.message
        });
    }
};

// 유저 닉네임 bulk 조회
exports.getUserNicknames = async (req, res) => {
    try {
        const { userIds } = req.body;

        if (!Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'userIds 배열이 필요합니다.'
            });
        }

        const users = await User.findAll({
            where: {
                user_id: userIds
            },
            attributes: [
                'user_id',
                'nickname'
            ]
        });

        const nicknames = users.map(user => ({
            userId: user.user_id,
            nickname: user.nickname
        }));

        return res.status(200).json({
            success: true,
            data: nicknames
        });
    } catch (err) {
        console.error('[유저 닉네임 bulk 조회 오류]', err);

        return res.status(500).json({
            success: false,
            message: '유저 닉네임 조회 중 오류가 발생했습니다.',
            error: err.message
        });
    }
};