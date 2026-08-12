export interface CityLocation {
  city: string;
  district: string;
  state: string;
}

export const INDIA_LOCATIONS: { [stateName: string]: { [districtName: string]: string[] } } = {
  "Maharashtra": {
    "Mumbai Suburban": ["Mumbai", "Andheri", "Bandra", "Borivali", "Juhu", "Malad", "Powai"],
    "Pune": ["Pune", "Pimpri-Chinchwad", "Kothrud", "Hinjewadi", "Viman Nagar"],
    "Thane": ["Thane", "Navi Mumbai", "Kalyan", "Dombivli", "Vashi"],
    "Nagpur": ["Nagpur", "Kamptee", "Hingna"],
    "Nashik": ["Nashik", "Panchavati", "Satpur"],
    "Aurangabad": ["Aurangabad", "CIDCO", "Waluj"]
  },
  "Delhi": {
    "New Delhi": ["Connaught Place", "Chanakyapuri", "Vasant Kunj", "Barakhamba"],
    "South Delhi": ["Hauz Khas", "Saket", "Greater Kailash", "Nehru Place", "Lajpat Nagar"],
    "North Delhi": ["Civil Lines", "Kamla Nagar", "Model Town"],
    "East Delhi": ["Preet Vihar", "Mayur Vihar", "Laxmi Nagar"]
  },
  "Karnataka": {
    "Bengaluru Urban": ["Bangalore", "Indiranagar", "Koramangala", "Whitefield", "HSR Layout", "Jayanagar"],
    "Mysuru": ["Mysore", "Gokulam", "Vijayanagar", "Jayalakshmipuram"],
    "Dakshina Kannada": ["Mangalore", "Surathkal", "Uptown", "Kodialbail"],
    "Dharwad": ["Hubli", "Dharwad", "Vidyanagar"]
  },
  "Tamil Nadu": {
    "Chennai": ["Chennai", "Adyar", "T. Nagar", "Velachery", "Anna Nagar", "Besant Nagar"],
    "Coimbatore": ["Coimbatore", "Peelamedu", "RS Puram", "Gandhipuram"],
    "Madurai": ["Madurai", "KK Nagar", "Anna Nagar"],
    "Tiruchirappalli": ["Trichy", "Thillai Nagar", "Cantonment"]
  },
  "Telangana": {
    "Hyderabad": ["Hyderabad", "Banjara Hills", "Jubilee Hills", "Gachibowli", "HITEC City", "Kondapur"],
    "Rangareddy": ["Madhapur", "Manikonda", "Gachibowli"],
    "Warangal": ["Warangal", "Hanamkonda", "Kazipet"]
  },
  "Andhra Pradesh": {
    "Visakhapatnam": ["Visakhapatnam", "MVP Colony", "Gajuwaka", "Beach Road"],
    "Krishna": ["Vijayawada", "Benz Circle", "MG Road"],
    "Chittoor": ["Tirupati", "Alipiri", "Tirumala"]
  },
  "Kerala": {
    "Ernakulam": ["Kochi", "Fort Kochi", "Edappally", "Marine Drive", "Kakkanad"],
    "Thiruvananthapuram": ["Trivandrum", "Technopark", "Vazhuthacaud", "Kowdiar"],
    "Kozhikode": ["Calicut", "Mavoor Road", "Beach Road"],
    "Thrissur": ["Thrissur", "Round West", "Swaraj Round"],
    "Kannur": ["Kannur", "Thana", "Payyambalam"]
  },
  "West Bengal": {
    "Kolkata": ["Kolkata", "Salt Lake", "Park Street", "Ballygunge", "New Town", "Alipore"],
    "Darjeeling": ["Darjeeling", "Siliguri", "Kurseong"],
    "Howrah": ["Howrah", "Shibpur", "Bally"],
    "Paschim Bardhaman": ["Durgapur", "Asansol"]
  },
  "Gujarat": {
    "Ahmedabad": ["Ahmedabad", "Navrangpura", "SG Highway", "Bodakdev", "Prahlad Nagar"],
    "Surat": ["Surat", "Vesu", "Adajan", "Ring Road"],
    "Vadodara": ["Vadodara", "Alkapuri", "Race Course"],
    "Rajkot": ["Rajkot", "Kalavad Road", "Yagnik Road"]
  },
  "Uttar Pradesh": {
    "Gautam Buddha Nagar": ["Noida", "Greater Noida", "Sector 62", "Sector 18"],
    "Lucknow": ["Lucknow", "Hazratganj", "Gomti Nagar", "Aliganj"],
    "Agra": ["Agra", "Tajganj", "Sanjay Place"],
    "Kanpur Nagar": ["Kanpur", "Civil Lines", "Swaroop Nagar"],
    "Varanasi": ["Varanasi", "Lanka", "Assi Ghat"]
  },
  "Rajasthan": {
    "Jaipur": ["Jaipur", "C-Scheme", "Malviya Nagar", "Vaishali Nagar", "Raja Park"],
    "Udaipur": ["Udaipur", "Fatehpura", "Hiran Magri"],
    "Jodhpur": ["Jodhpur", "Ratanada", "Shastri Nagar"]
  },
  "Punjab & Haryana": {
    "Chandigarh": ["Chandigarh", "Sector 17", "Sector 35"],
    "Amritsar": ["Amritsar", "Mall Road", "Ranjit Avenue"],
    "Ludhiana": ["Ludhiana", "Model Town", "Gurdev Nagar"],
    "Gurugram": ["Gurgaon", "DLF Phase 1", "Cyber City", "Golf Course Road"]
  },
  "Madhya Pradesh": {
    "Indore": ["Indore", "Vijay Nagar", "Palasia"],
    "Bhopal": ["Bhopal", "Arera Colony", "MP Nagar"],
    "Gwalior": ["Gwalior", "City Center"]
  },
  "Goa": {
    "North Goa": ["Panaji", "Candolim", "Calangute", "Anjuna", "Assagao"],
    "South Goa": ["Margao", "Vasco da Gama", "Colva"]
  },
  "Other States (Assam, J&K, Odisha, Bihar, etc.)": {
    "Kamrup": ["Guwahati", "Dispur", "GS Road"],
    "Srinagar": ["Srinagar", "Lal Chowk", "Rajbagh"],
    "Khurda": ["Bhubaneswar", "Saheed Nagar", "Patia"],
    "Patna": ["Patna", "Boring Road", "Kankarbagh"],
    "Ranchi": ["Ranchi", "Main Road", "Kanke Road"]
  }
};

// Flatten all locations for search
export const ALL_INDIAN_CITIES: CityLocation[] = Object.entries(INDIA_LOCATIONS).flatMap(([state, districts]) =>
  Object.entries(districts).flatMap(([district, cities]) =>
    cities.map(city => ({ city, district, state }))
  )
);
