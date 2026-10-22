FROM alpine:3.22

ARG PB_VERSION=0.40.5
# Set automatically by Docker BuildKit: amd64 (DigitalOcean) or arm64 (Raspberry Pi / Apple Silicon).
ARG TARGETARCH

RUN apk add --no-cache ca-certificates unzip wget \
	&& wget -q "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_${TARGETARCH}.zip" -O /tmp/pb.zip \
	&& unzip /tmp/pb.zip -d /pb \
	&& rm /tmp/pb.zip

COPY pb_migrations /pb/pb_migrations
COPY pb_hooks /pb/pb_hooks

EXPOSE 8090

# automigrate is off in production: schema changes are made locally and committed as migrations.
CMD ["/pb/pocketbase", "serve", "--http=0.0.0.0:8090", "--dir=/pb/pb_data", "--migrationsDir=/pb/pb_migrations", "--hooksDir=/pb/pb_hooks", "--automigrate=false"]
