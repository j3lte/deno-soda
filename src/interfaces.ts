export interface Options {
  /** Strict mode. If enabled, this prevents the Query from changing the dataset ID after it has been set once */
  strict?: boolean;
}

export interface RequesOpts {
  method?: string;
}

export interface ExtraDataFields {
  /** System field */
  ":id"?: string;
  /** System field */
  ":created_at"?: string;
  /** System field */
  ":updated_at"?: string;
}

export interface AuthOpts {
  /**
   * API token
   *
   * The Socrata Open Data API uses application tokens for two purposes:
   * Using an application token allows us to throttle by application, rather than via IP address, which gives you a higher throttling limit
   * Authentication using OAuth
   *
   * Docs: https://dev.socrata.com/docs/app-tokens.html
   */
  apiToken?: string;
  /**
   * Username (needs password) for Basic HTTP Auth
   *
   * Docs: https://dev.socrata.com/docs/authentication.html#authenticating-using-http-basic-authentication
   */
  username?: string;
  /**
   * Password (needs username) for Basic HTTP Auth
   *
   * Docs: https://dev.socrata.com/docs/authentication.html#authenticating-using-http-basic-authentication
   */
  password?: string;
  /**
   * OAuth Access Token
   *
   * Docs: https://dev.socrata.com/docs/authentication.html#using-an-oauth-20-access-token
   */
  accessToken?: string;
}
