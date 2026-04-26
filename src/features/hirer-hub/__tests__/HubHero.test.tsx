import React from 'react';
import { render } from '@testing-library/react-native';
import { HubHero } from '../components/HubHero';

describe('HubHero', () => {
    it('renders gig title + status pill + meta line', () => {
        const { getByText, getAllByText } = render(
            <HubHero
                title="Sangeet Choreography"
                status="published"
                eventFunction="Sangeet"
                city="Pune"
                startDate={new Date('2027-03-15').toISOString()}
            />
        );
        expect(getByText('Sangeet Choreography')).toBeTruthy();
        expect(getByText(/Live/i)).toBeTruthy();
        // Title ("Sangeet Choreography") + meta ("Sangeet · Pune · Mar 15") both match.
        expect(getAllByText(/Sangeet/i).length).toBeGreaterThanOrEqual(2);
        expect(getByText(/Pune/i)).toBeTruthy();
    });

    it('renders Closed pill when gig.status is closed', () => {
        const { getByText } = render(
            <HubHero title="X" status="closed" eventFunction="" city="" startDate="" />
        );
        expect(getByText(/Closed/i)).toBeTruthy();
    });
});
