/**
 * auth-sls-rest-api
 * To generate a JWT token, go to the <a href=\"https://sso.saml.to/auth/jwt.html\" target=\"_blank\">JWT Token Generator</a>
 *
 * The version of the OpenAPI document: 1.0.2-2
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
import { Configuration } from './configuration';
import { AxiosPromise, AxiosInstance, AxiosRequestConfig } from 'axios';
import { RequestArgs, BaseAPI } from './base';
/**
 *
 * @export
 * @interface AuthSlsRestApiBaseEventGithubLoginTokenEvent1
 */
export interface AuthSlsRestApiBaseEventGithubLoginTokenEvent1 {
    /**
     *
     * @type {number}
     * @memberof AuthSlsRestApiBaseEventGithubLoginTokenEvent1
     */
    'version': AuthSlsRestApiBaseEventGithubLoginTokenEvent1VersionEnum;
    /**
     *
     * @type {string}
     * @memberof AuthSlsRestApiBaseEventGithubLoginTokenEvent1
     */
    'type': AuthSlsRestApiBaseEventGithubLoginTokenEvent1TypeEnum;
}
/**
    * @export
    * @enum {string}
    */
export declare enum AuthSlsRestApiBaseEventGithubLoginTokenEvent1VersionEnum {
    NUMBER_1 = 1
}
/**
    * @export
    * @enum {string}
    */
export declare enum AuthSlsRestApiBaseEventGithubLoginTokenEvent1TypeEnum {
    GithubLoginTokenEvent = "GithubLoginTokenEvent"
}
/**
 *
 * @export
 * @interface AuthSlsRestApiBaseJwtPayload
 */
export interface AuthSlsRestApiBaseJwtPayload {
    /**
     *
     * @type {string}
     * @memberof AuthSlsRestApiBaseJwtPayload
     */
    'jti': string;
    /**
     *
     * @type {number}
     * @memberof AuthSlsRestApiBaseJwtPayload
     */
    'iat': number;
    /**
     *
     * @type {number}
     * @memberof AuthSlsRestApiBaseJwtPayload
     */
    'nbf'?: number;
    /**
     *
     * @type {number}
     * @memberof AuthSlsRestApiBaseJwtPayload
     */
    'exp': number;
    /**
     *
     * @type {string}
     * @memberof AuthSlsRestApiBaseJwtPayload
     */
    'aud': string;
    /**
     *
     * @type {string}
     * @memberof AuthSlsRestApiBaseJwtPayload
     */
    'sub': string;
    /**
     *
     * @type {string}
     * @memberof AuthSlsRestApiBaseJwtPayload
     */
    'iss': string;
}
/**
 *
 * @export
 * @interface AuthSlsRestApiEmailLoginRequest
 */
export interface AuthSlsRestApiEmailLoginRequest {
    /**
     *
     * @type {boolean}
     * @memberof AuthSlsRestApiEmailLoginRequest
     */
    'remember'?: boolean;
    /**
     *
     * @type {string}
     * @memberof AuthSlsRestApiEmailLoginRequest
     */
    'code'?: string;
    /**
     *
     * @type {string}
     * @memberof AuthSlsRestApiEmailLoginRequest
     */
    'email': string;
}
/**
 *
 * @export
 * @interface AuthSlsRestApiEmailLoginRequestAllOf
 */
export interface AuthSlsRestApiEmailLoginRequestAllOf {
    /**
     *
     * @type {string}
     * @memberof AuthSlsRestApiEmailLoginRequestAllOf
     */
    'code'?: string;
    /**
     *
     * @type {string}
     * @memberof AuthSlsRestApiEmailLoginRequestAllOf
     */
    'email': string;
}
/**
 *
 * @export
 * @interface AuthSlsRestApiEmailLoginResponse
 */
export interface AuthSlsRestApiEmailLoginResponse {
    /**
     *
     * @type {AuthSlsRestApiJwt}
     * @memberof AuthSlsRestApiEmailLoginResponse
     */
    'payload'?: AuthSlsRestApiJwt;
    /**
     *
     * @type {string}
     * @memberof AuthSlsRestApiEmailLoginResponse
     */
    'token'?: string;
    /**
     *
     * @type {string}
     * @memberof AuthSlsRestApiEmailLoginResponse
     */
    'verificationSentTo'?: string;
}
/**
 *
 * @export
 * @interface AuthSlsRestApiEmailLoginResponseAllOf
 */
export interface AuthSlsRestApiEmailLoginResponseAllOf {
    /**
     *
     * @type {string}
     * @memberof AuthSlsRestApiEmailLoginResponseAllOf
     */
    'verificationSentTo'?: string;
}
/**
 * This file was automatically generated by joi-to-typescript Do not modify this file manually
 * @export
 * @interface AuthSlsRestApiEncryptedField
 */
export interface AuthSlsRestApiEncryptedField {
    /**
     *
     * @type {string}
     * @memberof AuthSlsRestApiEncryptedField
     */
    'encryptedValue': string;
    /**
     *
     * @type {string}
     * @memberof AuthSlsRestApiEncryptedField
     */
    'keyId': string;
}
/**
 *
 * @export
 * @interface AuthSlsRestApiErrorResponse
 */
export interface AuthSlsRestApiErrorResponse {
    /**
     *
     * @type {string}
     * @memberof AuthSlsRestApiErrorResponse
     */
    'message': string;
    /**
     *
     * @type {string}
     * @memberof AuthSlsRestApiErrorResponse
     */
    'traceId': string;
    /**
     *
     * @type {AuthSlsRestApiErrorResponseTracking}
     * @memberof AuthSlsRestApiErrorResponse
     */
    'tracking': AuthSlsRestApiErrorResponseTracking;
    /**
     *
     * @type {{ [key: string]: any; }}
     * @memberof AuthSlsRestApiErrorResponse
     */
    'context'?: {
        [key: string]: any;
    };
}
/**
 *
 * @export
 * @interface AuthSlsRestApiErrorResponseTracking
 */
export interface AuthSlsRestApiErrorResponseTracking {
    /**
     *
     * @type {string}
     * @memberof AuthSlsRestApiErrorResponseTracking
     */
    'method': string;
    /**
     *
     * @type {string}
     * @memberof AuthSlsRestApiErrorResponseTracking
     */
    'path': string;
    /**
     *
     * @type {string}
     * @memberof AuthSlsRestApiErrorResponseTracking
     */
    'version': string;
}
/**
 *
 * @export
 * @interface AuthSlsRestApiGithubJwtRequest
 */
export interface AuthSlsRestApiGithubJwtRequest {
    /**
     *
     * @type {boolean}
     * @memberof AuthSlsRestApiGithubJwtRequest
     */
    'remember'?: boolean;
    /**
     *
     * @type {string}
     * @memberof AuthSlsRestApiGithubJwtRequest
     */
    'state': string;
    /**
     *
     * @type {string}
     * @memberof AuthSlsRestApiGithubJwtRequest
     */
    'code': string;
}
/**
 *
 * @export
 * @interface AuthSlsRestApiGithubJwtRequestAllOf
 */
export interface AuthSlsRestApiGithubJwtRequestAllOf {
    /**
     *
     * @type {string}
     * @memberof AuthSlsRestApiGithubJwtRequestAllOf
     */
    'state': string;
    /**
     *
     * @type {string}
     * @memberof AuthSlsRestApiGithubJwtRequestAllOf
     */
    'code': string;
}
/**
 *
 * @export
 * @interface AuthSlsRestApiGithubJwtResponse
 */
export interface AuthSlsRestApiGithubJwtResponse {
    /**
     *
     * @type {AuthSlsRestApiJwt}
     * @memberof AuthSlsRestApiGithubJwtResponse
     */
    'payload'?: AuthSlsRestApiJwt;
    /**
     *
     * @type {string}
     * @memberof AuthSlsRestApiGithubJwtResponse
     */
    'token'?: string;
    /**
     *
     * @type {AuthSlsRestApiGithubUserResponse}
     * @memberof AuthSlsRestApiGithubJwtResponse
     */
    'user': AuthSlsRestApiGithubUserResponse;
}
/**
 *
 * @export
 * @interface AuthSlsRestApiGithubJwtResponseAllOf
 */
export interface AuthSlsRestApiGithubJwtResponseAllOf {
    /**
     *
     * @type {AuthSlsRestApiGithubUserResponse}
     * @memberof AuthSlsRestApiGithubJwtResponseAllOf
     */
    'user': AuthSlsRestApiGithubUserResponse;
}
/**
 *
 * @export
 * @interface AuthSlsRestApiGithubLogin
 */
export interface AuthSlsRestApiGithubLogin {
    /**
     *
     * @type {string}
     * @memberof AuthSlsRestApiGithubLogin
     */
    'clientId': string;
    /**
     *
     * @type {string}
     * @memberof AuthSlsRestApiGithubLogin
     */
    'email'?: string;
    /**
     *
     * @type {AuthSlsRestApiEncryptedField}
     * @memberof AuthSlsRestApiGithubLogin
     */
    'encryptedToken'?: AuthSlsRestApiEncryptedField;
    /**
     *
     * @type {number}
     * @memberof AuthSlsRestApiGithubLogin
     */
    'expires'?: number;
    /**
     *
     * @type {string}
     * @memberof AuthSlsRestApiGithubLogin
     */
    'login'?: string;
    /**
     *
     * @type {string}
     * @memberof AuthSlsRestApiGithubLogin
     */
    'oauthRedirectUri': string;
    /**
     *
     * @type {string}
     * @memberof AuthSlsRestApiGithubLogin
     */
    'pk': string;
    /**
     *
     * @type {string}
     * @memberof AuthSlsRestApiGithubLogin
     */
    'redirectUri': string;
    /**
     *
     * @type {boolean}
     * @memberof AuthSlsRestApiGithubLogin
     */
    'remember'?: boolean;
    /**
     *
     * @type {string}
     * @memberof AuthSlsRestApiGithubLogin
     */
    'scope': string;
    /**
     *
     * @type {string}
     * @memberof AuthSlsRestApiGithubLogin
     */
    'sk': string;
    /**
     *
     * @type {string}
     * @memberof AuthSlsRestApiGithubLogin
     */
    'state': string;
}
/**
 *
 * @export
 * @interface AuthSlsRestApiGithubLoginRequest
 */
export interface AuthSlsRestApiGithubLoginRequest {
    /**
     *
     * @type {boolean}
     * @memberof AuthSlsRestApiGithubLoginRequest
     */
    'remember'?: boolean;
    /**
     *
     * @type {string}
     * @memberof AuthSlsRestApiGithubLoginRequest
     */
    'redirectUri': string;
    /**
     *
     * @type {string}
     * @memberof AuthSlsRestApiGithubLoginRequest
     */
    'scope'?: string;
    /**
     *
     * @type {string}
     * @memberof AuthSlsRestApiGithubLoginRequest
     */
    'clientId': string;
}
/**
 *
 * @export
 * @interface AuthSlsRestApiGithubLoginResponse
 */
export interface AuthSlsRestApiGithubLoginResponse {
    /**
     *
     * @type {string}
     * @memberof AuthSlsRestApiGithubLoginResponse
     */
    'expires'?: string;
    /**
     *
     * @type {string}
     * @memberof AuthSlsRestApiGithubLoginResponse
     */
    'oauthRedirectUri'?: string;
    /**
     *
     * @type {string}
     * @memberof AuthSlsRestApiGithubLoginResponse
     */
    'state': string;
    /**
     *
     * @type {string}
     * @memberof AuthSlsRestApiGithubLoginResponse
     */
    'clientId': string;
}
/**
 *
 * @export
 * @interface AuthSlsRestApiGithubLoginTokenEventV1
 */
export interface AuthSlsRestApiGithubLoginTokenEventV1 {
    /**
     *
     * @type {number}
     * @memberof AuthSlsRestApiGithubLoginTokenEventV1
     */
    'version': AuthSlsRestApiGithubLoginTokenEventV1VersionEnum;
    /**
     *
     * @type {string}
     * @memberof AuthSlsRestApiGithubLoginTokenEventV1
     */
    'type': AuthSlsRestApiGithubLoginTokenEventV1TypeEnum;
    /**
     *
     * @type {boolean}
     * @memberof AuthSlsRestApiGithubLoginTokenEventV1
     */
    'deleted'?: boolean;
    /**
     *
     * @type {string}
     * @memberof AuthSlsRestApiGithubLoginTokenEventV1
     */
    'token'?: string;
    /**
     *
     * @type {string}
     * @memberof AuthSlsRestApiGithubLoginTokenEventV1
     */
    'email'?: string;
    /**
     *
     * @type {string}
     * @memberof AuthSlsRestApiGithubLoginTokenEventV1
     */
    'login': string;
}
/**
    * @export
    * @enum {string}
    */
export declare enum AuthSlsRestApiGithubLoginTokenEventV1VersionEnum {
    NUMBER_1 = 1
}
/**
    * @export
    * @enum {string}
    */
export declare enum AuthSlsRestApiGithubLoginTokenEventV1TypeEnum {
    GithubLoginTokenEvent = "GithubLoginTokenEvent"
}
/**
 *
 * @export
 * @interface AuthSlsRestApiGithubLoginTokenEventV1AllOf
 */
export interface AuthSlsRestApiGithubLoginTokenEventV1AllOf {
    /**
     *
     * @type {boolean}
     * @memberof AuthSlsRestApiGithubLoginTokenEventV1AllOf
     */
    'deleted'?: boolean;
    /**
     *
     * @type {string}
     * @memberof AuthSlsRestApiGithubLoginTokenEventV1AllOf
     */
    'token'?: string;
    /**
     *
     * @type {string}
     * @memberof AuthSlsRestApiGithubLoginTokenEventV1AllOf
     */
    'email'?: string;
    /**
     *
     * @type {string}
     * @memberof AuthSlsRestApiGithubLoginTokenEventV1AllOf
     */
    'login': string;
}
/**
 *
 * @export
 * @interface AuthSlsRestApiGithubOauthDetail
 */
export interface AuthSlsRestApiGithubOauthDetail {
    /**
     *
     * @type {string}
     * @memberof AuthSlsRestApiGithubOauthDetail
     */
    'clientId': string;
}
/**
 *
 * @export
 * @interface AuthSlsRestApiGithubUserResponse
 */
export interface AuthSlsRestApiGithubUserResponse {
    /**
     *
     * @type {string}
     * @memberof AuthSlsRestApiGithubUserResponse
     */
    'redirectUri'?: string;
    /**
     *
     * @type {boolean}
     * @memberof AuthSlsRestApiGithubUserResponse
     */
    'remember'?: boolean;
    /**
     *
     * @type {string}
     * @memberof AuthSlsRestApiGithubUserResponse
     */
    'token': string;
    /**
     *
     * @type {string}
     * @memberof AuthSlsRestApiGithubUserResponse
     */
    'avatarUrl'?: string;
    /**
     *
     * @type {string}
     * @memberof AuthSlsRestApiGithubUserResponse
     */
    'email': string;
    /**
     *
     * @type {string}
     * @memberof AuthSlsRestApiGithubUserResponse
     */
    'name'?: string;
    /**
     *
     * @type {string}
     * @memberof AuthSlsRestApiGithubUserResponse
     */
    'login': string;
}
/**
 *
 * @export
 * @interface AuthSlsRestApiHealthResponse
 */
export interface AuthSlsRestApiHealthResponse {
    /**
     *
     * @type {string}
     * @memberof AuthSlsRestApiHealthResponse
     */
    'version': string;
    /**
     *
     * @type {string}
     * @memberof AuthSlsRestApiHealthResponse
     */
    'now': string;
    /**
     *
     * @type {boolean}
     * @memberof AuthSlsRestApiHealthResponse
     */
    'healty': boolean;
    /**
     *
     * @type {string}
     * @memberof AuthSlsRestApiHealthResponse
     */
    'name': string;
}
/**
 *
 * @export
 * @interface AuthSlsRestApiJwk
 */
export interface AuthSlsRestApiJwk {
    /**
     *
     * @type {string}
     * @memberof AuthSlsRestApiJwk
     */
    'kty': AuthSlsRestApiJwkKtyEnum;
    /**
     *
     * @type {string}
     * @memberof AuthSlsRestApiJwk
     */
    'crv': AuthSlsRestApiJwkCrvEnum;
    /**
     *
     * @type {string}
     * @memberof AuthSlsRestApiJwk
     */
    'y': string;
    /**
     *
     * @type {string}
     * @memberof AuthSlsRestApiJwk
     */
    'd'?: string;
}
/**
    * @export
    * @enum {string}
    */
export declare enum AuthSlsRestApiJwkKtyEnum {
    Ec = "EC"
}
/**
    * @export
    * @enum {string}
    */
export declare enum AuthSlsRestApiJwkCrvEnum {
    P256 = "P-256"
}
/**
 *
 * @export
 * @interface AuthSlsRestApiJwksResponse
 */
export interface AuthSlsRestApiJwksResponse {
    /**
     *
     * @type {Array<AuthSlsRestApiJwk>}
     * @memberof AuthSlsRestApiJwksResponse
     */
    'keys': Array<AuthSlsRestApiJwk>;
}
/**
 * This file was automatically generated by joi-to-typescript Do not modify this file manually
 * @export
 * @interface AuthSlsRestApiJwt
 */
export interface AuthSlsRestApiJwt {
    /**
     *
     * @type {string}
     * @memberof AuthSlsRestApiJwt
     */
    'aud': string;
    /**
     *
     * @type {number}
     * @memberof AuthSlsRestApiJwt
     */
    'exp': number;
    /**
     *
     * @type {number}
     * @memberof AuthSlsRestApiJwt
     */
    'expires': number;
    /**
     *
     * @type {number}
     * @memberof AuthSlsRestApiJwt
     */
    'iat': number;
    /**
     *
     * @type {string}
     * @memberof AuthSlsRestApiJwt
     */
    'iss': string;
    /**
     *
     * @type {string}
     * @memberof AuthSlsRestApiJwt
     */
    'jti': string;
    /**
     *
     * @type {number}
     * @memberof AuthSlsRestApiJwt
     */
    'nbf'?: number;
    /**
     *
     * @type {string}
     * @memberof AuthSlsRestApiJwt
     */
    'pk': string;
    /**
     *
     * @type {string}
     * @memberof AuthSlsRestApiJwt
     */
    'scopes': string;
    /**
     *
     * @type {string}
     * @memberof AuthSlsRestApiJwt
     */
    'sk': string;
    /**
     *
     * @type {string}
     * @memberof AuthSlsRestApiJwt
     */
    'sub': string;
}
/**
 *
 * @export
 * @interface AuthSlsRestApiJwtRequest
 */
export interface AuthSlsRestApiJwtRequest {
    /**
     *
     * @type {boolean}
     * @memberof AuthSlsRestApiJwtRequest
     */
    'remember'?: boolean;
}
/**
 *
 * @export
 * @interface AuthSlsRestApiJwtResponse
 */
export interface AuthSlsRestApiJwtResponse {
    /**
     *
     * @type {AuthSlsRestApiJwt}
     * @memberof AuthSlsRestApiJwtResponse
     */
    'payload'?: AuthSlsRestApiJwt;
    /**
     *
     * @type {string}
     * @memberof AuthSlsRestApiJwtResponse
     */
    'token'?: string;
}
/**
 *
 * @export
 * @interface AuthSlsRestApiTokenRequest
 */
export interface AuthSlsRestApiTokenRequest {
    /**
     *
     * @type {string}
     * @memberof AuthSlsRestApiTokenRequest
     */
    'token': string;
}
/**
 * HealthApi - axios parameter creator
 * @export
 */
export declare const HealthApiAxiosParamCreator: (configuration?: Configuration | undefined) => {
    /**
     *
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    get: (options?: AxiosRequestConfig) => Promise<RequestArgs>;
};
/**
 * HealthApi - functional programming interface
 * @export
 */
export declare const HealthApiFp: (configuration?: Configuration | undefined) => {
    /**
     *
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    get(options?: AxiosRequestConfig<any> | undefined): Promise<(axios?: AxiosInstance | undefined, basePath?: string | undefined) => AxiosPromise<AuthSlsRestApiHealthResponse>>;
};
/**
 * HealthApi - factory interface
 * @export
 */
export declare const HealthApiFactory: (configuration?: Configuration | undefined, basePath?: string | undefined, axios?: AxiosInstance | undefined) => {
    /**
     *
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    get(options?: any): AxiosPromise<AuthSlsRestApiHealthResponse>;
};
/**
 * HealthApi - object-oriented interface
 * @export
 * @class HealthApi
 * @extends {BaseAPI}
 */
export declare class HealthApi extends BaseAPI {
    /**
     *
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof HealthApi
     */
    get(options?: AxiosRequestConfig): Promise<import("axios").AxiosResponse<AuthSlsRestApiHealthResponse, any>>;
}
/**
 * JwtApi - axios parameter creator
 * @export
 */
export declare const JwtApiAxiosParamCreator: (configuration?: Configuration | undefined) => {
    /**
     *
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    certs: (options?: AxiosRequestConfig) => Promise<RequestArgs>;
    /**
     *
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    getPayload: (options?: AxiosRequestConfig) => Promise<RequestArgs>;
    /**
     *
     * @param {AuthSlsRestApiTokenRequest} authSlsRestApiTokenRequest
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    refresh: (authSlsRestApiTokenRequest: AuthSlsRestApiTokenRequest, options?: AxiosRequestConfig) => Promise<RequestArgs>;
    /**
     *
     * @param {AuthSlsRestApiTokenRequest} authSlsRestApiTokenRequest
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    verify: (authSlsRestApiTokenRequest: AuthSlsRestApiTokenRequest, options?: AxiosRequestConfig) => Promise<RequestArgs>;
};
/**
 * JwtApi - functional programming interface
 * @export
 */
export declare const JwtApiFp: (configuration?: Configuration | undefined) => {
    /**
     *
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    certs(options?: AxiosRequestConfig<any> | undefined): Promise<(axios?: AxiosInstance | undefined, basePath?: string | undefined) => AxiosPromise<AuthSlsRestApiJwksResponse>>;
    /**
     *
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    getPayload(options?: AxiosRequestConfig<any> | undefined): Promise<(axios?: AxiosInstance | undefined, basePath?: string | undefined) => AxiosPromise<AuthSlsRestApiBaseJwtPayload>>;
    /**
     *
     * @param {AuthSlsRestApiTokenRequest} authSlsRestApiTokenRequest
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    refresh(authSlsRestApiTokenRequest: AuthSlsRestApiTokenRequest, options?: AxiosRequestConfig<any> | undefined): Promise<(axios?: AxiosInstance | undefined, basePath?: string | undefined) => AxiosPromise<AuthSlsRestApiJwtResponse>>;
    /**
     *
     * @param {AuthSlsRestApiTokenRequest} authSlsRestApiTokenRequest
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    verify(authSlsRestApiTokenRequest: AuthSlsRestApiTokenRequest, options?: AxiosRequestConfig<any> | undefined): Promise<(axios?: AxiosInstance | undefined, basePath?: string | undefined) => AxiosPromise<AuthSlsRestApiBaseJwtPayload>>;
};
/**
 * JwtApi - factory interface
 * @export
 */
export declare const JwtApiFactory: (configuration?: Configuration | undefined, basePath?: string | undefined, axios?: AxiosInstance | undefined) => {
    /**
     *
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    certs(options?: any): AxiosPromise<AuthSlsRestApiJwksResponse>;
    /**
     *
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    getPayload(options?: any): AxiosPromise<AuthSlsRestApiBaseJwtPayload>;
    /**
     *
     * @param {AuthSlsRestApiTokenRequest} authSlsRestApiTokenRequest
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    refresh(authSlsRestApiTokenRequest: AuthSlsRestApiTokenRequest, options?: any): AxiosPromise<AuthSlsRestApiJwtResponse>;
    /**
     *
     * @param {AuthSlsRestApiTokenRequest} authSlsRestApiTokenRequest
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    verify(authSlsRestApiTokenRequest: AuthSlsRestApiTokenRequest, options?: any): AxiosPromise<AuthSlsRestApiBaseJwtPayload>;
};
/**
 * JwtApi - object-oriented interface
 * @export
 * @class JwtApi
 * @extends {BaseAPI}
 */
export declare class JwtApi extends BaseAPI {
    /**
     *
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof JwtApi
     */
    certs(options?: AxiosRequestConfig): Promise<import("axios").AxiosResponse<AuthSlsRestApiJwksResponse, any>>;
    /**
     *
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof JwtApi
     */
    getPayload(options?: AxiosRequestConfig): Promise<import("axios").AxiosResponse<AuthSlsRestApiBaseJwtPayload, any>>;
    /**
     *
     * @param {AuthSlsRestApiTokenRequest} authSlsRestApiTokenRequest
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof JwtApi
     */
    refresh(authSlsRestApiTokenRequest: AuthSlsRestApiTokenRequest, options?: AxiosRequestConfig): Promise<import("axios").AxiosResponse<AuthSlsRestApiJwtResponse, any>>;
    /**
     *
     * @param {AuthSlsRestApiTokenRequest} authSlsRestApiTokenRequest
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof JwtApi
     */
    verify(authSlsRestApiTokenRequest: AuthSlsRestApiTokenRequest, options?: AxiosRequestConfig): Promise<import("axios").AxiosResponse<AuthSlsRestApiBaseJwtPayload, any>>;
}
/**
 * JwtEmailApi - axios parameter creator
 * @export
 */
export declare const JwtEmailApiAxiosParamCreator: (configuration?: Configuration | undefined) => {
    /**
     *
     * @param {AuthSlsRestApiEmailLoginRequest} authSlsRestApiEmailLoginRequest
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    loginWithEmail: (authSlsRestApiEmailLoginRequest: AuthSlsRestApiEmailLoginRequest, options?: AxiosRequestConfig) => Promise<RequestArgs>;
};
/**
 * JwtEmailApi - functional programming interface
 * @export
 */
export declare const JwtEmailApiFp: (configuration?: Configuration | undefined) => {
    /**
     *
     * @param {AuthSlsRestApiEmailLoginRequest} authSlsRestApiEmailLoginRequest
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    loginWithEmail(authSlsRestApiEmailLoginRequest: AuthSlsRestApiEmailLoginRequest, options?: AxiosRequestConfig<any> | undefined): Promise<(axios?: AxiosInstance | undefined, basePath?: string | undefined) => AxiosPromise<AuthSlsRestApiJwtResponse>>;
};
/**
 * JwtEmailApi - factory interface
 * @export
 */
export declare const JwtEmailApiFactory: (configuration?: Configuration | undefined, basePath?: string | undefined, axios?: AxiosInstance | undefined) => {
    /**
     *
     * @param {AuthSlsRestApiEmailLoginRequest} authSlsRestApiEmailLoginRequest
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    loginWithEmail(authSlsRestApiEmailLoginRequest: AuthSlsRestApiEmailLoginRequest, options?: any): AxiosPromise<AuthSlsRestApiJwtResponse>;
};
/**
 * JwtEmailApi - object-oriented interface
 * @export
 * @class JwtEmailApi
 * @extends {BaseAPI}
 */
export declare class JwtEmailApi extends BaseAPI {
    /**
     *
     * @param {AuthSlsRestApiEmailLoginRequest} authSlsRestApiEmailLoginRequest
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof JwtEmailApi
     */
    loginWithEmail(authSlsRestApiEmailLoginRequest: AuthSlsRestApiEmailLoginRequest, options?: AxiosRequestConfig): Promise<import("axios").AxiosResponse<AuthSlsRestApiJwtResponse, any>>;
}
/**
 * JwtGithubApi - axios parameter creator
 * @export
 */
export declare const JwtGithubApiAxiosParamCreator: (configuration?: Configuration | undefined) => {
    /**
     *
     * @param {AuthSlsRestApiGithubLoginRequest} authSlsRestApiGithubLoginRequest
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    createLogin: (authSlsRestApiGithubLoginRequest: AuthSlsRestApiGithubLoginRequest, options?: AxiosRequestConfig) => Promise<RequestArgs>;
    /**
     *
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    getAuthenticatedUser: (options?: AxiosRequestConfig) => Promise<RequestArgs>;
    /**
     *
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    getOauthDetail: (options?: AxiosRequestConfig) => Promise<RequestArgs>;
    /**
     *
     * @param {AuthSlsRestApiGithubJwtRequest} authSlsRestApiGithubJwtRequest
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    oauthCallback: (authSlsRestApiGithubJwtRequest: AuthSlsRestApiGithubJwtRequest, options?: AxiosRequestConfig) => Promise<RequestArgs>;
};
/**
 * JwtGithubApi - functional programming interface
 * @export
 */
export declare const JwtGithubApiFp: (configuration?: Configuration | undefined) => {
    /**
     *
     * @param {AuthSlsRestApiGithubLoginRequest} authSlsRestApiGithubLoginRequest
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    createLogin(authSlsRestApiGithubLoginRequest: AuthSlsRestApiGithubLoginRequest, options?: AxiosRequestConfig<any> | undefined): Promise<(axios?: AxiosInstance | undefined, basePath?: string | undefined) => AxiosPromise<AuthSlsRestApiGithubLoginResponse>>;
    /**
     *
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    getAuthenticatedUser(options?: AxiosRequestConfig<any> | undefined): Promise<(axios?: AxiosInstance | undefined, basePath?: string | undefined) => AxiosPromise<AuthSlsRestApiGithubUserResponse>>;
    /**
     *
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    getOauthDetail(options?: AxiosRequestConfig<any> | undefined): Promise<(axios?: AxiosInstance | undefined, basePath?: string | undefined) => AxiosPromise<AuthSlsRestApiGithubOauthDetail>>;
    /**
     *
     * @param {AuthSlsRestApiGithubJwtRequest} authSlsRestApiGithubJwtRequest
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    oauthCallback(authSlsRestApiGithubJwtRequest: AuthSlsRestApiGithubJwtRequest, options?: AxiosRequestConfig<any> | undefined): Promise<(axios?: AxiosInstance | undefined, basePath?: string | undefined) => AxiosPromise<AuthSlsRestApiJwtResponse>>;
};
/**
 * JwtGithubApi - factory interface
 * @export
 */
export declare const JwtGithubApiFactory: (configuration?: Configuration | undefined, basePath?: string | undefined, axios?: AxiosInstance | undefined) => {
    /**
     *
     * @param {AuthSlsRestApiGithubLoginRequest} authSlsRestApiGithubLoginRequest
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    createLogin(authSlsRestApiGithubLoginRequest: AuthSlsRestApiGithubLoginRequest, options?: any): AxiosPromise<AuthSlsRestApiGithubLoginResponse>;
    /**
     *
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    getAuthenticatedUser(options?: any): AxiosPromise<AuthSlsRestApiGithubUserResponse>;
    /**
     *
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    getOauthDetail(options?: any): AxiosPromise<AuthSlsRestApiGithubOauthDetail>;
    /**
     *
     * @param {AuthSlsRestApiGithubJwtRequest} authSlsRestApiGithubJwtRequest
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    oauthCallback(authSlsRestApiGithubJwtRequest: AuthSlsRestApiGithubJwtRequest, options?: any): AxiosPromise<AuthSlsRestApiJwtResponse>;
};
/**
 * JwtGithubApi - object-oriented interface
 * @export
 * @class JwtGithubApi
 * @extends {BaseAPI}
 */
export declare class JwtGithubApi extends BaseAPI {
    /**
     *
     * @param {AuthSlsRestApiGithubLoginRequest} authSlsRestApiGithubLoginRequest
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof JwtGithubApi
     */
    createLogin(authSlsRestApiGithubLoginRequest: AuthSlsRestApiGithubLoginRequest, options?: AxiosRequestConfig): Promise<import("axios").AxiosResponse<AuthSlsRestApiGithubLoginResponse, any>>;
    /**
     *
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof JwtGithubApi
     */
    getAuthenticatedUser(options?: AxiosRequestConfig): Promise<import("axios").AxiosResponse<AuthSlsRestApiGithubUserResponse, any>>;
    /**
     *
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof JwtGithubApi
     */
    getOauthDetail(options?: AxiosRequestConfig): Promise<import("axios").AxiosResponse<AuthSlsRestApiGithubOauthDetail, any>>;
    /**
     *
     * @param {AuthSlsRestApiGithubJwtRequest} authSlsRestApiGithubJwtRequest
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof JwtGithubApi
     */
    oauthCallback(authSlsRestApiGithubJwtRequest: AuthSlsRestApiGithubJwtRequest, options?: AxiosRequestConfig): Promise<import("axios").AxiosResponse<AuthSlsRestApiJwtResponse, any>>;
}
//# sourceMappingURL=api.d.ts.map