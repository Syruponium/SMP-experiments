(() => {
  "use strict";


  // ============================================================
  // RELATIONAL PARTICLE BOX V2.3
  //
  // FIXES:
  //
  // 1. Collision processing order is shuffled every physics tick.
  // 2. Neighbor processing order is shuffled every physics tick.
  // 3. Periodic spatial grid divides the width exactly.
  // 4. Collision shell changes LIVE without restarting.
  // 5. Particle count rebuilds only when its slider is released.
  //
  // UNCHANGED:
  //
  // - x = periodic
  // - y = specular solid wall
  // - visible core radius = 3.2 px
  // - same neighbour-angle rule
  // - same collision-angle rule
  // - same speed-freedom rule
  // ============================================================


  const canvas =
    document.getElementById("sim");


  const ctx =
    canvas.getContext("2d");


  const W =
    canvas.width;


  const H =
    canvas.height;


  const TIME_STEP =
    1 / 60;


  const EPS =
    1e-9;


  // Visible particle.
  const CORE_RADIUS =
    3.2;


  // Invisible interaction shell.
  //
  // This changes LIVE.
  let collisionRadius =
    7.2;


  const particles =
    [];


  // ============================================================
  // DYNAMIC VELOCITY BUFFERS
  // ============================================================

  let oldVX =
    new Float64Array(0);


  let oldVY =
    new Float64Array(0);


  let newVX =
    new Float64Array(0);


  let newVY =
    new Float64Array(0);


  // ============================================================
  // STATE
  // ============================================================

  let running =
    true;


  let accumulator =
    0;


  let previousTime =
    performance.now();


  let hoveredParticle =
    -1;


  let lastGrid =
    null;


  let impulseVisuals =
    [];


  // ============================================================
  // CONTROLS
  // ============================================================

  const controls = {

    particleCount:
      document.getElementById(
        "particleCount"
      ),

    collisionRadius:
      document.getElementById(
        "collisionRadius"
      ),

    collisionAngle:
      document.getElementById(
        "collisionAngle"
      ),

    neighborAngle:
      document.getElementById(
        "neighborAngle"
      ),

    speedFreedom:
      document.getElementById(
        "speedFreedom"
      ),

    neighborRadius:
      document.getElementById(
        "neighborRadius"
      ),

    leftImpulse:
      document.getElementById(
        "leftImpulse"
      ),

    rightImpulse:
      document.getElementById(
        "rightImpulse"
      ),

    topImpulse:
      document.getElementById(
        "topImpulse"
      ),

    bottomImpulse:
      document.getElementById(
        "bottomImpulse"
      )

  };


  const outputs = {

    particleCount:
      document.getElementById(
        "particleCountOut"
      ),

    collisionRadius:
      document.getElementById(
        "collisionRadiusOut"
      ),

    collisionAngle:
      document.getElementById(
        "collisionAngleOut"
      ),

    neighborAngle:
      document.getElementById(
        "neighborAngleOut"
      ),

    speedFreedom:
      document.getElementById(
        "speedFreedomOut"
      ),

    neighborRadius:
      document.getElementById(
        "neighborRadiusOut"
      ),

    leftImpulse:
      document.getElementById(
        "leftImpulseOut"
      ),

    rightImpulse:
      document.getElementById(
        "rightImpulseOut"
      ),

    topImpulse:
      document.getElementById(
        "topImpulseOut"
      ),

    bottomImpulse:
      document.getElementById(
        "bottomImpulseOut"
      )

  };


  const showVectors =
    document.getElementById(
      "showVectors"
    );


  const showNeighborhood =
    document.getElementById(
      "showNeighborhood"
    );


  const pauseButton =
    document.getElementById(
      "pauseBtn"
    );


  const resetButton =
    document.getElementById(
      "resetBtn"
    );


  // ============================================================
  // METRICS
  // ============================================================

  const metricElements = {

    particles:
      document.getElementById(
        "mParticles"
      ),

    radius:
      document.getElementById(
        "mRadius"
      ),

    occupancy:
      document.getElementById(
        "mOccupancy"
      ),

    relativeSpeed:
      document.getElementById(
        "mRelSpeed"
      ),

    angle:
      document.getElementById(
        "mAngle"
      ),

    coherence:
      document.getElementById(
        "mCoherence"
      ),

    neighbors:
      document.getElementById(
        "mNeighbors"
      ),

    kineticEnergy:
      document.getElementById(
        "mKE"
      ),

    collisions:
      document.getElementById(
        "mCollisions"
      ),

    energyLoss:
      document.getElementById(
        "mEnergyLoss"
      ),

    energyGain:
      document.getElementById(
        "mEnergyGain"
      ),

    momentumEdit:
      document.getElementById(
        "mMomentumEdit"
      )

  };


  const displayStats = {

    relativeSpeedDeviation: 0,

    meanAngularDeviation: 0,

    directionalCoherence: 0,

    meanNeighborCount: 0,

    kineticEnergy: 0,

    collisionRate: 0,

    energyLossRate: 0,

    energyGainRate: 0,

    momentumEditRate: 0

  };


  const statsWindow = {

    started:
      performance.now(),

    collisions: 0,

    relationEnergyLost: 0,

    relationEnergyGained: 0,

    momentumEdited: 0

  };


  // ============================================================
  // HELPERS
  // ============================================================

  function collisionDiameter() {

    return (
      collisionRadius *
      2
    );
  }


  function clamp(
    value,
    min,
    max
  ) {

    return Math.max(
      min,
      Math.min(
        max,
        value
      )
    );
  }


  function wrapX(x) {

    x %= W;


    if (
      x < 0
    ) {

      x += W;
    }


    return x;
  }


  function periodicDX(dx) {

    if (
      dx >
      W / 2
    ) {

      dx -= W;
    }


    else if (
      dx <
      -W / 2
    ) {

      dx += W;
    }


    return dx;
  }


  function angleDifference(
    a,
    b
  ) {

    let difference =
      a - b;


    while (
      difference >
      Math.PI
    ) {

      difference -=
        Math.PI * 2;
    }


    while (
      difference <
      -Math.PI
    ) {

      difference +=
        Math.PI * 2;
    }


    return difference;
  }


  function shuffleInPlace(
    array
  ) {

    for (
      let i = array.length - 1;
      i > 0;
      i--
    ) {

      const j =
        Math.floor(
          Math.random() *
          (
            i + 1
          )
        );


      const temporary =
        array[i];


      array[i] =
        array[j];


      array[j] =
        temporary;
    }


    return array;
  }


  function resetStatsWindow() {

    statsWindow.started =
      performance.now();


    statsWindow.collisions =
      0;


    statsWindow.relationEnergyLost =
      0;


    statsWindow.relationEnergyGained =
      0;


    statsWindow.momentumEdited =
      0;
  }


  // Diagnostic only.
  //
  // Sum of shell areas divided by box area.
  //
  // It may exceed 1 when shells necessarily overlap.
  function shellOccupancy() {

    return (
      particles.length *
      Math.PI *
      collisionRadius *
      collisionRadius
      /
      (
        W *
        H
      )
    );
  }


  // ============================================================
  // UI
  // ============================================================

  function refreshControlLabels() {

    outputs
      .particleCount
      .textContent =
      controls
        .particleCount
        .value;


    outputs
      .collisionRadius
      .textContent =
      `${
        Number(
          controls
            .collisionRadius
            .value
        )
        .toFixed(1)
      } px`;


    outputs
      .collisionAngle
      .textContent =
      `${
        controls
          .collisionAngle
          .value
      }°`;


    outputs
      .neighborAngle
      .textContent =
      `${
        controls
          .neighborAngle
          .value
      }°`;


    outputs
      .speedFreedom
      .textContent =
      `${
        Math.round(
          Number(
            controls
              .speedFreedom
              .value
          )
          *
          100
        )
      }%`;


    outputs
      .neighborRadius
      .textContent =
      `${
        controls
          .neighborRadius
          .value
      } px`;


    outputs
      .leftImpulse
      .textContent =
      controls
        .leftImpulse
        .value;


    outputs
      .rightImpulse
      .textContent =
      controls
        .rightImpulse
        .value;


    outputs
      .topImpulse
      .textContent =
      controls
        .topImpulse
        .value;


    outputs
      .bottomImpulse
      .textContent =
      controls
        .bottomImpulse
        .value;
  }


  Object
    .values(
      controls
    )
    .forEach(
      control => {

        control
          .addEventListener(
            "input",
            refreshControlLabels
          );
      }
    );


  // ------------------------------------------------------------
  // SHELL CHANGES LIVE
  // ------------------------------------------------------------

  controls
    .collisionRadius
    .addEventListener(
      "input",
      () => {

        collisionRadius =
          Number(
            controls
              .collisionRadius
              .value
          );


        lastGrid =
          null;
      }
    );


  // ------------------------------------------------------------
  // PARTICLE COUNT CHANGES ON RELEASE
  // ------------------------------------------------------------

  controls
    .particleCount
    .addEventListener(
      "change",
      () => {

        createParticles();
      }
    );


  // ============================================================
  // VELOCITY BUFFERS
  // ============================================================

  function resizeVelocityBuffers() {

    const count =
      particles.length;


    oldVX =
      new Float64Array(
        count
      );


    oldVY =
      new Float64Array(
        count
      );


    newVX =
      new Float64Array(
        count
      );


    newVY =
      new Float64Array(
        count
      );
  }


  // ============================================================
  // EXACT PERIODIC GRID
  // ============================================================

  function makeGridGeometry(
    requestedCellSize
  ) {

    const columns =
      Math.max(
        1,
        Math.floor(
          W /
          requestedCellSize
        )
      );


    const rows =
      Math.max(
        1,
        Math.floor(
          H /
          requestedCellSize
        )
      );


    return {

      columns,

      rows,

      cellWidth:
        W /
        columns,

      cellHeight:
        H /
        rows

    };
  }


  function buildGrid(
    requestedCellSize
  ) {

    const geometry =
      makeGridGeometry(
        requestedCellSize
      );


    const {
      columns,
      rows,
      cellWidth,
      cellHeight
    } =
      geometry;


    const cells =
      new Map();


    for (
      let i = 0;
      i < particles.length;
      i++
    ) {

      const particle =
        particles[i];


      const cx =
        clamp(
          Math.floor(
            particle.x /
            cellWidth
          ),
          0,
          columns - 1
        );


      const cy =
        clamp(
          Math.floor(
            particle.y /
            cellHeight
          ),
          0,
          rows - 1
        );


      const key =
        cx +
        cy *
        columns;


      if (
        !cells.has(
          key
        )
      ) {

        cells.set(
          key,
          []
        );
      }


      cells
        .get(
          key
        )
        .push(
          i
        );
    }


    return {

      cells,

      columns,

      rows,

      cellWidth,

      cellHeight

    };
  }


  function forEachNearby(
    grid,
    particle,
    callback
  ) {

    const {

      cells,

      columns,

      rows,

      cellWidth,

      cellHeight

    } =
      grid;


    const cx =
      Math.floor(
        particle.x /
        cellWidth
      );


    const cy =
      Math.floor(
        particle.y /
        cellHeight
      );


    const visitedKeys =
      new Set();


    for (
      let gy = cy - 1;
      gy <= cy + 1;
      gy++
    ) {

      if (
        gy < 0 ||
        gy >= rows
      ) {

        continue;
      }


      for (
        let gx = cx - 1;
        gx <= cx + 1;
        gx++
      ) {

        const wrappedGX =
          (
            (
              gx %
              columns
            )
            +
            columns
          )
          %
          columns;


        const key =
          wrappedGX +
          gy *
          columns;


        if (
          visitedKeys.has(
            key
          )
        ) {

          continue;
        }


        visitedKeys.add(
          key
        );


        const bucket =
          cells.get(
            key
          );


        if (
          !bucket
        ) {

          continue;
        }


        for (
          const index
          of bucket
        ) {

          callback(            index
          );
        }
      }
    }
  }


  // ============================================================
  // PARTICLE CREATION
  // ============================================================

  function createParticles() {

    particles.length =
      0;


    collisionRadius =
      Number(
        controls
          .collisionRadius
          .value
      );


    const particleCount =
      Number(
        controls
          .particleCount
          .value
      );


    const diameter =
      collisionDiameter();


    const minimumDistance =
      diameter *
      1.03;


    const minimumDistanceSquared =
      minimumDistance *
      minimumDistance;


    const placementTargetSize =
      Math.max(
        diameter *
        1.2,
        4
      );


    const placementGeometry =
      makeGridGeometry(
        placementTargetSize
      );


    const {

      columns,

      rows,

      cellWidth,

      cellHeight

    } =
      placementGeometry;


    const placementGrid =
      new Map();


    function placementKey(
      cx,
      cy
    ) {

      return (
        cx +
        cy *
        columns
      );
    }


    function wrappedColumn(
      cx
    ) {

      return (
        (
          cx %
          columns
        )
        +
        columns
      )
      %
      columns;
    }


    function insertPlacementParticle(
      particle,
      index
    ) {

      const cx =
        wrappedColumn(
          Math.floor(
            particle.x /
            cellWidth
          )
        );


      const cy =
        clamp(
          Math.floor(
            particle.y /
            cellHeight
          ),
          0,
          rows - 1
        );


      const key =
        placementKey(
          cx,
          cy
        );


      if (
        !placementGrid.has(
          key
        )
      ) {

        placementGrid.set(
          key,
          []
        );
      }


      placementGrid
        .get(
          key
        )
        .push(
          index
        );
    }


    for (
      let i = 0;
      i < particleCount;
      i++
    ) {

      let x = 0;

      let y = 0;

      let valid =
        false;


      for (
        let attempt = 0;
        attempt < 300 &&
        !valid;
        attempt++
      ) {

        x =
          Math.random() *
          W;


        y =
          CORE_RADIUS +
          Math.random() *
          (
            H -
            CORE_RADIUS *
            2
          );


        valid =
          true;


        const cx =
          Math.floor(
            x /
            cellWidth
          );


        const cy =
          Math.floor(
            y /
            cellHeight
          );


        for (
          let gy = cy - 1;
          gy <= cy + 1 &&
          valid;
          gy++
        ) {

          if (
            gy < 0 ||
            gy >= rows
          ) {

            continue;
          }


          for (
            let gx = cx - 1;
            gx <= cx + 1 &&
            valid;
            gx++
          ) {

            const wrappedGX =
              wrappedColumn(
                gx
              );


            const bucket =
              placementGrid.get(
                placementKey(
                  wrappedGX,
                  gy
                )
              );


            if (
              !bucket
            ) {

              continue;
            }


            for (
              const otherIndex
              of bucket
            ) {

              const other =
                particles[
                  otherIndex
                ];


              const dx =
                periodicDX(
                  other.x -
                  x
                );


              const dy =
                other.y -
                y;


              if (
                dx * dx +
                dy * dy
                <
                minimumDistanceSquared
              ) {

                valid =
                  false;

                break;
              }
            }
          }
        }
      }


      // At very high occupancy an overlap-free
      // placement may be impossible.
      if (
        !valid
      ) {

        x =
          Math.random() *
          W;


        y =
          CORE_RADIUS +
          Math.random() *
          (
            H -
            CORE_RADIUS *
            2
          );
      }


      const angle =
        Math.random() *
        Math.PI *
        2;


      const speed =
        35 +
        Math.random() *
        25;


      const particle = {

        x,

        y,

        vx:
          Math.cos(
            angle
          )
          *
          speed,

        vy:
          Math.sin(
            angle
          )
          *
          speed

      };


      particles.push(
        particle
      );


      insertPlacementParticle(
        particle,
        particles.length - 1
      );
    }


    // Remove accidental net initial drift.
    let averageVX =
      0;


    let averageVY =
      0;


    for (
      const particle
      of particles
    ) {

      averageVX +=
        particle.vx;


      averageVY +=
        particle.vy;
    }


    averageVX /=
      particles.length;


    averageVY /=
      particles.length;


    for (
      const particle
      of particles
    ) {

      particle.vx -=
        averageVX;


      particle.vy -=
        averageVY;
    }


    resizeVelocityBuffers();


    hoveredParticle =
      -1;


    impulseVisuals =
      [];


    lastGrid =
      null;


    accumulator =
      0;


    resetStatsWindow();
  }


  // ============================================================
  // RELATIONAL RULE
  // ============================================================

  function applyRelationalConstraints(
    grid
  ) {

    const neighborRadius =
      Number(
        controls
          .neighborRadius
          .value
      );


    const neighborRadiusSquared =
      neighborRadius *
      neighborRadius;


    const maxNeighborAngle =
      Number(
        controls
          .neighborAngle
          .value
      )
      *
      Math.PI /
      180;


    const speedFreedom =
      Number(
        controls
          .speedFreedom
          .value
      );


    let totalNeighborCount =
      0;


    let speedDeviationTotal =
      0;


    let speedDeviationSamples =
      0;


    let angleDeviationTotal =
      0;


    let angleDeviationSamples =
      0;


    let coherenceTotal =
      0;


    let coherenceSamples =
      0;


    // Snapshot.
    for (
      let i = 0;
      i < particles.length;
      i++
    ) {

      oldVX[i] =
        particles[i].vx;


      oldVY[i] =
        particles[i].vy;
    }


    for (
      let i = 0;
      i < particles.length;
      i++
    ) {

      const particle =
        particles[i];


      let sumVX =
        0;


      let sumVY =
        0;


      let sumSpeed =
        0;


      let neighborCount =
        0;


      forEachNearby(
        grid,
        particle,
        j => {

          if (
            j === i
          ) {

            return;
          }


          const other =
            particles[j];


          const dx =
            periodicDX(
              other.x -
              particle.x
            );


          const dy =
            other.y -
            particle.y;


          const distanceSquared =
            dx * dx +
            dy * dy;


          if (
            distanceSquared >
            neighborRadiusSquared
          ) {

            return;
          }


          const vx =
            oldVX[j];


          const vy =
            oldVY[j];


          sumVX +=
            vx;


          sumVY +=
            vy;


          sumSpeed +=
            Math.hypot(
              vx,
              vy
            );


          neighborCount++;
        }
      );


      totalNeighborCount +=
        neighborCount;


      let vx =
        oldVX[i];


      let vy =
        oldVY[i];


      const initialSpeed =
        Math.hypot(
          vx,
          vy
        );


      const initialEnergy =
        0.5 *
        initialSpeed *
        initialSpeed;


      const initialVX =
        vx;


      const initialVY =
        vy;


      if (
        neighborCount >
        0
      ) {

        const meanVX =
          sumVX /
          neighborCount;


        const meanVY =
          sumVY /
          neighborCount;


        const meanSpeed =
          sumSpeed /
          neighborCount;


        const meanVectorMagnitude =
          Math.hypot(
            meanVX,
            meanVY
          );


        // ----------------------------------------------
        // SPEED DEVIATION
        // ----------------------------------------------

        if (
          meanSpeed >
          EPS
        ) {

          speedDeviationTotal +=
            Math.abs(
              initialSpeed -
              meanSpeed
            )
            /
            meanSpeed;


          speedDeviationSamples++;
        }


        // ----------------------------------------------
        // DIRECTIONAL RELATION
        // ----------------------------------------------

        if (
          initialSpeed >
          EPS
          &&
          meanVectorMagnitude >
          EPS
        ) {

          const ownAngle =
            Math.atan2(
              vy,
              vx
            );


          const localAngle =
            Math.atan2(
              meanVY,
              meanVX
            );


          const difference =
            angleDifference(
              ownAngle,
              localAngle
            );


          angleDeviationTotal +=
            Math.abs(
              difference
            );


          angleDeviationSamples++;


          coherenceTotal +=
            Math.cos(
              difference
            );


          coherenceSamples++;


          if (
            maxNeighborAngle <
            Math.PI -
            1e-6
            &&
            Math.abs(
              difference
            )
            >
            maxNeighborAngle
          ) {

            const allowedAngle =
              localAngle +
              Math.sign(
                difference
              )
              *
              maxNeighborAngle;


            vx =
              Math.cos(
                allowedAngle
              )
              *
              initialSpeed;


            vy =
              Math.sin(
                allowedAngle
              )
              *
              initialSpeed;
          }
        }


        // ----------------------------------------------
        // SPEED FREEDOM
        // ----------------------------------------------

        if (
          speedFreedom <
          0.999
          &&
          meanSpeed >
          EPS
        ) {

          const currentSpeed =
            Math.hypot(
              vx,
              vy
            );


          const minimumSpeed =
            Math.max(
              0,
              meanSpeed *
              (
                1 -
                speedFreedom
              )
            );


          const maximumSpeed =
            meanSpeed *
            (
              1 +
              speedFreedom
            );


          const allowedSpeed =
            clamp(
              currentSpeed,
              minimumSpeed,
              maximumSpeed
            );


          if (
            currentSpeed >
            EPS
            &&
            Math.abs(
              allowedSpeed -
              currentSpeed
            )
            >
            1e-8
          ) {

            const scale =
              allowedSpeed /
              currentSpeed;


            vx *=
              scale;


            vy *=
              scale;
          }
        }
      }


      // ----------------------------------------------
      // TRACK RULE-INTRODUCED CHANGES
      // ----------------------------------------------

      const finalSpeed =
        Math.hypot(
          vx,
          vy
        );


      const finalEnergy =
        0.5 *
        finalSpeed *
        finalSpeed;


      const energyDifference =
        finalEnergy -
        initialEnergy;


      if (
        energyDifference <
        0
      ) {

        statsWindow
          .relationEnergyLost +=
          -energyDifference;
      }

      else {

        statsWindow
          .relationEnergyGained +=
          energyDifference;
      }


      statsWindow
        .momentumEdited +=
        Math.hypot(
          vx -
          initialVX,
          vy -
          initialVY
        );


      newVX[i] =
        vx;


      newVY[i] =
        vy;
    }


    for (
      let i = 0;
      i < particles.length;
      i++
    ) {

      particles[i].vx =
        newVX[i];


      particles[i].vy =
        newVY[i];
    }


    displayStats
      .meanNeighborCount =
      totalNeighborCount /
      particles.length;


    displayStats
      .relativeSpeedDeviation =
      speedDeviationSamples
        ?
        speedDeviationTotal /
        speedDeviationSamples
        :
        0;


    displayStats
      .meanAngularDeviation =
      angleDeviationSamples
        ?
        angleDeviationTotal /
        angleDeviationSamples
        :
        0;


    displayStats
      .directionalCoherence =
      coherenceSamples
        ?
        coherenceTotal /
        coherenceSamples
        :
        0;
  }


  // ============================================================
  // MOVEMENT
  // ============================================================

  function integrate(
    dt
  ) {

    for (
      const particle
      of particles
    ) {

      particle.x =
        wrapX(
          particle.x +
          particle.vx *
          dt
        );

      particle.y +=
        particle.vy *
        dt;


      // Top wall.
      if (
        particle.y <
        CORE_RADIUS
      ) {

        particle.y =
          CORE_RADIUS;


        if (
          particle.vy <
          0
        ) {

          particle.vy =
            -particle.vy;
        }
      }


      // Bottom wall.
      else if (
        particle.y >
        H -
        CORE_RADIUS
      ) {

        particle.y =
          H -
          CORE_RADIUS;


        if (
          particle.vy >
          0
        ) {

          particle.vy =
            -particle.vy;
        }
      }
    }
  }


  // ============================================================
  // COLLISION TURN LIMIT
  // ============================================================

  function limitCollisionTurn(
    oldVXValue,
    oldVYValue,
    candidateVX,
    candidateVY,
    maximumTurn
  ) {

    const oldSpeed =
      Math.hypot(
        oldVXValue,
        oldVYValue
      );


    const candidateSpeed =
      Math.hypot(
        candidateVX,
        candidateVY
      );


    if (
      oldSpeed <
      EPS
      ||
      candidateSpeed <
      EPS
      ||
      maximumTurn >=
      Math.PI -
      1e-6
    ) {

      return [
        candidateVX,
        candidateVY
      ];
    }


    const originalAngle =
      Math.atan2(
        oldVYValue,
        oldVXValue
      );


    const candidateAngle =
      Math.atan2(
        candidateVY,
        candidateVX
      );


    const difference =
      angleDifference(
        candidateAngle,
        originalAngle
      );


    if (
      Math.abs(
        difference
      )
      <=
      maximumTurn
    ) {

      return [
        candidateVX,
        candidateVY
      ];
    }


    const allowedAngle =
      originalAngle +
      Math.sign(
        difference
      )
      *
      maximumTurn;


    return [

      Math.cos(
        allowedAngle
      )
      *
      candidateSpeed,

      Math.sin(
        allowedAngle
      )
      *
      candidateSpeed

    ];
  }


  // ============================================================
  // COLLISIONS
  //
  // IMPORTANT V2.3 CHANGE:
  //
  // particle order shuffled every tick
  // AND
  // neighbour order shuffled for every particle
  // ============================================================

  function resolveCollisions(
    grid
  ) {

    const maximumTurn =
      Number(
        controls
          .collisionAngle
          .value
      )
      *
      Math.PI /
      180;


    const particleOrder =
      Array.from(
        {
          length:
            particles.length
        },
        (
          _,
          i
        ) =>
          i
      );


    shuffleInPlace(
      particleOrder
    );


    for (
      const i
      of particleOrder
    ) {

      const a =
        particles[i];


      const nearbyIndices =
        [];


      forEachNearby(
        grid,
        a,
        j => {

          if (
            j !== i
          ) {

            nearbyIndices.push(
              j
            );
          }
        }
      );


      shuffleInPlace(
        nearbyIndices
      );


      for (
        const j
        of nearbyIndices
      ) {

        // Every pair exactly once.
        if (
          j <= i
        ) {

          continue;
        }


        const b =
          particles[j];


        let dx =
          periodicDX(
            b.x -
            a.x
          );


        let dy =
          b.y -
          a.y;


        const contactDistance =
          collisionRadius +
          collisionRadius;


        const contactDistanceSquared =
          contactDistance *
          contactDistance;


        let distanceSquared =
          dx * dx +
          dy * dy;


        if (
          distanceSquared >=
          contactDistanceSquared
        ) {

          continue;
        }


        if (
          distanceSquared <
          EPS
        ) {

          dx =
            (
              Math.random() -
              0.5
            )
            *
            0.001;


          dy =
            (
              Math.random() -
              0.5
            )
            *
            0.001;


          distanceSquared =
            dx * dx +
            dy * dy;
        }


        const distance =
          Math.sqrt(
            distanceSquared
          );


        const nx =
          dx /
          distance;


        const ny =
          dy /
          distance;


        // ----------------------------------------------
        // RESOLVE SHELL OVERLAP
        // ----------------------------------------------

        const overlap =
          contactDistance -
          distance;


        a.x =
          wrapX(
            a.x -
            nx *
            overlap *
            0.5
          );


        a.y =
          clamp(
            a.y -
            ny *
            overlap *
            0.5,
            CORE_RADIUS,
            H -
            CORE_RADIUS
          );


        b.x =
          wrapX(
            b.x +
            nx *
            overlap *
            0.5
          );


        b.y =
          clamp(
            b.y +
            ny *
            overlap *
            0.5,
            CORE_RADIUS,
            H -
            CORE_RADIUS
          );


        // ----------------------------------------------
        // ELASTIC COLLISION
        // ----------------------------------------------

        const relativeVX =
          b.vx -
          a.vx;


        const relativeVY =
          b.vy -
          a.vy;


        const relativeNormalSpeed =
          relativeVX *
          nx
          +
          relativeVY *
          ny;


        // Already moving apart.
        if (
          relativeNormalSpeed >=
          0
        ) {

          continue;
        }


        const oldAVX =
          a.vx;


        const oldAVY =
          a.vy;


        const oldBVX =
          b.vx;


        const oldBVY =
          b.vy;


        const impulse =
          -relativeNormalSpeed;


        let candidateAVX =
          a.vx -
          impulse *
          nx;


        let candidateAVY =
          a.vy -
          impulse *
          ny;


        let candidateBVX =
          b.vx +
          impulse *
          nx;


        let candidateBVY =
          b.vy +
          impulse *
          ny;


        const elasticAVX =
          candidateAVX;


        const elasticAVY =
          candidateAVY;


        const elasticBVX =
          candidateBVX;


        const elasticBVY =
          candidateBVY;


        // ----------------------------------------------
        // EXPERIMENTAL COLLISION ANGLE RULE
        // ----------------------------------------------

        [
          candidateAVX,
          candidateAVY
        ] =
          limitCollisionTurn(
            oldAVX,
            oldAVY,

            candidateAVX,
            candidateAVY,

            maximumTurn
          );


        [
          candidateBVX,
          candidateBVY
        ] =
          limitCollisionTurn(
            oldBVX,
            oldBVY,

            candidateBVX,
            candidateBVY,

            maximumTurn
          );


        // ----------------------------------------------
        // MEASURE RULE-INTRODUCED MOMENTUM EDIT
        // ----------------------------------------------

        const momentumDifferenceX =
          (
            candidateAVX +
            candidateBVX
          )
          -
          (
            elasticAVX +
            elasticBVX
          );


        const momentumDifferenceY =
          (
            candidateAVY +
            candidateBVY
          )
          -
          (
            elasticAVY +
            elasticBVY
          );


        statsWindow
          .momentumEdited +=
          Math.hypot(
            momentumDifferenceX,
            momentumDifferenceY
          );


        a.vx =
          candidateAVX;


        a.vy =
          candidateAVY;


        b.vx =
          candidateBVX;


        b.vy =
          candidateBVY;


        statsWindow
          .collisions++;
      }
    }
  }


  // ============================================================
  // GLOBAL METRICS
  // ============================================================

  function calculateGlobalStats() {

    let kineticEnergy =
      0;


    for (
      const particle
      of particles
    ) {

      const speed =
        Math.hypot(
          particle.vx,
          particle.vy
        );


      kineticEnergy +=
        0.5 *
        speed *
        speed;
    }


    displayStats
      .kineticEnergy =
      kineticEnergy;


    const now =
      performance.now();


    const elapsed =
      Math.max(
        0.001,
        (
          now -
          statsWindow.started
        )
        /
        1000
      );


    if (
      elapsed >=
      0.5
    ) {

      displayStats
        .collisionRate =
        statsWindow
          .collisions
        /
        elapsed;


      displayStats
        .energyLossRate =
        statsWindow
          .relationEnergyLost
        /
        elapsed;


      displayStats
        .energyGainRate =
        statsWindow
          .relationEnergyGained
        /
        elapsed;


      displayStats
        .momentumEditRate =
        statsWindow
          .momentumEdited
        /
        elapsed;


      resetStatsWindow();
    }
  }


  function updateMetrics() {

    metricElements
      .particles
      .textContent =
      particles.length;


    metricElements
      .radius
      .textContent =
      `${
        collisionRadius
          .toFixed(1)
      } px`;


    metricElements
      .occupancy
      .textContent =
      shellOccupancy()
        .toFixed(2);


    metricElements
      .relativeSpeed
      .textContent =
      displayStats
        .relativeSpeedDeviation
        .toFixed(3);


    metricElements
      .angle
      .textContent =
      `${
        (
          displayStats
            .meanAngularDeviation
          *
          180 /
          Math.PI
        )
        .toFixed(1)
      }°`;


    metricElements
      .coherence
      .textContent =
      displayStats
        .directionalCoherence
        .toFixed(3);


    metricElements
      .neighbors
      .textContent =
      displayStats
        .meanNeighborCount
        .toFixed(1);


    metricElements
      .kineticEnergy
      .textContent =
      displayStats
        .kineticEnergy
        .toFixed(0);


    metricElements
      .collisions
      .textContent =
      `${
        displayStats
          .collisionRate
          .toFixed(0)
      }/s`;


    metricElements
      .energyLoss
      .textContent =
      displayStats
        .energyLossRate
        .toFixed(1);


    metricElements
      .energyGain
      .textContent =
      displayStats
        .energyGainRate
        .toFixed(1);


    metricElements
      .momentumEdit
      .textContent =
      displayStats
        .momentumEditRate
        .toFixed(1);
  }


  // ============================================================
  // IMPULSE INJECTION
  // ============================================================

  function inject(
    side
  ) {

    const strength =
      Number(
        controls[
          `${side}Impulse`
        ]
        .value
      );


    const zoneDepth =
      72;


    const zoneHalfSpan =
      95;


    for (
      const particle
      of particles
    ) {

      let inside =
        false;


      if (
        side ===
        "left"
      ) {

        inside =
          particle.x <
          zoneDepth
          &&
          Math.abs(
            particle.y -
            H / 2
          )
          <
          zoneHalfSpan;
      }


      if (
        side ===
        "right"
      ) {

        inside =
          particle.x >
          W -
          zoneDepth
          &&
          Math.abs(
            particle.y -
            H / 2
          )
          <
          zoneHalfSpan;
      }


      if (
        side ===
        "top"
      ) {

        inside =
          particle.y <
          zoneDepth
          &&
          Math.abs(
            particle.x -
            W / 2
          )
          <
          zoneHalfSpan;
      }


      if (
        side ===
        "bottom"
      ) {

        inside =
          particle.y >
          H -
          zoneDepth
          &&
          Math.abs(
            particle.x -
            W / 2
          )
          <
          zoneHalfSpan;
      }


      if (
        !inside
      ) {

        continue;
      }


      if (
        side ===
        "left"
      ) {

        particle.vx +=
          strength;
      }


      if (
        side ===
        "right"
      ) {

        particle.vx -=
          strength;
      }


      if (
        side ===
        "top"
      ) {

        particle.vy +=
          strength;
      }


      if (
        side ===
        "bottom"
      ) {

        particle.vy -=
          strength;
      }
    }


    impulseVisuals.push({

      side,

      age: 0

    });
  }


  // ============================================================
  // DRAWING
  // ============================================================

  function drawParticleAt(
    particle,
    x
  ) {

    ctx.beginPath();


    ctx.arc(
      x,
      particle.y,
      CORE_RADIUS,
      0,
      Math.PI *
      2
    );


    ctx.fill();
  }


  function drawParticles() {

    ctx.fillStyle =
      "#e7f4ff";


    for (
      const particle
      of particles
    ) {

      drawParticleAt(
        particle,
        particle.x
      );


      if (
        particle.x <
        CORE_RADIUS
      ) {

        drawParticleAt(
          particle,
          particle.x +
          W
        );
      }


      else if (
        particle.x >
        W -
        CORE_RADIUS      ) {

        drawParticleAt(
          particle,
          particle.x -
          W
        );
      }
    }
  }


  function drawInjector(
    side
  ) {

    ctx.save();


    ctx.fillStyle =
      "#f5b942";


    ctx.strokeStyle =
      "#f5b942";


    ctx.lineWidth =
      2;


    let x =
      0;


    let y =
      0;


    let directionX =
      0;


    let directionY =
      0;


    if (
      side ===
      "left"
    ) {

      x =
        1;


      y =
        H / 2;


      directionX =
        1;
    }


    if (
      side ===
      "right"
    ) {

      x =
        W - 1;


      y =
        H / 2;


      directionX =
        -1;
    }


    if (
      side ===
      "top"
    ) {

      x =
        W / 2;


      y =
        1;


      directionY =
        1;
    }


    if (
      side ===
      "bottom"
    ) {

      x =
        W / 2;


      y =
        H - 1;


      directionY =
        -1;
    }


    ctx.beginPath();


    ctx.arc(
      x,
      y,
      7,
      0,
      Math.PI *
      2
    );


    ctx.fill();


    ctx.beginPath();


    ctx.moveTo(
      x +
      directionX *
      8,

      y +
      directionY *
      8
    );


    ctx.lineTo(
      x +
      directionX *
      31,

      y +
      directionY *
      31
    );


    ctx.stroke();


    ctx.restore();
  }


  function drawImpulseVisuals() {

    impulseVisuals =
      impulseVisuals.filter(
        effect =>
          effect.age <
          0.55
      );


    for (
      const effect
      of impulseVisuals
    ) {

      effect.age +=
        TIME_STEP;


      const t =
        clamp(
          effect.age /
          0.55,
          0,
          1
        );


      const distance =
        20 +
        t *
        110;


      ctx.save();


      ctx.globalAlpha =
        1 -
        t;


      ctx.strokeStyle =
        "#f5b942";


      ctx.lineWidth =
        3;


      ctx.beginPath();


      if (
        effect.side ===
        "left"
        ||
        effect.side ===
        "right"
      ) {

        const x =
          effect.side ===
          "left"
            ?
            distance
            :
            W -
            distance;


        ctx.moveTo(
          x,
          H / 2 -
          90
        );


        ctx.lineTo(
          x,
          H / 2 +
          90
        );
      }

      else {

        const y =
          effect.side ===
          "top"
            ?
            distance
            :
            H -
            distance;


        ctx.moveTo(
          W / 2 -
          90,
          y
        );


        ctx.lineTo(
          W / 2 +
          90,
          y
        );
      }


      ctx.stroke();


      ctx.restore();
    }
  }


  function drawVelocityVectors() {

    if (
      !showVectors.checked
    ) {

      return;
    }


    ctx.save();


    ctx.strokeStyle =
      "rgba(106,205,255,0.62)";


    ctx.lineWidth =
      1;


    const visualScale =
      0.08;


    for (
      const particle
      of particles
    ) {

      const speed =
        Math.hypot(
          particle.vx,
          particle.vy
        );


      if (
        speed <
        EPS
      ) {

        continue;
      }


      ctx.beginPath();


      ctx.moveTo(
        particle.x,
        particle.y
      );


      ctx.lineTo(
        particle.x +
        particle.vx *
        visualScale,

        particle.y +
        particle.vy *
        visualScale
      );


      ctx.stroke();
    }


    ctx.restore();
  }


  function drawNeighborhood() {

    if (
      !showNeighborhood.checked
      ||
      hoveredParticle <
      0
      ||
      !lastGrid
    ) {

      return;
    }


    const particle =
      particles[
        hoveredParticle
      ];


    if (
      !particle
    ) {

      return;
    }


    const radius =
      Number(
        controls
          .neighborRadius
          .value
      );


    const radiusSquared =
      radius *
      radius;


    ctx.save();


    ctx.strokeStyle =
      "rgba(255,207,92,0.30)";


    ctx.lineWidth =
      1;


    ctx.beginPath();


    ctx.arc(
      particle.x,
      particle.y,
      radius,
      0,
      Math.PI *
      2
    );


    ctx.stroke();


    if (
      particle.x <
      radius
    ) {

      ctx.beginPath();


      ctx.arc(
        particle.x +
        W,
        particle.y,
        radius,
        0,
        Math.PI *
        2
      );


      ctx.stroke();
    }


    if (
      particle.x >
      W -
      radius
    ) {

      ctx.beginPath();


      ctx.arc(
        particle.x -
        W,
        particle.y,
        radius,
        0,
        Math.PI *
        2
      );


      ctx.stroke();
    }


    forEachNearby(
      lastGrid,
      particle,
      j => {

        if (
          j ===
          hoveredParticle
        ) {

          return;
        }


        const other =
          particles[j];


        const dx =
          periodicDX(
            other.x -
            particle.x
          );


        const dy =
          other.y -
          particle.y;


        if (
          dx * dx +
          dy * dy
          >
          radiusSquared
        ) {

          return;
        }


        ctx.beginPath();


        ctx.moveTo(
          particle.x,
          particle.y
        );


        ctx.lineTo(
          particle.x +
          dx,
          particle.y +
          dy
        );


        ctx.stroke();
      }
    );


    ctx.fillStyle =
      "#ffd35c";


    ctx.beginPath();


    ctx.arc(
      particle.x,
      particle.y,
      CORE_RADIUS *
      1.9,
      0,
      Math.PI *
      2
    );


    ctx.fill();


    ctx.restore();
  }


  function drawBoundaries() {

    ctx.fillStyle =
      "#071019";


    ctx.fillRect(
      0,
      0,
      W,
      H
    );


    // Solid top/bottom.
    ctx.strokeStyle =
      "#4e7186";


    ctx.lineWidth =
      2;


    ctx.beginPath();


    ctx.moveTo(
      0,
      1
    );


    ctx.lineTo(
      W,
      1
    );


    ctx.moveTo(
      0,
      H - 1
    );


    ctx.lineTo(
      W,
      H - 1
    );


    ctx.stroke();


    // Periodic seam indicators.
    ctx.save();


    ctx.strokeStyle =
      "rgba(103,189,232,0.38)";


    ctx.setLineDash([
      5,
      8
    ]);


    ctx.beginPath();


    ctx.moveTo(
      1,
      0
    );


    ctx.lineTo(
      1,
      H
    );


    ctx.moveTo(
      W - 1,
      0
    );


    ctx.lineTo(
      W - 1,
      H
    );


    ctx.stroke();


    ctx.restore();
  }


  function draw() {

    ctx.clearRect(
      0,
      0,
      W,
      H
    );


    drawBoundaries();


    drawParticles();


    drawVelocityVectors();


    drawNeighborhood();


    drawInjector(
      "left"
    );


    drawInjector(
      "right"
    );


    drawInjector(
      "top"
    );


    drawInjector(
      "bottom"
    );


    drawImpulseVisuals();
  }


  // ============================================================
  // PHYSICS STEP
  // ============================================================

  function physicsStep(
    dt
  ) {

    // Read live shell value.
    collisionRadius =
      Number(
        controls
          .collisionRadius
          .value
      );


    const neighborRadius =
      Number(
        controls
          .neighborRadius
          .value
      );


    // Must cover both relational search
    // and physical collision contact.
    const requestedGridSize =
      Math.max(
        neighborRadius,
        collisionDiameter()
      );


    const relationGrid =
      buildGrid(
        requestedGridSize
      );


    applyRelationalConstraints(
      relationGrid
    );


    integrate(
      dt
    );


    const collisionGrid =
      buildGrid(
        requestedGridSize
      );


    resolveCollisions(
      collisionGrid
    );


    lastGrid =
      collisionGrid;


    calculateGlobalStats();
  }


  // ============================================================
  // MAIN LOOP
  // ============================================================

  function loop(
    now
  ) {

    const frameDelta =
      Math.min(
        0.05,
        (
          now -
          previousTime
        )
        /
        1000
      );


    previousTime =
      now;


    if (
      running
    ) {

      accumulator +=
        frameDelta;


      while (
        accumulator >=
        TIME_STEP
      ) {

        physicsStep(
          TIME_STEP
        );


        accumulator -=
          TIME_STEP;
      }
    }


    draw();


    updateMetrics();


    requestAnimationFrame(
      loop
    );
  }


  // ============================================================
  // BUTTONS
  // ============================================================

  document
    .querySelectorAll(
      "[data-fire]"
    )
    .forEach(
      button => {

        button
          .addEventListener(
            "click",
            () => {

              inject(
                button.dataset.fire
              );
            }
          );
      }
    );


  pauseButton
    .addEventListener(
      "click",
      () => {

        running =
          !running;


        pauseButton.textContent =
          running
            ?
            "Pause"
            :
            "Resume";
      }
    );


  resetButton
    .addEventListener(
      "click",
      () => {

        createParticles();
      }
    );


  // ============================================================
  // MOUSE
  // ============================================================

  canvas
    .addEventListener(
      "mousemove",
      event => {

        const rect =
          canvas
            .getBoundingClientRect();


        const mouseX =
          (
            event.clientX -
            rect.left
          )
          *
          W /
          rect.width;


        const mouseY =
          (
            event.clientY -
            rect.top
          )
          *
          H /
          rect.height;


        let nearest =
          -1;


        let nearestDistanceSquared =
          14 *
          14;


        for (
          let i = 0;
          i < particles.length;
          i++
        ) {

          const particle =
            particles[i];


          const dx =
            periodicDX(
              particle.x -
              mouseX
            );


          const dy =
            particle.y -
            mouseY;


          const distanceSquared =
            dx * dx +
            dy * dy;


          if (
            distanceSquared <
            nearestDistanceSquared
          ) {

            nearestDistanceSquared =
              distanceSquared;


            nearest =
              i;
          }
        }


        hoveredParticle =
          nearest;
      }
    );


  canvas
    .addEventListener(
      "mouseleave",
      () => {

        hoveredParticle =
          -1;
      }
    );


  // ============================================================
  // START
  // ============================================================
  refreshControlLabels();


  collisionRadius =
    Number(
      controls
        .collisionRadius
        .value
    );


  createParticles();


  requestAnimationFrame(
    loop
  );

})();