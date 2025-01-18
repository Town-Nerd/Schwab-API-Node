# Schwab-API-Node
This is an unofficial node library to access the Schwab api.

This is ALPHA software and may not be stable. There may be bugs. Future updates may change class or method signatures.
Use at your own risk.

Pull requests are welcome.

## Features
- [X] Authenticate and access the api
- [X] Refresh access token
- [X] Retrieve account information
- [X] Retrieve quote information
- [X] Stream quote information
- [X] Retrieve option chains
- [X] Place orders
- [X] Retrieve order information
- [X] Cancel orders
- [X] Examples
- [ ] Fully typed (in progress)
- [ ] Fully tested
- [ ] Deploy to NPM

## Installation
Usage currently requires a manual build.

## Quick setup

1. Setup your Schwab developer account [here](https://beta-developer.schwab.com/).
   - Create a new Schwab individual developer app with callback url "https://127.0.0.1" (case sensitive)
   - Wait until the status is "Ready for use", note that "Approved - Pending" will not work.
   - Enable TOS (Thinkorswim) for your Schwab account, it is needed for orders and other api calls.
2. Build the package
   - Run `npm install` to install this package's dependencies
   - Run `npm run build` to build this package
   - Copy `townnerd-schwab-api-node-0.0.1.tgz` to your project directory
3. Install package in your project
   - Run `npm install ./path/to/package/townnerd-schwab-api-node-0.0.1.tgz`
4. Examples on how to use the client are in `examples/api_demo.pts` | `examples/stream_demo.ts` (add your keys in the .env file)
   - The first time you run this, you will have to sign in to your Schwab account using the generated link in the terminal. After signing in, agree to the terms, and select account(s). Then you will have to copy the link in the address bar and paste it into the terminal.

```node
import { SchwabDevClient } from "../src/schwabdev/client.js";

let client: SchwabDevClient;

// See `playground.ts` for an example of a refreshTokenHandler.
client = new SchwabDevClient('Your app key', 'Your app secret', your_refresh_token_handler)

client.update_tokens_auto() //start the auto access token updater

console.log(JSON.stringify(await client.account_linked())); // Make API calls
```

## Notes

The schwabdev folder contains code for main operations:
- `client.ts` contains functions relating to api calls, requests, and automatic token checker threads.
- `schwabDevStream.ts` contains functions for streaming data from websockets.
- `types.ts` contains the data types used in the library.
- `typeChecks.ts` contains helper functions for checking data types.

# Credits
This is a port of the Python [schwabdev](https://github.com/tylerebowers/Schwab-API-Python) library.

## Python YouTube Tutorials
1. [Authentication and Requests](https://www.youtube.com/watch?v=kHbom0KIJwc&ab_channel=TylerBowers) *Github code has significantly changed since this video*
2. [Streaming Real-time Data](https://www.youtube.com/watch?v=t7F2dUecgWc&list=PLs4JLWxBQIxpbvCj__DjAc0RRTlBz-TR8&index=2&ab_channel=TylerBowers)

## Differences from Original
- Typescript/Javascript instead of Python.
- The Typescript code has data types, however imperfect.
- Token refresh code has been externalized so you can choose a different interaction mechanism than the console, if 
  desired. If you want the original Python behavior, simply copy the code for `refreshTokenHandler()`.

# License (MIT)

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
