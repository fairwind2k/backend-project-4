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

lint-report:
	npx eslint . --ext .js,.jsx,.ts,.tsx --format json --output-file eslint-report.json

test:
	npx jest

test-coverage:
	npx jest --coverage

example:
	node bin/page-loader.js -o ./page-loader https://fairwind2k.github.io/random_animal/

.PHONY: test example


