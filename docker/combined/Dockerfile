# DockerfilHLF SDK server
FROM amd64/ubuntu:latest
RUN apt-get update
RUN apt-get install nodejs npm git -y

# install the web app
RUN mkdir -p /server/webApp
WORKDIR /server/webApp
COPY webApp /server/webApp/
ADD config /server/webApp/config
ADD crypto-config /server/webApp/crypto-config
RUN  npm install

EXPOSE 3000

WORKDIR /server/webApp

CMD ["npm", "start"]