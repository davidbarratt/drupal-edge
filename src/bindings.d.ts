export {};

declare global {
  const ENVIRONMENT: string
  const CACHE_TAG: KVNamespace
}

declare module 'tracking-query-params-registry/_data/params.csv' {
  interface ParamData {
    name: string;
  }

  type ParamDataList = ParamData[];

  export default ParamDataList;
}
