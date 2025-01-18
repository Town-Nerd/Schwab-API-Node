export enum AccountOptionType {
	VANILLA = "VANILLA",
	BINARY = "BINARY",
	BARRIER = "BARRIER",
	UNKNOWN = "UNKNOWN"
}

export enum ApiCurrencyType {
	USD = "USD",
	CAD = "CAD",
	EUR = "EUR",
	JPY = "JPY"
}

export enum AssetType {
	EQUITY = "EQUITY",
	OPTION = "OPTION",
	INDEX = "INDEX",
	MUTUAL_FUND = "MUTUAL_FUND",
	CASH_EQUIVALENT = "CASH_EQUIVALENT",
	FIXED_INCOME = "FIXED_INCOME",
	CURRENCY = "CURRENCY",
	COLLECTIVE_INVESTMENT = "COLLECTIVE_INVESTMENT"
}

export enum ComplexOrderStrategyType {
	NONE = "NONE",
	COVERED = "COVERED",
	VERTICAL = "VERTICAL",
	BACK_RATIO = "BACK_RATIO",
	CALENDAR = "CALENDAR",
	DIAGONAL = "DIAGONAL",
	STRADDLE = "STRADDLE",
	STRANGLE = "STRANGLE",
	COLLAR_SYNTHETIC = "COLLAR_SYNTHETIC",
	BUTTERFLY = "BUTTERFLY",
	CONDOR = "CONDOR",
	IRON_CONDOR = "IRON_CONDOR",
	VERTICAL_ROLL = "VERTICAL_ROLL",
	COLLAR_WITH_STOCK = "COLLAR_WITH_STOCK",
	DOUBLE_DIAGONAL = "DOUBLE_DIAGONAL",
	UNBALANCED_BUTTERFLY = "UNBALANCED_BUTTERFLY",
	UNBALANCED_CONDOR = "UNBALANCED_CONDOR",
	UNBALANCED_IRON_CONDOR = "UNBALANCED_IRON_CONDOR",
	UNBALANCED_VERTICAL_ROLL = "UNBALANCED_VERTICAL_ROLL",
	MUTUAL_FUND_SWAP = "MUTUAL_FUND_SWAP",
	CUSTOM = "CUSTOM"
}

export enum DivCapGains {
	REINVEST = "REINVEST",
	PAYOUT = "PAYOUT"
}

export enum OrderDuration {
	DAY = "DAY",
	GOOD_TILL_CANCEL = "GOOD_TILL_CANCEL",
	FILL_OR_KILL = "FILL_OR_KILL",
	IMMEDIATE_OR_CANCEL = "IMMEDIATE_OR_CANCEL",
	END_OF_WEEK = "END_OF_WEEK",
	END_OF_MONTH = "END_OF_MONTH",
	NEXT_END_OF_MONTH = "NEXT_END_OF_MONTH",
	UNKNOWN = "UNKNOWN"
}

export enum OrderInstruction {
	BUY = "BUY",
	SELL = "SELL",
	BUY_TO_COVER = "BUY_TO_COVER",
	SELL_SHORT = "SELL_SHORT",
	BUY_TO_OPEN = "BUY_TO_OPEN",
	BUY_TO_CLOSE = "BUY_TO_CLOSE",
	SELL_TO_OPEN = "SELL_TO_OPEN",
	SELL_TO_CLOSE = "SELL_TO_CLOSE",
	EXCHANGE = "EXCHANGE",
	SELL_SHORT_EXEMPT = "SELL_SHORT_EXEMPT"
}

export enum OrderLegType {
	EQUITY = "EQUITY",
	OPTION = "OPTION",
	INDEX = "INDEX",
	MUTUAL_FUND = "MUTUAL_FUND",
	CASH_EQUIVALENT = "CASH_EQUIVALENT",
	FIXED_INCOME = "FIXED_INCOME",
	CURRENCY = "CURRENCY",
	COLLECTIVE_INVESTMENT = "COLLECTIVE_INVESTMENT"
}

export enum OrderType {
	MARKET = "MARKET",
	LIMIT = "LIMIT",
	STOP = "STOP",
	STOP_LIMIT = "STOP_LIMIT",
	TRAILING_STOP = "TRAILING_STOP",
	CABINET = "CABINET",
	NON_MARKETABLE = "NON_MARKETABLE",
	MARKET_ON_CLOSE = "MARKET_ON_CLOSE",
	EXERCISE = "EXERCISE",
	TRAILING_STOP_LIMIT = "TRAILING_STOP_LIMIT",
	NET_DEBIT = "NET_DEBIT",
	NET_CREDIT = "NET_CREDIT",
	NET_ZERO = "NET_ZERO",
	LIMIT_ON_CLOSE = "LIMIT_ON_CLOSE"
}

export enum PositionEffect {
	OPENING = "OPENING",
	CLOSING = "CLOSING",
	AUTOMATIC = "AUTOMATIC"
}

export enum PutCall {
	PUT = "PUT",
	CALL = "CALL",
	UNKNOWN = "UNKNOWN"
}

export enum QuantityType {
	ALL_SHARES = "ALL_SHARES",
	DOLLAR = "DOLLAR",
	SHARES = "SHARES"
}

export enum OrderActivityType {
	EXECUTION = "EXECUTION",
	ORDER_ACTION = "ORDER_ACTION"
}

export enum OrderSession {
	NORMAL = "NORMAL",
	AM = "AM",
	PM = "PM",
	SEAMLESS = "SEAMLESS"
}

export enum OrderStatus {
	AWAITING_PARENT_ORDER = "AWAITING_PARENT_ORDER",
	AWAITING_CONDITION = "AWAITING_CONDITION",
	AWAITING_STOP_CONDITION = "AWAITING_STOP_CONDITION",
	AWAITING_MANUAL_REVIEW = "AWAITING_MANUAL_REVIEW",
	ACCEPTED = "ACCEPTED",
	AWAITING_UR_OUT = "AWAITING_UR_OUT",
	PENDING_ACTIVATION = "PENDING_ACTIVATION",
	QUEUED = "QUEUED",
	WORKING = "WORKING",
	REJECTED = "REJECTED",
	PENDING_CANCEL = "PENDING_CANCEL",
	CANCELED = "CANCELED",
	PENDING_REPLACE = "PENDING_REPLACE",
	REPLACED = "REPLACED",
	FILLED = "FILLED",
	EXPIRED = "EXPIRED",
	NEW = "NEW",
	AWAITING_RELEASE_TIME = "AWAITING_RELEASE_TIME",
	PENDING_ACKNOWLEDGEMENT = "PENDING_ACKNOWLEDGEMENT",
	PENDING_RECALL = "PENDING_RECALL",
	UNKNOWN = "UNKNOWN"
}

export enum OrderStrategyType {
	SINGLE = "SINGLE",
	CANCEL = "CANCEL",
	RECALL = "RECALL",
	PAIR = "PAIR",
	FLATTEN = "FLATTEN",
	TWO_DAY_SWAP = "TWO_DAY_SWAP",
	BLAST_ALL = "BLAST_ALL",
	OCO = "OCO",
	TRIGGER = "TRIGGER"
}

export enum StopType {
	STANDARD = "STANDARD",
	BID = "BID",
	ASK = "ASK",
	LAST = "LAST",
	MARK = "MARK"
}

export enum PriceLinkBasis {
	MANUAL = "MANUAL",
	BASE = "BASE",
	TRIGGER = "TRIGGER",
	LAST = "LAST",
	BID = "BID",
	ASK = "ASK",
	ASK_BID = "ASK_BID",
	MARK = "MARK",
	AVERAGE = "AVERAGE"
}

export enum PriceLinkType {
	VALUE = "VALUE",
	PERCENT = "PERCENT",
	TICK = "TICK"
}

export enum SpecialInstructions {
	ALL_OR_NONE = "ALL_OR_NONE",
	DO_NOT_REDUCE = "DO_NOT_REDUCE",
	ALL_OR_NONE_DO_NOT_REDUCE = "ALL_OR_NONE_DO_NOT_REDUCE"
}

export enum TaxLotMethod {
	FIFO = "FIFO",
	LIFO = "LIFO",
	HIGH_COST = "HIGH_COST",
	LOW_COST = "LOW_COST",
	AVERAGE_COST = "AVERAGE_COST",
	SPECIFIC_LOT = "SPECIFIC_LOT",
	LOSS_HARVESTER = "LOSS_HARVESTER"
}

export interface Account {
	accountNumber: string,
	hashValue: string
}

export interface AccountCashEquivalent {
	assetType: AssetType,
	"cusip"?: string,
	"symbol"?: string,
	"description"?: string,
	"instrumentId"?: number,
	"netChange"?: number,
	"type"?: "SWEEP_VEHICLE" | "SAVINGS" | "MONEY_MARKET_FUND" | "UNKNOWN"
}

export interface AccountEquity {
	assetType: AssetType,
	"cusip"?: string,
	"symbol"?: string,
	"description"?: string,
	"instrumentId"?: number,
	"netChange"?: number,
}

export interface AccountFixedIncome {
	assetType: AssetType,
	"cusip"?: string,
	"symbol"?: string,
	"description"?: string,
	"instrumentId"?: number,
	"netChange"?: number,
	maturityDate?: string,
	factor?: number,
	variableRate?: number
}

export interface AccountMutualFund {
	assetType: AssetType,
	cusip?: string,
	symbol?: string,
	description?: string,
	instrumentId?: number,
	netChange?: number
}

export interface AccountOption {
	assetType: AssetType,
	cusip?: string,
	symbol?: string,
	description?: string,
	instrumentId?: number,
	netChange?: number,
	optionDeliverables?: OptionDeliverable[],
	putCall?: PutCall,
	optionMultiplier?: number,
	type?: AccountOptionType,
	underlyingSymbol?: string
}

export interface Candle {
	open: number,
	high: number,
	low: number,
	close: number,
	volume: number,
	datetime: string
}

export interface CusIp {
	cusip: string,
	symbol: string,
	description: string,
	exchange: string,
	assetType: AssetType,
}

/**
 * TODO: Is this it?
 */
export interface ErrorResponse {
	error: string
}

export interface ExecutionLeg {
	legId?: number,
	price?: number,
	quantity?: number,
	mismarkedQuantity?: number,
	instrumentId?: number,
	time?: string
}

export interface HourBlock {
	start: string,
	end: string
}

export interface InstrumentCusIp {
	instruments: CusIp[];
}

export interface MarketHour {
	equity: {
		EQ: ProductHours
	}
}

export interface OptionChain {
	symbol: string,
	status: string,
	strategy: string,
	interval: number,
	isDelayed: boolean,
	isIndex: boolean,
	interestRate: number,
	underlyingPrice: number,
	volatility: number,
	daysToExpiration: number,
	dividendYield: number,
	numberOfContracts: number,
	assetMainType: string,
	assetSubType: string,
	isChainTruncated: boolean,
	callExpDateMap: {
		[key: string]: {
			[key: string]: OptionQuote[]
		}
	},
	putExpDateMap: {
		[key: string]: {
			[key: string]: OptionQuote[]
		}
	}
}

export interface OptionDeliverable {
	symbol?: string,
	deliverableUnits?: number,
	apiCurrencyType?: ApiCurrencyType,
	assetType?: AssetType,
}

export interface OptionQuote {
	putCall: string,
	symbol: string,
	description: string,
	exchangeName: string,
	bid: number,
	ask: number,
	last: number,
	mark: number,
	bidSize: number,
	askSize: number,
	bidAskSize: string,
	lastSize: number,
	highPrice: number,
	lowPrice: number,
	openPrice: number,
	closePrice: number,
	totalVolume: number,
	tradeTimeInLong: number,
	quoteTimeInLong: number,
	netChange: number,
	volatility: number,
	delta: number,
	gamma: number,
	theta: number,
	vega: number,
	rho: number,
	openInterest: number,
	timeValue: number,
	theoreticalOptionValue: number,
	theoreticalVolatility: number,
	optionDeliverablesList: [
		{
			symbol: string,
			assetType: AssetType,
			deliverableUnits: number
		}
	],
	strikePrice: number,
	expirationDate: string,
	daysToExpiration: number,
	expirationType: string,
	lastTradingDay: number,
	multiplier: number,
	settlementType: string,
	deliverableNote: string,
	percentChange: number,
	markChange: number,
	markPercentChange: number,
	intrinsicValue: number,
	extrinsicValue: number,
	optionRoot: string,
	exerciseType: string,
	"high52Week": number,
	"low52Week": number,
	pennyPilot: boolean,
	inTheMoney: boolean,
	mini: boolean,
	nonStandard: boolean
}

/**
 * TODO: It is time to import the types from Schwab's Swagger interface...
 */
export interface Order {
	session?: OrderSession,
	duration?: OrderDuration,
	orderType?: OrderType,
	cancelTime?: string,
	complexOrderStrategyType?: ComplexOrderStrategyType,
	quantity?: number,
	filledQuantity?: number,
	remainingQuantity?: number,
	destinationLinkName?: string,
	releaseTime?: string,
	stopPrice?: number,
	stopPriceLinkBasis?: PriceLinkBasis,
	stopPriceLinkType?: PriceLinkType | number,
	stopPriceOffset?: number,
	stopType?: StopType,
	priceLinkBasis?: PriceLinkBasis,
	priceLinkType?: PriceLinkType,
	price?: number,
	taxLotMethod?: TaxLotMethod,
	orderLegCollection?: OrderLeg[],
	activationPrice?: number,
	specialInstruction?: SpecialInstructions,
	orderStrategyType?: OrderStrategyType,
	orderId?: number,
	cancelable?: boolean,
	editable?: boolean,
	status?: OrderStatus,
	enteredTime?: string,
	closeTime?: string,
	accountNumber?: number,
	orderActivityCollection?: OrderActivity[],
	replacingOrderCollection?: string[],
	childOrderStrategies?: string[],
	statusDescription?: string
}

export interface OrderActivity {
	activityType: OrderActivityType,
	executionType: "FILL",
	quantity: number,
	orderRemainingQuantity: number,
	executionLegs: ExecutionLeg[]
}

export interface OrderLeg {
	orderLegType?: OrderLegType,
	legId?: number,
	instrument?: AccountCashEquivalent | AccountEquity | AccountFixedIncome | AccountMutualFund | AccountOption,
	instruction?: OrderInstruction,
	positionEffect?: PositionEffect,
	quantity?: number,
	quantityType?: QuantityType,
	divCapGains?: DivCapGains,
	toSymbol?: string
}

export interface OrderRequest {
	session?: OrderSession,
	duration?: OrderDuration,
	orderType?: OrderType,
	cancelTime?: string,
	complexOrderStrategyType?: ComplexOrderStrategyType,
	quantity?: number,
	filledQuantity?: number,
	remainingQuantity?: number,
	destinationLinkName?: string,
	releaseTime?: string,
	stopPrice?: number,
	stopPriceLinkBasis?: PriceLinkBasis,
	stopPriceLinkType?: PriceLinkType | number,
	stopPriceOffset?: number,
	stopType?: StopType,
	priceLinkBasis?: PriceLinkBasis,
	priceLinkType?: PriceLinkType,
	price?: number,
	taxLotMethod?: TaxLotMethod,
	orderLegCollection?: OrderLeg[],
	activationPrice?: number,
	specialInstruction?: SpecialInstructions,
	orderStrategyType: OrderStrategyType,
	orderId?: number,
	cancelable?: boolean,
	editable?: boolean,
	status?: OrderStatus,
	enteredTime?: string,
	closeTime?: string,
	accountNumber?: number,
	orderActivityCollection?: OrderActivity[],
	replacingOrderCollection?: string[],
	childOrderStrategies?: string[],
	statusDescription?: string
}

export interface Preferences {
	accounts: PreferenceAccount[],
	streamerInfo: StreamerInfo[],
	offers: PreferenceOffers[]
}

export interface PreferenceAccount {
	accountNumber: string,
	primaryAccount: boolean,
	type: string, // "BROKERAGE"
	nickName: string,
	displayAcctId: string,
	autoPositionEffect: boolean,
	accountColor: string // "Green"
}

export interface PreferenceOffers {
	level2Permissions: boolean,
	mktDataPermission: string
}

export interface PriceHistory {
	candles: Candle[],
	symbol: string,
	empty: boolean
}

export interface ProductHours {
	date: string,
	marketType: string,
	product: string,
	productName: string,
	isOpen: boolean,
	sessionHours: SessionHours
}

export interface SessionHours {
	preMarket: HourBlock[],
	regularMarket: HourBlock[],
	postMarket: HourBlock[]
}

export interface StreamerInfo {
	streamerSocketUrl: string,
	schwabClientCustomerId: string,
	schwabClientCorrelId: string,
	schwabClientChannel: string,
	schwabClientFunctionId: string
}
