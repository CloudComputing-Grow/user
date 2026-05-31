const amqp = require('amqplib');

// RabbitMQ 채널 객체를 저장해 둘 변수 (매번 새로운 연결을 만들지 않고 재사용하기 위함)
let channel = null;

// exchange 이름 .env에 USER_EVENT_EXCHANGE가 있으면 사용하고 없으면 기본값 user.events 사용
const EXCHANGE_NAME = process.env.USER_EVENT_EXCHANGE || 'user.events';

// RabbitMQ 채널 가져오는 함수
async function getChannel() {
    // 이미 채널이 생성되어 있으면 기존 채널 재사용
    if (channel) return channel;

    // RabbitMQ 서버에 연결하고 채널 생성
    const connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
    channel = await connection.createChannel();

    // 이벤트를 발행할 exchange 생성 (topic 타입, durable)
    await channel.assertExchange(EXCHANGE_NAME, 'topic', {
        durable: true // RabbitMQ 재시작 시 유지되도록 설정
    });

    return channel;
}

// UserCreated 이벤트 발행 함수
exports.publishUserCreated = async (user) => {
    // RabbitMQ 채널 가져오기
    const ch = await getChannel();

    // 이벤트 메시지 객체 생성
    const event = {
        eventType: 'UserCreated', // 이벤트 타입 명시
        userId: user.user_id,
        email: user.email,
        nickname: user.nickname,
        level: user.level,
        createdAt: new Date().toISOString() // 이벤트 발생 시간
    };

    // 이벤트 발행
    ch.publish(
        // Exchange 이름
        EXCHANGE_NAME,
        // 라우팅 키 (이벤트 타입을 라우팅 키로 사용)
        'user.created',
        // JSON → Buffer 변환
        Buffer.from(JSON.stringify(event)),
        {
            persistent: true, // JSON → Buffer 변환
            contentType: 'application/json' // 메시지의 콘텐츠 타입 설정
        }
    );

    console.log('UserCreated 이벤트 발행 성공:', event);
};

// 회원탈퇴 이벤트 발행
exports.publishUserDeleted = async (userId) => {
    // RabbitMQ 채널 가져오기
    const ch = await getChannel();

    // 이벤트 메시지 객체 생성
    const event = {
        eventType: 'UserDeleted',
        userId,
        deletedAt: new Date().toISOString()
    };

    // 이벤트 발행
    ch.publish(
        EXCHANGE_NAME,
        'user.deleted',
        Buffer.from(JSON.stringify(event)),
        {
            persistent: true,
            contentType: 'application/json'
        }
    );

    console.log('UserDeleted 이벤트 발행 성공:', event);
};