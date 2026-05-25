const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const morgan = require('morgan');
const expressLayouts = require('express-ejs-layouts');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3030;

// Sequelize models/index.js
const { sequelize } = require('./models');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 미들웨어
app.use(expressLayouts);
app.set('layout', 'layout');
app.set('view options', { layout: 'layout' });

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
    res.locals.currentPath = req.path;
    res.locals.user = null;
    next();
});

// 라우터 등록
const authRouter = require('./routes/authRouter');
const mypageRouter = require('./routes/mypageRouter');

app.use('/', authRouter);
app.use('/mypage', mypageRouter);

// 기본 라우트
app.get('/', (req, res) => {
    res.render('index');
});

// 전역 에러 핸들러
app.use((err, req, res, next) => {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: err
    });
});

// DB 연결 후 서버 실행
sequelize.authenticate()
    .then(() => {
        console.log('DB 연결 성공');

        app.listen(PORT, () => {
            console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.error('DB 연결 실패:', err);
    });

module.exports = app;