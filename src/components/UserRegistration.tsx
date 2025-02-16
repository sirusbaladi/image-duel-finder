
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface UserRegistrationProps {
  onSubmit: (data: { name: string; gender: string }) => void;
  userId: string;
  deviceType: string;
}

export const UserRegistration = ({ onSubmit, userId, deviceType }: UserRegistrationProps) => {
  const [name, setName] = useState("");
  const [gender, setGender] = useState("");
  const [open, setOpen] = useState(false);

  // Check for existing user data
  useEffect(() => {
    const checkExistingUser = async () => {
      if (!userId) return;

      const { data, error } = await supabase
        .from('user_votes')
        .select('name, vote_count')
        .eq('device_id', userId)
        .single();

      if (data && !error) {
        // If we find existing user data, auto-submit with stored name
        setName(data.name);
        onSubmit({ name: data.name, gender: '' }); // Gender will be asked again if not provided
      }
    };

    checkExistingUser();
  }, [userId, onSubmit]);

  const handleSubmit = async () => {
    if (gender) {
      if (name) {
        try {
          // Try to insert or update user vote record
          const { error } = await supabase
            .from('user_votes')
            .upsert({
              device_id: userId,
              name,
              device_type: deviceType,
              vote_count: 0
            }, {
              onConflict: 'device_id'
            });

          if (error) {
            console.error('Error saving user data:', error);
          }
        } catch (error) {
          console.error('Error in handleSubmit:', error);
        }
      }

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
