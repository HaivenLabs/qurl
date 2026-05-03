FROM golang:1.22-alpine AS build

WORKDIR /src

COPY backend/ backend/

WORKDIR /src/backend
RUN go build -o /out/qurl-backend ./cmd/qurl-backend

FROM gcr.io/distroless/static-debian12:nonroot

COPY --from=build /out/qurl-backend /usr/local/bin/qurl-backend

EXPOSE 8080

ENV QURL_LISTEN_ADDR=:8080

ENTRYPOINT ["/usr/local/bin/qurl-backend"]
