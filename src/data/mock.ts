// Données mockées MediCare BJ — patients, médecins, RDV, prescriptions, etc.
// Tout est local et statique, aucun appel réseau.

export type Role = "patient" | "medecin" | "admin";

export interface UserAccount {
  id: string;
  email: string;
  password: string;
  role: Role;
  fullName: string;
  avatar?: string;
}

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  sex: "M" | "F";
  phone: string;
  email: string;
  address: string;
  bloodGroup: string;
  height: number; // cm
  weight: number; // kg
  allergies: string[];
  chronicConditions: string[];
  emergencyContact: { name: string; phone: string };
  avatar?: string;
}

export interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  specialty: string;
  hospital: string;
  rating: number;
  online: boolean;
  avatar?: string;
}

export interface Consultation {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  hospital: string;
  reason: string;
  diagnosis: string;
  notes: string;
  vitals: { tension: string; temperature: number; weight: number };
}

export interface Prescription {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  status: "active" | "terminee" | "annulee";
  medications: { name: string; dosage: string; frequency: string; duration: string }[];
  instructions: string;
}

export interface Analysis {
  id: string;
  patientId: string;
  type: string;
  date: string;
  status: "en_attente" | "disponible";
  laboratory: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  date: string; // ISO
  duration: number; // minutes
  reason: string;
  status: "planifie" | "confirme" | "annule" | "termine";
  hospital: string;
}

export interface Payment {
  id: string;
  patientId: string;
  date: string;
  description: string;
  amount: number; // FCFA
  method: "MTN Mobile Money" | "Moov Money" | "Carte" | null;
  status: "a_payer" | "paye" | "echec";
  reference?: string;
}

export interface Message {
  id: string;
  from: string;
  to: string;
  content: string;
  time: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  participantId: string; // doctorId
  unread: number;
  lastMessage: string;
  lastTime: string;
  messages: Message[];
}

export interface Notification {
  id: string;
  type: "rdv" | "resultat" | "prescription" | "systeme";
  title: string;
  description: string;
  time: string;
  read: boolean;
}

export interface AccessGrant {
  id: string;
  doctorId: string;
  level: "lecture" | "ecriture";
  startDate: string;
  endDate: string;
  status: "actif" | "revoque" | "expire";
}

/* ============== COMPTES DÉMO ============== */
export const ACCOUNTS: UserAccount[] = [
  { id: "u-pat", email: "patient@demo", password: "demo", role: "patient", fullName: "Adjoa Hounkpatin" },
  { id: "u-med", email: "medecin@demo", password: "demo", role: "medecin", fullName: "Dr. Kossi Adoukonou" },
  { id: "u-adm", email: "admin@demo", password: "demo", role: "admin", fullName: "Fatou Bio" },
];

/* ============== HÔPITAUX ============== */
export const HOSPITALS = [
  "CNHU-HKM Cotonou",
  "CHD Ouémé-Plateau",
  "HZ Suru-Léré",
  "Clinique Atinkanmey",
  "Polyclinique Les Cocotiers",
  "CHD Mono-Couffo",
];

/* ============== PATIENTS ============== */
export const PATIENTS: Patient[] = [
  {
    id: "p1",
    firstName: "Adjoa",
    lastName: "Hounkpatin",
    birthDate: "1992-04-15",
    sex: "F",
    phone: "+229 97 12 34 56",
    email: "patient@demo",
    address: "Quartier Cadjèhoun, Cotonou",
    bloodGroup: "O+",
    height: 168,
    weight: 64,
    allergies: ["Pénicilline", "Arachides"],
    chronicConditions: ["Hypertension légère"],
    emergencyContact: { name: "Koffi Hounkpatin", phone: "+229 96 00 11 22" },
  },
  {
    id: "p2",
    firstName: "Mensah",
    lastName: "Dossou",
    birthDate: "1985-11-02",
    sex: "M",
    phone: "+229 95 22 11 03",
    email: "mensah@demo",
    address: "Akpakpa, Cotonou",
    bloodGroup: "A+",
    height: 178,
    weight: 82,
    allergies: [],
    chronicConditions: ["Diabète type 2"],
    emergencyContact: { name: "Aïcha Dossou", phone: "+229 97 33 44 55" },
  },
  {
    id: "p3",
    firstName: "Aïssatou",
    lastName: "Tchibozo",
    birthDate: "2001-07-21",
    sex: "F",
    phone: "+229 94 88 77 66",
    email: "aissa@demo",
    address: "Porto-Novo",
    bloodGroup: "B-",
    height: 162,
    weight: 55,
    allergies: ["Latex"],
    chronicConditions: [],
    emergencyContact: { name: "Mariam Tchibozo", phone: "+229 96 11 22 33" },
  },
];

/* ============== MÉDECINS ============== */
export const DOCTORS: Doctor[] = [
  { id: "d1", firstName: "Kossi", lastName: "Adoukonou", specialty: "Médecin généraliste", hospital: HOSPITALS[0], rating: 4.8, online: true },
  { id: "d2", firstName: "Aminata", lastName: "Sogbo", specialty: "Cardiologue", hospital: HOSPITALS[4], rating: 4.9, online: false },
  { id: "d3", firstName: "Émile", lastName: "Zinsou", specialty: "Pédiatre", hospital: HOSPITALS[1], rating: 4.7, online: true },
  { id: "d4", firstName: "Léa", lastName: "Akpovi", specialty: "Radiologue", hospital: HOSPITALS[2], rating: 4.6, online: false },
];

/* ============== CONSULTATIONS ============== */
export const CONSULTATIONS: Consultation[] = [
  {
    id: "c1", patientId: "p1", doctorId: "d1", date: "2025-03-12", hospital: HOSPITALS[0],
    reason: "Maux de tête persistants", diagnosis: "Migraine légère liée au stress",
    notes: "Repos recommandé. Hydratation 2L/jour.",
    vitals: { tension: "12/8", temperature: 36.8, weight: 64 },
  },
  {
    id: "c2", patientId: "p1", doctorId: "d2", date: "2025-01-08", hospital: HOSPITALS[4],
    reason: "Suivi tension artérielle", diagnosis: "HTA stade 1 contrôlée",
    notes: "Continuer le traitement actuel. Réduction du sel.",
    vitals: { tension: "13/9", temperature: 36.5, weight: 65 },
  },
  {
    id: "c3", patientId: "p1", doctorId: "d1", date: "2024-11-22", hospital: HOSPITALS[0],
    reason: "Bilan annuel", diagnosis: "État général satisfaisant",
    notes: "Bilan biologique à programmer dans 6 mois.",
    vitals: { tension: "12/7", temperature: 36.7, weight: 66 },
  },
  {
    id: "c4", patientId: "p1", doctorId: "d1", date: "2024-08-04", hospital: HOSPITALS[0],
    reason: "Toux sèche", diagnosis: "Bronchite virale",
    notes: "Sirop expectorant + repos 5 jours.",
    vitals: { tension: "12/8", temperature: 37.4, weight: 65 },
  },
  {
    id: "c5", patientId: "p1", doctorId: "d2", date: "2024-05-19", hospital: HOSPITALS[4],
    reason: "Première consultation cardio", diagnosis: "Tension artérielle élevée — début prise en charge",
    notes: "Mise en place d'un traitement antihypertenseur.",
    vitals: { tension: "14/9", temperature: 36.6, weight: 67 },
  },
];

/* ============== PRESCRIPTIONS ============== */
export const PRESCRIPTIONS: Prescription[] = [
  {
    id: "rx1", patientId: "p1", doctorId: "d2", date: "2025-03-12", status: "active",
    medications: [
      { name: "Amlodipine 5mg", dosage: "1 cp", frequency: "1 fois/jour", duration: "30 jours" },
      { name: "Paracétamol 500mg", dosage: "1 cp", frequency: "Si douleur", duration: "7 jours" },
    ],
    instructions: "Prendre le matin à jeun. Surveiller la tension 1x/semaine.",
  },
  {
    id: "rx2", patientId: "p1", doctorId: "d1", date: "2024-11-22", status: "terminee",
    medications: [
      { name: "Vitamine D3 1000UI", dosage: "1 amp", frequency: "1 fois/mois", duration: "3 mois" },
    ],
    instructions: "Cure de vitamine D.",
  },
  {
    id: "rx3", patientId: "p1", doctorId: "d1", date: "2024-08-04", status: "terminee",
    medications: [
      { name: "Sirop Toplexil", dosage: "5ml", frequency: "3 fois/jour", duration: "5 jours" },
      { name: "Doliprane 1g", dosage: "1 cp", frequency: "3 fois/jour", duration: "5 jours" },
    ],
    instructions: "Repos. Boire chaud.",
  },
];

/* ============== ANALYSES ============== */
export const ANALYSES: Analysis[] = [
  { id: "a1", patientId: "p1", type: "Bilan lipidique complet", date: "2025-03-15", status: "disponible", laboratory: "Labo CNHU" },
  { id: "a2", patientId: "p1", type: "Glycémie à jeun", date: "2025-03-20", status: "en_attente", laboratory: "Labo CNHU" },
  { id: "a3", patientId: "p1", type: "NFS — Numération formule sanguine", date: "2025-01-09", status: "disponible", laboratory: "Polyclinique Les Cocotiers" },
];

/* ============== RENDEZ-VOUS ============== */
const today = new Date();
const dayOffset = (n: number, h = 10, m = 0) => {
  const d = new Date(today);
  d.setDate(d.getDate() + n);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
};

export const APPOINTMENTS: Appointment[] = [
  { id: "rdv1", patientId: "p1", doctorId: "d2", date: dayOffset(2, 9, 30), duration: 30, reason: "Suivi tension", status: "confirme", hospital: HOSPITALS[4] },
  { id: "rdv2", patientId: "p1", doctorId: "d1", date: dayOffset(7, 11, 0), duration: 20, reason: "Renouvellement ordonnance", status: "planifie", hospital: HOSPITALS[0] },
  { id: "rdv3", patientId: "p1", doctorId: "d4", date: dayOffset(14, 15, 0), duration: 45, reason: "Échographie abdominale", status: "planifie", hospital: HOSPITALS[2] },
  { id: "rdv4", patientId: "p1", doctorId: "d1", date: dayOffset(-5, 10, 0), duration: 30, reason: "Consultation générale", status: "termine", hospital: HOSPITALS[0] },
  { id: "rdv5", patientId: "p1", doctorId: "d3", date: dayOffset(-12, 16, 0), duration: 30, reason: "Vaccin", status: "termine", hospital: HOSPITALS[1] },
  { id: "rdv6", patientId: "p1", doctorId: "d2", date: dayOffset(-20, 9, 0), duration: 30, reason: "Bilan", status: "annule", hospital: HOSPITALS[4] },
  { id: "rdv7", patientId: "p2", doctorId: "d2", date: dayOffset(3, 14, 0), duration: 30, reason: "Suivi diabète", status: "confirme", hospital: HOSPITALS[4] },
  { id: "rdv8", patientId: "p3", doctorId: "d3", date: dayOffset(5, 10, 30), duration: 20, reason: "Première consultation", status: "planifie", hospital: HOSPITALS[1] },
];

/* ============== PAIEMENTS ============== */
export const PAYMENTS: Payment[] = [
  { id: "pay1", patientId: "p1", date: "2025-03-12", description: "Consultation cardiologie", amount: 15000, method: null, status: "a_payer" },
  { id: "pay2", patientId: "p1", date: "2025-03-15", description: "Bilan lipidique", amount: 8500, method: null, status: "a_payer" },
  { id: "pay3", patientId: "p1", date: "2025-01-08", description: "Consultation cardiologie", amount: 15000, method: "MTN Mobile Money", status: "paye", reference: "MTN-8H2K9P" },
  { id: "pay4", patientId: "p1", date: "2024-11-22", description: "Bilan annuel", amount: 25000, method: "Moov Money", status: "paye", reference: "MOV-2P9X1A" },
  { id: "pay5", patientId: "p1", date: "2024-08-04", description: "Consultation + médicaments", amount: 12000, method: "MTN Mobile Money", status: "paye", reference: "MTN-3K8L2M" },
  { id: "pay6", patientId: "p1", date: "2024-05-19", description: "Première consultation cardio", amount: 15000, method: "MTN Mobile Money", status: "echec" },
];

/* ============== CONVERSATIONS / MESSAGES ============== */
export const CONVERSATIONS: Conversation[] = [
  {
    id: "conv1", participantId: "d1", unread: 2, lastMessage: "N'oubliez pas votre bilan de la semaine prochaine.", lastTime: "10:24",
    messages: [
      { id: "m1", from: "d1", to: "p1", content: "Bonjour Adjoa, comment allez-vous aujourd'hui ?", time: "Hier 09:10", read: true },
      { id: "m2", from: "p1", to: "d1", content: "Bonjour Docteur, ça va bien merci. Les maux de tête ont diminué.", time: "Hier 09:32", read: true },
      { id: "m3", from: "d1", to: "p1", content: "Très bien. Continuez bien le traitement.", time: "Hier 10:01", read: true },
      { id: "m4", from: "d1", to: "p1", content: "N'oubliez pas votre bilan de la semaine prochaine.", time: "10:24", read: false },
    ],
  },
  {
    id: "conv2", participantId: "d2", unread: 0, lastMessage: "Vos derniers résultats sont disponibles.", lastTime: "Lun.",
    messages: [
      { id: "m5", from: "d2", to: "p1", content: "Vos derniers résultats sont disponibles.", time: "Lun. 14:00", read: true },
    ],
  },
  {
    id: "conv3", participantId: "d4", unread: 1, lastMessage: "Préparation : à jeun 8h avant l'examen.", lastTime: "Dim.",
    messages: [
      { id: "m6", from: "d4", to: "p1", content: "Préparation : à jeun 8h avant l'examen.", time: "Dim. 18:30", read: false },
    ],
  },
];

/* ============== NOTIFICATIONS ============== */
export const NOTIFICATIONS: Notification[] = [
  { id: "n1", type: "rdv", title: "Rappel rendez-vous", description: "Cardio avec Dr. Sogbo dans 2 jours.", time: "Il y a 1h", read: false },
  { id: "n2", type: "resultat", title: "Nouveau résultat disponible", description: "Bilan lipidique du 15/03.", time: "Il y a 3h", read: false },
  { id: "n3", type: "prescription", title: "Nouvelle prescription", description: "Dr. Sogbo a émis une nouvelle ordonnance.", time: "Hier", read: true },
  { id: "n4", type: "rdv", title: "Confirmation RDV", description: "Votre RDV du 24 mars est confirmé.", time: "Hier", read: true },
  { id: "n5", type: "systeme", title: "Mise à jour de sécurité", description: "Pensez à activer la double authentification.", time: "Il y a 2j", read: true },
  { id: "n6", type: "resultat", title: "Analyse en cours", description: "Glycémie à jeun en cours d'analyse.", time: "Il y a 2j", read: true },
  { id: "n7", type: "prescription", title: "Renouvellement bientôt", description: "Votre ordonnance Amlodipine arrive à expiration.", time: "Il y a 3j", read: true },
  { id: "n8", type: "rdv", title: "Annulation médecin", description: "Dr. Akpovi a déplacé un RDV.", time: "Il y a 4j", read: true },
  { id: "n9", type: "systeme", title: "Bienvenue sur MediCare BJ", description: "Votre compte a bien été créé.", time: "Il y a 1 sem", read: true },
  { id: "n10", type: "resultat", title: "NFS disponible", description: "Numération formule sanguine consultable.", time: "Il y a 2 sem", read: true },
];

/* ============== ACCÈS DOSSIER ============== */
export const ACCESS_GRANTS: AccessGrant[] = [
  { id: "ag1", doctorId: "d1", level: "ecriture", startDate: "2024-01-15", endDate: "2025-12-31", status: "actif" },
  { id: "ag2", doctorId: "d2", level: "ecriture", startDate: "2024-05-19", endDate: "2025-12-31", status: "actif" },
  { id: "ag3", doctorId: "d4", level: "lecture", startDate: "2025-03-10", endDate: "2025-04-10", status: "actif" },
];

/* ============== SUIVI POIDS ============== */
export const WEIGHT_HISTORY = [
  { date: "Sept", value: 67 },
  { date: "Oct", value: 67 },
  { date: "Nov", value: 66 },
  { date: "Déc", value: 65 },
  { date: "Jan", value: 65 },
  { date: "Fév", value: 64 },
  { date: "Mars", value: 64 },
];

/* ============== TECHNICIENS ============== */
export interface Technician {
  id: string;
  firstName: string;
  lastName: string;
  specialty: string;
  hospital: string;
  online: boolean;
}

export const TECHNICIANS: Technician[] = [
  { id: "t1", firstName: "Romuald", lastName: "Agossou", specialty: "Technicien de laboratoire", hospital: HOSPITALS[0], online: true },
  { id: "t2", firstName: "Clarisse", lastName: "Kpossou", specialty: "Technicien de radiologie", hospital: HOSPITALS[2], online: false },
];

/* ============== SIGNALEMENTS ============== */
export interface Report {
  id: string;
  reporterId: string; // userId
  reporterName: string;
  targetId: string;
  targetName: string;
  reason: string;
  details: string;
  date: string;
  status: "en_cours" | "traite" | "rejete";
  decision?: string;
}

export const REPORTS: Report[] = [
  {
    id: "rep1", reporterId: "u-pat", reporterName: "Adjoa Hounkpatin",
    targetId: "u-med", targetName: "Dr. Kossi Adoukonou",
    reason: "Comportement inapproprié", details: "Le médecin a partagé mes informations sans consentement lors d'une consultation.",
    date: "2025-03-10", status: "en_cours",
  },
  {
    id: "rep2", reporterId: "u-med", reporterName: "Dr. Aminata Sogbo",
    targetId: "u-pat", targetName: "Mensah Dossou",
    reason: "Fausse information", details: "Le patient a fourni de fausses informations médicales lors de l'inscription.",
    date: "2025-02-28", status: "traite", decision: "Avertissement envoyé au patient.",
  },
  {
    id: "rep3", reporterId: "u-pat", reporterName: "Aïssatou Tchibozo",
    targetId: "u-med", targetName: "Dr. Émile Zinsou",
    reason: "Absence non justifiée", details: "Le médecin n'était pas présent lors du rendez-vous confirmé.",
    date: "2025-01-15", status: "rejete", decision: "Signalement non fondé après vérification.",
  },
  {
    id: "rep4", reporterId: "u-pat", reporterName: "Mensah Dossou",
    targetId: "u-med", targetName: "Dr. Léa Akpovi",
    reason: "Retard excessif", details: "Attente de plus de 2h sans information ni excuse.",
    date: "2025-03-18", status: "en_cours",
  },
];

/* ============== HÔPITAUX DÉTAILLÉS ============== */
export interface Hospital {
  id: string;
  name: string;
  type: "CHU" | "CHD" | "HZ" | "Clinique" | "Polyclinique";
  city: string;
  address: string;
  phone: string;
  doctorCount: number;
  status: "actif" | "inactif";
  lat: number;
  lng: number;
}

export const HOSPITALS_DATA: Hospital[] = [
  { id: "h1", name: "CNHU-HKM Cotonou", type: "CHU", city: "Cotonou", address: "Avenue Jean-Paul II, Cotonou", phone: "+229 21 30 01 55", doctorCount: 120, status: "actif", lat: 6.3654, lng: 2.4183 },
  { id: "h2", name: "CHD Ouémé-Plateau", type: "CHD", city: "Porto-Novo", address: "Rue des Gouverneurs, Porto-Novo", phone: "+229 20 21 34 56", doctorCount: 45, status: "actif", lat: 6.4969, lng: 2.6289 },
  { id: "h3", name: "HZ Suru-Léré", type: "HZ", city: "Cotonou", address: "Quartier Suru-Léré, Cotonou", phone: "+229 21 32 11 22", doctorCount: 28, status: "actif", lat: 6.3536, lng: 2.3966 },
  { id: "h4", name: "Clinique Atinkanmey", type: "Clinique", city: "Cotonou", address: "Cadjèhoun, Cotonou", phone: "+229 21 30 88 99", doctorCount: 18, status: "actif", lat: 6.3700, lng: 2.4050 },
  { id: "h5", name: "Polyclinique Les Cocotiers", type: "Polyclinique", city: "Cotonou", address: "Haie Vive, Cotonou", phone: "+229 21 30 55 66", doctorCount: 32, status: "actif", lat: 6.3620, lng: 2.4220 },
  { id: "h6", name: "CHD Mono-Couffo", type: "CHD", city: "Lokossa", address: "Lokossa, Mono", phone: "+229 22 41 12 34", doctorCount: 22, status: "inactif", lat: 6.6333, lng: 1.7167 },
];

/* ============== TRANSACTIONS ADMIN ============== */
export interface Transaction {
  id: string;
  patientName: string;
  date: string;
  description: string;
  amount: number;
  method: "MTN Mobile Money" | "Moov Money" | "Carte";
  reference: string;
  status: "succes" | "echec" | "en_cours";
}

export const TRANSACTIONS: Transaction[] = [
  { id: "tr1", patientName: "Adjoa Hounkpatin", date: "2025-03-12", description: "Consultation cardiologie", amount: 15000, method: "MTN Mobile Money", reference: "MTN-8H2K9P", status: "succes" },
  { id: "tr2", patientName: "Mensah Dossou", date: "2025-03-10", description: "Bilan diabète", amount: 12000, method: "Moov Money", reference: "MOV-3K9L2A", status: "succes" },
  { id: "tr3", patientName: "Aïssatou Tchibozo", date: "2025-03-08", description: "Consultation pédiatrie", amount: 8000, method: "MTN Mobile Money", reference: "MTN-5P2X8Q", status: "succes" },
  { id: "tr4", patientName: "Adjoa Hounkpatin", date: "2025-03-05", description: "Bilan lipidique", amount: 8500, method: "MTN Mobile Money", reference: "MTN-1A3B5C", status: "echec" },
  { id: "tr5", patientName: "Mensah Dossou", date: "2025-02-28", description: "Consultation générale", amount: 5000, method: "Moov Money", reference: "MOV-7D9E1F", status: "succes" },
  { id: "tr6", patientName: "Aïssatou Tchibozo", date: "2025-02-20", description: "Radiologie", amount: 25000, method: "Carte", reference: "CARD-2G4H6I", status: "en_cours" },
];

/* ============== INSCRIPTIONS MÉDECINS EN ATTENTE ============== */
export interface PendingDoctor {
  id: string;
  firstName: string;
  lastName: string;
  specialty: string;
  orderNumber: string;
  hospital: string;
  registrationDate: string;
  status: "en_attente" | "valide" | "rejete";
}

export const PENDING_DOCTORS: PendingDoctor[] = [
  { id: "pd1", firstName: "Théodore", lastName: "Gbaguidi", specialty: "Neurologue", orderNumber: "BJ-MED-2025-0412", hospital: HOSPITALS[0], registrationDate: "2025-03-20", status: "en_attente" },
  { id: "pd2", firstName: "Fatoumata", lastName: "Sow", specialty: "Gynécologue", orderNumber: "BJ-MED-2025-0398", hospital: HOSPITALS[4], registrationDate: "2025-03-18", status: "en_attente" },
  { id: "pd3", firstName: "Brice", lastName: "Hounsou", specialty: "Dermatologue", orderNumber: "BJ-MED-2025-0385", hospital: HOSPITALS[1], registrationDate: "2025-03-15", status: "valide" },
  { id: "pd4", firstName: "Nadège", lastName: "Amoussou", specialty: "Ophtalmologue", orderNumber: "BJ-MED-2025-0371", hospital: HOSPITALS[2], registrationDate: "2025-03-10", status: "rejete" },
];

/* ============== STATS MENSUELLES ============== */
export const MONTHLY_REGISTRATIONS = [
  { month: "Oct", patients: 120, medecins: 8 },
  { month: "Nov", patients: 145, medecins: 12 },
  { month: "Déc", patients: 98, medecins: 5 },
  { month: "Jan", patients: 210, medecins: 18 },
  { month: "Fév", patients: 185, medecins: 14 },
  { month: "Mars", patients: 260, medecins: 22 },
];

export const MONTHLY_REVENUE = [
  { month: "Oct", amount: 1250000 },
  { month: "Nov", amount: 1480000 },
  { month: "Déc", amount: 980000 },
  { month: "Jan", amount: 2100000 },
  { month: "Fév", amount: 1850000 },
  { month: "Mars", amount: 2600000 },
];

export const CONSULTATIONS_BY_HOSPITAL = [
  { name: "CNHU-HKM", count: 342 },
  { name: "CHD Ouémé", count: 198 },
  { name: "HZ Suru-Léré", count: 145 },
  { name: "Atinkanmey", count: 112 },
  { name: "Les Cocotiers", count: 189 },
  { name: "CHD Mono", count: 67 },
];

/* ============== JOURNAL MÉDECIN ============== */
export interface JournalEntry {
  id: string;
  date: string;
  action: string;
  patientName: string;
  result: string;
  type: "consultation" | "prescription" | "analyse" | "acces";
}

export const DOCTOR_JOURNAL: JournalEntry[] = [
  { id: "j1", date: "2025-03-12 10:24", action: "Consultation enregistrée", patientName: "Adjoa Hounkpatin", result: "Migraine légère", type: "consultation" },
  { id: "j2", date: "2025-03-12 10:45", action: "Prescription émise", patientName: "Adjoa Hounkpatin", result: "2 médicaments", type: "prescription" },
  { id: "j3", date: "2025-03-10 14:30", action: "Accès dossier", patientName: "Mensah Dossou", result: "Lecture seule", type: "acces" },
  { id: "j4", date: "2025-03-08 09:15", action: "Analyse demandée", patientName: "Aïssatou Tchibozo", result: "NFS", type: "analyse" },
  { id: "j5", date: "2025-03-05 16:00", action: "Consultation enregistrée", patientName: "Mensah Dossou", result: "Diabète type 2 — suivi", type: "consultation" },
  { id: "j6", date: "2025-03-01 11:20", action: "Prescription émise", patientName: "Mensah Dossou", result: "Metformine 500mg", type: "prescription" },
];

/* ============== AUDIT ADMIN ============== */
export interface AuditEntry {
  id: string;
  datetime: string;
  user: string;
  action: string;
  entity: string;
  ip: string;
  suspicious: boolean;
}

export const AUDIT_LOG: AuditEntry[] = [
  { id: "au1", datetime: "2025-03-22 08:14", user: "Dr. Adoukonou", action: "Accès dossier patient", entity: "Adjoa Hounkpatin", ip: "41.82.14.22", suspicious: false },
  { id: "au2", datetime: "2025-03-22 08:30", user: "Fatou Bio (Admin)", action: "Suspension compte", entity: "Mensah Dossou", ip: "41.82.14.01", suspicious: false },
  { id: "au3", datetime: "2025-03-21 23:55", user: "Inconnu", action: "Tentative connexion échouée (x5)", entity: "admin@demo", ip: "197.234.56.78", suspicious: true },
  { id: "au4", datetime: "2025-03-21 14:22", user: "Dr. Sogbo", action: "Export données patient", entity: "Adjoa Hounkpatin", ip: "41.82.15.33", suspicious: true },
  { id: "au5", datetime: "2025-03-20 10:05", user: "Fatou Bio (Admin)", action: "Validation médecin", entity: "Dr. Brice Hounsou", ip: "41.82.14.01", suspicious: false },
  { id: "au6", datetime: "2025-03-19 16:40", user: "Dr. Zinsou", action: "Prescription émise", entity: "Aïssatou Tchibozo", ip: "41.82.16.44", suspicious: false },
];

/* ============== HELPERS ============== */
export const getDoctor = (id: string) => DOCTORS.find((d) => d.id === id);
export const getPatient = (id: string) => PATIENTS.find((p) => p.id === id);
export const formatFCFA = (n: number) =>
  new Intl.NumberFormat("fr-FR").format(n) + " FCFA";
export const calcAge = (birth: string) => {
  const b = new Date(birth);
  const diff = Date.now() - b.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
};
