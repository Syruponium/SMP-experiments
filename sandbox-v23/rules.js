/* SMP V2.3 EXPERIMENTAL RULES.
   Keep all values null to reproduce unmodified original rules.
   Set a function to replace ONE rule without editing engine.js.
   All angles are radians; speeds are px/s. */
window.SMP_RULES = {
  collisionTurn: null,
  neighborDirection: null,
  neighborSpeed: null,
};

// Example (leave disabled):
// window.SMP_RULES.collisionTurn = ({candidateVX,candidateVY}) => [candidateVX,candidateVY];
