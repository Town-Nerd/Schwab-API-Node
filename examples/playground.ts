import { config } from "@dotenvx/dotenvx";
import * as readline from "readline";
import { SchwabDevClient } from "../src/schwabdev/client.js";

const main = () => {
    let client: SchwabDevClient;
    config(); //load environment variables from .env file

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
    client.update_tokens_auto(); //update tokens automatically (except refresh token)

    //a "terminal emulator" to play with the API
    let history: Array<string> = [];
    console.log("\nTerminal emulator. Sample code: client.price_history('AAPL', 'year')");
    console.log("Enter code to execute:");

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.on('line', async (input: string) => {
        try {
            let result = "";
            if (input === "") {
                console.log(history[history.length - 1]);
                result = await eval(history[history.length - 1]);
                history.push(history[history.length - 1]);
            } else {
                result = await eval(input);
                history.push(input);
            }
            console.log(JSON.stringify(result));
            console.log(" ^^^^[succeeded]^^^^ ");
        } catch (error) {
            console.log(" ^^^^[ERROR]^^^^ ");
            console.log(error);
        }
    });
}

console.log("Welcome to the unofficial Schwab interface!\nGithub: https://github.com/tylerebowers/Schwab-API-Python");
main(); //call the user code above
