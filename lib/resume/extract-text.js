"use client";

import Tesseract from "tesseract.js";
const pdfjsWorkerUrl = "/pdf.worker.min.mjs";

let pdfjsPromise = null;
async function getPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist/legacy/build/pdf").then((pdfjs) => {
    .catch(err => console.error(err))