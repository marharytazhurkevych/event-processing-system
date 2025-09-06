#!/usr/bin/env node

import { connect, NatsConnection, JetStreamManager, StreamConfig } from 'nats';
import { config } from 'dotenv';

config();

const NATS_URL = process.env.NATS_URL || 'nats://localhost:4222';

interface StreamDefinition {
  name: string;
  subjects: string[];
  config: Partial<StreamConfig>;
}

const STREAMS: StreamDefinition[] = [
  {
    name: 'EVENTS',
    subjects: ['events.*'],
    config: {
      retention: 'limits' as any,
      max_age: 24 * 60 * 60 * 1000 * 1000 * 1000, // 24 hours in nanoseconds
      max_bytes: 1024 * 1024 * 1024, // 1GB
      max_msgs: 1000000,
      storage: 'file' as any,
      
    },
  },
  {
    name: 'FACEBOOK_EVENTS',
    subjects: ['events.facebook.*'],
    config: {
      retention: 'limits' as any,
      max_age: 7 * 24 * 60 * 60 * 1000 * 1000 * 1000, // 7 days
      max_bytes: 2 * 1024 * 1024 * 1024, // 2GB
      max_msgs: 2000000,
      storage: 'file' as any,
      
    },
  },
  {
    name: 'TIKTOK_EVENTS',
    subjects: ['events.tiktok.*'],
    config: {
      retention: 'limits' as any,
      max_age: 7 * 24 * 60 * 60 * 1000 * 1000 * 1000, // 7 days
      max_bytes: 2 * 1024 * 1024 * 1024, // 2GB
      max_msgs: 2000000,
      storage: 'file' as any,
      
    },
  },
];

async function initializeNATS(): Promise<void> {
  let nc: NatsConnection | null = null;
  
  try {
    console.log('🚀 Connecting to NATS JetStream...');
    console.log(`📍 URL: ${NATS_URL}`);
    
    nc = await connect({
      servers: NATS_URL,
      timeout: 10000,
    });
    
    console.log('✅ Connected to NATS');
    
    const jsm = await nc.jetstreamManager();
    console.log('✅ JetStream Manager initialized');
    
    // Initialize streams
    for (const streamDef of STREAMS) {
      try {
        console.log(`📦 Initializing stream: ${streamDef.name}`);
        
        const streamInfo = await jsm.streams.info(streamDef.name);
        console.log(`✅ Stream ${streamDef.name} already exists`);
        
        // Update stream configuration if needed
        await jsm.streams.update(streamDef.name, streamDef.config);
        console.log(`🔄 Stream ${streamDef.name} configuration updated`);
        
      } catch (error: any) {
        if (error.code === '404') {
          // Stream doesn't exist, create it
          await jsm.streams.add({
            name: streamDef.name,
            subjects: streamDef.subjects,
            ...streamDef.config,
          });
          console.log(`✅ Stream ${streamDef.name} created`);
        } else {
          console.error(`❌ Error with stream ${streamDef.name}:`, error.message);
        }
      }
    }
    
    // List all streams
    const streams = await jsm.streams.list();
    console.log('\n📋 Available streams:');
    for await (const stream of streams) {
      console.log(`  - ${stream.config.name}: ${stream.config.subjects.join(', ')}`);
    }
    
    console.log('\n🎉 NATS JetStream initialization completed successfully!');
    
  } catch (error: any) {
    console.error('❌ Failed to initialize NATS JetStream:', error.message);
    process.exit(1);
  } finally {
    if (nc) {
      await nc.close();
      console.log('🔌 NATS connection closed');
    }
  }
}

// Run initialization
if (require.main === module) {
  initializeNATS().catch(console.error);
}

export { initializeNATS, STREAMS };
