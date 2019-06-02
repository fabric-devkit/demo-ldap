# DockerfilHLF SDK server
FROM amd64/ubuntu:latest
RUN apt-get update
RUN apt-get install nodejs npm -y
RUN npm install websocket

RUN mkdir -p /server
COPY server.js /server
COPY ipfs.js /server

EXPOSE 8081

CMD ["node", "/server/server.js"]