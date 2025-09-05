const nodemailer = require("nodemailer");
const transporter = nodemailer.createTransport({
	host: process.env.EMAIL_HOST,
	port: process.env.EMAIL_PORT,
	auth: {
		user: process.env.EMAIL_USER,
		pass: process.env.EMAIL_PASS,
	},
});

const emailConfig = async (from, to, subject, body, bodyType) => {
	try {
		await transporter.sendMail({
			from: from || process.env.EMAIL_FROM,
			to: to,
			subject: subject,
			text: bodyType === "text" ? body : undefined,
			html: bodyType === "html" ? body : undefined,
		});
	} catch (error) {
		throw new Error("Failed to send email: " + error.message);
	}
};

// const sendEmail = async (to, templateName, emailData) => {
// 	try {
// 		const emailTemplate = await EmailTemplate.findOne({
// 			name: templateName,
// 		});
// 		const compiledSubject = Handlebars.compile(emailTemplate.subject)(
// 			emailData
// 		);
// 		const compiledBody = Handlebars.compile(emailTemplate.body)(emailData);
// 		await emailConfig(
// 			"Omegle <no-reply@nextleet.com>",
// 			to,
// 			compiledSubject,
// 			compiledBody,
// 			"html"
// 		);
// 	} catch (error) {
// 		console.log("Error sending email:", error.message);
// 	}
// };

const sendCustomEmail = async (to, subject, body) => {
	try {
		await emailConfig(
			"Omegle <no-reply@nextleet.com>",
			to,
			subject,
			body,
			"text"
		);
	} catch (error) {
		console.log("Error sending email:", error.message);
	}
};

module.exports = {
	sendCustomEmail,
};
