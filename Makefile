requirements:
	npm ci

clean:
	rm -rf dist

build:
	tsc --project tsconfig.build.json
	find src -type f \( -name '*.scss' -o -path '*/assets/*' \) -exec sh -c '\
	  for f in "$$@"; do \
	    d="dist/$${f#src/}"; \
	    mkdir -p "$$(dirname "$$d")"; \
	    cp "$$f" "$$d"; \
	  done' sh {} +
