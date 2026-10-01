import React, { useEffect } from 'react';
import { Navbar } from './Navbar.tsx';
import { Sidebar } from './Sidebar.tsx';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiService } from '../../services/api.ts';
import { subscribeToPortStatus, subscribeToSwitchStatus, subscribeToAlerts } from '../../services/socket.ts';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();

  // Query active alerts to show badge in navbar and sidebar
  const { data: activeAlerts = [] } = useQuery({
    queryKey: ['alerts', 'active'],
    queryFn: ApiService.getActiveAlerts,
    refetchInterval: 15000
  });

  // Setup real-time WebSocket cache invalidations
  useEffect(() => {
    // 1. Port status change (from trap or poll)
    const unsubPort = subscribeToPortStatus((payload) => {
      console.log('[WebSocket Event] Port status change received:', payload);
      queryClient.invalidateQueries({ queryKey: ['interfaces', payload.switchId] });
      queryClient.invalidateQueries({ queryKey: ['switches'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    });

    // 2. Switch reachability change
    const unsubSwitch = subscribeToSwitchStatus((payload) => {
      console.log('[WebSocket Event] Switch status change received:', payload);
      queryClient.invalidateQueries({ queryKey: ['switches'] });
      queryClient.invalidateQueries({ queryKey: ['switch', payload.switchId] });
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    });

    // 3. Alerts triggered or resolved
    const unsubAlerts = subscribeToAlerts(
      (_newAlert) => {
        queryClient.invalidateQueries({ queryKey: ['alerts'] });
        queryClient.invalidateQueries({ queryKey: ['events'] });
      },
      (_resolvedAlert) => {
        queryClient.invalidateQueries({ queryKey: ['alerts'] });
        queryClient.invalidateQueries({ queryKey: ['events'] });
      }
    );

    return () => {
      unsubPort();
      unsubSwitch();
      unsubAlerts();
    };
  }, [queryClient]);

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#0b0f19] text-slate-100 flex flex-col font-sans noc-grid-bg">
      <Navbar activeAlertCount={activeAlerts.length} />
      <div className="flex flex-1 h-[calc(100vh-4rem)] overflow-hidden">
        <Sidebar activeAlertCount={activeAlerts.length} />
        <main className="flex-1 h-full overflow-y-auto overflow-x-hidden p-5 md:p-8">
          <div className="max-w-7xl mx-auto w-full pb-12">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

