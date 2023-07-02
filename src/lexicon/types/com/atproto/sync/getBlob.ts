/**
 * GENERATED CODE - DO NOT MODIFY
 */
import express from 'express';
import stream from 'stream';
import { ValidationResult, BlobRef } from '@atproto/lexicon';
import { lexicons } from '../../../../lexicons';
import { isObj, hasProp } from '../../../../util';
import { CID } from 'multiformats/cid';
import { HandlerAuth } from '@atproto/xrpc-server';

export interface QueryParams {
  /** The DID of the repo. */
  did: string;
  /** The CID of the blob to fetch */
  cid: string;
}

export type InputSchema = undefined;
export type HandlerInput = undefined;

export interface HandlerSuccess {
  encoding: '*/*';
  body: Uint8Array | stream.Readable;
}

export interface HandlerError {
  status: number;
  message?: string;
}

export type HandlerOutput = HandlerError | HandlerSuccess;
export type Handler<HA extends HandlerAuth = never> = (ctx: {
  auth: HA;
  params: QueryParams;
  input: HandlerInput;
  req: express.Request;
  res: express.Response;
}) => Promise<HandlerOutput> | HandlerOutput;
