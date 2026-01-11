"use client"

import type React from "react"

import { useState } from "react"

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  })
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitted(true)
    setFormData({ name: "", email: "", message: "" })
    setTimeout(() => setSubmitted(false), 5000)
  }

  return (
    <main className="min-h-screen bg-background py-16 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Page Title Section */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-3">Contact Support</h1>
          <p className="text-lg text-muted-foreground">
            Have questions or need help? Reach out to our support team. We're here to help and typically respond within
            24 hours.
          </p>
        </div>

        {/* Contact Information */}
        <div className="mb-12 p-6 bg-card border border-border rounded-lg">
          <h2 className="text-xl font-semibold text-foreground mb-3">Get in Touch</h2>
          <p className="text-foreground mb-2">
            Email us at{" "}
            <a href="mailto:support@pakpay.com" className="text-emerald-600 hover:text-emerald-700 font-medium">
              support@pakpay.com
            </a>
          </p>
          <p className="text-sm text-muted-foreground">We aim to respond to all inquiries within 24 business hours.</p>
        </div>

        {/* Contact Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <h2 className="text-xl font-semibold text-foreground">Send us a Message</h2>

          {/* Name Field */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Your name"
            />
          </div>

          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="your.email@example.com"
            />
          </div>

          {/* Message Field */}
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              rows={6}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              placeholder="Tell us how we can help..."
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-2 px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors duration-200"
          >
            Send Message
          </button>

          {/* Success Message */}
          {submitted && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <p className="text-sm text-emerald-800">Thank you for your message! We'll get back to you soon.</p>
            </div>
          )}
        </form>
      </div>
    </main>
  )
}
