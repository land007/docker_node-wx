FROM land007/node:latest

MAINTAINER Yiqiu Jia <yiqiujia@hotmail.com>

RUN . $HOME/.nvm/nvm.sh && cd / && npm install wxcrypt

RUN echo $(date "+%Y-%m-%d_%H:%M:%S") >> /.image_times && \
	echo $(date "+%Y-%m-%d_%H:%M:%S") > /.image_time && \
	echo "land007/node-wx" >> /.image_names && \
	echo "land007/node-wx" > /.image_name

ENV TOKEN=nUoBqY2r\
	ENCODING_AES_KEY=CmRHvvA95oRdJutpROpuuC2HuRLCRQQLHDbkQPvemyP\
	APPID=BwdOH8TGkYnTmeWvoQ

#docker build -t land007/node-wx .
#docker rm -f node-wx; docker run -it --rm --name node-wx land007/node-wx:latest
#> docker buildx build --platform linux/amd64,linux/arm64/v8,linux/arm/v7 -t land007/node-wx --push .
#> docker buildx build --platform linux/amd64,linux/arm/v7 -t land007/node-wx --push .
