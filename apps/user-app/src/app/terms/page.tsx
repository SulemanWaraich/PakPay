const TermsOfService = () => {
  return (
    <main className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Page Title Block */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-heading mb-2">Terms of Service</h1>
          <p className="text-body">Last updated: October 26, 2023</p>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {/* Section 1 */}
          <section>
            <h2 className="text-xl font-semibold text-heading mb-3">1. Acceptance of Terms</h2>
            <p className="text-base leading-relaxed text-body">
              By accessing or using PakPay's services, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing our services. These terms apply to all users, including visitors, registered users, and merchants.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-xl font-semibold text-heading mb-3">2. Description of Services</h2>
            <p className="text-base leading-relaxed text-body mb-4">
              PakPay provides digital payment and financial services, including but not limited to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-body">
              <li><span className="font-semibold">Mobile Wallet:</span> Store, send, and receive digital funds securely</li>
              {/* <li><span className="font-semibold">Bill Payments:</span> Pay utility bills, subscriptions, and other recurring charges</li> */}
              <li><span className="font-semibold">Money Transfers:</span> Send money domestically and internationally</li>
              <li><span className="font-semibold">Merchant Payments:</span> Make purchases at participating retailers and online stores</li>
              <li><span className="font-semibold">Financial Tools:</span> Access budgeting features and transaction history</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-xl font-semibold text-heading mb-3">3. Account Registration</h2>
            <p className="text-base leading-relaxed text-body mb-4">
              To use PakPay services, you must create an account and provide accurate, complete information. You are responsible for:
            </p>
            <ul className="list-disc list-inside space-y-2 text-body">
              <li><span className="font-semibold">Account Security:</span> Maintaining the confidentiality of your login credentials</li>
              <li><span className="font-semibold">Accurate Information:</span> Providing truthful identity and contact details</li>
              <li><span className="font-semibold">Age Requirement:</span> Being at least 18 years old or the legal age in your jurisdiction</li>
              <li><span className="font-semibold">Single Account:</span> Maintaining only one personal account per individual</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-xl font-semibold text-heading mb-3">4. User Responsibilities</h2>
            <p className="text-base leading-relaxed text-body mb-4">
              As a PakPay user, you agree to use our services lawfully and responsibly. You must not:
            </p>
            <ul className="list-disc list-inside space-y-2 text-body">
              <li>Use the service for any illegal or unauthorized purpose</li>
              <li>Attempt to gain unauthorized access to our systems or other users' accounts</li>
              <li>Transmit viruses, malware, or other harmful code</li>
              <li>Engage in fraudulent transactions or money laundering activities</li>
              <li>Violate any applicable local, national, or international laws</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-xl font-semibold text-heading mb-3">5. Fees and Charges</h2>
            <p className="text-base leading-relaxed text-body">
              PakPay may charge fees for certain services, including but not limited to transaction fees, currency conversion fees, and withdrawal fees. All applicable fees will be disclosed before you complete a transaction. We reserve the right to modify our fee structure with prior notice to users. Current fee schedules are available in the app and on our website.
            </p>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-xl font-semibold text-heading mb-3">6. Transaction Limits</h2>
            <p className="text-base leading-relaxed text-body">
              For security and regulatory compliance, PakPay imposes limits on transactions. These limits may vary based on your account verification level, transaction history, and applicable regulations. You can view your current limits within the app. We may adjust limits at our discretion to maintain platform security and comply with legal requirements.
            </p>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-xl font-semibold text-heading mb-3">7. Privacy and Data Protection</h2>
            <p className="text-base leading-relaxed text-body">
              Your privacy is important to us. Our collection, use, and protection of your personal information is governed by our Privacy Policy. By using PakPay, you consent to the collection and use of your data as described in our Privacy Policy. We implement industry-standard security measures to protect your information.
            </p>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-xl font-semibold text-heading mb-3">8. Intellectual Property</h2>
            <p className="text-base leading-relaxed text-body">
              All content, trademarks, logos, and intellectual property displayed on PakPay are owned by or licensed to us. You may not reproduce, distribute, modify, or create derivative works from any content without our express written permission. Your use of our services does not grant you any ownership rights to our intellectual property.
            </p>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className="text-xl font-semibold text-heading mb-3">9. Limitation of Liability</h2>
            <p className="text-base leading-relaxed text-body">
              To the maximum extent permitted by law, PakPay shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of our services. Our total liability for any claims shall not exceed the amount of fees paid by you in the twelve months preceding the claim.
            </p>
          </section>

          {/* Section 10 */}
          <section>
            <h2 className="text-xl font-semibold text-heading mb-3">10. Termination</h2>
            <p className="text-base leading-relaxed text-body">
              We reserve the right to suspend or terminate your account at any time for violation of these terms, suspicious activity, or at our sole discretion. Upon termination, your right to use the services will immediately cease. Any funds remaining in your account will be returned according to our standard procedures, subject to applicable laws and regulations.
            </p>
          </section>

          {/* Section 11 */}
          <section>
            <h2 className="text-xl font-semibold text-heading mb-3">11. Changes to Terms</h2>
            <p className="text-base leading-relaxed text-body">
              PakPay reserves the right to modify these Terms of Service at any time. We will notify users of significant changes via email or in-app notification. Your continued use of our services after such modifications constitutes acceptance of the updated terms. We encourage you to review these terms periodically.
            </p>
          </section>

          {/* Section 12 */}
          <section>
            <h2 className="text-xl font-semibold text-heading mb-3">12. Contact Information</h2>
            <p className="text-base leading-relaxed text-body mb-4">
              If you have any questions about these Terms of Service, please contact us:
            </p>
            <div className="text-body space-y-1">
              <p>
                <span className="font-semibold">Email:</span>{" "}
                <a href="mailto:legal@pakpay.com" className="text-link underline hover:opacity-80">
                  legal@pakpay.com
                </a>
              </p>
              <p>
                <span className="font-semibold">Address:</span>
              </p>
              <p className="pl-4">
                PakPay Financial Services<br />
                123 Finance Tower, Floor 15<br />
                Karachi, Pakistan 75500
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
};

export default TermsOfService;
