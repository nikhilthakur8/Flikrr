// middlewares/errorHandler.js
function errorHandler(err, req, res, next) {
	// Timestamped, contextual logging
	console.error(
		`[${new Date().toISOString()}] [${req.method} ${req.originalUrl}]`,
		err
	);

	const status = typeof err.status === "number" ? err.status : 500;

	const isProduction = process.env.NODE_ENV === "production";

	const payload = {
		message: isProduction
			? "Internal server error"
			: err.message || "Unknown error",
	};

	if (!isProduction && err.stack) {
		payload.stack = err.stack;
	}

	res.status(status).json(payload);
}

module.exports = errorHandler;
