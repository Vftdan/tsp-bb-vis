ENSURE_DIR = mkdir -p $(shell dirname "$@")

all: script.js

clean:
	[ -e script.js ] && rm script.js || true
	[ -e build ] && rm -r build || true

build/%: %
	${ENSURE_DIR}
	cp "$<" "$@"

build: build/index.html build/script.js

script.js: script.ts
	tsc --lib ES2015,dom script.ts

.PHONY: all clean build
