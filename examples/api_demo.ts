import { DateTime } from "luxon";
import { config } from "@dotenvx/dotenvx";
import { SchwabDevClient } from "../src/schwabdev/client.js";
import open from 'open';
import * as readline from "node:readline";
import {isErrorResponse} from "../src/schwabdev/typeChecks";

async function log_account_details(client: SchwabDevClient): Promise<void> {
	let resp = await client.account_linked();

	if (resp && !isErrorResponse(resp) && resp.length >= 1) {
		console.info(`Linked Accounts: ${JSON.stringify(resp)}`);
	} else {  // app might not be "Ready For Use"
		console.error("Could not get linked accounts.");
		console.error("Please make sure that your app status is \"Ready For Use\" and that the app key and app secret are valid.");
		console.error(JSON.stringify(resp));
	}

	return;
}

async function run(): Promise<void> {
	let client: SchwabDevClient;

	config(); // loads environment variables from .env file

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

	console.log('\n\nAccounts and Trading - Accounts.');

	// get account numbers & hashes, this doubles as a checker to make sure that the appKey and appSecret are valid and that the app is ready for use
	await log_account_details(client);

	const linked_accounts = await client.account_linked();

	console.log(`|\n|client.account_linked().json()\n|${JSON.stringify(linked_accounts)}`);
	const account_hash = linked_accounts[0].hashValue;

	console.log(`|\n|client.account_details_all().json()\n|${JSON.stringify(await client.account_details_all())}`);
	console.log(`|\n|client.account_details(account_hash, 'positions').json()\n|${JSON.stringify(await client.account_details(account_hash, "positions"))}`);

	console.log('\n\nAccounts and Trading - Orders.');

	const now = DateTime.utc();
	const past30Days = now.minus({days: 30});

	console.log(`|\n|client.account_orders(account_hash, past30Days, now).json()\n|${JSON.stringify(await client.account_orders(account_hash, past30Days, now))}`);
	console.log(`|\n|client.account_orders_all( past30Days, now).json()\n|${JSON.stringify(await client.account_orders_all(past30Days, now))}`);

	console.log('\n\nAccounts and Trading - Transactions.');

	console.log(`|\n|client.transactions(account_hash, past30Days, now, "TRADE").json()\n|${JSON.stringify(await client.transactions(account_hash, past30Days, now, "TRADE"))}`);

	console.log('\n\nAccounts and Trading - UserPreference.');

	console.log(`|\n|client.preferences().json()\n|${JSON.stringify(await client.preferences())}`);

	console.log('\n\nMarket Data - Quotes.');

	console.log(`|\n|client.quotes(["AAPL","AMD"]).json()\n|${JSON.stringify(await client.quotes(["AAPL", "AMD"]))}`);

	console.log(`|\n|client.quote("INTC").json()\n|${JSON.stringify(await client.quote("INTC"))}`);

	console.log('\n\nMarket Data - Options Expiration Chain.');

	console.log(`|\n|client.option_expiration_chain("AAPL").json()\n|${JSON.stringify(await client.option_expiration_chain("AAPL"))}`);

	console.log('\n\nMarket Data - PriceHistory.');

	console.log(`|\n|client.price_history("AAPL", "year").json()\n|${JSON.stringify(await client.price_history("AAPL", "year"))}`);

	console.log('\n\nMarket Data - Movers.');

	console.log(`|\n|client.movers("$DJI").json()\n|${JSON.stringify(await client.movers("$DJI"))}`);

	console.log('\n\nMarket Data - MarketHours.');

	console.log(`|\n|client.market_hours(["equity","option"]).json()\n|${JSON.stringify(await client.market_hours(["equity", "option"]))}`);
	console.log(`|\n|client.market_hour("equity").json()\n|${JSON.stringify(await client.market_hour("equity"))}`);

	console.log('\n\nMarket Data - Instruments.');

	console.log(`|\n|client.instruments("AAPL", "fundamental").json()\n|${JSON.stringify(await client.instruments("AAPL", "fundamental"))}`);
	console.log(`|\n|client.instrument_cusip("037833100").json()\n|${JSON.stringify(await client.instrument_cusip("037833100"))} `);

	console.log("Welcome to the unofficial Schwab interface!\nGithub: https://github.com/tylerebowers/Schwab-API-Python");
	client.update_tokens_stop();
}

run().then();
