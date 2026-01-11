export default function PrivacyPolicy() {
  return (
    <main className="w-full bg-white">
      <div className="max-w-3xl mx-auto px-6 py-12 md:py-16 lg:py-20">
        {/* Title Block */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-sm text-gray-500">Last updated: October 26, 2023</p>
        </div>

        {/* Main Content Section */}
        <div className="space-y-10">
          {/* Section 1: Introduction */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-base text-gray-600 leading-relaxed">
              Welcome to PakPay. We are committed to protecting your personal information and your right to privacy. If
              you have any questions or concerns about our policy, or our practices with regards to your personal
              information, please contact us at{" "}
              <a href="mailto:privacy@pakpay.com" className="text-emerald-500 hover:underline">
                privacy@pakpay.com
              </a>
              . When you use our services, you trust us with your personal information. We take your privacy very
              seriously. In this privacy policy, we seek to explain to you in the clearest way possible what information
              we collect, how we use it and what rights you have in relation to it.
            </p>
          </section>

          {/* Section 2: Information Collection and Use */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Information Collection and Use</h2>
            <p className="text-base text-gray-600 leading-relaxed mb-4">
              We collect personal information that you voluntarily provide to us when you register on the services,
              express an interest in obtaining information about us or our products and services, when you participate
              in activities on the services or otherwise when you contact us. The personal information that we collect
              depends on the context of your interactions with us and the services, the choices you make and the
              products and features you use.
            </p>
            <ul className="space-y-3">
              <li className="text-base text-gray-600 leading-relaxed">
                <span className="font-semibold">Personal Identifiers:</span> Name, email address, postal address, phone
                number, and other similar contact data.
              </li>
              <li className="text-base text-gray-600 leading-relaxed">
                <span className="font-semibold">Financial Information:</span> Bank account numbers, payment card
                details, and transaction history.
              </li>
              <li className="text-base text-gray-600 leading-relaxed">
                <span className="font-semibold">Technical Data:</span> IP address, browser type and version, time zone
                setting, and location.
              </li>
            </ul>
          </section>

          {/* Section 3: Data Sharing and Disclosure */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Data Sharing and Disclosure</h2>
            <p className="text-base text-gray-600 leading-relaxed">
              We may share your information with third party vendors, service providers, contractors, or agents who
              perform services for us or on our behalf and require access to such information to do that work. Examples
              include: payment processing, data analysis, email delivery, hosting services, customer service, and
              marketing efforts. We may allow selected third parties to use tracking technology on the Services, which
              will enable them to collect data about how you interact with our Services over time. This information may
              be used to, among other things, analyze and track data on our behalf about how we are protecting your
              information.
            </p>
          </section>

          {/* Section 4: User Rights and Choices */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">4. User Rights and Choices</h2>
            <p className="text-base text-gray-600 leading-relaxed">
              You have certain rights regarding the personal information we maintain about you. You may request access
              to, correction of, or deletion of your personal information. You also have the right to object to or
              restrict certain processing of your data. To exercise these rights, please contact us. We will respond to
              your request within a reasonable timeframe.
            </p>
          </section>

          {/* Section 5: Cookies and Tracking Technologies */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Cookies and Tracking Technologies</h2>
            <p className="text-base text-gray-600 leading-relaxed">
              We use cookies and similar tracking technologies to access or store information. Specific information
              about how we use such technologies and how you can refuse certain cookies is set out in our Cookie Policy.
              By using our service, you agree to our use of cookies.
            </p>
          </section>

          {/* Section 6: Changes to This Policy */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Changes to This Policy</h2>
            <p className="text-base text-gray-600 leading-relaxed">
              We may update this privacy policy from time to time. The updated version will be indicated by an updated
              "Last updated" date and the updated version will be effective as soon as it is accessible. We encourage
              you to review this privacy policy frequently to be informed of how we are protecting your information.
            </p>
          </section>

          {/* Section 7: Contact Information */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Contact Information</h2>
            <p className="text-base text-gray-600 leading-relaxed mb-4">
              If you have questions or comments about this policy, you may email us at{" "}
              <a href="mailto:privacy@pakpay.com" className="text-emerald-500 hover:underline">
                privacy@pakpay.com
              </a>{" "}
              or by post to:
            </p>
            <div className="text-base text-gray-600 leading-relaxed space-y-1">
              <p>PakPay Inc.</p>
              <p>123 FinTech Avenue</p>
              <p>Suite 100</p>
              <p>Innovation City, 12345</p>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
