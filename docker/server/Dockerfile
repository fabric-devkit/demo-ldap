# DockerfilHLF SDK server
FROM amd64/ubuntu:latest
RUN apt-get update

COPY server.js /server

EXPOSE 8081

CMD ["node", "/server/server.js"]