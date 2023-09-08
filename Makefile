.PHONY: serve
serve: node_modules
	npx http-server src --cors --port 8080

.PHONY: node_modules
node_modules:
	npm install
