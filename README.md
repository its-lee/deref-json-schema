# deref-json-schema

A command line tool which maps json schema, replacing $refs by their referenced content. This is useful when preparing the schema for conversion to Typescript, which can choke on $refs (especially inter-file ones).

Intra-file references (e.g. { "$ref": "#/definitions/detail/schema" }) are also replaced by their dereferenced content - but this is more for reasons of implementation (if this didn't happen on an initial pass, then the tool could bring dereference an external schema which referenced something in that other file - but then we'll die attempting to resolve that $ref in the initial file).

## Project setup
```
npm install
```

### Running the CLI
```
npm run cli
```

### Converting to Typescript

The intended use-case is to run this tool on a known directory containing JSON schema:

```sh
npm run cli -- -i /Users/lee/Desktop/schema -v
```

(We haven't bothered making this package npm-installable globally or anything - just clone this repository and run the above in the root directory)

This will generate a folder containing dereferenced JSON schemas at `/Users/lee/Desktop/schema-deref` in this example.

Then you can run json2ts (from https://github.com/bcherny/json-schema-to-typescript), which will then be able to convert the JSON schema to Typescript, which would otherwise choke on inter-file references.

Note that it's not just json2ts which chokes on these (every tool we've tried does), but json2ts is widely used and we'd like to use it to, so this tool is necessary to do so.

```sh
json2ts -i '/Users/lee/Desktop/schema-deref/**/*.json' -cwd '/Users/lee/Desktop/schema-deref' > ~/Desktop/output.ts
```
