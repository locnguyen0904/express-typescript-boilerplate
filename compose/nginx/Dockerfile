FROM nginx:1.27-alpine
RUN apk add --no-cache nano
RUN mv /etc/nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf.backup

ADD conf.d/ /etc/nginx/conf.d/