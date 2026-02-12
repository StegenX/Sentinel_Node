FROM node:18-alpine

WORKDIR /app

COPY ./package*.json /app/.
COPY ./tsconfig.json /app/.

RUN npm install

COPY ./src ./src

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]


