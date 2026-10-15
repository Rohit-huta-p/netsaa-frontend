// netsa-frontend/src/constants/indianCities.ts
//
// Curated major cities per Indian state/UT, keyed by the exact names in
// `indianStates.ts`. Used by the profile edit sheet's Location picker: pick a
// State, then pick a City from that state's list — or type a custom one if it
// isn't listed (the picker always allows a typed value).
//
// Not exhaustive (India has thousands of towns); it covers the cities most
// performers list. The launch wedge (Maharashtra, esp. Pune/Mumbai) is first.
export const CITIES_BY_STATE: Record<string, string[]> = {
    'Maharashtra': ['Pune', 'Mumbai', 'Nagpur', 'Nashik', 'Thane', 'Aurangabad', 'Navi Mumbai', 'Kolhapur', 'Solapur', 'Amravati', 'Nanded', 'Sangli'],
    'Karnataka': ['Bengaluru', 'Mysuru', 'Mangaluru', 'Hubballi', 'Belagavi', 'Davanagere', 'Ballari', 'Shivamogga', 'Tumakuru', 'Udupi'],
    'Delhi': ['New Delhi', 'Delhi', 'Dwarka', 'Rohini', 'Saket', 'Pitampura'],
    'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli', 'Erode', 'Vellore', 'Thanjavur'],
    'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Khammam', 'Secunderabad'],
    'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Noida', 'Ghaziabad', 'Agra', 'Varanasi', 'Prayagraj', 'Meerut', 'Bareilly', 'Aligarh', 'Gorakhpur'],
    'West Bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri', 'Darjeeling', 'Kharagpur'],
    'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Gandhinagar', 'Anand'],
    'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer', 'Bikaner', 'Alwar'],
    'Kerala': ['Kochi', 'Thiruvananthapuram', 'Kozhikode', 'Thrissur', 'Kollam', 'Kannur', 'Kottayam', 'Alappuzha'],
    'Madhya Pradesh': ['Indore', 'Bhopal', 'Jabalpur', 'Gwalior', 'Ujjain', 'Sagar'],
    'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Tirupati', 'Nellore', 'Kurnool', 'Rajahmundry'],
    'Punjab': ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali'],
    'Haryana': ['Gurugram', 'Faridabad', 'Panipat', 'Ambala', 'Karnal', 'Hisar', 'Rohtak'],
    'Bihar': ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Darbhanga', 'Purnia'],
    'Odisha': ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Puri', 'Sambalpur', 'Berhampur'],
    'Assam': ['Guwahati', 'Dibrugarh', 'Silchar', 'Jorhat', 'Tezpur', 'Nagaon'],
    'Jharkhand': ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Hazaribagh'],
    'Chhattisgarh': ['Raipur', 'Bhilai', 'Bilaspur', 'Korba', 'Durg'],
    'Uttarakhand': ['Dehradun', 'Haridwar', 'Rishikesh', 'Haldwani', 'Nainital', 'Roorkee'],
    'Himachal Pradesh': ['Shimla', 'Dharamshala', 'Manali', 'Solan', 'Mandi', 'Kullu'],
    'Goa': ['Panaji', 'Margao', 'Vasco da Gama', 'Mapusa', 'Ponda'],
    'Jammu and Kashmir': ['Srinagar', 'Jammu', 'Anantnag', 'Baramulla'],
    'Chandigarh': ['Chandigarh'],
    'Puducherry': ['Puducherry', 'Karaikal'],
    'Tripura': ['Agartala', 'Udaipur'],
    'Meghalaya': ['Shillong', 'Tura'],
    'Manipur': ['Imphal'],
    'Nagaland': ['Kohima', 'Dimapur'],
    'Mizoram': ['Aizawl'],
    'Arunachal Pradesh': ['Itanagar', 'Naharlagun'],
    'Sikkim': ['Gangtok'],
    'Ladakh': ['Leh', 'Kargil'],
    'Andaman and Nicobar Islands': ['Port Blair'],
    'Lakshadweep': ['Kavaratti'],
    'Dadra and Nagar Haveli and Daman and Diu': ['Daman', 'Silvassa', 'Diu'],
};

export function citiesForState(state: string | undefined): string[] {
    if (!state) return [];
    return CITIES_BY_STATE[state] ?? [];
}
