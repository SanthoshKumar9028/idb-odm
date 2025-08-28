export const isFunction = (param: unknown): param is Function => {
  return typeof param === 'function';
};

export const isEmptyValue = (param: unknown): param is null | undefined => {
  return param === undefined || param === null;
}

export const isRegExp = (param: unknown): param is RegExp => {
  if (!param?.constructor) return false;
  return (param.constructor.toString()).includes('RegExp()');
}