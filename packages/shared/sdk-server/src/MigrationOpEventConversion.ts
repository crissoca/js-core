import { internal, TypeValidators } from '@launchdarkly/js-sdk-common';

import {
  LDMigrationConsistencyMeasurement,
  LDMigrationCustomMeasurement,
  LDMigrationErrorMeasurement,
  LDMigrationEvaluation,
  LDMigrationLatencyMeasurement,
  LDMigrationMeasurement,
  LDMigrationOp,
  LDMigrationOpEvent,
} from './api';

function isOperation(value: LDMigrationOp) {
  if (!TypeValidators.String.is(value)) {
    return false;
  }

  return value === 'read' || value === 'write';
}

function isCustomMeasurement(value: LDMigrationMeasurement): value is LDMigrationCustomMeasurement {
  return (value as any).kind === 'custom';
}

function isLatencyMeasurement(
  value: LDMigrationMeasurement,
): value is LDMigrationLatencyMeasurement {
  return (value as any).kind === undefined && value.key === 'latency_ms';
}

function isErrorMeasurement(value: LDMigrationMeasurement): value is LDMigrationErrorMeasurement {
  return (value as any).kind === undefined && value.key === 'error';
}

function isConsistencyMeasurement(
  value: LDMigrationMeasurement,
): value is LDMigrationConsistencyMeasurement {
  return (value as any).kind === undefined && value.key === 'consistent';
}

function areValidValues(values: { old?: number; new?: number }) {
  const oldValue = values.old;
  const newValue = values.new;
  if (oldValue !== undefined && !TypeValidators.Number.is(oldValue)) {
    return false;
  }
  if (newValue !== undefined && !TypeValidators.Number.is(newValue)) {
    return false;
  }
  return true;
}

function validateMeasurement(
  measurement: LDMigrationMeasurement,
): LDMigrationMeasurement | undefined {
  if (!TypeValidators.String.is(measurement.key) || measurement.key === '') {
    return undefined;
  }

  if (isCustomMeasurement(measurement)) {
    if (!TypeValidators.Object.is(measurement.values)) {
      return undefined;
    }
    if (!areValidValues(measurement.values)) {
      return undefined;
    }
    return {
      kind: measurement.kind,
      key: measurement.key,
      values: {
        old: measurement.values.old,
        new: measurement.values.new,
      },
    };
  }

  if (isLatencyMeasurement(measurement)) {
    if (!TypeValidators.Object.is(measurement.values)) {
      return undefined;
    }
    if (!areValidValues(measurement.values)) {
      return undefined;
    }
    return {
      key: measurement.key,
      values: {
        old: measurement.values.old,
        new: measurement.values.new,
      },
    };
  }

  if (isErrorMeasurement(measurement)) {
    if (!TypeValidators.Object.is(measurement.values)) {
      return undefined;
    }
    if (!areValidValues(measurement.values)) {
      return undefined;
    }
    return {
      key: measurement.key,
      values: {
        old: measurement.values.old,
        new: measurement.values.new,
      },
    };
  }

  if (isConsistencyMeasurement(measurement)) {
    if (
      !TypeValidators.Number.is(measurement.value) ||
      !TypeValidators.Number.is(measurement.samplingOdds)
    ) {
      return undefined;
    }
    return {
      key: measurement.key,
      value: measurement.value,
      samplingOdds: measurement.samplingOdds,
    };
  }

  return undefined;
}

function validateMeasurements(measurements: LDMigrationMeasurement[]): LDMigrationMeasurement[] {
  return measurements
    .map(validateMeasurement)
    .filter((value) => value !== undefined) as LDMigrationMeasurement[];
}

function validateEvaluation(evaluation: LDMigrationEvaluation): LDMigrationEvaluation | undefined {
  if (!TypeValidators.String.is(evaluation.key) || evaluation.key === '') {
    return undefined;
  }
  if (!TypeValidators.Object.is(evaluation.reason)) {
    return undefined;
  }
  if (!TypeValidators.String.is(evaluation.reason.kind) || evaluation.reason.kind === '') {
    return undefined;
  }
  const validated: LDMigrationEvaluation = {
    key: evaluation.key,
    value: evaluation.value,
    default: evaluation.default,
    reason: {
      kind: evaluation.reason.kind,
    },
  };

  const inReason = evaluation.reason;
  const outReason = validated.reason;
  if (TypeValidators.String.is(inReason.errorKind)) {
    outReason.errorKind = inReason.errorKind;
  }

  if (TypeValidators.String.is(inReason.ruleId)) {
    outReason.ruleId = inReason.ruleId;
  }

  if (TypeValidators.String.is(inReason.prerequisiteKey)) {
    outReason.ruleId = inReason.ruleId;
  }

  if (TypeValidators.Boolean.is(inReason.inExperiment)) {
    outReason.inExperiment = inReason.inExperiment;
  }

  if (TypeValidators.Number.is(inReason.ruleIndex)) {
    outReason.ruleIndex = inReason.ruleIndex;
  }

  if (TypeValidators.String.is(inReason.bigSegmentsStatus)) {
    outReason.bigSegmentsStatus = inReason.bigSegmentsStatus;
  }

  if (evaluation.variation && TypeValidators.Number.is(evaluation.variation)) {
    validated.variation = evaluation.variation;
  }

  return validated;
}

/**
 * Migration events can be generated directly in user code and may not follow the shape
 * expected by the TypeScript definitions. So we do some validation on these events, as well
 * as copying the data out of them, to reduce the amount of invalid data we may send.
 *
 * @param inEvent The event to process.
 * @returns An event, or undefined if it could not be converted.
 */
export default function MigrationOpEventToInputEvent(
  inEvent: LDMigrationOpEvent,
): internal.InputMigrationEvent | undefined {
  if (inEvent.kind !== 'migration_op') {
    return undefined;
  }

  if (!isOperation(inEvent.operation)) {
    return undefined;
  }

  if (!TypeValidators.Object.is(inEvent.contextKeys)) {
    return undefined;
  }

  if (!TypeValidators.Number.is(inEvent.creationDate)) {
    return undefined;
  }

  if (!Object.keys(inEvent.contextKeys).every((key) => TypeValidators.Kind.is(key))) {
    return undefined;
  }

  if (
    !Object.values(inEvent.contextKeys).every(
      (value) => TypeValidators.String.is(value) && value !== '',
    )
  ) {
    return undefined;
  }

  const evaluation = validateEvaluation(inEvent.evaluation);

  if (!evaluation) {
    return undefined;
  }

  return {
    kind: inEvent.kind,
    operation: inEvent.operation,
    creationDate: inEvent.creationDate,
    contextKeys: { ...inEvent.contextKeys },
    measurements: validateMeasurements(inEvent.measurements),
    evaluation,
  };
}
