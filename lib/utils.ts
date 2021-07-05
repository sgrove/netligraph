export function notEmpty<TValue>(
  value: TValue | null | undefined
): value is TValue {
  return value !== null && value !== undefined
}

export function distinct(array: Array<any>) {
  return array.filter((v, i, a) => a.indexOf(v) === i)
}
