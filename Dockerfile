FROM node:18.13.0-bullseye-slim

ENV NODE_ENV=production

WORKDIR /app

COPY ["package.json", "package-lock.json*", "./"]

RUN npm install 

COPY schemas /app/schemas

COPY . . 

CMD ["node", "app.js"]
