export interface transactionSchema {
	id			: string;
	userID		: string;
	description : string;
	amount		: number;
	type		: string;
	category	: string;
	frequency	: string;
	date		: Date;
}