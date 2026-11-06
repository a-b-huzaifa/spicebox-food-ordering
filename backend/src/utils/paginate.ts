import type { Query } from 'mongoose';
import type { Paginated } from '../types';

export interface PaginateOptions {
  page?: number;
  limit?: number;
  maxLimit?: number;
}

/**
 * Generic pagination helper.
 * Takes a Mongoose data query, count query, options, and an optional transform function.
 * Returns a typed Paginated<T> structure with calculated pagination metadata.
 */
export async function paginate<Item, Raw = Item>(
  dataQuery: Query<Raw[], any>,
  countQuery: Query<number, any>,
  options: PaginateOptions = {},
  transform?: (raw: Raw) => Item,
): Promise<Paginated<Item>> {
  const page = Math.max(1, Math.floor(options.page ?? 1));
  const maxLimit = options.maxLimit ?? 100;
  const limit = Math.min(maxLimit, Math.max(1, Math.floor(options.limit ?? 10)));
  const skip = (page - 1) * limit;

  const [total, rawItems] = await Promise.all([
    countQuery.exec(),
    dataQuery.skip(skip).limit(limit).exec(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const items: Item[] = transform
    ? rawItems.map(transform)
    : (rawItems as unknown as Item[]);

  return {
    items,
    page,
    limit,
    total,
    totalPages,
  };
}

export default paginate;

