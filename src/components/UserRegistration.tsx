
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface UserRegistrationProps {
  onSubmit: (data: { name: string; gender: string }) => void;
}

export const UserRegistration = ({ onSubmit }: UserRegistrationProps) => {
  const [name, setName] = useState("");
  const [gender, setGender] = useState("");
  const [open, setOpen] = useState(false);

  const handleSubmit = () => {
    if (name && gender) {
      onSubmit({ name, gender });
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="lg">
          Help Sirus
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl text-center">
            Enter info to appear on the leaderboard.
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <Input
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="text-2xl font-serif text-center"
          />
          <div className="flex justify-center gap-2">
            {["Woman", "Man", "Other"].map((option) => (
              <Button
                key={option}
                variant={gender === option ? "default" : "outline"}
                onClick={() => setGender(option)}
                className="w-28"
              >
                {option}
              </Button>
            ))}
          </div>
          <p className="text-xs text-center text-muted-foreground">
            Gender not displayed on the leaderboard*
          </p>
          <Button
            onClick={handleSubmit}
            disabled={!name || !gender}
            className="w-full"
            variant="outline"
          >
            Begin
          </Button>
          <Button
            variant="ghost"
            className="w-full text-muted-foreground"
            onClick={() => setOpen(false)}
          >
            Skip
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
