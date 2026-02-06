import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  profiles: defineTable({
    authUserId: v.string(),
    name: v.string(),
    email: v.string(),
    image: v.union(v.string(), v.null()),
    createdAt: v.number(),
  }).index('by_authUserId', ['authUserId']),
  products: defineTable({
    title: v.string(),
    imageId: v.string(),
    price: v.number(),
  }),
  todos: defineTable({
    text: v.string(),
    completed: v.boolean(),
  }),
})
