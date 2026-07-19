import express from "express";
import cookieParser from "cookie-parser";
import ServerlessHttp from "serverless-http";
import cors from "cors";
import { TinaNodeBackend, LocalBackendAuthProvider } from "@tinacms/datalayer";
import { AuthJsBackendAuthProvider, TinaAuthJSOptions } from "tinacms-authjs";
import CredentialsProviderImport from "next-auth/providers/credentials";
import databaseClient from "../../tina/__generated__/databaseClient";
import { requireEnv } from "../../tina/util/env";

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Netlify's esbuild function bundler has a known ESM/CJS interop bug with
// next-auth (nextauthjs/next-auth#11949): its default export can come out
// double-wrapped as `{ default: fn }` instead of `fn` directly, depending on
// the bundler. tinacms-authjs's own TinaCredentialsProvider() hits exactly
// this, crashing the whole function on startup ("(0, import_credentials
// .default) is not a function"). Handle both possible shapes ourselves and
// build the credentials provider directly, bypassing the buggy internal call.
const CredentialsProvider = (
  typeof CredentialsProviderImport === "function"
    ? CredentialsProviderImport
    : (CredentialsProviderImport as any)?.default
) as typeof CredentialsProviderImport;

const isLocal = process.env.TINA_PUBLIC_IS_LOCAL === "true";
const tinaBackend = TinaNodeBackend({
  authProvider: isLocal
    ? LocalBackendAuthProvider()
    : AuthJsBackendAuthProvider({
        authOptions: TinaAuthJSOptions({
          databaseClient,
          secret: requireEnv(["NEXTAUTH_SECRET"] as const).NEXTAUTH_SECRET,
          providers: [
            CredentialsProvider({
              name: "TinaCredentials",
              credentials: {
                username: { label: "Username", type: "text" },
                password: { label: "Password", type: "password" },
              },
              authorize: async (credentials: any) => {
                try {
                  const result = await databaseClient.authenticate({
                    username: credentials?.username,
                    password: credentials?.password,
                  });
                  return result.data?.authenticate || null;
                } catch (e) {
                  console.error(e);
                  return null;
                }
              },
            }),
          ],
        }),
      }),
  databaseClient,
});

app.all("/api/tina/*splat", async (req, res) => tinaBackend(req, res));
export const handler = ServerlessHttp(app);
