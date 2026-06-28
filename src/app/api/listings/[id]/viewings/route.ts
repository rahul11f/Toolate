import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { sendEmail } from '@/lib/mail';

export const dynamic = 'force-dynamic';

// GET: Retrieve slots and bookings for a listing
export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const { id: listingId } = await props.params;
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const sessionUserId = (session.user as any).id;

    // Check listing exists and owner status
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { userId: true },
    });

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    const isOwner = listing.userId === sessionUserId;

    // Fetch slots
    const slots = await prisma.viewingSlot.findMany({
      where: { listingId },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });

    // Fetch bookings based on auth role
    let bookings = [];
    if (isOwner) {
      bookings = await prisma.viewingBooking.findMany({
        where: { listingId },
        include: {
          tenant: {
            select: { name: true, email: true },
          },
          slot: true,
        },
        orderBy: { date: 'asc' },
      });
    } else {
      bookings = await prisma.viewingBooking.findMany({
        where: { listingId, tenantId: sessionUserId },
        include: {
          slot: true,
        },
        orderBy: { date: 'asc' },
      });
    }

    return NextResponse.json({ isOwner, slots, bookings });
  } catch (error: any) {
    console.error('Error fetching viewings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Add slot (owner) or book slot (tenant)
export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const { id: listingId } = await props.params;
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const sessionUserId = (session.user as any).id;

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: {
        user: { select: { email: true, name: true } },
      },
    });

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    const isOwner = listing.userId === sessionUserId;
    const body = await req.json();

    if (body.action === 'create_slot') {
      // Landlord creating available slot
      if (!isOwner) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const { dayOfWeek, startTime, endTime } = body;
      if (dayOfWeek === undefined || dayOfWeek < 0 || dayOfWeek > 7 || !startTime || !endTime) {
        return NextResponse.json({ error: 'Missing or invalid slot details' }, { status: 400 });
      }

      const slot = await prisma.viewingSlot.create({
        data: {
          listingId,
          dayOfWeek: parseInt(dayOfWeek),
          startTime,
          endTime,
        },
      });

      return NextResponse.json({ success: true, slot });
    } else if (body.action === 'book_slot') {
      // Tenant booking slot
      if (isOwner) {
        return NextResponse.json({ error: 'You cannot book your own listing' }, { status: 400 });
      }

      const { slotId, date, message } = body;
      if (!slotId || !date) {
        return NextResponse.json({ error: 'Missing booking details' }, { status: 400 });
      }

      const slot = await prisma.viewingSlot.findFirst({
        where: { id: slotId, listingId },
      });

      if (!slot) {
        return NextResponse.json({ error: 'Slot not found' }, { status: 404 });
      }

      const bookingDate = new Date(date);

      const booking = await prisma.viewingBooking.create({
        data: {
          slotId,
          listingId,
          tenantId: sessionUserId,
          date: bookingDate,
          message: message || '',
          status: 'PENDING',
        },
      });

      // Email and notify landlord
      if (listing.user.email) {
        try {
          await sendEmail({
            to: listing.user.email,
            subject: `New Viewing Booking Request for "${listing.title}"`,
            html: `
              <h3>Hello ${listing.user.name || 'Landlord'},</h3>
              <p>A user has requested a property viewing appointment for your listing: <strong>${listing.title}</strong>.</p>
              <ul>
                <li><strong>Requested Date:</strong> ${bookingDate.toLocaleDateString()}</li>
                <li><strong>Slot Time:</strong> ${slot.startTime} - ${slot.endTime}</li>
                <li><strong>Tenant Message:</strong> ${message || 'No message provided'}</li>
              </ul>
              <p>Please login to your Toolate dashboard to confirm or decline this request.</p>
              <br/>
              <p>Best regards,<br/>The Toolate Team</p>
            `,
          });
        } catch (emailErr) {
          console.error('Error sending viewing email to landlord:', emailErr);
        }
      }
      
      // Create notification
      await prisma.notification.create({
        data: {
          userId: listing.userId,
          title: 'New Viewing Request',
          message: `A tenant has requested a viewing for ${listing.title} on ${bookingDate.toLocaleDateString()}`,
          type: 'VIEWING_REQUEST',
          actionData: JSON.stringify({ bookingId: booking.id, listingId }),
        }
      });

      return NextResponse.json({ success: true, booking });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error processing viewing action:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: Confirm/Decline (owner) or Cancel (tenant) booking
export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const { id: listingId } = await props.params;
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const sessionUserId = (session.user as any).id;

    const { bookingId, status, returnMessage } = await req.json();
    if (!bookingId || !status) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const booking = await prisma.viewingBooking.findUnique({
      where: { id: bookingId },
      include: {
        listing: { select: { userId: true, title: true } },
        slot: true,
        tenant: { select: { email: true, name: true } },
      },
    });

    if (!booking || booking.listingId !== listingId) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const isOwner = booking.listing.userId === sessionUserId;
    const isTenant = booking.tenantId === sessionUserId;

    if (!isOwner && !isTenant) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Tenant can only CANCEL
    if (isTenant && !isOwner && status !== 'CANCELLED') {
      return NextResponse.json({ error: 'Forbidden. Tenants can only cancel bookings.' }, { status: 403 });
    }

    const updatedBooking = await prisma.viewingBooking.update({
      where: { id: bookingId },
      data: { status, returnMessage: returnMessage ? String(returnMessage).trim() : null },
    });

    // Send email and notification to tenant
    if (booking.tenant.email) {
      try {
        const subjectStatus = status === 'CONFIRMED' ? 'Confirmed ✅' : 'Cancelled ❌';
        await sendEmail({
          to: booking.tenant.email,
          subject: `Property Viewing Appointment ${subjectStatus}: ${booking.listing.title}`,
          html: `
            <h3>Hello ${booking.tenant.name || 'Tenant'},</h3>
            <p>Your property viewing request for listing: <strong>${booking.listing.title}</strong> has been updated to: <strong>${status}</strong>.</p>
            <ul>
              <li><strong>Appointment Date:</strong> ${new Date(booking.date).toLocaleDateString()}</li>
              <li><strong>Time Slot:</strong> ${booking.slot.startTime} - ${booking.slot.endTime}</li>
            </ul>
            <p>If you have any questions, please contact the landlord directly via the listing details page.</p>
            ${returnMessage ? `<p style="padding: 10px; background-color: #f3f4f6; border-left: 4px solid #4f46e5; border-radius: 4px;"><strong>Landlord's Message:</strong> ${returnMessage}</p>` : ''}
            <br/>
            <p>Best regards,<br/>The Toolate Team</p>
          `,
        });
      } catch (emailErr) {
        console.error('Error sending status email to tenant:', emailErr);
      }
    }
    
    // Create notification
    await prisma.notification.create({
      data: {
        userId: booking.tenantId,
        title: `Viewing ${status}`,
        message: `Your viewing request for ${booking.listing.title} has been ${status.toLowerCase()}${returnMessage ? '. The landlord sent a message.' : ''}`,
      }
    });

    return NextResponse.json({ success: true, booking: updatedBooking });
  } catch (error: any) {
    console.error('Error updating booking:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Delete a slot (owner only)
export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const { id: listingId } = await props.params;
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const sessionUserId = (session.user as any).id;

    const { slotId } = await req.json();
    if (!slotId) {
      return NextResponse.json({ error: 'Slot ID is required' }, { status: 400 });
    }

    const slot = await prisma.viewingSlot.findUnique({
      where: { id: slotId },
      include: { listing: { select: { userId: true } } },
    });

    if (!slot || slot.listingId !== listingId) {
      return NextResponse.json({ error: 'Slot not found' }, { status: 404 });
    }

    if (slot.listing.userId !== sessionUserId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.viewingSlot.delete({
      where: { id: slotId },
    });

    return NextResponse.json({ success: true, message: 'Slot deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting slot:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
