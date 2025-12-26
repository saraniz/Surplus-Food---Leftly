"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronDown,
  Shield,
  Clock,
  DollarSign,
  Heart,
  RefreshCw,
  Mail,
  Phone
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { alconica, lora } from "../libs/fonts";
import { useState } from "react";

export default function FAQPage() {
  const [openItems, setOpenItems] = useState<number[]>([]);

  const toggleItem = (index: number) => {
    setOpenItems(prev => 
      prev.includes(index) 
        ? prev.filter(item => item !== index)
        : [...prev, index]
    );
  };

  const faqs = [
    {
      category: "Food Quality & Safety",
      icon: Shield,
      color: "text-emerald-600 bg-emerald-50",
      questions: [
        {
          q: "Do you sell expired food?",
          a: "Absolutely not. We partner with restaurants to sell their surplus fresh food - meals prepared that day that would otherwise go to waste. All food meets strict quality standards and is within safe consumption periods."
        },
        {
          q: "How is food quality ensured?",
          a: "Partner restaurants follow our guidelines: daily preparation, proper storage, clear labeling, and regular quality checks. We never accept expired or unsafe food."
        }
      ]
    },
    {
      category: "Pricing & Orders",
      icon: DollarSign,
      color: "text-amber-600 bg-amber-50",
      questions: [
        {
          q: "Why are prices so much lower?",
          a: "Restaurants offer discounts on surplus food to prevent waste. You get the same quality food at reduced prices because it's food that would otherwise be discarded at closing time."
        },
        {
          q: "Can I customize my order?",
          a: "Since these are ready-to-eat surplus meals, customization may be limited. Check each restaurant's page for available options."
        }
      ]
    },
    {
      category: "Order Process",
      icon: Clock,
      color: "text-blue-600 bg-blue-50",
      questions: [
        {
          q: "When is food available?",
          a: "Most restaurants list surplus food in the afternoon/evening for same-day pickup. Availability varies - order early for best selection."
        },
        {
          q: "How does pickup work?",
          a: "Browse meals, place order, choose pickup time (usually evening slots), and collect your order. Some restaurants also offer delivery."
        }
      ]
    },
    {
      category: "Our Mission",
      icon: Heart,
      color: "text-rose-600 bg-rose-50",
      questions: [
        {
          q: "What's the environmental impact?",
          a: "Every meal saved prevents waste and reduces carbon emissions. Together with our community, we've saved thousands of meals from landfills."
        },
        {
          q: "How can restaurants join?",
          a: "Email partners@leftly.com. We'll guide you through the simple setup process - it's free to join and reduces your food waste."
        }
      ]
    }
  ];

  const contactOptions = [
    {
      icon: Mail,
      title: "Email Support",
      detail: "support@leftly.com",
      description: "We respond within 24 hours"
    },
    {
      icon: Phone,
      title: "Call Us",
      detail: "+1 (555) 123-4567",
      description: "Mon-Fri, 9AM-6PM EST"
    }
  ];

  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      
      {/* Elegant Hero Section with Color */}
      <section className="relative overflow-hidden pt-32 pb-24 px-6 bg-gradient-to-br from-[#437057] via-[#3a654d] to-[#2a4839]">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-white rounded-full" />
          <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-white rounded-full" />
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute top-10 left-10 w-4 h-4 bg-[#a2b79a] rounded-full opacity-30" />
        <div className="absolute top-20 right-20 w-6 h-6 bg-[#a2b79a] rounded-full opacity-30" />
        <div className="absolute bottom-20 left-1/3 w-8 h-8 bg-[#728c69] rounded-full opacity-20" />
        
        <div className="relative z-10 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="text-center"
          >
            <div className="mb-8">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="inline-block mb-8"
              >
                <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20 mx-auto">
                  <Shield className="w-8 h-8 text-white" />
                </div>
              </motion.div>
              
              <h1 className={`${alconica.className} text-5xl md:text-7xl text-white mb-6 leading-tight tracking-tight`}>
                Frequently Asked Questions
              </h1>
              
              <div className="w-32 h-1 bg-gradient-to-r from-[#a2b79a] via-white to-[#728c69] mx-auto mb-8 rounded-full" />
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className={`${lora.className} text-white/90 text-lg max-w-2xl mx-auto leading-relaxed`}
              >
                Clear answers to your questions about surplus food, quality, and our mission
              </motion.p>
            </div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center mt-12"
            >
              <button
                onClick={() => document.getElementById('faq-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-6 py-3 bg-white text-[#437057] rounded-lg font-medium text-sm hover:bg-gray-100 transition-colors shadow-lg hover:shadow-xl"
              >
                Browse Questions
              </button>
              <button
                onClick={() => window.location.href = '/contact'}
                className="px-6 py-3 bg-transparent border border-white text-white rounded-lg font-medium text-sm hover:bg-white/10 transition-colors"
              >
                Contact Support
              </button>
            </motion.div>
          </motion.div>
        </div>
        
        {/* Scroll Indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <ChevronDown className="w-6 h-6 text-white/70" />
        </motion.div>
      </section>

      {/* Main FAQ Section */}
      <section id="faq-section" className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className={`${alconica.className} text-3xl md:text-4xl text-gray-800 mb-4`}>
              Common Questions Answered
            </h2>
            <p className={`${lora.className} text-gray-600 text-sm max-w-xl mx-auto`}>
              Find quick answers to the most frequently asked questions about our service
            </p>
          </motion.div>
          
          {/* FAQ Grid */}
          <div className="grid md:grid-cols-2 gap-8">
            {faqs.map((category, catIndex) => (
              <motion.div
                key={catIndex}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: catIndex * 0.2 }}
                className="space-y-6"
              >
                {/* Category Header */}
                <div className="flex items-center gap-4 mb-2">
                  <div className={`p-3 rounded-full ${category.color}`}>
                    <category.icon className="w-5 h-5" />
                  </div>
                  <h2 className={`${alconica.className} text-2xl text-gray-800`}>
                    {category.category}
                  </h2>
                </div>
                
                {/* Questions */}
                <div className="space-y-4">
                  {category.questions.map((faq, qIndex) => {
                    const globalIndex = catIndex * 10 + qIndex;
                    return (
                      <div
                        key={qIndex}
                        className="group"
                      >
                        <button
                          onClick={() => toggleItem(globalIndex)}
                          className="w-full text-left"
                        >
                          <div className="flex items-start justify-between gap-4 py-5 border-b border-gray-200 group-hover:border-gray-300 transition-colors">
                            <div className="flex-1">
                              <h3 className={`${lora.className} text-gray-800 font-medium text-base mb-2 leading-relaxed`}>
                                {faq.q}
                              </h3>
                              <AnimatePresence>
                                {openItems.includes(globalIndex) && (
                                  <motion.p
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className={`${lora.className} text-gray-600 text-sm leading-relaxed overflow-hidden`}
                                  >
                                    {faq.a}
                                  </motion.p>
                                )}
                              </AnimatePresence>
                            </div>
                            <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform mt-1 ${
                              openItems.includes(globalIndex) ? "rotate-180" : ""
                            }`} />
                          </div>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 px-6 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="bg-white rounded-2xl p-12 shadow-lg border border-gray-100"
          >
            <div className="text-center mb-12">
              <div className="w-16 h-16 bg-gradient-to-br from-[#437057] to-[#2a4839] rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail className="w-8 h-8 text-white" />
              </div>
              <h2 className={`${alconica.className} text-3xl text-gray-800 mb-4`}>
                Still Have Questions?
              </h2>
              <p className={`${lora.className} text-gray-600 text-sm max-w-lg mx-auto`}>
                Our team is here to help you with any other questions you might have.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
              {contactOptions.map((option, index) => (
                <motion.div
                  key={index}
                  whileHover={{ y: -5 }}
                  className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-gradient-to-br from-[#437057] to-[#2a4839] rounded-lg">
                      <option.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className={`${lora.className} text-gray-800 font-medium mb-2`}>
                        {option.title}
                      </h3>
                      <p className={`${lora.className} text-[#437057] font-medium text-sm mb-1`}>
                        {option.detail}
                      </p>
                      <p className={`${lora.className} text-gray-500 text-xs`}>
                        {option.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            
            <div className="text-center mt-10">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-3 bg-gradient-to-r from-[#437057] to-[#2a4839] text-white rounded-lg font-medium text-sm hover:shadow-md transition-all shadow-lg"
                onClick={() => window.location.href = '/contact'}
              >
                Contact Support
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-[#a2b79a] to-[#728c69] rounded-full flex items-center justify-center shadow-lg">
              <RefreshCw className="w-8 h-8 text-white" />
            </div>
            
            <h2 className={`${alconica.className} text-3xl text-gray-800 mb-4`}>
              Ready to Make a Difference?
            </h2>
            <p className={`${lora.className} text-gray-600 text-sm mb-10 max-w-xl mx-auto leading-relaxed`}>
              Join our community in fighting food waste while enjoying delicious meals at great prices.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-3 bg-gradient-to-r from-[#437057] to-[#2a4839] text-white rounded-lg font-medium text-sm hover:shadow-md transition-all shadow-lg"
                onClick={() => window.location.href = '/'}
              >
                Browse Restaurants
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-3 border border-[#437057] text-[#437057] rounded-lg font-medium text-sm hover:bg-[#437057]/5 transition-colors"
                onClick={() => window.location.href = '/about'}
              >
                Learn About Our Mission
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  );
}