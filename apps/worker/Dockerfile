FROM node:18-alpine

WORKDIR /app

COPY package*.json tsconfig.json /app/

RUN npm install

COPY ./src ./src

RUN npm run build

CMD ["npm", "start"]