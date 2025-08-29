// src/components/Footer.jsx

import React from "react";
import { Twitter, Github, Linkedin } from "lucide-react";

const Footer = () => {
  const linkSections = [
    {
      title: "Product",
      links: ["Features", "Pricing", "Integrations", "API"],
    },
    {
      title: "Company",
      links: ["About Us", "Careers", "Blog", "Contact Us"],
    },
    {
      title: "Legal",
      links: ["Privacy Policy", "Terms of Service", "Cookie Policy"],
    },
  ];

  const socialLinks = [
    { icon: <Twitter size={20} />, href: "#" },
    { icon: <Github size={20} />, href: "#" },
    { icon: <Linkedin size={20} />, href: "#" },
  ];

  return (
    <footer className="bg-black text-neutral-400">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info & Socials */}
          <div className="md:col-span-1">
            <h2 className="text-md font-bold text-white mb-2"><img className="w-28" src="/logo.svg" alt="Brainly" /></h2>
            <p className="text-sm mb-4">
              Making information accessible and actionable.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  className="hover:text-white transition-colors duration-300"
                  aria-label={`Follow us on ${social.icon.type.displayName}`}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Link Sections */}
          <div className="md:col-span-3 grid grid-cols-2 md:grid-cols-3 gap-8">
            {linkSections.map((section) => (
              <div key={section.title}>
                <h3 className="font-semibold text-white mb-4">
                  {section.title}
                </h3>
                <ul className="space-y-3">
                  {section.links.map((link) => (
                    <li key={link}>
                      <a
                        href="#"
                        className="hover:text-white transition-colors duration-300"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-neutral-800 text-center text-sm">
          <p>
            &copy; {new Date().getFullYear()} Brainly, Inc. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
