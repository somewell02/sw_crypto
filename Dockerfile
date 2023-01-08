FROM node:lts-alpine

RUN npm install -g http-server

RUN mkdir -p /app/
WORKDIR /app/

COPY package*.json ./

RUN npm install

COPY . /app/

RUN npm run build

EXPOSE 8080
CMD [ "http-server", "dist" ]