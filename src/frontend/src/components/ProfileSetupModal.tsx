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
        className="sm:max-w-md bg-card border-border shadow-deep"
        onInteractOutside={(e) => e.preventDefault()}
        data-ocid="profile-setup-modal"
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-display font-semibold text-foreground">
            Welcome to Chain File
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Please enter your name to complete your profile setup and start
            managing your documents.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label
              htmlFor="name"
              className="text-sm font-medium text-foreground"
            >
              Your Name
            </Label>
            <Input
              id="name"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              className="border-border bg-input text-foreground placeholder:text-muted-foreground focus-visible:ring-accent/30 focus-visible:border-accent"
              data-ocid="profile-name-input"
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold shadow-elevated"
            disabled={saveProfile.isPending}
            data-ocid="profile-submit-btn"
          >
            {saveProfile.isPending ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent-foreground border-t-transparent mr-2" />
                Creating Profile…
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
