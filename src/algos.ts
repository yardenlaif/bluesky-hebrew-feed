import { InvalidRequestError } from '@atproto/xrpc-server';
import { SelectQueryBuilder, sql } from 'kysely';
import {
  QueryParams,
  OutputSchema as AlgoOutput,
} from './lexicon/types/app/bsky/feed/getFeedSkeleton';
import { AppContext } from './config';
import { PostSchema } from './db/schema';
import { LANG_HEBREW, LANG_YIDDISH } from './util/hebrew';

function addCursor<T>(
  builder: SelectQueryBuilder<any, any, T>,
  params: QueryParams,
) {
  if (!params.cursor) {
    return builder;
  }

  const indexedAt = params.cursor;
  if (!indexedAt) {
    throw new InvalidRequestError('malformed cursor');
  }
  const timeStr = new Date(parseInt(indexedAt, 10)).toISOString();
  return builder.where('indexedAt', '<=', timeStr);
}

function renderFeed(posts: Pick<PostSchema, 'indexedAt' | 'uri'>[]) {
  const feed = posts.map((row) => ({
    post: row.uri,
  }));

  let cursor: string | undefined;
  const last = posts.at(-1);
  if (last) {
    cursor = new Date(last.indexedAt).getTime().toString();
  }

  return {
    cursor,
    feed,
  };
}

async function hebrewFeedOnlyPosts(
  ctx: AppContext,
  params: QueryParams,
): Promise<AlgoOutput> {
  let builder = ctx.db
    .selectFrom('post')
    .select(['indexedAt', 'uri'])
    .where('language', '=', LANG_HEBREW)
    .where('post.replyTo', 'is', null)
    .orderBy('indexedAt', 'desc')
    .orderBy('cid', 'desc')
    .limit(params.limit);

  builder = addCursor(builder, params);

  return renderFeed(await builder.execute());
}

async function hebrewFeedAll(
  ctx: AppContext,
  params: QueryParams,
): Promise<AlgoOutput> {
  let builder = ctx.db
    .selectFrom('post')
    .select(['indexedAt', 'uri'])
    .where('language', '=', LANG_HEBREW)
    .orderBy('indexedAt', 'desc')
    .orderBy('cid', 'desc')
    .limit(params.limit);

  builder = addCursor(builder, params);

  return renderFeed(await builder.execute());
}

async function yiddishFeedAll(
  ctx: AppContext,
  params: QueryParams,
): Promise<AlgoOutput> {
  let builder = ctx.db
    .selectFrom('post')
    .select(['indexedAt', 'uri'])
    .where('language', '=', LANG_YIDDISH)
    .orderBy('indexedAt', 'desc')
    .orderBy('cid', 'desc')
    .limit(params.limit);

  builder = addCursor(builder, params);

  return renderFeed(await builder.execute());
}

async function firstHebrewPostsFeed(
  ctx: AppContext,
  params: QueryParams,
): Promise<AlgoOutput> {
  let builder = ctx.db
    .with('first_posts', (eb) =>
      eb
        .selectFrom('post')
        .distinctOn('author')
        .select(['uri', 'indexedAt'])
        .orderBy('author')
        .orderBy('indexedAt', 'asc'),
    )
    .selectFrom('first_posts')
    .selectAll()
    .orderBy('indexedAt', 'desc')
    .limit(params.limit);

  builder = addCursor(builder, params);

  return renderFeed(await builder.execute());
}

type AlgoHandler = (
  ctx: AppContext,
  params: QueryParams,
) => Promise<AlgoOutput>;

const algos: Record<string, AlgoHandler> = {
  'yiddish-all': yiddishFeedAll,
  'hebrew-feed-all': hebrewFeedAll,
  'hebrew-feed': hebrewFeedOnlyPosts,
  'hebrew-noobs': firstHebrewPostsFeed,
};

export default algos;
