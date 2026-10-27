import {
  Activity,
  CheckCircle2,
  Cpu,
  ExternalLink,
  Flame,
  Radio,
  RefreshCw,
  Wifi,
  WifiOff,
  Zap,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { MqttConnectionStatus, MqttPacket, MqttService } from '../services/mqttService';

export interface WokwiHardwareProps {
  onLivePacketReceived?: (packet: MqttPacket) => void;
  isDrivingBiofeedback?: boolean;
  onToggleDriveBiofeedback?: (enabled: boolean) => void;
}

export const WokwiHardwareCard: React.FC<WokwiHardwareProps> = ({
  onLivePacketReceived,
  isDrivingBiofeedback = true,
  onToggleDriveBiofeedback,
}) => {
  const [mqttStatus, setMqttStatus] = useState<MqttConnectionStatus>(() => MqttService.getStatus());
  const [errorMessage, setErrorMessage] = useState<string>(() => MqttService.getErrorMessage());
  const [lastPacket, setLastPacket] = useState<MqttPacket | null>(() => MqttService.getLastPacket());
  const [packetCount, setPacketCount] = useState<number>(() => MqttService.getPacketCount());

  useEffect(() => {
    const unsubStatus = MqttService.addStatusListener((status, err) => {
      setMqttStatus(status);
      setErrorMessage(err || '');
    });

    const unsubPacket = MqttService.addPacketListener((pkt) => {
      setLastPacket(pkt);
      setPacketCount(MqttService.getPacketCount());
      if (onLivePacketReceived) {
        onLivePacketReceived(pkt);
      }
    });

    return () => {
      unsubStatus();
      unsubPacket();
    };
  }, [onLivePacketReceived]);

  const handleConnect = () => {
    MqttService.connect();
  };

  const handleDisconnect = () => {
    MqttService.disconnect();
  };

  return (
    <div className="card" style={{ padding: '24px' }}>
      {/* Title & Badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '20px',
              background: '#F0FDF4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#16A34A',
            }}
          >
            <Cpu size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: '22px', fontWeight: 900, color: '#0F172A' }}>Wokwi Hardware Simulation</h3>
              <span
                style={{
                  background: '#DCFCE7',
                  color: '#15803D',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 800,
                }}
              >
                ESP32 Hardware Mode
              </span>
            </div>
            <p style={{ fontSize: '13px', color: '#64748B', fontWeight: 600 }}>
              Live embedded ESP32 virtual microcontroller & HiveMQ MQTT real-time stream
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <a
            href="https://wokwi.com/projects/479042234800192513"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '10px',
              border: '1.5px solid #CBD5E1',
              background: '#FFFFFF',
              color: '#334155',
              fontSize: '13px',
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            <ExternalLink size={15} />
            Open in Wokwi (New Tab)
          </a>
        </div>
      </div>

      {/* Mode Isolation Alert */}
      <div
        style={{
          background: '#F8FAFC',
          borderLeft: '4px solid #16A34A',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '20px',
          fontSize: '13px',
          color: '#334155',
        }}
      >
        <b>Clean Two-Mode Architecture:</b> Wokwi hardware simulation runs independently from the synthetic session file replay. When connected below, turning the potentiometer (POT) in the embedded Wokwi simulator will directly stream live telemetry into your PelviCoach Biofeedback Screen!
      </div>

      {/* MQTT Telemetry Control Strip */}
      <div
        style={{
          background: '#0F172A',
          color: '#FFFFFF',
          borderRadius: '14px',
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '6px',
              background:
                mqttStatus === 'connected'
                  ? '#22C55E'
                  : mqttStatus === 'connecting'
                  ? '#EAB308'
                  : mqttStatus === 'error'
                  ? '#EF4444'
                  : '#94A3B8',
              boxShadow: mqttStatus === 'connected' ? '0 0 10px #22C55E' : 'none',
            }}
          />
          <div>
            <div style={{ fontSize: '14px', fontWeight: 800 }}>
              Broker: <span style={{ color: '#93C5FD' }}>{MqttService.brokerUrl}</span>
            </div>
            <div style={{ fontSize: '12px', color: '#94A3B8' }}>
              Topic: <code style={{ color: '#FCD34D' }}>{MqttService.topic}</code> · Status:{' '}
              <b>{mqttStatus.toUpperCase()}</b>
              {packetCount > 0 && ` · Packets Received: ${packetCount}`}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {onToggleDriveBiofeedback && (
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                fontWeight: 700,
                color: '#E2E8F0',
                cursor: 'pointer',
                marginRight: '8px',
              }}
            >
              <input
                type="checkbox"
                checked={isDrivingBiofeedback}
                onChange={(e) => onToggleDriveBiofeedback(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: '#16A34A', cursor: 'pointer' }}
              />
              Drive Biofeedback Screen
            </label>
          )}

          {mqttStatus === 'connected' ? (
            <button
              onClick={handleDisconnect}
              style={{
                background: '#EF4444',
                color: '#FFFFFF',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <WifiOff size={16} />
              Disconnect
            </button>
          ) : (
            <button
              onClick={handleConnect}
              disabled={mqttStatus === 'connecting'}
              style={{
                background: '#16A34A',
                color: '#FFFFFF',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Wifi size={16} />
              {mqttStatus === 'connecting' ? 'Connecting...' : 'Connect MQTT'}
            </button>
          )}
        </div>
      </div>

      {errorMessage && (
        <div
          style={{
            background: '#FEE2E2',
            border: '1px solid #FCA5A5',
            color: '#DC2626',
            padding: '10px 14px',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: 700,
            marginBottom: '16px',
          }}
        >
          {errorMessage}
        </div>
      )}

      {/* Live Packet Telemetry Badges */}
      {lastPacket && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '10px',
            marginBottom: '20px',
            padding: '14px',
            background: '#F0FDF4',
            borderRadius: '12px',
            border: '1px solid #BBF7D0',
          }}
        >
          <div>
            <span style={{ fontSize: '11px', color: '#166534', fontWeight: 700, textTransform: 'uppercase' }}>
              Pelvic Contraction (pf)
            </span>
            <div style={{ fontSize: '20px', fontWeight: 900, color: '#14532D' }}>
              {lastPacket.pf.toFixed(1)} <span style={{ fontSize: '12px' }}>%</span>
            </div>
          </div>
          <div>
            <span style={{ fontSize: '11px', color: '#166534', fontWeight: 700, textTransform: 'uppercase' }}>
              Abdominal (ab)
            </span>
            <div style={{ fontSize: '20px', fontWeight: 900, color: '#14532D' }}>
              {lastPacket.ab.toFixed(1)} <span style={{ fontSize: '12px' }}>%</span>
            </div>
          </div>
          <div>
            <span style={{ fontSize: '11px', color: '#166534', fontWeight: 700, textTransform: 'uppercase' }}>
              Mains 50Hz Ratio (mr)
            </span>
            <div
              style={{
                fontSize: '20px',
                fontWeight: 900,
                color: lastPacket.mr > 0.35 ? '#DC2626' : '#14532D',
              }}
            >
              {(lastPacket.mr * 100).toFixed(0)}% {lastPacket.mr > 0.35 && '⚠️ NOISE'}
            </div>
          </div>
          <div>
            <span style={{ fontSize: '11px', color: '#166534', fontWeight: 700, textTransform: 'uppercase' }}>
              Status
            </span>
            <div style={{ fontSize: '15px', fontWeight: 800, color: '#15803D', marginTop: '2px' }}>
              Streaming Live
            </div>
          </div>
        </div>
      )}

      {/* Embedded Wokwi Simulator Iframe */}
      <div
        style={{
          borderRadius: '14px',
          overflow: 'hidden',
          border: '2px solid #E2E8F0',
          boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
          background: '#1E293B',
          height: '560px',
        }}
      >
        <iframe
          src="https://wokwi.com/projects/479042234800192513"
          title="Wokwi ESP32 Pelvic Coach Hardware Simulation"
          width="100%"
          height="100%"
          style={{ border: 'none', display: 'block' }}
          allow="autoplay; clipboard-write"
          loading="lazy"
        />
      </div>
    </div>
  );
};
