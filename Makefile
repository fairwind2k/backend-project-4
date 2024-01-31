install:
	npm ci

publish:
	npm publish --dry-run

gendiff:
	node bin/gendiff.js -h

lint:
	npx eslint .

test:
	npx jest
