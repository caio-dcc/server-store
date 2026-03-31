'use client';

import { useEffect, useState, useRef } from 'react';
import { Box, Group, Stack, Text, TextInput, ActionIcon, ScrollArea, Button, Title, FileButton, Flex, Badge, Loader } from '@mantine/core';
import { Send, Upload, Play, Pause, ArrowLeft, VolumeX, Volume2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Arena3D from '@/components/Arena3D';

interface Message {
  id: string;
  user: string;
  text: string;
  timestamp: number;
}

export default function ChatRoom() {
  const { id } = useParams();
  const roomId = `room_${id}`;

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Realtime Sync States
  const [channel, setChannel] = useState<any>(null);
  const [onlineUsers, setOnlineUsers] = useState(0);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialization
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setCurrentUser(data.session?.user || null);
    });

    const roomChannel = supabase.channel(roomId, {
      config: {
        broadcast: { ack: false },
        presence: { key: 'user' }
      }
    });

    roomChannel
      .on('broadcast', { event: 'new_message' }, (payload) => {
        setMessages((prev) => [...prev, payload.payload]);
      })
      .on('presence', { event: 'sync' }, () => {
        const state = roomChannel.presenceState();
        setOnlineUsers(Object.keys(state).length);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track user presence
          const { data } = await supabase.auth.getSession();
          roomChannel.track({
            user_id: data.session?.user?.id || 'anonymous',
            online_at: new Date().toISOString()
          });
        }
      });

    setChannel(roomChannel);

    return () => {
      roomChannel.unsubscribe();
    };
  }, [roomId]);

  // Auto-scroll chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // 2D Mockup logic removed in favor of Arena3D component

  const sendMessage = () => {
    if (!inputText.trim() || !channel) return;

    const userName = currentUser?.user_metadata?.full_name?.split(' ')[0] || currentUser?.email?.split('@')[0] || 'Anônimo';
    
    const msg: Message = {
      id: Math.random().toString(36).substr(2, 9),
      user: userName,
      text: inputText,
      timestamp: Date.now(),
    };

    channel.send({
      type: 'broadcast',
      event: 'new_message',
      payload: msg
    });

    setMessages((prev) => [...prev, msg]);
    setInputText('');
  };

  // Completely overlay global layout
  return (
    <Flex style={{ position: 'fixed', inset: 0, zIndex: 1500, backgroundColor: '#000', color: '#fff' }}>
      
      {/* Left - Sidebar (10%) */}
      <Box w={{ base: '100%', sm: '10%' }} h="100%" p="md" style={{ borderRight: '1px solid #1a1a1a', backgroundColor: '#060606', display: 'flex', flexDirection: 'column' }}>
        <Title order={2} c="rubyRed" style={{ fontStyle: 'italic' }}>$erver</Title>
        <Badge mt="sm" color="green" variant="dot">{onlineUsers} Online</Badge>
        
        <Stack mt="xl" style={{ flex: 1 }}>
          <Text c="dimmed" size="xs" fw={700} tt="uppercase">Navegação Principal</Text>
          <Button variant="subtle" color="gray" justify="flex-start" component={Link} href="/">Home</Button>
          <Button variant="subtle" color="gray" justify="flex-start" component={Link} href="/colecoes">Vitrine</Button>
        </Stack>
        
        <Button fullWidth color="dark" variant="outline" leftSection={<ArrowLeft size={16}/>} component={Link} href="/">
          Voltar à Loja
        </Button>
      </Box>

      {/* Center - Arena (75%) */}
      <Box w={{ base: '100%', sm: '75%' }} h="100%" style={{ position: 'relative' }}>
        <Arena3D />
      </Box>

      {/* Right - Chat (15%) */}
      <Box w={{ base: '100%', sm: '15%' }} h="100%" p="md" style={{ borderLeft: '1px solid #1a1a1a', backgroundColor: '#0a0a0a', display: 'flex', flexDirection: 'column' }}>
        <Group justify="space-between" mb="md">
          <Title order={4}>Chat ao Vivo</Title>
          <Badge color="blue" variant="light">#{id}</Badge>
        </Group>

        <ScrollArea viewportRef={scrollRef} style={{ flex: 1, backgroundColor: '#000', borderRadius: '8px', padding: '10px', border: '1px solid #1a1a1a' }}>
          <Stack gap="xs">
            {messages.map((msg) => (
              <Box key={msg.id} style={{ backgroundColor: '#111', padding: '8px 12px', borderRadius: '8px' }}>
                <Group justify="space-between" mb={4}>
                  <Text size="sm" fw={700} c={msg.user === (currentUser?.user_metadata?.full_name?.split(' ')[0] || currentUser?.email?.split('@')[0]) ? 'rubyRed' : 'blue'}>
                    {msg.user}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </Group>
                <Text size="sm">{msg.text}</Text>
              </Box>
            ))}
          </Stack>
        </ScrollArea>

        <Group mt="md" align="center" wrap="nowrap">
          <TextInput 
            placeholder="Digite sua mensagem..." 
            value={inputText}
            onChange={(e) => setInputText(e.currentTarget.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            style={{ flex: 1 }}
            styles={{ input: { backgroundColor: '#111', color: '#fff', borderColor: '#222' } }}
          />
          <ActionIcon color="rubyRed" size="lg" onClick={sendMessage}>
            <Send size={18} />
          </ActionIcon>
        </Group>
      </Box>

    </Flex>
  );
}
