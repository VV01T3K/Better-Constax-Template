import { initCRPC } from "better-convex/server";

import type { DataModel } from "../functions/_generated/dataModel";

const crpc = initCRPC.dataModel<DataModel>().create();

export const publicQuery = crpc.query;
export const publicMutation = crpc.mutation;
export const publicAction = crpc.action;
