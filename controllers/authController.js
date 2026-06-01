const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const validator = require('validator');

const { publishUserCreated, publishUserDeleted } = require('../events/userEventPublisher');
const { User, RefreshToken, sequelize } = require('../models');

// 액세스 토큰 생성 함수
const createAccessToken = (user) => {
    return jwt.sign(
        {
            user_id: user.user_id,
            email: user.email,
            nickname: user.nickname
        },
        process.env.JWT_ACCESS_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || '1h'
        }
    );
};

// 리프레시 토큰 생성 함수
const createRefreshToken = (user) => {
    return jwt.sign(
        {
            user_id: user.user_id
        },
        process.env.JWT_REFRESH_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '30d'
        }
    );
};

// 리프레시 토큰 만료 날짜 계산 함수
const getRefreshTokenExpireDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date;
};

// 회원가입
exports.register = async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
        const { email, nickname, password, passwordConfirm } = req.body;

        if (!email || !nickname || !password || !passwordConfirm) {
            return res.status(400).json({
                success: false,
                message: '이메일, 닉네임, 비밀번호, 비밀번호 확인을 모두 입력해주세요.'
            });
        }

        if (!validator.isEmail(email)) {
            return res.status(400).json({
                success: false,
                message: '올바른 이메일 형식이 아닙니다.'
            });
        }

        if (password !== passwordConfirm) {
            return res.status(400).json({
                success: false,
                message: '비밀번호가 일치하지 않습니다.'
            });
        }

        if (!validator.isLength(password, { min: 8 })) {
            return res.status(400).json({
                success: false,
                message: '비밀번호는 8자 이상이어야 합니다.'
            });
        }

        const existingEmail = await User.findOne({ where: { email } });
        if (existingEmail) {
            return res.status(409).json({
                success: false,
                message: '이미 사용 중인 이메일입니다.'
            });
        }

        const existingNickname = await User.findOne({ where: { nickname } });
        if (existingNickname) {
            return res.status(409).json({
                success: false,
                message: '이미 사용 중인 닉네임입니다.'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create(
            {
                email,
                nickname,
                password: hashedPassword,
                level: 1
            },
            { transaction }
        );

        const accessToken = createAccessToken(user);
        //const refreshToken = createRefreshToken(user);

        console.log(Object.keys(require('../models')));
        /*
        await RefreshToken.create(
            {
                token: refreshToken,
                user_id: user.user_id,
                expires_at: getRefreshTokenExpireDate()
            },
            { transaction }
        );

        console.log('refreshToken 저장 성공');
        */

        // db 저장완료
        await transaction.commit();

        //이벤트 발생
        await publishUserCreated(user);

        return res.status(201).json({
            success: true,
            message: '회원가입 성공',
            data: {
                user: {
                    user_id: user.user_id,
                    email: user.email,
                    nickname: user.nickname,
                    level: user.level
                },
                accessToken
                //refreshToken
            }
        });
    } catch (err) {
        await transaction.rollback();

        return res.status(500).json({
            success: false,
            message: '회원가입 중 오류가 발생했습니다.',
            error: err.message
        });
    }
};

// 로그인
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: '이메일과 비밀번호를 모두 입력해주세요.'
            });
        }

        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: '존재하지 않는 사용자입니다.'
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: '비밀번호가 일치하지 않습니다.'
            });
        }

        const accessToken = createAccessToken(user);
        const refreshToken = createRefreshToken(user);

        await RefreshToken.create({
            token: refreshToken,
            user_id: user.user_id,
            expires_at: getRefreshTokenExpireDate()
        });

        return res.status(200).json({
            success: true,
            message: '로그인 성공',
            data: {
                user: {
                    user_id: user.user_id,
                    email: user.email,
                    nickname: user.nickname,
                    level: user.level
                },
                accessToken,
                refreshToken
            }
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: '로그인 중 오류가 발생했습니다.',
            error: err.message
        });
    }
};

// 로그아웃
exports.logout = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: '리프레시 토큰이 필요합니다.'
            });
        }

        await RefreshToken.destroy({
            where: {
                token: refreshToken
            }
        });

        return res.status(200).json({
            success: true,
            message: '로그아웃 성공'
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: '로그아웃 중 오류가 발생했습니다.',
            error: err.message
        });
    }
};

//  토큰 재발급
exports.refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: '리프레시 토큰이 필요합니다.'
            });
        }

        const savedToken = await RefreshToken.findOne({
            where: {
                token: refreshToken
            }
        });

        if (!savedToken) {
            return res.status(401).json({
                success: false,
                message: '저장되지 않은 리프레시 토큰입니다.'
            });
        }

        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

        const user = await User.findByPk(decoded.user_id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: '사용자를 찾을 수 없습니다.'
            });
        }

        const newAccessToken = createAccessToken(user);

        return res.status(200).json({
            success: true,
            message: '토큰 재발급 성공',
            data: {
                accessToken: newAccessToken
            }
        });
    } catch (err) {
        return res.status(401).json({
            success: false,
            message: '유효하지 않거나 만료된 리프레시 토큰입니다.'
        });
    }
};

// 이메일 변경
exports.changeEmail = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: '변경할 이메일을 입력해주세요.'
            });
        }

        if (!validator.isEmail(email)) {
            return res.status(400).json({
                success: false,
                message: '올바른 이메일 형식이 아닙니다.'
            });
        }

        const existingUser = await User.findOne({ where: { email } });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: '이미 사용 중인 이메일입니다.'
            });
        }

        await User.update(
            { email },
            {
                where: {
                    user_id: userId
                }
            }
        );

        return res.status(200).json({
            success: true,
            message: '이메일 변경 성공'
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: '이메일 변경 중 오류가 발생했습니다.',
            error: err.message
        });
    }
};

// 비밀번호 변경
exports.changePassword = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: '기존 비밀번호와 새 비밀번호를 모두 입력해주세요.'
            });
        }

        if (!validator.isLength(newPassword, { min: 8 })) {
            return res.status(400).json({
                success: false,
                message: '새 비밀번호는 8자 이상이어야 합니다.'
            });
        }

        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: '사용자를 찾을 수 없습니다.'
            });
        }

        const isPasswordValid = await bcrypt.compare(oldPassword, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: '기존 비밀번호가 일치하지 않습니다.'
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await User.update(
            {
                password: hashedPassword
            },
            {
                where: {
                    user_id: userId
                }
            }
        );

        await RefreshToken.destroy({
            where: {
                user_id: userId
            }
        });

        return res.status(200).json({
            success: true,
            message: '비밀번호 변경 성공. 다시 로그인해주세요.'
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: '비밀번호 변경 중 오류가 발생했습니다.',
            error: err.message
        });
    }
};

// 회원탈퇴
exports.deleteAccount = async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
        const userId = req.user.user_id;
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: '리프레시 토큰이 필요합니다.'
            });
        }

        await RefreshToken.destroy({
            where: {
                user_id: userId
            },
            transaction
        });

        await User.destroy({
            where: {
                user_id: userId
            },
            transaction
        });

        await transaction.commit();

        // User DB 삭제 성공 후 이벤트 발행
        await publishUserDeleted(userId);

        return res.status(200).json({
            success: true,
            message: '회원탈퇴 성공'
        });
    } catch (err) {
        await transaction.rollback();

        return res.status(500).json({
            success: false,
            message: '회원탈퇴 중 오류가 발생했습니다.',
            error: err.message
        });
    }
};