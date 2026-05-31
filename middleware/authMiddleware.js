const jwt = require('jsonwebtoken');

const authenticateJWT = (req, res, next) => {
    try {
        // Authorization 헤더 가져오기
        const authHeader = req.headers.authorization;

        // Bearer 토큰 존재 여부 확인
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: '인증 토큰이 없습니다.'
            });
        }

        // "Bearer xxx.yyy.zzz" → 토큰 부분만 추출
        const token = authHeader.split(' ')[1];

        // JWT 검증
        const decoded = jwt.verify(
            token,
            process.env.JWT_ACCESS_SECRET
        );

        // 컨트롤러에서 사용할 사용자 정보 저장
        req.user = {
            user_id: decoded.user_id,
            email: decoded.email,
            nickname: decoded.nickname
        };

        // 원본 토큰도 저장
        // 다른 마이크로서비스 호출 시 전달용
        req.token = token;

        next();

    } catch (err) {
        console.error('[JWT 인증 오류]', err.message);

        // 토큰 만료
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: '토큰이 만료되었습니다.'
            });
        }

        // 잘못된 토큰
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: '유효하지 않은 토큰입니다.'
            });
        }

        return res.status(401).json({
            success: false,
            message: '인증에 실패했습니다.'
        });
    }
};

module.exports = {
    authenticateJWT
};