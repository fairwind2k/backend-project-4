install:
	npm ci

publish:
	npm publish --dry-run

page-loader:
	node bin/page-loader.js -h

lint:
	npx eslint .

fix:
	npx eslint --fix .

test:
	npx jest

test-coverage:
	npm test -- --coverage --coverageProvider=v8

example:
	node bin/page-loader.js -o ./page-loader https://fairwind2k.github.io/random_animal/

.PHONY: test example


