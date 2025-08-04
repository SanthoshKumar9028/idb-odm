export const isFunction = (param: unknown): param is Function => {
  return typeof param === 'function';
};
