
.PHONY: install build start dev test test-unit lint migrate migrate-undo clean

install:
	npm install

build: install
	npm run build

start: build
	npm run start

dev:
	npm run dev

test:
	npm run test

test-unit:
	npm run test:unit

lint:
	npm run lint

migrate:
	npm run migrate

migrate-undo:
	npm run migrate:undo

clean:
	rm -rf dist coverage node_modules
