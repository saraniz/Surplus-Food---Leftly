"use client";

import { motion } from "framer-motion";
import { 
  Heart, 
  Leaf, 
  Users, 
  Target, 
  Globe, 
  Shield,
  Award,
  Truck
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { alconica, lora } from "../libs/fonts";

export default function AboutUs() {
  const stats = [
    { number: "10K+", label: "Meals Saved", icon: Leaf },
    { number: "500+", label: "Partner Restaurants", icon: Users },
    { number: "50+", label: "Cities Covered", icon: Globe },
    { number: "95%", label: "Customer Satisfaction", icon: Award },
  ];

  const values = [
    {
      icon: Leaf,
      title: "Sustainability First",
      description: "We're committed to reducing food waste and promoting sustainable consumption habits.",
      color: "from-green-500 to-emerald-600"
    },
    {
      icon: Heart,
      title: "Community Impact",
      description: "Connecting surplus food with people who need it most, creating positive social impact.",
      color: "from-rose-500 to-pink-600"
    },
    {
      icon: Shield,
      title: "Quality Assurance",
      description: "Every meal is quality-checked to ensure freshness and safety standards.",
      color: "from-blue-500 to-cyan-600"
    },
    {
      icon: Target,
      title: "Zero Waste Mission",
      description: "Working towards a future where no edible food goes to waste.",
      color: "from-purple-500 to-violet-600"
    },
  ];

  const team = [
    {
      name: "Alex Chen",
      role: "CEO & Founder",
      bio: "Former restaurant owner passionate about reducing food waste.",
      image: "/team/alex.jpg"
    },
    {
      name: "Maria Rodriguez",
      role: "Head of Operations",
      bio: "10+ years in food industry logistics and supply chain.",
      image: "/team/maria.jpg"
    },
    {
      name: "James Wilson",
      role: "Tech Lead",
      bio: "Building platforms that connect communities sustainably.",
      image: "/team/james.jpg"
    },
    {
      name: "Sarah Johnson",
      role: "Community Manager",
      bio: "Creating partnerships and spreading awareness about food waste.",
      image: "/team/sarah.jpg"
    },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-[#437057] to-[#2a4839] pt-24 pb-20 px-6 md:px-24">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#a2b79a] rounded-full opacity-20 -translate-y-32 translate-x-32" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#728c69] rounded-full opacity-10 -translate-x-64 translate-y-64" />
        
        <div className="relative z-10 max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className={`${alconica.className} text-4xl md:text-6xl text-white mb-6`}>
              Our Story, Our Mission
            </h1>
            <p className={`${lora.className} text-xl text-white/90 max-w-3xl mx-auto`}>
              We're on a mission to transform the way we think about food waste, 
              one delicious meal at a time.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-6 md:px-24">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="mb-4">
                  <stat.icon className="w-12 h-12 text-[#437057] mx-auto" />
                </div>
                <div className={`${alconica.className} text-3xl md:text-4xl text-gray-800 mb-2`}>
                  {stat.number}
                </div>
                <div className={`${lora.className} text-gray-600`}>
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-20 px-6 md:px-24 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h2 className={`${alconica.className} text-3xl md:text-4xl text-gray-800 mb-6`}>
                How It All Began
              </h2>
              <div className="space-y-4">
                <p className={`${lora.className} text-gray-600`}>
                  Founded in 2025, our journey began with a simple but powerful idea: in Sri Lanka, 
                  while many people struggle to access affordable meals, large amounts of perfectly good food are wasted every day. 
                  We set out to change that.
                </p>
                <p className={`${lora.className} text-gray-600`}>
                  Our platform is a practical solution to reduce food waste by connecting restaurants, cafés, and food providers with people who value good food at fair prices. What started as a small local initiative has grown into a 
                  nationwide effort to make surplus food accessible instead of disposable.
                </p>
                <p className={`${lora.className} text-gray-600`}>
                 Today, we work with restaurants, cafés, and food businesses across Sri Lanka to ensure surplus food is safely shared, not thrown away. By choosing surplus food, our community helps reduce waste, 
                 save money, and support a more sustainable future for everyone.
                </p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="aspect-square rounded-3xl overflow-hidden shadow-2xl">
                <img 
                  src="/about-hero.jpg" 
                  alt="Our team working together"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=1000&q=80";
                  }}
                />
              </div>
              <div className="absolute -bottom-6 -right-6 w-48 h-48 bg-[#a2b79a] rounded-3xl -z-10" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Our Values Section */}
      <section className="py-20 px-6 md:px-24 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className={`${alconica.className} text-3xl md:text-4xl text-gray-800 mb-4`}>
              Our Core Values
            </h2>
            <p className={`${lora.className} text-gray-600 max-w-2xl mx-auto`}>
              These principles guide everything we do, from partnerships to 
              platform development.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group"
              >
                <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 h-full">
                  <div className={`mb-6 p-4 rounded-xl bg-gradient-to-br ${value.color} w-fit`}>
                    <value.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className={`${alconica.className} text-xl text-gray-800 mb-4`}>
                    {value.title}
                  </h3>
                  <p className={`${lora.className} text-gray-600`}>
                    {value.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How We Work Section */}
      <section className="py-20 px-6 md:px-24 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className={`${alconica.className} text-3xl md:text-4xl text-gray-800 mb-4`}>
              How We Make It Work
            </h2>
            <p className={`${lora.className} text-gray-600 max-w-2xl mx-auto`}>
              A simple, efficient process that benefits everyone involved.
            </p>
          </motion.div>

          <div className="relative">
            {/* Connection lines */}
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 -translate-y-1/2" />
            
            <div className="grid md:grid-cols-4 gap-8 relative">
              {[
                {
                  step: "01",
                  title: "Restaurants List",
                  description: "Partners list surplus meals on our platform",
                  icon: Leaf
                },
                {
                  step: "02",
                  title: "Customers Discover",
                  description: "Users browse and order quality meals at discounted prices",
                  icon: Users
                },
                {
                  step: "03",
                  title: "Secure Payment",
                  description: "Easy, secure transactions through our platform",
                  icon: Shield
                },
                {
                  step: "04",
                  title: "Enjoy & Save",
                  description: "Pick up delicious meals and help reduce waste",
                  icon: Truck
                },
              ].map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="text-center relative"
                >
                  <div className="bg-white border-4 border-[#a2b79a] w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 relative z-10">
                    <span className={`${alconica.className} text-2xl text-[#437057]`}>
                      {step.step}
                    </span>
                  </div>
                  <div className="bg-white p-6 rounded-2xl shadow-lg">
                    <step.icon className="w-12 h-12 text-[#437057] mx-auto mb-4" />
                    <h3 className={`${alconica.className} text-xl text-gray-800 mb-3`}>
                      {step.title}
                    </h3>
                    <p className={`${lora.className} text-gray-600 text-sm`}>
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>


      {/* CTA Section */}
      {/* <section className="py-20 px-6 md:px-24 bg-gradient-to-r from-[#437057] to-[#2a4839]">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className={`${alconica.className} text-3xl md:text-4xl text-white mb-6`}>
              Join Our Movement
            </h2>
            <p className={`${lora.className} text-white/90 text-lg mb-10 max-w-2xl mx-auto`}>
              Whether you're a restaurant looking to reduce waste or a food 
              lover wanting to make a difference, there's a place for you here.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3 bg-white text-[#437057] rounded-full font-semibold hover:bg-gray-100 transition-colors"
              >
                Partner With Us
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3 border-2 border-white text-white rounded-full font-semibold hover:bg-white/10 transition-colors"
              >
                Browse Restaurants
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section> */}

      <Footer />
    </main>
  );
}