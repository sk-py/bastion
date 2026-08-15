import * as z from "zod";

const groupNameSchema = z
  .string()
  .trim()
  .min(2, "Group name must be at least 2 characters")
  .max(100, "Group name is too long");

const groupDescriptionSchema = z
  .string()
  .trim()
  .max(500, "Description is too long")
  .optional();

export const createGroupSchema = z.object({
  name: groupNameSchema,
  description: groupDescriptionSchema,
});

export const updateGroupSchema = z.object({
  name: groupNameSchema,
  description: groupDescriptionSchema,
});

export const groupMemberSchema = z.object({
  userId: z.string().uuid(),
});

export type GroupMemberSchema = z.infer<typeof groupMemberSchema>;
export type CreateGroupSchema = z.infer<typeof createGroupSchema>;
export type UpdateGroupSchema = z.infer<typeof updateGroupSchema>;