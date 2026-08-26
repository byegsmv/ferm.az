'use client';

import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';

export default function LiveMonitoringPage() {
  const [logs, setLogs] = useState([]);
  const [connected, setConnected] = useState(false);
  const [sysInfo, setSysInfo] = useState(null);

  useEffect(() => {
    // Connect to monitor server on port 4000
    const socket = io('http://localhost:4000');

    socket.on('connect', () => {
      setConnected(true);
      console.log('Connected to log server');
    });

    socket.on('disconnect', () => {
      setConnected(false);
      console.log('Disconnected from log server');
    });

    socket.on('log', (logEntry) => {
      setLogs((prevLogs) => {
        const newLogs = [...prevLogs, logEntry];
        return newLogs.slice(-100); // Keep last 100 logs
      });
    });
    
    socket.on('sysinfo', (info) => {
      setSysInfo(info);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="admin-layout min-h-screen bg-[var(--bg)] p-8 w-full flex justify-center">
      <div className="max-w-5xl w-full">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-extrabold">Canlı Monitorinq</h1>
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
            <span className="font-semibold">{connected ? 'Bağlantı Quruldu' : 'Bağlantı Yoxdur'}</span>
          </div>
        </div>
        
        {sysInfo && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="stat-card p-4">
              <h3 className="stat-label">CPU Yükü</h3>
              <p className="text-xl font-bold">{sysInfo.cpuLoad}%</p>
            </div>
            <div className="stat-card p-4">
              <h3 className="stat-label">Boş Yaddaş (RAM)</h3>
              <p className="text-xl font-bold">{sysInfo.freeMemMB} MB</p>
            </div>
            <div className="stat-card p-4">
              <h3 className="stat-label">Cəmi Yaddaş (RAM)</h3>
              <p className="text-xl font-bold">{sysInfo.totalMemMB} MB</p>
            </div>
            <div className="stat-card p-4">
              <h3 className="stat-label">Sistem İşləmə Müddəti</h3>
              <p className="text-xl font-bold">{sysInfo.uptimeHours} saat</p>
            </div>
          </div>
        )}

        <div className="card-flat bg-gray-900 h-[500px] flex flex-col">
          <div className="bg-gray-800 p-3 border-b border-gray-700 flex justify-between items-center">
            <h3 className="text-white font-mono text-sm">Server Logs (Terminal)</h3>
            <button onClick={() => setLogs([])} className="btn-xs bg-gray-700 hover:bg-gray-600 text-white">Təmizlə</button>
          </div>
          <div className="p-4 flex-1 overflow-y-auto font-mono text-sm text-green-400 space-y-1">
            {logs.length === 0 ? (
              <p className="text-gray-500 italic">Log gözlənilir...</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="break-all">{log}</div>
              ))
            )}
          </div>
        </div>
        
        <div className="mt-6">
          <a href="/admin" className="btn-secondary">Geri Qayıt</a>
        </div>
      </div>
    </div>
  );
}
