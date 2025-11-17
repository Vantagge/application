export function qb<T>(data: T): any {
  const obj: any = {
    _data: data,
    select: (..._args: any[]) => obj,
    eq: (..._args: any[]) => obj,
    in: (..._args: any[]) => obj,
    order: (..._args: any[]) => obj,
    or: (..._args: any[]) => obj,
    not: (..._args: any[]) => obj,
    gte: (..._args: any[]) => obj,
    lte: (..._args: any[]) => obj,
    limit: (..._args: any[]) => obj,
    range: (..._args: any[]) => obj,
    single: async () => data,
    then: (resolve: any) => Promise.resolve(data).then(resolve),
  }
  return obj
}
