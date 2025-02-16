
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
    if (gender) {
      onSubmit({ name, gender });
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="lg" 
          className="flex px-[20px] sm:px-[30px] py-[12px] sm:py-[16px] w-[120px] sm:w-[186px] border border-[#00000033] rounded-[10px] bg-gradient-to-t from-[#F5F5F5] to-[#FEFEFE] shadow-sm text-[#00000099] text-[12px] sm:text-[16px] relative z-10 font-['PP Neue Montreal'] font-thin"
        >
          Help Sirus :)
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl text-center font-['PP_Editorial_New']">
            Enter info to appear on the leaderboard.
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <Input
            placeholder="Name (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="text-2xl font-['PP_Editorial_New'] text-center"
          />
          <div className="flex justify-center gap-2">
            {["Woman", "Man", "Other"].map((option) => (
              <Button
                key={option}
                variant={gender === option ? "default" : "outline"}
                onClick={() => setGender(option)}
                className="w-28 font-['PP Neue Montreal'] font-thin"
              >
                {option}
              </Button>
            ))}
          </div>
          <p className="text-xs text-center text-muted-foreground font-['PP Neue Montreal'] font-thin">
            Gender not displayed on the leaderboard*
          </p>
          <Button
            onClick={handleSubmit}
            disabled={!gender}
            className="w-full font-['PP_Editorial_New']"
            variant="outline"
          >
            Begin
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
