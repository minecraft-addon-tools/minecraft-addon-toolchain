/// <reference types="minecraft-scripting-types-server" />
import { TestClass } from "../common";

namespace Server {
  var serverSystem = server.registerSystem(0, 0);

  var test = new TestClass("This is a test");

  // Setup which events to listen for
  serverSystem.initialize = function() {
    // set up your listenToEvents and register server-side components here.
    serverSystem.listenForEvent(
      ReceiveFromMinecraftServer.EntityTick,
      onEntityCreated
    );
  };

  function onEntityCreated() {
    serverSystem.broadcastEvent(
      SendToMinecraftServer.DisplayChat,
      test.name + " Server 1"
    );
  }

  // per-tick updates
  serverSystem.update = function() {
    // Any logic that needs to happen every tick on the server.
  };
}
