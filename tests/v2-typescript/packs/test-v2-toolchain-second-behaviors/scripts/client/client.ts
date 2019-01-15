/// <reference types="minecraft-scripting-types-client" />
namespace Client {
    const system = client.registerSystem(0, 0);

    // Setup which events to listen for
    system.initialize = function () {
        // set up your listenToEvents and register client-side components here.
    }

    // per-tick updates
    system.update = function() {
        // Any logic that needs to happen every tick on the client.
    }
}