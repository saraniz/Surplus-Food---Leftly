"use client";

import { motion } from "framer-motion";
import { 
  Mail, 
  Phone, 
  Clock,
  Send,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { alconica, lora } from "../libs/fonts";
import { useState } from "react";

export default function ContactUs() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");

  const contactInfo = [
    {
      icon: Mail,
      title: "Email Us",
      details: ["support@surplusfood.com", "partners@surplusfood.com"],
      description: "We'll respond within 24 hours"
    },
    {
      icon: Phone,
      title: "Call Us",
      details: ["+1 (555) 123-4567", "+1 (555) 987-6543"],
      description: "Mon-Fri, 9AM-6PM EST"
    },
    {
      icon: Clock,
      title: "Support Hours",
      details: ["Monday - Friday: 9AM-6PM", "Saturday: 10AM-4PM"],
      description: "Closed on Sundays"
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Here you would make an actual API call:
      // const response = await fetch('/api/contact', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData)
      // });
      
      setSubmitStatus("success");
      setFormData({ name: "", email: "", subject: "", message: "" });
      
      // Reset status after 5 seconds
      setTimeout(() => setSubmitStatus("idle"), 5000);
    } catch (error) {
      setSubmitStatus("error");
      setTimeout(() => setSubmitStatus("idle"), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-[#437057] to-[#2a4839] pt-24 pb-20 px-6 md:px-24">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#a2b79a] rounded-full opacity-20 -translate-y-48" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-[#728c69] rounded-full opacity-10 translate-y-32" />
        
        <div className="relative z-10 max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className={`${alconica.className} text-4xl md:text-6xl text-white mb-6`}>
              Get In Touch
            </h1>
            <p className={`${lora.className} text-xl text-white/90 max-w-3xl mx-auto`}>
              Have questions about food waste solutions? We're here to help restaurants, 
              customers, and communities connect for a sustainable future.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Cards Grid */}
      <section className="py-16 px-6 md:px-24">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            {contactInfo.map((info, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group"
              >
                <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 h-full border border-gray-100 text-center">
                  <div className="mb-6 p-4 bg-gradient-to-br from-[#a2b79a] to-[#728c69] rounded-xl w-fit mx-auto">
                    <info.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className={`${alconica.className} text-2xl text-gray-800 mb-4`}>
                    {info.title}
                  </h3>
                  <div className="space-y-3 mb-4">
                    {info.details.map((detail, i) => (
                      <p key={i} className={`${lora.className} text-gray-700 font-medium text-lg`}>
                        {detail}
                      </p>
                    ))}
                  </div>
                  <p className={`${lora.className} text-gray-500`}>
                    {info.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="py-16 px-6 md:px-24 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="bg-white rounded-3xl shadow-xl p-8 md:p-12"
          >
            <div className="mb-12 text-center">
              <h2 className={`${alconica.className} text-4xl md:text-5xl text-gray-800 mb-6`}>
                Send Us a Message
              </h2>
              <p className={`${lora.className} text-gray-600 text-lg max-w-2xl mx-auto`}>
                Fill out the form below and our team will get back to you as soon as possible.
              </p>
            </div>

            {/* Status Messages */}
            {submitStatus === "success" && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 p-6 bg-green-50 border border-green-200 rounded-xl flex items-center gap-4"
              >
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                <div>
                  <p className={`${lora.className} text-green-800 font-semibold mb-1`}>
                    Message Sent Successfully!
                  </p>
                  <p className={`${lora.className} text-green-700`}>
                    Thank you for contacting us. We'll get back to you within 24 hours.
                  </p>
                </div>
              </motion.div>
            )}

            {submitStatus === "error" && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 p-6 bg-red-50 border border-red-200 rounded-xl flex items-center gap-4"
              >
                <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                <div>
                  <p className={`${lora.className} text-red-800 font-semibold mb-1`}>
                    Something Went Wrong
                  </p>
                  <p className={`${lora.className} text-red-700`}>
                    Please try again or contact us directly via email or phone.
                  </p>
                </div>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <label className={`${lora.className} block text-gray-700 mb-3 font-medium text-lg`}>
                      Your Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-6 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#437057] focus:border-transparent transition-all text-lg"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className={`${lora.className} block text-gray-700 mb-3 font-medium text-lg`}>
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-6 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#437057] focus:border-transparent transition-all text-lg"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <label className={`${lora.className} block text-gray-700 mb-3 font-medium text-lg`}>
                      Subject *
                    </label>
                    <select
                      title="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="w-full px-6 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#437057] focus:border-transparent transition-all appearance-none bg-white text-lg"
                    >
                      <option value="">Select a topic</option>
                      <option value="partnership">Restaurant Partnership</option>
                      <option value="support">Customer Support</option>
                      <option value="feedback">Feedback & Suggestions</option>
                      <option value="press">Press & Media</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className={`${lora.className} block text-gray-700 mb-3 font-medium text-lg`}>
                  Your Message *
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={7}
                  className="w-full px-6 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#437057] focus:border-transparent transition-all resize-none text-lg"
                  placeholder="Tell us how we can help you reduce food waste or any questions you might have..."
                />
              </div>

              <div className="flex justify-center pt-8">
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-16 py-5 bg-gradient-to-r from-[#437057] to-[#2a4839] text-white rounded-xl font-semibold text-lg flex items-center justify-center gap-4 transition-all hover:shadow-lg min-w-[240px] ${
                    isSubmitting ? "opacity-75 cursor-not-allowed" : ""
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sending Message...
                    </>
                  ) : (
                    <>
                      <Send className="w-6 h-6" />
                      Send Message
                    </>
                  )}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-20 px-6 md:px-24">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="bg-gradient-to-r from-[#437057] to-[#2a4839] rounded-3xl p-12 text-center"
          >
            <h2 className={`${alconica.className} text-3xl md:text-4xl text-white mb-6`}>
              Stay Connected
            </h2>
            <p className={`${lora.className} text-white/90 text-lg mb-8 max-w-3xl mx-auto`}>
              Subscribe to our newsletter for tips on reducing food waste, 
              exclusive restaurant deals, and community initiatives.
            </p>
            
            <form className="max-w-md mx-auto flex flex-col sm:flex-row gap-4">
              <input
                type="email"
                placeholder="Your email address"
                className="flex-1 px-6 py-4 rounded-full border-0 focus:outline-none focus:ring-2 focus:ring-white text-lg"
              />
              <motion.button
                type="submit"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-10 py-4 bg-white text-[#437057] rounded-full font-semibold text-lg hover:bg-gray-100 transition-colors"
              >
                Subscribe
              </motion.button>
            </form>
            
            <p className={`${lora.className} text-white/70 text-sm mt-8`}>
              No spam ever. Unsubscribe anytime.
            </p>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  );
}