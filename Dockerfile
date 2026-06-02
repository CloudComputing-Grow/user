# Node.js 공식 이미지 사용
FROM node:20

# 컨테이너 내부 작업 디렉토리 생성
WORKDIR /app

# package.json 먼저 복사
COPY package*.json ./

# 의존성 설치
RUN npm install

# 전체 프로젝트 복사
COPY . .

# 서비스 포트 오픈
EXPOSE 3001

# 서버 실행
CMD ["npm", "start"]