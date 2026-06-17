const defaultStations = [
  { name: "Nagpur (Sonegaon)", number: "42867", icao: "VANP" },
  { name: "Raipur", number: "42971", icao: "VARP" },
  { name: "Bhopal", number: "42874", icao: "VABP" },
  { name: "New Delhi (Safdarjung)", number: "42182", icao: "VIDP" },
  { name: "Mumbai", number: "43003", icao: "VABB" },
  { name: "Jagdalpur", number: "42964", icao: "VAJB" },
  { name: "Gwalior", number: "42339", icao: "VIGR" },
  { name: "Varanasi", number: "42475", icao: "VIBN" },
  { name: "Hyderabad", number: "43192", icao: "VOHY" },
  { name: "Chennai", number: "43279", icao: "VOMM" }
];

let targetStations = [...defaultStations];

// Function to add custom station
function addCustomStation(number, name = `Station ${number}`) {
    if (!targetStations.find(s => s.number === number)) {
        targetStations.push({ name, number, icao: "N/A" });
        return true;
    }
    return false;
}
