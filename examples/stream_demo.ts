import { config } from "@dotenvx/dotenvx";
import {SchwabDevClient} from "../src";
import * as readline from "node:readline";

const main = async (): Promise<void> => {
    let client: SchwabDevClient;

    // place your app key and app secret in the .env file
    config();  // load environment variables from .env file

    /**
     * Get new access and refresh tokens using authorization code.
     */
    const refreshTokenHandler = async function(): Promise<void> {
        // get authorization code (requires user to authorize)
        console.info("Please authorize this program to access your schwab account.");
        const auth_url = client.build_refresh_token_url(process.env.CALLBACK_URL!);
        console.info(`Click to authenticate: ${auth_url}`);
        console.info("Opening browser...");

        /**
         * @link https://stackoverflow.com/a/50890409/850782
         * @param query string Question to ask the user
         */
        function askQuestion(query: string): Promise<string> {
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout,
            });

            return new Promise(resolve => rl.question(query, (ans: string) => {
                rl.close();
                resolve(ans);
            }))
        }

        // This is how the token is retrieved in the Python library. It is implemented here with reservations...
        // - Open the user's browser.
        // - Prompt them to log in and paste the URL back to this library.
        open(auth_url);
        const response_url: string = await askQuestion("After authorizing, wait for it to load (<1min) and paste the WHOLE url here: ");

        // get new access and refresh tokens
        console.info('Thank you! Validating code...');
        const success: boolean = await client.parse_refresh_token_response_url(response_url, process.env.CALLBACK_URL!);

        if (success) {
            console.info("Refresh and Access tokens updated");
        } else {
            console.error("Could not get new refresh and access tokens, check these:\n" +
                "\t1. App status is \"Ready For Use\".\n" +
                "\t2. App key and app secret are valid.\n" +
                "\t3. You pasted the whole url within 30 seconds. (it has a quick expiration)");
        }
    }

    if (!process.env.APP_KEY || !process.env.APP_SECRET || !process.env.CALLBACK_URL) {
        console.error("Please provide APP_KEY, APP_SECRET, and CALLBACK_URL in the .env file.");
        return;
    }

    client = new SchwabDevClient(process.env.APP_KEY, process.env.APP_SECRET, refreshTokenHandler);
    client.update_tokens_auto();  // update tokens automatically (except refresh token)

    /**
     * example of using your own response handler, prints to main terminal.
     *
     * // the first parameter is used by the stream, the additional parameters are passed to the handler
     * function my_handler(message, another_var) {
     *     console.info(another_var + message)
     * }
     * client.stream.start(my_handler, "test")
     */

    // example of using the default response handler
    client.stream.start();

    /*
     * By default, all shortcut requests (below) will be "ADD" commands meaning the list of symbols will be added/appended
     * to current subscriptions for a particular service, however if you want to overwrite subscription (in a particular
     * service) you can use the "SUBS" command. Unsubscribing uses the "UNSUBS" command. To change the list of fields use
     * the "VIEW" command.
     */

    await client.stream.send(await client.stream.level_one_equities("AMD,INTC", "0,1,2,3,4,5,6,7,8"));
    await client.stream.send(await client.stream.level_one_futures("/ES", "0,1,2,3,4,5,6"));

    // stop the stream after 60 seconds (since this is a demo)
    setTimeout(() => {
        client.stream.stop();
        client.update_tokens_stop();
    }, 60 * 1000);
}

console.log("Welcome to the unofficial Schwab interface!\nGithub: https://github.com/tylerebowers/Schwab-API-Python");
main();  // call the user code above
