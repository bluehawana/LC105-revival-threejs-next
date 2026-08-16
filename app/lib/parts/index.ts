import type * as THREE from "three";
import type { SystemId } from "../lc105-data";
import { buildChassis } from "./chassis";
import { buildFuel } from "./fuel";
import { buildFrontAxle, buildRearAxle } from "./axles";
import { buildFrontSuspension, buildRearSuspension } from "./suspension";
import { buildTransfer } from "./transfer";
import { buildTransmission } from "./transmission";
import { buildEngine } from "./engine";
import { buildRadiator } from "./radiator";
import { buildBodyLower, buildBodyUpper } from "./body";
import { buildCabin } from "./cabin";
import { buildWheels } from "./wheels";

/**
 * SystemId → procedural builder. Every builder returns a fresh THREE.Group
 * modelled around its own local origin; the viewer places it at the part's
 * `assembled` position from lc105-data.ts.
 *
 * To add a part: write a builder file, register it here, add a SystemSpec.
 */
export const BUILDERS: Record<SystemId, () => THREE.Group> = {
  chassis: buildChassis,
  fuel: buildFuel,
  "front-axle": buildFrontAxle,
  "rear-axle": buildRearAxle,
  "front-suspension": buildFrontSuspension,
  "rear-suspension": buildRearSuspension,
  transfer: buildTransfer,
  transmission: buildTransmission,
  engine: buildEngine,
  radiator: buildRadiator,
  "body-lower": buildBodyLower,
  "body-upper": buildBodyUpper,
  cabin: buildCabin,
  wheels: buildWheels,
};
