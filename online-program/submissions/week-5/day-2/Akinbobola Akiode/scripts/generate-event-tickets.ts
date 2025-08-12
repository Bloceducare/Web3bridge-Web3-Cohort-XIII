import * as fs from 'fs';
import * as path from 'path';

interface EventTicket {
    eventId: number;
    ticketId: number;
    eventName: string;
    eventDate: string;
    ticketNumber: number;
    eventType: 'Free' | 'Paid';
    price?: string;
}

interface TicketMetadata {
    name: string;
    description: string;
    image: string;
    external_url?: string;
    attributes: Array<{
        trait_type: string;
        value: string | number;
    }>;
}

function generateTicketSVG(ticket: EventTicket): string {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];
    const color = colors[ticket.eventId % colors.length];
    const size = 500;
    
    const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
                <stop offset="100%" style="stop-color:${color}dd;stop-opacity:1" />
            </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grad)"/>
        <rect x="50" y="50" width="400" height="400" fill="white" opacity="0.1" rx="20"/>
        <text x="250" y="120" font-family="Arial" font-size="24" text-anchor="middle" fill="white" font-weight="bold">EVENT TICKET</text>
        <text x="250" y="160" font-family="Arial" font-size="18" text-anchor="middle" fill="white">${ticket.eventName}</text>
        <text x="250" y="200" font-family="Arial" font-size="14" text-anchor="middle" fill="white">Date: ${ticket.eventDate}</text>
        <text x="250" y="230" font-family="Arial" font-size="14" text-anchor="middle" fill="white">Ticket #${ticket.ticketNumber}</text>
        <text x="250" y="260" font-family="Arial" font-size="14" text-anchor="middle" fill="white">Type: ${ticket.eventType}</text>
        ${ticket.price ? `<text x="250" y="290" font-family="Arial" font-size="14" text-anchor="middle" fill="white">Price: ${ticket.price} ETH</text>` : ''}
        <circle cx="150" cy="350" r="30" fill="white" opacity="0.3"/>
        <circle cx="350" cy="350" r="30" fill="white" opacity="0.3"/>
        <text x="250" y="420" font-family="Arial" font-size="12" text-anchor="middle" fill="white" opacity="0.7">Event ID: ${ticket.eventId} | Ticket ID: ${ticket.ticketId}</text>
    </svg>`;
    
    return svg;
}

function generateTicketMetadata(ticket: EventTicket, baseImageUri: string): TicketMetadata {
    const attributes = [
        { trait_type: "Event ID", value: ticket.eventId },
        { trait_type: "Ticket Number", value: ticket.ticketNumber },
        { trait_type: "Event Name", value: ticket.eventName },
        { trait_type: "Event Date", value: ticket.eventDate },
        { trait_type: "Event Type", value: ticket.eventType },
        { trait_type: "Ticket ID", value: ticket.ticketId }
    ];

    if (ticket.price) {
        attributes.push({ trait_type: "Price", value: ticket.price });
    }

    return {
        name: `Event Ticket #${ticket.ticketId}`,
        description: `This is ticket #${ticket.ticketNumber} for the event "${ticket.eventName}" on ${ticket.eventDate}.`,
        image: `${baseImageUri}${ticket.ticketId}.svg`,
        attributes: attributes
    };
}

async function generateEventTickets(
    eventId: number,
    eventName: string,
    eventDate: string,
    eventType: 'Free' | 'Paid',
    totalTickets: number,
    price?: string
): Promise<void> {
    const outputDir = path.join(__dirname, '..', 'generated', 'event-tickets');
    const imagesDir = path.join(outputDir, 'images');
    const metadataDir = path.join(outputDir, 'metadata');
    
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir, { recursive: true });
    }
    if (!fs.existsSync(metadataDir)) {
        fs.mkdirSync(metadataDir, { recursive: true });
    }
    
    console.log(`🎫 Generating ${totalTickets} tickets for event: ${eventName}`);
    
    for (let i = 1; i <= totalTickets; i++) {
        const ticket: EventTicket = {
            eventId,
            ticketId: i,
            eventName,
            eventDate,
            ticketNumber: i,
            eventType,
            price
        };
        
        const svg = generateTicketSVG(ticket);
        const imagePath = path.join(imagesDir, `${i}.svg`);
        fs.writeFileSync(imagePath, svg);
        
        const metadata = generateTicketMetadata(ticket, 'ipfs://QmYourIPFSHash/');
        const metadataPath = path.join(metadataDir, `${i}.json`);
        fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
        
        if (i % 10 === 0) {
            console.log(`Generated ${i}/${totalTickets} tickets`);
        }
    }
    
    console.log(`✅ Generated ${totalTickets} tickets for event ${eventId}`);
}

async function main() {
    const events = [
        {
            eventId: 1,
            eventName: "Blockchain Conference 2024",
            eventDate: "2024-12-15",
            eventType: 'Paid' as const,
            totalTickets: 100,
            price: "0.00028"
        },
        {
            eventId: 2,
            eventName: "Web3 Workshop",
            eventDate: "2024-12-20",
            eventType: 'Free' as const,
            totalTickets: 50
        }
    ];
    
    for (const event of events) {
        await generateEventTickets(
            event.eventId,
            event.eventName,
            event.eventDate,
            event.eventType,
            event.totalTickets,
            event.price
        );
    }
    
    console.log('🎉 All event tickets generated successfully!');
}

main().catch(console.error); 