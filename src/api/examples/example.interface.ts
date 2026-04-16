import { examples } from '@/db/schema';

export type IExample = typeof examples.$inferSelect;
export type NewExample = typeof examples.$inferInsert;
