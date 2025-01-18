import fs from 'node:fs';
import qs from 'node:querystring';
import {DateTime} from "luxon";
import {SchwabDevStream} from "./schwabDevStream";
import {
    Account,
    ErrorResponse,
    InstrumentCusIp,
    MarketHour,
    OptionChain,
    Order,
    OrderRequest, Preferences,
    PriceHistory
} from "./types";

type Params = { [key: string]: any };

/**
 * The 3 tokens required by the Schwab API.
 */
interface TokenDictionary {
    access_token: string;
    refresh_token: string;
    id_token: string;
}

interface TokensFile {
    /**
     * milliseconds since UNIX epoch.
     */
    access_token_issued: number | null

    /**
     * milliseconds since UNIX epoch.
     */
    refresh_token_issued: number | null

    /**
     * The 3 tokens required by the Schwab API.
     */
    token_dictionary: TokenDictionary | null
}

export class SchwabDevClient {
    private readonly _appKey: string;
    private readonly _appSecret: string;
    private readonly _tokensFile: string;
    private readonly verbose: boolean;
    public access_token?: string;
    public refresh_token?: string;
    public id_token?: string;

    /**
     * Datetime of access token issued
     * @private
     */
    private _access_token_issued?: DateTime | null = null;

    /**
     * Datetime of refresh token issued
     * @private
     */
    private _refresh_token_issued: DateTime | null = null;

    /**
     * Access token timeout in seconds (from schwab)
     * @private
     */
    private readonly _access_token_timeout = 1800;

    /**
     * Refresh token timeout in days (from schwab)
     * @private
     */
    private readonly _refresh_token_timeout = 7;

    /**
     * Schwab Base API URL
     * @private
     */
    private readonly _base_api_url = "https://api.schwabapi.com";

    /**
     * Timeout for requests in milliseconds
     * @private
     */
    private readonly timeout: number;

    /**
     * @TODO Implement streamer interface.
     */
    public stream: SchwabDevStream;

    private initialized: Promise<void>;
    private updateTokenTimer: NodeJS.Timeout | undefined;

    /**
     * Update the access token if it has expired.
     * @private
     */
    private _update_refresh_token: () => Promise<void>;

    /**
     * Initialize a client to access the Schwab API.
     *
     * @param appKey string app key credentials
     * @param appSecret string app secret credentials
     * @param authHandler callback function to handle authentication. See examples/api_demo.ts for an example of user interaction.
     * @param tokensFile string path to tokens file
     * @param timeout number request timeout
     * @param verbose boolean print extra information
     */
    constructor(appKey: string, appSecret: string, authHandler: () => Promise<void>, tokensFile: string = 'tokens.json', timeout: number = 10, verbose: boolean = false) {
        if (!appKey || !appSecret || !authHandler || !tokensFile) {
            throw new Error("appKey, appSecret, authHandler, and tokensFile cannot be null.");
        } else if (appKey.length !== 32 || appSecret.length !== 16) {
            throw new Error("App key or app secret invalid length.");
        }

        this._appKey = appKey;
        this._appSecret = appSecret;
        this._update_refresh_token = authHandler;
        this._access_token_timeout = 1800; // in seconds (from schwab)
        this._refresh_token_timeout = 7; // in days (from schwab)
        this._tokensFile = tokensFile;
        this.timeout = timeout * 1000; // Python lib uses seconds. We use milliseconds. Convert here.
        this.stream = new SchwabDevStream(this);
        this.verbose = verbose;

        let tokens: TokensFile = this._read_tokens_file();

        // N.B. this.initialized will store the failed state if the user does not correctly validate the first time.
        this.initialized = this._check_tokens(tokens, tokensFile);
    }

    private async _check_tokens(tokens: TokensFile, tokensFile: string): Promise<void> {
        return new Promise(async (resolve) => {
            if (tokens.refresh_token_issued !== null && tokens.access_token_issued !== null && tokens.token_dictionary !== null) {
                this.access_token = tokens.token_dictionary ? tokens.token_dictionary.access_token : undefined;
                this.refresh_token = tokens.token_dictionary ? tokens.token_dictionary.refresh_token : undefined;
                this.id_token = tokens.token_dictionary ? tokens.token_dictionary.id_token : undefined;
                this._access_token_issued = DateTime.fromMillis(tokens.access_token_issued);
                this._refresh_token_issued = DateTime.fromMillis(tokens.refresh_token_issued);

                if (this.verbose) {
                    // show user when tokens were last updated and when they will expire
                    console.info(`Access Token: issued @ ${this._access_token_issued?.toString()} (expires in ${((this._access_token_timeout - (DateTime.now().toMillis() - (this._access_token_issued ? this._access_token_issued?.toMillis() : 0)) / 1000) / 60).toFixed(0)} minutes)`);
                    console.info(`Refresh Token: issued @ ${this._refresh_token_issued?.toString()} (expires in ${(this._refresh_token_timeout - (DateTime.now().toMillis() - (this._refresh_token_issued ? this._refresh_token_issued?.toMillis() : 0)) / 1000 / 60 / 60 / 24).toFixed(0)} days)`);
                }

                // check if tokens need to be updated and update if needed
                await this.update_tokens();

                // It would make more sense to include this log line in the class constructor(), but it needs to happen after the
                // potential call to account_linked() and that cannot happen there.
                console.info("Initialization Complete");

                resolve();
            } else {
                // The tokens file doesn't exist, so create it.
                console.warn(`Token file does not exist or invalid formatting, creating "${tokensFile}"`);
                fs.writeFileSync(this._tokensFile, '');

                // Process event queue before calling _update_refresh_token(), since it will rely on an instantiated
                // instance of this class.
                setTimeout(() => {
                    // Tokens must be updated.
                    this._update_refresh_token().then(() => {
                        console.info("Initialization Complete");
                        resolve();
                    }).catch((error) => {
                        console.error("Could not update tokens.", error);
                        resolve();
                    })
                }, 1);
            }
        });
    }

    /**
     * Checks if tokens need to be updated and updates if needed (only access token is automatically updated)
     */
    public async update_tokens() {
        if (((DateTime.now().toMillis() - (this._refresh_token_issued ? this._refresh_token_issued?.toMillis() : 0)) / (1000 * 60 * 60 * 24)) >= (this._refresh_token_timeout - 1)) {
            for (let i = 0; i < 3; i++) {
                console.log("The refresh token has expired, please update!");
                await this._update_refresh_token();
            }
        } else if ((((DateTime.now().toMillis() - (this._access_token_issued ? this._access_token_issued?.toMillis() : 0)) / (1000 * 60 * 60 * 24)) >= 1) ||
            (((DateTime.now().toMillis() - (this._access_token_issued ? this._access_token_issued.toMillis() : 0)) / 1000) > (this._access_token_timeout - 61))) {
            if (this.verbose) {
                console.log("The access token has expired, updating automatically.");
            }
            await this._update_access_token();
        }
        // else: console.log("Token check passed");
    }

    public update_tokens_auto(): void {
        this.updateTokenTimer = setInterval((): void => {
            this.update_tokens();
        }, 60000);
    }

    public update_tokens_stop(): void {
        if (this.updateTokenTimer) {
            clearInterval(this.updateTokenTimer);
        }
    }

    /**
     * "refresh" the access token using the refresh token
     */
    private async _update_access_token(): Promise<boolean> {
        await this.initialized;
        let success: boolean = false;
        const oldToken: string | undefined = this.access_token;

        // TODO: Can we return the same promise more than once? We would need to issue a new one after this completes.

        // get the token dictionary (we will need to rewrite the file)
        let old = this._read_tokens_file();

        if (old.token_dictionary) {
            // get new tokens - allow up to 3 attempts
            for (let i = 0; i < 3; i++) {
                let response = await this._post_oauth_token('refresh_token', old.token_dictionary.refresh_token);
                if (response?.ok) {
                    // get and update to the new access token
                    this._access_token_issued = DateTime.now();
                    this._refresh_token_issued = old.refresh_token_issued ? DateTime.fromMillis(old.refresh_token_issued) : DateTime.now();
                    let new_td: TokenDictionary = await response.json();
                    this.access_token = new_td.access_token;
                    this.refresh_token = new_td.refresh_token;
                    this.id_token = new_td.id_token;
                    this._write_tokens_file({
                        access_token_issued: this._access_token_issued.toMillis(),
                        refresh_token_issued: this._refresh_token_issued.toMillis(),
                        token_dictionary: new_td
                    });
                    // show user that we have updated the access token
                    if (this.verbose) {
                        console.info(`Access token updated: ${this._access_token_issued}`);
                    }
                    success = true;
                    break;
                } else {
                    console.error(`Could not get new access token (attempt ${i + 1} of 3).`);
                }
            }
        } else {
            console.error("Could not get new access token (old token dictionary is null).");
            await this._update_refresh_token();

            // Don't expect the end user to keep track of this in their user interactions.
            if (this.access_token && this.access_token !== oldToken) {
                success = true;
            }
        }

        return success;
    }

    public build_refresh_token_url(callbackUrl: string): string {
        return `https://api.schwabapi.com/v1/oauth/authorize?client_id=${this._appKey}&redirect_uri=${callbackUrl}`;
    }

    public parse_refresh_token_response_url(response_url: string, callbackUrl: string): Promise<boolean> {
        const code = `${response_url.slice(response_url.indexOf('code=') + 5, response_url.indexOf('%40'))}@`;  // session = responseURL[responseURL.indexOf("session=")+8:]
        return this.verify_refresh_token(code, callbackUrl);
    }

    /**
     * Takes the Schwab authorization code and verifies it to get the access and refresh tokens.
     *
     * If this fails, here are the things to check:
     * 1. App status is "Ready For Use".
     * 2. App key and app secret are valid.
     * 3. You pasted the whole url within 30 seconds. (it has a quick expiration)
     * @param code
     * @param callbackUrl The callback URL that was used to get the code.
     * @returns boolean True if successful, false if not
     */
    public async verify_refresh_token(code: string, callbackUrl: string): Promise<boolean> {
        const response = await this._post_oauth_token('authorization_code', code, callbackUrl);
        if (response?.ok) {
            // update token file and variables
            this._access_token_issued = this._refresh_token_issued = DateTime.now();
            let new_td: TokenDictionary = await response.json();
            this.access_token = new_td.access_token;
            this.refresh_token = new_td.refresh_token;
            this.id_token = new_td.id_token;
            this._write_tokens_file({
                access_token_issued: this._access_token_issued.toMillis(),
                refresh_token_issued: this._refresh_token_issued.toMillis(),
                token_dictionary: new_td
            });
            return true;
        } else {
            return false;
        }
    }

    public async update_refresh_token(token: string): Promise<boolean> {
        //await this.initialized;

        console.info('TODO: Sending request.');
        const response = await this._post_oauth_token('refresh_token', token);
        if (response?.ok) {
            // update token file and variables
            this._access_token_issued = this._refresh_token_issued = DateTime.now();
            const new_td: TokenDictionary = await response.json();
            this.access_token = new_td.access_token;
            this.refresh_token = new_td.refresh_token;
            this.id_token = new_td.id_token;

            this._write_tokens_file({
                access_token_issued: this._access_token_issued.toMillis(),
                refresh_token_issued: this._refresh_token_issued.toMillis(),
                token_dictionary: new_td
            });

            return true;
        } else {
            console.error("Could not get new refresh and access tokens.", response);
            return false;
        }
    }

    private async _clear_tokens(): Promise<void> {
        this._access_token_issued = null;
        this._refresh_token_issued = null;
        this.access_token = undefined;
        this.refresh_token = undefined;
        this.id_token = undefined;
        this._write_tokens_file({
            access_token_issued: null,
            refresh_token_issued: null,
            token_dictionary: null
        });

        return;
    }

    /**
     * Makes API calls for auth code and refresh tokens
     *
     * @param grant_type
     * @param code
     * @param callbackUrl The callback URL that was used to get the code.
     * @private
     */
    private async _post_oauth_token(grant_type: string, code: string, callbackUrl?: string): Promise<Response | null> {
        let headers = {
            'Authorization': 'Basic '+btoa(this._appKey+':'+this._appSecret),
            'Content-Type': 'application/x-www-form-urlencoded'
        };
        let data: any;
        if (grant_type == 'authorization_code') {  // gets access and refresh tokens using authorization code
            data = {
                'grant_type': 'authorization_code',
                'code': code,
                'redirect_uri': callbackUrl
            };
        } else if (grant_type == 'refresh_token') {  // refreshes the access token
            data = {
                'grant_type': 'refresh_token',
                'refresh_token': code
            };
        } else {
            console.error("Invalid grant type");
            return null;
        }

        /**
         * "The "code" within this request must be URL decoded prior to making the request. For example, this should end
         * in '@' instead of '%40' when used in the request."
         * @link https://developer.schwab.com/products/trader-api--individual/details/documentation/Retail%20Trader%20API%20Production
         */
        const formBody = new URLSearchParams(data).toString(); //.replace('%40', '@');
        return fetch('https://api.schwabapi.com/v1/oauth/token',
            {method: 'POST', headers: headers, body: formBody});
    }

    private _write_tokens_file(tokens: TokensFile): void {
        try {
            const toWrite = {
                "access_token_issued": tokens.access_token_issued,
                "refresh_token_issued": tokens.refresh_token_issued,
                "token_dictionary": tokens.token_dictionary
            }

            const jsonString = JSON.stringify(toWrite, null, 4);
            fs.writeFileSync(this._tokensFile, jsonString);
        } catch (e) {
            console.error(e);
        }
    }

    private _read_tokens_file(): TokensFile {
        try {
            const d = JSON.parse(fs.readFileSync(this._tokensFile, 'utf-8'));
            return {
                access_token_issued: d["access_token_issued"],
                refresh_token_issued: d["refresh_token_issued"],
                token_dictionary: d["token_dictionary"]
            };
        } catch (error) {
            //console.error(error);
            return {
                access_token_issued: null,
                refresh_token_issued: null,
                token_dictionary: null
            };
        }
    }

    /**
     * Removes null values
     * @param params params to remove null values from
     * @return query parameters as a string
     */
    private _params_parser(params: Params): string {
        for (let key in params) {
            if (params[key] === null || params[key] === undefined) delete params[key];
        }

        // Create query string.
        return params && Object.keys(params).length ? '?' + qs.stringify(params) : '';
    }

    /**
     * TODO: Does not take timezones into account.
     *
     * @param dt DateTime object, milliseconds since UNIX epoch, or ISO 8601 string (e.g. 2016-05-25T09:08:34.123)
     * @param form "8601" | "epoch" | "epoch_ms" | "YYYY-MM-DD"
     * @return Time in milliseconds since the UNIX epoch, e.g. 1451624400000
     * @private
     */
    private _time_convert(dt: DateTime | number | string | null | undefined, form: string = "8601"): string | number | null {
        if (dt === null || dt === undefined)
            return null;

        if (typeof dt === 'string') {
            dt = DateTime.fromISO(dt);
        }

        if (typeof dt === 'number') {
            dt = DateTime.fromMillis(dt);
        }

        // dt is a DateTime object
        if (form === "8601") {
            const dt_str = dt.toUTC().toISO();
            return dt_str ?? null;
        } else if (form === "epoch") {
            return Math.floor(dt.toMillis() / 1000);
        } else if (form === "epoch_ms") {
            return dt.toMillis();
        } else if (form === "YYYY-MM-DD") {
            const dt_str = dt.toISO();
            return dt_str ? dt_str.split('T')[0] : null;
        } else {
            return dt.toString();
        }
    }

    /**
     * Convert python list to string or pass though if already a string i.e ["a", "b"] -> "a,b"
     * @param l list to convert
     * @return: converted string or pass through
     */
    private _format_list(l: any[] | string | null | undefined): string | null {
        if (l === null || l === undefined) {
            return null;
        } else if (Array.isArray(l)) {
            return l.join(",");
        } else {
            return l;
        }
    }

    /*********************************
     * Accounts and Trading Production
     ***************************************/

    private async _api_request(endpoint: string, method: string = 'GET', body: unknown | null = null): Promise<unknown | ErrorResponse> {
        return new Promise<unknown>(async (resolve, reject) => {
            if (this.verbose) {
                console.debug('Checking if we are initialized.');
            }
            await this.initialized;

            let resp: Response;
            try {
                if (this.verbose) {
                    console.debug(method, `${this._base_api_url}${endpoint}`);
                }

                const params: RequestInit = {
                    method,
                    headers: {
                        'Authorization': `Bearer ${this.access_token}`,
                        "Accept": "application/json"
                    },
                    signal: AbortSignal.timeout(this.timeout)
                };

                if (body !== null) {
                    params.body = JSON.stringify(body);
                    params.headers = {
                        ...params.headers,
                        'Content-Type': 'application/json'
                    };
                }

                resp = await fetch(`${this._base_api_url}${endpoint}`, params);
            } catch (error) {
                console.error(error);
                return reject(error);
            }

            if (this.verbose) {
                console.debug('Response status:', resp.status);
            }

            // Re-authenticate.
            // TODO: Implement a better way to handle this.
            // TODO: What happens if this expires while the app is open?
            if (resp.status === 401) {
                console.error("Access token is invalid, please update the access token.");
                await this._clear_tokens();
                const success = await this._update_access_token();

                //reject(resp.status);

                // TODO: Can we really do this if the user has to re-authorize our access?
                // TODO: And if this fails?
                if (success) {
                    return resolve(await this._api_request(endpoint, method));
                } else {
                    console.warn('Error: Could not update access token.');
                    return reject(resp.status);
                }
            }

            // TODO: Find a more intuitive way to handle this.
            if (method === 'POST' && resp.status === 201) {
                return resolve({}); // Created.
            }

            if (method === 'DELETE' && resp.status === 200) {
                return resolve({}); // Deleted.
            }

            /**
             * TODO: Account numbers in plain text cannot be used outside of headers or request/response bodies. As the first step consumers must invoke this service to retrieve the list of plain text/encrypted value pairs, and use encrypted account values for all subsequent calls for any accountNumber request.
             * @return All linked account numbers and hashes
             */
            try {
                resolve(await resp.json());
            } catch (error) {
                console.error(error);
                reject(error);
            }
        });
    }

    public account_linked(): Promise<Account[] | ErrorResponse> {
        // TODO: Validate output type.
        return this._api_request('/trader/v1/accounts/accountNumbers') as Promise<Account[]>;
    }

    /**
     * All the linked account information for the user logged in. The balances on these accounts are displayed by default however the positions on these accounts will be displayed based on the "positions" flag.
     * @param fields fields to return (options: "positions")
     * @return details for all linked accounts
     */

    public account_details_all(fields?: string): Promise<unknown | ErrorResponse> {
        return this._api_request(`/trader/v1/accounts/` + this._params_parser({fields}));
    }

    public account_details(accountHash: string, fields?: string): Promise<unknown | ErrorResponse> {
        return this._api_request(`/trader/v1/accounts/${accountHash}` + this._params_parser({fields}));
    }

    public account_orders(accountHash: string, fromEnteredTime: DateTime | number | string, toEnteredTime: DateTime | number | string, maxResults?: number, status?: string): Promise<Order[] | ErrorResponse> {
        const params: Params = {
            'fromEnteredTime': this._time_convert(fromEnteredTime, "8601"),
            'toEnteredTime': this._time_convert(toEnteredTime, "8601")
        };

        if (maxResults !== undefined) {
            params['maxResults'] = maxResults;
        }
        if (status !== undefined) {
            params['status'] = status;
        }

        // "Accept": "application/json",
        return this._api_request(`/trader/v1/accounts/${accountHash}/orders` + this._params_parser(params)) as Promise<Order[]>;
    }

    /**
     * @link https://developer.schwab.com/products/trader-api--individual/details/specifications/Retail%20Trader%20API%20Production
     * @param accountHash
     * @param order
     */
    public async order_place(accountHash: string, order: OrderRequest): Promise<unknown | ErrorResponse> {
        await this.initialized;

        return this._api_request(`/trader/v1/accounts/${accountHash}/orders`, 'POST', order) as Promise<unknown>;
    }

    public async order_details(accountHash: string, orderId: string): Promise<unknown | ErrorResponse> {
        await this.initialized;

        // return fetch(`${this._base_api_url}/trader/v1/accounts/${accountHash}/orders/${orderId}`, {
        //     headers: {'Authorization': `Bearer ${this.access_token}`},
        //     signal: AbortSignal.timeout(this.timeout)
        // })
        // TODO: Validate output type.
        return this._api_request(`/trader/v1/accounts/${accountHash}/orders/${orderId}`) as Promise<unknown>;
    }

    public async order_cancel(accountHash: string, orderId: number): Promise<unknown | ErrorResponse> {
        await this.initialized;

        // TODO: Validate output type.
        return this._api_request(`/trader/v1/accounts/${accountHash}/orders/${orderId}`, 'DELETE') as Promise<unknown>;
    }

    // TODO: Test?
    public async order_replace(accountHash: string, orderId: string, order: any): Promise<Response> {
        await this.initialized;

        return fetch(`${this._base_api_url}/trader/v1/accounts/${accountHash}/orders/${orderId}`, {
            method: 'PUT',
            headers: {
                "Accept": "application/json",
                'Authorization': `Bearer ${this.access_token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(order)
        });
    }

    public account_orders_all(fromEnteredTime: DateTime | number | string, toEnteredTime: DateTime | number | string, maxResults: number | null = null, status: string | null = null): Promise<unknown | ErrorResponse> {
        // "Accept": "application/json",
        return this._api_request(`/trader/v1/orders` + this._params_parser({
            maxResults: maxResults, 'fromEnteredTime': this._time_convert(fromEnteredTime, "8601"),
            'toEnteredTime': this._time_convert(toEnteredTime, "8601"), 'status': status
        }));
    }

    /**
     def order_preview(self, accountHash, orderObject):
     #COMING SOON (waiting on Schwab)
     return requests.post(f'{self._base_api_url}/trader/v1/accounts/{accountHash}/previewOrder',
     headers={'Authorization': f'Bearer {self.access_token}',
     "Content-Type": "application.json"}, data=orderObject)
     */

    public transactions(accountHash: string, startDate: DateTime | number | string, endDate: DateTime | number | string, types: string, symbol?: string): Promise<unknown | ErrorResponse> {
        const params = {
            accountNumber: accountHash,
            startDate: this._time_convert(startDate, "8601"),
            endDate: this._time_convert(endDate, "8601"),
            symbol: symbol,
            types: types
        };

        return this._api_request(`/trader/v1/accounts/${accountHash}/transactions` + this._params_parser(params));
    }

    public transaction_details(accountHash: string, transactionId: number): Promise<unknown | ErrorResponse> {
        let params = {
            accountNumber: accountHash,
            transactionId: transactionId
        };

        return this._api_request(`/trader/v1/accounts/${accountHash}/transactions/${transactionId}` + this._params_parser(params));
    }

    public preferences(): Promise<Preferences | ErrorResponse> {
        return this._api_request(`/trader/v1/userPreference`) as Promise<Preferences>;
    }

    /********************************************************************
     * Market Data
     ********************************************************************/

    /**
     * Get quotes for a list of tickers
     *         :param symbols: list of symbols strings (e.g. "AMD,INTC" or ["AMD", "INTC"])
     *         :type symbols: [str] | str
     *         :param fields: list of fields to get ("all", "quote", "fundamental")
     *         :type fields: list
     *         :param indicative: whether to get indicative quotes (True/False)
     *         :type indicative: boolean
     *         :return: list of quotes
     *         :rtype: request.Response
     * @param symbols
     * @param fields
     * @param indicative
     */
    public quotes(symbols?: string | string[], fields?: string[], indicative: boolean = false): Promise<unknown | ErrorResponse> {
        const requestParams = {
            symbols: this._format_list(symbols),
            fields: fields,
            indicative: indicative
        };

        return this._api_request(`/marketdata/v1/quotes` + this._params_parser(requestParams));
    }

    public quote(symbol_id: string, fields: string[] | null = null): Promise<unknown | ErrorResponse> {
        return this._api_request(`/marketdata/v1/${encodeURIComponent(symbol_id)}/quotes` + this._params_parser({fields}));
    }

    /**
     * Get Option Chain including information on options contracts associated with each expiration for a ticker.
     *         :param symbol: ticker symbol
     *         :type symbol: str
     *         :param contractType: contract type ("CALL"|"PUT"|"ALL")
     *         :type contractType: str
     *         :param strikeCount: strike count
     *         :type strikeCount: int
     *         :param includeUnderlyingQuote: include underlying quote (True|False)
     *         :type includeUnderlyingQuote: boolean
     *         :param strategy: strategy ("SINGLE"|"ANALYTICAL"|"COVERED"|"VERTICAL"|"CALENDAR"|"STRANGLE"|"STRADDLE"|"BUTTERFLY"|"CONDOR"|"DIAGONAL"|"COLLAR"|"ROLL)
     *         :type strategy: str
     *         :param interval: Strike interval
     *         :type interval: str
     *         :param strike: Strike price
     *         :type strike: float
     *         :param range: range ("ITM"|"NTM"|"OTM"...)
     *         :type range: str
     *         :param fromDate: from date
     *         :type fromDate: datetime | str
     *         :param toDate: to date
     *         :type toDate: datetime | str
     *         :param volatility: volatility
     *         :type volatility: float
     *         :param underlyingPrice: underlying price
     *         :type underlyingPrice: float
     *         :param interestRate: interest rate
     *         :type interestRate: float
     *         :param daysToExpiration: days to expiration
     *         :type daysToExpiration: int
     *         :param expMonth: expiration month ("JAN"|"FEB"|"MAR"|"APR"|"MAY"|"JUN"|"JUL"|"AUG"|"SEP"|"OCT"|"NOV"|"DEC"|"ALL")
     *         :type expMonth: str
     *         :param optionType: option type ("CALL"|"PUT")
     *         :type optionType: str
     *         :param entitlement: entitlement ("PN"|"NP"|"PP")
     *         :type entitlement: str
     *         :return: list of option chains
     *         :rtype: request.Response
     * @param symbol
     * @param contractType
     * @param strikeCount
     * @param includeUnderlyingQuote
     * @param strategy
     * @param interval
     * @param strike
     * @param range
     * @param fromDate
     * @param toDate
     * @param volatility
     * @param underlyingPrice
     * @param interestRate
     * @param daysToExpiration
     * @param expMonth
     * @param optionType
     * @param entitlement
     */
    async option_chains(symbol: string, contractType?: string, strikeCount?: number, includeUnderlyingQuote?: boolean, strategy?: string,
                        interval?: string, strike?: number, range?: string, fromDate?: any, toDate?: any, volatility?: number, underlyingPrice?: number,
                        interestRate?: number, daysToExpiration?: number, expMonth?: string, optionType?: string, entitlement?: string): Promise<OptionChain | ErrorResponse> {
        await this.initialized;

        const params = {
            symbol: symbol,
            contractType: contractType,
            strikeCount: strikeCount,
            includeUnderlyingQuote: includeUnderlyingQuote,
            strategy: strategy,
            interval: interval,
            strike: strike,
            range: range,
            fromDate: this._time_convert(fromDate, "YYYY-MM-DD"),
            toDate: this._time_convert(toDate, "YYYY-MM-DD"),
            volatility: volatility,
            underlyingPrice: underlyingPrice,
            interestRate: interestRate,
            daysToExpiration: daysToExpiration,
            expMonth: expMonth,
            optionType: optionType,
            entitlement: entitlement
        };
        // return fetch(`${this._base_api_url}/marketdata/v1/chains` + this._params_parser(params),
        //     {
        //         headers: {'Authorization': `Bearer ${this.access_token}`},
        //         signal: AbortSignal.timeout(this.timeout)
        //     });
        // TODO: Validate output type.
        return this._api_request(`/marketdata/v1/chains` + this._params_parser(params)) as Promise<OptionChain>;
    }

    /**
     * Get an option expiration chain for a ticker
     * @param symbol - ticker symbol
     * @return option expiration chain
     */
    async option_expiration_chain(symbol: string): Promise<unknown | ErrorResponse> {
        return this._api_request(`/marketdata/v1/expirationchain` + this._params_parser({symbol}));
    }

    /**
     * Get price history for a ticker
     *
     * @link https://developer.schwab.com/products/trader-api--individual/details/specifications/Market%20Data%20Production
     *
     * @param symbol The symbol to get price history for
     * @param periodType The type of period to show ("day"|"month"|"year"|"ytd")
     * @param period period to retrieve (day: 1, 2, 3, 4, 5, 10; month: 1, 2, 3, 6; year: 1, 2, 3, 5, 10, 15, 20; ytd: 1)
     * @param frequencyType The type of frequency to show ("minute"|"daily"|"weekly"|"monthly")
     * @param frequency The frequency of data points (minute: 1, 5, 10, 15, 30; daily: 1; weekly: 1; monthly: 1)
     * @param startDate The start date for the price history
     * @param endDate The end date for the price history
     * @param needExtendedHoursData Whether to show extended hours data
     * @param needPreviousClose Whether to show the previous close
     */
    public price_history(symbol: string, periodType: string | null = null, period: number | null = null, frequencyType: string | null = null, frequency: number | null = null, startDate: DateTime | number | string | null = null, endDate: DateTime | number | string | null = null, needExtendedHoursData: boolean | null = null, needPreviousClose: boolean | null = null): Promise<PriceHistory | ErrorResponse> {
        const params = {
            'symbol': symbol,
            'periodType': periodType,
            'period': period,
            'frequencyType': frequencyType,
            'frequency': frequency,
            'startDate': this._time_convert(startDate, 'epoch_ms'),
            'endDate': this._time_convert(endDate, 'epoch_ms'),
            'needExtendedHoursData': needExtendedHoursData,
            'needPreviousClose': needPreviousClose
        };

        // TODO: Validate output type.
        return this._api_request(`/marketdata/v1/pricehistory` + this._params_parser(params)) as Promise<PriceHistory>;
    }

    /**
     * Get movers in a specific index and direction
     * @param symbol symbol ("$DJI"|"$COMPX"|"$SPX"|"NYSE"|"NASDAQ"|"OTCBB"|"INDEX_ALL"|"EQUITY_ALL"|"OPTION_ALL"|"OPTION_PUT"|"OPTION_CALL")
     * @param sort sort ("VOLUME"|"TRADES"|"PERCENT_CHANGE_UP"|"PERCENT_CHANGE_DOWN")
     * @param frequency frequency (0|1|5|10|30|60)
     * @return movers
     */
    public movers(symbol: string, sort?: string, frequency?: number): Promise<unknown | ErrorResponse> {
        const params = {'sort': sort, 'frequency': frequency};

        return this._api_request(`/marketdata/v1/movers/${symbol}` + this._params_parser(params));
    }

    /**
     * Get Market Hours for dates in the future across different markets.
     * @param symbols list of market symbols ("equity", "option", "bond", "future", "forex")
     * @param date date
     * @return market hours
     */
    public market_hours(symbols: string[], date?: DateTime | number | string): Promise<unknown | ErrorResponse> {
        let params: any = {
            'markets': symbols, //this._formatList(symbols),
            'date': this._time_convert(date, 'YYYY-MM-DD')
        };

        return this._api_request(`/marketdata/v1/markets` + this._params_parser(params));
    }

    public market_hour(market_id: string, date?: DateTime | number | string): Promise<MarketHour | ErrorResponse> {
        let dateParam = this._time_convert(date, 'YYYY-MM-DD');

        // TODO: Validate output type.
        return this._api_request(`/marketdata/v1/markets/${market_id}` + this._params_parser({'date': dateParam})) as Promise<MarketHour>;
    }

    // get instruments for a list of symbols
    // {"instruments":[{"fundamental":{"symbol":"AAPL","high52":237.23,"low52":164.075,"dividendAmount":1,"dividendYield":0.44156,"dividendDate":"2024-08-12 00:00:00.0","peRatio":34.62486,"pegRatio":113.73893,"pbRatio":48.06189,"prRatio":8.43929,"pcfRatio":23.01545,"grossMarginTTM":45.962,"grossMarginMRQ":46.2571,"netProfitMarginTTM":26.4406,"netProfitMarginMRQ":25.0043,"operatingMarginTTM":26.4406,"operatingMarginMRQ":25.0043,"returnOnEquity":160.5833,"returnOnAssets":22.6119,"returnOnInvestment":50.98106,"quickRatio":0.79752,"currentRatio":0.95298,"interestCoverage":0,"totalDebtToCapital":51.3034,"ltDebtToEquity":151.8618,"totalDebtToEquity":129.2138,"epsTTM":6.56667,"epsChangePercentTTM":10.3155,"epsChangeYear":0,"epsChange":0,"revChangeYear":-2.8005,"revChangeTTM":0.4349,"revChangeIn":0,"sharesOutstanding":15204137000,"marketCapFloat":0,"marketCap":3443280906390,"bookValuePerShare":4.38227,"shortIntToFloat":0,"shortIntDayToCover":0,"divGrowthRate3Year":0,"dividendPayAmount":0.25,"dividendPayDate":"2024-08-15 00:00:00.0","beta":1.24047,"vol1DayAvg":0,"vol10DayAvg":0,"vol3MonthAvg":0,"avg10DaysVolume":77482187,"avg1DayVolume":59700763,"avg3MonthVolume":56459489,"declarationDate":"2024-08-01 00:00:00.0","dividendFreq":4,"eps":6.13,"dtnVolume":54146023,"nextDividendPayDate":"2024-11-15 00:00:00.0","nextDividendDate":"2024-11-12 00:00:00.0","fundLeverageFactor":0},"cusip":"037833100","symbol":"AAPL","description":"APPLE INC","exchange":"NASDAQ","assetType":"EQUITY"}]}
    public instruments(symbol: string, projection: string): Promise<unknown | ErrorResponse> {
        let params = {
            'symbol': symbol,
            'projection': projection
        }

        return this._api_request(`/marketdata/v1/instruments` + this._params_parser(params));
    }

    /**
     * Get instrument for a single cusip
     * @param cusip_id string customer IP Address(?)
     * @return instrument
     */
    public instrument_cusip(cusip_id: string): Promise<InstrumentCusIp | ErrorResponse> {
        // TODO: Validate output type.
        return this._api_request(`/marketdata/v1/instruments/${cusip_id}`) as Promise<InstrumentCusIp>;
    }
}
