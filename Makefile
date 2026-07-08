SHELL := /bin/bash

.PHONY: test build deploy

test:
	npm run test

build:
	npm run build

deploy: test build
	./scripts/deploy.sh
