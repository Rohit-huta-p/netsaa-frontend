type SavedItem = {
    id: string;
    type: 'Workshop' | 'Event' | 'Gig';
    title: string;
    date: string;
    location: string;
    attending: number;
    expiresOn: string;
};
