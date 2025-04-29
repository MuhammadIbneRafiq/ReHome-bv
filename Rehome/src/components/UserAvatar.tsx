import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "./ui/dropdown-menu";

import { Button } from "./ui/button";
import { User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "./ui/use-toast";
import useUserStore from "@/services/state/useUserSessionStore";

export default function UserAvatar() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const setUser = useUserStore((state) => state.setUser);
    const user = useUserStore((state) => state.user);

    function logout() {
        try {
            // Clear local storage
            localStorage.removeItem("accessToken");
            localStorage.removeItem("token");
            
            // Clear user from store
            setUser(undefined);
            
            // Show success message
            toast({
                title: "Logged out successfully",
                description: "You have been logged out successfully.",
                variant: "default",
            });
            
            // Navigate to login page
            navigate("/login");
        } catch (error) {
            console.error("Failed to logout:", error);
            toast({
                title: "Failed to logout",
                description:
                    "Something went wrong while logging out. Please try again.",
                variant: "destructive",
            });
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    size="icon"
                    className="overflow-hidden rounded-full"
                >
                    <User className="h-5 w-5" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
                <DropdownMenuItem onClick={logout}>Logout</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
