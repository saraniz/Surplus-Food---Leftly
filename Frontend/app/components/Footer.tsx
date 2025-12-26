
import { Leaf, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from "lucide-react"
import { motion } from "framer-motion"
import { alconica } from "../libs/fonts"



export default function Footer(){
    return(
        <footer className="bg-[#1C352D] border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand Column */}
          <div className="space-y-4">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center space-x-3"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-white blur-lg opacity-20 rounded-full"></div>
                <div className="relative bg-white/90 w-9 h-9 rounded-full flex items-center justify-center shadow-md">
                  <span className={`${alconica.className} text-[#437057] text-lg font-bold`}>L</span>
                </div>
              </div>
              <div className={`${alconica.className} text-white text-xl font-bold tracking-tight drop-shadow-md`}>
                Leftly
                <span className="text-white/80">.</span>
              </div>
            </motion.div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Reducing food waste, one meal at a time. Connect with local businesses to rescue surplus food and make a
              positive impact on our planet.
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>hello@letly.com</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4" />
                <span>+94 781855698</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>Sri Lanka, Colombo</span>
              </div>
            </div>
          </div>

          {/* Navigation Column */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Quick Links</h3>
            <nav className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <a href="/aboutus" className="text-muted-foreground hover:text-accent transition-colors text-sm">
                  About Us
                </a>
                <a href="/howitworks" className="text-muted-foreground hover:text-accent transition-colors text-sm">
                  How It Works
                </a>
                {/* <a href="/businesses" className="text-muted-foreground hover:text-accent transition-colors text-sm">
                  For Businesses
                </a> */}
                <a href="/faq" className="text-muted-foreground hover:text-accent transition-colors text-sm">
                  FAQs
                </a>
                <a href="/support" className="text-muted-foreground hover:text-accent transition-colors text-sm">
                  Support
                </a>
                <a href="/contactus" className="text-muted-foreground hover:text-accent transition-colors text-sm">
                  Contact
                </a>
                {/* <a href="/support" className="text-muted-foreground hover:text-accent transition-colors text-sm">
                  Support
                </a> */}
              </div>
            </nav>
          </div>

          {/* Newsletter & Social Column */}
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Stay Updated</h3>
              <p className="text-sm text-muted-foreground">
                Get the latest updates on surplus food deals and sustainability tips.
              </p>
              {/* <div className="flex space-x-2">
                <Input type="email" placeholder="Enter your email" className="flex-1" />
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">Subscribe</Button>
              </div> */}
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-foreground">Follow Us</h4>
              <div className="flex space-x-4">
                <a href="#" className="text-muted-foreground hover:text-accent transition-colors" aria-label="Facebook">
                  <Facebook className="h-5 w-5" />
                </a>
                <a href="#" className="text-muted-foreground hover:text-accent transition-colors" aria-label="Twitter">
                  <Twitter className="h-5 w-5" />
                </a>
                <a
                  href="#"
                  className="text-muted-foreground hover:text-accent transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="h-5 w-5" />
                </a>
                <a href="#" className="text-muted-foreground hover:text-accent transition-colors" aria-label="LinkedIn">
                  <Linkedin className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-12 pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-muted-foreground">© 2024 leftly. All rights reserved.</div>
            <div className="flex space-x-6 text-sm">
              <a href="/privacy" className="text-muted-foreground hover:text-accent transition-colors">
                Privacy Policy
              </a>
              <a href="/terms" className="text-muted-foreground hover:text-accent transition-colors">
                Terms of Service
              </a>
              <a href="/cookies" className="text-muted-foreground hover:text-accent transition-colors">
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
    )

    
}