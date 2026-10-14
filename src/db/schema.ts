import { index, integer, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

export const records = pgTable(
  "records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    phone: text("phone").notNull(),
    phoneMasked: text("phone_masked").notNull(),
    serialNumber: text("serial_number").notNull(),
    fileKey: text("file_key").notNull(),
    fileUrl: text("file_url").notNull(),
    fileName: text("file_name").notNull(),
    fileSize: integer("file_size").notNull(),
    fileType: text("file_type").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    serialNumberUnique: uniqueIndex("records_serial_number_unique").on(table.serialNumber),
    createdAtIndex: index("records_created_at_idx").on(table.createdAt),
  }),
);
