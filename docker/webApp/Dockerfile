# Dockerfile for web app to talk to SDK server
FROM amd64/ubuntu:latest
RUN apt-get update
RUN apt-get install nodejs npm -y

RUN mkdir -p /server/webApp
COPY webApp /server/webApp/
#RUN ls -lar /server/webApp/
RUN cd server/webApp && npm install

EXPOSE 3000

WORKDIR /server/webApp/
CMD ["npm", "start"]