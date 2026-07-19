import { createDatabase, createLocalDatabase } from "@tinacms/datalayer";
import { MongodbLevel } from "mongodb-level";
import { GitHubProvider } from "tinacms-gitprovider-github";
import { requireEnv } from "./util/env";

const isLocal = process.env.TINA_PUBLIC_IS_LOCAL === "true";
const branch = process.env.GITHUB_BRANCH || "feat/tinacms-migration";

export default isLocal
  ? createLocalDatabase()
  : (() => {
      const env = requireEnv([
        "GITHUB_OWNER",
        "GITHUB_REPO",
        "GITHUB_PERSONAL_ACCESS_TOKEN",
        "MONGODB_URI",
      ] as const);

      return createDatabase({
        gitProvider: new GitHubProvider({
          branch,
          owner: env.GITHUB_OWNER,
          repo: env.GITHUB_REPO,
          token: env.GITHUB_PERSONAL_ACCESS_TOKEN,
        }),
        databaseAdapter: new MongodbLevel<string, Record<string, any>>({
          collectionName: branch,
          dbName: "tinacms-pottery",
          mongoUri: env.MONGODB_URI,
        }),
      });
    })();
