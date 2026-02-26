/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as functions_addressForms from "../functions/addressForms.js";
import type * as functions_files from "../functions/files.js";
import type * as functions_massiveDataset from "../functions/massiveDataset.js";
import type * as functions_tableDemo from "../functions/tableDemo.js";
import type * as functions_todos from "../functions/todos.js";
import type * as lib_functionHelpers from "../lib/functionHelpers.js";
import type * as schemas_addressForms from "../schemas/addressForms.js";
import type * as schemas_files from "../schemas/files.js";
import type * as schemas_index from "../schemas/index.js";
import type * as schemas_todos from "../schemas/todos.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "functions/addressForms": typeof functions_addressForms;
  "functions/files": typeof functions_files;
  "functions/massiveDataset": typeof functions_massiveDataset;
  "functions/tableDemo": typeof functions_tableDemo;
  "functions/todos": typeof functions_todos;
  "lib/functionHelpers": typeof lib_functionHelpers;
  "schemas/addressForms": typeof schemas_addressForms;
  "schemas/files": typeof schemas_files;
  "schemas/index": typeof schemas_index;
  "schemas/todos": typeof schemas_todos;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
