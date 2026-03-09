/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type { FunctionReference } from "convex/server";
import type { GenericId as Id } from "convex/values";

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: {
  func: {
    files: {
      generateUploadUrl: FunctionReference<"mutation", "public", {}, string>;
      list: FunctionReference<
        "query",
        "public",
        {},
        Array<{
          _creationTime: number;
          _id: Id<"files">;
          detectedFileType?: string;
          fileName: string;
          fileSize: number;
          fileType: string;
          typeSource?: "magic-bytes" | "extension" | "content-sniff";
        }>
      >;
      remove: FunctionReference<"mutation", "public", { id: any }, any>;
      saveFile: FunctionReference<
        "mutation",
        "public",
        {
          detectedFileType?: string;
          fileName: string;
          fileSize: number;
          fileType: string;
          storageId: Id<"_storage">;
          typeSource?: "magic-bytes" | "extension" | "content-sniff";
        },
        any
      >;
    };
    session: {
      me: FunctionReference<
        "query",
        "public",
        {},
        { name: string; userId: string } | null
      >;
    };
    tanstackTableDemo: {
      page: FunctionReference<
        "query",
        "public",
        {
          filter?: string;
          pageIndex?: number;
          pageSize?: number;
          sortDirection?: "asc" | "desc";
          sortKey?:
            | "caseId"
            | "name"
            | "owner"
            | "status"
            | "priority"
            | "region"
            | "amountCents"
            | "updatedAt";
          status?: "queued" | "review" | "blocked" | "ready" | "all";
        },
        {
          filter: string;
          pageCount: number;
          pageIndex: number;
          pageSize: number;
          rows: Array<{
            _creationTime: number;
            _id: Id<"tanstackTableDemoRows">;
            amountCents: number;
            caseId: string;
            name: string;
            owner: string;
            priority: "low" | "medium" | "high" | "urgent";
            region: "us" | "emea" | "apac";
            status: "queued" | "review" | "blocked" | "ready";
            updatedAt: number;
          }>;
          sortDirection: "asc" | "desc";
          sortKey:
            | "caseId"
            | "name"
            | "owner"
            | "status"
            | "priority"
            | "region"
            | "amountCents"
            | "updatedAt";
          status: "queued" | "review" | "blocked" | "ready" | "all";
          totalRows: number;
        }
      >;
    };
    todos: {
      add: FunctionReference<"mutation", "public", { text: string }, any>;
      list: FunctionReference<
        "query",
        "public",
        {},
        Array<{
          _creationTime: number;
          _id: Id<"todos">;
          completed: boolean;
          text: string;
        }>
      >;
      remove: FunctionReference<"mutation", "public", { id: any }, any>;
      toggle: FunctionReference<"mutation", "public", { id: any }, any>;
    };
  };
};

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: {
  func: {
    files: {
      getServeInfo: FunctionReference<
        "query",
        "internal",
        { id: any },
        { fileName: string; fileSize: number; fileType: string; storageId: any }
      >;
    };
  };
  generated: {
    auth: {
      create: FunctionReference<
        "mutation",
        "internal",
        { input: { data: any; model: string }; select?: Array<string> },
        any
      >;
      deleteMany: FunctionReference<
        "mutation",
        "internal",
        {
          input: { model: string; where?: Array<any> };
          paginationOpts: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
        },
        any
      >;
      deleteOne: FunctionReference<
        "mutation",
        "internal",
        { input: { model: string; where?: Array<any> } },
        any
      >;
      findMany: FunctionReference<
        "query",
        "internal",
        {
          join?: any;
          limit?: number;
          model: string;
          offset?: number;
          paginationOpts: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
          sortBy?: { direction: "asc" | "desc"; field: string };
          where?: Array<{
            connector?: "AND" | "OR";
            field: string;
            operator?:
              | "lt"
              | "lte"
              | "gt"
              | "gte"
              | "eq"
              | "in"
              | "not_in"
              | "ne"
              | "contains"
              | "starts_with"
              | "ends_with";
            value:
              | string
              | number
              | boolean
              | Array<string>
              | Array<number>
              | null;
          }>;
        },
        any
      >;
      findOne: FunctionReference<
        "query",
        "internal",
        {
          join?: any;
          model: string;
          select?: Array<string>;
          where?: Array<{
            connector?: "AND" | "OR";
            field: string;
            operator?:
              | "lt"
              | "lte"
              | "gt"
              | "gte"
              | "eq"
              | "in"
              | "not_in"
              | "ne"
              | "contains"
              | "starts_with"
              | "ends_with";
            value:
              | string
              | number
              | boolean
              | Array<string>
              | Array<number>
              | null;
          }>;
        },
        any
      >;
      getLatestJwks: FunctionReference<"action", "internal", {}, any>;
      rotateKeys: FunctionReference<"action", "internal", {}, any>;
      updateMany: FunctionReference<
        "mutation",
        "internal",
        {
          input: { model: string; update: any; where?: Array<any> };
          paginationOpts: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
        },
        any
      >;
      updateOne: FunctionReference<
        "mutation",
        "internal",
        { input: { model: string; update: any; where?: Array<any> } },
        any
      >;
    };
  };
  migrations: {
    run: FunctionReference<
      "mutation",
      "internal",
      {
        batchSize?: number;
        cursor?: string | null;
        dryRun?: boolean;
        fn?: string;
        next?: Array<string>;
      },
      any
    >;
    seedTanstackTableDemoRows: FunctionReference<
      "mutation",
      "internal",
      {},
      any
    >;
  };
};

export declare const components: {
  migrations: {
    lib: {
      cancel: FunctionReference<
        "mutation",
        "internal",
        { name: string },
        {
          batchSize?: number;
          cursor?: string | null;
          error?: string;
          isDone: boolean;
          latestEnd?: number;
          latestStart: number;
          name: string;
          next?: Array<string>;
          processed: number;
          state: "inProgress" | "success" | "failed" | "canceled" | "unknown";
        }
      >;
      cancelAll: FunctionReference<
        "mutation",
        "internal",
        { sinceTs?: number },
        Array<{
          batchSize?: number;
          cursor?: string | null;
          error?: string;
          isDone: boolean;
          latestEnd?: number;
          latestStart: number;
          name: string;
          next?: Array<string>;
          processed: number;
          state: "inProgress" | "success" | "failed" | "canceled" | "unknown";
        }>
      >;
      clearAll: FunctionReference<
        "mutation",
        "internal",
        { before?: number },
        null
      >;
      getStatus: FunctionReference<
        "query",
        "internal",
        { limit?: number; names?: Array<string> },
        Array<{
          batchSize?: number;
          cursor?: string | null;
          error?: string;
          isDone: boolean;
          latestEnd?: number;
          latestStart: number;
          name: string;
          next?: Array<string>;
          processed: number;
          state: "inProgress" | "success" | "failed" | "canceled" | "unknown";
        }>
      >;
      migrate: FunctionReference<
        "mutation",
        "internal",
        {
          batchSize?: number;
          cursor?: string | null;
          dryRun: boolean;
          fnHandle: string;
          name: string;
          next?: Array<{ fnHandle: string; name: string }>;
          oneBatchOnly?: boolean;
        },
        {
          batchSize?: number;
          cursor?: string | null;
          error?: string;
          isDone: boolean;
          latestEnd?: number;
          latestStart: number;
          name: string;
          next?: Array<string>;
          processed: number;
          state: "inProgress" | "success" | "failed" | "canceled" | "unknown";
        }
      >;
    };
  };
};
