COPY_FILE = cp "$<" "$@"

all: script.js index.html

script.js: build/script.js
	${COPY_FILE}

index.html: build/index.html
	${COPY_FILE}

.PHONY: all
