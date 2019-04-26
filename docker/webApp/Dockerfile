# Dockerfile for web app to talk to SDK server
FROM amd64/ubuntu:latest
RUN apt-get update
RUN apt-get install npm express

COPY webApp /server

EXPOSE 3000

WORKDIR /server/webApp
CMD ["DEBUG=webApp:* npm start"]