import { useEffect, useState, useRef } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

import "./App.css";
import TalkingRabbitAvatar from "./components/TalkingRabbitAvatar";

/* ============================================================
   ICONS — small, dependency-free line icons (24x24, stroke)
   ============================================================ */

const ICON_PATHS = {
  grid: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </>
  ),
  message: (
    <path d="M4 5.5h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9.5L5 20.5V16.5H4a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1z" />
  ),
  trending: (
    <>
      <polyline points="3.5 16.5 9.5 10.5 13.5 14.5 20.5 6.5" />
      <polyline points="14.5 6.5 20.5 6.5 20.5 12.5" />
    </>
  ),
  pie: (
    <>
      <path d="M12 3.5v8.5h8.5A8.5 8.5 0 1 1 12 3.5z" />
      <path d="M15.5 4.2A8.5 8.5 0 0 1 19.8 8.5H12z" />
    </>
  ),
  package: (
    <>
      <path d="M3.5 7.5 12 3l8.5 4.5V16.5L12 21l-8.5-4.5z" />
      <path d="M3.5 7.5 12 12l8.5-4.5" />
      <path d="M12 12v9" />
    </>
  ),
  sparkles: (
    <>
      <path d="M11 3.5 12.4 8l4.6 1.4-4.6 1.4L11 15l-1.4-4.2L5 9.4l4.6-1.4z" />
      <path d="M17.5 14.5 18.3 17l2.5.8-2.5.8-.8 2.5-.8-2.5-2.5-.8 2.5-.8z" />
    </>
  ),
  users: (
    <>
      <circle cx="8.5" cy="8" r="3.2" />
      <path d="M2.7 19c.7-3 3-4.8 5.8-4.8s5.1 1.8 5.8 4.8" />
      <circle cx="16.5" cy="8.8" r="2.6" />
      <path d="M15 14.4c2.5.2 4.4 1.9 5 4.6" />
    </>
  ),
  alert: (
    <>
      <path d="M12 3.8 21 19H3z" />
      <line x1="12" y1="9.5" x2="12" y2="13.5" />
      <line x1="12" y1="16" x2="12" y2="16.2" />
    </>
  ),
  menu: (
    <>
      <line x1="3.5" y1="6.5" x2="20.5" y2="6.5" />
      <line x1="3.5" y1="12" x2="20.5" y2="12" />
      <line x1="3.5" y1="17.5" x2="20.5" y2="17.5" />
    </>
  ),
  close: (
    <>
      <line x1="5" y1="5" x2="19" y2="19" />
      <line x1="19" y1="5" x2="5" y2="19" />
    </>
  ),
  mic: (
    <>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5.5 11a6.5 6.5 0 0 0 13 0" />
      <line x1="12" y1="17.5" x2="12" y2="21" />
      <line x1="8.5" y1="21" x2="15.5" y2="21" />
    </>
  ),
  micOff: (
    <>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5.5 11a6.5 6.5 0 0 0 13 0" />
      <line x1="12" y1="17.5" x2="12" y2="21" />
      <line x1="8.5" y1="21" x2="15.5" y2="21" />
      <line x1="3.5" y1="3.5" x2="20.5" y2="20.5" stroke="currentColor" />
    </>
  ),
  send: <path d="M4 12 20.5 4 15 20.5l-3.6-7L4 12z" />,
  volume: (
    <>
      <path d="M4.5 9.5h3.2L12 5.8v12.4l-4.3-3.7H4.5z" />
      <path d="M16 8.8a5 5 0 0 1 0 6.4" />
      <path d="M18.6 6.2a8.6 8.6 0 0 1 0 11.6" />
    </>
  ),
  volumeOff: (
    <>
      <path d="M4.5 9.5h3.2L12 5.8v12.4l-4.3-3.7H4.5z" />
      <line x1="15.5" y1="9.5" x2="20.5" y2="14.5" />
      <line x1="20.5" y1="9.5" x2="15.5" y2="14.5" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 11A8 8 0 0 0 6.3 6.3L4 8.5" />
      <polyline points="4 4 4 8.5 8.5 8.5" />
      <path d="M4 13a8 8 0 0 0 13.7 4.7L20 15.5" />
      <polyline points="20 20 20 15.5 15.5 15.5" />
    </>
  ),
  loader: (
    <>
      <line x1="12" y1="2.5" x2="12" y2="6" />
      <line x1="12" y1="18" x2="12" y2="21.5" />
      <line x1="4.9" y1="4.9" x2="7.4" y2="7.4" />
      <line x1="16.6" y1="16.6" x2="19.1" y2="19.1" />
      <line x1="2.5" y1="12" x2="6" y2="12" />
      <line x1="18" y1="12" x2="21.5" y2="12" />
      <line x1="4.9" y1="19.1" x2="7.4" y2="16.6" />
      <line x1="16.6" y1="7.4" x2="19.1" y2="4.9" />
    </>
  ),
  bot: (
    <>
      <rect x="4.5" y="8.5" width="15" height="10.5" rx="2.5" />
      <line x1="12" y1="3" x2="12" y2="8.5" />
      <circle cx="12" cy="3" r="1.3" />
      <circle cx="8.7" cy="13.5" r="1.2" />
      <circle cx="15.3" cy="13.5" r="1.2" />
      <path d="M8.7 16.5h6.6" />
    </>
  ),
  book: (
    <>
      <path d="M4 5.2c2.4-1.1 5.4-1.1 8 0v14c-2.6-1.1-5.6-1.1-8 0z" />
      <path d="M20 5.2c-2.4-1.1-5.4-1.1-8 0v14c2.6-1.1 5.6-1.1 8 0z" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="0.6" fill="currentColor" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s7-7.2 7-12.2A7 7 0 0 0 5 8.8C5 13.8 12 21 12 21z" />
      <circle cx="12" cy="8.7" r="2.4" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <line x1="3.5" y1="9.7" x2="20.5" y2="9.7" />
      <line x1="8" y1="3" x2="8" y2="6.6" />
      <line x1="16" y1="3" x2="16" y2="6.6" />
    </>
  ),
  dollar: (
    <>
      <line x1="12" y1="2.5" x2="12" y2="21.5" />
      <path d="M16.5 6.7c-1-1-2.6-1.5-4.3-1.5-2.6 0-4.7 1.3-4.7 3.4 0 4.2 8.5 2.4 8.5 6.6 0 2.1-2.3 3.4-4.9 3.4-1.9 0-3.6-.6-4.6-1.7" />
    </>
  ),
};

function Icon({ name, size = 18, className = "" }) {
  const path = ICON_PATHS[name];
  if (!path) return null;
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {path}
    </svg>
  );
}

/* ============================================================
   NAVIGATION MODEL
   ============================================================ */

const NAV_SECTIONS = [
  {
    id: "action",
    label: "Action Center",
    icon: "alert",
    title: "🚨 Business Action Center",
    subtitle: "Detected problems, root causes, and recommended actions — powered by your live data."
  },
  {
    id: "overview",
    label: "Overview",
    icon: "grid",
    title: "Overview",
    subtitle: "Headline numbers and where they're coming from, at a glance."
  },
  {
    id: "assistant",
    label: "AI Assistant",
    icon: "message",
    title: "Business Story & Assistant",
    subtitle: "A plain-language read on your data, plus a place to ask follow-up questions."
  },
  {
    id: "trends",
    label: "Sales Trends",
    icon: "trending",
    title: "Sales & Profit Trend",
    subtitle: "Monthly performance across the full selected period."
  },
  {
    id: "breakdown",
    label: "Category & Region",
    icon: "pie",
    title: "Category & Region Breakdown",
    subtitle: "Where sales are concentrated across product lines and geographies."
  },
  {
    id: "products",
    label: "Top Products",
    icon: "package",
    title: "Top 10 Products",
    subtitle: "Your highest-selling items ranked by revenue."
  },
  {
    id: "forecast",
    label: "Forecast",
    icon: "sparkles",
    title: "Forecast — Next 3 Months",
    subtitle: "Projected sales and profit based on historical trend."
  },
  {
    id: "segments",
    label: "Customer Segments",
    icon: "users",
    title: "Customer Segments",
    subtitle: "How customer groups differ in value, frequency, and recency."
  },
  {
    id: "anomalies",
    label: "Anomalies",
    icon: "alert",
    title: "Loss-Making High-Sales Transactions",
    subtitle: "Orders with strong revenue but negative profit — usually over-discounted."
  }
];

function App() {

  const [kpis, setKpis] = useState(null);
  const [categories, setCategories] = useState([]);
  const [regions, setRegions] = useState([]);
  const [monthlySales, setMonthlySales] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSegment, setSelectedSegment] = useState("");
  const [insights, setInsights] = useState(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastSql, setLastSql] = useState("");
  const [salesForecast, setSalesForecast] = useState([]);
  const [profitForecast, setProfitForecast] = useState([]);
  const [customerSegments, setCustomerSegments] = useState([]);
  const [highSalesLoss, setHighSalesLoss] = useState({ count: 0, anomalies: [] });
  const [businessStory, setBusinessStory] = useState(null);
  const [storyLoading, setStoryLoading] = useState(false);
  const [answerChart, setAnswerChart] = useState(null);
  const [actionCenter, setActionCenter] = useState(null);

  // Navigation state
  const [activeSection, setActiveSection] = useState("overview");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [floatingChatOpen, setFloatingChatOpen] = useState(false);

  const CHAT_CHART_COLORS = ["#3552f0", "#12925a", "#b5670a", "#7c5cf0", "#d9371f", "#0891b2", "#c2410c"];

  // Voice Interaction States
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [availableVoices, setAvailableVoices] = useState([]);
  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const audioChunksRef = useRef([]);
  const isListeningRef = useRef(false);
  const finalTranscriptRef = useRef("");

  // Live 2D Rabbit State: "IDLE" | "LISTENING" | "THINKING" | "SPEAKING"
  const rabbitStatus = isSpeaking ? "SPEAKING" : (loading || isTranscribing) ? "THINKING" : isListening ? "LISTENING" : "IDLE";


// ........................................................
const [narrative, setNarrative] = useState({});
const [narrativeLoading, setNarrativeLoading] = useState(false);

const fetchNarrative = (queryString = "") => {
  setNarrativeLoading(true);
  fetch(`http://127.0.0.1:8000/api/dashboard-narrative${queryString}`)
    .then(res => res.json())
    .then(data => setNarrative(data))
    .catch(err => console.error("Narrative error:", err))
    .finally(() => setNarrativeLoading(false));
};

// /////////////////////////////////////////////////////////////

  // Load available speech synthesis voices
  useEffect(() => {
    const loadVoices = () => {
      if ("speechSynthesis" in window) {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          setAvailableVoices(voices);
        }
      }
    };

    loadVoices();
    if ("speechSynthesis" in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      isListeningRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
      }
      if (mediaStreamRef.current) {
        try {
          mediaStreamRef.current.getTracks().forEach(t => t.stop());
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  const fetchStory = (queryString = "") => {
    setStoryLoading(true);
    fetch(`http://127.0.0.1:8000/api/business-story${queryString}`)
      .then(res => res.json())
      .then(data => setBusinessStory(data))
      .catch(err => {
        console.error("Business story error:", err);
      })
      .finally(() => setStoryLoading(false));
  };

  useEffect(() => {

    const params = new URLSearchParams();

    if (selectedYear !== "") {
      params.append("year", selectedYear);
    }

    if (selectedRegion !== "") {
      params.append("region", selectedRegion);
    }

    if (selectedCategory !== "") {
      params.append("category", selectedCategory);
    }

    if (selectedSegment !== "") {
      params.append("segment", selectedSegment);
    }

    const query = params.toString()
      ? `?${params.toString()}`
      : "";

    // Fetch Business Story
    fetchStory(query);

    // Fetch AI Captions
    fetchNarrative(query);

    fetch(`http://127.0.0.1:8000/api/insights${query}`)
      .then(response => response.json())
      .then(data => setInsights(data))
      .catch(error => console.error("Insights error:", error));

    // KPIs
    fetch(`http://127.0.0.1:8000/api/filtered-data${query}`)
      .then(response => response.json())
      .then(data => setKpis(data))
      .catch(error => console.error("KPI error:", error));

    // Categories
    fetch(`http://127.0.0.1:8000/api/categories${query}`)
      .then(response => response.json())
      .then(data => setCategories(data))
      .catch(error => console.error("Category error:", error));

    // Regions
    fetch(`http://127.0.0.1:8000/api/regions${query}`)
      .then(response => response.json())
      .then(data => setRegions(data))
      .catch(error => console.error("Region error:", error));

    // Monthly Sales
    fetch(`http://127.0.0.1:8000/api/monthly-sales${query}`)
      .then(response => response.json())
      .then(data => setMonthlySales(data))
      .catch(error => console.error("Monthly sales error:", error));

    // Top Products
    fetch(`http://127.0.0.1:8000/api/top-products${query}`)
      .then(response => response.json())
      .then(data => setTopProducts(data))
      .catch(error => console.error("Top products error:", error));

    // Business Action Center
    fetch(`http://127.0.0.1:8000/api/action-center${query}`)
      .then(response => response.json())
      .then(data => setActionCenter(data))
      .catch(error => console.error("Action center error:", error));

  }, [
    selectedYear,
    selectedRegion,
    selectedCategory,
    selectedSegment
  ]);


  useEffect(() => {

    fetch("http://127.0.0.1:8000/api/predict-sales?periods=3")
      .then(response => response.json())
      .then(data => setSalesForecast(data.predictions))
      .catch(error => console.error("Sales forecast error:", error));

    fetch("http://127.0.0.1:8000/api/predict-profit?periods=3")
      .then(response => response.json())
      .then(data => setProfitForecast(data.predictions))
      .catch(error => console.error("Profit forecast error:", error));

    fetch("http://127.0.0.1:8000/api/customer-segments")
      .then(response => response.json())
      .then(data => setCustomerSegments(data.segments))
      .catch(error => console.error("Customer segments error:", error));

    fetch("http://127.0.0.1:8000/api/anomalies/high-sales-loss")
      .then(response => response.json())
      .then(data => setHighSalesLoss(data))
      .catch(error => console.error("Anomalies error:", error));

  }, []);


  const stopListening = () => {
    isListeningRef.current = false;
    setIsListening(false);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        // ignore
      }
    } else if (mediaStreamRef.current) {
      try {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      } catch (e) {
        // ignore
      }
      mediaStreamRef.current = null;
    }
  };

  // Speech-to-Text: Listen to User Voice with Multi-Layer Engine
  const toggleListening = async () => {
    if (isListeningRef.current || isListening) {
      stopListening();
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Microphone access is not supported in this browser. Please use Google Chrome, Microsoft Edge, Safari, or Firefox.");
      return;
    }

    try {
      stopSpeaking();
      finalTranscriptRef.current = "";
      setQuestion("");
      audioChunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // Select supported audio mime type
      let mimeType = "audio/webm";
      if (typeof MediaRecorder !== "undefined") {
        if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
          mimeType = "audio/webm;codecs=opus";
        } else if (MediaRecorder.isTypeSupported("audio/webm")) {
          mimeType = "audio/webm";
        } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
          mimeType = "audio/mp4";
        } else if (MediaRecorder.isTypeSupported("audio/ogg")) {
          mimeType = "audio/ogg";
        }
      }

      const recorder = new MediaRecorder(stream, { mimeType });
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((track) => track.stop());
          mediaStreamRef.current = null;
        }

        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        if (audioBlob.size > 300) {
          setIsTranscribing(true);
          try {
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);
            reader.onloadend = async () => {
              const base64Audio = reader.result;
              try {
                const response = await fetch("http://127.0.0.1:8000/api/transcribe-audio", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    audio_base64: base64Audio,
                    mime_type: mimeType.split(";")[0],
                  }),
                });
                const data = await response.json();
                if (data.success && data.text && data.text.trim()) {
                  setQuestion(data.text.trim());
                }
              } catch (err) {
                console.warn("Server audio transcription error:", err);
              } finally {
                setIsTranscribing(false);
              }
            };
          } catch (e) {
            console.error("Audio conversion error:", e);
            setIsTranscribing(false);
          }
        }
      };

      recorder.start(200);
      mediaRecorderRef.current = recorder;
      isListeningRef.current = true;
      setIsListening(true);

      // In parallel, run browser SpeechRecognition for instant live visual typing
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.lang = navigator.language || "en-US";
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.maxAlternatives = 1;

          recognition.onresult = (event) => {
            let interimTranscript = "";
            let newFinal = "";

            for (let i = event.resultIndex; i < event.results.length; i++) {
              const item = event.results[i];
              const text = item[0].transcript;
              if (item.isFinal) {
                newFinal += text + " ";
              } else {
                interimTranscript += text;
              }
            }

            if (newFinal) {
              finalTranscriptRef.current += newFinal;
            }

            const fullSpoken = (finalTranscriptRef.current + interimTranscript).trim();
            if (fullSpoken) {
              setQuestion(fullSpoken);
            }
          };

          recognition.onerror = (event) => {
            console.warn("Browser SpeechRecognition note:", event.error);
          };

          recognition.start();
          recognitionRef.current = recognition;
        } catch (recErr) {
          console.warn("Browser SpeechRecognition initialization warning:", recErr);
        }
      }
    } catch (err) {
      console.error("Microphone access error:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        alert("Microphone permission was denied. Please allow microphone access in your browser address bar to record your voice.");
      } else {
        alert("Could not access microphone: " + err.message);
      }
      isListeningRef.current = false;
      setIsListening(false);
    }
  };

  // Text-to-Speech: Read Answers Out Loud
  const speakText = (textToSpeak) => {
    if (!("speechSynthesis" in window)) {
      console.warn("Speech synthesis is not supported in this browser.");
      return;
    }

    window.speechSynthesis.cancel();

    if (!textToSpeak) return;

    const cleanText = textToSpeak
      .replace(/\*\*/g, "")
      .replace(/```[\s\S]*?```/g, "")
      .replace(/https?:\/\/\S+/g, "")
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);

    // Pick natural sounding English voice
    const voices = availableVoices.length > 0 ? availableVoices : window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(
      (v) => v.lang.startsWith("en") && (v.name.includes("Natural") || v.name.includes("Google") || v.name.includes("Samantha") || v.name.includes("Zira") || v.name.includes("Jenny") || v.name.includes("Guy") || v.name.includes("Aria"))
    ) || voices.find((v) => v.lang.startsWith("en")) || voices[0];

    if (naturalVoice) {
      utterance.voice = naturalVoice;
    }

    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };


  const askQuestion = async (queryOverride) => {
    const activeQuery = queryOverride !== undefined ? queryOverride : question;
    if (!activeQuery.trim() || loading) {
      return;
    }

    if (isListeningRef.current || isListening) {
      stopListening();
    }

    stopSpeaking();
    setLoading(true);
    setAnswer("");
    setLastSql("");
    setAnswerChart(null);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/ask-ai",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            question: activeQuery
          })
        }
      );

      const data = await response.json();
      const answerText = data.answer || "No response received.";
      setAnswer(answerText);
      if (data.sql) {
        setLastSql(data.sql);
      }
      if (data.chart) {
        setAnswerChart(data.chart);
      }

      // Automatically speak the response if voice is enabled
      if (autoSpeak && answerText) {
        speakText(answerText);
      }
    } catch (error) {
      console.error("Ask error:", error);
      setAnswer("Something went wrong. Please check your backend connection.");
    } finally {
      setLoading(false);
    }
  };


  const getActiveFilterLabel = () => {
    const parts = [];
    if (selectedYear) parts.push(selectedYear);
    if (selectedRegion) parts.push(selectedRegion);
    if (selectedCategory) parts.push(selectedCategory);
    if (selectedSegment) parts.push(selectedSegment);
    return parts.length > 0 ? parts.join(" · ") : "All Store Data";
  };

  const hasActiveFilters = Boolean(selectedYear || selectedRegion || selectedCategory || selectedSegment);

  const renderFormattedText = (text) => {
    if (!text) return null;
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={index} className="highlight-keyword">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  const activeMeta = NAV_SECTIONS.find((s) => s.id === activeSection) || NAV_SECTIONS[0];

  const goTo = (id) => {
    setActiveSection(id);
    setMobileNavOpen(false);
  };


  return (
    <div className="app-shell">

      {/* Mobile nav backdrop */}
      {mobileNavOpen && (
        <div className="mobile-nav-backdrop" onClick={() => setMobileNavOpen(false)} />
      )}

      {/* ================= SIDEBAR ================= */}

      <aside className={`sidebar ${mobileNavOpen ? "open" : ""}`}>

        <div className="brand">
          <div className="brand-mark">
            <Icon name="bot" size={20} className="" />
          </div>
          <div className="brand-text">
            <h1>Talking Rabbitt</h1>
            <p>Sales Intelligence</p>
          </div>
        </div>

        <ul className="nav-list">
          {NAV_SECTIONS.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className={`nav-item ${activeSection === item.id ? "active" : ""}`}
                onClick={() => goTo(item.id)}
              >
                <Icon name={item.icon} size={17} />
                {item.label}
              </button>
            </li>
          ))}
        </ul>

        <div className="nav-footer">
          <span className="live-dot" />
          <span>Live data</span>
        </div>

      </aside>

      {/* ================= MAIN ================= */}

      <div className="main">

        {/* Topbar: section heading + global filters */}
        <div className="topbar">
          <div className="topbar-row">

            <div className="topbar-heading">
              <button
                type="button"
                className="mobile-nav-toggle"
                onClick={() => setMobileNavOpen(true)}
                aria-label="Open navigation"
              >
                <Icon name="menu" size={18} />
              </button>
              <div>
                <h2>{activeMeta.title}</h2>
                <p>{activeMeta.subtitle}</p>
              </div>
            </div>

            <div className="filters">

              <div className="filter-group">
                <label>Year</label>
                <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
                  <option value="">All Years</option>
                  <option value="2014">2014</option>
                  <option value="2015">2015</option>
                  <option value="2016">2016</option>
                  <option value="2017">2017</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Region</label>
                <select value={selectedRegion} onChange={(e) => setSelectedRegion(e.target.value)}>
                  <option value="">All Regions</option>
                  <option value="West">West</option>
                  <option value="East">East</option>
                  <option value="Central">Central</option>
                  <option value="South">South</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Category</label>
                <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                  <option value="">All Categories</option>
                  <option value="Furniture">Furniture</option>
                  <option value="Office Supplies">Office Supplies</option>
                  <option value="Technology">Technology</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Segment</label>
                <select value={selectedSegment} onChange={(e) => setSelectedSegment(e.target.value)}>
                  <option value="">All Segments</option>
                  <option value="Consumer">Consumer</option>
                  <option value="Corporate">Corporate</option>
                  <option value="Home Office">Home Office</option>
                </select>
              </div>

            </div>

          </div>

          {hasActiveFilters && (
            <span className="active-filter-pill">
              <Icon name="target" size={12} />
              {getActiveFilterLabel()}
            </span>
          )}
        </div>

        {/* ================= OVERVIEW ================= */}

        {activeSection === "overview" && (
          <div className="view">

            {/* Mini Alert Strip — links to Action Center */}
            {actionCenter && actionCenter.total_alerts > 0 && (
              <div className="overview-alert-strip">
                <div className="overview-alert-strip-left">
                  <span className="overview-alert-icon">🚨</span>
                  <div>
                    <span className="overview-alert-title">
                      {actionCenter.critical_count > 0
                        ? `${actionCenter.critical_count} critical issue${actionCenter.critical_count > 1 ? "s" : ""} detected`
                        : `${actionCenter.warning_count} warning${actionCenter.warning_count > 1 ? "s" : ""} detected`}
                    </span>
                    <span className="overview-alert-sub">
                      {actionCenter.critical_count > 0 && actionCenter.warning_count > 0
                        ? `+${actionCenter.warning_count} warning${actionCenter.warning_count > 1 ? "s" : ""} · `
                        : ""}
                      ${actionCenter.recoverable_profit.toLocaleString()} recoverable profit identified
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="overview-alert-strip-btn"
                  onClick={() => goTo("action")}
                >
                  View Action Center →
                </button>
              </div>
            )}

            <div className="view-section">
              <section className="kpi-container">

                <div className="kpi-card">
                  <div className="kpi-top">
                    <h3>Total Sales</h3>
                    <div className="kpi-icon"><Icon name="dollar" size={16} /></div>
                  </div>
                  <h2>${kpis ? kpis.total_sales.toLocaleString() : "—"}</h2>
                </div>

                <div className="kpi-card">
                  <div className="kpi-top">
                    <h3>Total Profit</h3>
                    <div className="kpi-icon"><Icon name="trending" size={16} /></div>
                  </div>
                  <h2>${kpis ? kpis.total_profit.toLocaleString() : "—"}</h2>
                </div>

                <div className="kpi-card">
                  <div className="kpi-top">
                    <h3>Total Orders</h3>
                    <div className="kpi-icon"><Icon name="package" size={16} /></div>
                  </div>
                  <h2>{kpis ? kpis.total_orders.toLocaleString() : "—"}</h2>
                </div>

                <div className="kpi-card">
                  <div className="kpi-top">
                    <h3>Total Customers</h3>
                    <div className="kpi-icon"><Icon name="users" size={16} /></div>
                  </div>
                  <h2>{kpis ? kpis.total_customers.toLocaleString() : "—"}</h2>
                </div>

                <div className="kpi-card">
                  <div className="kpi-top">
                    <h3>Profit Margin</h3>
                    <div className="kpi-icon"><Icon name="pie" size={16} /></div>
                  </div>
                  <h2>{kpis ? `${kpis.profit_margin}%` : "—"}</h2>
                </div>

              </section>
            </div>

            <div className="view-section chart-card">
              <div className="section-header">
                <h2><Icon name="bot" size={17} />Talking Rabbitt Insights</h2>
                <span className="section-tag">{getActiveFilterLabel()}</span>
              </div>

              {narrative.insights_caption && (
                <p className="ai-caption"><Icon name="sparkles" size={14} />{narrative.insights_caption}</p>
              )}

              {insights && (
                <div className="insight-grid">

                  <div className="insight-stat">
                    <span className="insight-stat-label"><Icon name="target" size={13} />Best Category</span>
                    <span className="insight-stat-value">{insights.best_category.name}</span>
                    <span className="insight-stat-sub">${insights.best_category.sales.toLocaleString()} in sales</span>
                  </div>

                  <div className="insight-stat">
                    <span className="insight-stat-label"><Icon name="pin" size={13} />Best Region</span>
                    <span className="insight-stat-value">{insights.best_region.name}</span>
                    <span className="insight-stat-sub">${insights.best_region.profit.toLocaleString()} in profit</span>
                  </div>

                  <div className="insight-stat">
                    <span className="insight-stat-label"><Icon name="calendar" size={13} />Best Sales Month</span>
                    <span className="insight-stat-value">
                      {insights.best_month.year}-{String(insights.best_month.month).padStart(2, "0")}
                    </span>
                    <span className="insight-stat-sub">${insights.best_month.sales.toLocaleString()} in sales</span>
                  </div>

                  <div className="insight-stat warn">
                    <span className="insight-stat-label"><Icon name="alert" size={13} />Loss-Making Products</span>
                    <span className="insight-stat-value">{insights.loss_making_products_count}</span>
                    <span className="insight-stat-sub">products with negative profit</span>
                  </div>

                </div>
              )}
            </div>

            {/* Quick Chart Previews on Overview */}
            <div className="view-section two-column">
              <div className="chart-card">
                <div className="section-header">
                  <h2><Icon name="trending" size={17} />Monthly Sales & Profit</h2>
                  <button type="button" className="btn-link" onClick={() => goTo("trends")}>Full Trend →</button>
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={monthlySales}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e3e6ec" />
                    <XAxis dataKey="Year-Month" interval={5} angle={-25} textAnchor="end" height={45} tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                    <Tooltip
                      formatter={(value) => typeof value === 'number' ? '$' + Number(value).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : value}
                      contentStyle={{ background: "#ffffff", borderRadius: "10px", border: "1px solid #e3e6ec", boxShadow: "0 4px 14px rgba(0,0,0,0.08)", fontSize: "12px" }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="Sales" stroke="#3552f0" strokeWidth={2.5} dot={false} />
                    <Line type="monotone" dataKey="Profit" stroke="#12925a" strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-card">
                <div className="section-header">
                  <h2><Icon name="package" size={17} />Sales by Category</h2>
                  <button type="button" className="btn-link" onClick={() => goTo("breakdown")}>Details →</button>
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={categories}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e3e6ec" />
                    <XAxis dataKey="Category" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                    <Tooltip
                      formatter={(value) => typeof value === 'number' ? '$' + Number(value).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : value}
                      contentStyle={{ background: "#ffffff", borderRadius: "10px", border: "1px solid #e3e6ec", boxShadow: "0 4px 14px rgba(0,0,0,0.08)", fontSize: "12px" }}
                    />
                    <Bar dataKey="Sales" fill="#3552f0" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        )}

        {/* ================= ASSISTANT (STORY + CHAT) ================= */}

        {activeSection === "assistant" && (
          <div className="view assistant-view">
            
            {/* Full-width Business Story with horizontal 3-column chapter deck */}
            <section className="story-card full-width">

              <div className="story-header">
                <div className="story-title-group">
                  <h2><Icon name="book" size={17} />The Story of Your Business</h2>
                  <span className="story-badge">{getActiveFilterLabel()}</span>
                </div>
                <button
                  className="story-refresh-btn"
                  onClick={() => {
                    const params = new URLSearchParams();
                    if (selectedYear) params.append("year", selectedYear);
                    if (selectedRegion) params.append("region", selectedRegion);
                    if (selectedCategory) params.append("category", selectedCategory);
                    if (selectedSegment) params.append("segment", selectedSegment);
                    const q = params.toString() ? `?${params.toString()}` : "";
                    fetchStory(q);
                  }}
                  disabled={storyLoading}
                  title="Refresh story analysis"
                >
                  <Icon name="refresh" size={14} className={storyLoading ? "spin" : ""} />
                  {storyLoading ? "Updating…" : "Refresh Story"}
                </button>
              </div>

              {storyLoading && (
                <div className="story-loading-skeleton">
                  <div className="skeleton-line skeleton-title"></div>
                  <div className="skeleton-line skeleton-chips"></div>
                  <div className="skeleton-deck">
                    <div className="skeleton-line skeleton-text"></div>
                    <div className="skeleton-line skeleton-text"></div>
                    <div className="skeleton-line skeleton-text"></div>
                  </div>
                </div>
              )}

              {!storyLoading && businessStory && (
                <div className="story-content">

                  {/* Top Highlight Strip */}
                  <div className="story-hero-strip">
                    {businessStory.headline && (
                      <div className="story-headline-box">
                        <h3>{businessStory.headline}</h3>
                      </div>
                    )}

                    {businessStory.quick_takeaways && businessStory.quick_takeaways.length > 0 && (
                      <div className="quick-takeaways-bar">
                        <span className="takeaways-title">Quick Scan Highlights</span>
                        <div className="takeaway-chips">
                          {businessStory.quick_takeaways.map((item, idx) => (
                            <span key={idx} className="takeaway-chip">{item}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Horizontal 3-Column Deck: Previously (Left), Now (Center), Future (Right) */}
                  <div className="story-chapters-deck">

                    <div className="story-chapter-card chapter-previously">
                      <div className="chapter-marker">
                        <div className="chapter-icon-badge"><Icon name="calendar" size={14} /></div>
                        <div>
                          <span className="chapter-label">Chapter 1</span>
                          <h4 className="chapter-title">The Journey So Far</h4>
                        </div>
                      </div>
                      <p className="chapter-body">{renderFormattedText(businessStory.previously)}</p>
                    </div>

                    <div className="story-chapter-card chapter-now">
                      <div className="chapter-marker">
                        <div className="chapter-icon-badge"><Icon name="pin" size={14} /></div>
                        <div>
                          <span className="chapter-label">Chapter 2</span>
                          <h4 className="chapter-title">Where We Stand Today</h4>
                        </div>
                      </div>
                      <p className="chapter-body">{renderFormattedText(businessStory.now)}</p>
                    </div>

                    <div className="story-chapter-card chapter-future">
                      <div className="chapter-marker">
                        <div className="chapter-icon-badge"><Icon name="sparkles" size={14} /></div>
                        <div>
                          <span className="chapter-label">Chapter 3</span>
                          <h4 className="chapter-title">Looking Ahead & Moves</h4>
                        </div>
                      </div>
                      <p className="chapter-body">{renderFormattedText(businessStory.future)}</p>
                    </div>

                  </div>

                </div>
              )}

            </section>

            {/* Compact Chatbot Console */}
            <section className="ask-section compact-console">

              <div className="ask-header-row">
                <div>
                  <h2><Icon name="bot" size={17} />Ask Talking Rabbitt AI</h2>
                  <p className="ask-subtitle">Voice-enabled intelligence console — speak or type any question.</p>
                </div>

                <button
                  type="button"
                  className={`auto-speak-toggle ${autoSpeak ? "active" : ""}`}
                  onClick={() => {
                    if (autoSpeak) stopSpeaking();
                    setAutoSpeak(!autoSpeak);
                  }}
                  title="Toggle automatic voice narration of answers"
                >
                  <span className="toggle-dot"></span>
                  {autoSpeak ? "Voice: On" : "Voice: Off"}
                </button>
              </div>

              {/* Live 2D Layered Talking Rabbit Avatar Stage */}
              <div className="talking-rabbit-stage">
                <TalkingRabbitAvatar
                  status={rabbitStatus}
                  voiceOn={autoSpeak}
                  size="medium"
                  onToggleVoice={() => {
                    if (autoSpeak) stopSpeaking();
                    setAutoSpeak(!autoSpeak);
                  }}
                />
                
                <div className="rabbit-dialogue-bubble">
                  {rabbitStatus === "SPEAKING" ? (
                    <div className="bubble-speaking-mode">
                      <span className="bubble-tag">🔊 Speaking Out Loud</span>
                      <p className="bubble-preview">
                        "{answer ? (answer.length > 135 ? answer.slice(0, 135) + "..." : answer) : "Narrating answers..."}"
                      </p>
                    </div>
                  ) : rabbitStatus === "THINKING" ? (
                    <div className="bubble-thinking-mode">
                      <span className="bubble-tag">🧠 Analyzing Data</span>
                      <p className="bubble-preview">Checking SQL tables, calculating aggregates, and generating visual insights...</p>
                    </div>
                  ) : rabbitStatus === "LISTENING" ? (
                    <div className="bubble-listening-mode">
                      <span className="bubble-tag">🎙️ Listening to You</span>
                      <p className="bubble-preview">"I can hear you! Speak clearly, then click Stop or Ask..."</p>
                    </div>
                  ) : (
                    <div className="bubble-idle-mode">
                      <span className="bubble-tag">🐰 Live AI Voice Ready</span>
                      <p className="bubble-preview">"Click the microphone to speak, or type your business question below. I will respond in voice and charts!"</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="ask-box">

                <input
                  type="text"
                  placeholder={isListening ? "Listening to your voice…" : "Ask about sales, profit, top products, or regional leaks…"}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  disabled={loading}
                  className={isListening ? "input-listening" : ""}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      askQuestion();
                    }
                  }}
                />

                <button
                  type="button"
                  className={`mic-btn ${isListening ? "active listening" : ""}`}
                  onClick={toggleListening}
                  disabled={loading}
                  title={isListening ? "Stop listening" : "Click to speak your question"}
                >
                  <Icon name={isListening ? "micOff" : "mic"} size={15} />
                  {isListening ? "Stop" : "Speak"}
                </button>

                <button
                  type="button"
                  onClick={() => askQuestion()}
                  disabled={loading || !question.trim()}
                  className="ask-submit-btn"
                >
                  <Icon name="send" size={15} />
                  {loading ? "Thinking…" : "Ask"}
                </button>

              </div>

              {isListening && (
                <div className="listening-banner">
                  <div className="sound-wave">
                    <span></span><span></span><span></span><span></span><span></span>
                  </div>
                  <span>Recording — speak into the mic, then click <strong>Stop</strong> or <strong>Ask</strong></span>
                </div>
              )}

              {isTranscribing && (
                <div className="listening-banner transcribing">
                  <span className="spinner-pulse"><Icon name="loader" size={14} /></span>
                  <span>Transcribing your speech…</span>
                </div>
              )}

              {loading && (
                <div className="loading-indicator">
                  <Icon name="loader" size={15} />
                  <span>Analyzing dataset & generating response…</span>
                </div>
              )}

              {answer && (
                <div className="answer-box">
                  <div className="answer-header">
                    <div className="answer-header-title">
                      <Icon name="bot" size={15} />
                      <strong>Talking Rabbitt</strong>
                    </div>

                    <button
                      type="button"
                      className={`speak-btn ${isSpeaking ? "speaking" : ""}`}
                      onClick={() => {
                        if (isSpeaking) {
                          stopSpeaking();
                        } else {
                          speakText(answer);
                        }
                      }}
                      title={isSpeaking ? "Stop speaking" : "Listen to answer out loud"}
                    >
                      {isSpeaking ? (
                        <>
                          <span className="audio-wave-icon">
                            <span className="wave-bar"></span>
                            <span className="wave-bar"></span>
                            <span className="wave-bar"></span>
                          </span>
                          <span>Stop Voice</span>
                        </>
                      ) : (
                        <>
                          <Icon name="volume" size={13} />
                          <span>Read Aloud</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p className="answer-text">{renderFormattedText(answer)}</p>

                  {answerChart && answerChart.data && (
                    <div className="chatbot-chart-container">
                      <div className="chatbot-chart-header">
                        <span className="chatbot-chart-title">{answerChart.title || "Visual Breakdown"}</span>
                        <span className="chatbot-chart-badge">{answerChart.type ? answerChart.type.toUpperCase() : "CHART"}</span>
                      </div>

                      {answerChart.type === "bar" && (
                        <ResponsiveContainer width="100%" height={210}>
                          <BarChart data={answerChart.data} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis dataKey={answerChart.xKey} angle={-20} textAnchor="end" interval={0} height={35} tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip contentStyle={{ background: "#ffffff", borderRadius: "8px", border: "1px solid #e3e6ec", fontSize: "12px" }} />
                            {answerChart.yKeys.map((yKey, idx) => (
                              <Bar key={yKey} dataKey={yKey} fill={CHAT_CHART_COLORS[idx % CHAT_CHART_COLORS.length]} radius={[4, 4, 0, 0]} />
                            ))}
                          </BarChart>
                        </ResponsiveContainer>
                      )}

                      {answerChart.type === "line" && (
                        <ResponsiveContainer width="100%" height={210}>
                          <LineChart data={answerChart.data} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis dataKey={answerChart.xKey} angle={-20} textAnchor="end" interval={0} height={35} tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip contentStyle={{ background: "#ffffff", borderRadius: "8px", border: "1px solid #e3e6ec", fontSize: "12px" }} />
                            {answerChart.yKeys.map((yKey, idx) => (
                              <Line key={yKey} type="monotone" dataKey={yKey} stroke={CHAT_CHART_COLORS[idx % CHAT_CHART_COLORS.length]} strokeWidth={2.5} dot={{ r: 4 }} />
                            ))}
                          </LineChart>
                        </ResponsiveContainer>
                      )}

                      {answerChart.type === "pie" && (
                        <ResponsiveContainer width="100%" height={210}>
                          <PieChart>
                            <Pie
                              data={answerChart.data}
                              dataKey={answerChart.yKeys[0]}
                              nameKey={answerChart.xKey}
                              cx="50%"
                              cy="50%"
                              innerRadius={40}
                              outerRadius={70}
                              paddingAngle={3}
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                              {answerChart.data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={CHAT_CHART_COLORS[index % CHAT_CHART_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={{ background: "#ffffff", borderRadius: "8px", border: "1px solid #e3e6ec", fontSize: "12px" }} />
                          </PieChart>
                        </ResponsiveContainer>
                      )}

                      {answerChart.type === "table" && (
                        <div className="chatbot-mini-table-container">
                          <table className="chatbot-mini-table">
                            <thead>
                              <tr>
                                {answerChart.columns.map((col, idx) => (
                                  <th key={idx}>{col}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {answerChart.data.map((row, rIdx) => (
                                <tr key={rIdx}>
                                  {answerChart.columns.map((col, cIdx) => (
                                    <td key={cIdx}>{typeof row[col] === "number" ? row[col].toLocaleString() : String(row[col])}</td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {lastSql && (
                    <details className="sql-details">
                      <summary>View Generated SQL</summary>
                      <code>{lastSql}</code>
                    </details>
                  )}

                </div>
              )}

              <div className="sample-prompts">
                <span className="sample-title">Try asking</span>
                <div className="sample-pills">
                  <button onClick={() => { setQuestion("Which category is our biggest moneymaker?"); askQuestion("Which category is our biggest moneymaker?"); }}>
                    <Icon name="target" size={13} />Best category?
                  </button>
                  <button onClick={() => { setQuestion("Where are we losing money on discounts?"); askQuestion("Where are we losing money on discounts?"); }}>
                    <Icon name="alert" size={13} />Loss-making discounts?
                  </button>
                  <button onClick={() => { setQuestion("Who is our top customer by sales?"); askQuestion("Who is our top customer by sales?"); }}>
                    <Icon name="users" size={13} />Top customer?
                  </button>
                </div>
              </div>

            </section>

          </div>
        )}

        {/* ================= TRENDS ================= */}

        {activeSection === "trends" && (
          <div className="view">
            <div className="chart-card">
              <div className="section-header">
                <h2><Icon name="trending" size={17} />Sales & Profit Trend</h2>
              </div>
              {narrative.trend_caption && (
                <p className="ai-caption"><Icon name="sparkles" size={14} />{narrative.trend_caption}</p>
              )}

              <ResponsiveContainer width="100%" height={380}>
                <LineChart data={monthlySales}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e3e6ec" />
                  <XAxis dataKey="Year-Month" interval={3} angle={-45} textAnchor="end" height={70} tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(value) => typeof value === 'number' ? '$' + Number(value).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : value}
                    contentStyle={{ background: "#ffffff", borderRadius: "10px", border: "1px solid #e3e6ec", boxShadow: "0 4px 14px rgba(0,0,0,0.08)", fontSize: "13px" }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="Sales" stroke="#3552f0" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="Profit" stroke="#12925a" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ================= BREAKDOWN ================= */}

        {activeSection === "breakdown" && (
          <div className="view">
            <div className="two-column">

              <div className="chart-card">
                <div className="section-header">
                  <h2><Icon name="package" size={17} />Sales by Category</h2>
                </div>
                {narrative.category_caption && (
                  <p className="ai-caption"><Icon name="sparkles" size={14} />{narrative.category_caption}</p>
                )}
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={categories}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e3e6ec" />
                    <XAxis dataKey="Category" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                    <Tooltip
                      formatter={(value) => typeof value === 'number' ? '$' + Number(value).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : value}
                      contentStyle={{ background: "#ffffff", borderRadius: "10px", border: "1px solid #e3e6ec", boxShadow: "0 4px 14px rgba(0,0,0,0.08)", fontSize: "13px" }}
                    />
                    <Bar dataKey="Sales" fill="#3552f0" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-card">
                <div className="section-header">
                  <h2><Icon name="pie" size={17} />Sales by Region</h2>
                </div>
                {narrative.region_caption && (
                  <p className="ai-caption"><Icon name="sparkles" size={14} />{narrative.region_caption}</p>
                )}
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={regions}
                      dataKey="Sales"
                      nameKey="Region"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={95}
                      paddingAngle={3}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {regions.map((entry, index) => (
                        <Cell key={index} fill={CHAT_CHART_COLORS[index % CHAT_CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => typeof value === 'number' ? '$' + Number(value).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : value}
                      contentStyle={{ background: "#ffffff", borderRadius: "10px", border: "1px solid #e3e6ec", boxShadow: "0 4px 14px rgba(0,0,0,0.08)", fontSize: "13px" }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

            </div>
          </div>
        )}

        {/* ================= PRODUCTS ================= */}

        {activeSection === "products" && (
          <div className="view">
            <div className="chart-card">
              <div className="section-header">
                <h2><Icon name="package" size={17} />Top 10 Products by Sales</h2>
              </div>
              {narrative.top_products_caption && (
                <p className="ai-caption"><Icon name="sparkles" size={14} />{narrative.top_products_caption}</p>
              )}

              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Sales</th>
                      <th>Profit</th>
                      <th>Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProducts.map((product, index) => (
                      <tr key={index}>
                        <td>{product["Product Name"]}</td>
                        <td className="num-cell">${product.Sales.toLocaleString()}</td>
                        <td className={`num-cell ${product.Profit < 0 ? "text-negative" : ""}`}>
                          ${product.Profit.toLocaleString()}
                        </td>
                        <td className="num-cell">{product.Quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= FORECAST ================= */}

        {activeSection === "forecast" && (
          <div className="view">
            <div className="chart-card">
              <div className="section-header">
                <h2><Icon name="sparkles" size={17} />Predictions — Next 3 Months</h2>
              </div>
              {narrative.forecast_caption && (
                <p className="ai-caption"><Icon name="sparkles" size={14} />{narrative.forecast_caption}</p>
              )}

              <div className="two-column">

                <div>
                  <div className="section-header"><h2 style={{ fontSize: 14 }}>Sales Forecast</h2></div>
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>Month</th>
                          <th>Predicted Sales</th>
                        </tr>
                      </thead>
                      <tbody>
                        {salesForecast.map((p, index) => (
                          <tr key={index}>
                            <td>{p.date}</td>
                            <td className="num-cell text-positive">${p.predicted_sales.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <div className="section-header"><h2 style={{ fontSize: 14 }}>Profit Forecast</h2></div>
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>Month</th>
                          <th>Predicted Profit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {profitForecast.map((p, index) => (
                          <tr key={index}>
                            <td>{p.date}</td>
                            <td className="num-cell">${p.predicted_profit.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="forecast-note">
                    <Icon name="alert" size={14} />
                    <span>Profit is harder to forecast with the current data (R² = -0.36) — treat these as rough estimates, not firm numbers.</span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* ================= SEGMENTS ================= */}

        {activeSection === "segments" && (
          <div className="view">
            <div className="chart-card">
              <div className="section-header">
                <h2><Icon name="users" size={17} />Customer Segments</h2>
              </div>
              {narrative.segments_caption && (
                <p className="ai-caption"><Icon name="sparkles" size={14} />{narrative.segments_caption}</p>
              )}

              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Segment</th>
                      <th>Customers</th>
                      <th>Avg Monetary</th>
                      <th>Avg Profit</th>
                      <th>Avg Recency (days)</th>
                      <th>Avg Frequency</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerSegments.map((s, index) => (
                      <tr key={index}>
                        <td>{s.Segment}</td>
                        <td className="num-cell">{s.Customers}</td>
                        <td className="num-cell">${s.AvgMonetary.toLocaleString()}</td>
                        <td className="num-cell">${s.AvgProfit.toLocaleString()}</td>
                        <td className="num-cell">{s.AvgRecency}</td>
                        <td className="num-cell">{s.AvgFrequency}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= ANOMALIES ================= */}

        {activeSection === "anomalies" && (
          <div className="view">
            <div className="chart-card">
              <div className="section-header">
                <h2><Icon name="alert" size={17} />Loss-Making High-Sales Transactions</h2>
              </div>
              {narrative.anomalies_caption && (
                <p className="ai-caption"><Icon name="sparkles" size={14} />{narrative.anomalies_caption}</p>
              )}

              <p style={{ color: "var(--text-secondary)", fontSize: 13.5, marginTop: -4 }}>
                {highSalesLoss.count} transactions have high sales but negative profit — likely over-discounted.
              </p>

              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Category</th>
                      <th>Sales</th>
                      <th>Profit</th>
                      <th>Discount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {highSalesLoss.anomalies.slice(0, 10).map((a, index) => (
                      <tr key={index}>
                        <td>{a["Product Name"]}</td>
                        <td>{a.Category}</td>
                        <td className="num-cell">${a.Sales.toLocaleString()}</td>
                        <td className="num-cell text-negative">${a.Profit.toLocaleString()}</td>
                        <td className="num-cell">{(a.Discount * 100).toFixed(0)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= BUSINESS ACTION CENTER ================= */}

        {activeSection === "action" && (
          <div className="view action-center-view">

            {/* Health Score Header Strip */}
            {actionCenter && (
              <div className="ac-health-strip">
                <div className="ac-health-left">
                  <div className={`ac-health-score-badge ${
                    actionCenter.health_score >= 75 ? "score-good" :
                    actionCenter.health_score >= 55 ? "score-warn" : "score-bad"
                  }`}>
                    <span className="ac-score-num">{actionCenter.health_score}</span>
                    <span className="ac-score-label">Health Score</span>
                  </div>
                  <div className="ac-health-meta">
                    <h3 className="ac-health-title">Business Action Center</h3>
                    <p className="ac-health-sub">
                      {actionCenter.total_alerts === 0
                        ? "No significant issues detected. Business is running cleanly."
                        : `${actionCenter.total_alerts} issue${actionCenter.total_alerts > 1 ? "s" : ""} detected across your data — prioritised by financial impact.`}
                    </p>
                  </div>
                </div>
                <div className="ac-health-stats">
                  {actionCenter.critical_count > 0 && (
                    <div className="ac-stat-pill pill-critical">
                      <span className="ac-pill-num">{actionCenter.critical_count}</span>
                      <span className="ac-pill-label">Critical</span>
                    </div>
                  )}
                  {actionCenter.warning_count > 0 && (
                    <div className="ac-stat-pill pill-warning">
                      <span className="ac-pill-num">{actionCenter.warning_count}</span>
                      <span className="ac-pill-label">Warning</span>
                    </div>
                  )}
                  {actionCenter.recoverable_profit > 0 && (
                    <div className="ac-stat-pill pill-recover">
                      <span className="ac-pill-num">${actionCenter.recoverable_profit.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                      <span className="ac-pill-label">Recoverable</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Empty state */}
            {actionCenter && actionCenter.total_alerts === 0 && (
              <div className="ac-empty-state">
                <span className="ac-empty-icon">✅</span>
                <h3>No critical issues found</h3>
                <p>All categories, products, and regions are operating within acceptable ranges for the current filter selection.</p>
              </div>
            )}

            {/* Loading state */}
            {!actionCenter && (
              <div className="ac-empty-state">
                <Icon name="loader" size={28} className="spin" />
                <p>Analysing your data…</p>
              </div>
            )}

            {/* Alert Cards */}
            {actionCenter && actionCenter.alerts && actionCenter.alerts.length > 0 && (
              <div className="ac-alert-list">
                {actionCenter.alerts.map((alert) => (
                  <div key={alert.id} className={`ac-alert-card ${alert.severity}`}>

                    {/* Card Header */}
                    <div className="ac-alert-header">
                      <div className="ac-alert-header-left">
                        <span className="ac-alert-category">{alert.category}</span>
                        <h3 className="ac-alert-problem">{alert.problem}</h3>
                      </div>
                      <span className={`ac-severity-badge badge-${alert.severity}`}>{alert.tag}</span>
                    </div>

                    {/* Metrics Grid */}
                    <div className="ac-metrics-grid">
                      {alert.metrics.map((m, idx) => (
                        <div key={idx} className={`ac-metric-pill ${m.alert ? "metric-alert" : ""}`}>
                          <span className="ac-metric-label">{m.label}</span>
                          <span className="ac-metric-value">{m.value}</span>
                        </div>
                      ))}
                    </div>

                    {/* Why + Action */}
                    <div className="ac-callouts">
                      <div className="ac-why-box">
                        <span className="ac-callout-heading">
                          <Icon name="sparkles" size={13} /> Why this is happening
                        </span>
                        <p>{alert.why}</p>
                      </div>
                      <div className="ac-action-box">
                        <span className="ac-callout-heading">
                          <Icon name="target" size={13} /> Recommended action
                        </span>
                        <p>{alert.action}</p>
                      </div>
                    </div>

                    {/* Ask AI Button */}
                    <div className="ac-card-footer">
                      <span className="ac-impact-note">{alert.impact}</span>
                      <button
                        type="button"
                        className="ac-ask-ai-btn"
                        onClick={() => {
                          setQuestion(alert.question_prompt);
                          setFloatingChatOpen(true);
                        }}
                      >
                        <Icon name="bot" size={13} /> Ask AI about this
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}

          </div>
        )}

        {/* ================= FLOATING AI ASSISTANT (AMAZON / JP MORGAN STYLE) ================= */}
        <div className="floating-bot-wrapper">
          {floatingChatOpen && (
            <div className="floating-chat-window">
              <div className="floating-chat-header">
                <div className="floating-chat-header-title">
                  <div className="bot-avatar-badge">
                    <Icon name="bot" size={16} />
                  </div>
                  <div>
                    <h4>Talking Rabbitt AI</h4>
                    <span className="bot-subtext">Sales Copilot • Online</span>
                  </div>
                </div>
                <div className="floating-chat-header-actions">
                  <button
                    type="button"
                    className={`floating-speak-toggle ${autoSpeak ? "active" : ""}`}
                    onClick={() => {
                      if (autoSpeak) stopSpeaking();
                      setAutoSpeak(!autoSpeak);
                    }}
                    title={autoSpeak ? "Voice Auto-Read: Enabled" : "Voice Auto-Read: Disabled"}
                  >
                    <Icon name={autoSpeak ? "volume" : "volumeOff"} size={13} />
                  </button>
                  <button
                    type="button"
                    className="floating-close-btn"
                    onClick={() => setFloatingChatOpen(false)}
                    aria-label="Close Assistant"
                  >
                    <Icon name="close" size={15} />
                  </button>
                </div>
              </div>

              <div className="floating-chat-body">
                {answer ? (
                  <div className="floating-answer-card">
                    <div className="floating-answer-top">
                      <span className="bot-name-tag"><Icon name="sparkles" size={12} />AI Analysis</span>
                      <button
                        type="button"
                        className="speak-mini-btn"
                        onClick={() => isSpeaking ? stopSpeaking() : speakText(answer)}
                      >
                        <Icon name={isSpeaking ? "volumeOff" : "volume"} size={12} />
                        {isSpeaking ? "Stop" : "Listen"}
                      </button>
                    </div>
                    <p className="floating-answer-text">{renderFormattedText(answer)}</p>

                    {answerChart && answerChart.data && (
                      <div className="floating-chart-box">
                        <span className="floating-chart-tag">📊 {answerChart.title || "Visual Breakdown"}</span>
                        {answerChart.type === "bar" && (
                          <ResponsiveContainer width="100%" height={160}>
                            <BarChart data={answerChart.data} margin={{ top: 8, right: 8, left: -20, bottom: 20 }}>
                              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                              <XAxis dataKey={answerChart.xKey} tick={{ fontSize: 9 }} interval={0} angle={-20} textAnchor="end" height={25} />
                              <YAxis tick={{ fontSize: 9 }} />
                              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6 }} />
                              <Bar dataKey={answerChart.yKeys[0]} fill="#3552f0" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        )}
                        {answerChart.type === "line" && (
                          <ResponsiveContainer width="100%" height={160}>
                            <LineChart data={answerChart.data} margin={{ top: 8, right: 8, left: -20, bottom: 20 }}>
                              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                              <XAxis dataKey={answerChart.xKey} tick={{ fontSize: 9 }} interval={0} angle={-20} textAnchor="end" height={25} />
                              <YAxis tick={{ fontSize: 9 }} />
                              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6 }} />
                              <Line type="monotone" dataKey={answerChart.yKeys[0]} stroke="#3552f0" strokeWidth={2} dot={{ r: 3 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        )}
                        {answerChart.type === "pie" && (
                          <ResponsiveContainer width="100%" height={160}>
                            <PieChart>
                              <Pie
                                data={answerChart.data}
                                dataKey={answerChart.yKeys[0]}
                                nameKey={answerChart.xKey}
                                cx="50%"
                                cy="50%"
                                innerRadius={28}
                                outerRadius={50}
                                paddingAngle={2}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              >
                                {answerChart.data.map((entry, index) => (
                                  <Cell key={index} fill={CHAT_CHART_COLORS[index % CHAT_CHART_COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6 }} />
                            </PieChart>
                          </ResponsiveContainer>
                        )}
                        {answerChart.type === "table" && (
                          <div className="floating-mini-table">
                            <table>
                              <thead>
                                <tr>
                                  {answerChart.columns.map((c, i) => <th key={i}>{c}</th>)}
                                </tr>
                              </thead>
                              <tbody>
                                {answerChart.data.slice(0, 5).map((row, rI) => (
                                  <tr key={rI}>
                                    {answerChart.columns.map((c, cI) => <td key={cI}>{String(row[c])}</td>)}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="floating-welcome-msg">
                    <div className="floating-rabbit-avatar-holder">
                      <TalkingRabbitAvatar
                        status={rabbitStatus}
                        voiceOn={autoSpeak}
                        onToggleVoice={() => setAutoSpeak(!autoSpeak)}
                        size="small"
                        showStatusText={false}
                      />
                    </div>
                    <h5>How can I assist you?</h5>
                    <p>Ask any business question using voice or text. I can pull real-time charts & calculations.</p>
                  </div>
                )}

                {isListening && (
                  <div className="floating-listening-pill">
                    <span className="dot-record"></span>
                    <span>Recording speech... Click Stop when done</span>
                  </div>
                )}

                {isTranscribing && (
                  <div className="floating-listening-pill transcribing">
                    <span className="spinner-pulse"><Icon name="loader" size={12} /></span>
                    <span>Transcribing voice...</span>
                  </div>
                )}

                {loading && (
                  <div className="floating-loading-pill">
                    <span className="spinner-pulse"><Icon name="loader" size={12} /></span>
                    <span>Querying dataset...</span>
                  </div>
                )}

                <div className="floating-quick-prompts">
                  <button onClick={() => { setQuestion("Which category is our biggest moneymaker?"); askQuestion("Which category is our biggest moneymaker?"); }}>🏆 Best category?</button>
                  <button onClick={() => { setQuestion("Where are we losing money on discounts?"); askQuestion("Where are we losing money on discounts?"); }}>⚠️ Loss discounts?</button>
                  <button onClick={() => { setQuestion("Who is our top customer by sales?"); askQuestion("Who is our top customer by sales?"); }}>👤 Top customer?</button>
                </div>
              </div>

              <div className="floating-chat-footer">
                <input
                  type="text"
                  placeholder="Ask a question or speak..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  disabled={loading}
                  onKeyDown={(e) => { if (e.key === "Enter") askQuestion(); }}
                />
                <button
                  type="button"
                  className={`floating-mic-btn ${isListening ? "active" : ""}`}
                  onClick={toggleListening}
                  disabled={loading}
                  title={isListening ? "Stop listening" : "Speak question"}
                >
                  <Icon name={isListening ? "micOff" : "mic"} size={14} />
                </button>
                <button
                  type="button"
                  className="floating-send-btn"
                  onClick={() => askQuestion()}
                  disabled={loading || !question.trim()}
                  title="Submit question"
                >
                  <Icon name="send" size={14} />
                </button>
              </div>
            </div>
          )}

          <button
            type="button"
            className={`floating-bot-launcher ${floatingChatOpen ? "active" : ""}`}
            onClick={() => setFloatingChatOpen(!floatingChatOpen)}
            aria-label="Toggle AI Copilot"
            title="Ask Talking Rabbitt AI"
          >
            <div className="launcher-pulse-ring"></div>
            <div className="launcher-icon">
              <Icon name={floatingChatOpen ? "close" : "bot"} size={22} />
            </div>
            <span className="launcher-text">Ask AI</span>
          </button>
        </div>

      </div>
    </div>
  );
}

export default App;