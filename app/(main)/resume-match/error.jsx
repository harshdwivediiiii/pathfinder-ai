"use client";

import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";

export default function ErrorBoundary({ error, reset }) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4 relative">
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:32px]" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative"
      >
        <div className="absolute -inset-1 bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-2xl blur-xl opacity-50" />
        
        <Card className="glass relative border-red-500/20 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-500" />
          <CardHeader className="space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <div className="text-center space-y-2">
              <CardTitle className="text-2xl font-bold">Analysis Failed</CardTitle>
              <CardDescription className="text-base">
                {process.env.NODE_ENV === "development" ? error.message : "Something went wrong while trying to analyze your resume match."}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex justify-center pb-8">
            <Button 
              onClick={reset}
              className="gap-2 rounded-xl h-12 px-8 font-medium shadow-lg hover:shadow-xl transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
