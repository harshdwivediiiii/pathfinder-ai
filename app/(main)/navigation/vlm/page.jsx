"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2, UploadCloud, MapPin, ArrowRight } from "lucide-react";
import Image from "next/image";

export default function VLMLandmarkNavigation() {
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [instruction, setInstruction] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imagePreview || !instruction) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/navigation/vlm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: imagePreview,
          instruction,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to generate instructions");
      }

      setResult(data.landmarkInstruction);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-4xl py-12 mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 mb-2 flex items-center gap-2">
          <MapPin className="h-8 w-8 text-blue-600" />
          Landmark Navigation
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-lg">
          Upload a street view image and get human-centric navigation directions based on visible landmarks.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white/50 dark:bg-slate-900/50 backdrop-blur">
          <CardHeader>
            <CardTitle>Input Route</CardTitle>
            <CardDescription>
              Provide the junction image and standard direction.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="image">Street View Image</Label>
                <div className="flex items-center justify-center w-full">
                  <label
                    htmlFor="dropzone-file"
                    className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-900 hover:bg-slate-100 border-slate-300 dark:border-slate-700 transition-all overflow-hidden relative"
                  >
                    {imagePreview ? (
                      <div className="relative w-full h-full">
                        <Image
                          src={imagePreview}
                          alt="Street view"
                          layout="fill"
                          objectFit="cover"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <p className="text-white font-medium flex items-center gap-2">
                            <UploadCloud className="w-5 h-5" /> Change Image
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <UploadCloud className="w-8 h-8 mb-3 text-slate-400" />
                        <p className="mb-2 text-sm text-slate-500 dark:text-slate-400">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          PNG, JPG or WEBP (MAX. 5MB)
                        </p>
                      </div>
                    )}
                    <input
                      id="dropzone-file"
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="instruction">Standard Instruction</Label>
                <Input
                  id="instruction"
                  placeholder="e.g. Turn right in 100 meters"
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  className="bg-white dark:bg-slate-950"
                  required
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white" 
                disabled={!imagePreview || !instruction || loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing with VLM...
                  </>
                ) : (
                  <>
                    Generate Landmark Instruction <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white/50 dark:bg-slate-900/50 backdrop-blur h-full flex flex-col">
          <CardHeader>
            <CardTitle>Result</CardTitle>
            <CardDescription>
              Natural language directions.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center">
            {loading ? (
              <div className="flex flex-col items-center justify-center space-y-4 text-slate-500">
                <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
                <p>Analyzing visual context...</p>
              </div>
            ) : error ? (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
                <p className="font-medium">Error</p>
                <p className="text-sm">{error}</p>
              </div>
            ) : result ? (
              <div className="p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                    <MapPin className="h-5 w-5 text-blue-700 dark:text-blue-300" />
                  </div>
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100">Landmark Direction</h3>
                </div>
                <p className="text-lg text-blue-800 dark:text-blue-200 leading-relaxed font-medium">
                  "{result}"
                </p>
              </div>
            ) : (
              <div className="text-center text-slate-400 dark:text-slate-600 py-12">
                <MapPin className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>Upload an image and instruction to see the result here.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
