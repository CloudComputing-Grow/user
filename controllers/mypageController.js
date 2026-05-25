const { User } = require('../models');

exports.getMyPage = async (req, res) => {
    try {
        const userId = req.user.user_id;

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

        /*
        // 현재 단계의 미션 개수 조회
        // 추후 growth 서비스로 분리 후 HTTP 직접 메시징 방식으로 조회 예정
        const missionCountSql = `
            SELECT COUNT(DISTINCT mission_id) AS total
            FROM mission
            WHERE level = ?
        `;

        db.query(missionCountSql, [user.level], (err, totalResults) => {
            if (err) throw err;

            const totalCount = totalResults[0]?.total ?? 5;
        });
        */

        /*
        // growth_status에서 성장률 가져와서 미션 수행 개수 추론
        // 추후 growth 서비스로 분리 후 HTTP 직접 메시징 방식으로 조회 예정
        const growthSql = `
            SELECT growth_rate
            FROM growth_status
            WHERE user_id = ? AND is_harvested = false
            ORDER BY planted_at DESC
            LIMIT 1
        `;

        db.query(growthSql, [userId], (err, growthResults) => {
            if (err) throw err;

            const growthRate = growthResults[0]?.growth_rate ?? 0;
            const completedCount = Math.floor(growthRate / 20);
        });
        */

        /*
        // 도감 기반 휘장 계산 및 DB 상태 업데이트
        // 추후 collection 서비스로 분리 후 HTTP 직접 메시징 방식으로 조회 예정
        function updateAndGetBadgeType(userId, callback) {
            const getCollectionSql = `
                SELECT collection_id
                FROM collection
                WHERE user_id = ?
            `;

            db.query(getCollectionSql, [userId], (err, result) => {
                if (err) return callback(err);
                if (result.length === 0) return callback(null, null);

                const collectionId = result[0].collection_id;

                const userFruitCountSql = `
                    SELECT f.category, COUNT(DISTINCT f.fruit_name) AS count
                    FROM fruit f
                    WHERE f.collection_id = ?
                      AND f.registered = 1
                      AND f.harvested_date IS NOT NULL
                      AND f.growth_status_id IN (
                          SELECT growth_status_id
                          FROM growth_status
                          WHERE growth_rate = 100
                      )
                    GROUP BY f.category
                `;

                db.query(userFruitCountSql, [collectionId], (err2, userFruitResults) => {
                    if (err2) return callback(err2);

                    const userFruitMap = Object.fromEntries(
                        userFruitResults.map(row => [row.category, row.count])
                    );

                    const hasSilver = (userFruitMap.basic || 0) === 8;
                    const hasGold = (userFruitMap.gold || 0) === 8;

                    let newStatus = 0;

                    if (hasGold) newStatus = 2;
                    else if (hasSilver) newStatus = 1;

                    const updateSql = `
                        UPDATE collection
                        SET collection_completion_status = ?
                        WHERE collection_id = ?
                    `;

                    db.query(updateSql, [newStatus, collectionId], (err3) => {
                        if (err3) return callback(err3);

                        const badgeType =
                            newStatus === 2
                                ? 'gold'
                                : newStatus === 1
                                    ? 'silver'
                                    : null;

                        callback(null, badgeType);
                    });
                });
            });
        }
        */

        return res.status(200).json({
            success: true,
            message: '마이페이지 조회 성공',
            data: {
                userId: user.user_id,
                nickname: user.nickname,
                email: user.email,
                level: user.level,

                // 추후 growth 서비스 응답으로 대체 예정
                missionStatus: null,

                // 추후 collection 서비스 응답으로 대체 예정
                badgeType: null
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