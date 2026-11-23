// A small data-access layer over MySQL.
//
// Each model (models/*.js) describes its table: the fields, their types, defaults and validation
// rules, and any lists stored in a child table (for example an order's items in `order_items`).
// The layer turns that description into SQL and gives the controllers:
//   - records as JSON objects (`_id`, nested objects, arrays, createdAt/updatedAt)
//   - casting rules ("12" -> 12, "" -> null, " A@B.com " -> "a@b.com")
//   - validation messages defined per field ("Please provide the product name", ...)
//   - save() writes only the columns that changed, so concurrent updates of other fields
//     (for example stock deducted by an order) are not overwritten.
//
// Filters are plain objects:
//   { field: value }                       field = value   (null/undefined -> IS NULL)
//   { field: { $ne, $gt, $gte, $lt, $lte, $in, $nin, $exists } }
//   { field: { $contains: 'text' } }        case-insensitive "contains" search (SQL LIKE, text is literal)
//   { $or: [filter, ...] }, { $and: [filter, ...] }
//   { 'items.0': { $exists: true } }       has at least one entry in the child list
// Nested fields use dots: { 'shippingAddress.email': 'a@b.com' }.
// All values are sent to MySQL as query parameters, never pasted into the SQL text.

import util from 'util';
import { query, transaction } from '../config/db.js';
import { newId, isValidId } from './ids.js';

// ---- Errors (handled by middleware/errorMiddleware.js) -----------------------------------------

const describe = (value) => {
  let s = util.inspect(value);
  s = s.replace(/^'|'$/g, '"');
  return s.startsWith('"') ? s : `"${s}"`;
};
const typeOf = (value) => (value === null ? 'null' : Array.isArray(value) ? 'Array' : typeof value === 'object' ? value.constructor?.name || 'Object' : typeof value);

// modelName is given for errors in queries; errors found while validating a record have none.
export class CastError extends Error {
  constructor(kind, value, path, modelName) {
    super(`Cast to ${kind} failed for value ${describe(value)} (type ${typeOf(value)}) at path "${path}"${modelName ? ` for model "${modelName}"` : ''}`);
    this.name = 'CastError';
    this.kind = kind;
    this.value = value;
    this.path = path;
  }
}

export class ValidationError extends Error {
  constructor(modelName, errors) {
    super(`${modelName} validation failed: ${Object.entries(errors).map(([p, e]) => `${p}: ${e.message}`).join(', ')}`);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

export const isDuplicateKeyError = (err) => err?.code === 'ER_DUP_ENTRY' || err?.errno === 1062;

// ---- Small helpers ---------------------------------------------------------------------------

const snakeCase = (p) => p.replace(/\./g, '_').replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();

export const getPath = (obj, path) => {
  let cur = obj;
  for (const key of path.split('.')) {
    if (cur === null || cur === undefined) return undefined;
    cur = cur[key];
  }
  return cur;
};

export const setPath = (obj, path, value) => {
  const keys = path.split('.');
  let cur = obj;
  for (let i = 0; i < keys.length - 1; i += 1) {
    if (cur[keys[i]] === null || typeof cur[keys[i]] !== 'object') cur[keys[i]] = {};
    cur = cur[keys[i]];
  }
  cur[keys[keys.length - 1]] = value;
};

const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date)
  && (Object.getPrototypeOf(v) === Object.prototype || Object.getPrototypeOf(v) === null);

const isOperatorObject = (v) => isPlainObject(v) && Object.keys(v).length > 0 && Object.keys(v).every((k) => k.startsWith('$'));

const TRUE_VALUES = new Set([true, 'true', 1, '1', 'yes']);
const FALSE_VALUES = new Set([false, 'false', 0, '0', 'no']);

// Reads an ID from a string or from a populated record ({ _id }).
const idString = (value) => {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') {
    if (value._id !== undefined && value._id !== value) return idString(value._id);
  }
  return null;
};

// Converts a value to the field's type ("12" -> 12, "" -> null, "yes" -> true). Throws CastError when impossible.
export const castValue = (field, value, modelName) => {
  if (value === undefined || value === null) return value;
  const fail = () => { throw new CastError(field.castName, value, field.path, modelName); };

  switch (field.type) {
    case 'string': {
      let s;
      if (typeof value === 'string') s = value;
      else if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') s = String(value);
      else if (value && typeof value === 'object' && typeof value._id === 'string') s = value._id;
      else if (value && typeof value.toString === 'function' && value.toString !== Object.prototype.toString && !Array.isArray(value)) s = value.toString();
      else fail();
      if (field.trim) s = s.trim();
      if (field.lowercase) s = s.toLowerCase();
      if (field.uppercase) s = s.toUpperCase();
      return s;
    }
    case 'number': {
      if (typeof value === 'number') return Number.isNaN(value) ? fail() : value;
      if (typeof value === 'string') {
        if (value.trim() === '') return null;
        const n = Number(value);
        return Number.isNaN(n) ? fail() : n;
      }
      if (typeof value === 'boolean') return value ? 1 : 0;
      return fail();
    }
    case 'boolean':
      if (TRUE_VALUES.has(value)) return true;
      if (FALSE_VALUES.has(value)) return false;
      return fail();
    case 'date': {
      if (value instanceof Date) return Number.isNaN(value.getTime()) ? fail() : value;
      if (value === '') return null;
      let d;
      if (typeof value === 'number') d = new Date(value);
      else if (typeof value === 'string') d = /^-?\d+$/.test(value) ? new Date(Number(value)) : new Date(value);
      else return fail();
      return Number.isNaN(d.getTime()) ? fail() : d;
    }
    case 'id': {
      const s = idString(value);
      if (!isValidId(s)) fail();
      return s.toLowerCase();
    }
    case 'stringArray': {
      const list = Array.isArray(value) ? value : [value];
      const item = { ...field, type: 'string', castName: 'string' };
      return list.map((v) => castValue(item, v, modelName));
    }
    default:
      return value;
  }
};

// Value as stored in MySQL.
const toDb = (field, value) => {
  if (value === undefined || value === null) return field.type === 'stringArray' ? JSON.stringify([]) : null;
  if (field.type === 'stringArray') return JSON.stringify(value);
  if (field.type === 'boolean') return value ? 1 : 0;
  return value;
};

// Value as read from MySQL.
const fromDb = (field, value) => {
  if (field.type === 'stringArray') {
    if (value === null || value === undefined) return [];
    if (typeof value === 'string') { try { return JSON.parse(value); } catch { return []; } }
    if (Buffer.isBuffer(value)) { try { return JSON.parse(value.toString('utf8')); } catch { return []; } }
    return value;
  }
  if (value === null || value === undefined) return null;
  switch (field.type) {
    case 'boolean': return value === 1 || value === true || value === '1';
    case 'number': return typeof value === 'number' ? value : Number(value);
    case 'date': return value instanceof Date ? value : new Date(value);
    case 'string':
    case 'id': return String(value);
    default: return value;
  }
};

// Two stored values are the same (used to find changed columns).
const sameDbValue = (a, b) => {
  if (a instanceof Date || b instanceof Date) {
    return a instanceof Date && b instanceof Date && a.getTime() === b.getTime();
  }
  return a === b;
};

const requiredMessage = (field) => (typeof field.required === 'string' ? field.required : `Path \`${field.path}\` is required.`);

const isMissing = (field, value) => value === undefined || value === null || (field.type === 'string' && value === '');

// Validation of one field. Returns an error message or null.
const checkField = (field, value) => {
  if (field.required && isMissing(field, value)) return requiredMessage(field);
  if (value === undefined || value === null) return null;
  if (field.enum && !field.enum.includes(value)) return `\`${value}\` is not a valid enum value for path \`${field.path}\`.`;
  if (field.min && value < field.min[0]) return field.min[1] || `Path \`${field.path}\` (${value}) is less than minimum allowed value (${field.min[0]}).`;
  if (field.max && value > field.max[0]) return field.max[1] || `Path \`${field.path}\` (${value}) is more than maximum allowed value (${field.max[0]}).`;
  if (field.minlength && typeof value === 'string' && value.length < field.minlength[0]) {
    return field.minlength[1] || `Path \`${field.path}\` (\`${value}\`) is shorter than the minimum allowed length (${field.minlength[0]}).`;
  }
  if (field.validate && !field.validate.validator(value)) return field.validate.message || `Validator failed for path \`${field.path}\` with value \`${value}\``;
  return null;
};

const CAST_NAMES = { string: 'string', number: 'Number', boolean: 'Boolean', date: 'date', id: 'ID', stringArray: '[string]' };

const compileFields = (fields) => Object.entries(fields).map(([path, def]) => {
  const spec = typeof def === 'string' ? { type: def } : def;
  return { ...spec, path, column: spec.column || snakeCase(path), castName: CAST_NAMES[spec.type] };
});

const defaultFor = (field) => {
  if (field.default !== undefined) return typeof field.default === 'function' ? field.default() : field.default;
  if (field.type === 'stringArray') return [];
  return undefined;
};

// ---- Selecting which fields to load ---------------------------------------------------------

const parseSelect = (Model, select) => {
  const { fields, children } = Model.schema;
  const names = [];
  if (typeof select === 'string') names.push(...select.split(/\s+/).filter(Boolean));
  else if (Array.isArray(select)) names.push(...select);
  else if (isPlainObject(select)) {
    for (const [k, v] of Object.entries(select)) names.push(v ? k : `-${k}`);
  }

  const include = names.filter((n) => !n.startsWith('-') && !n.startsWith('+'));
  const exclude = new Set(names.filter((n) => n.startsWith('-')).map((n) => n.slice(1)));
  const plus = new Set(names.filter((n) => n.startsWith('+')).map((n) => n.slice(1)));
  const matches = (path, list) => list.some((n) => n === path || path.startsWith(`${n}.`));

  const loaded = new Set();
  for (const f of fields) {
    if (include.length) {
      if (matches(f.path, include)) loaded.add(f.path);
    } else if (f.select !== false || plus.has(f.path)) {
      loaded.add(f.path);
    }
    if (exclude.has(f.path) || [...exclude].some((n) => f.path.startsWith(`${n}.`))) loaded.delete(f.path);
  }
  for (const name of Object.keys(children)) {
    if (include.length ? include.includes(name) : !exclude.has(name)) loaded.add(name);
  }
  const timestamps = include.length
    ? ['createdAt', 'updatedAt'].filter((t) => include.includes(t))
    : ['createdAt', 'updatedAt'].filter((t) => !exclude.has(t));
  return { loaded, timestamps };
};

// ---- Filters -> SQL ----------------------------------------------------------------------

const escapeLike = (text) => String(text).replace(/[!%_]/g, '!$&');

const resolveField = (Model, key) => {
  if (key === '_id') return Model.idField;
  if (key === 'createdAt' || key === 'updatedAt') return Model.timestampFields[key];
  return Model.fieldsByPath.get(key) || null;
};

const compileFilter = (Model, filter, alias = 't') => {
  const parts = [];
  const params = [];
  if (!filter) return { sql: '1=1', params };

  for (const [key, cond] of Object.entries(filter)) {
    if (key === '$or' || key === '$and') {
      const subs = (cond || []).map((c) => compileFilter(Model, c, alias));
      if (!subs.length) { parts.push(key === '$or' ? '0=1' : '1=1'); continue; }
      parts.push(`(${subs.map((s) => `(${s.sql})`).join(key === '$or' ? ' OR ' : ' AND ')})`);
      subs.forEach((s) => params.push(...s.params));
      continue;
    }

    // 'items.0': { $exists: true }  ->  the record has at least one child row
    const childMatch = /^([^.]+)\.0$/.exec(key);
    if (childMatch && Model.schema.children[childMatch[1]]) {
      const child = Model.schema.children[childMatch[1]];
      const exists = isOperatorObject(cond) ? cond.$exists !== false : true;
      parts.push(`${exists ? '' : 'NOT '}EXISTS (SELECT 1 FROM \`${child.table}\` c WHERE c.\`${child.foreignKey}\` = ${alias}.id)`);
      continue;
    }

    const field = resolveField(Model, key);
    if (!field) {
      // Field that does not exist in the table: matches nothing.
      parts.push('0=1');
      continue;
    }
    const col = `${alias}.\`${field.column}\``;
    const cast = (v) => toDb(field, castValue(field, v, Model.modelName));

    if (!isOperatorObject(cond)) {
      if (cond === undefined || cond === null) parts.push(`${col} IS NULL`);
      else { parts.push(`${col} = ?`); params.push(cast(cond)); }
      continue;
    }

    for (const [op, value] of Object.entries(cond)) {
      switch (op) {
        case '$eq':
          if (value === null || value === undefined) parts.push(`${col} IS NULL`);
          else { parts.push(`${col} = ?`); params.push(cast(value)); }
          break;
        case '$ne':
          if (value === null || value === undefined) parts.push(`${col} IS NOT NULL`);
          else { parts.push(`(${col} <> ? OR ${col} IS NULL)`); params.push(cast(value)); }
          break;
        case '$gt': parts.push(`${col} > ?`); params.push(cast(value)); break;
        case '$gte': parts.push(`${col} >= ?`); params.push(cast(value)); break;
        case '$lt': parts.push(`${col} < ?`); params.push(cast(value)); break;
        case '$lte': parts.push(`${col} <= ?`); params.push(cast(value)); break;
        case '$in':
        case '$nin': {
          const list = Array.isArray(value) ? value : [value];
          const nonNull = list.filter((v) => v !== null && v !== undefined).map(cast);
          const hasNull = nonNull.length !== list.length;
          const pieces = [];
          if (nonNull.length) { pieces.push(`${col} IN (?)`); params.push(nonNull); }
          if (hasNull) pieces.push(`${col} IS NULL`);
          const sql = pieces.length ? `(${pieces.join(' OR ')})` : '0=1';
          parts.push(op === '$in' ? sql : `NOT ${sql}`);
          break;
        }
        case '$exists':
          parts.push(value ? `${col} IS NOT NULL` : `${col} IS NULL`);
          break;
        case '$contains':
          parts.push(`${col} LIKE ? ESCAPE '!'`);
          params.push(`%${escapeLike(value)}%`);
          break;
        default:
          throw new Error(`Unsupported filter operator ${op} on ${key}`);
      }
    }
  }
  return { sql: parts.length ? parts.join(' AND ') : '1=1', params };
};

const compileSort = (Model, sort, alias = 't') => {
  if (!sort) return '';
  const entries = typeof sort === 'string'
    ? sort.split(/\s+/).filter(Boolean).map((s) => (s.startsWith('-') ? [s.slice(1), -1] : [s, 1]))
    : Object.entries(sort);
  const clauses = [];
  for (const [key, dir] of entries) {
    const field = resolveField(Model, key);
    if (!field) continue;
    const desc = dir === -1 || dir === '-1' || String(dir).toLowerCase() === 'desc' || String(dir).toLowerCase() === 'descending';
    clauses.push(`${alias}.\`${field.column}\` ${desc ? 'DESC' : 'ASC'}`);
  }
  return clauses.join(', ');
};

// ---- Updates ($set / $inc / $setOnInsert / plain fields) -> SQL ------------------------------

const compileUpdate = (Model, update) => {
  const sets = [];
  const params = [];
  const childSets = {};
  const plain = {};
  for (const [k, v] of Object.entries(update || {})) {
    if (!k.startsWith('$')) plain[k] = v;
  }
  const $set = { ...plain, ...(update?.$set || {}) };

  for (const [path, value] of Object.entries($set)) {
    if (Model.schema.children[path]) { childSets[path] = value || []; continue; }
    const field = Model.fieldsByPath.get(path);
    if (!field) continue; // fields that are not in the table are ignored
    sets.push(`\`${field.column}\` = ?`);
    params.push(toDb(field, castValue(field, value, Model.modelName)));
  }
  for (const [path, amount] of Object.entries(update?.$inc || {})) {
    const field = Model.fieldsByPath.get(path);
    if (!field) continue;
    const n = castValue(field, amount, Model.modelName);
    sets.push(`\`${field.column}\` = COALESCE(\`${field.column}\`, 0) + ?`);
    params.push(n);
  }
  return { sets, params, childSets };
};

// ---- Populate --------------------------------------------------------------------------------

const normalizePopulate = (spec, select) => {
  if (!spec) return [];
  if (Array.isArray(spec)) return spec.flatMap((s) => normalizePopulate(s));
  if (typeof spec === 'string') return spec.split(/\s+/).filter(Boolean).map((path) => ({ path, select }));
  return [spec];
};

// Finds which model a path refers to, e.g. 'items.product' on Cart -> Product.
const refModelFor = (Model, path) => {
  if (path === '_id') return Model;
  const field = Model.fieldsByPath.get(path);
  if (field?.ref) return registry.get(field.ref);
  const [childName, childField] = path.split('.');
  const child = Model.schema.children[childName];
  if (child) {
    const f = child.fieldsByPath.get(childField || child.scalar);
    if (f?.ref) return registry.get(f.ref);
  }
  return null;
};

// Calls visit(holder, key) for every place in `obj` that holds a reference at `path`.
// For a plain list of references (wishlist.products), visit receives the array itself.
const visitPath = (obj, segments, visit) => {
  if (obj === null || obj === undefined) return;
  const [head, ...rest] = segments;
  const value = obj[head];
  if (!rest.length) {
    if (Array.isArray(value)) visit(value, null);
    else visit(obj, head);
    return;
  }
  if (Array.isArray(value)) value.forEach((el) => visitPath(el, rest, visit));
  else visitPath(value, rest, visit);
};

export const populate = async (OwnerModel, docs, spec, select) => {
  const list = (Array.isArray(docs) ? docs : [docs]).filter(Boolean);
  for (const opt of normalizePopulate(spec, select)) {
    const Target = (opt.model && (typeof opt.model === 'string' ? registry.get(opt.model) : opt.model)) || refModelFor(OwnerModel, opt.path);
    if (!Target) throw new Error(`Cannot populate "${opt.path}" on ${OwnerModel.modelName}`);

    const segments = opt.path.split('.');
    const holders = [];
    list.forEach((doc) => visitPath(doc, segments, (holder, key) => holders.push([holder, key])));

    const ids = new Set();
    for (const [holder, key] of holders) {
      const values = key === null ? holder : [holder[key]];
      values.forEach((v) => { const id = idString(v); if (id && isValidId(id)) ids.add(id.toLowerCase()); });
    }

    const found = new Map();
    if (ids.size) {
      const refs = await Target.find({ _id: { $in: [...ids] } }).select(opt.select);
      const plain = refs.map((r) => r.toJSON());
      if (opt.populate) await populate(Target, plain, opt.populate);
      plain.forEach((p) => found.set(p._id, p));
    }

    for (const [holder, key] of holders) {
      if (key === null) {
        // A list of references: references to deleted records are left out.
        const resolved = holder.map((v) => found.get(String(idString(v)).toLowerCase())).filter(Boolean);
        holder.splice(0, holder.length, ...resolved);
      } else {
        const id = idString(holder[key]);
        holder[key] = id ? found.get(id.toLowerCase()) || null : holder[key] ?? null;
      }
    }
  }
  return docs;
};

// ---- Query (chainable, awaitable: Model.find(filter).select().sort().skip().limit().populate()) ----

class Query {
  constructor(Model, kind, filter) {
    this.Model = Model;
    this.kind = kind; // 'find' | 'findOne'
    this.filter = filter;
    this._select = undefined;
    this._sort = undefined;
    this._skip = 0;
    this._limit = 0;
    this._populate = [];
    this._lean = false;
    this._forUpdate = false;
  }

  select(s) { this._select = s; return this; }
  sort(s) { this._sort = s; return this; }
  skip(n) { this._skip = Math.max(0, Number(n) || 0); return this; }
  limit(n) { this._limit = Math.max(0, Number(n) || 0); return this; }
  populate(spec, select) { this._populate.push(...normalizePopulate(spec, select)); return this; }
  lean() { this._lean = true; return this; }
  forUpdate() { this._forUpdate = true; return this; }

  async exec() {
    const M = this.Model;
    const { loaded, timestamps } = parseSelect(M, this._select);
    const columns = ['t.id', ...M.schema.fields.filter((f) => loaded.has(f.path)).map((f) => `t.\`${f.column}\``)];
    timestamps.forEach((t) => columns.push(`t.\`${M.timestampFields[t].column}\``));

    const where = compileFilter(M, this.filter);
    const orderBy = compileSort(M, this._sort);
    let sql = `SELECT ${columns.join(', ')} FROM \`${M.schema.table}\` t WHERE ${where.sql}`;
    // Records that tie on the sort fields come back oldest first.
    // (A locking lookup has no ORDER BY, so MySQL uses the filter's index and locks only the matching row.)
    if (!this._forUpdate || orderBy) sql += ` ORDER BY ${orderBy ? `${orderBy}, ` : ''}t.id ASC`;
    const limit = this.kind === 'findOne' ? 1 : this._limit;
    if (limit || this._skip) sql += ` LIMIT ${limit || '18446744073709551615'}`;
    if (this._skip) sql += ` OFFSET ${this._skip}`;
    if (this._forUpdate) sql += ' FOR UPDATE';

    const rows = await query(sql, where.params);
    const docs = rows.map((row) => M.hydrate(row, loaded, timestamps));
    await M.loadChildren(docs, loaded);

    if (this._populate.length) await populate(M, docs, this._populate);
    const out = this._lean ? docs.map((d) => d.toObject()) : docs;
    return this.kind === 'findOne' ? out[0] || null : out;
  }

  then(resolve, reject) { return this.exec().then(resolve, reject); }
  catch(reject) { return this.exec().catch(reject); }
  finally(fn) { return this.exec().finally(fn); }
}

// ---- Model -----------------------------------------------------------------------------------

const registry = new Map();
const STATE = Symbol('state');

export class Model {
  constructor(data = {}, { isNew = true } = {}) {
    const M = this.constructor;
    Object.defineProperty(this, STATE, {
      value: { isNew, loaded: new Set(), original: new Map(), originalChildren: new Map(), id: null, createdAt: null },
      enumerable: false,
      writable: true
    });
    if (!isNew) return;

    const state = this[STATE];
    this._id = data._id !== undefined && data._id !== null ? castValue(M.idField, data._id, M.modelName) : newId();
    state.id = this._id;
    for (const f of M.schema.fields) {
      let v = getPath(data, f.path);
      if (v === undefined) v = defaultFor(f);
      if (v !== undefined) setPath(this, f.path, v);
      else if (f.path.includes('.')) setPath(this, f.path, undefined);
      state.loaded.add(f.path);
    }
    for (const [name, child] of Object.entries(M.schema.children)) {
      const items = Array.isArray(data[name]) ? data[name] : [];
      this[name] = items.map((item) => (child.scalar ? item : child.withDefaults(item)));
      state.loaded.add(name);
    }
    if (data.createdAt) this.createdAt = data.createdAt;
    if (data.updatedAt) this.updatedAt = data.updatedAt;
  }

  static define(name, schema, methods = {}) {
    const Base = this;
    const M = class extends Base {};
    Object.defineProperty(M, 'name', { value: name });
    M.modelName = name;
    const fields = compileFields(schema.fields);
    const children = {};
    for (const [childName, child] of Object.entries(schema.children || {})) {
      const childFields = compileFields(child.fields);
      children[childName] = {
        ...child,
        name: childName,
        fields: childFields,
        fieldsByPath: new Map(childFields.map((f) => [f.path, f])),
        withDefaults(item) {
          const out = { ...(isPlainObject(item) ? item : {}) };
          for (const f of childFields) if (out[f.path] === undefined && defaultFor(f) !== undefined) out[f.path] = defaultFor(f);
          return out;
        }
      };
    }
    M.schema = { table: schema.table, fields, children, preSave: schema.preSave };
    M.fieldsByPath = new Map(fields.map((f) => [f.path, f]));
    M.idField = { path: '_id', column: 'id', type: 'id', castName: 'ID' };
    M.timestampFields = {
      createdAt: { path: 'createdAt', column: 'created_at', type: 'date', castName: 'date' },
      updatedAt: { path: 'updatedAt', column: 'updated_at', type: 'date', castName: 'date' }
    };
    Object.assign(M.prototype, methods);
    registry.set(name, M);
    return M;
  }

  // Builds a record from a database row.
  static hydrate(row, loaded, timestamps = ['createdAt', 'updatedAt']) {
    const doc = new this(undefined, { isNew: false });
    const state = doc[STATE];
    doc._id = String(row.id);
    state.id = doc._id;
    for (const f of this.schema.fields) {
      if (!loaded.has(f.path)) continue;
      let value = fromDb(f, row[f.column]);
      // An empty column reads as "not set" (undefined), like a field that was never set. Fields with a
      // default (or marked keepNull) can only be empty when set to null on purpose, so they stay null.
      if (value === null && f.default === undefined && !f.keepNull) value = undefined;
      setPath(doc, f.path, value);
      state.loaded.add(f.path);
      state.original.set(f.path, toDb(f, value));
    }
    for (const t of timestamps) {
      if (row[this.timestampFields[t].column] !== undefined) doc[t] = fromDb(this.timestampFields[t], row[this.timestampFields[t].column]);
    }
    state.createdAt = doc.createdAt || null;
    return doc;
  }

  // Loads child-table lists (order items, cart items, ...) for many records in one query each.
  static async loadChildren(docs, loaded) {
    if (!docs.length) return;
    for (const [name, child] of Object.entries(this.schema.children)) {
      if (!loaded.has(name)) continue;
      const byParent = new Map(docs.map((d) => [d._id, []]));
      const rows = await query(
        `SELECT * FROM \`${child.table}\` WHERE \`${child.foreignKey}\` IN (?) ORDER BY \`${child.foreignKey}\`, position, id`,
        [docs.map((d) => d._id)]
      );
      for (const row of rows) {
        const item = {};
        for (const f of child.fields) {
          const v = fromDb(f, row[f.column]);
          if (v !== null) item[f.path] = v;
        }
        byParent.get(String(row[child.foreignKey]))?.push(child.scalar ? item[child.scalar] : item);
      }
      for (const doc of docs) {
        doc[name] = byParent.get(doc._id) || [];
        doc[STATE].loaded.add(name);
        doc[STATE].originalChildren.set(name, JSON.stringify(doc.childRows(name)));
      }
    }
  }

  // ---- Reading ----

  static find(filter = {}) { return new Query(this, 'find', filter); }
  static findOne(filter = {}) { return new Query(this, 'findOne', filter); }

  static findById(id) {
    if (id === undefined || id === null) {
      const q = new Query(this, 'findOne', { _id: null });
      q.exec = async () => null;
      return q;
    }
    castValue(this.idField, id, this.modelName); // a malformed ID is rejected with a CastError (400)
    return new Query(this, 'findOne', { _id: id });
  }

  static async countDocuments(filter = {}) {
    const where = compileFilter(this, filter);
    const rows = await query(`SELECT COUNT(*) AS n FROM \`${this.schema.table}\` t WHERE ${where.sql}`, where.params);
    return Number(rows[0].n);
  }

  static async exists(filter = {}) {
    const where = compileFilter(this, filter);
    const rows = await query(`SELECT t.id FROM \`${this.schema.table}\` t WHERE ${where.sql} LIMIT 1`, where.params);
    return rows.length ? { _id: String(rows[0].id) } : null;
  }

  static populate(docs, spec) { return populate(this, docs, spec); }

  // ---- Writing ----

  static async create(data) {
    if (Array.isArray(data)) return Promise.all(data.map((d) => this.create(d)));
    const doc = new this(data);
    return doc.save();
  }

  // Updates matching records without loading them. Returns { matchedCount, modifiedCount }.
  static async updateMany(filter, update, { limit } = {}) {
    const { sets, params, childSets } = compileUpdate(this, update);
    const where = compileFilter(this, filter, this.schema.table);
    const childNames = Object.keys(childSets);

    // Every update stamps updatedAt (even one that changes nothing else,
    // e.g. opening a cart refreshes the cart's "last active" time).
    if (!childNames.length) {
      sets.push('`updated_at` = ?');
      params.push(new Date());
      const result = await query(
        `UPDATE \`${this.schema.table}\` SET ${sets.join(', ')} WHERE ${where.sql}${limit ? ` LIMIT ${limit}` : ''}`,
        [...params, ...where.params]
      );
      return { acknowledged: true, matchedCount: result.affectedRows, modifiedCount: result.changedRows ?? result.affectedRows };
    }

    return transaction(async () => {
      const ids = (await query(
        `SELECT id FROM \`${this.schema.table}\` WHERE ${where.sql}${limit ? ` LIMIT ${limit}` : ''} FOR UPDATE`,
        where.params
      )).map((r) => String(r.id));
      if (!ids.length) return { acknowledged: true, matchedCount: 0, modifiedCount: 0 };
      await query(
        `UPDATE \`${this.schema.table}\` SET ${[...sets, '`updated_at` = ?'].join(', ')} WHERE id IN (?)`,
        [...params, new Date(), ids]
      );
      for (const name of childNames) {
        for (const id of ids) await this.writeChildren(id, name, this.schema.children[name].scalar ? childSets[name] : childSets[name].map((c) => this.schema.children[name].withDefaults(c)));
      }
      return { acknowledged: true, matchedCount: ids.length, modifiedCount: ids.length };
    });
  }

  static updateOne(filter, update) { return this.updateMany(filter, update, { limit: 1 }); }

  // Finds one record and updates it as a single locked step (SELECT ... FOR UPDATE, then UPDATE).
  // Options: { new: true } returns the updated record (default: the record before the update),
  //          { upsert: true } creates the record when none matches.
  static async findOneAndUpdate(filter, update, options = {}) {
    const returnNew = Boolean(options.new || options.returnDocument === 'after');

    const run = () => transaction(async () => {
      const match = await new Query(this, 'findOne', filter).select('_id').forUpdate();
      if (!match) return { found: false };
      const before = returnNew ? null : await this.findById(match._id);
      await this.updateMany({ _id: match._id }, { ...update, $setOnInsert: undefined });
      return { found: true, doc: returnNew ? await this.findById(match._id) : before };
    });

    let result = await run();
    if (result.found || !options.upsert) return result.doc || null;

    // Upsert: create the record from the filter's plain values plus $setOnInsert / $set.
    const seed = {};
    for (const [k, v] of Object.entries(filter || {})) if (!k.startsWith('$') && !isOperatorObject(v)) seed[k] = v;
    const insertData = { ...seed, ...(update?.$setOnInsert || {}), ...(update?.$set || {}) };
    for (const [k, v] of Object.entries(update || {})) if (!k.startsWith('$')) insertData[k] = v;
    try {
      const created = new this(insertData);
      await created.save({ validate: false, hooks: false });
      if (update?.$inc) await this.updateMany({ _id: created._id }, { $inc: update.$inc });
      return returnNew ? this.findById(created._id) : null;
    } catch (err) {
      if (!isDuplicateKeyError(err)) throw err;
      result = await run(); // created at the same moment by another request
      return result.doc || null;
    }
  }

  static findByIdAndUpdate(id, update, options = {}) {
    if (id === undefined || id === null) return Promise.resolve(null);
    return this.findOneAndUpdate({ _id: id }, update, options);
  }

  static async deleteMany(filter = {}) {
    const where = compileFilter(this, filter, this.schema.table);
    const result = await query(`DELETE FROM \`${this.schema.table}\` WHERE ${where.sql}`, where.params);
    return { acknowledged: true, deletedCount: result.affectedRows };
  }

  // Replaces a record's child-table list.
  static async writeChildren(parentId, name, items) {
    const child = this.schema.children[name];
    await query(`DELETE FROM \`${child.table}\` WHERE \`${child.foreignKey}\` = ?`, [parentId]);
    if (!items.length) return;
    const columns = [child.foreignKey, 'position', ...child.fields.map((f) => f.column)];
    const rows = items.map((item, position) => [
      parentId,
      position,
      ...child.fields.map((f) => {
        const raw = child.scalar ? (f.path === child.scalar ? item : undefined) : item?.[f.path];
        return toDb(f, castValue(f, raw, this.modelName));
      })
    ]);
    await query(
      `INSERT INTO \`${child.table}\` (${columns.map((c) => `\`${c}\``).join(', ')}) VALUES ?`,
      [rows]
    );
  }

  // ---- Instance methods ----

  get isNew() { return this[STATE].isNew; }

  get(path) { return getPath(this, path); }

  set(pathOrValues, value) {
    if (typeof pathOrValues === 'string') setPath(this, pathOrValues, value);
    else for (const [k, v] of Object.entries(pathOrValues || {})) setPath(this, k, v);
    return this;
  }

  isModified(path) {
    const M = this.constructor;
    const state = this[STATE];
    const fields = path ? M.schema.fields.filter((f) => f.path === path || f.path.startsWith(`${path}.`)) : M.schema.fields;
    if (state.isNew) return fields.some((f) => getPath(this, f.path) !== undefined);
    return fields.some((f) => {
      if (!state.loaded.has(f.path)) return getPath(this, f.path) !== undefined;
      let current;
      try { current = toDb(f, castValue(f, getPath(this, f.path), M.modelName)); } catch { return true; }
      return !sameDbValue(current, state.original.get(f.path));
    });
  }

  // Child list as plain rows (used to detect changes).
  childRows(name) {
    const child = this.constructor.schema.children[name];
    return (this[name] || []).map((item) => {
      if (child.scalar) return idString(item) ?? item;
      const row = {};
      for (const f of child.fields) {
        const v = item?.[f.path];
        row[f.path] = f.type === 'id' ? idString(v) ?? v ?? null : v ?? null;
      }
      return row;
    });
  }

  // Returns a ValidationError, or undefined when the record is valid.
  // Values that cannot be converted are reported first, then the validation rules.
  validateSync() {
    const M = this.constructor;
    const state = this[STATE];
    const castErrors = {};
    const ruleErrors = {};
    const check = (f, path, raw) => {
      let value;
      try {
        value = castValue({ ...f, path }, raw);
      } catch (castErr) {
        castErrors[path] = castErr;
        return;
      }
      const message = checkField({ ...f, path }, value);
      if (message) ruleErrors[path] = { message, path, value, name: 'ValidatorError' };
    };

    for (const f of M.schema.fields) {
      // Fields that were not loaded (e.g. password) are checked only when they have been assigned.
      if (!state.isNew && !state.loaded.has(f.path) && getPath(this, f.path) === undefined) continue;
      check(f, f.path, getPath(this, f.path));
    }
    for (const [name, child] of Object.entries(M.schema.children)) {
      if (!state.isNew && !state.loaded.has(name)) continue;
      (this[name] || []).forEach((item, i) => {
        for (const f of child.fields) {
          if (f.type === 'id' && item && typeof item === 'object' && item[f.path] && typeof item[f.path] === 'object') continue; // populated record
          check(f, `${name}.${i}.${f.path}`, child.scalar ? item : item?.[f.path]);
        }
      });
    }
    const errors = { ...castErrors, ...ruleErrors };
    return Object.keys(errors).length ? new ValidationError(M.modelName, errors) : undefined;
  }

  async validate() {
    const err = this.validateSync();
    if (err) throw err;
  }

  // Stores each loaded field in its cast form (trimmed, lower-cased, numbers as numbers, ...).
  applyCasts() {
    const M = this.constructor;
    const state = this[STATE];
    for (const f of M.schema.fields) {
      if (!state.isNew && !state.loaded.has(f.path) && getPath(this, f.path) === undefined) continue;
      const current = getPath(this, f.path);
      const cast = castValue(f, current, M.modelName);
      if (cast !== current) setPath(this, f.path, cast);
    }
    for (const [name, child] of Object.entries(M.schema.children)) {
      if (!Array.isArray(this[name])) continue;
      if (child.scalar) continue;
      this[name] = this[name].map((item) => {
        const out = { ...child.withDefaults(item) };
        for (const f of child.fields) {
          if (f.type === 'id' && out[f.path] && typeof out[f.path] === 'object') continue; // keep populated records
          const v = castValue(f, out[f.path], M.modelName);
          if (v === undefined) delete out[f.path]; else out[f.path] = v;
        }
        return out;
      });
    }
  }

  // Inserts a new record or writes the changed fields of an existing one.
  // Options for bulk loading trusted data: { validate: false, hooks: false, timestamps: false }.
  async save({ validate = true, hooks = true, timestamps = true } = {}) {
    const M = this.constructor;
    const state = this[STATE];

    if (validate) await this.validate();
    this.applyCasts();
    if (hooks && M.schema.preSave) {
      await M.schema.preSave.call(this);
      this.applyCasts();
    }

    const now = new Date();
    const fieldsToWrite = M.schema.fields.filter((f) => state.isNew || state.loaded.has(f.path) || getPath(this, f.path) !== undefined);

    if (state.isNew) {
      const createdAt = !timestamps && this.createdAt ? castValue(M.timestampFields.createdAt, this.createdAt) : now;
      const updatedAt = !timestamps && this.updatedAt ? castValue(M.timestampFields.updatedAt, this.updatedAt) : createdAt;
      const columns = ['id', ...fieldsToWrite.map((f) => f.column), 'created_at', 'updated_at'];
      const values = [state.id, ...fieldsToWrite.map((f) => toDb(f, getPath(this, f.path))), createdAt, updatedAt];
      const childNames = Object.keys(M.schema.children).filter((n) => (this[n] || []).length);

      const write = async () => {
        await query(
          `INSERT INTO \`${M.schema.table}\` (${columns.map((c) => `\`${c}\``).join(', ')}) VALUES (?)`,
          [values]
        );
        for (const name of childNames) await M.writeChildren(state.id, name, this[name]);
      };
      if (childNames.length) await transaction(write); else await write();

      state.isNew = false;
      this.createdAt = createdAt;
      this.updatedAt = updatedAt;
      state.createdAt = createdAt;
    } else {
      const changed = fieldsToWrite.filter((f) => {
        const v = toDb(f, getPath(this, f.path));
        return !state.loaded.has(f.path) || !sameDbValue(v, state.original.get(f.path));
      });
      const changedChildren = Object.keys(M.schema.children).filter((name) => (
        Array.isArray(this[name]) && JSON.stringify(this.childRows(name)) !== state.originalChildren.get(name)
      ));

      if (changed.length || changedChildren.length) {
        const updatedAt = timestamps ? now : (this.updatedAt || now);
        const write = async () => {
          await query(
            `UPDATE \`${M.schema.table}\` SET ${[...changed.map((f) => `\`${f.column}\` = ?`), '`updated_at` = ?'].join(', ')} WHERE id = ?`,
            [...changed.map((f) => toDb(f, getPath(this, f.path))), updatedAt, state.id]
          );
          for (const name of changedChildren) await M.writeChildren(state.id, name, this[name]);
        };
        if (changedChildren.length) await transaction(write); else await write();
        this.updatedAt = updatedAt;
      }
      // The ID and creation date never change, even if a request body tried to overwrite them.
      this._id = state.id;
      if (state.createdAt) this.createdAt = state.createdAt;
    }

    for (const f of M.schema.fields) {
      if (state.loaded.has(f.path) || getPath(this, f.path) !== undefined) {
        state.loaded.add(f.path);
        state.original.set(f.path, toDb(f, getPath(this, f.path)));
      }
    }
    for (const name of Object.keys(M.schema.children)) {
      if (Array.isArray(this[name])) {
        state.loaded.add(name);
        state.originalChildren.set(name, JSON.stringify(this.childRows(name)));
      }
    }
    return this;
  }

  async deleteOne() {
    const M = this.constructor;
    await query(`DELETE FROM \`${M.schema.table}\` WHERE id = ?`, [this[STATE].id]);
    return { acknowledged: true, deletedCount: 1 };
  }

  async populate(spec, select) {
    await populate(this.constructor, this, spec, select);
    return this;
  }

  // The JSON sent to the storefront and admin panel.
  toJSON() {
    const M = this.constructor;
    const state = this[STATE];
    const out = { _id: this._id };
    const plainValue = (v) => (v && typeof v.toJSON === 'function' && !(v instanceof Date) ? v.toJSON() : v);

    for (const f of M.schema.fields) {
      if (f.select === false) continue;
      if (!state.isNew && !state.loaded.has(f.path)) continue;
      const v = getPath(this, f.path);
      if (v === undefined) continue;
      setPath(out, f.path, v === null ? null : Array.isArray(v) ? [...v] : plainValue(v));
    }
    for (const [name, child] of Object.entries(M.schema.children)) {
      if (!state.isNew && !state.loaded.has(name)) continue;
      out[name] = (this[name] || []).map((item) => {
        if (child.scalar) return plainValue(item);
        const row = {};
        for (const f of child.fields) {
          const v = item?.[f.path];
          if (v !== undefined && v !== null) row[f.path] = plainValue(v);
        }
        return row;
      });
    }
    if (this.createdAt !== undefined) out.createdAt = this.createdAt;
    if (this.updatedAt !== undefined) out.updatedAt = this.updatedAt;
    return out;
  }

  toObject() { return this.toJSON(); }
}

export const modelRegistry = registry;
