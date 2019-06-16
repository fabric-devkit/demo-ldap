# DockerfilHLF SDK server
FROM amd64/ubuntu:latest
RUN apt-get update
RUN apt-get install nodejs npm git -y

# install the web app
RUN mkdir -p /server/webApp
WORKDIR /server/webApp
COPY webApp /server/webApp/
RUN npm install

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
ADD crypto-config /server/sdk/config/crypto-config
ADD crypto-config /server/webApp/crypto-config
RUN  npm install

EXPOSE 8081
EXPOSE 3000

COPY runserver.sh /server

WORKDIR /server
#CMD ["node", "server.js"]
CMD ["bash", "runserver.sh"]