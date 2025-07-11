import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { clerkClient } from '@clerk/nextjs/server';

import prismadb from '@/lib/prismadb';

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    const body = await req.json();

    const { name } = body;

    if (!userId) {
      return new NextResponse('Unauthorized', { status: 403 });
    }

    if (!name) {
      return new NextResponse('Name is required', { status: 400 });
    }

    // Get user subscription details
    const user = await clerkClient.users.getUser(userId);
    const metadata = user.publicMetadata as any;
    const isSubscribed = metadata?.isSubscribed || false;
    const planDetails = metadata?.planDetails;
    
    if (!isSubscribed || !planDetails) {
      return new NextResponse('Subscription required to create stores', { status: 403 });
    }

    // Check if subscription is expired
    if (planDetails.subscriptionEndDate) {
      const endDate = new Date(planDetails.subscriptionEndDate);
      const now = new Date();
      if (now > endDate) {
        return new NextResponse('Subscription expired', { status: 403 });
      }
    }

    // Get current store count
    const existingStores = await prismadb.store.findMany({
      where: {
        userId,
      },
    });

    // Check store limit
    if (planDetails.storesAllowed !== -1 && existingStores.length >= planDetails.storesAllowed) {
      return new NextResponse(`Store limit reached. Maximum allowed: ${planDetails.storesAllowed}`, { status: 403 });
    }

    const store = await prismadb.store.create({
      data: {
        name,
        userId,
      },
    });

    return NextResponse.json(store);
  } catch (error) {
    console.log('[STORES_POST]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { userId } = auth();

    if (!userId) {
      return new NextResponse('Unauthorized', { status: 403 });
    }

    const stores = await prismadb.store.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(stores);
  } catch (error) {
    console.log('[STORES_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}