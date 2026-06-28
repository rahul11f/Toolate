import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const pendingBookings = await prisma.viewingBooking.findMany({
    where: { status: 'PENDING' },
    include: { listing: true }
  });

  console.log(`Found ${pendingBookings.length} pending bookings.`);

  for (const booking of pendingBookings) {
    // We update the notification that is missing actionData
    await prisma.notification.updateMany({
       where: { 
         title: 'New Viewing Request', 
         userId: booking.listing.userId,
         type: null 
       },
       data: {
         type: 'VIEWING_REQUEST',
         actionData: JSON.stringify({ bookingId: booking.id, listingId: booking.listingId })
       }
    });
    console.log(`Updated notifications for booking ${booking.id}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
