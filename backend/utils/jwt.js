const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

console.log(JWT_SECRET);
const signToken = (payload, expiresIn = "1h") => {
	return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

const verifyToken = (token) => {
	try {
		return jwt.verify(token, JWT_SECRET);
	} catch (err) {
		return null;
	}
};

module.exports = {
	signToken,
	verifyToken,
};
