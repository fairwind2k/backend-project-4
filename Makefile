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
