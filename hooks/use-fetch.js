"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";

const useFetch = (cb) => {
  const [data, setData] = useState(undefined);
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState(null);
  const isMounted = useRef(true);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  const fn = useCallback(
    async (...args) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      if (isMounted.current) setLoading(true);
      if (isMounted.current) setError(null);

      try {
        const response = await cb(...args, abortControllerRef.current.signal);
        if (response && typeof response === "object") {
          if (response.success === false) {
            throw new Error(response.error || "An error occurred");
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
        if (err.name === "AbortError") {
          return;
        }
        if (isMounted.current) setError(err);
        toast.error(err.message || "An error occurred");
      } finally {
        if (isMounted.current) setLoading(false);
        abortControllerRef.current = null;
      }
    },
    [cb]
  );

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  return { data, loading, error, fn, setData, abort };
};

export default useFetch;
