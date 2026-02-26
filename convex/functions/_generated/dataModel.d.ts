/* eslint-disable */
/**
 * Generated data model types.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  DocumentByName,
  TableNamesInDataModel,
  SystemTableNames,
  AnyDataModel,
} from "convex/server";
import type { GenericId } from "convex/values";

/**
 * A type describing your Convex data model.
 *
 * This type includes information about what tables you have, the type of
 * documents stored in those tables, and the indexes defined on them.
 *
 * This type is used to parameterize methods like `queryGeneric` and
 * `mutationGeneric` to make them type-safe.
 */

export type DataModel = {
  account: {
    document: {
      accessToken?: null | string;
      accessTokenExpiresAt?: null | number;
      accountId: string;
      createdAt: number;
      idToken?: null | string;
      password?: null | string;
      providerId: string;
      refreshToken?: null | string;
      refreshTokenExpiresAt?: null | number;
      scope?: null | string;
      updatedAt: number;
      userId: string;
      _id: Id<"account">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "accessToken"
      | "accessTokenExpiresAt"
      | "accountId"
      | "createdAt"
      | "idToken"
      | "password"
      | "providerId"
      | "refreshToken"
      | "refreshTokenExpiresAt"
      | "scope"
      | "updatedAt"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      accountId: ["accountId", "_creationTime"];
      accountId_providerId: ["accountId", "providerId", "_creationTime"];
      providerId_userId: ["providerId", "userId", "_creationTime"];
      userId: ["userId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  jwks: {
    document: {
      createdAt: number;
      privateKey: string;
      publicKey: string;
      _id: Id<"jwks">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "createdAt"
      | "privateKey"
      | "publicKey";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  oauthAccessToken: {
    document: {
      accessToken?: null | string;
      accessTokenExpiresAt?: null | number;
      clientId?: null | string;
      createdAt?: null | number;
      refreshToken?: null | string;
      refreshTokenExpiresAt?: null | number;
      scopes?: null | string;
      updatedAt?: null | number;
      userId?: null | string;
      _id: Id<"oauthAccessToken">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "accessToken"
      | "accessTokenExpiresAt"
      | "clientId"
      | "createdAt"
      | "refreshToken"
      | "refreshTokenExpiresAt"
      | "scopes"
      | "updatedAt"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      accessToken: ["accessToken", "_creationTime"];
      clientId: ["clientId", "_creationTime"];
      refreshToken: ["refreshToken", "_creationTime"];
      userId: ["userId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  oauthApplication: {
    document: {
      clientId?: null | string;
      clientSecret?: null | string;
      createdAt?: null | number;
      disabled?: null | boolean;
      icon?: null | string;
      metadata?: null | string;
      name?: null | string;
      redirectURLs?: null | string;
      type?: null | string;
      updatedAt?: null | number;
      userId?: null | string;
      _id: Id<"oauthApplication">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "clientId"
      | "clientSecret"
      | "createdAt"
      | "disabled"
      | "icon"
      | "metadata"
      | "name"
      | "redirectURLs"
      | "type"
      | "updatedAt"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      clientId: ["clientId", "_creationTime"];
      userId: ["userId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  oauthConsent: {
    document: {
      clientId?: null | string;
      consentGiven?: null | boolean;
      createdAt?: null | number;
      scopes?: null | string;
      updatedAt?: null | number;
      userId?: null | string;
      _id: Id<"oauthConsent">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "clientId"
      | "consentGiven"
      | "createdAt"
      | "scopes"
      | "updatedAt"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      clientId_userId: ["clientId", "userId", "_creationTime"];
      userId: ["userId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  passkey: {
    document: {
      aaguid?: null | string;
      backedUp: boolean;
      counter: number;
      createdAt?: null | number;
      credentialID: string;
      deviceType: string;
      name?: null | string;
      publicKey: string;
      transports?: null | string;
      userId: string;
      _id: Id<"passkey">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "aaguid"
      | "backedUp"
      | "counter"
      | "createdAt"
      | "credentialID"
      | "deviceType"
      | "name"
      | "publicKey"
      | "transports"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      credentialID: ["credentialID", "_creationTime"];
      userId: ["userId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  products: {
    document: {
      imageId: string;
      price: number;
      title: string;
      _id: Id<"products">;
      _creationTime: number;
    };
    fieldPaths: "_creationTime" | "_id" | "imageId" | "price" | "title";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  rateLimit: {
    document: {
      count?: null | number;
      key?: null | string;
      lastRequest?: null | number;
      _id: Id<"rateLimit">;
      _creationTime: number;
    };
    fieldPaths: "_creationTime" | "_id" | "count" | "key" | "lastRequest";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      key: ["key", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  session: {
    document: {
      createdAt: number;
      expiresAt: number;
      ipAddress?: null | string;
      token: string;
      updatedAt: number;
      userAgent?: null | string;
      userId: string;
      _id: Id<"session">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "createdAt"
      | "expiresAt"
      | "ipAddress"
      | "token"
      | "updatedAt"
      | "userAgent"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      expiresAt: ["expiresAt", "_creationTime"];
      expiresAt_userId: ["expiresAt", "userId", "_creationTime"];
      token: ["token", "_creationTime"];
      userId: ["userId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  todos: {
    document: {
      completed: boolean;
      text: string;
      userId: string;
      _id: Id<"todos">;
      _creationTime: number;
    };
    fieldPaths: "_creationTime" | "_id" | "completed" | "text" | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_user: ["userId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  twoFactor: {
    document: {
      backupCodes: string;
      secret: string;
      userId: string;
      _id: Id<"twoFactor">;
      _creationTime: number;
    };
    fieldPaths: "_creationTime" | "_id" | "backupCodes" | "secret" | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      userId: ["userId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  user: {
    document: {
      createdAt: number;
      displayUsername?: null | string;
      email: string;
      emailVerified: boolean;
      image?: null | string;
      isAnonymous?: null | boolean;
      name: string;
      phoneNumber?: null | string;
      phoneNumberVerified?: null | boolean;
      twoFactorEnabled?: null | boolean;
      updatedAt: number;
      userId?: null | string;
      username?: null | string;
      _id: Id<"user">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "createdAt"
      | "displayUsername"
      | "email"
      | "emailVerified"
      | "image"
      | "isAnonymous"
      | "name"
      | "phoneNumber"
      | "phoneNumberVerified"
      | "twoFactorEnabled"
      | "updatedAt"
      | "userId"
      | "username";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      email_name: ["email", "name", "_creationTime"];
      name: ["name", "_creationTime"];
      phoneNumber: ["phoneNumber", "_creationTime"];
      userId: ["userId", "_creationTime"];
      username: ["username", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  verification: {
    document: {
      createdAt: number;
      expiresAt: number;
      identifier: string;
      updatedAt: number;
      value: string;
      _id: Id<"verification">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "createdAt"
      | "expiresAt"
      | "identifier"
      | "updatedAt"
      | "value";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      expiresAt: ["expiresAt", "_creationTime"];
      identifier: ["identifier", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
};

/**
 * The names of all of your Convex tables.
 */
export type TableNames = TableNamesInDataModel<DataModel>;

/**
 * The type of a document stored in Convex.
 *
 * @typeParam TableName - A string literal type of the table name (like "users").
 */
export type Doc<TableName extends TableNames> = DocumentByName<
  DataModel,
  TableName
>;

/**
 * An identifier for a document in Convex.
 *
 * Convex documents are uniquely identified by their `Id`, which is accessible
 * on the `_id` field. To learn more, see [Document IDs](https://docs.convex.dev/using/document-ids).
 *
 * Documents can be loaded using `db.get(tableName, id)` in query and mutation functions.
 *
 * IDs are just strings at runtime, but this type can be used to distinguish them from other
 * strings when type checking.
 *
 * @typeParam TableName - A string literal type of the table name (like "users").
 */
export type Id<TableName extends TableNames | SystemTableNames> =
  GenericId<TableName>;
