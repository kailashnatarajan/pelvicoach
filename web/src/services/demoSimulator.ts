import { BiofeedbackReading, DemoScenario, SignalQuality } from '../types';

class BiofeedbackSimulator {
  private scenario: DemoScenario = 'NORMAL';
  private subscribers: Array<(reading: BiofeedbackReading) => void> = [];
  private intervalId: any = null;
  private isContracting: boolean = false;
  private currentPelvic: number = 5;
  private currentAbdominal: number = 4;

  constructor() {
    this.startStreaming();
  }

  public setScenario(scenario: DemoScenario) {
    this.scenario = scenario;
  }

  public getScenario(): DemoScenario {
    return this.scenario;
  }

  public setContracting(contracting: boolean) {
    this.isContracting = contracting;
  }

  public subscribe(callback: (reading: BiofeedbackReading) => void): () => void {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter((cb) => cb !== callback);
    };
  }

  private startStreaming() {
    if (this.intervalId) return;

    this.intervalId = setInterval(() => {
      const reading = this.generateReading();
      this.subscribers.forEach((cb) => cb(reading));
    }, 150);
  }

  private generateReading(): BiofeedbackReading {
    const jitter = (Math.random() - 0.5) * 4;
    let targetPelvic = 5;
    let targetAbdominal = 5;
    let signalQuality: SignalQuality = 'GOOD';

    if (this.isContracting) {
      switch (this.scenario) {
        case 'NORMAL':
          targetPelvic = 78 + jitter;
          targetAbdominal = 14 + Math.random() * 3;
          signalQuality = 'GOOD';
          break;
        case 'COMPENSATION':
          targetPelvic = 75 + jitter;
          targetAbdominal = 58 + jitter;
          signalQuality = 'GOOD';
          break;
        case 'WEAK':
          targetPelvic = 40 + jitter;
          targetAbdominal = 12 + Math.random() * 2;
          signalQuality = 'GOOD';
          break;
        case 'POOR_SIGNAL':
          targetPelvic = Math.max(0, 15 + jitter * 2);
          targetAbdominal = Math.max(0, 8 + jitter);
          signalQuality = 'POOR';
          break;
        case 'INTERFERENCE':
          targetPelvic = Math.floor(Math.random() * 95);
          targetAbdominal = Math.floor(Math.random() * 85);
          signalQuality = 'NOISY';
          break;
      }
    } else {
      targetPelvic = 6 + Math.random() * 3;
      targetAbdominal = 5 + Math.random() * 2;
      if (this.scenario === 'POOR_SIGNAL') signalQuality = 'POOR';
      if (this.scenario === 'INTERFERENCE') signalQuality = 'NOISY';
    }

    const alpha = 0.35;
    this.currentPelvic = Math.round(this.currentPelvic + (targetPelvic - this.currentPelvic) * alpha);
    this.currentAbdominal = Math.round(this.currentAbdominal + (targetAbdominal - this.currentAbdominal) * alpha);

    return {
      pelvic_activity: Math.max(0, Math.min(100, this.currentPelvic)),
      abdominal_activity: Math.max(0, Math.min(100, this.currentAbdominal)),
      signal_quality: signalQuality,
      timestamp: Date.now(),
    };
  }
}

export const demoSimulator = new BiofeedbackSimulator();
