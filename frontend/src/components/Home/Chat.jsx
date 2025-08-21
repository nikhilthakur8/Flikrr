import { SendHorizonalIcon } from "lucide-react";
import React, { useState, useEffect, useRef } from "react";

export const Chat = ({ socket, isConnected }) => {
	const [messages, setMessages] = useState([]);
	const [currentMessage, setCurrentMessage] = useState("");
	const messagesEndRef = useRef(null);

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	};

	useEffect(() => {
		scrollToBottom();
	}, [messages]);

	useEffect(() => {
		if (!socket) return;

		// Listen for incoming messages
		socket.on("receiveMessage", (data) => {
			setMessages((prev) => [
				...prev,
				{
					text: data.message,
					sender: "stranger",
					timestamp: data.timestamp,
				},
			]);
		});

		// Listen for partner disconnection
		socket.on("partnerLeft", () => {
			setMessages((prev) => [
				...prev,
				{
					text: "Stranger has disconnected.",
					sender: "system",
					timestamp: Date.now(),
				},
			]);
		});

		return () => {
			socket.off("receiveMessage");
			socket.off("partnerLeft");
		};
	}, [socket]);

	// Clear messages when connection status changes
	useEffect(() => {
		if (!isConnected) {
			setMessages([]);
		} else {
			setMessages([
				{
					text: "You're now chatting with a random stranger. Say hi!",
					sender: "system",
					timestamp: Date.now(),
				},
			]);
		}
	}, [isConnected]);

	const handleSendMessage = (e) => {
		e.preventDefault();
		if (!currentMessage.trim() || !socket || !isConnected) return;

		// Add message to local state
		setMessages((prev) => [
			...prev,
			{
				text: currentMessage,
				sender: "you",
				timestamp: Date.now(),
			},
		]);

		// Send message to partner
		socket.emit("sendMessage", { message: currentMessage });

		setCurrentMessage("");
	};

	const getMessageStyle = (sender) => {
		switch (sender) {
			case "you":
				return "bg-blue-500 text-white ml-auto max-w-xs";
			case "stranger":
				return "bg-gray-300 text-black mr-auto max-w-xs";
			case "system":
				return "bg-yellow-100 text-gray-700 mx-auto text-center text-sm";
			default:
				return "";
		}
	};

	return (
		<div className="w-full h-full flex flex-col gap-2 rounded-xl bg-gray-100 shadow-inner">
			<div className="flex-1 w-full break-words min-h-0 p-2 md:p-4 rounded-xl overflow-auto flex flex-col gap-2">
				{messages.map((message, index) => (
					<div key={index} className="flex">
						<div
							className={`px-2 md:px-3 py-1 md:py-2 rounded-lg text-xs md:text-sm ${getMessageStyle(
								message.sender
							)}`}
						>
							{message.sender !== "system" && (
								<div className="text-[9px] md:text-[10px] opacity-70 mb-1">
									{message.sender === "you"
										? "You"
										: "Stranger"}
								</div>
							)}
							<div>{message.text}</div>
						</div>
					</div>
				))}
				<div ref={messagesEndRef} />
			</div>
			<form
				className="flex border-t border-gray-300 rounded-b-md overflow-hidden"
				onSubmit={handleSendMessage}
			>
				<input
					type="text"
					placeholder={
						isConnected
							? "Type a message..."
							: "Connect to start chatting..."
					}
					className="flex-grow px-3 md:px-4 py-2 md:py-3 text-sm md:text-base text-gray-800 focus:outline-none disabled:bg-gray-200"
					value={currentMessage}
					onChange={(e) => setCurrentMessage(e.target.value)}
					disabled={!isConnected}
				/>
				<button
					type="submit"
					className="px-4 md:px-6 py-2 md:py-3 text-white font-semibold disabled:opacity-50 active:bg-gray-300 transition-colors"
					disabled={!isConnected || !currentMessage.trim()}
				>
					<SendHorizonalIcon className="text-gray-800 w-4 h-4 md:w-5 md:h-5" />
				</button>
			</form>
		</div>
	);
};
