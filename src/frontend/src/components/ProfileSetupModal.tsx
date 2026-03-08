import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useSaveCallerUserProfile } from "../hooks/useQueries";

export default function ProfileSetupModal() {
  const [name, setName] = useState("");
  const saveProfile = useSaveCallerUserProfile();

  // Show success message when profile is saved
  useEffect(() => {
    if (saveProfile.isSuccess) {
      toast.success("Welcome to Chain File! Your profile has been created.");
    }
  }, [saveProfile.isSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }

    try {
      await saveProfile.mutateAsync({ name: name.trim() });
    } catch (error) {
      toast.error("Failed to create profile. Please try again.");
      console.error(error);
    }
  };

  return (
    <Dialog open={true}>
      <DialogContent
        className="sm:max-w-md glass-strong"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-display gradient-text-primary">
            Welcome to Chain File
          </DialogTitle>
          <DialogDescription className="text-base">
            Please enter your name to complete your profile setup and start
            managing your documents securely.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="font-semibold">
              Your Name
            </Label>
            <Input
              id="name"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              className="glass"
            />
          </div>
          <Button
            type="submit"
            className="w-full neon-glow-primary font-bold"
            disabled={saveProfile.isPending}
          >
            {saveProfile.isPending ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                Creating Profile...
              </>
            ) : (
              "Continue"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
