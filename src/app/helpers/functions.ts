import { rpcOpts } from '@dip1059/bitcoin';
import * as safeMath from '@dip1059/safe-math-js';
import { INestApplication } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Decimal } from '@prisma/client/runtime';
import { __ as trans } from '@squareboat/nestjs-localization';
import qs from 'qs';
import Web3 from 'web3';
import { ResponseModel } from '../models/custom/common.response.model';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../libs/prisma/prisma.service';
import { RedisService } from '../../libs/redis/redis.service';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const encryptor = require('simple-encryptor');

export function getAppKey() {
  return process.env.APP_KEY || 'AppKeyShouldBeMinimum16Characters';
}

export let app: NestExpressApplication | INestApplication;
export let prisma_client: PrismaService;
export let redis_client: RedisService;

export function setApp(nestapp: NestExpressApplication | INestApplication) {
  app = nestapp;
  prisma_client = app.get(PrismaService);
}

export function initCoreServices() {
  redis_client = app.get(RedisService);
}

Number.prototype['noExponents'] = function () {
  const data = String(this).split(/[eE]/);
  if (data.length == 1) return data[0];

  let z = '';
  const sign = this < 0 ? '-' : '';
  const str = data[0].replace('.', '');
  let mag = Number(data[1]) + 1;

  if (mag < 0) {
    z = sign + '0.';
    while (mag++) z += '0';
    return z + str.replace(/^\-/, '');
  }
  mag -= str.length;
  while (mag--) z += '0';
  return str + z;
};

BigInt.prototype['noExponents'] = function () {
  const data = String(this).split(/[eE]/);
  if (data.length == 1) return data[0];

  let z = '';
  const sign = this < 0 ? '-' : '';
  const str = data[0].replace('.', '');
  let mag = Number(data[1]) + 1;

  if (mag < 0) {
    z = sign + '0.';
    while (mag++) z += '0';
    return z + str.replace(/^\-/, '');
  }
  mag -= str.length;
  while (mag--) z += '0';
  return str + z;
};

BigInt.prototype['toJSON'] = function () {
  return this.toString();
};

export function hex_to_ascii(str1) {
  const hex = str1.toString();
  let str = '';
  for (let n = 0; n < hex.length; n += 2) {
    str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
  }
  return str;
}

export function ascii_to_hex(str) {
  const arr1 = [];
  for (let n = 0, l = str.length; n < l; n++) {
    const hex = Number(str.charCodeAt(n)).toString(16);
    arr1.push(hex);
  }
  return arr1.join('');
}

export function getUUID(withSlash = false) {
  const id = randomUUID();
  if (!withSlash) return id.replace(/-/gi, '');
  return id;
}

export function getRandomInt(length: number) {
  let result = '';
  const characters = '0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;

  /* let init_number = 1;
  let multiply_number = 9;
  for (let i = 1; i < digit; i++) {
    init_number *= 10;
    multiply_number *= 10;
  }
  return Math.floor(
    Math.random() * init_number + Math.random() * multiply_number,
  ); */
}

export function getRandomDecimalNumber(intLength?: number, decimal = 8) {
  if (!intLength) intLength = Number(getRandomInt(1));
  if (!intLength) intLength = 1;
  let result = getRandomInt(intLength);
  if (Number(result) == 0) {
    result = Math.random().toFixed(decimal);
  } else {
    const decimalNum = Number(result) * Math.random();
    result = decimalNum.toFixed(decimal);
  }
  return result;
}

export function encrypt(value: string, key?: string): string {
  if (!key) key = getAppKey();
  // if (key) encryptor = require('simple-encryptor')(key);
  return encryptor(key).encrypt(Buffer.from(value).toString('base64'));
  // return Buffer.from(encryptor.encrypt(value), 'base64').toString('hex');
}

export function decrypt(value: string, key?: string): string {
  if (!key) key = getAppKey();
  // if (key) encryptor = require('simple-encryptor')(key);
  return Buffer.from(encryptor(key).decrypt(value), 'base64').toString('ascii');
  // return encryptor.decrypt(Buffer.from(value, 'hex').toString('base64'));
}

export function randomString(length: number) {
  let result = '';
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

export function convertToSlug(Text: string) {
  return Text.toString() // Cast to string
    .toLowerCase() // Convert the string to lowercase letters
    .normalize('NFD') // The normalize() method returns the Unicode Normalization Form of a given string.
    .trim() // Remove whitespace from both sides of a string
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-');
}

export function getDateXDaysAgo(numOfDays: number, date = new Date()): Date {
  const num_of_days_in_ms = numOfDays * 24 * 60 * 60 * 1000;
  const result_date = new Date(date.getTime() - num_of_days_in_ms).setHours(
    0,
    0,
    0,
    0,
  );
  return new Date(result_date);
}

export function getDateXDaysAfter(numOfDays: number, date = new Date()): Date {
  const num_of_days_in_ms = numOfDays * 24 * 60 * 60 * 1000;
  const result_date = new Date(date.getTime() + num_of_days_in_ms);
  return new Date(result_date);
}

export function getDateXHoursAgo(numOfHours: number, date = new Date()): Date {
  const num_of_hours_in_ms = numOfHours * 60 * 60 * 1000;
  const result_date = new Date(date.getTime() - num_of_hours_in_ms);
  return new Date(result_date);
}

export function diff_minutes(dt2: Date, dt1: Date) {
  let diff = (dt2.getTime() - dt1.getTime()) / 1000;
  diff /= 60;
  return Math.abs(Math.round(diff));
}

export function diff_seconds(dt2: Date, dt1: Date) {
  const diff = (dt2.getTime() - dt1.getTime()) / 1000;
  return Math.abs(Math.round(diff));
}

export function __(key: string, lang?: string) {
  try {
    return trans(key, lang || global.lang).replace('ERR::INVALID KEY ==> ', '');
  } catch (e) {
    // console.error(e.stack);
    return key;
  }
}

export function fakeTrans(key: string) {
  return key;
}

export function uniqueCode(prefix?: string, suffix?: string): string {
  return (prefix || '') + String(Date.now()) + (suffix || '');
}

export function createUserCode(): string {
  return uniqueCode('u-');
}

export function processException(e) {
  if (
    (e.hasOwnProperty('response') &&
      !e.response.hasOwnProperty('success') &&
      !e.response.hasOwnProperty('data')) ||
    !e.hasOwnProperty('response')
  ) {
    console.error(e.stack);
  }
  throw e;
}

export function lcfirst(str) {
  str += '';
  const f = str.charAt(0).toLowerCase();
  return f + str.substr(1);
}

export function ucfirst(str) {
  str += '';
  const f = str.charAt(0).toUpperCase();
  return f + str.substr(1);
}

export function customeNumberFormat(value: number, decimalPoint = 8) {
  return new Decimal(value.toFixed(decimalPoint));
}

export function clearTrailingSlash(str: string) {
  return str.replace(/\/$/, '');
}

export function clearBeginingSlash(str: string) {
  return str.replace(/^\//, '');
}

export function clearBothEndSlash(str: string) {
  return str.replace(/\/$/, '').replace(/^\//, '');
}

export function containsSpecialChars(str: string, ignoreDash = false): boolean {
  const specialChars = ignoreDash
    ? /[`!@#$%^&*()_+=\[\]{};':"\\|,.<>\/?~]/
    : /[`!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/;
  return specialChars.test(str);
}

export function hasSqlInjection(value: string) {
  if (value?.includes('\\')) {
    return true;
  }
  const sqlMeta = new RegExp("(%27)|(')|(--)|(%23)|(#)", 'i');
  if (sqlMeta.test(value)) {
    return true;
  }

  const sqlMeta2 = new RegExp(
    "((%3D)|(=))[^\n]*((%27)|(')|(--)|(%3B)|(;))",
    'i',
  );
  if (sqlMeta2.test(value)) {
    return true;
  }

  const sqlTypical = new RegExp(
    "w*((%27)|('))((%6F)|o|(%4F))((%72)|r|(%52))",
    'i',
  );
  if (sqlTypical.test(value)) {
    return true;
  }

  const sqlUnion = new RegExp("((%27)|('))union", 'i');
  if (sqlUnion.test(value)) {
    return true;
  }
  return false;
}

export function covertMilSecToMin(milliseconds: number) {
  return Math.floor(milliseconds / 1000 / 60);
}

export function covertMilSecToSec(milliseconds: number) {
  return Math.floor(milliseconds / 1000);
}

export function toMilliS(mins: number): number {
  return mins * 60 * 1000;
}

export function getUidFromTime(): string {
  return Math.ceil(+new Date()).toString();
}

export function randomUsernameFromWalletAddress(
  wallet_address: string,
): string {
  let result = '';
  const length = 6;
  const characters = wallet_address;
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result.toLowerCase();
}

export function getPercantageValue(value, percentage) {
  return (value * percentage) / 100;
}

export function addMinutes(date: Date | string, minutes: number): Date {
  return new Date(new Date(date).getTime() + minutes * 60000);
}

export function subMinutes(date: Date | string, minutes: number): Date {
  return new Date(new Date(date).getTime() - minutes * 60000);
}

export function convertCoinAmountToInt(
  amount: Decimal | number,
  decimal: number,
): string {
  let multiplier: any = '1';
  for (let i = 0; i < decimal; i++) {
    multiplier += '0';
  }
  const result = multiplyNumbers(Number(amount), Number(multiplier));
  return result['noExponents']().split('.')[0];
}

export function convertCoinAmountFromInt(
  amount: string | number | bigint,
  decimal: number,
): string {
  let multiplier: any = '1';
  for (let i = 0; i < decimal; i++) {
    multiplier += '0';
  }
  const result = divideNumbers(Number(amount), Number(multiplier));
  return result['noExponents']();
}

export function checkAndGetAddress(web3: Web3, address: string): string {
  if (web3.utils.isAddress(address))
    return web3.utils.toChecksumAddress(address);
  return '';
}

export function getDiffInMillisec(date1: Date, date2?: Date) {
  if (!date2) date2 = new Date();
  return date1.getTime() - date2.getTime();
}

export function removeDuplicateArray(array) {
  return [...new Set(array)];
}

export function convertArrayToString(array, joinSymbol: string) {
  return array.join(joinSymbol);
}

export function convertStringNumberToArray(string: string, symbol: string) {
  if (string) {
    const numberArray = string.split(symbol).map(function (item) {
      return parseInt(item, 10);
    });
    return numberArray;
  } else {
    return [];
  }
}

export function parseUrlAndGetRPCopts(url: string): rpcOpts {
  try {
    const rpcOpts: rpcOpts = {
      host: '',
      ssl: false,
    };
    let dataArray = url.split('://');
    rpcOpts.ssl = dataArray[0] === 'https' ? true : false;
    dataArray = dataArray[1].split('@');
    if (dataArray.length === 2) {
      rpcOpts.user = dataArray[0].split(':')[0];
      rpcOpts.pass = dataArray[0].split(':')[1] ?? '';
      dataArray = [dataArray[1]];
    }
    dataArray = dataArray[0].split('/');
    rpcOpts.host = dataArray[0].split(':')[0];
    rpcOpts.port = dataArray[0].split(':')[1];
    rpcOpts.path = '';
    if (dataArray.length > 1) {
      dataArray.shift();
      dataArray.map((value) => (value ? (rpcOpts.path += `/${value}`) : null));
    }
    const lastChar = url[url.length - 1];
    if (lastChar == '/') rpcOpts.path += '/';
    return rpcOpts;
  } catch (e) {
    console.error(e.stack);
    throw new Error(`BTC_BASED_RPC_URL_WHICH_FAILED_TO_PARSE: "${url}"`);
  }
}

export function checkHeaderApiKey(url: string): {
  check_result: boolean;
  url: string;
  header?: { [h: string]: string };
} {
  const splitUrl = url.split('?');
  const query = qs.parse(splitUrl[1]);
  if (query['header_api_key'] && query['header_name']) {
    url = splitUrl[0];
    return {
      check_result: true,
      url: url,
      header: {
        [String(query['header_name'])]: String(query['header_api_key']),
      },
    };
  }
  return { check_result: false, url: url };
}

export function addNumbers(...numbers: number[]): number {
  return safeMath.add(numbers);
}

export function minusNumbers(...numbers: number[]): number {
  return safeMath.minus(numbers);
}

export function multiplyNumbers(...numbers: number[]): number {
  return safeMath.multiply(numbers);
}

export function divideNumbers(...numbers: number[]): number {
  return safeMath.divide(numbers);
}

export function formatCoinDecimal(amount: number, coinDecimal: number): number {
  return Number(amount.toFixed(coinDecimal));
}

export function getProtectedEmail(email: string): string {
  if (!email) return null;
  const splitedEmail = email.split('@');
  return (
    splitedEmail[0].replace(/(.{2})(.*)(?=.{2})/, function (gp1, gp2, gp3) {
      for (let i = 0; i < gp3.length; i++) {
        gp2 += '*';
      }
      return gp2;
    }) + (splitedEmail[1] ? `@${splitedEmail[1]}` : '')
  );
}

export function getProtectedPhone(phone: string): string {
  if (!phone) return null;
  return phone.replace(/(.{3})(.*)(?=.{3})/, function (gp1, gp2, gp3) {
    for (let i = 0; i < gp3.length; i++) {
      gp2 += '*';
    }
    return gp2;
  });
}

export function getApiErrMsg(e: any) {
  return (
    e.data?.message || e.message || e.stack || JSON.stringify(e) || e.toString()
  );
}

export function sortObjectArray(
  field: string,
  direction: string,
  array: object[],
): any[] {
  if (direction == 'desc') {
    array.sort((a1, a2) =>
      a1[field] < a2[field] ? 1 : a1[field] > a2[field] ? -1 : 0,
    ); // sorting desc
  } else {
    array.sort((a1, a2) =>
      a1[field] < a2[field] ? -1 : a1[field] > a2[field] ? 1 : 0,
    ); // sorting asc
  }
  return array;
}

export function sortObjectArrayForDecimal(
  field: string,
  direction: string,
  array: object[],
): any[] {
  if (direction == 'desc') {
    array.sort((a1, a2) =>
      Number(a1[field]) < Number(a2[field])
        ? 1
        : Number(a1[field]) > Number(a2[field])
        ? -1
        : 0,
    ); // sorting desc
  } else {
    array.sort((a1, a2) =>
      Number(a1[field]) < Number(a2[field])
        ? -1
        : Number(a1[field]) > Number(a2[field])
        ? 1
        : 0,
    ); // sorting asc
  }
  return array;
}

export function notifierEnvActive() {
  // if (
  //   (process.env.APP_ENV !== APP_ENV.PRODUCTION &&
  //     process.env.SKIP_NOTIFIERS !== 'false') ||
  //   (process.env.APP_DEBUG === 'true' &&
  //     process.env.SKIP_NOTIFIERS !== 'false')
  // )
  if (process.env.NOTIFIERS_ON === 'true') {
    return true;
  } else return false;
}

export function calculateChangePercent(
  currentValue: number,
  prevValue: number,
  to_fixed = 4,
): number {
  let output = minusNumbers(currentValue, prevValue);
  output = divideNumbers(output * 100, prevValue);
  const sign = output.toString()[0];
  output = Math.abs(Number(output.toFixed(to_fixed)));
  if (sign == '-') output = Number(`${sign}${output}`);
  return output;
}

export function getCurrentDateTimeStr(dateTime?: Date): string {
  const currDate = dateTime || new Date();
  return currDate.toISOString().replace('T', ' ').replace('Z', '').slice(0, -1);
}

export function createSlug(text: string): string {
  text = text.trim();
  text = text.replace(/[`!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/g, '');
  text = text.toLowerCase();
  text = text.replace(/ /g, '-');
  return text;
}

export async function sleep(delay_in_milisec: number) {
  await new Promise((resolve) => setTimeout(resolve, delay_in_milisec));
  return;
}

export function getRandomIndex(array_length: number): number {
  const min = 0;
  const max = array_length - 1;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function getRandomIntFromRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function successResponse(
  msg?: string,
  data?: object,
  code?: number,
): ResponseModel {
  return {
    success: true,
    message: msg ?? '',
    data: data || null,
    code: code || 200,
  };
}

export function errorResponse(
  msg?: string,
  data?: object,
  code?: number,
  messages?: string[],
): ResponseModel {
  return {
    success: false,
    message:
      msg || __('Something went wrong. Please try again after some time.'),
    messages: messages ?? [],
    data: data || null,
    code: code || 500,
  };
}
