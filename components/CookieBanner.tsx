'use client';

import { useState, useEffect } from 'react';
import { Paper, Text, Group, Button, Transition, Box } from '@mantine/core';
import { Cookie } from 'lucide-react';

export function CookieBanner() {
  const [opened, setOpened] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setOpened(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setOpened(false);
  };

  const handleDecline = () => {
    localStorage.setItem('cookie-consent', 'declined');
    setOpened(false);
  };

  return (
    <Transition mounted={opened} transition="slide-up" duration={400} timingFunction="ease">
      {(styles) => (
        <Paper 
          withBorder 
          p="md" 
          shadow="xl" 
          style={{ 
            ...styles, 
            position: 'fixed', 
            bottom: 20, 
            left: 20, 
            right: 20, 
            zIndex: 9999,
            backgroundColor: '#0b0b0b',
            borderColor: '#991b1b',
            maxWidth: 600,
            margin: '0 auto'
          }}
        >
          <Group justify="space-between" wrap="nowrap" gap="xl">
            <Group wrap="nowrap" gap="md">
              <Box style={{ color: '#991b1b' }}>
                <Cookie size={32} />
              </Box>
              <Box>
                <Text fw={700} size="sm">Privacidade e Cookies</Text>
                <Text size="xs" c="dimmed">
                  Nós utilizamos cookies e tecnologias semelhantes para melhorar sua experiência no $erver. 
                  Ao continuar navegando, você concorda com nossa <Text component="a" href="/privacy" c="rubyRed" inherit>Política de Privacidade</Text>.
                </Text>
              </Box>
            </Group>
            <Group wrap="nowrap">
              <Button variant="subtle" color="gray" size="xs" onClick={handleDecline}>Recusar</Button>
              <Button color="rubyRed" size="xs" onClick={handleAccept}>Aceitar</Button>
            </Group>
          </Group>
        </Paper>
      )}
    </Transition>
  );
}
