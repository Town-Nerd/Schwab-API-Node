import {Account, ErrorResponse, Order} from "./types";

export function isErrorResponse(obj: unknown): obj is ErrorResponse {
	return (!!obj && typeof obj === "object" && "error" in obj && typeof obj["error"] === "string");
}

export function isAccount(obj: unknown): obj is Account {
	return (!!obj && typeof obj === "object" &&
			"accountNumber" in obj && typeof obj["accountNumber"] === "string" &&
			"hashValue" in obj && typeof obj["hashValue"] === "string"
	);
}

export function isAccountArray(obj: unknown): obj is Account[] {
	return Array.isArray(obj) && obj.every(isAccount);
}

export function isOrder(obj: unknown): obj is Order {
	return (!!obj && typeof obj === "object" &&
			// TODO: session
			// TODO: duration
			// TODO: orderType
			(!("cancelTime" in obj) || typeof obj["cancelTime"] === "string") &&
			// TODO: complexOrderStrategyType
			(!("quantity" in obj) || typeof obj["quantity"] === "number") &&
			(!("filledQuantity" in obj) || typeof obj["filledQuantity"] === "number") &&
			(!("remainingQuantity" in obj) || typeof obj["remainingQuantity"] === "number") &&
			(!("destinationLinkName" in obj) || typeof obj["destinationLinkName"] === "string") &&
			(!("releaseTime" in obj) || typeof obj["releaseTime"] === "string") &&
			(!("stopPrice" in obj) || typeof obj["stopPrice"] === "number") &&
			// TODO: stopPriceLinkBasis
			// TODO: stopPriceLinkType
			(!("stopPriceOffset" in obj) || typeof obj["stopPriceOffset"] === "number") &&
			// TODO: stopType
			// TODO: priceLinkBasis
			// TODO: priceLinkType
			(!("price" in obj) || typeof obj["price"] === "number") &&
			// TODO: taxLotMethod
			// TODO: orderLegCollection
			(!("activationPrice" in obj) || typeof obj["activationPrice"] === "number") &&
			// TODO: specialInstruction
			// TODO: orderStrategyType
			(!("orderId" in obj) || typeof obj["orderId"] === "number") &&
			(!("cancelable" in obj) || typeof obj["cancelable"] === "boolean") &&
			(!("editable" in obj) || typeof obj["editable"] === "boolean") &&
			// TODO: status
			(!("enteredTime" in obj) || typeof obj["enteredTime"] === "string") &&
			(!("closeTime" in obj) || typeof obj["closeTime"] === "string") &&
			(!("accountNumber" in obj) || typeof obj["accountNumber"] === "string") &&
			// TODO: orderActivityCollection
			// TODO: replacingOrderCollection
			// TODO: childOrderStrategies
			(!("statusDescription" in obj) || typeof obj["statusDescription"] === "string")
	);
}

export function isOrderArray(obj: unknown): obj is Order[] {
	return Array.isArray(obj) && obj.every(isOrder);
}
