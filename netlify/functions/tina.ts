import express from "express";
import cookieParser from "cookie-parser";
import ServerlessHttp from "serverless-http";
import cors from "cors";
import { TinaNodeBackend, LocalBackendAuthProvider } from "@tinacms/datalayer";
import { AuthJsBackendAuthProvider, TinaAuthJSOptions } from "tinacms-authjs";
import databaseClient from "../../tina/__generated__/databaseClient";
import { requireEnv } from "../../tina/util/env";

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Built directly rather than via next-auth's own CredentialsProvider()
// helper (from "next-auth/providers/credentials") or tinacms-authjs's
// TinaCredentialsProvider() wrapper around it. In this installed version,
// that helper's implementation ignores the options it's given -- it
// hardcodes `name: "Credentials"`, `credentials: {}`, and
// `authorize: () => null`, silently discarding whatever is passed in (the
// input is only stashed, unused, on a nested `.options` property). This
// isn't an import/bundling issue (a separate, real esbuild/next-auth ESM
// interop bug -- nextauthjs/next-auth#11949 -- was ruled out first); the
// helper itself just doesn't work here. next-auth core only needs a plain
// object matching its CredentialsConfig shape (id/name/type/credentials/
// authorize), so we construct it ourselves and skip the helper entirely.
const credentialsProvider = {
  id: "credentials",
  name: "TinaCredentials",
  type: "credentials" as const,
  credentials: {
    username: { label: "Username", type: "text" },
    password: { label: "Password", type: "password" },
  },
  authorize: async (credentials: Record<string, string> | undefined) => {
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
};

const isLocal = process.env.TINA_PUBLIC_IS_LOCAL === "true";
const tinaBackend = TinaNodeBackend({
  authProvider: isLocal
    ? LocalBackendAuthProvider()
    : AuthJsBackendAuthProvider({
        authOptions: TinaAuthJSOptions({
          databaseClient,
          secret: requireEnv(["NEXTAUTH_SECRET"] as const).NEXTAUTH_SECRET,
          providers: [credentialsProvider],
        }),
      }),
  databaseClient,
});

app.all("/api/tina/*splat", async (req, res) => tinaBackend(req, res));
export const handler = ServerlessHttp(app);
