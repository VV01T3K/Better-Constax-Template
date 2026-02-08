// This file exists solely for the Better Auth CLI schema generation.
// It creates a static auth instance that the CLI can inspect.
import { createAuth } from "../auth";

export const auth = createAuth({} as any);
