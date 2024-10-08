import mongoose from "mongoose";

const watchlistSchema = new mongoose.Schema({
	userId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
		required: true,
	},
	stocks: [
		{
			stockSymbol: { type: String, required: true },
		},
	],
});

const Watchlist = mongoose.model("Watchlist", watchlistSchema);
export default Watchlist;
