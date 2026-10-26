/* SMP TEST 01 — Collision turn: original versus half-angle.
   Only the collision-angle rule is affected. Other rules stay unchanged.
   This file is loaded before engine.js and injects its own toggle button. */
(() => {
  "use strict";

  let halfTurnEnabled = false;

  window.SMP_RULES = {
    collisionTurn({ oldVX, oldVY, candidateVX, candidateVY, maximumTurn }) {
      if (!halfTurnEnabled) return null; // original V2.3 implementation

      const oldSpeed = Math.hypot(oldVX, oldVY);
      const candidateSpeed = Math.hypot(candidateVX, candidateVY);

      // Preserve original handling of stationary particles.
      if (oldSpeed < 1e-9 || candidateSpeed < 1e-9) {
        return [candidateVX, candidateVY];
      }

      const before = Math.atan2(oldVY, oldVX);
      const after = Math.atan2(candidateVY, candidateVX);
      const difference = Math.atan2(
        Math.sin(after - before),
        Math.cos(after - before)
      );

      const testMaximumTurn = maximumTurn * 0.5;

      if (Math.abs(difference) <= testMaximumTurn) {
        return [candidateVX, candidateVY];
      }

      const limitedAngle = before + Math.sign(difference) * testMaximumTurn;

      return [
        Math.cos(limitedAngle) * candidateSpeed,
        Math.sin(limitedAngle) * candidateSpeed
      ];
    },

    neighborDirection: null,
    neighborSpeed: null
  };

  // Additional UI without changing the original HTML or CSS.
  const button = document.createElement("button");
  button.type = "button";
  button.className = "secondary";
  button.style.marginTop = "12px";

  const updateButton = () => {
    button.textContent = halfTurnEnabled
      ? "TEST 01 AAN — collision angle × 0.5"
      : "TEST 01 UIT — originele collision angle";
    button.style.borderColor = halfTurnEnabled ? "#f6c85f" : "#3c6176";
  };

  button.addEventListener("click", () => {
    halfTurnEnabled = !halfTurnEnabled;
    updateButton();
  });

  updateButton();
  const actions = document.querySelector(".actions");
  if (actions) {
    actions.parentNode.insertBefore(button, actions);
  }
})();
