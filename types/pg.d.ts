declare module 'pg' {
  export type QueryResultRow = Record<string, unknown>

  export interface FieldDef {
    name: string
  }

  export interface QueryResult<R extends QueryResultRow = QueryResultRow> {
    rowCount: number
    rows: R[]
    fields: FieldDef[]
  }

  export class Pool {
    constructor(config?: {
      connectionString?: string
      max?: number
      idleTimeoutMillis?: number
      connectionTimeoutMillis?: number
      allowExitOnIdle?: boolean
    })
    query<R extends QueryResultRow = QueryResultRow>(
      text: string,
      values?: unknown[],
    ): Promise<QueryResult<R>>
  }
}
