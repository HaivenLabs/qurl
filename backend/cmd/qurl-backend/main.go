package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"

	"qurl/backend/internal/bootstrap"
)

func main() {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	if err := bootstrap.Run(ctx); err != nil {
		log.Fatal(err)
	}
}

