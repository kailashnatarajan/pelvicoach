/* mqttService.ts
 * Global persistent MQTT connection service.
 * Connects to HiveMQ WebSocket broker and subscribes to Wokwi telemetry topic.
 * Keeps connection active across tab navigation so live POT changes are never lost.
 */

export interface MqttPacket {
  pf: number;      // Pelvic floor value (0 - 100 or raw)
  ab: number;      // Abdominal value
  mr: number;      // Mains ratio (e.g. 0.02 - 0.05, >0.35 if noise)
  q: number;       // 0=ok, 1=lift-off, 2=mains noise
  ts: number;      // Timestamp
  rawText?: string;
}

export type MqttConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

type PacketListener = (packet: MqttPacket) => void;
type StatusListener = (status: MqttConnectionStatus, error?: string) => void;

class MqttServiceSingleton {
  private client: any = null;
  private status: MqttConnectionStatus = 'disconnected';
  private errorMessage: string = '';
  private lastPacket: MqttPacket | null = null;
  private packetCount: number = 0;

  private packetListeners: Set<PacketListener> = new Set();
  private statusListeners: Set<StatusListener> = new Set();

  public readonly brokerUrl = 'wss://broker.hivemq.com:8884/mqtt';
  public readonly topic = 'medaithon/pfm13/win';

  public getStatus(): MqttConnectionStatus {
    return this.status;
  }

  public getErrorMessage(): string {
    return this.errorMessage;
  }

  public getLastPacket(): MqttPacket | null {
    return this.lastPacket;
  }

  public getPacketCount(): number {
    return this.packetCount;
  }

  public addPacketListener(listener: PacketListener): () => void {
    this.packetListeners.add(listener);
    if (this.lastPacket) listener(this.lastPacket);
    return () => this.packetListeners.delete(listener);
  }

  public addStatusListener(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    listener(this.status, this.errorMessage);
    return () => this.statusListeners.delete(listener);
  }

  private notifyStatus(newStatus: MqttConnectionStatus, error = '') {
    this.status = newStatus;
    this.errorMessage = error;
    this.statusListeners.forEach((l) => l(newStatus, error));
  }

  public connect(): void {
    if (this.status === 'connected' || this.status === 'connecting') {
      return;
    }

    const mqtt = (window as any).mqtt;
    if (!mqtt) {
      this.notifyStatus('error', 'MQTT library is not available in window.mqtt');
      return;
    }

    this.notifyStatus('connecting');

    try {
      const clientId = 'pelvicoach_' + Math.random().toString(16).slice(2, 10);
      this.client = mqtt.connect(this.brokerUrl, {
        clientId,
        clean: true,
        connectTimeout: 7000,
        reconnectPeriod: 3000,
      });

      this.client.on('connect', () => {
        console.info('[PelviCoach MQTT] Connected to HiveMQ broker. Subscribing to', this.topic);
        this.client.subscribe(this.topic, (err: any) => {
          if (!err) {
            this.notifyStatus('connected');
          } else {
            this.notifyStatus('error', 'Subscribe failed: ' + (err?.message || 'unknown'));
          }
        });
      });

      this.client.on('message', (_top: string, payload: any) => {
        const text = payload.toString();
        const pkt = this.parsePayload(text);
        this.lastPacket = pkt;
        this.packetCount++;
        this.packetListeners.forEach((l) => l(pkt));
      });

      this.client.on('error', (err: any) => {
        console.warn('[PelviCoach MQTT] Error:', err);
        this.notifyStatus('error', err?.message || 'MQTT Connection Error');
      });

      this.client.on('close', () => {
        if (this.status === 'connected' || this.status === 'connecting') {
          this.notifyStatus('disconnected');
        }
      });
    } catch (e: any) {
      this.notifyStatus('error', e?.message || 'Failed to initialize MQTT');
    }
  }

  public disconnect(): void {
    if (this.client) {
      try {
        this.client.end(true);
      } catch {
        // ignore
      }
      this.client = null;
    }
    this.notifyStatus('disconnected');
  }

  /**
   * Resilient payload parser: Handles JSON objects, raw numbers, ESP32 ADC (0-4095),
   * and potentiometer keys { pf, pot, pot1, val, value, squeeze, adc, etc. }
   */
  private parsePayload(text: string): MqttPacket {
    let pf = 0;
    let ab = 0;
    let mr = 0.03;

    try {
      const parsed = JSON.parse(text);
      if (typeof parsed === 'number') {
        pf = parsed;
      } else if (typeof parsed === 'object' && parsed !== null) {
        // Pelvic floor contraction / potentiometer reading
        pf =
          parsed.pf ??
          parsed.pelvic ??
          parsed.pot ??
          parsed.pot1 ??
          parsed.adc ??
          parsed.val ??
          parsed.value ??
          parsed.squeeze ??
          0;

        // Abdominal channel reading
        ab =
          parsed.ab ??
          parsed.abdomen ??
          parsed.abdominal ??
          parsed.pot2 ??
          parsed.tummy ??
          0;

        // Mains 50Hz ratio
        mr = parsed.mr ?? parsed.mains ?? parsed.noise ?? 0.03;
      }
    } catch {
      const num = parseFloat(text);
      if (!isNaN(num)) pf = num;
    }

    // If ESP32 12-bit ADC raw range (e.g. 0 to 4095), scale to 0 - 100 percentage
    if (pf > 130 && pf <= 4095) {
      pf = (pf / 4095) * 100;
    }
    if (ab > 130 && ab <= 4095) {
      ab = (ab / 4095) * 100;
    }

    // Determine quality: flat / lift-off if pf < 1.5, mains noise if mr > 0.35
    const q = pf < 1.5 ? 1 : mr > 0.35 ? 2 : 0;

    return {
      pf: Math.max(0, Math.min(130, pf)),
      ab: Math.max(0, Math.min(130, ab)),
      mr,
      q,
      ts: Date.now(),
      rawText: text,
    };
  }
}

export const MqttService = new MqttServiceSingleton();
