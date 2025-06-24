import { customAlphabet, nanoid } from 'nanoid';
import z from 'zod';

export const UniqueIdsSchema = z.enum([
  'user',
  'org',
  'post',
  'orgUser',
  'orgInvite',
  'social',
  'media',
  'session',
  'account',
  'verification',
  'alt_post',
]);

export type UniqueIdsType = z.infer<typeof UniqueIdsSchema>;

export function createUniqueIds(id: UniqueIdsType, custom?: boolean) {
  if (custom) {
    const nanoid = customAlphabet('-abcdefghijklmnopqrstuvwxyz1234567890', 14);
    return `${id}-${nanoid()}`;
  }
  return `${id}_${nanoid(11)}`;
}
