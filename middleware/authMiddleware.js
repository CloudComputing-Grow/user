const jwt = require('jsonwebtoken');

const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: '인증 토큰이 없습니다.'
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

        req.user = {
            user_id: decoded.user_id,
            email: decoded.email,
            nickname: decoded.nickname
        };

        next();
    } catch (err) {
        return res.status(401).json({
            success: false,
            message: '유효하지 않거나 만료된 토큰입니다.'
        });
    }
};

module.exports = {
    authenticateJWT
};