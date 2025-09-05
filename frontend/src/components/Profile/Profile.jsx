import React from "react";
import {
	Card,
	CardHeader,
	CardTitle,
	CardContent,
	CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Copy, Mail } from "lucide-react";
import { toast } from "sonner";
import { useUserContext } from "../../Context/context";
export const Profile = () => {
	const { user } = useUserContext();
	const { name, email, createdAt, isInvited, isVerified, inviteCode } = user;

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(inviteCode.code);
			toast?.success?.("Invite code copied to clipboard!");
		} catch {
			toast?.error?.("Failed to copy invite code.");
		}
	};

	return (
		<div className="bg-neutral-950 min-h-screen flex items-center justify-center text-white px-4 py-10">
			<Card className="bg-neutral-900/80 backdrop-blur border-neutral-800 text-white w-full max-w-md shadow-2xl">
				<CardHeader className="text-center space-y-2">
					<CardTitle className="text-3xl font-bold tracking-wide">
						{name}
					</CardTitle>
					<p className="text-neutral-400 text-sm">{email}</p>
				</CardHeader>
				<Separator className="bg-neutral-800" />
				<CardContent className="space-y-5 mt-4">
					<div className="flex justify-between items-center">
						<span className="text-neutral-400 text-sm">
							Account Created
						</span>
						<span className="text-neutral-200 text-sm font-medium">
							{new Date(createdAt).toLocaleDateString()}
						</span>
					</div>
					<div className="flex justify-between items-center">
						<span className="text-neutral-400 text-sm">
							Verified
						</span>
						<Badge
							variant={isVerified ? "default" : "destructive"}
							className="px-2"
						>
							{isVerified ? "Yes" : "No"}
						</Badge>
					</div>
					<div className="flex justify-between items-center">
						<span className="text-neutral-400 text-sm">
							Invited
						</span>
						<Badge
							variant={isInvited ? "default" : "secondary"}
							className="px-2"
						>
							{isInvited ? "Yes" : "No"}
						</Badge>
					</div>

					<Separator className="bg-neutral-800" />

					<div className="space-y-2">
						<h3 className="text-neutral-300 text-sm font-semibold">
							Invite Code
						</h3>
						<div className="flex items-center justify-between bg-neutral-800/60 px-3 py-2 shadow-inner">
							<span className="font-mono text-lg tracking-wider">
								{inviteCode.code}
							</span>
							<div className="flex items-center gap-2">
								<Badge
									variant="outline"
									className="text-xs px-2"
								>
									{inviteCode.usedCount}/{inviteCode.maxUsage}{" "}
									used
								</Badge>
								<Button
									variant="ghost"
									size="icon"
									onClick={handleCopy}
									className="hover:bg-neutral-700 "
								>
									<Copy className="w-4 h-4" />
								</Button>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
};
