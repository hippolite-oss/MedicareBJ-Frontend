/**
 * utils/errorMessages.ts - Messages d'erreur en français compréhensibles
 */

/**
 * Traduit les erreurs techniques en messages compréhensibles
 */
export function getErrorMessage(error: any): string {
  // Si l'erreur a déjà un message en français du backend, l'utiliser
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  // Si c'est un message d'erreur direct
  if (error?.message) {
    // Vérifier si c'est un message technique à traduire
    const technicalMessage = error.message.toLowerCase();
    
    // Erreurs réseau
    if (technicalMessage.includes('network error') || technicalMessage.includes('network request failed')) {
      return 'Impossible de se connecter au serveur. Vérifiez votre connexion internet.';
    }
    
    if (technicalMessage.includes('timeout')) {
      return 'La requête a pris trop de temps. Veuillez réessayer.';
    }
    
    if (technicalMessage.includes('request failed')) {
      return 'Une erreur est survenue lors de la communication avec le serveur.';
    }
    
    // Si le message semble déjà en français, le retourner
    if (isFrenchMessage(error.message)) {
      return error.message;
    }
  }

  // Erreurs HTTP par code de statut
  const status = error?.response?.status;
  
  switch (status) {
    case 400:
      return 'Les informations fournies sont incorrectes ou incomplètes.';
    case 401:
      return 'Vous devez vous connecter pour accéder à cette fonctionnalité.';
    case 403:
      return 'Vous n\'avez pas les permissions nécessaires pour effectuer cette action.';
    case 404:
      return 'La ressource demandée est introuvable.';
    case 409:
      return 'Cette action ne peut pas être effectuée car elle entre en conflit avec des données existantes.';
    case 422:
      return 'Les données fournies ne sont pas valides.';
    case 429:
      return 'Trop de tentatives. Veuillez patienter quelques instants avant de réessayer.';
    case 500:
      return 'Une erreur s\'est produite sur le serveur. Veuillez réessayer plus tard.';
    case 502:
    case 503:
      return 'Le serveur est temporairement indisponible. Veuillez réessayer dans quelques instants.';
    case 504:
      return 'Le serveur met trop de temps à répondre. Veuillez réessayer.';
    default:
      return 'Une erreur inattendue s\'est produite. Veuillez réessayer.';
  }
}

/**
 * Vérifie si un message semble être en français
 */
function isFrenchMessage(message: string): boolean {
  const frenchWords = [
    'le', 'la', 'les', 'un', 'une', 'des', 'de', 'du',
    'est', 'sont', 'a', 'ont', 'pour', 'avec', 'dans',
    'erreur', 'impossible', 'veuillez', 'vous', 'votre',
  ];
  
  const lowerMessage = message.toLowerCase();
  return frenchWords.some(word => lowerMessage.includes(` ${word} `) || lowerMessage.startsWith(`${word} `));
}

/**
 * Messages de succès standardisés
 */
export const successMessages = {
  // Authentification
  login: 'Connexion réussie ! Bienvenue.',
  logout: 'Déconnexion réussie. À bientôt !',
  register: 'Inscription réussie ! Votre compte a été créé.',
  passwordChanged: 'Votre mot de passe a été modifié avec succès.',
  passwordReset: 'Un email de réinitialisation vous a été envoyé.',
  
  // Profil
  profileUpdated: 'Votre profil a été mis à jour avec succès.',
  photoUpdated: 'Votre photo de profil a été mise à jour.',
  
  // Rendez-vous
  rdvCreated: 'Votre demande de rendez-vous a été envoyée.',
  rdvConfirmed: 'Le rendez-vous a été confirmé.',
  rdvCancelled: 'Le rendez-vous a été annulé.',
  rdvRescheduled: 'Le rendez-vous a été reprogrammé.',
  
  // Messages
  messageSent: 'Votre message a été envoyé.',
  
  // Prescriptions
  prescriptionCreated: 'L\'ordonnance a été créée avec succès.',
  prescriptionUpdated: 'L\'ordonnance a été mise à jour.',
  
  // Admin
  userValidated: 'L\'utilisateur a été validé avec succès.',
  userRejected: 'La demande a été rejetée.',
  hopitalCreated: 'L\'hôpital a été ajouté avec succès.',
  hopitalUpdated: 'L\'hôpital a été mis à jour.',
  hopitalDeleted: 'L\'hôpital a été supprimé.',
  medicamentCreated: 'Le médicament a été ajouté avec succès.',
  medicamentUpdated: 'Le médicament a été mis à jour.',
  medicamentDeleted: 'Le médicament a été supprimé.',
  
  // Général
  saved: 'Les modifications ont été enregistrées.',
  deleted: 'La suppression a été effectuée avec succès.',
  created: 'L\'élément a été créé avec succès.',
  updated: 'La mise à jour a été effectuée avec succès.',
};

/**
 * Messages d'erreur spécifiques par contexte
 */
export const errorMessages = {
  // Authentification
  invalidCredentials: 'Email ou mot de passe incorrect.',
  accountInactive: 'Votre compte est inactif. Veuillez contacter le support.',
  accountPending: 'Votre compte est en attente de validation.',
  emailTaken: 'Cet email est déjà utilisé.',
  
  // Validation
  requiredField: 'Ce champ est obligatoire.',
  invalidEmail: 'L\'adresse email n\'est pas valide.',
  passwordTooShort: 'Le mot de passe doit contenir au moins 8 caractères.',
  passwordMismatch: 'Les mots de passe ne correspondent pas.',
  invalidPhone: 'Le numéro de téléphone n\'est pas valide.',
  invalidDate: 'La date n\'est pas valide.',
  
  // Upload
  fileTooLarge: 'Le fichier est trop volumineux. Taille maximale : 5 Mo.',
  invalidFileType: 'Le type de fichier n\'est pas supporté.',
  uploadFailed: 'L\'envoi du fichier a échoué. Veuillez réessayer.',
  
  // Rendez-vous
  slotNotAvailable: 'Ce créneau n\'est plus disponible.',
  rdvNotFound: 'Le rendez-vous est introuvable.',
  cannotCancelRdv: 'Ce rendez-vous ne peut pas être annulé.',
  
  // Général
  notFound: 'L\'élément recherché est introuvable.',
  unauthorized: 'Vous n\'êtes pas autorisé à effectuer cette action.',
  serverError: 'Une erreur serveur s\'est produite. Veuillez réessayer.',
  networkError: 'Impossible de se connecter au serveur. Vérifiez votre connexion.',
  unknownError: 'Une erreur inattendue s\'est produite.',
};

/**
 * Messages de confirmation
 */
export const confirmMessages = {
  deleteRdv: 'Êtes-vous sûr de vouloir annuler ce rendez-vous ?',
  deleteHopital: 'Êtes-vous sûr de vouloir supprimer cet hôpital ?',
  deleteMedicament: 'Êtes-vous sûr de vouloir supprimer ce médicament ?',
  rejectUser: 'Êtes-vous sûr de vouloir rejeter cette demande ?',
  logout: 'Êtes-vous sûr de vouloir vous déconnecter ?',
};

/**
 * Messages d'information
 */
export const infoMessages = {
  loading: 'Chargement en cours...',
  saving: 'Enregistrement en cours...',
  uploading: 'Envoi en cours...',
  processing: 'Traitement en cours...',
  noData: 'Aucune donnée disponible.',
  noResults: 'Aucun résultat trouvé.',
  emptyList: 'La liste est vide.',
};
