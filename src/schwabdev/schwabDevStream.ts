/**
 * # Conversion Notes
 * - Converted from the original Python code by Tyler Bowers (https://github.com/tylerebowers/Schwab-API-Python).
 * - There are bugs in the original code, and this conversion has not been fully tested.
 *
 * # Description
 * This file contains functions to stream data.
 */

import {SchwabDevClient} from './client';
import WebSocket from 'ws';
import {DateTime} from "luxon";
import {StreamerInfo} from "./types";

interface BasicRequest {
    service: string,
    command: string,
    requestid: number,
    SchwabClientCustomerId: string,
    SchwabClientCorrelId: string,
    // JSON data structure.
    parameters?: unknown
}

export class SchwabDevStream {
    _websocket: WebSocket | null;
    _streamer_info: StreamerInfo | null;
    _start_timestamp: DateTime | null;
    _requestId: number;
    _queue: BasicRequest[];
    active: boolean;
    _client: SchwabDevClient;

    /**
     * Initialize the stream object to stream data from Schwab Streamer
     *
     * @param client
     */
    constructor(client: SchwabDevClient) {
        this._websocket = null;
        this._streamer_info = null;
        this._start_timestamp = null;
        this._requestId = 0; // a counter for the request id
        this._queue = []; // a queue of requests to be sent
        this.active = false;
        this._client = client; // so we can get streamer info
    }

    /**
     * Start the streamer
     *
     * @param receiver_func - function to call when data is received (default is console.info)
     * @private
     */
    private async _start_streamer(receiver_func = console.info) {
        // Get streamer info
        const response = await this._client.preferences();
        if ('streamerInfo' in response) {
            this._streamer_info = response.streamerInfo ? response.streamerInfo[0] : null;
        }

        // Register exit handler to stop the stream
        process.on('exit', () => {
            this.stop();
        });

        // Start the stream
        const streamer_loop = async () => {
            try {
                if (!this._streamer_info) {
                    console.error("Could not get streamerInfo");
                    return;
                }

                this._start_timestamp = DateTime.now();
                console.info(`Connecting to streaming server -> `);
                this._websocket = new WebSocket(this._streamer_info.streamerSocketUrl);

                this._websocket.on('close', (code: number) => {
                    this.active = false;
                    if (code === 1000) {
                        console.info("Stream has closed.");
                        return;
                    } else if (this._start_timestamp && (Date.now() - this._start_timestamp.toMillis()) < 60 * 1000) {
                        console.info('Error: ', code);
                        console.error("Stream not alive for more than 1 minute, exiting...");
                        return;
                    } else {
                        console.info('Error: ', code);
                        console.warn("Connection lost to server, reconnecting...");

                        // Try to reconnect after 1 second.
                        setTimeout(streamer_loop, 1000);
                    }
                });

                this._websocket.on('open', async () => {
                    if (!this._client.access_token) {
                        console.error("Access token not found.");
                        return;
                    }

                    /**
                     * N.B. We use `this._websocket!.` and `this._streamer_info!.` in this callback because we know that
                     * this._websocket can not possibly be null. Consider this to be technical debt for future changes.
                     * - this._websocket is only set to null in the class constructor.
                     * - this._websocket receives a value before this callback is configured.
                     */
                    console.info("Connected.");
                    let login_payload: BasicRequest = <BasicRequest>await this.basic_request('ADMIn', 'LOGIN', {
                        Authorization: this._client.access_token,
                        SchwabClientChannel: this._streamer_info!.schwabClientChannel,
                        SchwabClientFunctionId: this._streamer_info!.schwabClientFunctionId
                    });

                    this._websocket!.on('message', (data: Buffer) => {
                        // Convert the buffer to a string, then call the receiver function.
                        receiver_func(String(data));

                        // Send queued requests
                        // TODO: Is it necessary to receive the LOGIN response before we send these queued requests?
                        // TODO: send logout request at exit (when the program closes)
                        // TODO: resend requests if the stream crashes
                        while (this._queue.length) {
                            this._websocket!.send(JSON.stringify(this._queue.shift()));
                        }
                    });

                    // Send login request
                    this._websocket!.send(JSON.stringify(login_payload));
                    this.active = true;
                })
            } catch (e) {
                console.error(e);
                console.error("Error starting streamer.");
                return;
            }
        }

        streamer_loop();
    }

    /**
     * Start the stream
     *
     * @param receiver - function to call when data is received (default is console.info)
     */
    start(receiver = console.info) {
        this._start_streamer(receiver).then(() => {
        });
    }

    /**
     * Start the stream automatically at market open and close
     *
     * N.B. This function uses hard-coded hours instead of using the market hours from the API.
     *
     * @param afterHours - include after-market hours trading
     * @param preHours - include pre-market hours trading
     */
    startAutomatic(afterHours: boolean = false, preHours: boolean = false) {

        let start: Date = new Date();
        start.setHours(9, 29, 0); // Market opens at 9:30 AM

        let end: Date = new Date();
        end.setHours(16, 0, 0); // Market closes at 4:00 PM

        if (preHours) {
            start.setHours(7, 59, 0);
        }
        if (afterHours) {
            end.setHours(20, 0, 0);
        }

        let checker = () => {
            let now: Date = new Date();
            let inHours: boolean = (now.getTime() >= start.getTime() && now.getTime() <= end.getTime()) && (now.getDay() >= 0 && now.getDay() <= 4);

            if (inHours && !this.active) {
                this.start();
            } else if (!inHours && this.active) {
                console.info("Stopping Stream.");
                this.stop();
            }

            setTimeout(checker, 60 * 1000);
        };

        checker();

        if (!(new Date().getTime() >= start.getTime() && new Date().getTime() <= end.getTime())) {
            console.info("Stream was started outside of active hours and will launch when in hours.");
        }
    }

    /**
     * Send a request to the stream
     *
     * @param requests list of requests or a single request
     * @return request list | request | null
     */
    async send(requests: BasicRequest[] | BasicRequest | null) {
        if (requests === null) {
            return;
        }

        if (!Array.isArray(requests)) {
            requests = [requests];
        }

        if (this.active && this._websocket) {
            this._websocket.send(JSON.stringify({"requests": requests}));
        } else {
            console.warn("Stream is not active, request queued.");
            this._queue.push(...requests);
        }
    }

    /**
     * Stop the stream
     *
     * @TODO: Upstream: Fix this (wont properly close)
     */
    async stop() {
        this._requestId += 1;
        if (this._streamer_info) {
            await this.send({
                service: "ADMIN",
                command: "LOGOUT",
                requestid: this._requestId,
                SchwabClientCustomerId: this._streamer_info.schwabClientCustomerId,
                SchwabClientCorrelId: this._streamer_info.schwabClientCorrelId
            });
        }
        this.active = false;
    }

    /**
     * Create a basic request (all requests follow this format)
     *
     * @param service service to use
     * @param command command to use ("SUBS"|"ADD"|"UNSUBS"|"VIEW"|"LOGIN"|"LOGOUT")
     * @param parameters parameters to use
     * @return request
     */
    async basic_request(service: string, command: string, parameters?: any): Promise<BasicRequest | null> {
        if (this._streamer_info === null) {
            const response = await this._client.preferences();
            if ('streamerInfo' in response) {
                this._streamer_info = response.streamerInfo[0];
            }
        }

        if (this._streamer_info !== null) {
            let request: BasicRequest = {
                service: service.toUpperCase(),
                command: command.toUpperCase(),
                requestid: this._requestId,
                SchwabClientCustomerId: this._streamer_info.schwabClientCustomerId,
                SchwabClientCorrelId: this._streamer_info.schwabClientCorrelId,
                parameters: parameters
            };
            console.info('Sending: ', JSON.stringify(request));
            this._requestId += 1;
            return request;
        } else {
            console.error("Could not use/get streamerInfo");
            return null;
        }
    }

    /**
     * Convert a list to a string (e.g. [1, "B", 3] -> "1,B,3"), or passthrough if already a string
     *
     * @param ls list to convert
     * @return converted string
     */
    static _list_to_string(ls: string | string[]): string {
        if (typeof ls === 'string') return ls;
        else if (Array.isArray(ls)) return ls.join(',');
        else return '';
    }

    async level_one_equities(keys: any, fields: any, command: string = "ADD") {
        return await this.basic_request("LEVELONE_EQUITIES", command, {
            "keys": SchwabDevStream._list_to_string(keys),
            "fields": SchwabDevStream._list_to_string(fields)
        });
    }

    async level_one_options(keys: any, fields: any, command: string = "ADD") {
        return await this.basic_request("LEVELONE_OPTIONS", command, {
            "keys": SchwabDevStream._list_to_string(keys),
            "fields": SchwabDevStream._list_to_string(fields)
        });
    }

    async level_one_futures(keys: any, fields: any, command: string = "ADD") {
        return await this.basic_request("LEVELONE_FUTURES", command, {
            "keys": SchwabDevStream._list_to_string(keys),
            "fields": SchwabDevStream._list_to_string(fields)
        });
    }

    async level_one_futures_options(keys: any, fields: any, command: string = "ADD") {
        return await this.basic_request("LEVELONE_FUTURES_OPTIONS", command, {
            "keys": SchwabDevStream._list_to_string(keys),
            "fields": SchwabDevStream._list_to_string(fields)
        });
    }

    async level_one_forex(keys: any, fields: any, command: string = "ADD") {
        return await this.basic_request("LEVELONE_FOREX", command, {
            "keys": SchwabDevStream._list_to_string(keys),
            "fields": SchwabDevStream._list_to_string(fields)
        });
    }

    async nyse_book(keys: any, fields: any, command: string = "ADD") {
        return await this.basic_request("NYSE_BOOK", command, {
            "keys": SchwabDevStream._list_to_string(keys),
            "fields": SchwabDevStream._list_to_string(fields)
        });
    }

    async nasdaq_book(keys: any, fields: any, command: string = "ADD") {
        return await this.basic_request("NASDAQ_BOOK", command, {
            "keys": SchwabDevStream._list_to_string(keys),
            "fields": SchwabDevStream._list_to_string(fields)
        });
    }

    async options_book(keys: any, fields: any, command: string = "ADD") {
        return await this.basic_request("OPTIONS_BOOK", command, {
            "keys": SchwabDevStream._list_to_string(keys),
            "fields": SchwabDevStream._list_to_string(fields)
        });
    }

    async chart_equity(keys: any, fields: any, command: string = "ADD") {
        return await this.basic_request("CHART_EQUITY", command, {
            "keys": SchwabDevStream._list_to_string(keys),
            "fields": SchwabDevStream._list_to_string(fields)
        });
    }

    async chart_futures(keys: any, fields: any, command: string = "ADD") {
        return await this.basic_request("CHART_FUTURES", command, {
            "keys": SchwabDevStream._list_to_string(keys),
            "fields": SchwabDevStream._list_to_string(fields)
        });
    }

    async screener_equity(keys: any, fields: any, command: string = "ADD") {
        return await this.basic_request("SCREENER_EQUITY", command, {
            "keys": SchwabDevStream._list_to_string(keys),
            "fields": SchwabDevStream._list_to_string(fields)
        });
    }

    async screener_option(keys: any, fields: any, command: string = "ADD") {
        return await this.basic_request("SCREENER_OPTION", command, {
            "keys": SchwabDevStream._list_to_string(keys),
            "fields": SchwabDevStream._list_to_string(fields)
        });
    }

    async account_activity(keys: string = "Account Activity", fields: string = "0,1,2,3", command: string = "SUBS") {  // can only use SUBS or UNSUBS
        return await this.basic_request("ACCT_ACTIVITY", command, {
            "keys": SchwabDevStream._list_to_string(keys),
            "fields": SchwabDevStream._list_to_string(fields)
        });
    }
}
