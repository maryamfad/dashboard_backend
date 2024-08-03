import express from "express";
import User from "../models/User.js";
import Order from "../models/Order.js";
import Portfolio from "../models/Portfolio.js";

const router = express.Router();
import { authMiddleware } from "../routes/auth.js";
/**
 * @swagger
 * /trade/buy:
 *   post:
 *     summary: Perform a buy request
 *     security:
 *       - BearerAuth: []
 *     tags:
 *       - Trade
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 example: "669ef955f2d651be269c1921"
 *               stockSymbol:
 *                 type: string
 *                 example: "AAPL"
 *               quantity:
 *                 type: number
 *                 example: 3
 *               purchasePrice:
 *                 type: number
 *                 example: 140
 *               orderType:
 *                 type: string
 *                 example: "market"
 *     responses:
 *       200:
 *         description: Buy request was successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userId:
 *                   type: string
 *                 stockSymbol:
 *                   type: string
 *                 quantity:
 *                   type: number
 *                 totalRevenue:
 *                   type: number
 *                 balance:
 *                   type: number
 *       400:
 *         description: Invalid request
 *
 *
 *
 */
router.post("/buy", authMiddleware, async (req, res) => {
	const { userId, stockSymbol, quantity, purchasePrice, orderType } =
		req.body;

	try {
		const user = await User.findById(userId);

		const totalCost = quantity * purchasePrice;
		if (user.balance >= totalCost) {
			const order = new Order({
				userId,
				stockSymbol,
				tradeType: "buy",
				orderType,
				quantity,
				price: purchasePrice,
				status: "pending",
			});
			user.balance -= totalCost;
			if (orderType === "market") {
				order.status = "executed";
			}
			order.executedAt = new Date();

			let portfolio = await Portfolio.findOne({ userId });
			if (!portfolio) {
				portfolio = new Portfolio({ userId, stocks: [] });
			}

			const existingStock = portfolio.stocks.find(
				(stock) => stock.stockSymbol === stockSymbol
			);
			if (existingStock) {
				existingStock.quantity += quantity;
				existingStock.price =
					((existingStock.quantity - quantity) * existingStock.price +
						totalCost) /
					existingStock.quantity;
			} else {
				portfolio.stocks.push({
					stockSymbol,
					quantity,
					price: purchasePrice,
				});
			}

			await Promise.all([order.save(), user.save(), portfolio.save()]);

			res.json({ user, order, portfolio });
		} else {
			res.status(400).json({ error: "Insufficient funds" });
		}
	} catch (error) {
		res.status(500).json({
			error: "An error occurred while processing the order",
			details: error.message,
		});
	}
});

/**
 * @swagger
 * /trade/sell:
 *   post:
 *     summary: Perform a sell request
 *     security:
 *       - BearerAuth: []
 *     tags:
 *       - Trade
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 example: "669ef955f2d651be269c1921"
 *               stockSymbol:
 *                 type: string
 *                 example: "AAPL"
 *               quantity:
 *                 type: number
 *                 example: 3
 *               sellingPrice:
 *                 type: number
 *                 example: 120
 *     responses:
 *       200:
 *         description: Sell request was successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userId:
 *                   type: string
 *                 stockSymbol:
 *                   type: string
 *                 quantity:
 *                   type: number
 *                 totalRevenue:
 *                   type: number
 *                 balance:
 *                   type: number
 *       400:
 *         description: Invalid request or insufficient stock quantity
 *
 */
router.post("/sell", authMiddleware, async (req, res) => {
	const { userId, stockSymbol, quantity, sellingPrice, orderType } = req.body;

	try {
		const user = await User.findById(userId);
		const portfolio = await Portfolio.findOne({ userId });

		if (!portfolio) {
			return res.status(400).json({ error: "No portfolio found" });
		}

		const existingStock = portfolio.stocks.find(
			(stock) => stock.stockSymbol === stockSymbol
		);

		if (!existingStock || existingStock.quantity < quantity) {
			return res
				.status(400)
				.json({ error: "Insufficient stock quantity" });
		}

		const totalSaleValue = quantity * sellingPrice;

		const order = new Order({
			userId,
			stockSymbol,
			tradeType: "sell",
			orderType,
			quantity,
			price: sellingPrice,
			status: "pending",
		});

		if (orderType === "market") {
			order.status = "executed";
			order.executedAt = new Date();
		}

		user.balance += totalSaleValue;

		if (existingStock.quantity === quantity) {
			portfolio.stocks = portfolio.stocks.filter(
				(stock) => stock.stockSymbol !== stockSymbol
			);
		} else {
			existingStock.quantity -= quantity;
		}

		await Promise.all([order.save(), portfolio.save(), user.save()]);

		res.json({ user, order });
	} catch (error) {
		res.status(500).json({
			error: "An error occurred while processing the sell order",
			details: error.message,
		});
	}
});
// router.post("/sell", authMiddleware, async (req, res) => {
// 	const { userId, stockSymbol, quantity, sellingPrice } = req.body;
// 	const user = await User.findById(userId);
// 	const stock = user.portfolio.find((s) => s.stockSymbol === stockSymbol);
// 	if (stock && stock.quantity >= quantity) {
// 		const totalRevenue = quantity * sellingPrice;
// 		stock.quantity -= quantity;
// 		if (stock.quantity === 0) {
// 			user.portfolio = user.portfolio.filter(
// 				(s) => s.stockSymbol !== stockSymbol
// 			);
// 		}
// 		user.balance += totalRevenue;
// 		await user.save();
// 		res.json(user);
// 	} else {
// 		res.status(400).json({ error: "Insufficient stock quantity" });
// 	}
// });

// module.exports = router;
export default router;
