"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";

const useFetch = (cb) => {
  const [data, setData] = useState(undefined);
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const getErrorMessage = (response) => {
    if (typeof response.error === "string" && response.error) return response.error;
    if (response.errors && typeof response.errors === "object") {
      for (const value of Object.values(response.errors)) {
        if (Array.isArray(value) && value.length > 0 && typeof value[0] === "string") {
          return value[0];
        }
        if (typeof value === "string" && value) return value;
      }
    }
    return null;
  };

  const fn = async (...args) => {
    if (isMounted.current) setLoading(true);
    if (isMounted.current) setError(null);

    try {
      const response = await cb(...args);
      if (response && typeof response === "object") {
        if (response.success === false) {
          throw new Error(getErrorMessage(response) || "An error occurred");
        }
        if (response.error && (response.data === null || response.data === undefined)) {
          throw new Error(response.error);
        }
      }
      if (isMounted.current) {
        setData(response);
        setError(null);
      }
    } catch (err) {
      if (isMounted.current) setError(err);
      toast.error(err.message || "An error occurred");
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  return { data, loading, error, fn, setData };
};

export default useFetch;
