# DockerfilHLF SDK server
FROM amd64/ubuntu:latest
RUN apt-get update
RUN apt-get install nodejs npm git -y

# install the sdk server
RUN mkdir -p /server/sdk
WORKDIR /server/sdk
COPY server.js /server/sdk
COPY enrolUser.js /server/sdk
COPY crypto-config /server/sdk
COPY package.json /server/sdk
COPY package-lock.json /server/sdk
ADD config /server/sdk/config
ADD crypto-config /server/sdk/crypto-config
RUN  npm install

EXPOSE 8081

WORKDIR /server/sdk
CMD ["node", "server.js"]