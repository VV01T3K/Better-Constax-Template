import "./lib/http-polyfills";

import { registerRoutes } from "better-convex/auth";
import { httpRouter } from "convex/server";

import { getAuth } from "./auth";

const http = httpRouter();

registerRoutes(http, getAuth);

export default http;
