// src/pages/Landing.jsx
import { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft, ChevronRight, ShieldCheck, QrCode, CalendarDays, 
  Smartphone, MessageSquare, Bell, UserPlus, ScanLine, Activity,
  Stethoscope, User, Settings, ArrowRight, Phone, Mail, MapPin,
  Facebook, Twitter, Instagram, Linkedin, Users, Award, Clock,
  Heart, FileText, Syringe, Pill, Ambulance, Microscope, XCircle
} from 'lucide-react';
import { motion, useAnimation, useInView } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const Landing = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Refs pour les sections
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const audienceRef = useRef(null);
  const statsRef = useRef(null);
  const contactRef = useRef(null);

  // Contrôles d'animation
  const controls = {
    hero: useAnimation(),
    features: useAnimation(),
    audience: useAnimation(),
    stats: useAnimation(),
    contact: useAnimation()
  };

  // Slides du carousel
  const slides = [
    { 
      image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?ixlib=rb-4.0.3", 
      title: "Votre santé numérisée", 
      subtitle: "Accédez à vos données médicales en un seul scan QR", 
      cta: "Commencer maintenant",
      badge: "Nouvelle technologie ⚡"
    },
    { 
      image: "https://images.unsplash.com/photo-1584515933487-779824d29309?ixlib=rb-4.0.3", 
      title: "Médecins connectés", 
      subtitle: "Plus de 500 professionnels de santé partenaires", 
      cta: "Trouver un médecin",
      badge: "Réseau en expansion 🌍"
    },
    { 
      image: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?ixlib=rb-4.0.3", 
      title: "Urgences 24h/24", 
      subtitle: "Accès immédiat à votre dossier médical en cas d'urgence", 
      cta: "En savoir plus",
      badge: "Service d'urgence 🚑"
    }
  ];

  // Fonctionnalités principales
  const features = [
    { icon: ShieldCheck, title: "Dossier sécurisé", desc: "Vos données médicales chiffrées et protégées.", color: "from-blue-500 to-cyan-500" },
    { icon: QrCode, title: "Code QR d'accès", desc: "Partagez votre dossier en un scan, en toute confiance.", color: "from-indigo-500 to-blue-500" },
    { icon: CalendarDays, title: "Rendez-vous", desc: "Réservez chez le médecin de votre choix en 3 clics.", color: "from-blue-600 to-blue-400" },
    { icon: Smartphone, title: "Paiement mobile", desc: "MTN Mobile Money & Moov Money intégrés.", color: "from-cyan-500 to-blue-500" },
    { icon: MessageSquare, title: "Messagerie", desc: "Échangez directement avec vos médecins.", color: "from-blue-500 to-indigo-500" },
    { icon: Bell, title: "Notifications", desc: "Rappels de RDV et alertes de résultats.", color: "from-sky-500 to-blue-500" },
  ];

  // Services complémentaires
  const services = [
    { icon: <Ambulance className="w-10 h-10 md:w-12 md:h-12" />, title: "Urgences 24/7", description: "Accès immédiat à votre dossier en cas d'urgence", color: "bg-red-500" },
    { icon: <Microscope className="w-10 h-10 md:w-12 md:h-12" />, title: "Analyses labo", description: "Résultats d'analyses directement dans l'app", color: "bg-purple-500" },
    { icon: <Pill className="w-10 h-10 md:w-12 md:h-12" />, title: "Ordonnances", description: "Téléchargez vos ordonnances numériques", color: "bg-green-500" },
    { icon: <Heart className="w-10 h-10 md:w-12 md:h-12" />, title: "Suivi personnalisé", description: "Programmes de santé adaptés à vos besoins", color: "bg-pink-500" },
  ];

  // Audience cible
  const audiences = [
    { icon: <User className="h-8 w-8" />, title: "Patients", desc: "Gardez le contrôle de vos données et de vos rendez-vous.", color: "from-blue-500 to-cyan-500" },
    { icon: <Stethoscope className="h-8 w-8" />, title: "Médecins", desc: "Accédez aux dossiers en un scan, en toute légalité.", color: "from-indigo-500 to-blue-500" },
    { icon: <Settings className="h-8 w-8" />, title: "Administrateurs", desc: "Supervisez la plateforme et garantissez la qualité du service.", color: "from-sky-500 to-blue-500" },
  ];

  // Statistiques
  const stats = [
    { value: "500+", label: "Médecins partenaires", icon: <Stethoscope className="h-6 w-6" /> },
    { value: "10 000+", label: "Patients enregistrés", icon: <Users className="h-6 w-6" /> },
    { value: "34", label: "Zones sanitaires", icon: <MapPin className="h-6 w-6" /> },
    { value: "98%", label: "Taux de satisfaction", icon: <Heart className="h-6 w-6" /> }
  ];

  // Navigation du carousel
  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  // Auto-défilement du carousel
  useEffect(() => {
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, []);

  // Vérification des sections visibles
  const heroInView = useInView(heroRef, { once: true, margin: "-100px" });
  const featuresInView = useInView(featuresRef, { once: true });
  const audienceInView = useInView(audienceRef, { once: true });
  const statsInView = useInView(statsRef, { once: true });
  const contactInView = useInView(contactRef, { once: true });

  // Déclenchement des animations
  useEffect(() => {
    if (heroInView) controls.hero.start({ opacity: 1, y: 0 });
    if (featuresInView) controls.features.start({ opacity: 1, y: 0 });
    if (audienceInView) controls.audience.start({ opacity: 1, y: 0 });
    if (statsInView) controls.stats.start({ opacity: 1, y: 0 });
    if (contactInView) controls.contact.start({ opacity: 1, y: 0 });
  }, [heroInView, featuresInView, audienceInView, statsInView, contactInView]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50 overflow-x-hidden">
      {/* HEADER */}
      <header className="sticky top-0 z-30 border-b border-blue-200 bg-white/95 backdrop-blur shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3 lg:px-10">
          <Logo />
          <nav className="hidden items-center gap-7 text-sm font-medium text-blue-700 md:flex">
            <a href="#features" className="hover:text-blue-900 transition-colors">Fonctionnalités</a>
            <a href="#audience" className="hover:text-blue-900 transition-colors">Pour qui</a>
            <a href="#stats" className="hover:text-blue-900 transition-colors">Chiffres</a>
            <a href="#contact" className="hover:text-blue-900 transition-colors">Contact</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-blue-700 hover:text-blue-900">
                Connexion
              </Button>
            </Link>
            <Link to="/register">
              <Button size="sm" className="rounded-full bg-blue-700 hover:bg-blue-800 text-white shadow-md">
                S'inscrire
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION AVEC CAROUSEL */}
      <section id="accueil" className="pt-16 md:pt-20" ref={heroRef}>
        <div className="relative h-[60vh] md:h-[70vh] lg:h-[80vh] overflow-hidden">
          {slides.map((slide, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0 }}
              animate={{
                opacity: index === currentSlide ? 1 : 0,
                scale: index === currentSlide ? 1 : 1.1
              }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
              className="absolute inset-0"
            >
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: `url(${slide.image})`,
                  transform: `scale(${index === currentSlide ? 1 : 1.05})`,
                  transition: 'transform 10s ease-out'
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-900/80 via-blue-900/50 to-transparent"></div>
              </div>

              <div className="relative h-full flex items-center">
                <div className="container mx-auto px-4 md:px-6 lg:px-8">
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                    className="max-w-xl md:max-w-2xl text-white"
                  >
                    <span className="inline-block px-4 py-1 bg-blue-600/20 backdrop-blur-sm rounded-full text-sm font-semibold mb-4 border border-white/20">
                      {slide.badge}
                    </span>
                    <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 leading-tight">
                      {slide.title}
                    </h1>
                    <p className="text-lg md:text-xl lg:text-2xl mb-6 opacity-90">
                      {slide.subtitle}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Link to="/register">
                        <button className="group relative bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 md:px-8 md:py-4 rounded-xl text-base font-semibold hover:shadow-xl hover:scale-105 transition-all duration-300 overflow-hidden">
                          <span className="relative z-10">{slide.cta}</span>
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-blue-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </button>
                      </Link>
                      <a 
                        href="https://wa.me/2290156169813"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group bg-white/10 backdrop-blur-sm border border-white/30 text-white px-6 py-3 md:px-8 md:py-4 rounded-xl text-base font-semibold hover:bg-white/20 transition-all duration-300"
                      >
                        <span className="flex items-center justify-center gap-2">
                          Contactez-nous
                          <Phone className="h-5 w-5 group-hover:animate-pulse" />
                        </span>
                      </a>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          ))}

          {/* Contrôles du carousel */}
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 backdrop-blur-sm p-3 rounded-full shadow-xl transition-all duration-300 group"
          >
            <ChevronLeft className="h-5 w-5 md:h-6 md:w-6 text-white group-hover:scale-110 transition-transform" />
          </button>

          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 backdrop-blur-sm p-3 rounded-full shadow-xl transition-all duration-300 group"
          >
            <ChevronRight className="h-5 w-5 md:h-6 md:w-6 text-white group-hover:scale-110 transition-transform" />
          </button>

          {/* Indicateurs du carousel */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentSlide
                    ? 'bg-white w-8'
                    : 'bg-white/30 w-3 hover:bg-white/50'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Points forts - Badges */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={controls.hero}
          className="container mx-auto px-4 md:px-6 lg:px-8 -mt-8 md:-mt-12 relative z-10"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[
              { icon: <ShieldCheck className="h-6 w-6" />, title: "Données sécurisées", desc: "Chiffrement de bout en bout", color: "from-blue-500 to-cyan-500" },
              { icon: <QrCode className="h-6 w-6" />, title: "Accès QR", desc: "Partage instantané", color: "from-indigo-500 to-blue-500" },
              { icon: <Clock className="h-6 w-6" />, title: "Disponible 24/7", desc: "Accès permanent à vos données", color: "from-green-500 to-emerald-500" },
              { icon: <Award className="h-6 w-6" />, title: "Certifié", desc: "Normes médicales internationales", color: "from-purple-500 to-pink-500" }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="bg-white rounded-xl shadow-lg p-5 md:p-6 hover:shadow-xl transition-all duration-300"
              >
                <div className={`inline-flex p-3 rounded-lg bg-gradient-to-r ${item.color} mb-4`}>
                  <div className="text-white">{item.icon}</div>
                </div>
                <h3 className="font-bold text-lg md:text-xl mb-2 text-blue-900">{item.title}</h3>
                <p className="text-blue-600 text-sm md:text-base">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* FONCTIONNALITÉS */}
      <section id="features" className="py-16 md:py-24 bg-gradient-to-b from-white to-blue-50" ref={featuresRef}>
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={controls.features}
            className="text-center mb-12 md:mb-16"
          >
            <span className="inline-block px-4 py-2 bg-blue-100 text-blue-600 rounded-full font-semibold text-sm mb-4">
              Fonctionnalités
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-blue-900">
              Tout ce dont vous avez besoin
            </h2>
            <p className="text-lg md:text-xl text-blue-600 max-w-2xl mx-auto">
              Une plateforme complète pensée pour le système de santé africain
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="group bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
              >
                <div className="p-6 md:p-8">
                  <div className={`inline-flex p-3 rounded-lg bg-gradient-to-r ${feature.color} mb-4`}>
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-bold text-xl md:text-2xl mb-3 text-blue-900">{feature.title}</h3>
                  <p className="text-blue-600 text-base">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICES COMPLÉMENTAIRES */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-blue-900 to-blue-800 text-white">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={controls.features}
            className="text-center mb-12 md:mb-16"
          >
            <span className="inline-block px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full font-semibold text-sm mb-4">
              Services exclusifs
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Plus qu'une application, un partenaire santé
            </h2>
            <p className="text-lg md:text-xl text-blue-200 max-w-2xl mx-auto">
              Des services innovants pour prendre soin de votre santé au quotidien
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {services.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-300"
              >
                <div className={`inline-flex p-4 rounded-lg ${service.color} mb-6`}>
                  {service.icon}
                </div>
                <h3 className="text-xl md:text-2xl font-bold mb-4">{service.title}</h3>
                <p className="text-blue-200 text-base mb-6">{service.description}</p>
                <button className="flex items-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="mr-2 text-sm font-medium">En savoir plus</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AUDIENCE */}
      <section id="audience" className="py-16 md:py-24 bg-gradient-to-b from-blue-50 to-white" ref={audienceRef}>
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={controls.audience}
            className="text-center mb-12 md:mb-16"
          >
            <span className="inline-block px-4 py-2 bg-blue-100 text-blue-600 rounded-full font-semibold text-sm mb-4">
              Pour qui ?
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-blue-900">
              Une solution adaptée à tous
            </h2>
            <p className="text-lg md:text-xl text-blue-600 max-w-2xl mx-auto">
              Que vous soyez patient, médecin ou administrateur, MediCare BJ vous accompagne
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {audiences.map((audience, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="group bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
              >
                <div className={`bg-gradient-to-r ${audience.color} p-6 text-white`}>
                  {audience.icon}
                  <h3 className="text-2xl font-bold mt-4">{audience.title}</h3>
                </div>
                <div className="p-6">
                  <p className="text-blue-600 text-base">{audience.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* STATISTIQUES */}
      <section id="stats" className="py-16 md:py-24 bg-gradient-to-br from-blue-800 to-blue-600 text-white" ref={statsRef}>
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={controls.stats}
            className="text-center mb-12 md:mb-16"
          >
            <span className="inline-block px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full font-semibold text-sm mb-4">
              Chiffres clés
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              MediCare BJ en quelques chiffres
            </h2>
            <p className="text-lg md:text-xl text-blue-200 max-w-2xl mx-auto">
              Notre impact sur le système de santé béninois
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className="text-center"
              >
                <div className="inline-flex p-4 bg-white/10 rounded-full mb-4">
                  {stat.icon}
                </div>
                <p className="text-4xl md:text-5xl font-bold mb-2">{stat.value}</p>
                <p className="text-blue-200 text-base">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="py-16 md:py-24 bg-gradient-to-br from-blue-50 to-cyan-50" ref={contactRef}>
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={controls.contact}
            className="max-w-6xl mx-auto"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Informations de contact */}
              <div>
                <span className="inline-block px-4 py-2 bg-blue-100 text-blue-600 rounded-full font-semibold text-sm mb-4">
                  Contactez-nous
                </span>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-blue-900">
                  Nous sommes à votre écoute
                </h2>
                <p className="text-lg md:text-xl text-blue-600 mb-12">
                  Notre équipe est à votre disposition pour répondre à toutes vos questions
                </p>

                <div className="space-y-8">
                  {[
                    { 
                      icon: <Phone className="h-6 w-6" />, 
                      title: "Téléphone", 
                      detail: "+229 01 56 16 98 13", 
                      action: "Appeler maintenant",
                      link: "tel:2290156169813"
                    },
                    { 
                      icon: <Mail className="h-6 w-6" />, 
                      title: "Email", 
                      detail: "contact@medicarebj.com", 
                      action: "Envoyer un email",
                      link: "mailto:contact@medicarebj.com"
                    },
                    { 
                      icon: <MapPin className="h-6 w-6" />, 
                      title: "Adresse", 
                      detail: "Cotonou, Bénin", 
                      action: "Voir sur la carte",
                      link: "#"
                    }
                  ].map((item, index) => (
                    <div key={index} className="flex items-start space-x-4">
                      <div className="p-3 bg-white rounded-xl shadow-lg">
                        <div className="text-blue-600">{item.icon}</div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-2 text-blue-900">{item.title}</h3>
                        <p className="text-blue-700 text-base mb-2">{item.detail}</p>
                        <a 
                          href={item.link}
                          className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                        >
                          {item.action} →
                        </a>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Réseaux sociaux */}
                <div className="mt-12">
                  <h3 className="font-bold text-xl mb-6 text-blue-900">Suivez-nous</h3>
                  <div className="flex space-x-4">
                    <a
                      href="#"
                      className="p-3 bg-white rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                    >
                      <Facebook className="h-6 w-6 text-blue-600" />
                    </a>
                    <a
                      href="#"
                      className="p-3 bg-white rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                    >
                      <Twitter className="h-6 w-6 text-sky-500" />
                    </a>
                    <a
                      href="#"
                      className="p-3 bg-white rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                    >
                      <Instagram className="h-6 w-6 text-pink-500" />
                    </a>
                    <a
                      href="https://wa.me/2290156169813"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 bg-white rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                    >
                      <svg className="h-6 w-6 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.76.982.998-3.675-.236-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.826 9.826 0 012.9 6.994c-.004 5.45-4.438 9.88-9.888 9.88m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.333.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.333 11.893-11.893 0-3.18-1.24-6.162-3.495-8.411"/>
                      </svg>
                    </a>
                  </div>
                </div>
              </div>

              {/* Formulaire de contact */}
              <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8">
                <h3 className="text-2xl font-bold mb-6 text-blue-900">Envoyez-nous un message</h3>
                <form className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-blue-700 mb-2">Nom complet</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Votre nom"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-blue-700 mb-2">Email</label>
                      <input
                        type="email"
                        className="w-full px-4 py-3 rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="votre@email.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-2">Téléphone</label>
                    <input
                      type="tel"
                      className="w-full px-4 py-3 rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="+229 XX XX XX XX"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-2">Sujet</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Objet de votre message"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-2">Message</label>
                    <textarea
                      rows={4}
                      className="w-full px-4 py-3 rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Votre message..."
                    />
                  </div>
                  <button 
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-xl text-lg font-semibold hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
                  >
                    Envoyer le message
                  </button>
                </form>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-blue-200 bg-white py-8">
        <div className="container mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 text-sm text-blue-600 sm:flex-row lg:px-10">
          <Logo size="sm" />
          <p>© 2025 MediCare BJ · Tous droits réservés · Cotonou, Bénin</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;