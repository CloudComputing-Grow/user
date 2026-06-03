const axios = require('axios');
const { User } = require('../models');

/*const MISSION_SERVICE_URL = process.env.MISSION_SERVICE_URL || 'http://localhost:3003';

const GROWTH_SERVICE_URL = process.env.GROWTH_SERVICE_URL || 'http://localhost:3005';

const ACHIEVEMENT_SERVICE_URL = process.env.ACHIEVEMENT_SERVICE_URL || 'http://localhost:3002';*/

const MISSION_SERVICE_URL = process.env.MISSION_SERVICE_URL;
const GROWTH_SERVICE_URL = process.env.GROWTH_SERVICE_URL;
const ACHIEVEMENT_SERVICE_URL = process.env.ACHIEVEMENT_SERVICE_URL;

exports.getMyPage = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const accessToken = req.token;

        console.log('[MyPage] userId:', userId);
        console.log('[MyPage] accessToken:', accessToken);

        // 사용자 정보 조회
        const user = await User.findOne({
            where: { user_id: userId },
            attributes: ['user_id', 'nickname', 'email', 'level']
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: '사용자를 찾을 수 없습니다.'
            });
        }

        // Growth Service, Achievement Service에서 마이페이지 관련 정보 동시 조회
        let missionStatus = null;
        let badgeType = null;

        const totalCount = 5;

        console.log('[Growth 요청 헤더]', {
            Authorization: `Bearer ${accessToken}`
        });

        // Growth Service 호출 (현재 성장률 기반 미션 진행 상태 조회)
        try {
            const growthResponse = await axios.get(
                `${GROWTH_SERVICE_URL}/api/v1/growth-diary/progress`,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    },
                    timeout: 3000
                }
            );

            const growthData = growthResponse.data.data;

            if (growthData) {
                missionStatus = {
                    completed: growthData.completedCount ?? 0
                };
            }

            console.log('[missionStatus]', missionStatus);
        } catch (err) {
            console.error('[Growth Service 호출 실패]', err.response?.data || err.message);
        }

        console.log('[Achievement 요청 헤더]', {
            Authorization: `Bearer ${accessToken}`
        });

        // Achievement Service 호출 (도감 기반 휘장 계산 및 DB 상태 업데이트)
        try {
            const achievementResponse = await axios.get(
                `${ACHIEVEMENT_SERVICE_URL}/achievements/badges/representative`,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'X-User-Id': userId
                    },
                    timeout: 3000
                }
            );

            //badgeType = achievementResponse.data.data?.badgeType ?? null;

            console.log('[Achievement 응답]', achievementResponse.data);

            const badgeId = achievementResponse.data?.badgeId;

            if (badgeId === 1) {
                badgeType = 'silver';
            } else if (badgeId === 2) {
                badgeType = 'gold';
            } else {
                badgeType = null;
            }
        } catch (err) {
            console.error('[Achievement Service 호출 실패]', err.response?.data || err.message);
            badgeType = null;
        }

        return res.status(200).json({
            success: true,
            message: '마이페이지 조회 성공',
            data: {
                userId: user.user_id,
                nickname: user.nickname,
                email: user.email,
                level: user.level,
                missionStatus,
                totalCount,
                badgeType
            }
        });
    } catch (err) {
        console.error('[마이페이지 조회 오류]', err);

        return res.status(500).json({
            success: false,
            message: '마이페이지 조회 중 오류가 발생했습니다.',
            error: err.message
        });
    }
};