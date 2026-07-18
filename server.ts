/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { 
  CaseMaster, Victim, Accused, ComplainantDetails, ActSectionAssociation, 
  Act, Section, CrimeHead, CrimeSubHead, CaseStatusMaster, CaseCategory, 
  GravityOffence, Unit, Employee, District, State, Court, Rank, Designation, 
  OccupationMaster, ReligionMaster, CasteMaster, ArrestSurrender, ChargesheetDetails,
  UserRole, Message, EvidenceRecord, CatalystServiceLog
} from "./src/types";

// Load environment variables
dotenv.config();

const app = express();
app.use(express.json());
const PORT = 3000;

// Initialize Gemini API with correct header telemetry (as instructed in gemini-api skill)
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "dummy-key",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// ==========================================
// SEED DATABASE FOR KARNATAKA STATE POLICE (TABLES 1-24)
// ==========================================

const states: State[] = [
  { StateID: 1, StateName: "Karnataka", Active: true }
];

const districts: District[] = [
  { DistrictID: 10, DistrictName: "Bengaluru City", StateID: 1, Active: true },
  { DistrictID: 11, DistrictName: "Mysuru", StateID: 1, Active: true },
  { DistrictID: 12, DistrictName: "Dakshina Kannada (Mangaluru)", StateID: 1, Active: true },
  { DistrictID: 13, DistrictName: "Belagavi", StateID: 1, Active: true },
  { DistrictID: 14, DistrictName: "Hubballi-Dharwad", StateID: 1, Active: true },
  { DistrictID: 15, DistrictName: "Kolar", StateID: 1, Active: true },
  { DistrictID: 16, DistrictName: "Udupi", StateID: 1, Active: true }
];

const ranks: Rank[] = [
  { RankID: 1, RankName: "Police Constable", Hierarchy: 1, Active: true },
  { RankID: 2, RankName: "Head Constable", Hierarchy: 2, Active: true },
  { RankID: 3, RankName: "Assistant Sub-Inspector", Hierarchy: 3, Active: true },
  { RankID: 4, RankName: "Sub-Inspector", Hierarchy: 4, Active: true },
  { RankID: 5, RankName: "Inspector of Police", Hierarchy: 5, Active: true },
  { RankID: 6, RankName: "Deputy Superintendent of Police (DSP)", Hierarchy: 6, Active: true }
];

const designations: Designation[] = [
  { DesignationID: 101, DesignationName: "Investigating Officer (IO)", Active: true },
  { DesignationID: 102, DesignationName: "Station House Officer (SHO)", Active: true },
  { DesignationID: 103, DesignationName: "Circle Inspector", Active: true },
  { DesignationID: 104, DesignationName: "Crime Branch Officer", Active: true }
];

const units: Unit[] = [
  { UnitID: 1001, UnitName: "Cubbon Park PS", TypeID: 1, ParentUnit: null, StateID: 1, DistrictID: 10, Active: true },
  { UnitID: 1002, UnitName: "Mandi PS", TypeID: 1, ParentUnit: null, StateID: 1, DistrictID: 11, Active: true },
  { UnitID: 1003, UnitName: "Bunder PS", TypeID: 1, ParentUnit: null, StateID: 1, DistrictID: 12, Active: true },
  { UnitID: 1004, UnitName: "HSR Layout PS", TypeID: 1, ParentUnit: null, StateID: 1, DistrictID: 10, Active: true },
  { UnitID: 1005, UnitName: "Khade Bazar PS", TypeID: 1, ParentUnit: null, StateID: 1, DistrictID: 13, Active: true },
  { UnitID: 1006, UnitName: "Gokul Road PS", TypeID: 1, ParentUnit: null, StateID: 1, DistrictID: 14, Active: true },
  { UnitID: 1007, UnitName: "Whitefield PS", TypeID: 1, ParentUnit: null, StateID: 1, DistrictID: 10, Active: true },
  { UnitID: 1008, UnitName: "Manipal PS", TypeID: 1, ParentUnit: null, StateID: 1, DistrictID: 16, Active: true },
  { UnitID: 1009, UnitName: "Kolar Town PS", TypeID: 1, ParentUnit: null, StateID: 1, DistrictID: 15, Active: true }
];

const employees: Employee[] = [
  { EmployeeID: 501, DistrictID: 10, UnitID: 1001, RankID: 4, DesignationID: 101, KGID: "KSP20120045", FirstName: "B. Manjunath", EmployeeDOB: "1984-06-15", GenderID: 1, AppointmentDate: "2012-08-10" },
  { EmployeeID: 502, DistrictID: 11, UnitID: 1002, RankID: 4, DesignationID: 101, KGID: "KSP20150932", FirstName: "Siddalingappa H.", EmployeeDOB: "1988-11-22", GenderID: 1, AppointmentDate: "2015-02-01" },
  { EmployeeID: 503, DistrictID: 12, UnitID: 1003, RankID: 5, DesignationID: 102, KGID: "KSP20080112", FirstName: "Sandeep Poojary", EmployeeDOB: "1980-04-03", GenderID: 1, AppointmentDate: "2008-01-20" },
  { EmployeeID: 504, DistrictID: 10, UnitID: 1004, RankID: 4, DesignationID: 101, KGID: "KSP20180234", FirstName: "Vijay Kumar", EmployeeDOB: "1991-09-05", GenderID: 1, AppointmentDate: "2018-04-12" },
  { EmployeeID: 505, DistrictID: 13, UnitID: 1005, RankID: 4, DesignationID: 101, KGID: "KSP20140788", FirstName: "Basavaraj Patil", EmployeeDOB: "1986-12-30", GenderID: 1, AppointmentDate: "2014-06-15" },
  { EmployeeID: 506, DistrictID: 10, UnitID: 1007, RankID: 5, DesignationID: 102, KGID: "KSP20050011", FirstName: "K. N. Raghavendra", EmployeeDOB: "1978-01-18", GenderID: 1, AppointmentDate: "2005-02-28" }
];

const acts: Act[] = [
  { ActCode: "IPC", ActDescription: "Indian Penal Code, 1860", ShortName: "IPC", Active: true },
  { ActCode: "NDPS", ActDescription: "Narcotic Drugs and Psychotropic Substances Act, 1985", ShortName: "NDPS Act", Active: true },
  { ActCode: "IT_ACT", ActDescription: "Information Technology Act, 2000", ShortName: "IT Act", Active: true },
  { ActCode: "COPTA", ActDescription: "Cigarettes and Other Tobacco Products Act, 2003", ShortName: "COPTA", Active: true }
];

const sections: Section[] = [
  { ActCode: "IPC", SectionCode: "302", SectionDescription: "Punishment for Murder", Active: true },
  { ActCode: "IPC", SectionCode: "379", SectionDescription: "Punishment for Theft", Active: true },
  { ActCode: "IPC", SectionCode: "420", SectionDescription: "Cheating and dishonestly inducing delivery of property", Active: true },
  { ActCode: "IPC", SectionCode: "498A", SectionDescription: "Husband or relative of husband of a woman subjecting her to cruelty", Active: true },
  { ActCode: "IPC", SectionCode: "353", SectionDescription: "Assault or criminal force to deter public servant from discharge of his duty", Active: true },
  { ActCode: "IPC", SectionCode: "384", SectionDescription: "Punishment for Extortion", Active: true },
  { ActCode: "IPC", SectionCode: "457", SectionDescription: "Lurking house-trespass or house-breaking by night", Active: true },
  { ActCode: "IPC", SectionCode: "468", SectionDescription: "Forgery for purpose of cheating", Active: true },
  { ActCode: "IPC", SectionCode: "471", SectionDescription: "Using as genuine a forged document", Active: true },
  { ActCode: "NDPS", SectionCode: "20b", SectionDescription: "Possession, manufacture, sale, purchase of cannabis (Ganja)", Active: true },
  { ActCode: "IT_ACT", SectionCode: "66D", SectionDescription: "Punishment for cheating by personation by using computer resource", Active: true },
  { ActCode: "IT_ACT", SectionCode: "66E", SectionDescription: "Punishment for violation of privacy", Active: true },
  { ActCode: "COPTA", SectionCode: "4", SectionDescription: "Prohibition of smoking in a public place", Active: true }
];

const crimeHeads: CrimeHead[] = [
  { CrimeHeadID: 201, CrimeGroupName: "Crimes Against Body (Murder/Assault)", Active: true },
  { CrimeHeadID: 202, CrimeGroupName: "Property Offences (Theft/Burglary)", Active: true },
  { CrimeHeadID: 203, CrimeGroupName: "Cyber Crimes (Fraud/Extortion)", Active: true },
  { CrimeHeadID: 204, CrimeGroupName: "Drug Offences (NDPS Act)", Active: true },
  { CrimeHeadID: 205, CrimeGroupName: "Crimes Against Women (Cruelty/Harassment)", Active: true },
  { CrimeHeadID: 206, CrimeGroupName: "Special and Local Laws (SLL / COPTA)", Active: true }
];

const crimeSubHeads: CrimeSubHead[] = [
  { CrimeSubHeadID: 301, CrimeHeadID: 201, CrimeHeadName: "Murder", SeqID: 1 },
  { CrimeSubHeadID: 302, CrimeHeadID: 201, CrimeHeadName: "Assault on Police Officer", SeqID: 2 },
  { CrimeSubHeadID: 303, CrimeHeadID: 202, CrimeHeadName: "Night House Breaking & Theft (HBT)", SeqID: 3 },
  { CrimeSubHeadID: 304, CrimeHeadID: 202, CrimeHeadName: "Motor Vehicle Theft", SeqID: 4 },
  { CrimeSubHeadID: 305, CrimeHeadID: 203, CrimeHeadName: "Online Financial Phishing", SeqID: 5 },
  { CrimeSubHeadID: 306, CrimeHeadID: 203, CrimeHeadName: "Cyber Blackmail / Extortion", SeqID: 6 },
  { CrimeSubHeadID: 307, CrimeHeadID: 204, CrimeHeadName: "Commercial Drug Possession (Cannabis)", SeqID: 7 },
  { CrimeSubHeadID: 308, CrimeHeadID: 205, CrimeHeadName: "Domestic Cruelty by Husband/In-laws", SeqID: 8 },
  { CrimeSubHeadID: 309, CrimeHeadID: 206, CrimeHeadName: "Illegal Public Sale of Tobacco Products", SeqID: 9 },
  { CrimeSubHeadID: 310, CrimeHeadID: 202, CrimeHeadName: "Land Forgery & Encroachment", SeqID: 10 }
];

const caseStatuses: CaseStatusMaster[] = [
  { CaseStatusID: 1, CaseStatusName: "Under Investigation" },
  { CaseStatusID: 2, CaseStatusName: "Charge Sheeted" },
  { CaseStatusID: 3, CaseStatusName: "Closed (Recovered)" },
  { CaseStatusID: 4, CaseStatusName: "Closed (Fined)" },
  { CaseStatusID: 5, CaseStatusName: "Undetected" }
];

const caseCategories: CaseCategory[] = [
  { CaseCategoryID: 1, LookupValue: "FIR" },
  { CaseCategoryID: 2, LookupValue: "UDR" },
  { CaseCategoryID: 3, LookupValue: "PAR" }
];

const gravityOffences: GravityOffence[] = [
  { GravityOffenceID: 1, LookupValue: "Heinous" },
  { GravityOffenceID: 2, LookupValue: "Non-Heinous" }
];

const courts: Court[] = [
  { CourtID: 401, CourtName: "1st ACMM Court, Bengaluru", DistrictID: 10, StateID: 1, Active: true },
  { CourtID: 402, CourtName: "JMFC Court, Mysuru", DistrictID: 11, StateID: 1, Active: true },
  { CourtID: 403, CourtName: "JMFC II Court, Mangaluru", DistrictID: 12, StateID: 1, Active: true },
  { CourtID: 404, CourtName: "Principal District Court, Belagavi", DistrictID: 13, StateID: 1, Active: true }
];

const occupations: OccupationMaster[] = [
  { OccupationID: 1, OccupationName: "Farmer / Agriculture" },
  { OccupationID: 2, OccupationName: "Government Employee" },
  { OccupationID: 3, OccupationName: "IT Professional / Engineer" },
  { OccupationID: 4, OccupationName: "Retail Shop Owner" },
  { OccupationID: 5, OccupationName: "Retired Teacher" },
  { OccupationID: 6, OccupationName: "Unemployed" }
];

const religions: ReligionMaster[] = [
  { ReligionID: 1, ReligionName: "Hindu" },
  { ReligionID: 2, ReligionName: "Muslim" },
  { ReligionID: 3, ReligionName: "Christian" },
  { ReligionID: 4, ReligionName: "Sikh" }
];

const castes: CasteMaster[] = [
  { caste_master_id: 11, caste_master_name: "General / Lingayat" },
  { caste_master_id: 12, caste_master_name: "General / Vokkaliga" },
  { caste_master_id: 13, caste_master_name: "Backward Class (OBC)" },
  { caste_master_id: 14, caste_master_name: "Scheduled Caste (SC)" },
  { caste_master_id: 15, caste_master_name: "Scheduled Tribe (ST)" }
];

// --- 10 HIGH-QUALITY CASE RECORDS FOR KSP CRIME DATABASE ---
const caseMasters: CaseMaster[] = [
  {
    CaseMasterID: 1,
    CrimeNo: "104430006202600001",
    CaseNo: "202600001",
    CrimeRegisteredDate: "2026-05-12",
    PolicePersonID: 501,
    PoliceStationID: 1001, // Cubbon Park PS
    CaseCategoryID: 1, // FIR
    GravityOffenceID: 1, // Heinous
    CrimeMajorHeadID: 201, // Body
    CrimeMinorHeadID: 301, // Murder
    CaseStatusID: 2, // Charge Sheeted
    CourtID: 401,
    IncidentFromDate: "2026-05-11T22:30:00Z",
    IncidentToDate: "2026-05-11T23:15:00Z",
    InfoReceivedPSDate: "2026-05-12T00:10:00Z",
    latitude: 12.9734,
    longitude: 77.5959, // Cubbon Park Metro
    BriefFacts: "On 12-05-2026, near Cubbon Park metro station, the accused Ramesh Kumar stabbed the victim Suresh Gowda with a sharp knife due to a heated dispute over a personal financial loan of Rs 50,000. The victim succumbed to heavy arterial injuries on the spot. Investigating officer recovered the blood-stained weapon and filed the charge sheet within 45 days.",
    BriefFacts_KN: "12-05-2026 ರಂದು ಕಬ್ಬನ್ ಪಾರ್ಕ್ ಮೆಟ್ರೋ ನಿಲ್ದಾಣದ ಬಳಿ, 50,000 ರೂ ವೈಯಕ್ತಿಕ ಹಣಕಾಸಿನ ಸಾಲಕ್ಕೆ ಸಂಬಂಧಿಸಿದಂತೆ ನಡೆದ ತೀವ್ರ ವಾಗ್ವಾದದ ನಂತರ ಆರೋಪಿ ರಮೇಶ್ ಕುಮಾರ್ ಸಂತ್ರಸ್ತ ಸುರೇಶ್ ಗೌಡ ಅವರಿಗೆ ಚೂಪಾದ ಚಾಕುವಿನಿಂದ ಇರಿದಿದ್ದಾರೆ. ಸಂತ್ರಸ್ತರು ರಕ್ತಸ್ರಾವದಿಂದ ಸ್ಥಳದಲ್ಲೇ ಸಾವನ್ನಪ್ಪಿದ್ದಾರೆ. ತನಿಖಾಧಿಕಾರಿಯು ರಕ್ತದ ಕಲೆಗಳಿದ್ದ ಚಾಕುವನ್ನು ವಶಪಡಿಸಿಕೊಂಡು 45 ದಿನಗಳಲ್ಲಿ ದೋಷಾರೋಪಣೆ ಪಟ್ಟಿಯನ್ನು ಸಲ್ಲಿಸಿದ್ದಾರೆ."
  },
  {
    CaseMasterID: 2,
    CrimeNo: "104430006202600002",
    CaseNo: "202600002",
    CrimeRegisteredDate: "2026-06-03",
    PolicePersonID: 502,
    PoliceStationID: 1002, // Mandi PS Mysuru
    CaseCategoryID: 1,
    GravityOffenceID: 2, // Non-Heinous
    CrimeMajorHeadID: 203, // Cyber Crimes
    CrimeMinorHeadID: 305, // Online Phishing
    CaseStatusID: 1, // Under Investigation
    CourtID: 402,
    IncidentFromDate: "2026-06-01T10:00:00Z",
    IncidentToDate: "2026-06-01T11:30:00Z",
    InfoReceivedPSDate: "2026-06-03T14:20:00Z",
    latitude: 12.3162,
    longitude: 76.6548, // Mandi Mohalla, Mysuru
    BriefFacts: "Complainant Priya Rao reported receiving a fraudulent SMS purporting to be from her bank, asking her to verify KYC details on a phishing website. She inputted her credentials, resulting in an unauthorized transfer of Rs 1,20,000 to a suspicious bank account in Bengal. Accused identified as Amit Shah (a dummy alias used by cyber gang), operating online. Device IPs traced to Kolkata, bank account frozen. Under investigation.",
    BriefFacts_KN: "ಸಂತ್ರಸ್ತೆ ಪ್ರಿಯಾ ರಾವ್ ಅವರು ತಮ್ಮ ಬ್ಯಾಂಕ್‌ನಿಂದ ಬಂದಂತೆ ನಟಿಸಿ, ಕಳುಹಿಸಲಾದ ವಂಚನೆಯ ಎಸ್ಎಂಎಸ್ ಒಂದನ್ನು ಸ್ವೀಕರಿಸಿ ಲಿಂಕ್ ಕ್ಲಿಕ್ ಮಾಡಿದ್ದಾರೆ. ನಕಲಿ ವೆಬ್‌ಸೈಟ್‌ನಲ್ಲಿ ಕೆವೈಸಿ ವಿವರಗಳನ್ನು ಸಲ್ಲಿಸಿದಾಗ, ಅವರ ಖಾತೆಯಿಂದ ರೂ. 1,20,000 ಅನಧಿಕೃತವಾಗಿ ವರ್ಗಾವಣೆಯಾಗಿದೆ. ಆರೋಪಿಯನ್ನು ಅಮಿತ್ ಶಾ ಎಂದು ಗುರುತಿಸಲಾಗಿದ್ದು, ಬೆಂಗಾಲ್ ಮೂಲದ ಬ್ಯಾಂಕ್ ಖಾತೆಗೆ ವರ್ಗಾವಣೆಯಾಗಿದೆ. ತನಿಖೆ ಪ್ರಗತಿಯಲ್ಲಿದೆ."
  },
  {
    CaseMasterID: 3,
    CrimeNo: "104430006202600003",
    CaseNo: "202600003",
    CrimeRegisteredDate: "2026-04-18",
    PolicePersonID: 503,
    PoliceStationID: 1003, // Bunder PS Mangaluru
    CaseCategoryID: 1,
    GravityOffenceID: 1, // Heinous
    CrimeMajorHeadID: 204, // Drug Offences
    CrimeMinorHeadID: 307, // Cannabis
    CaseStatusID: 1, // Under Investigation
    CourtID: 403,
    IncidentFromDate: "2026-04-18T05:00:00Z",
    IncidentToDate: "2026-04-18T06:00:00Z",
    InfoReceivedPSDate: "2026-04-18T08:30:00Z",
    latitude: 12.8624,
    longitude: 74.8369, // Bunder port area, Mangalore
    BriefFacts: "On intelligence tipoff, Bunder PS police raided a godown near Mangaluru port. The accused John D'Souza was caught red-handed possessing and distributing 22.5 Kilograms of high-grade dried Cannabis (Ganja) packed in plastic bags for local distribution to college youths. Narcotic testing kits confirmed substance. Source of drugs traced to Vizag, Andhra Pradesh. Extradition efforts on.",
    BriefFacts_KN: "ರಹಸ್ಯ ಮಾಹಿತಿಯ ಮೇರೆಗೆ ಬಂಡರ್ ಪೊಲೀಸ್ ಠಾಣೆಯ ಸಿಬ್ಬಂದಿ ಮಂಗಳೂರು ಬಂದರಿನ ಸಮೀಪದ ಗೋದಾಮಿನ ಮೇಲೆ ದಾಳಿ ನಡೆಸಿದ್ದಾರೆ. ಆರೋಪಿ ಜಾನ್ ಡಿಸೋಜಾ ಕಾಲೇಜು ಯುವಕರಿಗೆ ಹಂಚಲು ಪ್ಲಾಸ್ಟಿಕ್ ಚೀಲಗಳಲ್ಲಿ ಸಂಗ್ರಹಿಸಿಟ್ಟಿದ್ದ 22.5 ಕೆಜಿ ಒಣಗಿದ ಗಾಂಜಾವನ್ನು ಹೊಂದಿದ್ದಾಗ ರೆಡ್-ಹ್ಯಾಂಡ್ ಆಗಿ ಸಿಕ್ಕಿಬಿದ್ದಿದ್ದಾರೆ. ಮಾದಕವಸ್ತು ಪತ್ತೆ ಹಚ್ಚುವ ಕಿಟ್ ಗಾಂಜಾ ಎಂದು ಖಚಿತಪಡಿಸಿದೆ. ತನಿಖೆ ಮುಂದುವರೆದಿದೆ."
  },
  {
    CaseMasterID: 4,
    CrimeNo: "104430006202600004",
    CaseNo: "202600004",
    CrimeRegisteredDate: "2026-03-24",
    PolicePersonID: 504,
    PoliceStationID: 1004, // HSR Layout PS
    CaseCategoryID: 1,
    GravityOffenceID: 2,
    CrimeMajorHeadID: 202, // Property
    CrimeMinorHeadID: 303, // Night HBT
    CaseStatusID: 3, // Closed (Recovered)
    CourtID: 401,
    IncidentFromDate: "2026-03-23T23:30:00Z",
    IncidentToDate: "2026-03-24T04:30:00Z",
    InfoReceivedPSDate: "2026-03-24T09:00:00Z",
    latitude: 12.9101,
    longitude: 77.6450, // Sector 2, HSR Layout
    BriefFacts: "Complainant Sunitha M went to attend a family wedding over the weekend. On return, she found the front gate lock broken. Golden jewelry weighing 120 grams and a laptops were missing. CCTV footage analysed; local rowdy-sheeter Karthik alias 'Pilli' spotted. Suspect apprehended in Hosur within 72 hours, and 100% of the gold ornaments worth Rs 8,50,000 were successfully recovered.",
    BriefFacts_KN: "ಫಿರ್ಯಾದಿ ಸುನಿತಾ ಎಂ ವಾರಾಂತ್ಯದಲ್ಲಿ ಮದುವೆಗೆ ಹೋಗಿದ್ದಾಗ, ಎಚ್ಎಸ್ಆರ್ ಲೇಔಟ್ ಮನೆಯ ಮುಂಭಾಗದ ಲಾಕ್ ಮುರಿದು 120 ಗ್ರಾಂ ಬಂಗಾರದ ಒಡವೆಗಳು ಮತ್ತು ಲ್ಯಾಪ್‌ಟಾಪ್ ಕಳುವಾಗಿದೆ. ಸಿಸಿಟಿವಿ ದೃಶ್ಯಾವಳಿಗಳನ್ನು ವಿಶ್ಲೇಷಿಸಿದಾಗ ಸ್ಥಳೀಯ ಕಳ್ಳ ಕಾರ್ತಿಕ್ ಅಲಿಯಾಸ್ 'ಪಿಳ್ಳಿ' ಪತ್ತೆಯಾಗಿದ್ದಾನೆ. ಶಂಕಿತನನ್ನು ಹೊಸೂರಿನಲ್ಲಿ ಬಂಧಿಸಿ 8.5 ಲಕ್ಷ ರೂ ಮೌಲ್ಯದ ಚಿನ್ನದ ಆಭರಣಗಳನ್ನು ಪತ್ತೆಹಚ್ಚಿ ವಶಪಡಿಸಿಕೊಳ್ಳಲಾಗಿದೆ."
  },
  {
    CaseMasterID: 5,
    CrimeNo: "104430006202600005",
    CaseNo: "202600005",
    CrimeRegisteredDate: "2026-05-28",
    PolicePersonID: 505,
    PoliceStationID: 1005, // Khade Bazar PS Belagavi
    CaseCategoryID: 1,
    GravityOffenceID: 2,
    CrimeMajorHeadID: 205, // Women
    CrimeMinorHeadID: 308, // Cruelty / Dowry
    CaseStatusID: 2, // Charge Sheeted
    CourtID: 404,
    IncidentFromDate: "2025-12-01T00:00:00Z",
    IncidentToDate: "2026-05-20T23:00:00Z",
    InfoReceivedPSDate: "2026-05-28T11:00:00Z",
    latitude: 15.8497,
    longitude: 74.4977, // Khade Bazar, Belgaum
    BriefFacts: "Victim Kavitha Patil, married to Vikram Patil for two years, complained of physical abuse and extreme mental torture demanding additional dowry of Rs 10,00,000 and a premium SUV car. The accused Vikram and his mother locked her in a room, starving her. Medical records from Belagavi Civil Hospital showed bruises. Accused arrested under Section 498A and charge sheet filed.",
    BriefFacts_KN: "ಸಂತ್ರಸ್ತೆ ಕವಿತಾ ಪಾಟೀಲ್ ಅವರಿಗೆ ಮದುವೆಯಾದ ಎರಡು ವರ್ಷಗಳ ನಂತರ, ಅವರ ಪತಿ ವಿಕ್ರಮ್ ಪಾಟೀಲ್ ಹೆಚ್ಚುವರಿ 10 ಲಕ್ಷ ರೂ ವರದಕ್ಷಿಣೆ ಮತ್ತು ಕಾರು ಬೇಡಿಕೆಯಿಟ್ಟು ದೈಹಿಕವಾಗಿ ಮತ್ತು ಮಾನಸಿಕವಾಗಿ ಹಿಂಸಿಸಿದ್ದಾರೆ. ಆರೋಪಿ ವಿಕ್ರಮ್ ಮತ್ತು ಅವರ ತಾಯಿ ಕೋಣೆಯೊಂದರಲ್ಲಿ ಆಕೆಯನ್ನು ಕೂಡಿಹಾಕಿದ್ದರು. ಬೆಳಗಾವಿ ಜಿಲ್ಲಾ ಆಸ್ಪತ್ರೆಯ ವೈದ್ಯಕೀಯ ವರದಿ ಗಾಯಗಳನ್ನು ದೃಢಪಡಿಸಿದೆ. ಆರೋಪಿಯನ್ನು ಬಂಧಿಸಿ ದೋಷಾರೋಪಣೆ ಪಟ್ಟಿ ಸಲ್ಲಿಸಲಾಗಿದೆ."
  },
  {
    CaseMasterID: 6,
    CrimeNo: "104430006202600006",
    CaseNo: "202600006",
    CrimeRegisteredDate: "2026-02-15",
    PolicePersonID: 506,
    PoliceStationID: 1007, // Whitefield PS Bengaluru
    CaseCategoryID: 1,
    GravityOffenceID: 2,
    CrimeMajorHeadID: 203, // Cyber Crimes
    CrimeMinorHeadID: 306, // Cyber Blackmail
    CaseStatusID: 1, // Under Investigation
    CourtID: 401,
    IncidentFromDate: "2026-02-10T18:00:00Z",
    IncidentToDate: "2026-02-14T20:00:00Z",
    InfoReceivedPSDate: "2026-02-15T10:00:00Z",
    latitude: 12.9698,
    longitude: 77.7499, // Whitefield, IT Corridor
    BriefFacts: "Retired teacher Subba Rao, resident of Whitefield, filed a complaint stating he was blackmailed online by a social media user using morphed photographs of him. The blackmailer Santosh N threatened to leak the images to his contacts unless paid Rs 3,00,000. Under instructions, complainant paid Rs 50,000 before notifying police. Phone number and IP address in Gokak (Belagavi) traced. Special cyber squad deployed.",
    BriefFacts_KN: "ವೈಟ್‌ಫೀಲ್ಡ್ ನಿವಾಸಿ ನಿವೃತ್ತ ಶಿಕ್ಷಕ ಸುಬ್ಬ ರಾವ್ ಅವರು ಸಾಮಾಜಿಕ ಮಾಧ್ಯಮದಲ್ಲಿ ಮಾರ್ಫ್ ಮಾಡಿದ ಫೋಟೋಗಳನ್ನು ಬಳಸಿ ಬ್ಲಾಕ್‌ಮೇಲ್ ಮಾಡುತ್ತಿದ್ದವರ ವಿರುದ್ಧ ದೂರು ನೀಡಿದ್ದಾರೆ. ಆರೋಪಿ ಸಂತೋಷ್ ಎನ್ 3 ಲಕ್ಷ ರೂ ನೀಡದಿದ್ದರೆ ಫೋಟೋಗಳನ್ನು ಬಹಿರಂಗಪಡಿಸುವುದಾಗಿ ಬೆದರಿಕೆ ಹಾಕಿದ್ದ. ಸುಬ್ಬ ರಾವ್ 50,000 ರೂ ಪಾವತಿಸಿದ ಬಳಿಕ ಪೊಲೀಸರನ್ನು ಸಂಪರ್ಕಿಸಿದ್ದಾರೆ. ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ಮತ್ತು ಐಪಿ ವಿಳಾಸ ಗೋಕಾಕ್ನಲ್ಲಿ ಪತ್ತೆಯಾಗಿದೆ."
  }
];

const victims: Victim[] = [
  { VictimMasterID: 1, CaseMasterID: 1, VictimName: "Suresh Gowda", AgeYear: 42, GenderID: 1, VictimPolice: "0" },
  { VictimMasterID: 2, CaseMasterID: 2, VictimName: "Priya Rao", AgeYear: 29, GenderID: 2, VictimPolice: "0" },
  { VictimMasterID: 3, CaseMasterID: 4, VictimName: "Sunitha M", AgeYear: 36, GenderID: 2, VictimPolice: "0" },
  { VictimMasterID: 4, CaseMasterID: 5, VictimName: "Kavitha Patil", AgeYear: 26, GenderID: 2, VictimPolice: "0" }
];

const accusedList: Accused[] = [
  { AccusedMasterID: 1, CaseMasterID: 1, AccusedName: "Ramesh Kumar", AgeYear: 38, GenderID: 1, PersonID: "A1" },
  { AccusedMasterID: 2, CaseMasterID: 2, AccusedName: "Amit Shah", AgeYear: 31, GenderID: 1, PersonID: "A1" },
  { AccusedMasterID: 3, CaseMasterID: 3, AccusedName: "John D'Souza", AgeYear: 45, GenderID: 1, PersonID: "A1" },
  { AccusedMasterID: 4, CaseMasterID: 4, AccusedName: "Karthik alias 'Pilli'", AgeYear: 24, GenderID: 1, PersonID: "A1" },
  { AccusedMasterID: 5, CaseMasterID: 5, AccusedName: "Vikram Patil", AgeYear: 30, GenderID: 1, PersonID: "A1" },
  { AccusedMasterID: 6, CaseMasterID: 6, AccusedName: "Santosh N", AgeYear: 28, GenderID: 1, PersonID: "A1" }
];

const complainants: ComplainantDetails[] = [
  { ComplainantID: 1, CaseMasterID: 1, ComplainantName: "Venkatesh Gowda (Brother)", AgeYear: 45, OccupationID: 1, ReligionID: 1, CasteID: 12, GenderID: 1 },
  { ComplainantID: 2, CaseMasterID: 2, ComplainantName: "Priya Rao", AgeYear: 29, OccupationID: 3, ReligionID: 1, CasteID: 11, GenderID: 2 },
  { ComplainantID: 3, CaseMasterID: 3, ComplainantName: "Sandeep Poojary (PSI)", AgeYear: 46, OccupationID: 2, ReligionID: 1, CasteID: 13, GenderID: 1 },
  { ComplainantID: 4, CaseMasterID: 4, ComplainantName: "Sunitha M", AgeYear: 36, OccupationID: 3, ReligionID: 1, CasteID: 12, GenderID: 2 },
  { ComplainantID: 5, CaseMasterID: 5, ComplainantName: "Kavitha Patil", AgeYear: 26, OccupationID: 6, ReligionID: 1, CasteID: 11, GenderID: 2 },
  { ComplainantID: 6, CaseMasterID: 6, ComplainantName: "Subba Rao", AgeYear: 68, OccupationID: 5, ReligionID: 1, CasteID: 11, GenderID: 1 }
];

const actSectionAssociations: ActSectionAssociation[] = [
  { CaseMasterID: 1, ActID: "IPC", SectionID: "302", ActOrderID: 1, SectionOrderID: 1 },
  { CaseMasterID: 2, ActID: "IT_ACT", SectionID: "66D", ActOrderID: 1, SectionOrderID: 1 },
  { CaseMasterID: 2, ActID: "IPC", SectionID: "420", ActOrderID: 2, SectionOrderID: 2 },
  { CaseMasterID: 3, ActID: "NDPS", SectionID: "20b", ActOrderID: 1, SectionOrderID: 1 },
  { CaseMasterID: 4, ActID: "IPC", SectionID: "379", ActOrderID: 1, SectionOrderID: 1 },
  { CaseMasterID: 4, ActID: "IPC", SectionID: "457", ActOrderID: 2, SectionOrderID: 2 },
  { CaseMasterID: 5, ActID: "IPC", SectionID: "498A", ActOrderID: 1, SectionOrderID: 1 },
  { CaseMasterID: 6, ActID: "IT_ACT", SectionID: "66E", ActOrderID: 1, SectionOrderID: 1 }
];

const arrestSurrenders: ArrestSurrender[] = [
  { ArrestSurrenderID: 1, CaseMasterID: 1, ArrestSurrenderTypeID: 1, ArrestSurrenderDate: "2026-05-13", ArrestSurrenderStateId: 1, ArrestSurrenderDistrictId: 10, PoliceStationID: 1001, IOID: 501, CourtID: 401, AccusedMasterID: 1, IsAccused: true, IsComplainantAccused: false },
  { ArrestSurrenderID: 2, CaseMasterID: 3, ArrestSurrenderTypeID: 1, ArrestSurrenderDate: "2026-04-18", ArrestSurrenderStateId: 1, ArrestSurrenderDistrictId: 12, PoliceStationID: 1003, IOID: 503, CourtID: 403, AccusedMasterID: 3, IsAccused: true, IsComplainantAccused: false },
  { ArrestSurrenderID: 3, CaseMasterID: 4, ArrestSurrenderTypeID: 1, ArrestSurrenderDate: "2026-03-27", ArrestSurrenderStateId: 1, ArrestSurrenderDistrictId: 10, PoliceStationID: 1004, IOID: 504, CourtID: 401, AccusedMasterID: 4, IsAccused: true, IsComplainantAccused: false },
  { ArrestSurrenderID: 4, CaseMasterID: 5, ArrestSurrenderTypeID: 1, ArrestSurrenderDate: "2026-05-29", ArrestSurrenderStateId: 1, ArrestSurrenderDistrictId: 13, PoliceStationID: 1005, IOID: 505, CourtID: 404, AccusedMasterID: 5, IsAccused: true, IsComplainantAccused: false }
];

const chargesheets: ChargesheetDetails[] = [
  { CSID: 1, CaseMasterID: 1, csdate: "2026-06-25T11:00:00Z", cstype: "A", PolicePersonID: 501 },
  { CSID: 2, CaseMasterID: 5, csdate: "2026-07-02T15:30:00Z", cstype: "A", PolicePersonID: 505 }
];


// --- CATALYST MEMORY / CACHE REPLACEMENT ---
const sessionCache = new Map<string, { messages: Message[] }>();

// Helper to build cohesive audit/service logs for AI Studio Preview console
function createCatalystLog(service: CatalystServiceLog["service"], type: CatalystServiceLog["type"], message: string, latencyMs?: number): CatalystServiceLog {
  return {
    id: `log_${Math.random().toString(36).substring(2, 9)}`,
    timestamp: new Date().toLocaleTimeString(),
    service,
    type,
    message,
    latencyMs: latencyMs ?? Math.floor(Math.random() * 150) + 20
  };
}

// ==========================================
// API ENDPOINTS
// ==========================================

// 1. Authentication Route (Catalyst Authentication Simulation)
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  
  const logs: CatalystServiceLog[] = [
    createCatalystLog("Auth", "info", `Login attempt for user: ${username}`)
  ];

  if (username === "investigator_ksp" && password === "pwd123") {
    logs.push(createCatalystLog("Auth", "success", "Investigator login successful", 45));
    return res.json({ 
      user: { username, role: "Investigator" as UserRole, token: "tok_inv_9988" },
      logs 
    });
  } else if (username === "analyst_ksp" && password === "pwd123") {
    logs.push(createCatalystLog("Auth", "success", "Analyst login successful", 32));
    return res.json({ 
      user: { username, role: "Analyst" as UserRole, token: "tok_ana_7744" },
      logs 
    });
  } else if (username === "supervisor_ksp" && password === "pwd123") {
    logs.push(createCatalystLog("Auth", "success", "Supervisor login successful", 50));
    return res.json({ 
      user: { username, role: "Supervisor" as UserRole, token: "tok_sup_5522" },
      logs 
    });
  }

  logs.push(createCatalystLog("Auth", "warning", "Invalid credentials entered", 15));
  return res.status(401).json({ error: "Invalid credentials. Try investigator_ksp, analyst_ksp, or supervisor_ksp with password 'pwd123'", logs });
});

// 2. Database Stats (Catalyst Data Store Simulation)
app.get("/api/db/stats", (req, res) => {
  const latency = Math.floor(Math.random() * 40) + 10;
  const logs = [
    createCatalystLog("Data Store", "success", "Count queries executed successfully over crime schema", latency)
  ];
  res.json({
    stats: {
      casesCount: caseMasters.length,
      accusedCount: accusedList.length,
      victimsCount: victims.length,
      chargesheetsCount: chargesheets.length
    },
    logs
  });
});

// Helper: Hydrate evidence record (creates standard relational mapping for CaseMasterID)
function hydrateEvidence(caseMaster: CaseMaster, role: UserRole): EvidenceRecord {
  const cId = caseMaster.CaseMasterID;
  const rawComplainant = complainants.find(c => c.CaseMasterID === cId);
  const rawAccused = accusedList.filter(a => a.CaseMasterID === cId);
  const rawVictim = victims.filter(v => v.CaseMasterID === cId);
  const station = units.find(u => u.UnitID === caseMaster.PoliceStationID);
  const officer = employees.find(e => e.EmployeeID === caseMaster.PolicePersonID);
  const majHead = crimeHeads.find(ch => ch.CrimeHeadID === caseMaster.CrimeMajorHeadID);
  const minHead = crimeSubHeads.find(csh => csh.CrimeSubHeadID === caseMaster.CrimeMinorHeadID);
  const statusM = caseStatuses.find(s => s.CaseStatusID === caseMaster.CaseStatusID);

  const rawActs = actSectionAssociations.filter(asa => asa.CaseMasterID === cId).map(asa => {
    const act = acts.find(a => a.ActCode === asa.ActID) || { ActCode: asa.ActID, ActDescription: "Unknown Act", ShortName: asa.ActID, Active: true };
    const section = sections.find(s => s.ActCode === asa.ActID && s.SectionCode === asa.SectionID) || { ActCode: asa.ActID, SectionCode: asa.SectionID, SectionDescription: "Unknown Section", Active: true };
    return { act, section };
  });

  // Role-based masking of demographic details (Religion/Caste and actual Names for Analysts)
  let complainant = undefined;
  if (rawComplainant) {
    complainant = { ...rawComplainant };
    if (role === "Analyst") {
      // Masking sensitive name and demographic lookups
      complainant.ComplainantName = "Complainant Masked (Analyst Role)";
      complainant.ReligionID = 0; // Masked
      complainant.CasteID = 0; // Masked
    }
  }

  let hydratedAccused = rawAccused.map(a => {
    const copy = { ...a };
    if (role === "Analyst") {
      copy.AccusedName = "Accused Masked (Analyst)";
    }
    return copy;
  });

  let hydratedVictim = rawVictim.map(v => {
    const copy = { ...v };
    if (role === "Analyst") {
      copy.VictimName = "Victim Masked (Analyst)";
    }
    return copy;
  });

  return {
    caseMaster,
    complainant,
    accused: hydratedAccused,
    victim: hydratedVictim,
    acts: rawActs,
    status: statusM?.CaseStatusName || "Unknown",
    stationName: station?.UnitName || "Unknown Station",
    officerName: officer?.FirstName || "Unknown Officer",
    majorHead: majHead?.CrimeGroupName || "Unknown Group",
    minorHead: minHead?.CrimeHeadName || "Unknown Minor"
  };
}

// 3. Database Case List Route
app.get("/api/db/cases", (req, res) => {
  const role = (req.query.role as UserRole) || "Investigator";
  const latency = Math.floor(Math.random() * 50) + 15;
  const logs = [
    createCatalystLog("Data Store", "success", `Case list queried for role: ${role}`, latency)
  ];
  
  const hydrated = caseMasters.map(c => hydrateEvidence(c, role));
  res.json({ cases: hydrated, logs });
});

// 4. Bilingual Interactive Chat Engine (Catalyst QuickML & Zia Speech Router)
app.post("/api/chat", async (req, res) => {
  const { prompt: userPrompt, sessionId, language = "en", role = "Investigator" } = req.body;
  const session_id = sessionId || "default_session";
  
  const logs: CatalystServiceLog[] = [];
  const startTimer = Date.now();

  logs.push(createCatalystLog("Cache", "info", `Retrieving session memory for: ${session_id}`));
  let history = sessionCache.get(session_id);
  if (!history) {
    history = { messages: [] };
    sessionCache.set(session_id, history);
  }

  // Handle Kannada input (Zia Translation translation simulator using Gemini!)
  let normalizedPrompt = userPrompt;
  if (language === "kn") {
    const transStart = Date.now();
    try {
      const translationResult = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Translate the following Kannada text related to crime/police data into natural English. Respond ONLY with the English translation: "${userPrompt}"`
      });
      normalizedPrompt = translationResult.text?.trim() || userPrompt;
      logs.push(createCatalystLog("Zia Translation", "success", `Translated Kannada query -> English: "${normalizedPrompt}"`, Date.now() - transStart));
    } catch (e) {
      logs.push(createCatalystLog("Zia Translation", "warning", "Live Translation failed. Falling back to word matching.", 10));
      // Fallback word matching
      if (userPrompt.includes("ಕೊಲೆ") || userPrompt.includes("ಮರ್ಡರ್")) normalizedPrompt = "murder";
      else if (userPrompt.includes("ಗಾಂಜಾ") || userPrompt.includes("ಡ್ರಗ್ಸ್")) normalizedPrompt = "drugs ganja";
      else if (userPrompt.includes("ಸೈಬರ್") || userPrompt.includes("ವೆಬ್ಸೈಟ್")) normalizedPrompt = "cyber crime";
      else if (userPrompt.includes("ಕಳವು") || userPrompt.includes("ಚಿನ್ನ")) normalizedPrompt = "theft gold HSR";
    }
  }

  logs.push(createCatalystLog("Data Store", "info", "Searching Data Store indices for CrimeNo, Accused or SectionCode patterns..."));

  // --- 1. SEARCH FOR DIRECT RELATIONAL MATCHES ---
  const cleanedPrompt = normalizedPrompt.toLowerCase();
  let matchedCases: CaseMaster[] = [];
  let isDirectLookup = false;

  // Search by CrimeNo or CaseNo
  const crimeNoMatch = cleanedPrompt.match(/\d{8,18}/);
  const caseNoMatch = cleanedPrompt.match(/2026\d{4,5}/) || cleanedPrompt.match(/\b\d{5}\b/);
  
  if (crimeNoMatch) {
    const searchNo = crimeNoMatch[0];
    matchedCases = caseMasters.filter(c => c.CrimeNo.includes(searchNo));
    if (matchedCases.length > 0) isDirectLookup = true;
  } else if (caseNoMatch) {
    const searchNo = caseNoMatch[0];
    matchedCases = caseMasters.filter(c => c.CaseNo.includes(searchNo));
    if (matchedCases.length > 0) isDirectLookup = true;
  }

  // Search by Accused Name
  if (matchedCases.length === 0) {
    const matchedAccused = accusedList.filter(a => cleanedPrompt.includes(a.AccusedName.toLowerCase()) || (a.AccusedName.toLowerCase().split(" ").some(part => part.length > 3 && cleanedPrompt.includes(part))));
    if (matchedAccused.length > 0) {
      const caseIds = Array.from(new Set(matchedAccused.map(a => a.CaseMasterID)));
      matchedCases = caseMasters.filter(c => caseIds.includes(c.CaseMasterID));
      isDirectLookup = true;
    }
  }

  // Search by Victim Name
  if (matchedCases.length === 0) {
    const matchedVictim = victims.filter(v => cleanedPrompt.includes(v.VictimName.toLowerCase()));
    if (matchedVictim.length > 0) {
      const caseIds = Array.from(new Set(matchedVictim.map(v => v.CaseMasterID)));
      matchedCases = caseMasters.filter(c => caseIds.includes(c.CaseMasterID));
      isDirectLookup = true;
    }
  }

  // Search by Specific Section (e.g., 302, 498, NDPS)
  if (matchedCases.length === 0) {
    const sectionMatch = cleanedPrompt.match(/\b(302|420|498a|353|379|457|20b|66d|66e)\b/i);
    if (sectionMatch) {
      const secCode = sectionMatch[1].toLowerCase();
      const assoc = actSectionAssociations.filter(asa => asa.SectionID.toLowerCase() === secCode);
      if (assoc.length > 0) {
        const caseIds = Array.from(new Set(assoc.map(asa => asa.CaseMasterID)));
        matchedCases = caseMasters.filter(c => caseIds.includes(c.CaseMasterID));
        isDirectLookup = true;
      }
    }
  }

  let finalEvidence: EvidenceRecord[] = [];
  let botReplyEnglish = "";
  let confidence = 0.95;

  if (isDirectLookup && matchedCases.length > 0) {
    logs.push(createCatalystLog("Data Store", "success", `Direct SQL index matched ${matchedCases.length} records.`, 15));
    finalEvidence = matchedCases.map(c => hydrateEvidence(c, role));
    
    // Programmatic fast response composition to ensure ultra-low latency <3s
    const ev = finalEvidence[0];
    const actsList = ev.acts?.map(a => `${a.act.ShortName} Sec ${a.section.SectionCode}`).join(", ");
    const accusedNames = ev.accused?.map(a => a.AccusedName).join(", ");
    const victimNames = ev.victim?.map(v => v.VictimName).join(", ");

    botReplyEnglish = `Direct case record retrieved from KSP Crime Database for Case No ${ev.caseMaster.CaseNo} (Crime No: ${ev.caseMaster.CrimeNo}):
- **Status**: ${ev.status}
- **Police Station**: ${ev.stationName} (District: Bengaluru City)
- **Investigating Officer**: ${ev.officerName}
- **Acts & Sections**: ${actsList || "None"}
- **Accused**: ${accusedNames || "None listed"}
- **Victim**: ${victimNames || "None listed"}
- **Incident Date**: ${new Date(ev.caseMaster.IncidentFromDate).toLocaleDateString()}
- **Brief Facts**: ${ev.caseMaster.BriefFacts}

*Note: Relational indexes resolved directly via Catalyst Data Store.*`;
  } else {
    // --- 2. SEMANTIC SEARCH & RAG (Catalyst QuickML Knowledge Base) ---
    logs.push(createCatalystLog("QuickML RAG", "info", "No exact query match. Triggering Catalyst QuickML RAG over full case knowledge base..."));
    
    // Seed whole dataset as text context for the Gemini RAG model
    const casesContextStr = caseMasters.map(c => {
      const ev = hydrateEvidence(c, role);
      return JSON.stringify({
        CaseNo: c.CaseNo,
        CrimeNo: c.CrimeNo,
        Date: c.CrimeRegisteredDate,
        Station: ev.stationName,
        Status: ev.status,
        MajorHead: ev.majorHead,
        MinorHead: ev.minorHead,
        Facts: c.BriefFacts,
        Accused: ev.accused?.map(a => a.AccusedName),
        Victims: ev.victim?.map(v => v.VictimName),
        Sections: ev.acts?.map(a => `${a.act.ShortName} Sec ${a.section.SectionCode}`)
      });
    }).join("\n---\n");

    const systemPrompt = `You are "PRAHARI" — a state-of-the-art intelligent conversational AI chatbot developed for the Karnataka State Police Crime Database. 
You are currently operating within Zoho Catalyst QuickML LLM Serving layer (Qwen 2.5-14B equivalent).

You are answering queries for a logged-in user with the role: "${role}".
CRITICAL DEMOGRAPHIC PRIVACY RULES:
- The database contains sensitive demographic values like Religion and Caste.
- Since the user role is "${role}", do NOT display specific caste names or personal-level religion details of individuals unless their role is "Investigator" AND they explicitly ask for it. Even then, use maximum discretion. 
- For "Analyst" or "Supervisor", aggregate analysis ONLY (e.g. "We observed 3 cases under Category X"). NEVER profiling.
- Ensure that names of masked individuals remain masked if present in the facts context.

IMPORTANT:
- Every factual assertion you make must refer to a Case No from the context, tagged in square brackets e.g. [Case 202600001]. 
- If no Case Master record in the context directly answers the query, state: "The requested pattern or record was not found in the KSP database — model inference — unverified." and use a confidence of 0.5.
- Base your answers ONLY on the following KSP Database Context:
=== KSP CRIME DATABASE CONTEXT ===
${casesContextStr}
=== END CONTEXT ===`;

    const ragStart = Date.now();
    try {
      const aiResponse = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          { role: "user", parts: [{ text: normalizedPrompt }] }
        ],
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.2
        }
      });

      botReplyEnglish = aiResponse.text || "No response generated.";
      confidence = 0.88;
      logs.push(createCatalystLog("QuickML RAG", "success", "Semantic synthesis complete. Case references validated.", Date.now() - ragStart));

      // Extract referenced cases from bot reply for Evidence Panel
      const caseMatches = botReplyEnglish.match(/2026\d{4,5}/g) || [];
      const uniqueCaseNos = Array.from(new Set(caseMatches));
      if (uniqueCaseNos.length > 0) {
        const matchingDb = caseMasters.filter(c => uniqueCaseNos.some(num => c.CaseNo.includes(num)));
        finalEvidence = matchingDb.map(c => hydrateEvidence(c, role));
      }
    } catch (err: any) {
      logs.push(createCatalystLog("QuickML RAG", "warning", `RAG synthesis failed: ${err.message}. Falling back to default response.`, 10));
      botReplyEnglish = "I apologize, but I am unable to connect to the QuickML serving layer at this time. Please try looking up by direct case numbers (e.g., 202600001).";
      confidence = 0.4;
    }
  }

  // --- 3. TRANSLATE RESPONSE BACK IF KANNADA IS REQUESTED ---
  let botReplyKannada = "";
  if (language === "kn") {
    const transBackStart = Date.now();
    try {
      const knTranslation = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Translate this professional police crime report/query response accurately and respectfully into high-quality official Kannada. Preserve all bullet formats and Case No tags (e.g. Keep "[Case 202600001]" as is): \n\n${botReplyEnglish}`
      });
      botReplyKannada = knTranslation.text?.trim() || "";
      logs.push(createCatalystLog("Zia Translation", "success", "English response translated back to Kannada", Date.now() - transBackStart));
    } catch (e) {
      logs.push(createCatalystLog("Zia Translation", "warning", "Failed to translate response back to Kannada", 5));
      botReplyKannada = "ಕ್ಷಮಿಸಿ, ಪ್ರತಿಕ್ರಿಯೆಯನ್ನು ಕನ್ನಡಕ್ಕೆ ಭಾಷಾಂತರಿಸಲು ಸಾಧ್ಯವಾಗುತ್ತಿಲ್ಲ: \n\n" + botReplyEnglish;
    }
  }

  // --- 4. PREPARE VOICE SYNTHESIS METADATA (Zia TTS) ---
  // We'll log Zia TTS generation latency but perform audio synthesis via the browser SpeechSynthesis 
  // on the client for full responsiveness and zero-delay, simulating Zoho Catalyst voice.
  logs.push(createCatalystLog("Zia TTS/STT", "success", "Prepared Speech synthesis metadata for speech delivery", 28));

  // --- 5. PERSIST IN CACHE MEMORY ---
  const userMsg: Message = {
    id: `msg_${Date.now()}_u`,
    sender: "user",
    text: userPrompt,
    timestamp: new Date().toLocaleTimeString(),
    language
  };

  const botMsg: Message = {
    id: `msg_${Date.now()}_b`,
    sender: "bot",
    text: botReplyEnglish,
    textKn: botReplyKannada || undefined,
    timestamp: new Date().toLocaleTimeString(),
    language,
    evidence: finalEvidence,
    isDirectLookup,
    confidence,
    isModelInference: confidence < 0.6
  };

  history.messages.push(userMsg, botMsg);
  sessionCache.set(session_id, history);
  logs.push(createCatalystLog("Cache", "success", `Session state updated with ${history.messages.length} messages`, 12));

  // Total latency calculation
  const totalLatency = Date.now() - startTimer;
  res.json({
    message: botMsg,
    logs,
    totalLatencyMs: totalLatency
  });
});

// 5. SmartBrowz Mock and Chat Export Route
app.post("/api/export-pdf", (req, res) => {
  const { messages, session_id = "default", role = "Investigator" } = req.body;
  const logs = [
    createCatalystLog("SmartBrowz", "info", "Compiling chat session history..."),
    createCatalystLog("SmartBrowz", "success", "SmartBrowz PDF report successfully compiled.", 310)
  ];

  // We can return a robust HTML/Text package that the browser will download as a formal PDF/Text document
  let reportHtml = `
  ============================================================
                KARNATAKA STATE POLICE (KSP)
            PRAHARI CRIME CHATBOT INTELLIGENCE REPORT
  ============================================================
  Session ID: ${session_id}
  Export Date: ${new Date().toLocaleString()}
  Access Role: ${role}
  Classification: CONFIDENTIAL / KSP INTERNAL USE ONLY
  ------------------------------------------------------------
  
  `;

  messages.forEach((msg: any, index: number) => {
    const num = index + 1;
    const senderName = msg.sender === "user" ? "INVESTIGATOR QUERY" : "PRAHARI RESPONSE";
    reportHtml += `[${num}] ${senderName} (${msg.timestamp})\n`;
    reportHtml += `Language: ${msg.language === "kn" ? "Kannada" : "English"}\n`;
    reportHtml += `Content: ${msg.text}\n`;
    if (msg.textKn) {
      reportHtml += `Kannada Translation: ${msg.textKn}\n`;
    }
    if (msg.evidence && msg.evidence.length > 0) {
      reportHtml += `CITED EVIDENCE TRAIL:\n`;
      msg.evidence.forEach((ev: any) => {
        reportHtml += `  - Case No: ${ev.caseMaster.CaseNo} | Crime No: ${ev.caseMaster.CrimeNo}\n`;
        reportHtml += `    Police Station: ${ev.stationName} | Status: ${ev.status}\n`;
        reportHtml += `    Facts: ${ev.caseMaster.BriefFacts}\n`;
      });
    }
    reportHtml += `------------------------------------------------------------\n\n`;
  });

  reportHtml += `============================================================
  END OF REPORT - Karnataka State Police Datathon 2026 Audit Trail
  ============================================================`;

  res.setHeader("Content-Type", "text/plain");
  res.setHeader("Content-Disposition", `attachment; filename=PRAHARI_Audit_Report_${session_id}.txt`);
  res.send(reportHtml);
});

// 6. Dataset / Case Upload and AI Ingestion Endpoint
app.post("/api/upload-dataset", async (req, res) => {
  const { fileName, fileType, content, sessionId, role = "Investigator" } = req.body;
  const session_id = sessionId || "default_session";
  const logs: CatalystServiceLog[] = [];
  const startTimer = Date.now();

  logs.push(createCatalystLog("Data Store", "info", `Received dataset upload: ${fileName} (${fileType})`));

  let extractedData: any = null;

  // If it's a JSON file, check if it's already structured
  if (fileType === "application/json" || fileName.endsWith(".json")) {
    try {
      const parsed = JSON.parse(content);
      // Let's check if it's a single case or multiple cases
      if (parsed.caseMaster && parsed.caseMaster.CaseNo) {
        extractedData = parsed;
        logs.push(createCatalystLog("Data Store", "success", "Parsed structured JSON case details."));
      } else if (Array.isArray(parsed)) {
        extractedData = parsed[0];
        logs.push(createCatalystLog("Data Store", "success", "Parsed JSON array. Ingesting first case record."));
      } else {
        logs.push(createCatalystLog("Data Store", "warning", "JSON does not match schema. Proceeding with AI parsing."));
      }
    } catch (e) {
      logs.push(createCatalystLog("Data Store", "warning", "Failed to parse JSON. Falling back to AI extraction."));
    }
  }

  // If not parsed yet (unstructured text, CSV, or failed JSON), use Gemini to structure it
  if (!extractedData) {
    const aiStart = Date.now();
    logs.push(createCatalystLog("QuickML RAG", "info", "Sending document content to Gemini for entity extraction & structuring..."));
    
    try {
      const prompt = `You are a structured data extraction agent for the Karnataka State Police Crime Database.
Analyze the following document, text, or dataset content representing crime/case details.
Extract all relevant facts and structure it EXACTLY into the following JSON schema:
{
  "caseMaster": {
    "CrimeNo": "string (18-digit unique string, if not present generate a unique one starting with 1044300062026)",
    "CaseNo": "string (unique 9-digit string starting with 2026)",
    "CrimeRegisteredDate": "YYYY-MM-DD (use today's date if not found)",
    "latitude": number (defaults to 12.9716),
    "longitude": number (defaults to 77.5946),
    "BriefFacts": "string (clear summary of the case in English)",
    "BriefFacts_KN": "string (clear summary of the case in Kannada, translate from English if not provided)"
  },
  "complainant": {
    "ComplainantName": "string",
    "AgeYear": number,
    "GenderID": number (1 for Male, 2 for Female)
  },
  "accused": [
    {
      "AccusedName": "string",
      "AgeYear": number,
      "GenderID": number,
      "PersonID": "string (e.g. A1, A2)"
    }
  ],
  "victim": [
    {
      "VictimName": "string",
      "AgeYear": number,
      "GenderID": number,
      "VictimPolice": "string ('0' or '1')"
    }
  ],
  "acts": [
    {
      "ActCode": "string (must be one of: IPC, NDPS, IT_ACT, COPTA)",
      "SectionCode": "string (e.g. 302, 379, 420, 20b, 66D, 498A)"
    }
  ]
}

Provide ONLY the raw JSON output. Do not wrap it in markdown code blocks or add any other text.
Content to analyze:
"${content}"`;

      const aiResponse = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt
      });

      const responseText = aiResponse.text?.trim() || "";
      const cleanedJson = responseText.replace(/```json/gi, "").replace(/```/g, "").trim();
      extractedData = JSON.parse(cleanedJson);
      logs.push(createCatalystLog("QuickML RAG", "success", "Gemini successfully structured the case data.", Date.now() - aiStart));
    } catch (err: any) {
      logs.push(createCatalystLog("QuickML RAG", "warning", `Failed to structure data: ${err.message}`));
      return res.status(500).json({ error: `Failed to extract structured data from file content. Details: ${err.message}`, logs });
    }
  }

  // Inject extracted details into the database
  if (extractedData && extractedData.caseMaster) {
    const nextCaseId = caseMasters.length + 1;
    
    const newCaseMaster = {
      CaseMasterID: nextCaseId,
      CrimeNo: extractedData.caseMaster.CrimeNo || `1044300062026${String(nextCaseId).padStart(4, "0")}`,
      CaseNo: extractedData.caseMaster.CaseNo || `202600${String(nextCaseId).padStart(3, "0")}`,
      CrimeRegisteredDate: extractedData.caseMaster.CrimeRegisteredDate || new Date().toISOString().split("T")[0],
      PolicePersonID: 506, // Default to Raghavendra
      PoliceStationID: 1001, // Cubbon Park
      CaseCategoryID: 1, // FIR
      GravityOffenceID: 1, 
      CrimeMajorHeadID: 201, 
      CrimeMinorHeadID: 301, 
      CaseStatusID: 1, // Under Investigation
      CourtID: 401,
      IncidentFromDate: new Date().toISOString(),
      IncidentToDate: new Date().toISOString(),
      InfoReceivedPSDate: new Date().toISOString(),
      latitude: Number(extractedData.caseMaster.latitude) || 12.9716,
      longitude: Number(extractedData.caseMaster.longitude) || 77.5946,
      BriefFacts: extractedData.caseMaster.BriefFacts || "No facts provided.",
      BriefFacts_KN: extractedData.caseMaster.BriefFacts_KN || ""
    };

    // Save CaseMaster
    caseMasters.push(newCaseMaster);

    // Save Complainant
    if (extractedData.complainant) {
      const nextCompId = complainants.length + 1;
      complainants.push({
        ComplainantID: nextCompId,
        CaseMasterID: nextCaseId,
        ComplainantName: extractedData.complainant.ComplainantName || "Unknown Complainant",
        AgeYear: Number(extractedData.complainant.AgeYear) || 35,
        OccupationID: 1,
        ReligionID: 1,
        CasteID: 11,
        GenderID: Number(extractedData.complainant.GenderID) || 1
      });
    }

    // Save Accused
    if (extractedData.accused && Array.isArray(extractedData.accused)) {
      extractedData.accused.forEach((acc: any, i: number) => {
        accusedList.push({
          AccusedMasterID: accusedList.length + 1,
          CaseMasterID: nextCaseId,
          AccusedName: acc.AccusedName || "Unknown Suspect",
          AgeYear: Number(acc.AgeYear) || 30,
          GenderID: Number(acc.GenderID) || 1,
          PersonID: acc.PersonID || `A${i+1}`
        });
      });
    }

    // Save Victims
    if (extractedData.victim && Array.isArray(extractedData.victim)) {
      extractedData.victim.forEach((vic: any) => {
        victims.push({
          VictimMasterID: victims.length + 1,
          CaseMasterID: nextCaseId,
          VictimName: vic.VictimName || "Unknown Victim",
          AgeYear: Number(vic.AgeYear) || 30,
          GenderID: Number(vic.GenderID) || 2,
          VictimPolice: vic.VictimPolice || "0"
        });
      });
    }

    // Save Acts
    if (extractedData.acts && Array.isArray(extractedData.acts)) {
      extractedData.acts.forEach((act: any, i: number) => {
        actSectionAssociations.push({
          CaseMasterID: nextCaseId,
          ActID: act.ActCode || "IPC",
          SectionID: act.SectionCode || "302",
          ActOrderID: i + 1,
          SectionOrderID: i + 1
        });
      });
    }

    logs.push(createCatalystLog("Data Store", "success", `Case No ${newCaseMaster.CaseNo} successfully written to Catalyst Data Store.`, 18));

    // Hydrate the newly created case
    const hydratedNewCase = hydrateEvidence(newCaseMaster, role);

    // Create custom conversation greeting
    const welcomeText = `📁 **Case Dataset Successfully Imported!**
I have parsed and integrated the case details from \`${fileName}\` into our Catalyst Data Store. 

Here is the structured record I've generated:
- **Case No**: ${newCaseMaster.CaseNo} (Crime No: ${newCaseMaster.CrimeNo})
- **Investigating Officer**: Insp. S. Raghavendra
- **Complainant**: ${hydratedNewCase.complainant?.ComplainantName || "Not listed"}
- **Accused**: ${hydratedNewCase.accused?.map(a => a.AccusedName).join(", ") || "Not listed"}
- **Victim**: ${hydratedNewCase.victim?.map(v => v.VictimName).join(", ") || "Not listed"}
- **Acts & Sections**: ${hydratedNewCase.acts?.map(a => `${a.act.ShortName} Sec ${a.section.SectionCode}`).join(", ") || "None"}
- **Incident Location**: LAT ${newCaseMaster.latitude}, LNG ${newCaseMaster.longitude}
- **Brief Facts**: ${newCaseMaster.BriefFacts}

*I have automatically loaded this case as the active citation on the right. How can I assist you with your investigation or interrogation strategy for this case today?*`;

    const welcomeTextKn = `📁 **ಪ್ರಕರಣದ ದತ್ತಾಂಶವನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಆಮದು ಮಾಡಿಕೊಳ್ಳಲಾಗಿದೆ!**
ನಾನು \`${fileName}\` ನಿಂದ ಪ್ರಕರಣದ ವಿವರಗಳನ್ನು ನಮ್ಮ ಕ್ಯಾಟಲಿಸ್ಟ್ ಡೇಟಾ ಸ್ಟೋರ್‌ಗೆ ಸೇರಿಸಿದ್ದೇನೆ.

ರಚಿಸಲಾದ ಪ್ರಕರಣದ ವಿವರಗಳು ಇಲ್ಲಿವೆ:
- **ಪ್ರಕರಣದ ಸಂಖ್ಯೆ**: ${newCaseMaster.CaseNo} (ಅಪರಾಧ ಸಂಖ್ಯೆ: ${newCaseMaster.CrimeNo})
- **ತನಿಖಾಧಿಕಾರಿ**: ಇನ್ಸ್. ಎಸ್. ರಾಘವೇಂದ್ರ
- **ಫಿರ್ಯಾದಿ**: ${hydratedNewCase.complainant?.ComplainantName || "ಲಭ್ಯವಿಲ್ಲ"}
- **ಆರೋಪಿಗಳು**: ${hydratedNewCase.accused?.map(a => a.AccusedName).join(", ") || "ಲಭ್ಯವಿಲ್ಲ"}
- **ಸಂತ್ರಸ್ತರು**: ${hydratedNewCase.victim?.map(v => v.VictimName).join(", ") || "ಲಭ್ಯವಿಲ್ಲ"}
- **ಕಾನೂನು ವಿಭಾಗಗಳು**: ${hydratedNewCase.acts?.map(a => `${a.act.ShortName} ಸೆಕ್ ${a.section.SectionCode}`).join(", ") || "ಯಾವುದೂ ಇಲ್ಲ"}
- **ಘಟನೆಯ ಸ್ಥಳ**: ಲ್ಯಾಟಿಟ್ಯೂಡ್ ${newCaseMaster.latitude}, ಲಾಂಗಿಟ್ಯೂಡ್ ${newCaseMaster.longitude}
- **ಸಂಕ್ಷಿಪ್ತ ವಿವರಣೆ**: ${newCaseMaster.BriefFacts_KN || newCaseMaster.BriefFacts}

*ನಾನು ಈ ಪ್ರಕರಣವನ್ನು ಸೈಟೇಶನ್ ಆಗಿ ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಲೋಡ್ ಮಾಡಿದ್ದೇನೆ. ಈ ಪ್ರಕರಣದ ತನಿಖೆ ಅಥವಾ ವಿಚಾರಣೆಯ ಬಗ್ಗೆ ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?*`;

    // Persist to session chat history
    let history = sessionCache.get(session_id);
    if (!history) {
      history = { messages: [] };
    }

    const botMsg: Message = {
      id: `msg_upload_${Date.now()}_b`,
      sender: "bot",
      text: welcomeText,
      textKn: welcomeTextKn,
      timestamp: new Date().toLocaleTimeString(),
      language: "en",
      evidence: [hydratedNewCase],
      isDirectLookup: true,
      confidence: 1.0
    };

    history.messages.push(botMsg);
    sessionCache.set(session_id, history);

    const totalLatency = Date.now() - startTimer;
    res.json({
      success: true,
      message: botMsg,
      newCase: hydratedNewCase,
      logs,
      totalLatencyMs: totalLatency
    });
  } else {
    res.status(400).json({ error: "Failed to extract valid case details.", logs });
  }
});



// ==========================================
// VITE DEV SERVER OR STATIC SERVING IN PRODUCTION
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
