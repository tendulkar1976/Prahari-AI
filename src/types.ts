/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// --- USER ROLE TYPES ---
export type UserRole = "Investigator" | "Analyst" | "Supervisor";

export interface UserSession {
  username: string;
  role: UserRole;
  token: string;
}

// --- CORE KSP DATABASE SCHEMA (TABLES 1-24) ---

export interface CaseMaster {
  CaseMasterID: number;
  CrimeNo: string;
  CaseNo: string;
  CrimeRegisteredDate: string; // YYYY-MM-DD
  PolicePersonID: number; // FK -> Employee
  PoliceStationID: number; // FK -> Unit
  CaseCategoryID: number; // FK -> CaseCategory
  GravityOffenceID: number; // FK -> GravityOffence
  CrimeMajorHeadID: number; // FK -> CrimeHead
  CrimeMinorHeadID: number; // FK -> CrimeSubHead
  CaseStatusID: number; // FK -> CaseStatusMaster
  CourtID: number; // FK -> Court
  IncidentFromDate: string; // ISO datetime
  IncidentToDate: string; // ISO datetime
  InfoReceivedPSDate: string; // ISO datetime
  latitude: number;
  longitude: number;
  BriefFacts: string;
  BriefFacts_KN?: string; // Kannada facts
}

export interface Victim {
  VictimMasterID: number;
  CaseMasterID: number; // FK -> CaseMaster
  VictimName: string;
  AgeYear: number;
  GenderID: number; // 1: Male, 2: Female, 3: Transgender
  VictimPolice: string; // "1" if police, "0" if citizen
}

export interface Accused {
  AccusedMasterID: number;
  CaseMasterID: number; // FK -> CaseMaster
  AccusedName: string;
  AgeYear: number;
  GenderID: number; // 1: M, 2: F, 3: T
  PersonID: string; // e.g. "A1", "A2"
}

export interface ComplainantDetails {
  ComplainantID: number;
  CaseMasterID: number; // FK -> CaseMaster
  ComplainantName: string;
  AgeYear: number;
  OccupationID: number; // FK -> OccupationMaster
  ReligionID: number; // FK -> ReligionMaster
  CasteID: number; // FK -> CasteMaster
  GenderID: number;
}

export interface ActSectionAssociation {
  CaseMasterID: number; // FK -> CaseMaster
  ActID: string; // FK -> Act (ActCode)
  SectionID: string; // FK -> Section (SectionCode)
  ActOrderID: number;
  SectionOrderID: number;
}

export interface Act {
  ActCode: string; // PK e.g. "IPC", "NDPS"
  ActDescription: string;
  ShortName: string;
  Active: boolean;
}

export interface Section {
  ActCode: string; // FK -> Act
  SectionCode: string; // PK / Compound key with ActCode
  SectionDescription: string;
  Active: boolean;
}

export interface CrimeHead {
  CrimeHeadID: number;
  CrimeGroupName: string;
  Active: boolean;
}

export interface CrimeSubHead {
  CrimeSubHeadID: number;
  CrimeHeadID: number; // FK -> CrimeHead
  CrimeHeadName: string; // actually subhead name
  SeqID: number;
}

export interface CaseStatusMaster {
  CaseStatusID: number;
  CaseStatusName: string;
}

export interface CaseCategory {
  CaseCategoryID: number;
  LookupValue: string; // FIR, UDR, PCR, etc.
}

export interface GravityOffence {
  GravityOffenceID: number;
  LookupValue: string; // Heinous, Non-Heinous
}

export interface Unit {
  UnitID: number;
  UnitName: string;
  TypeID: number; // FK -> UnitType
  ParentUnit: number | null;
  StateID: number; // FK -> State
  DistrictID: number; // FK -> District
  Active: boolean;
}

export interface Employee {
  EmployeeID: number;
  DistrictID: number; // FK -> District
  UnitID: number; // FK -> Unit
  RankID: number; // FK -> Rank
  DesignationID: number; // FK -> Designation
  KGID: string; // Unique Karnataka Govt ID
  FirstName: string;
  EmployeeDOB: string; // YYYY-MM-DD
  GenderID: number;
  AppointmentDate: string; // YYYY-MM-DD
}

export interface District {
  DistrictID: number;
  DistrictName: string;
  StateID: number; // FK -> State
  Active: boolean;
}

export interface State {
  StateID: number;
  StateName: string;
  Active: boolean;
}

export interface Court {
  CourtID: number;
  CourtName: string;
  DistrictID: number; // FK -> District
  StateID: number; // FK -> State
  Active: boolean;
}

export interface Rank {
  RankID: number;
  RankName: string;
  Hierarchy: number;
  Active: boolean;
}

export interface Designation {
  DesignationID: number;
  DesignationName: string;
  Active: boolean;
}

export interface OccupationMaster {
  OccupationID: number;
  OccupationName: string;
}

export interface ReligionMaster {
  ReligionID: number;
  ReligionName: string;
}

export interface CasteMaster {
  caste_master_id: number;
  caste_master_name: string;
}

export interface ArrestSurrender {
  ArrestSurrenderID: number;
  CaseMasterID: number; // FK -> CaseMaster
  ArrestSurrenderTypeID: number; // 1: Arrest, 2: Surrender
  ArrestSurrenderDate: string;
  ArrestSurrenderStateId: number; // FK -> State
  ArrestSurrenderDistrictId: number; // FK -> District
  PoliceStationID: number; // FK -> Unit
  IOID: number; // FK -> Employee
  CourtID: number; // FK -> Court
  AccusedMasterID: number; // FK -> Accused
  IsAccused: boolean;
  IsComplainantAccused: boolean;
}

export interface ChargesheetDetails {
  CSID: number;
  CaseMasterID: number; // FK -> CaseMaster
  csdate: string;
  cstype: string; // 'A' -> Chargesheet, 'B' -> False Case, 'C' -> Undetected
  PolicePersonID: number; // FK -> Employee
}


// --- CHAT & SERVICE LOG TYPES ---

export interface EvidenceRecord {
  caseMaster: CaseMaster;
  victim?: Victim[];
  accused?: Accused[];
  complainant?: ComplainantDetails;
  acts?: { act: Act; section: Section }[];
  status?: string;
  stationName?: string;
  officerName?: string;
  majorHead?: string;
  minorHead?: string;
}

export interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
  textKn?: string; // Kannada response
  audioUrl?: string; // Voice synthesis
  timestamp: string;
  language: "en" | "kn";
  evidence?: EvidenceRecord[]; // Cited cases
  isDirectLookup?: boolean;
  confidence?: number; // 0 to 1
  isModelInference?: boolean; // True if unverified model inference
  isAudio?: boolean;
}

export interface CatalystServiceLog {
  id: string;
  timestamp: string;
  service: "Data Store" | "QuickML RAG" | "Zia Translation" | "Zia TTS/STT" | "Cache" | "SmartBrowz" | "Auth" | "API Gateway";
  type: "info" | "success" | "warning";
  message: string;
  latencyMs?: number;
}

export interface DatabaseStats {
  casesCount: number;
  accusedCount: number;
  victimsCount: number;
  chargesheetsCount: number;
}
