import { assertEquals } from "std/assert/mod.ts";

// this test harness can test fin data language servers for compliance
// which in turn tests fin text decoders/encoders.
// the language server under test will be run in a sub process
// with communication via stdin, stdout and stderr
// as such it can be authored in any language

// lifecycle - initialize, shutdown and exit
// document sync - didOpen, didChange, didClose
// diagnostics - publishDiagnostics notification
// pull diagnostics - documentDiagnostics
// formatting - documentFormatting

Deno.test({
  name: "abnormal exit checks",
  fn: async (t) => {
    await t.step({
      name: "pre-initialize",
      fn: () => {
        // send exit notification. wait for status 1
      },
    });
    await t.step({
      name: "post-initialize",
      fn: () => {
        // send initialize.
        // send exit notification. wait for status 1
      },
    });
    await t.step({
      name: "pre-shutdown",
      fn: () => {
        // send initialize.
        // send initialized.
        // send exit notification. wait for status 1
      },
    });
  },
});

Deno.test({
  name: "lifecycle and capabilities",
  fn: async (t) => {
    // start the language server.

    await t.step({
      name: "bad requests pre-initialize",
      fn: () => {
        // send bad requests. check response
      },
    });

    await t.step({
      name: "check capabilities",
      fn: () => {
        // send the initialization request.
        // check the set of capabilites.
      },
    });

    await t.step({
      name: "bad requests post-initialize",
      fn: () => {
        // send bad requests. check response.
      },
    });

    // send initialized notification.

    await t.step({
      name: "bad requests pre-shutdown",
      fn: () => {
        // send bad requests. check response.
      },
    });

    await t.step({
      name: "shutdown",
      fn: () => {
        // send shutdown. check response.
      },
    });

    await t.step({
      name: "bad requests post-shutdown",
      fn: () => {
        // send bad requests. check response.
      },
    });

    await t.step({
      name: "exit",
      fn: () => {
        // send exit. wait for status 0.
      },
    });
  },
});
