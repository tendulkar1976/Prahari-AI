/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { 
  Shield, MessageSquare, Database, Terminal, Download, Languages, 
  Mic, MicOff, Volume2, VolumeX, Search, User, Server, Activity, 
  CheckCircle2, AlertTriangle, RefreshCw, Compass, MapPin, Lock, 
  Unlock, FileText, ChevronRight, Sparkles, AlertCircle, FileSpreadsheet, Eye, Info,
  Paperclip, Upload, UploadCloud
} from "lucide-react";
import { 
  UserRole, Message, EvidenceRecord, CatalystServiceLog, DatabaseStats 
} from "./types";

export default function App() {
  // --- SESSION STATE ---
  const [activeRole, setActiveRole] = useState<UserRole>("Investigator");
  const [language, setLanguage] = useState<"en" | "kn">("en");
  const [sessionId, setSessionId] = useState<string>("");
  const [chatInput, setChatInput] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [logs, setLogs] = useState<CatalystServiceLog[]>([]);
  const [stats, setStats] = useState<DatabaseStats>({
    casesCount: 0,
    accusedCount: 0,
    victimsCount: 0,
    chargesheetsCount: 0
  });

  // --- UI TOGGLES ---
  const [showCatalystConsole, setShowCatalystConsole] = useState<boolean>(true);
  const [rightPanelTab, setRightPanelTab] = useState<"evidence" | "explorer" | "audit" | "upload">("evidence");
  const [loading, setLoading] = useState<boolean>(false);
  
  // --- DATABASE EXPLORER STATES ---
  const [dbCases, setDbCases] = useState<EvidenceRecord[]>([]);
  const [selectedCase, setSelectedCase] = useState<EvidenceRecord | null>(null);
  const [dbSearch, setDbSearch] = useState<string>("");
  const [selectedExplorerTable, setSelectedExplorerTable] = useState<string>("CaseMaster");

  // --- AUDIO STATES (ZIA SIMULATORS) ---
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [activeAudioMessageId, setActiveAudioMessageId] = useState<string | null>(null);

  // --- DATASET UPLOAD & PASTE STATES ---
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [pastedText, setPastedText] = useState<string>("");

  // --- REFS ---
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- INITIALIZE SESSION ---
  useEffect(() => {
    // Generate a secure session ID
    const generatedSessionId = `sess_${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    setSessionId(generatedSessionId);

    // Initial load
    fetchStats();
    fetchCasesList();

    // Welcome message from PRAHARI
    setMessages([
      {
        id: "msg_welcome",
        sender: "bot",
        text: "Jai Hind! I am **PRAHARI**, your Intelligent Conversational Assistant for the Karnataka State Police Crime Database.\n\nI can help you perform bilingual searches, locate specific FIRs, trace accused accomplices, or analyze crime head distributions. Every answer is retrieved directly from our Catalyst Data Store with an official citation audit trail.\n\n*How can I assist you with your investigation today?*",
        textKn: "ಜೈ ಹಿಂದ್! ನಾನು **ಪ್ರಹರಿ**, ಕರ್ನಾಟಕ ರಾಜ್ಯ ಪೊಲೀಸ್ ಅಪರಾಧ ದತ್ತಸಂಚಯಕ್ಕಾಗಿ ನಿಮ್ಮ ಬುದ್ಧಿವಂತ ಸಂವಾದಾತ್ಮಕ ಸಹಾಯಕ.\n\nದ್ವಿಭಾಷಾ ಹುಡುಕಾಟಗಳನ್ನು ನಡೆಸಲು, ನಿರ್ದಿಷ್ಟ ಎಫ್‌ಐಆರ್‌ಗಳನ್ನು ಪತ್ತೆಹಚ್ಚಲು, ಆರೋಪಿಗಳನ್ನು ಪತ್ತೆಹಚ್ಚಲು ಅಥವಾ ಅಪರಾಧಗಳ ವಿತರಣೆಯನ್ನು ವಿಶ್ಲೇಷಿಸಲು ನಾನು ನಿಮಗೆ ಸಹಾಯ ಮಾಡಬಲ್ಲೆ. ಪ್ರತಿಯೊಂದು ಉತ್ತರವನ್ನು ಅಧಿಕೃತ ಆಡಿಟ್ ಟ್ರಯಲ್‌ನೊಂದಿಗೆ ಕ್ಯಾಟಲಿಸ್ಟ್ ಡೇಟಾ ಸ್ಟೋರ್‌ನಿಂದ ನೇರವಾಗಿ ಪಡೆಯಲಾಗುತ್ತದೆ.",
        timestamp: new Date().toLocaleTimeString(),
        language: "en",
        confidence: 1.0
      }
    ]);

    addConsoleLog("Auth", "info", "User session initialized under 'Investigator' security clearance.", 10);
    addConsoleLog("Cache", "success", "Conversation cache initialized for Zoho Catalyst Cache Layer.", 12);
  }, []);

  // Update session data when role changes
  useEffect(() => {
    fetchCasesList();
    addConsoleLog("Auth", "info", `Cleared memory contexts. Loading database schema with security filters for: ${activeRole}`);
  }, [activeRole]);

  // Scroll to bottom of chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // --- API CALLS ---

  const addConsoleLog = (
    service: CatalystServiceLog["service"], 
    type: CatalystServiceLog["type"], 
    message: string, 
    latency?: number
  ) => {
    const newLog: CatalystServiceLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      timestamp: new Date().toLocaleTimeString(),
      service,
      type,
      message,
      latencyMs: latency ?? Math.floor(Math.random() * 80) + 15
    };
    setLogs(prev => [newLog, ...prev].slice(0, 50)); // Keep last 50 logs
  };

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/db/stats");
      const data = await res.json();
      if (data.stats) {
        setStats(data.stats);
      }
      if (data.logs) {
        data.logs.forEach((l: any) => addConsoleLog(l.service, l.type, l.message, l.latencyMs));
      }
    } catch (err) {
      console.error("Error fetching database stats", err);
    }
  };

  const fetchCasesList = async () => {
    try {
      const res = await fetch(`/api/db/cases?role=${activeRole}`);
      const data = await res.json();
      if (data.cases) {
        setDbCases(data.cases);
      }
      if (data.logs) {
        data.logs.forEach((l: any) => addConsoleLog(l.service, l.type, l.message, l.latencyMs));
      }
    } catch (err) {
      console.error("Error fetching cases list", err);
    }
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const promptToSend = customPrompt || chatInput;
    if (!promptToSend.trim()) return;

    // Clear input
    if (!customPrompt) setChatInput("");

    // Add user message
    const userMsg: Message = {
      id: `msg_user_${Date.now()}`,
      sender: "user",
      text: promptToSend,
      timestamp: new Date().toLocaleTimeString(),
      language
    };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      addConsoleLog("API Gateway", "info", `API Gateway received POST /api/chat. Throttling and Routing verified.`, 5);
      
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: promptToSend,
          sessionId,
          language,
          role: activeRole
        })
      });

      const data = await response.json();
      if (data.message) {
        setMessages(prev => [...prev, data.message]);
        
        // If there's citing evidence, automatically switch right panel tab to evidence
        if (data.message.evidence && data.message.evidence.length > 0) {
          setRightPanelTab("evidence");
          setSelectedCase(data.message.evidence[0]);
        }
      }

      if (data.logs) {
        data.logs.forEach((l: any) => addConsoleLog(l.service, l.type, l.message, l.latencyMs));
      }

      // Refresh aggregate stats in background
      fetchStats();

    } catch (err: any) {
      addConsoleLog("QuickML RAG", "warning", "Failed to retrieve RAG response: " + err.message);
      
      const errorMsg: Message = {
        id: `msg_err_${Date.now()}`,
        sender: "bot",
        text: "I apologize, but I encountered an error communicating with the KSP Database. Please verify your connection and try again.",
        timestamp: new Date().toLocaleTimeString(),
        language: "en",
        confidence: 0,
        isModelInference: true
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  // --- SPEECH RECOGNITION (ZIA STT SIMULATION) ---
  const startVoiceRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      addConsoleLog("Zia TTS/STT", "warning", "STT Triggered failed: Browser does not support SpeechRecognition.");
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    addConsoleLog("Zia TTS/STT", "info", `Requesting microphone access for: ${language === "kn" ? "Kannada (kn-IN)" : "English (en-IN)"}`);
    
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = language === "kn" ? "kn-IN" : "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsRecording(true);
      addConsoleLog("Zia TTS/STT", "info", "Microphone stream opened. Capture active...");
    };

    recognition.onresult = (event: any) => {
      const speechToText = event.results[0][0].transcript;
      addConsoleLog("Zia TTS/STT", "success", `STT resolved: "${speechToText}"`);
      setChatInput(speechToText);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event);
      addConsoleLog("Zia TTS/STT", "warning", `STT Error: ${event.error}`);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
  };

  // --- SPEECH SYNTHESIS (ZIA TTS SIMULATION) ---
  const toggleSpeechOutput = (messageId: string, textToSpeak: string) => {
    if (isSpeaking && activeAudioMessageId === messageId) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setActiveAudioMessageId(null);
      addConsoleLog("Zia TTS/STT", "info", "Text-to-speech output cancelled.");
      return;
    }

    window.speechSynthesis.cancel();
    addConsoleLog("Zia TTS/STT", "info", `Triggering Zia TTS synthesis for message. Language detected: ${language === "kn" ? "kn-IN" : "en-US"}`);

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = language === "kn" ? "kn-IN" : "en-US";
    
    utterance.onstart = () => {
      setIsSpeaking(true);
      setActiveAudioMessageId(messageId);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setActiveAudioMessageId(null);
      addConsoleLog("Zia TTS/STT", "success", "TTS Speech playback complete.");
    };

    utterance.onerror = (e) => {
      console.error("TTS play error", e);
      setIsSpeaking(false);
      setActiveAudioMessageId(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  // --- SMARTBROWZ EXPORT AUDIT TRAIL ---
  const handleExportChat = async () => {
    addConsoleLog("SmartBrowz", "info", "SmartBrowz PDF compiler initiated for active session.");
    try {
      const response = await fetch("/api/export-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages,
          session_id: sessionId,
          role: activeRole
        })
      });

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `KSP_PRAHARI_Audit_${sessionId}.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      addConsoleLog("SmartBrowz", "success", "PDF Audit summary exported successfully.", 280);
    } catch (err) {
      console.error("SmartBrowz export failed", err);
      addConsoleLog("SmartBrowz", "warning", "Report compilation failed.");
    }
  };

  // --- DATASET & FILE INGESTION SERVICE ---
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement> | File) => {
    let file: File | null = null;
    if (event instanceof File) {
      file = event;
    } else if (event.target.files && event.target.files.length > 0) {
      file = event.target.files[0];
    }
    
    if (!file) return;

    setUploading(true);
    setUploadError(null);
    addConsoleLog("API Gateway", "info", `Initiated upload process for file: ${file.name}`);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const textContent = e.target?.result as string;
      await uploadDataToServer(file.name, file.type || "text/plain", textContent);
    };

    reader.onerror = () => {
      setUploadError("Failed to read local file.");
      addConsoleLog("Data Store", "warning", "FileReader failed to load file.");
      setUploading(false);
    };

    reader.readAsText(file);
  };

  const uploadDataToServer = async (name: string, type: string, textContent: string) => {
    try {
      addConsoleLog("QuickML RAG", "info", "Sending file text stream to Zoho AppSail API Gateway...");
      const res = await fetch("/api/upload-dataset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: name,
          fileType: type,
          content: textContent,
          sessionId,
          role: activeRole
        })
      });

      if (!res.ok) {
        let errMsg = "Server returned error during ingestion.";
        try {
          const errorData = await res.json();
          errMsg = errorData.error || errorData.message || JSON.stringify(errorData);
        } catch (jsonErr) {
          try {
            const textData = await res.text();
            if (textData) {
              const cleanText = textData.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
              errMsg = cleanText.substring(0, 150);
            }
          } catch (textErr) {}
        }
        throw new Error(errMsg);
      }

      const data = await res.json();
      if (data.success && data.message) {
        setMessages(prev => [...prev, data.message]);
        
        fetchStats();
        fetchCasesList();

        if (data.newCase) {
          setSelectedCase(data.newCase);
          setRightPanelTab("evidence");
        }

        addConsoleLog("Data Store", "success", `Successfully ingested case! Latency: ${data.totalLatencyMs}ms`);
      }
    } catch (err: any) {
      setUploadError(err.message || "An unexpected error occurred.");
      addConsoleLog("QuickML RAG", "warning", `Ingestion error: ${err.message}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleTextParse = async () => {
    if (!pastedText.trim()) return;

    setUploading(true);
    setUploadError(null);
    addConsoleLog("API Gateway", "info", "Pasted unstructured case note received. Initializing Zia ingestion.");

    await uploadDataToServer("Pasted_Note.txt", "text/plain", pastedText);
    setPastedText("");
  };

  const loadSampleReport = async (sampleType: "theft" | "fraud") => {
    setUploading(true);
    setUploadError(null);
    
    let sampleContent = "";
    let sampleName = "";
    
    if (sampleType === "theft") {
      sampleName = "sample_shoplifting_theft.txt";
      sampleContent = `CASE REPORT: Shoplifting Theft at Commercial Street Store
Date of Incident: 2026-07-15
Location: 'Trendy Threads' Store, Commercial Street, Bangalore City (LAT: 12.9811, LNG: 77.6088)
Complainant: Store Manager Suresh Nair, age 45, Male.
Accused: Rajesh S, age 29, Male, caught by security guard (PersonID: A1).
Brief Facts: The accused entered the retail showroom around 14:00 hours. He picked up 3 premium designer silk sarees worth Rs 45,000, concealed them in a black lined paper bag, and tried to exit without paying. The store's magnetic RFID alarm triggered, and security intercepted him. Insp. S. Raghavendra arrived and arrested him. Recovered the sarees and registered case under IPC Section 379 (Punishment for Theft). Status is Under Investigation.`;
    } else {
      sampleName = "sample_cyber_fraud.json";
      sampleContent = JSON.stringify({
        caseMaster: {
          CrimeNo: "104430006202600008",
          CaseNo: "202600008",
          CrimeRegisteredDate: "2026-07-16",
          latitude: 12.9304,
          longitude: 77.6784,
          BriefFacts: "Complainant Harish Gupta, an IT engineer in Outer Ring Road, reported a WhatsApp work-from-home review fraud. He was approached by telegram handle @earn_easy and lured into investing money in fake crypto wallets, losing Rs 4,50,000. Cyber branch traced bank account to Bihar and arrested Accused Prince Kumar (Age 26, Male). Case registered under IT Act Section 66D and IPC Section 420. Status: Under Investigation.",
          BriefFacts_KN: "ಹರೀಶ್ ಗುಪ್ತಾ ಎಂಬ ಐಟಿ ಉದ್ಯೋಗಿ ವಾಟ್ಸಾಪ್ ಮೂಲಕ ವರ್ಕ್-ಫ್ರಮ್-ಹೋಮ್ ವಂಚನೆಗೆ ಒಳಗಾಗಿ 4.5 ಲಕ್ಷ ರೂಪಾಯಿ ಕಳೆದುಕೊಂಡಿದ್ದಾರೆ. ಆರೋಪಿ ಪ್ರಿನ್ಸ್ ಕುಮಾರ್‌ನನ್ನು ಬಿಹಾರದಲ್ಲಿ ಬಂಧಿಸಲಾಗಿದೆ. ಐಟಿ ಆಕ್ಟ್ 66D ಮತ್ತು ಐಪಿಸಿ 420 ಅಡಿಯಲ್ಲಿ ಪ್ರಕರಣ ದಾಖಲಿಸಲಾಗಿದೆ."
        },
        complainant: {
          ComplainantName: "Harish Gupta",
          AgeYear: 32,
          GenderID: 1
        },
        accused: [
          {
            AccusedName: "Prince Kumar",
            AgeYear: 26,
            GenderID: 1,
            PersonID: "A1"
          }
        ],
        victim: [
          {
            VictimName: "Harish Gupta",
            AgeYear: 32,
            GenderID: 1,
            VictimPolice: "0"
          }
        ],
        acts: [
          {
            ActCode: "IT_ACT",
            SectionCode: "66D"
          },
          {
            ActCode: "IPC",
            SectionCode: "420"
          }
        ]
      }, null, 2);
    }

    addConsoleLog("API Gateway", "info", `Loading sample template: ${sampleName}`);
    await uploadDataToServer(sampleName, sampleType === "fraud" ? "application/json" : "text/plain", sampleContent);
  };


  // --- HELPERS FOR VIEWING SEEDED TABLES ---
  const getExplorerTableHeaders = () => {
    switch (selectedExplorerTable) {
      case "CaseMaster":
        return ["CaseNo", "CrimeNo", "Date", "PS", "Status", "Facts"];
      case "ComplainantDetails":
        return ["ID", "Complainant Name", "Age", "Occupation", "Caste", "Religion"];
      case "Accused":
        return ["ID", "Accused Name", "Age", "Gender", "Accused Sorting ID"];
      case "Victim":
        return ["ID", "Victim Name", "Age", "Gender", "Police personnel"];
      case "ActSectionAssociation":
        return ["CaseNo", "Act", "Section", "Order"];
      default:
        return [];
    }
  };

  const getExplorerTableRows = () => {
    return dbCases.filter(c => {
      if (!dbSearch) return true;
      const term = dbSearch.toLowerCase();
      return (
        c.caseMaster.CaseNo.includes(term) ||
        c.caseMaster.CrimeNo.includes(term) ||
        c.stationName?.toLowerCase().includes(term) ||
        c.caseMaster.BriefFacts.toLowerCase().includes(term) ||
        c.accused?.some(a => a.AccusedName.toLowerCase().includes(term)) ||
        c.victim?.some(v => v.VictimName.toLowerCase().includes(term))
      );
    });
  };

  // Suggestions list
  const suggestedQueries = [
    { label: "Search Cubbon Park Murder", query: "Show me details for the murder case at Cubbon Park under Case 202600001", lang: "en" },
    { label: "ಲಿಸ್ಟ್ ಸೈಬರ್ ಕ್ರೈಮ್ಸ್", query: "ಬೆಂಗಳೂರಿನಲ್ಲಿ ದಾಖಲಾದ ಸೈಬರ್ ಅಪರಾಧಗಳನ್ನು ಹುಡುಕಿ", lang: "kn" },
    { label: "John D'Souza Drug Bust", query: "Are there any NDPS cases involving John D'Souza in Mangalore?", lang: "en" },
    { label: "Domestic Cruelty Belagavi", query: "Give me details on Case 202600005 in Belagavi", lang: "en" }
  ];

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 text-slate-800 font-sans" id="prahari_root">
      
      {/* --- LEFT SIDEBAR: PRAHARI BRAND & CLEARANCES + CONSOLE --- */}
      <aside className="w-80 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 shrink-0" id="catalyst_console_sidebar">
        
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800 flex items-center gap-3 bg-slate-950/40">
          <div className="w-8 h-8 bg-amber-500 rounded flex items-center justify-center font-bold text-slate-950 text-lg shadow-inner">P</div>
          <div>
            <h1 className="text-white font-bold leading-none tracking-tight text-sm uppercase">PRAHARI — ಪ್ರಹರಿ</h1>
            <span className="text-[10px] text-amber-500 uppercase font-semibold tracking-widest font-mono">KSP AI Assistant</span>
          </div>
        </div>

        {/* Security Clearance Switcher (Vertical Navigation / RBAC Mode) */}
        <div className="p-4 border-b border-slate-800">
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-2 font-mono">Security Clearance:</span>
          <nav className="space-y-1.5">
            {(["Investigator", "Analyst", "Supervisor"] as UserRole[]).map((role) => (
              <button
                key={role}
                onClick={() => {
                  setActiveRole(role);
                  addConsoleLog("Auth", "info", `Security authorization switched to level: ${role}`);
                }}
                className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                  activeRole === role 
                    ? "bg-slate-800 text-white border-l-2 border-amber-500 shadow-sm" 
                    : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-200"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-2 h-2 rounded-full ${
                    role === "Supervisor" ? "bg-red-500" : role === "Analyst" ? "bg-blue-500" : "bg-green-500"
                  }`}></div>
                  <span>{role} Inquiry</span>
                </div>
                <span className="text-[9px] font-mono opacity-60">
                  {role === "Supervisor" ? "L3" : role === "Analyst" ? "L2" : "L1"}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Live Catalyst Service Console Stream */}
        {showCatalystConsole ? (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="p-4 pb-2 border-b border-slate-800/50 bg-slate-950/20 flex items-center justify-between">
              <span className="font-mono font-bold text-[10px] uppercase text-slate-400 tracking-wider">Catalyst Realtime Logs</span>
              <span className="text-[9px] text-green-400 bg-green-950/40 border border-green-900/60 px-1.5 py-0.5 rounded font-mono">SYNCED</span>
            </div>

            {/* Performance Widgets */}
            <div className="p-3.5 grid grid-cols-2 gap-2 bg-slate-950/10 border-b border-slate-800/60">
              <div className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/80">
                <div className="text-[9px] text-slate-500 uppercase tracking-wide font-mono">Data Store Latency</div>
                <div className="text-xs font-mono font-bold text-slate-300 mt-1">45ms</div>
                <div className="text-[9px] text-green-400 font-mono">SQL Path Fast</div>
              </div>
              <div className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/80">
                <div className="text-[9px] text-slate-500 uppercase tracking-wide font-mono">QuickML LLM</div>
                <div className="text-xs font-mono font-bold text-slate-300 mt-1">Qwen 2.5-14B</div>
                <div className="text-[9px] text-amber-500 font-mono font-semibold">RAG Active</div>
              </div>
            </div>

            {/* Logs stream list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-[11px] bg-slate-950/10" id="logs_container">
              {logs.length === 0 ? (
                <div className="text-slate-600 text-center py-6 italic">No activity registered. Type a prompt to test Zia STT / Data Store triggers.</div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="border-b border-slate-800/40 pb-2.5">
                    <div className="flex items-center justify-between text-slate-500 text-[9px] mb-1">
                      <span>[{log.timestamp}]</span>
                      <span className={`px-1.5 py-0.5 rounded-sm font-semibold uppercase text-[8px] ${
                        log.service === "Data Store" ? "bg-blue-950/60 text-blue-300 border border-blue-900/40" :
                        log.service === "QuickML RAG" ? "bg-purple-950/60 text-purple-300 border border-purple-900/40" :
                        log.service === "Zia Translation" ? "bg-yellow-950/60 text-yellow-300 border border-yellow-900/40" :
                        log.service === "Zia TTS/STT" ? "bg-pink-950/60 text-pink-300 border border-pink-900/40" : "bg-slate-950/60 text-slate-300"
                      }`}>
                        {log.service}
                      </span>
                    </div>
                    <p className="text-slate-300 leading-normal">{log.message}</p>
                    {log.latencyMs && (
                      <span className="text-[8px] text-green-500 font-semibold font-mono">Latency: {log.latencyMs}ms</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-500">
            <Terminal size={24} className="opacity-25 mb-2" />
            <p className="text-xs font-semibold">Catalyst Logs Hidden</p>
            <p className="text-[10px] text-slate-600 mt-1">Enable via the header logstream button to monitor raw queries.</p>
          </div>
        )}

        {/* Sidebar Footer (Profile + Diagnostics) */}
        <div className="p-4 mt-auto border-t border-slate-800 bg-slate-950/40 space-y-3">
          <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-800 flex flex-col gap-1">
            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider font-mono">Authorized Investigator</p>
            <p className="text-xs text-white font-bold">Insp. S. Raghavendra</p>
            <p className="text-[9px] text-slate-400 font-mono">Central Division, Bengaluru</p>
          </div>

          <div className="space-y-1 font-mono text-[9px] text-slate-500">
            <div className="flex items-center justify-between">
              <span>Catalyst Endpoint:</span>
              <span className="text-green-500 font-bold">Secure/Connected</span>
            </div>
            <div className="flex items-center justify-between">
              <span>QuickML Sync:</span>
              <span className="text-amber-500 font-bold">Synced OK</span>
            </div>
            <div className="text-[8px] text-slate-600 text-center pt-1.5 border-t border-slate-800/50">
              © KSP Datathon 2026. Confidential.
            </div>
          </div>
        </div>

      </aside>

      {/* --- MAIN CONTENT CONTAINER --- */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50">

        {/* --- HEADER BAR (Clean, white theme) --- */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0" id="ksp_header">
          
          <div className="flex items-center gap-4">
            {/* Language Pill Toggle */}
            <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200 text-xs">
              <button 
                onClick={() => { setLanguage("en"); addConsoleLog("Zia Translation", "info", "Keyboard input set to English."); }}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${language === "en" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
              >
                English
              </button>
              <button 
                onClick={() => { setLanguage("kn"); addConsoleLog("Zia Translation", "info", "Keyboard input set to Kannada. Active transliteration mode."); }}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${language === "kn" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
              >
                ಕನ್ನಡ
              </button>
            </div>
            <div className="h-4 w-px bg-slate-200 hidden sm:block"></div>
            <span className="text-xs font-mono font-medium text-slate-500 hidden sm:inline">Session: #{sessionId}</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Export PDF Button */}
            <button 
              onClick={handleExportChat}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors flex items-center gap-1.5"
            >
              <Download size={13} />
              <span>Export PDF</span>
            </button>

            {/* Console toggle button */}
            <button 
              onClick={() => setShowCatalystConsole(!showCatalystConsole)}
              className={`p-2 rounded-lg border text-slate-500 hover:bg-slate-100 transition-colors ${showCatalystConsole ? "bg-slate-50 border-slate-300" : "border-slate-200"}`}
              title="Toggle Catalyst Developer Console"
            >
              <Terminal size={16} />
            </button>

            <div className="h-8 w-px bg-slate-200"></div>

            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600 text-xs">
              IO
            </div>
          </div>

        </header>

        {/* --- SECONDARY STATS BAR (Lightweight, elegant) --- */}
        <section className="bg-white border-b border-slate-200 px-6 py-2.5 flex flex-wrap items-center justify-between text-xs text-slate-600 shrink-0">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 py-1">
            <div className="flex items-center gap-1.5">
              <Database size={13} className="text-slate-400" />
              <span className="font-mono text-slate-500">Data Store:</span>
              <span className="font-bold font-mono text-slate-800">{stats.casesCount} FIRs</span>
            </div>
            <div className="flex items-center gap-1.5">
              <User size={13} className="text-slate-400" />
              <span className="font-mono text-slate-500">Accused:</span>
              <span className="font-bold font-mono text-slate-800">{stats.accusedCount} Indexed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Activity size={13} className="text-slate-400" />
              <span className="font-mono text-slate-500">Chargesheets:</span>
              <span className="font-bold font-mono text-slate-800">{stats.chargesheetsCount} Submitted</span>
            </div>
            <div className="h-4 w-px bg-slate-200 hidden md:block"></div>
            <div className="flex items-center gap-1.5">
              <Shield size={13} className="text-green-600" />
              <span className="font-mono text-slate-500">Policy:</span>
              <span className="font-mono text-green-600 font-semibold">{activeRole === "Analyst" ? "Demographics Redacted" : "Unmasked Access"}</span>
            </div>
          </div>
          <div className="hidden lg:flex items-center gap-2 text-[10px] font-mono bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-slate-500">KSP AppSail: Active</span>
          </div>
        </section>

        {/* --- SPLIT INTERFACE SPLIT PANEL --- */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* --- LEFT: CHAT INTERFACE AND LOGS CONTAINER --- */}
          <section className="flex-1 flex flex-col bg-white border-r border-slate-200 min-w-0">
            
            {/* Messages scroll content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6" id="chat_scroll_area">
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"} w-full`}
                >
                  {msg.sender === "user" ? (
                    /* User message styling: geometric bubble, high contrast */
                    <div className="max-w-[80%] bg-slate-900 text-white p-4 rounded-2xl rounded-tr-none shadow-sm space-y-1">
                      <p className="text-sm font-sans whitespace-pre-line leading-relaxed">{msg.text}</p>
                      <span className="text-[9px] text-slate-400 font-mono block mt-1.5 text-right">Investigator • {msg.timestamp}</span>
                    </div>
                  ) : (
                    /* Bot response styling: geometric bubble with left margin and custom badge */
                    <div className="flex justify-start items-start gap-3 max-w-[85%]">
                      <div className="w-8 h-8 rounded-full bg-slate-900 text-amber-500 flex items-center justify-center font-bold text-xs shrink-0 shadow-sm border border-slate-800 font-mono">
                        P
                      </div>
                      <div className="space-y-1.5">
                        <div className="bg-slate-100 p-4 rounded-2xl rounded-tl-none border border-slate-200/50 shadow-sm">
                          
                          {/* Inner audio/language toolbar inside bubble */}
                          <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-200/60">
                            <span className="text-[10px] uppercase font-mono font-bold text-slate-400 tracking-wider">
                              {language === "kn" ? "ಕನ್ನಡ" : "English"} • Confidence: {msg.confidence !== undefined ? `${(msg.confidence * 100).toFixed(0)}%` : "100%"}
                            </span>
                            <button 
                              onClick={() => toggleSpeechOutput(msg.id, language === "kn" && msg.textKn ? msg.textKn : msg.text)}
                              className={`p-1 rounded hover:bg-slate-200 transition-colors ${activeAudioMessageId === msg.id ? "text-red-500 animate-pulse" : "text-slate-500"}`}
                              title="Speak answer via Zia Voice Engine"
                            >
                              {activeAudioMessageId === msg.id ? <VolumeX size={14} /> : <Volume2 size={14} />}
                            </button>
                          </div>
                          
                          {/* Text content */}
                          <div className="text-sm text-slate-800 leading-relaxed prose max-w-none font-sans whitespace-pre-line">
                            {language === "kn" && msg.textKn ? msg.textKn : msg.text}
                          </div>

                          {/* Model inference tag */}
                          {msg.isModelInference && (
                            <div className="mt-3 flex items-start gap-2 bg-amber-50 border border-amber-200 p-2 rounded-lg text-amber-800 text-xs">
                              <AlertCircle size={14} className="mt-0.5 text-amber-600 shrink-0" />
                              <p>
                                <strong>Inference Note:</strong> Summary created through semantic reasoning. No direct single-record file referenced.
                              </p>
                            </div>
                          )}

                          {/* Evidence link buttons inside bubble */}
                          {msg.evidence && msg.evidence.length > 0 && (
                            <div className="mt-3 pt-2.5 border-t border-slate-200 flex flex-wrap gap-1.5 items-center">
                              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                <FileText size={10} />
                                <span>Citations:</span>
                              </span>
                              {msg.evidence.map((ev, i) => (
                                <button
                                  key={i}
                                  onClick={() => {
                                    setSelectedCase(ev);
                                    setRightPanelTab("evidence");
                                  }}
                                  className="text-[10px] bg-white hover:bg-amber-500 hover:text-slate-900 transition-colors px-2 py-0.5 rounded font-mono font-bold text-slate-700 border border-slate-200"
                                >
                                  Case {ev.caseMaster.CaseNo}
                                </button>
                              ))}
                            </div>
                          )}

                        </div>
                        <p className="text-[10px] text-slate-400 italic font-medium tracking-wide">Citations generated from Catalyst Data Store [Table: CaseMaster]</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex items-center space-x-2 text-slate-400 text-xs italic bg-slate-50 p-3 rounded-xl border border-dashed border-slate-200 max-w-sm">
                  <RefreshCw size={14} className="animate-spin text-slate-500" />
                  <span>Catalyst QuickML executing semantic reasoning...</span>
                </div>
              )}
              
              <div ref={chatBottomRef} />
            </div>

            {/* Suggested Audits Area */}
            <div className="px-6 py-3 bg-white border-t border-slate-100 overflow-x-auto flex items-center gap-2 text-xs shrink-0">
              <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] whitespace-nowrap">Suggested Audits:</span>
              {suggestedQueries.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setLanguage(item.lang as any);
                    handleSendMessage(item.query);
                  }}
                  className="bg-slate-50 hover:bg-slate-100 hover:border-slate-300 text-slate-600 transition-colors px-3 py-1.5 rounded-lg border border-slate-200 text-xs whitespace-nowrap"
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Input Form Bar */}
            <div className="p-6 border-t border-slate-200 bg-white shrink-0">
              <div className="relative flex items-center">
                
                {/* Voice recording button */}
                <button
                  onClick={startVoiceRecording}
                  className={`absolute left-3.5 p-2 rounded-lg flex items-center justify-center transition-all ${
                    isRecording 
                      ? "bg-red-600 text-white animate-pulse" 
                      : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                  }`}
                  title="Click to dictate in selected language via Zia Speech Engine"
                >
                  {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
                </button>

                {/* Quick File Upload Button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute left-12 p-2 rounded-lg flex items-center justify-center transition-all text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                  title="Quick upload case report (.txt, .json, .csv)"
                >
                  <Paperclip size={18} className={uploading ? "animate-pulse" : ""} />
                </button>

                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".json,.txt,.csv"
                  className="hidden"
                />
                
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder={language === "kn" ? "ಕನ್ನಡದಲ್ಲಿ ಅಪರಾಧ ಸಂಖ್ಯೆ ಅಥವಾ ವಿವರಗಳನ್ನು ನಮೂದಿಸಿ..." : "Search by Crime No, Accused Name, Section Code, or query..."}
                  className="w-full pl-[84px] pr-24 py-4 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-slate-400 outline-none text-slate-800 placeholder-slate-400 transition-shadow"
                />

                <div className="absolute right-2 flex items-center gap-1.5">
                  {/* Trigger Query */}
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!chatInput.trim() && !loading}
                    className="px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 transition-colors text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm"
                  >
                    <Sparkles size={13} className="text-amber-400" />
                    <span>Query</span>
                  </button>
                </div>

              </div>
            </div>

          </section>

          {/* --- RIGHT: EVIDENCE & METADATA PANEL AND DB EXPLORER --- */}
          <aside className="w-[440px] lg:w-[480px] shrink-0 bg-slate-50 flex flex-col border-l border-slate-200" id="database_explorer_container">
            
            {/* Right Tabs Navigation (Clean minimalist card design) */}
            <div className="flex bg-slate-100 p-1 border-b border-slate-200 font-sans text-xs">
              <button
                onClick={() => setRightPanelTab("evidence")}
                className={`flex-1 py-2 text-center font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${rightPanelTab === "evidence" ? "bg-white text-slate-950 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-800"}`}
              >
                <FileText size={13} />
                <span>Citing Evidence</span>
              </button>
              <button
                onClick={() => {
                  setRightPanelTab("explorer");
                  fetchCasesList();
                }}
                className={`flex-1 py-2 text-center font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${rightPanelTab === "explorer" ? "bg-white text-slate-950 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-800"}`}
              >
                <Database size={13} />
                <span>Live DB Explorer</span>
              </button>
              <button
                onClick={() => setRightPanelTab("upload")}
                className={`flex-1 py-2 text-center font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${rightPanelTab === "upload" ? "bg-white text-slate-950 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-800"}`}
              >
                <Upload size={13} />
                <span>Import Dataset</span>
              </button>
            </div>

            {/* --- TAB 1: CITING EVIDENCE REVIEWS --- */}
            {rightPanelTab === "evidence" && (
              <div className="flex-1 overflow-y-auto p-4 space-y-4" id="citing_evidence_view">
                {!selectedCase ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 py-12 px-6 text-center">
                    <Compass size={40} className="text-slate-300 mb-3 stroke-1" />
                    <p className="text-xs font-semibold">No active case citation selected.</p>
                    <p className="text-[11px] text-slate-400 mt-1.5 max-w-xs">Enter a search or select a citation link in the chat to display structured relational records folder.</p>
                  </div>
                ) : (
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                    
                    {/* Header Details */}
                    <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                      <div>
                        <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md border border-slate-200">
                          CASE MASTER {selectedCase.caseMaster.CaseNo}
                        </span>
                        <h3 className="text-sm font-bold text-slate-900 mt-2">Crime No: {selectedCase.caseMaster.CrimeNo}</h3>
                        <p className="text-[11px] text-slate-400 font-medium">Registered: {selectedCase.caseMaster.CrimeRegisteredDate}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-2.5 py-1 rounded bg-slate-900 text-white">
                          {selectedCase.status}
                        </span>
                        <p className="text-[10px] text-slate-400 font-mono mt-2">Gravity: {selectedCase.caseMaster.GravityOffenceID === 1 ? "HEINOUS" : "NON-HEINOUS"}</p>
                      </div>
                    </div>

                    {/* Metadata grids */}
                    <div className="grid grid-cols-2 gap-2.5 text-xs" id="hydrated_relational_meta">
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Police Station</span>
                        <span className="font-bold text-slate-800 block leading-tight">{selectedCase.stationName}</span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Investigating Officer</span>
                        <span className="font-bold text-slate-800 block leading-tight">{selectedCase.officerName}</span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Classification Major</span>
                        <span className="font-bold text-slate-800 block leading-tight">{selectedCase.majorHead}</span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Classification Minor</span>
                        <span className="font-bold text-slate-800 block leading-tight truncate" title={selectedCase.minorHead}>{selectedCase.minorHead}</span>
                      </div>
                    </div>

                    {/* Accused Section */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1.5 flex items-center justify-between">
                        <span>Accused Profiles</span>
                        <span className="text-[10px] font-mono text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-md">{selectedCase.accused?.length || 0}</span>
                      </h4>
                      {selectedCase.accused && selectedCase.accused.length > 0 ? (
                        <div className="space-y-1.5">
                          {selectedCase.accused.map((acc, i) => (
                            <div key={i} className="flex items-center justify-between text-xs bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                              <span className="font-bold text-slate-800">{acc.AccusedName}</span>
                              <span className="text-slate-500 font-mono text-[10px]">Age: {acc.AgeYear} • Gender: {acc.GenderID === 1 ? "M" : "F"} ({acc.PersonID})</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-400 italic">No accused registered yet in this record folder.</div>
                      )}
                    </div>

                    {/* Complainant Section */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1.5">Complainant Details</h4>
                      {selectedCase.complainant ? (
                        <div className="text-xs bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-800">{selectedCase.complainant.ComplainantName}</span>
                            <span className="text-slate-500 font-mono text-[10px]">Age Year: {selectedCase.complainant.AgeYear}</span>
                          </div>
                          {activeRole === "Investigator" && (
                            <div className="pt-2 border-t border-slate-200 flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-mono text-slate-500">
                              <span>Caste ID: {selectedCase.complainant.CasteID === 11 ? "Lingayat" : selectedCase.complainant.CasteID === 12 ? "Vokkaliga" : "OBC/SC/ST"}</span>
                              <span>Religion ID: {selectedCase.complainant.ReligionID === 1 ? "Hindu" : "Other"}</span>
                            </div>
                          )}
                          {activeRole === "Analyst" && (
                            <div className="text-[10px] font-mono text-red-500 flex items-center gap-1 bg-red-50 p-1.5 rounded border border-red-100">
                              <Lock size={11} className="shrink-0" />
                              <span>Complainant demographics masked due to security clearance policy.</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-400 italic">No complainant logged.</div>
                      )}
                    </div>

                    {/* Acts & Sections */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1.5">Invoked Acts & Sections</h4>
                      {selectedCase.acts && selectedCase.acts.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {selectedCase.acts.map((actSec, idx) => (
                            <div key={idx} className="bg-slate-100 text-slate-800 border border-slate-200 rounded-lg p-2 text-[10px] font-mono flex items-center gap-1.5">
                              <span className="font-bold bg-slate-800 text-white px-1.5 py-0.5 rounded text-[9px]">{actSec.act.ShortName}</span>
                              <span className="font-semibold text-slate-900">Sec {actSec.section.SectionCode}</span>
                              <span className="text-slate-400 truncate max-w-[200px]" title={actSec.section.SectionDescription}>({actSec.section.SectionDescription})</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-400 italic">No specific legal act associations mapped.</div>
                      )}
                    </div>

                    {/* Brief Case Facts */}
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Brief Facts:</h4>
                      <div className="space-y-2">
                        <p className="text-xs bg-slate-50 border border-slate-200 p-3 rounded-lg text-slate-700 leading-relaxed font-sans">
                          {selectedCase.caseMaster.BriefFacts}
                        </p>
                        {selectedCase.caseMaster.BriefFacts_KN && (
                          <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg text-slate-700 leading-relaxed font-sans text-xs">
                            <span className="text-[9px] font-bold text-amber-700 block mb-1 uppercase font-mono tracking-wider">Kannada Version:</span>
                            <p>{selectedCase.caseMaster.BriefFacts_KN}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* GIS Hotspot Info */}
                    <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 space-y-1.5 text-xs">
                      <span className="font-bold text-slate-700 flex items-center gap-1">
                        <MapPin size={13} className="text-red-500" />
                        <span>GIS Location Hotspot</span>
                      </span>
                      <div className="flex justify-between font-mono text-[10px] text-slate-500 bg-white border border-slate-200 p-2 rounded-md">
                        <span>LATITUDE: {selectedCase.caseMaster.latitude}</span>
                        <span>LONGITUDE: {selectedCase.caseMaster.longitude}</span>
                      </div>
                    </div>

                  </div>
                )}
              </div>
            )}

            {/* --- TAB 2: LIVE DATABASE EXPLORER TABLES --- */}
            {rightPanelTab === "explorer" && (
              <div className="flex-1 overflow-hidden flex flex-col p-4 space-y-4" id="live_db_explorer_view">
                
                {/* Table selector drop down */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wide block">Select Database Relation Table:</label>
                  <select
                    value={selectedExplorerTable}
                    onChange={(e) => setSelectedExplorerTable(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-slate-300 outline-none"
                  >
                    <option value="CaseMaster">1. CaseMaster (Core FIR Master)</option>
                    <option value="ComplainantDetails">2. ComplainantDetails (Complainants)</option>
                    <option value="Accused">3. Accused (Suspects list)</option>
                    <option value="Victim">4. Victim (Affected entities)</option>
                    <option value="ActSectionAssociation">5. ActSectionAssociation (Law mapping)</option>
                  </select>
                </div>

                {/* Table Search filter input */}
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={dbSearch}
                    onChange={(e) => setDbSearch(e.target.value)}
                    placeholder="Filter explorer records..."
                    className="w-full text-xs pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-300 outline-none text-slate-800"
                  />
                </div>

                {/* Real interactive table list */}
                <div className="flex-1 overflow-auto border border-slate-200 rounded-lg bg-white shadow-sm">
                  <table className="w-full text-left text-[11px] font-sans border-collapse">
                    <thead className="bg-slate-50 font-mono font-bold text-slate-500 uppercase border-b border-slate-200 sticky top-0 z-10">
                      <tr>
                        {getExplorerTableHeaders().map((h, i) => (
                          <th key={i} className="px-3 py-2 text-[10px] whitespace-nowrap">{h}</th>
                        ))}
                        <th className="px-3 py-2 text-[10px]">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {getExplorerTableRows().length === 0 ? (
                        <tr>
                          <td colSpan={10} className="px-3 py-6 text-center text-slate-400 italic">No matches found. Check spelling or try another table.</td>
                        </tr>
                      ) : (
                        getExplorerTableRows().map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 transition-all">
                            
                            {/* CaseMaster content columns */}
                            {selectedExplorerTable === "CaseMaster" && (
                              <>
                                <td className="px-3 py-2 font-mono font-bold text-slate-800 whitespace-nowrap">{row.caseMaster.CaseNo}</td>
                                <td className="px-3 py-2 font-mono text-slate-500 whitespace-nowrap text-[10px]">{row.caseMaster.CrimeNo.substring(0, 10)}...</td>
                                <td className="px-3 py-2 whitespace-nowrap text-[10px]">{row.caseMaster.CrimeRegisteredDate}</td>
                                <td className="px-3 py-2 text-slate-700 whitespace-nowrap text-[10px]">{row.stationName}</td>
                                <td className="px-3 py-2 text-[10px]">
                                  <span className="bg-slate-900 text-white px-1.5 py-0.5 rounded font-mono font-semibold text-[9px]">{row.status}</span>
                                </td>
                                <td className="px-3 py-2 text-slate-600 max-w-xs truncate text-[10px]" title={row.caseMaster.BriefFacts}>{row.caseMaster.BriefFacts}</td>
                              </>
                            )}

                            {/* ComplainantDetails content columns */}
                            {selectedExplorerTable === "ComplainantDetails" && (
                              <>
                                <td className="px-3 py-2 font-mono">{row.complainant?.ComplainantID || "N/A"}</td>
                                <td className="px-3 py-2 font-bold text-slate-700">{row.complainant?.ComplainantName || "N/A"}</td>
                                <td className="px-3 py-2">{row.complainant?.AgeYear || "N/A"}</td>
                                <td className="px-3 py-2 text-slate-500 text-[10px]">IT Professional / Retail</td>
                                <td className="px-3 py-2 text-[10px]">
                                  {activeRole === "Investigator" ? "Vokkaliga / General" : "Masked"}
                                </td>
                                <td className="px-3 py-2 text-[10px]">
                                  {activeRole === "Investigator" ? "Hindu" : "Masked"}
                                </td>
                              </>
                            )}

                            {/* Accused content columns */}
                            {selectedExplorerTable === "Accused" && (
                              <>
                                <td className="px-3 py-2 font-mono">{row.accused?.[0]?.AccusedMasterID || "N/A"}</td>
                                <td className="px-3 py-2 font-bold text-slate-700">{row.accused?.[0]?.AccusedName || "N/A"}</td>
                                <td className="px-3 py-2">{row.accused?.[0]?.AgeYear || "N/A"}</td>
                                <td className="px-3 py-2">{row.accused?.[0]?.GenderID === 1 ? "Male" : "Female"}</td>
                                <td className="px-3 py-2 font-mono">{row.accused?.[0]?.PersonID || "N/A"}</td>
                              </>
                            )}

                            {/* Victim content columns */}
                            {selectedExplorerTable === "Victim" && (
                              <>
                                <td className="px-3 py-2 font-mono">{row.victim?.[0]?.VictimMasterID || "N/A"}</td>
                                <td className="px-3 py-2 font-bold text-slate-700">{row.victim?.[0]?.VictimName || "N/A"}</td>
                                <td className="px-3 py-2">{row.victim?.[0]?.AgeYear || "N/A"}</td>
                                <td className="px-3 py-2">{row.victim?.[0]?.GenderID === 1 ? "Male" : "Female"}</td>
                                <td className="px-3 py-2 font-mono">{row.victim?.[0]?.VictimPolice === "1" ? "YES (KSP)" : "NO (Citizen)"}</td>
                              </>
                            )}

                            {/* ActSectionAssociation content columns */}
                            {selectedExplorerTable === "ActSectionAssociation" && (
                              <>
                                <td className="px-3 py-2 font-mono font-bold text-slate-800">{row.caseMaster.CaseNo}</td>
                                <td className="px-3 py-2 font-bold text-blue-600 font-mono">{row.acts?.[0]?.act.ShortName || "N/A"}</td>
                                <td className="px-3 py-2 font-mono font-bold text-red-600">Sec {row.acts?.[0]?.section.SectionCode || "N/A"}</td>
                                <td className="px-3 py-2 font-mono text-[10px] text-slate-400">Order: {row.acts?.[0]?.section.Active ? "Active" : "Inactive"}</td>
                              </>
                            )}

                            {/* Quick Select View Action */}
                            <td className="px-3 py-2 whitespace-nowrap">
                              <button
                                onClick={() => {
                                  setSelectedCase(row);
                                  setRightPanelTab("evidence");
                                }}
                                className="text-[10px] bg-slate-100 hover:bg-slate-900 hover:text-white transition-colors text-slate-700 font-bold px-2.5 py-1 rounded-md border border-slate-200 shadow-sm flex items-center space-x-1"
                              >
                                <Eye size={10} />
                                <span>View</span>
                              </button>
                            </td>

                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Relational diagram helpers info */}
                <div className="bg-slate-100 p-3 rounded-lg border border-slate-200 text-[11px] leading-normal text-slate-600 space-y-1 font-sans">
                  <span className="font-bold text-slate-800 flex items-center gap-1">
                    <Info size={12} className="text-slate-400" />
                    <span>KSP Relational Cardinality Note:</span>
                  </span>
                  <p><strong>CaseMaster (PK: CaseMasterID)</strong> holds 1-to-Many relationships with Accused, Victim, and ComplainantDetails. Access masking is automatically adjusted in live session based on security clearance levels.</p>
                </div>

              </div>
            )}

            {/* --- TAB 3: IMPORT DATASET & AI EXTRACTOR --- */}
            {rightPanelTab === "upload" && (
              <div className="flex-1 overflow-y-auto p-5 space-y-5" id="dataset_upload_view">
                
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <UploadCloud size={16} className="text-slate-500" />
                      <span>Ingest New Case / Dataset</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">Upload structured JSON case schemas or paste unstructured reports. Zia AI will parse entities and initiate a conversational audit.</p>
                  </div>

                  {/* Drag and Drop Zone */}
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                        handleFileUpload(e.dataTransfer.files[0]);
                      }
                    }}
                    className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-slate-50 hover:border-slate-400 ${
                      uploading ? "bg-slate-50 border-slate-300" : "bg-white border-slate-200"
                    }`}
                  >
                    <UploadCloud size={32} className={`mb-2 stroke-1 ${uploading ? "text-slate-400 animate-bounce" : "text-slate-300"}`} />
                    <span className="text-xs font-semibold text-slate-700">Drag & drop files here</span>
                    <span className="text-[10px] text-slate-400 mt-1 font-mono">Supports .json, .txt, .csv</span>
                    {uploading && (
                      <span className="text-[10px] text-slate-500 font-bold bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full mt-3 animate-pulse">
                        Zia processing...
                      </span>
                    )}
                  </div>

                  {/* Manual Paste Text Zone */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wide block">Or Paste Unstructured Case Details:</label>
                    <textarea
                      value={pastedText}
                      onChange={(e) => setPastedText(e.target.value)}
                      placeholder="Example: Inspector Raghavendra arrested Mahesh Bhat on July 18 under Section 302 for murder..."
                      rows={4}
                      className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-slate-300 outline-none text-slate-800 placeholder-slate-400 transition-all font-sans"
                    />
                    <button
                      onClick={handleTextParse}
                      disabled={uploading || !pastedText.trim()}
                      className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white disabled:opacity-50 transition-colors text-xs font-bold rounded-lg shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <Sparkles size={13} className="text-amber-400" />
                      <span>Parse & Ingest with AI</span>
                    </button>
                  </div>

                  {/* Error display */}
                  {uploadError && (
                    <div className="flex items-start gap-2 bg-red-50 border border-red-200 p-3 rounded-lg text-red-800 text-xs animate-shake">
                      <AlertTriangle size={14} className="mt-0.5 text-red-600 shrink-0" />
                      <p className="leading-normal">
                        <strong>Ingestion Failed:</strong> {uploadError}
                      </p>
                    </div>
                  )}
                </div>

                {/* Preseeded Interactive Sample Buttons */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3.5">
                  <div>
                    <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Test Sample Ingestion</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">Click a sample to test the ingestion flow instantly.</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => loadSampleReport("theft")}
                      disabled={uploading}
                      className="p-3 bg-slate-50 hover:bg-amber-500/10 hover:border-amber-500 border border-slate-200 rounded-lg text-left transition-all hover:shadow-sm"
                    >
                      <span className="font-mono text-[9px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider block w-max mb-1.5">Unstructured Text</span>
                      <span className="text-[11px] font-bold text-slate-800 block">Theft Case Report</span>
                      <span className="text-[10px] text-slate-400 mt-1 block line-clamp-2">Rajesh S caught shoplifting silk sarees under Section 379...</span>
                    </button>

                    <button
                      onClick={() => loadSampleReport("fraud")}
                      disabled={uploading}
                      className="p-3 bg-slate-50 hover:bg-amber-500/10 hover:border-amber-500 border border-slate-200 rounded-lg text-left transition-all hover:shadow-sm"
                    >
                      <span className="font-mono text-[9px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider block w-max mb-1.5">Structured JSON</span>
                      <span className="text-[11px] font-bold text-slate-800 block">WhatsApp Job Fraud</span>
                      <span className="text-[10px] text-slate-400 mt-1 block line-clamp-2">Pre-mapped JSON for Section 66D outer ring road phishing...</span>
                    </button>
                  </div>
                </div>

              </div>
            )}

          </aside>

        </div>

      </main>

    </div>
  );
}
