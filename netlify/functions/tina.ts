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

const isLocal = process.env.TINA_PUBLIC_IS_LOCAL === "true";
const tinaBackend = TinaNodeBackend({
  authProvider: isLocal
    ? LocalBackendAuthProvider()
    : AuthJsBackendAuthProvider({
        authOptions: TinaAuthJSOptions({
          databaseClient,
          secret: requireEnv(["NEXTAUTH_SECRET"] as const).NEXTAUTH_SECRET,
        }),
      }),
  databaseClient,
});

app.all("/api/tina/*splat", async (req, res) => tinaBackend(req, res));
export const handler = ServerlessHttp(app);
