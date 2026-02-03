/**
 * Team Email Configuration
 *
 * Static configuration for team leads and operational units
 */

export interface TeamContact {
  email: string;
  zone: string;
}

export const TEAM_CONTACTS: TeamContact[] = [
  // Zone Leads
  { email: "saloni@zangoh.com", zone: "Zone 1 Lead – Saloni" },
  { email: "salonim@newzera.com", zone: "Zone 3 Lead – A. Khan" },
  { email: "isalonim09@gmail.com", zone: "Zone 4 Lead – M. Verma" },
  { email: "shreys@zangoh.com", zone: "Zone 5 Lead – S. Sharma" },

  // Operational Units
  { email: "command.volunteers@mahakumbh.in", zone: "Volunteer Command Office" },
  { email: "medops@mahakumbhops.in", zone: "Medical Response Unit" },
  { email: "transport.ops@mahakumbhops.in", zone: "Traffic & Transport Cell" },
  { email: "safety.control@mahakumbhops.in", zone: "Safety & Emergency Desk" },
];
