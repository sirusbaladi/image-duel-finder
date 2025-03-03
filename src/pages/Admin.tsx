import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ImageRating } from "@/utils/elo";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ImageWithActive extends ImageRating {
  active: boolean;
}

const Admin = () => {
  const queryClient = useQueryClient();

  const { data: images = [], isLoading } = useQuery<ImageWithActive[]>({
    queryKey: ["images"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("images")
        .select("*")
        .order("rating_overall", { ascending: false });

      if (error) {
        toast.error("Failed to load images");
        throw error;
      }

      return data.map((img) => ({
        ...img,
        id: img.id.toString(),
        glicko_rating_overall: img.glicko_rating_overall ?? 1500,
        glicko_rating_male: img.glicko_rating_male ?? 1500,
        glicko_rating_female: img.glicko_rating_female ?? 1500,
        glicko_overall_rd: img.glicko_overall_rd ?? 350,
        glicko_male_rd: img.glicko_male_rd ?? 350,
        glicko_female_rd: img.glicko_female_rd ?? 350,
        active: img.active ?? true,
      }));
    },
  });

  const handleToggleActive = async (imageId: string, currentActive: boolean) => {
    try {
      const { error } = await supabase
        .from("images")
        .update({ active: !currentActive })
        .eq("id", imageId);

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["images"] });
      toast.success("Image status updated");
    } catch (error) {
      console.error("Error updating image status:", error);
      toast.error("Failed to update image status");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Image Management</h1>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {images.map((image) => (
            <div
              key={image.id}
              className="bg-white rounded-lg overflow-hidden shadow-sm"
            >
              <div className="aspect-square relative">
                <img
                  src={image.url}
                  alt={`Image ${image.id}`}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
              <div className="p-2 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">Active Status</span>
                  <Switch
                    checked={image.active}
                    onCheckedChange={() =>
                      handleToggleActive(image.id, image.active)
                    }
                  />
                </div>
                <div className="text-xs text-gray-500">
                  <p>Rating: {Math.round(image.rating_overall)}</p>
                  <p>
                    Comparisons: {image.comparisons_overall}
                    {image.wins_overall !== undefined &&
                      image.losses_overall !== undefined && (
                        <span className="ml-1">
                          ({image.wins_overall}W/{image.losses_overall}L)
                        </span>
                      )}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Admin;