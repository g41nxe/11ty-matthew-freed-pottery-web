// Round-trip check for one Tina document against the local dev server
// (npm run dev). It reads the document through Tina's GraphQL API, saves
// the same values back the way the admin does, and fails unless the file
// still holds the same data. With --set=a.0.b=value one field is changed
// first, and that must be the only difference.
import fs from "node:fs";
import assert from "node:assert/strict";
import matter from "gray-matter";

const API = "http://localhost:4001/graphql";
const [collection, relativePath, ...flags] = process.argv.slice(2);
const set = flags.find((f) => f.startsWith("--set="))?.slice("--set=".length);

const schema = JSON.parse(fs.readFileSync("tina/__generated__/_schema.json", "utf8"));
const definition = schema.collections.find((c) => c.name === collection);
if (!definition) throw new Error(`Unknown collection "${collection}"`);
const file = `${definition.path}/${relativePath}`;

function readFile() {
  const text = fs.readFileSync(file, "utf8");
  if (definition.format === "json") return JSON.parse(text);
  const { data, content } = matter(text);
  return { ...data, $body: content.replace(/\r\n/g, "\n").trim() };
}

// Only fields the schema declares go into the mutation. Tina keeps the
// other top-level frontmatter on its own.
function pick(values, fields) {
  const out = {};
  for (const field of fields) {
    const value = values?.[field.name];
    if (value === undefined || value === null) continue;
    if (field.type === "object") {
      out[field.name] = field.list ? value.map((v) => pick(v, field.fields)) : pick(value, field.fields);
    } else {
      out[field.name] = value;
    }
  }
  return out;
}

function setPath(target, dottedPath, value) {
  const keys = dottedPath.split(".");
  const last = keys.pop();
  const parent = keys.reduce((node, key) => node[key], target);
  parent[last] = value;
}

async function graphql(query, variables) {
  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors, null, 2));
  return json.data;
}

const before = readFile();
const { document } = await graphql(
  `query ($collection: String!, $relativePath: String!) {
     document(collection: $collection, relativePath: $relativePath) { ... on Document { _values } }
   }`,
  { collection, relativePath },
);
const params = pick(document._values, definition.fields);
const expected = structuredClone(before);
if (set) {
  const [dottedPath, ...rest] = set.split("=");
  setPath(params, dottedPath, rest.join("="));
  setPath(expected, dottedPath, rest.join("="));
}
await graphql(
  `mutation ($collection: String!, $relativePath: String!, $params: DocumentUpdateMutation!) {
     updateDocument(collection: $collection, relativePath: $relativePath, params: $params) { __typename }
   }`,
  { collection, relativePath, params: { [collection]: params } },
);
assert.deepEqual(readFile(), expected);
console.log(`ROUND-TRIP OK: ${file}${set ? ` (${set.split("=")[0]} geändert)` : ""}`);
