
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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
          className="flex px-[16px] sm:px-[30px] py-[10px] sm:py-[16px] w-[120px] sm:w-[186px] border border-[#00000033] rounded-[10px] bg-gradient-to-t from-[#F5F5F5] to-[#FEFEFE] shadow-sm text-[#00000099] text-[12px] sm:text-[16px] relative z-10 font-['PP Neue Montreal'] font-thin"
        >
          Yes, let's do it :)
        </Button>
      </DialogTrigger>
      <DialogContent className="p-0 w-[90%] max-w-md mx-auto">
        <div className="px-4 py-4 sm:px-6 sm:py-6">
          <div className="space-y-4">
            <div className="font-semibold text-[14px] sm:text-[16px]">
              Enter info to appear on the leaderboard.
            </div>
            <div className="space-y-1">
              <input
                placeholder="Your name (optional)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="placeholder-gray-300 text-[28px] leading-[32px] sm:text-[36px] sm:leading-[40px] font-['PP_Editorial_New'] w-fit rounded-lg outline-none text-gray-600"
                type="text"
              />
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                {["Woman", "Man", "Other"].map((option) => (
                  <button
                    key={option}
                    onClick={() => setGender(option)}
                    className={`w-full py-[3px] text-[14px] sm:text-[16px] font-semibold rounded-[10px] border ${gender === option ? 'border-[#caccff] bg-[#f0f1ff]' : 'bg-gradient-to-t from-[#F5F5F5] to-[#FEFEFE]'} text-gray-900 hover:border-[#caccff] hover:bg-[#f8f9ff] transition-all duration-200`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col justify-between pt-4">
              <button
                onClick={handleSubmit}
                disabled={!gender}
                className={`text-[14px] sm:text-[16px] border rounded-[10px] py-2 sm:py-3 w-full ${!gender ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white hover:border-[#caccff]'}`}
              >
                Begin
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
