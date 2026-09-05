import { interpretationContractVersion, type InterpretationInput, type InterpretationOutput, type InterpretationProvider } from './contracts.js';
import type { ModelRuntime } from './runtime.js';
export class StructuredLlmInterpretationProvider implements InterpretationProvider {
  readonly interpreterId: string; readonly interpreterVersion = '1.0.0'; readonly contractVersion = interpretationContractVersion;
  constructor(private readonly runtime: ModelRuntime) { this.interpreterId = runtime.runtimeId; }
  async interpret(input: InterpretationInput): Promise<InterpretationOutput> { const generated=await this.runtime.generateStructured(input); return generated.output as InterpretationOutput; }
}
