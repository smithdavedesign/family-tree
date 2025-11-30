import React from 'react';
import { Shield, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const PrivacyPolicy = () => {
    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
                <div className="bg-teal-600 px-8 py-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Shield className="w-8 h-8 text-white" />
                        <h1 className="text-2xl font-bold text-white">Privacy Policy</h1>
                    </div>
                    <Link to="/" className="text-teal-100 hover:text-white flex items-center gap-1 text-sm font-medium transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Back to Home
                    </Link>
                </div>

                <div className="p-8 space-y-6 text-gray-700">
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">1. Introduction</h2>
                        <p>
                            Roots & Branches ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our application.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">2. Information We Collect</h2>
                        <div className="space-y-3">
                            <h3 className="font-semibold text-gray-800">a. Personal Data</h3>
                            <p>
                                When you sign in with Google, we collect your email address and basic profile information (name and profile picture) to create and manage your account.
                            </p>

                            <h3 className="font-semibold text-gray-800">b. Family Tree Data</h3>
                            <p>
                                We store the family tree data you create, including names, dates, relationships, and other details of the individuals you add to your tree.
                            </p>

                            <h3 className="font-semibold text-gray-800">c. Google Photos Data</h3>
                            <p>
                                Our application integrates with Google Photos to allow you to select photos for your family tree. We access your Google Photos library <strong>only when you explicitly initiate the photo picker</strong>. We do not scan, store, or share your entire photo library. We only store the specific photos you select to attach to your family tree nodes.
                            </p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">3. How We Use Your Information</h2>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>To provide and maintain our Service.</li>
                            <li>To manage your account and authentication.</li>
                            <li>To allow you to build and visualize your family tree.</li>
                            <li>To display the photos you select from Google Photos within your family tree.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">4. Data Security</h2>
                        <p>
                            We use administrative, technical, and physical security measures to help protect your personal information. Your data is stored securely using Supabase, a trusted backend-as-a-service provider.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">5. Third-Party Services</h2>
                        <p>
                            Our Service may contain links to third-party websites or services (such as Google) that are not owned or controlled by us. We have no control over and assume no responsibility for the content, privacy policies, or practices of any third-party sites or services.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">6. Contact Us</h2>
                        <p>
                            If you have questions or comments about this Privacy Policy, please contact us at support@rootsandbranches.app.
                        </p>
                    </section>

                    <div className="pt-6 border-t text-sm text-gray-500">
                        Last updated: November 29, 2025
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
