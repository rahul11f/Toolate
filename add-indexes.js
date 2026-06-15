const fs = require('fs');

let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

const replacements = [
  { model: 'Account', idx: '@@index([userId])' },
  { model: 'Session', idx: '@@index([userId])' },
  { model: 'AdminLog', idx: '@@index([adminId])' },
  { model: 'Review', idx: '@@index([listingId])\n  @@index([userId])' },
  { model: 'ViewingSlot', idx: '@@index([listingId])' },
  { model: 'ViewingBooking', idx: '@@index([listingId])\n  @@index([slotId])\n  @@index([tenantId])' },
  { model: 'AreaReview', idx: '@@index([userId])' },
  { model: 'ListingQA', idx: '@@index([listingId])\n  @@index([askedBy])' },
  { model: 'RentPayment', idx: '@@index([listingId])\n  @@index([tenantUserId])' },
  { model: 'Notification', idx: '@@index([userId])' }
];

for (const { model, idx } of replacements) {
  // Only add if not already present
  if (!schema.includes(idx.trim().split('\n')[0])) {
    const regex = new RegExp('(model ' + model + ' \\{[^}]*)(\\})', 'm');
    schema = schema.replace(regex, '$1  ' + idx + '\n$2');
  }
}

fs.writeFileSync('prisma/schema.prisma', schema);
console.log('Indexes added successfully.');
