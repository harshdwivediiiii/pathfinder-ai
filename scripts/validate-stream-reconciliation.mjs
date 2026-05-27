import assert from "node:assert/strict";

function toChunks(input, sizes) {
  const chunks = [];
  let cursor = 0;

  for (const size of sizes) {
    if (cursor >= input.length) break;
    chunks.push(input.slice(cursor, cursor + size));
    cursor += size;
  }

  if (cursor < input.length) {
    chunks.push(input.slice(cursor));
  }

  return chunks;
}

function encodeEvent(event, payload) {
  return `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
}

function parseEventBlock(block) {
  const lines = block.split(/\r?\n/);
  let event = "message";
  const dataLines = [];

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (!line || line.startsWith(":")) continue;

    if (line.startsWith("event:")) {
      event = line.slice(6).trim() || "message";
      continue;
    }

    if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trimStart());
    }
  }

  return { event, data: dataLines.join("\n") };
}

function reconcileStream(chunks) {
  const state = {
    buffer: "",
    streamText: "",
    finalText: "",
    messages: [],
    done: false,
    errored: false,
    errorMessage: "",
  };

  for (const chunk of chunks) {
    if (state.done || state.errored) break;

    state.buffer += chunk;

    while (true) {
      const separatorIndex = state.buffer.search(/\r?\n\r?\n/);
      if (separatorIndex === -1) break;

      const separator = state.buffer.slice(separatorIndex).match(/^\r?\n\r?\n/);
      const separatorLength = separator ? separator[0].length : 2;
      const rawEvent = state.buffer.slice(0, separatorIndex);
      state.buffer = state.buffer.slice(separatorIndex + separatorLength);

      if (!rawEvent.trim()) continue;

      const { event, data } = parseEventBlock(rawEvent);
      let parsed = {};

      if (data) {
        try {
          parsed = JSON.parse(data);
        } catch {
          continue;
        }
      }

      if (event === "delta") {
        const deltaText = typeof parsed.text === "string" ? parsed.text : "";
        if (!deltaText) continue;
        state.streamText += deltaText;
        continue;
      }

      if (event === "error") {
        state.errored = true;
        state.errorMessage =
          (typeof parsed.message === "string" && parsed.message) || "Stream failed";
        break;
      }

      if (event === "done") {
        state.done = true;
        state.finalText =
          typeof parsed.finalText === "string" ? parsed.finalText : state.streamText;
        if (state.finalText.trim()) {
          state.messages.push({ role: "assistant", content: state.finalText });
        }
        break;
      }
    }
  }

  return state;
}

function testDoneCommitsOnce() {
  const payload =
    encodeEvent("delta", { text: "Hello " }) +
    encodeEvent("delta", { text: "world" }) +
    "event: delta\ndata: {\"text\":\"!\"}\n\n" +
    "event: delta\ndata: {not-json}\n\n" +
    encodeEvent("done", { finalText: "Hello world!" }) +
    encodeEvent("delta", { text: " should-not-append" });

  const chunks = toChunks(payload, [1, 2, 3, 5, 8, 13, 21]);
  const state = reconcileStream(chunks);

  assert.equal(state.errored, false, "stream should not error");
  assert.equal(state.done, true, "stream should complete");
  assert.equal(state.streamText, "Hello world!", "delta buffer should match");
  assert.equal(state.finalText, "Hello world!", "final text should match done payload");
  assert.equal(state.messages.length, 1, "assistant message should be committed once");
  assert.equal(
    state.messages[0].content,
    "Hello world!",
    "assistant message content should match final text"
  );
}

function testErrorStopsCommit() {
  const payload =
    encodeEvent("delta", { text: "partial" }) +
    encodeEvent("error", { message: "Upstream failure" }) +
    encodeEvent("done", { finalText: "should-not-commit" });

  const chunks = toChunks(payload, [4, 4, 7, 9]);
  const state = reconcileStream(chunks);

  assert.equal(state.errored, true, "error event should set errored state");
  assert.equal(state.done, false, "done should be ignored after error");
  assert.equal(state.messages.length, 0, "no final assistant message should be committed");
  assert.equal(state.errorMessage, "Upstream failure", "error message should be preserved");
}

function main() {
  testDoneCommitsOnce();
  testErrorStopsCommit();
  console.log("validate-stream-reconciliation: all checks passed");
}

main();
