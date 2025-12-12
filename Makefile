install:
	npm ci

publish:
	npm publish --dry-run

page-loader:
	node bin/page-loader.js -h

lint:
	npx eslint .

test:
	npx jest

test-coverage:
	npm test -- --coverage --coverageProvider=v8

example:
	node bin/page-loader.js https://fairwind2k.github.io/random_animal/

.PHONY: test example


